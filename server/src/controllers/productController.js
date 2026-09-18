const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse, paginatedResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const slugify = require('slugify');

// Helper to upload image to Cloudinary
const uploadToCloudinary = async (buffer, folder = 'shopsphere/products') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Get all products with filters, search, sort, pagination
exports.getProducts = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    sort = '-createdAt',
    availability,
    featured,
    newArrival,
    bestSeller,
    tags,
  } = req.query;

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }

  if (category) {
    // Find category by slug or id
    let cat;
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      cat = await Category.findById(category);
    } else {
      cat = await Category.findOne({ slug: category });
    }
    if (cat) {
      // Include subcategories
      const subcats = await Category.find({ parent: cat._id });
      const catIds = [cat._id, ...subcats.map((s) => s._id)];
      filter.$or = [{ category: { $in: catIds } }, { subcategory: { $in: catIds } }];
    }
  }

  if (subcategory) {
    let subcat;
    if (subcategory.match(/^[0-9a-fA-F]{24}$/)) {
      subcat = await Category.findById(subcategory);
    } else {
      subcat = await Category.findOne({ slug: subcategory });
    }
    if (subcat) {
      filter.subcategory = subcat._id;
    }
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (minRating) {
    filter.averageRating = { $gte: parseFloat(minRating) };
  }

  if (availability === 'in_stock') {
    filter.stock = { $gt: 0 };
  }

  if (featured === 'true') filter.isFeatured = true;
  if (newArrival === 'true') filter.isNewArrival = true;
  if (bestSeller === 'true') filter.isBestSeller = true;

  if (tags) {
    const tagArray = tags.split(',').map((t) => t.trim().toLowerCase());
    filter.tags = { $in: tagArray };
  }

  // Build sort
  let sortObj = {};
  switch (sort) {
    case 'price_asc':
      sortObj = { price: 1 };
      break;
    case 'price_desc':
      sortObj = { price: -1 };
      break;
    case 'rating':
      sortObj = { averageRating: -1 };
      break;
    case 'popularity':
      sortObj = { soldCount: -1 };
      break;
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    default:
      if (search) {
        sortObj = { score: { $meta: 'textScore' } };
      } else {
        sortObj = { createdAt: -1 };
      }
  }

  let query = Product.find(filter)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .select('-__v');

  if (search && sort !== 'price_asc' && sort !== 'price_desc') {
    query = query.select({ score: { $meta: 'textScore' } });
  }

  query = query.sort(sortObj).skip(skip).limit(limitNum);

  const [products, total] = await Promise.all([query, Product.countDocuments(filter)]);

  paginatedResponse(res, { products }, pageNum, limitNum, total);
});

// Get single product by slug or ID
exports.getProduct = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;
  let product;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(identifier)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
  } else {
    product = await Product.findOne({ slug: identifier, isActive: true })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
  }

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  successResponse(res, { product });
});

// Get featured products
exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limit)
    .select('-__v');
  successResponse(res, { products });
});

// Get product brands
exports.getBrands = catchAsync(async (req, res, next) => {
  const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: null, $ne: '' } });
  successResponse(res, { brands: brands.sort() });
});

// ADMIN: Create product
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    shortDescription,
    sku,
    category,
    subcategory,
    brand,
    price,
    compareAtPrice,
    discountPercent,
    variants,
    hasVariants,
    stock,
    lowStockThreshold,
    specifications,
    tags,
    isFeatured,
    isNewArrival,
    isBestSeller,
    shippingInfo,
    returnPolicy,
    metaTitle,
    metaDescription,
  } = req.body;

  // Generate slug
  let slug = slugify(name, { lower: true, strict: true });
  let slugExists = await Product.findOne({ slug });
  if (slugExists) {
    slug = `${slug}-${Date.now()}`;
  }

  // Handle images - support both file uploads and URL arrays in body
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer);
        images.push({ url: result.secure_url, publicId: result.public_id, alt: name });
      } catch (err) {
        console.error('Image upload failed:', err.message);
      }
    }
  } else if (req.body.images) {
    // Accept images as JSON array from body (for URL-based image input)
    const bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
    images = Array.isArray(bodyImages) ? bodyImages : [];
  }

  // Parse JSON fields if they come as strings
  const parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : [];
  const parsedSpecs = specifications
    ? typeof specifications === 'string'
      ? JSON.parse(specifications)
      : specifications
    : [];
  const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
  const parsedShipping = shippingInfo
    ? typeof shippingInfo === 'string'
      ? JSON.parse(shippingInfo)
      : shippingInfo
    : {};

  const product = await Product.create({
    name,
    slug,
    description,
    shortDescription,
    sku,
    images,
    category,
    subcategory: subcategory || undefined,
    brand,
    price: parseFloat(price),
    compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
    discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
    variants: parsedVariants,
    hasVariants: hasVariants === 'true' || hasVariants === true,
    stock: parseInt(stock) || 0,
    lowStockThreshold: parseInt(lowStockThreshold) || 5,
    specifications: parsedSpecs,
    tags: parsedTags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isNewArrival: isNewArrival === 'true' || isNewArrival === true,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
    shippingInfo: parsedShipping,
    returnPolicy,
    metaTitle,
    metaDescription,
  });

  const populated = await Product.findById(product._id)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

  successResponse(res, { product: populated }, 'Product created successfully', 201);
});

// ADMIN: Update product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  // Handle name change - update slug
  if (req.body.name && req.body.name !== product.name) {
    let slug = slugify(req.body.name, { lower: true, strict: true });
    const slugExists = await Product.findOne({ slug, _id: { $ne: product._id } });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }
    req.body.slug = slug;
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = [];
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer);
        newImages.push({ url: result.secure_url, publicId: result.public_id, alt: req.body.name || product.name });
      } catch (err) {
        console.error('Image upload failed:', err.message);
      }
    }
    req.body.images = [...(product.images || []), ...newImages];
  }

  // Parse JSON fields
  ['variants', 'specifications', 'tags', 'shippingInfo'].forEach((field) => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        delete req.body[field];
      }
    }
  });

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

  successResponse(res, { product: updated }, 'Product updated successfully');
});

// ADMIN: Delete product image
exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  const { publicId } = req.body;
  if (!publicId) return next(new AppError('Image public ID is required.', 400));

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }

  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  successResponse(res, { product }, 'Image deleted successfully');
});

// ADMIN: Delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  // Soft delete (deactivate instead of hard delete)
  product.isActive = false;
  await product.save();

  successResponse(res, null, 'Product deleted successfully');
});

// ADMIN: Toggle product status
exports.toggleProductStatus = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  product.isActive = !product.isActive;
  await product.save();

  successResponse(res, { product }, `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`);
});

// ADMIN: Get all products (including inactive)
exports.adminGetProducts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, category, isActive, sort = '-createdAt' } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const sortObj = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Product.countDocuments(filter),
  ]);

  paginatedResponse(res, { products }, pageNum, limitNum, total);
});
