const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginatedResponse } = require('../utils/response');
const { sendOrderConfirmationEmail } = require('../utils/email');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `SS-${timestamp}-${random}`;
};

// Calculate shipping cost (simple logic)
const calculateShipping = (subtotal) => {
  if (subtotal >= 999) return 0; // Free shipping above ₹999
  return 49; // Flat ₹49 shipping
};

// Calculate tax (18% GST on subtotal after discount)
const calculateTax = (subtotal) => {
  return Math.round(subtotal * 0.18 * 100) / 100; // Removed tax for simplicity, can be re-enabled
};

// Helper to validate and build order from cart
const validateAndBuildOrder = async (userId, addressData, couponCode) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price images isActive stock hasVariants variants sku',
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty.', 400);
  }

  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    if (!product || !product.isActive) {
      throw new AppError(`Product "${cartItem.name}" is no longer available.`, 400);
    }

    let price = product.price;
    let stock = product.stock;

    if (product.hasVariants && cartItem.variantId) {
      const variant = product.variants.id(cartItem.variantId);
      if (!variant || !variant.isActive) {
        throw new AppError(`Variant of "${product.name}" is no longer available.`, 400);
      }
      price = variant.price || product.price;
      stock = variant.stock;
    }

    if (cartItem.quantity > stock) {
      throw new AppError(
        `Only ${stock} units of "${product.name}" available. Please update your cart.`,
        400
      );
    }

    const total = price * cartItem.quantity;
    subtotal += total;

    orderItems.push({
      product: product._id,
      variantId: cartItem.variantId,
      variantName: cartItem.variantName,
      variantValue: cartItem.variantValue,
      name: product.name,
      image: product.images?.[0]?.url,
      sku: cartItem.sku,
      price,
      quantity: cartItem.quantity,
      total,
    });
  }

  // Apply coupon
  let couponDiscount = 0;
  let couponDoc = null;

  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!couponDoc) throw new AppError('Invalid coupon code.', 400);

    const couponValidation = couponDoc.isValid(userId, subtotal);
    if (!couponValidation.valid) throw new AppError(couponValidation.message, 400);

    couponDiscount = couponDoc.calculateDiscount(subtotal);
    couponDiscount = Math.round(couponDiscount * 100) / 100;
  }

  const discountedSubtotal = subtotal - couponDiscount;
  const shippingCost = calculateShipping(discountedSubtotal);
  const total = Math.max(discountedSubtotal + shippingCost, 0);

  return {
    orderItems,
    subtotal,
    couponDiscount,
    couponDoc,
    shippingCost,
    taxAmount: 0,
    total,
    cart,
  };
};

// Create Razorpay payment order
exports.createPaymentOrder = catchAsync(async (req, res, next) => {
  const { addressId, couponCode } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError('User not found.', 404));

  // Get address
  let shippingAddress;
  if (addressId) {
    const addr = user.addresses.id(addressId);
    if (!addr) return next(new AppError('Address not found.', 404));
    shippingAddress = addr.toObject();
  } else if (req.body.address) {
    shippingAddress = req.body.address;
  } else {
    return next(new AppError('Shipping address is required.', 400));
  }

  const { total, subtotal, couponDiscount, shippingCost, orderItems } = await validateAndBuildOrder(
    req.user.id,
    shippingAddress,
    couponCode
  );

  // Create Razorpay order
  let razorpayOrder;
  try {
    const razorpay = getRazorpayInstance();
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return next(new AppError('Payment initialization failed. Please try again.', 500));
  }

  successResponse(res, {
    razorpayOrderId: razorpayOrder.id,
    amount: total,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    orderSummary: {
      subtotal,
      couponDiscount,
      shippingCost,
      total,
      itemCount: orderItems.length,
    },
  });
});

