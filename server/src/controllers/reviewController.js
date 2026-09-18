const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginatedResponse } = require('../utils/response');

// Get reviews for a product
exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip = (pageNum - 1) * limitNum;

  const filter = { product: productId, isApproved: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Review.countDocuments(filter),
  ]);

  // Rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: filter },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  paginatedResponse(res, { reviews, ratingDistribution }, pageNum, limitNum, total);
});

// Create review
exports.createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, title, body, orderId } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found.', 404));

  // Check if already reviewed
  const existingReview = await Review.findOne({ product: productId, user: req.user.id });
  if (existingReview) {
    return next(new AppError('You have already reviewed this product.', 400));
  }

  // Check if verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      'items.product': productId,
      status: 'delivered',
    });
    if (order) isVerifiedPurchase = true;
  } else {
    // Check any delivered order with this product
    const order = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      status: 'delivered',
    });
    if (order) isVerifiedPurchase = true;
  }

  const review = await Review.create({
    product: productId,
    user: req.user.id,
    order: orderId,
    rating: parseInt(rating),
    title,
    body,
    isVerifiedPurchase,
  });

  const populated = await Review.findById(review._id).populate('user', 'firstName lastName avatar');

  successResponse(res, { review: populated }, 'Review submitted successfully', 201);
});

// Update review
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
  if (!review) return next(new AppError('Review not found.', 404));

  const { rating, title, body } = req.body;
  if (rating) review.rating = parseInt(rating);
  if (title) review.title = title;
  if (body) review.body = body;

  await review.save();
  await Review.calcAverageRatings(review.product);

  const populated = await Review.findById(review._id).populate('user', 'firstName lastName avatar');
  successResponse(res, { review: populated }, 'Review updated successfully');
});

// Delete review (customer's own)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
  if (!review) return next(new AppError('Review not found.', 404));

  const productId = review.product;
  await review.deleteOne();
  await Review.calcAverageRatings(productId);

  successResponse(res, null, 'Review deleted successfully');
});

// Get my reviews
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id })
    .populate('product', 'name images slug')
    .sort('-createdAt');
  successResponse(res, { reviews });
});

// ADMIN: Get all reviews
exports.adminGetReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, isApproved } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  paginatedResponse(res, { reviews }, pageNum, limitNum, total);
});

// ADMIN: Approve/hide review
exports.moderateReview = catchAsync(async (req, res, next) => {
  const { isApproved } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
  if (!review) return next(new AppError('Review not found.', 404));

  await Review.calcAverageRatings(review.product);
  successResponse(res, { review }, `Review ${isApproved ? 'approved' : 'hidden'} successfully`);
});

// ADMIN: Delete review
exports.adminDeleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const productId = review.product;
  await review.deleteOne();
  await Review.calcAverageRatings(productId);

  successResponse(res, null, 'Review deleted successfully');
});
