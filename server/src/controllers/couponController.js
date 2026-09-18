const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginatedResponse } = require('../utils/response');

// Validate coupon (public - for cart)
exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { code, orderSubtotal } = req.body;

  if (!code) return next(new AppError('Coupon code is required.', 400));

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) return next(new AppError('Invalid coupon code.', 400));

  const validation = coupon.isValid(req.user.id, parseFloat(orderSubtotal) || 0);
  if (!validation.valid) return next(new AppError(validation.message, 400));

  const discount = coupon.calculateDiscount(parseFloat(orderSubtotal) || 0);

  successResponse(res, {
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
    },
    discount: Math.round(discount * 100) / 100,
  });
});

// ADMIN: Get all coupons
exports.getCoupons = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const [coupons, total] = await Promise.all([
    Coupon.find().sort('-createdAt').skip(skip).limit(limitNum).select('-usedBy'),
    Coupon.countDocuments(),
  ]);

  paginatedResponse(res, { coupons }, pageNum, limitNum, total);
});

// ADMIN: Create coupon
exports.createCoupon = catchAsync(async (req, res, next) => {
  const {
    code, description, type, value, maxDiscount, minOrderValue,
    usageLimit, perUserLimit, validFrom, validUntil, isActive,
  } = req.body;

  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) return next(new AppError('Coupon code already exists.', 400));

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    type,
    value: parseFloat(value),
    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
    minOrderValue: parseFloat(minOrderValue) || 0,
    usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
    perUserLimit: parseInt(perUserLimit) || 1,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    isActive: isActive !== false,
  });

  successResponse(res, { coupon }, 'Coupon created successfully', 201);
});

// ADMIN: Update coupon
exports.updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  successResponse(res, { coupon }, 'Coupon updated successfully');
});

// ADMIN: Delete coupon
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  successResponse(res, null, 'Coupon deleted successfully');
});

// ADMIN: Toggle coupon status
exports.toggleCouponStatus = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  successResponse(res, { coupon }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`);
});