// Confirm order after payment
exports.confirmOrder = catchAsync(async (req, res, next) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    addressId,
    couponCode,
    address,
    paymentMethod = 'razorpay',
  } = req.body;

  const user = await User.findById(req.user.id);

  // Get address
  let shippingAddress;
  if (addressId) {
    const addr = user.addresses.id(addressId);
    if (!addr) return next(new AppError('Address not found.', 404));
    shippingAddress = {
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    };
  } else if (address) {
    shippingAddress = address;
  } else {
    return next(new AppError('Shipping address is required.', 400));
  }

  // Verify Razorpay signature
  if (paymentMethod === 'razorpay') {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return next(new AppError('Payment verification data is incomplete.', 400));
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return next(new AppError('Payment verification failed. Please contact support.', 400));
    }

    // Check duplicate payment
    const existingOrder = await Order.findOne({ razorpayPaymentId });
    if (existingOrder) {
      return successResponse(res, { order: existingOrder }, 'Order already processed');
    }
  }

  // Re-validate cart and calculate totals
  const { orderItems, subtotal, couponDiscount, couponDoc, shippingCost, taxAmount, total, cart } =
    await validateAndBuildOrder(req.user.id, shippingAddress, couponCode);

  // Create order
  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user.id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    subtotal,
    couponDiscount,
    couponCode: couponCode?.toUpperCase(),
    coupon: couponDoc?._id,
    shippingCost,
    taxAmount,
    total,
    status: paymentMethod === 'cod' ? 'confirmed' : 'confirmed',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    timeline: [
      {
        status: 'pending',
        message: 'Order placed successfully',
        timestamp: new Date(),
      },
      {
        status: 'confirmed',
        message: paymentMethod === 'cod' ? 'Order confirmed - COD' : 'Payment received and order confirmed',
        timestamp: new Date(),
      },
    ],
  });

  // Deduct stock atomically
  for (const item of orderItems) {
    if (item.variantId) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'variants._id': item.variantId },
        { $inc: { 'variants.$.stock': -item.quantity, soldCount: item.quantity } }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }
  }

  // Update coupon usage
  if (couponDoc) {
    couponDoc.usageCount += 1;
    const userUsageIndex = couponDoc.usedBy.findIndex((u) => u.user.toString() === req.user.id.toString());
    if (userUsageIndex >= 0) {
      couponDoc.usedBy[userUsageIndex].count += 1;
    } else {
      couponDoc.usedBy.push({ user: req.user.id, count: 1 });
    }
    await couponDoc.save();
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], couponCode: null, couponDiscount: 0 });

  // Create notification
  await Notification.create({
    user: req.user.id,
    title: 'Order Placed Successfully! 🎉',
    message: `Your order #${orderNumber} has been placed and confirmed.`,
    type: 'order',
    data: { orderId: order._id, orderNumber },
    link: `/account/orders/${order._id}`,
  });

  // Send confirmation email (non-blocking)
  sendOrderConfirmationEmail(user, order).catch((err) => console.error('Email error:', err));

  successResponse(res, { order }, 'Order placed successfully', 201);
});

// Get customer orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: req.user.id };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Order.countDocuments(filter),
  ]);

  paginatedResponse(res, { orders }, pageNum, limitNum, total);
});

// Get single order
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) return next(new AppError('Order not found.', 404));
  successResponse(res, { order });
});

// Cancel order
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });

  if (!order) return next(new AppError('Order not found.', 404));

  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    return next(new AppError(`Order cannot be cancelled in "${order.status}" status.`, 400));
  }

  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.timeline.push({
    status: 'cancelled',
    message: `Order cancelled by customer. Reason: ${reason || 'Not specified'}`,
    timestamp: new Date(),
  });

  // Restore stock
  for (const item of order.items) {
    if (item.variantId) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'variants._id': item.variantId },
        { $inc: { 'variants.$.stock': item.quantity, soldCount: -item.quantity } }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      });
    }
  }

  // Handle refund for paid orders
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    order.refundAmount = order.total;
    order.refundDate = new Date();
    // In production, initiate actual Razorpay refund here
  }

  await order.save();

  // Notification
  await Notification.create({
    user: req.user.id,
    title: 'Order Cancelled',
    message: `Your order #${order.orderNumber} has been cancelled.`,
    type: 'cancellation',
    data: { orderId: order._id },
  });

  successResponse(res, { order }, 'Order cancelled successfully');
});

