const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');

// Helper to get and validate a cart item's current product data
const validateCartItem = async (productId, variantId, quantity) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    return { valid: false, message: 'Product is not available' };
  }

  let price = product.price;
  let stock = product.stock;
  let variantName, variantValue;

  if (product.hasVariants && variantId) {
    const variant = product.variants.id(variantId);
    if (!variant || !variant.isActive) {
      return { valid: false, message: 'Product variant is not available' };
    }
    price = variant.price || product.price;
    stock = variant.stock;
    variantName = variant.name;
    variantValue = variant.value;
  }

  if (quantity > stock) {
    return { valid: false, message: `Only ${stock} items available in stock`, stock };
  }

  return {
    valid: true,
    price,
    stock,
    name: product.name,
    image: product.images?.[0]?.url,
    sku: product.sku,
    variantName,
    variantValue,
  };
};

// Get cart
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price images isActive stock hasVariants variants slug',
  });

  if (!cart) {
    cart = { items: [], subtotal: 0, itemCount: 0 };
  }

  // Sync cart items with current product data
  if (cart.items) {
    const syncedItems = [];
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        continue; // Skip unavailable products
      }

      let currentPrice = item.product.price;
      let currentStock = item.product.stock;

      if (item.product.hasVariants && item.variantId) {
        const variant = item.product.variants?.id(item.variantId);
        if (!variant || !variant.isActive) continue;
        currentPrice = variant.price || item.product.price;
        currentStock = variant.stock;
      }

      const cappedQty = Math.min(item.quantity, currentStock);
      if (cappedQty === 0) continue;

      syncedItems.push({
        ...item.toObject(),
        price: currentPrice,
        quantity: cappedQty,
        stockAvailable: currentStock,
      });
    }

    const subtotal = syncedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = syncedItems.reduce((sum, item) => sum + item.quantity, 0);

    return successResponse(res, {
      cart: {
        ...cart.toObject?.() || cart,
        items: syncedItems,
        subtotal,
        itemCount,
      },
    });
  }

  successResponse(res, { cart });
});

// Add to cart
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) return next(new AppError('Product ID is required.', 400));

  const qty = Math.max(parseInt(quantity), 1);
  const validation = await validateCartItem(productId, variantId, qty);

  if (!validation.valid) {
    return next(new AppError(validation.message, 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex((item) => {
    const productMatch = item.product.toString() === productId;
    const variantMatch = variantId ? item.variantId?.toString() === variantId : !item.variantId;
    return productMatch && variantMatch;
  });

  if (existingItemIndex >= 0) {
    const newQty = cart.items[existingItemIndex].quantity + qty;
    // Re-validate with new quantity
    const revalidation = await validateCartItem(productId, variantId, newQty);
    if (!revalidation.valid) {
      return next(new AppError(revalidation.message, 400));
    }
    cart.items[existingItemIndex].quantity = newQty;
    cart.items[existingItemIndex].price = validation.price;
  } else {
    cart.items.push({
      product: productId,
      variantId: variantId || undefined,
      variantName: validation.variantName,
      variantValue: validation.variantValue,
      quantity: qty,
      price: validation.price,
      name: validation.name,
      image: validation.image,
      sku: validation.sku,
    });
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price images isActive stock hasVariants variants slug',
  });

  successResponse(res, { cart: populated }, 'Item added to cart', 201);
});

// Update cart item quantity
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1.', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(itemId);
  if (!item) return next(new AppError('Item not found in cart.', 404));

  // Validate quantity against stock
  const validation = await validateCartItem(item.product.toString(), item.variantId?.toString(), parseInt(quantity));
  if (!validation.valid) {
    return next(new AppError(validation.message, 400));
  }

  item.quantity = parseInt(quantity);
  item.price = validation.price;
  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price images isActive stock hasVariants variants slug',
  });

  successResponse(res, { cart: populated }, 'Cart updated');
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  cart.items.pull({ _id: itemId });
  await cart.save();

  successResponse(res, { cart }, 'Item removed from cart');
});

// Clear cart
exports.clearCart = catchAsync(async (req, res, next) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], couponCode: null, couponDiscount: 0 });
  successResponse(res, { cart: { items: [], subtotal: 0, itemCount: 0 } }, 'Cart cleared');
});

// Apply coupon
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;
  const Coupon = require('../models/Coupon');

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) return next(new AppError('Invalid coupon code.', 400));

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const validation = coupon.isValid(req.user.id, subtotal);

  if (!validation.valid) {
    return next(new AppError(validation.message, 400));
  }

  const discount = coupon.calculateDiscount(subtotal);
  cart.couponCode = coupon.code;
  cart.couponDiscount = Math.round(discount * 100) / 100;
  await cart.save();

  successResponse(res, { cart, discount: cart.couponDiscount, coupon: coupon.code }, 'Coupon applied successfully');
});

// Remove coupon
exports.removeCoupon = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $unset: { couponCode: 1 }, couponDiscount: 0 },
    { new: true }
  );
  successResponse(res, { cart }, 'Coupon removed');
});
