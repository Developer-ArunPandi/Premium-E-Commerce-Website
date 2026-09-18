const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  variantName: { type: String },
  variantValue: { type: String },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true }, // snapshot at time of adding
  name: { type: String, required: true },
  image: { type: String },
  sku: { type: String },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 });

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Virtual for total items count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
