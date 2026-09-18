const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const slugify = require('slugify');

const uploadToCloudinary = async (buffer, folder = 'shopsphere/categories') => {
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

// Get all categories (public - active only, with subcategories)
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug image',
    })
    .sort('sortOrder name')
    .select('-__v');

  successResponse(res, { categories });
});

// Get single category
exports.getCategory = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;
  let category;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    category = await Category.findById(identifier).populate('subcategories');
  } else {
    category = await Category.findOne({ slug: identifier }).populate('subcategories');
  }

  if (!category) return next(new AppError('Category not found.', 404));

  successResponse(res, { category });
});

// ADMIN: Get all categories
exports.adminGetCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({})
    .populate({
      path: 'subcategories',
      select: 'name slug isActive',
    })
    .sort('sortOrder name');

  successResponse(res, { categories });
});

// ADMIN: Create category
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, parent, isActive, sortOrder } = req.body;

  let slug = slugify(name, { lower: true, strict: true });
  const slugExists = await Category.findOne({ slug });
  if (slugExists) slug = `${slug}-${Date.now()}`;

  let image, imagePublicId;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer);
      image = result.secure_url;
      imagePublicId = result.public_id;
    } catch (err) {
      console.error('Category image upload failed:', err.message);
    }
  }

  const category = await Category.create({
    name,
    slug,
    description,
    image,
    imagePublicId,
    parent: parent || null,
    isActive: isActive !== 'false',
    sortOrder: parseInt(sortOrder) || 0,
  });

  successResponse(res, { category }, 'Category created successfully', 201);
});

// ADMIN: Update category
exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  if (req.body.name && req.body.name !== category.name) {
    let slug = slugify(req.body.name, { lower: true, strict: true });
    const slugExists = await Category.findOne({ slug, _id: { $ne: category._id } });
    if (slugExists) slug = `${slug}-${Date.now()}`;
    req.body.slug = slug;
  }

  if (req.file) {
    try {
      // Delete old image
      if (category.imagePublicId) {
        await cloudinary.uploader.destroy(category.imagePublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer);
      req.body.image = result.secure_url;
      req.body.imagePublicId = result.public_id;
    } catch (err) {
      console.error('Category image update failed:', err.message);
    }
  }

  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  successResponse(res, { category: updated }, 'Category updated successfully');
});

// ADMIN: Delete category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  // Check for products or subcategories
  const productCount = await Product.countDocuments({ $or: [{ category: category._id }, { subcategory: category._id }] });
  const subcategoryCount = await Category.countDocuments({ parent: category._id });

  if (productCount > 0) {
    return next(new AppError(`Cannot delete category with ${productCount} products. Please reassign products first.`, 400));
  }

  if (subcategoryCount > 0) {
    return next(new AppError(`Cannot delete category with ${subcategoryCount} subcategories. Please delete them first.`, 400));
  }

  if (category.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(category.imagePublicId);
    } catch (err) {
      console.error('Category image delete failed:', err.message);
    }
  }

  await category.deleteOne();
  successResponse(res, null, 'Category deleted successfully');
});
