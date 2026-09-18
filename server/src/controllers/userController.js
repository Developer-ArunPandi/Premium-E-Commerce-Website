const User = require('../models/User');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginatedResponse } = require('../utils/response');

// ADMIN: Get all customers
exports.getCustomers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = { role: 'customer' };
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [customers, total] = await Promise.all([
    User.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .select('-password -passwordResetToken -emailVerificationToken'),
    User.countDocuments(filter),
  ]);

  paginatedResponse(res, { customers }, pageNum, limitNum, total);
});

// ADMIN: Get single customer
exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select(
    '-password -passwordResetToken -emailVerificationToken'
  );
  if (!customer) return next(new AppError('Customer not found.', 404));

  // Get order stats
  const orderStats = await Order.aggregate([
    { $match: { user: customer._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
      },
    },
  ]);

  const recentOrders = await Order.find({ user: customer._id }).sort('-createdAt').limit(5);

  successResponse(res, {
    customer,
    stats: orderStats[0] || { totalOrders: 0, totalSpent: 0 },
    recentOrders,
  });
});

// ADMIN: Toggle customer status
exports.toggleCustomerStatus = catchAsync(async (req, res, next) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!customer) return next(new AppError('Customer not found.', 404));

  customer.isActive = !customer.isActive;
  await customer.save({ validateBeforeSave: false });

  successResponse(res, { customer }, `Customer account ${customer.isActive ? 'activated' : 'deactivated'}`);
});

// Get notifications
exports.getNotifications = catchAsync(async (req, res, next) => {
  const Notification = require('../models/Notification');
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments({ user: req.user.id }),
    Notification.countDocuments({ user: req.user.id, isRead: false }),
  ]);

  paginatedResponse(res, { notifications, unreadCount }, pageNum, limitNum, total);
});

// Mark notification as read
exports.markNotificationRead = catchAsync(async (req, res, next) => {
  const Notification = require('../models/Notification');
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isRead: true });
  successResponse(res, null, 'Notification marked as read');
});

// Mark all notifications as read
exports.markAllNotificationsRead = catchAsync(async (req, res, next) => {
  const Notification = require('../models/Notification');
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  successResponse(res, null, 'All notifications marked as read');
});