// Request return
exports.requestReturn = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });

  if (!order) return next(new AppError('Order not found.', 404));
  if (order.status !== 'delivered') {
    return next(new AppError('Only delivered orders can be returned.', 400));
  }

  const deliveredDate = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = (Date.now() - deliveredDate) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 30) {
    return next(new AppError('Return window of 30 days has passed.', 400));
  }

  order.status = 'return_requested';
  order.returnReason = reason;
  order.timeline.push({
    status: 'return_requested',
    message: `Return requested. Reason: ${reason}`,
    timestamp: new Date(),
  });

  await order.save();

  await Notification.create({
    user: req.user.id,
    title: 'Return Request Submitted',
    message: `Your return request for order #${order.orderNumber} has been submitted.`,
    type: 'return',
    data: { orderId: order._id },
  });

  successResponse(res, { order }, 'Return request submitted successfully');
});

// ADMIN: Get all orders
exports.adminGetOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, paymentStatus, search, sort = '-createdAt' } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) filter.orderNumber = { $regex: search, $options: 'i' };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  paginatedResponse(res, { orders }, pageNum, limitNum, total);
});

// ADMIN: Get single order
exports.adminGetOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
  if (!order) return next(new AppError('Order not found.', 404));
  successResponse(res, { order });
});

// ADMIN: Update order status
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, message, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('Order not found.', 404));

  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: ['return_requested'],
    return_requested: ['returned', 'delivered'],
    returned: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return next(new AppError(`Cannot transition order from "${order.status}" to "${status}".`, 400));
  }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }
  if (status === 'shipped') order.shippedAt = new Date();
  if (status === 'refunded') {
    order.paymentStatus = 'refunded';
    order.refundAmount = order.total;
    order.refundDate = new Date();
  }

  order.timeline.push({
    status,
    message: message || `Order status updated to ${status}`,
    timestamp: new Date(),
    updatedBy: req.user.id,
  });

  await order.save();

  // Notify customer
  const notificationMessages = {
    confirmed: 'Your order has been confirmed!',
    processing: 'Your order is being processed.',
    shipped: `Your order has been shipped.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
    out_for_delivery: 'Your order is out for delivery!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
    returned: 'Your return has been accepted.',
    refunded: `Your refund of ₹${order.total} has been processed.`,
  };

  if (notificationMessages[status]) {
    await Notification.create({
      user: order.user,
      title: `Order #${order.orderNumber} Update`,
      message: notificationMessages[status],
      type: status === 'delivered' ? 'delivery' : status === 'shipped' ? 'shipping' : 'order',
      data: { orderId: order._id, orderNumber: order.orderNumber },
      link: `/account/orders/${order._id}`,
    });
  }

  successResponse(res, { order }, 'Order status updated successfully');
});

// Razorpay webhook handler
exports.razorpayWebhook = catchAsync(async (req, res, next) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!webhookSecret || !signature) {
    return res.status(200).json({ received: true });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case 'payment.captured':
        await Order.findOneAndUpdate(
          { razorpayOrderId: payload.payment.entity.order_id },
          { paymentStatus: 'paid' }
        );
        break;
      case 'payment.failed':
        await Order.findOneAndUpdate(
          { razorpayOrderId: payload.payment.entity.order_id },
          { paymentStatus: 'failed', status: 'cancelled' }
        );
        break;
      case 'refund.processed':
        await Order.findOneAndUpdate(
          { razorpayPaymentId: payload.refund.entity.payment_id },
          { paymentStatus: 'refunded' }
        );
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.status(200).json({ received: true });
});

// Get analytics for admin dashboard
exports.getAnalytics = catchAsync(async (req, res, next) => {
  const { period = '30' } = req.query;
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    ordersByStatus,
    salesByDay,
    topProducts,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startDate } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
    Product.countDocuments({ isActive: true }),
    Order.find().sort('-createdAt').limit(5).populate('user', 'firstName lastName email'),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ isActive: true }).sort('-soldCount').limit(5).select('name soldCount price images'),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select('name stock price images').limit(10),
  ]);

  const totalRevenueValue = totalRevenue[0]?.total || 0;
  const allTimeRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const allTimeOrders = await Order.countDocuments();
  const allTimeCustomers = await User.countDocuments({ role: 'customer' });

  successResponse(res, {
    summary: {
      revenue: totalRevenueValue,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      allTimeRevenue: allTimeRevenue[0]?.total || 0,
      allTimeOrders,
      allTimeCustomers,
    },
    recentOrders,
    ordersByStatus,
    salesByDay,
    topProducts,
    lowStockProducts,
  });
});
