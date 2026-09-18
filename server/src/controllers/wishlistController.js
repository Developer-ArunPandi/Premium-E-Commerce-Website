const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');

// Get wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price compareAtPrice images averageRating reviewCount isActive stock hasVariants variants slug brand',
    populate: [
      { path: 'category', select: 'name slug' },
    ],
  });

  if (!wishlist) {
    return successResponse(res, { wishlist: { items: [] } });
  }

  // Filter out inactive products
  wishlist.items = wishlist.items.filter((item) => item.product && item.product.isActive);

  successResponse(res, { wishlist });
});

// Add to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found.', 404));
  }

  let wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user.id, items: [] });
  }

  // Check if already in wishlist
  const exists = wishlist.items.some((item) => item.product.toString() === productId);
  if (exists) {
    return successResponse(res, { wishlist }, 'Product already in wishlist');
  }

  wishlist.items.push({ product: productId });
  await wishlist.save();

  successResponse(res, { wishlist }, 'Added to wishlist', 201);
});

// Remove from wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) return next(new AppError('Wishlist not found.', 404));

  wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId);
  await wishlist.save();

  successResponse(res, { wishlist }, 'Removed from wishlist');
});

// Check if product is in wishlist
exports.checkWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });
  const inWishlist = wishlist ? wishlist.items.some((item) => item.product.toString() === productId) : false;

  successResponse(res, { inWishlist });
});

// Move to cart
exports.moveToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  const Cart = require('../models/Cart');

  // Add to cart
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found.', 404));
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  const exists = cart.items.find((item) => item.product.toString() === productId);
  if (!exists) {
    if (product.stock < 1 && !product.hasVariants) {
      return next(new AppError('Product is out of stock.', 400));
    }
    cart.items.push({
      product: productId,
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.images?.[0]?.url,
    });
    await cart.save();
  }

  // Remove from wishlist
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (wishlist) {
    wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId);
    await wishlist.save();
  }

  successResponse(res, { cart }, 'Moved to cart');
});
