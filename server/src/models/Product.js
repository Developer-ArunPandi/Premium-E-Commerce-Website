const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size", "Color"
  value: { type: String, required: true }, // e.g. "XL", "Red"
  sku: { type: String, trim: true },
  price: { type: Number, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
});

const specificationSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
});

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  alt: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: [true, 'Product description is required'] },
    shortDescription: { type: String, trim: true },
    sku: { type: String, trim: true, unique: true, sparse: true },
    images: [imageSchema],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String, trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    compareAtPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    variants: [variantSchema],
    hasVariants: { type: Boolean, default: false },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    specifications: [specificationSchema],
    tags: [{ type: String, trim: true, lowercase: true }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    shippingInfo: {
      weight: { type: Number },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      freeShipping: { type: Boolean, default: false },
      shippingTime: { type: String, default: '3-7 business days' },
    },
    returnPolicy: { type: String, default: '30 days return policy' },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

// Virtual for discount price
productSchema.virtual('discountedPrice').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return this.price;
  }
  if (this.discountPercent > 0) {
    return Math.round(this.price * (1 - this.discountPercent / 100));
  }
  return this.price;
});

// Virtual for actual discount
productSchema.virtual('actualDiscount').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return this.discountPercent || 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.hasVariants) {
    const totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
    if (totalStock === 0) return 'out_of_stock';
    if (totalStock <= this.lowStockThreshold) return 'low_stock';
    return 'in_stock';
  }
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

module.exports = mongoose.model('Product', productSchema);
