const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number }, // max discount for percentage type
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number }, // total usage limit
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 1 },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validUntil: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function (userId, orderSubtotal) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon is not yet valid' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usageCount >= this.usageLimit)
    return { valid: false, message: 'Coupon usage limit reached' };
  if (orderSubtotal < this.minOrderValue)
    return {
      valid: false,
      message: `Minimum order value of ₹${this.minOrderValue} required`,
    };

  const userUsage = this.usedBy.find((u) => u.user.toString() === userId.toString());
  if (userUsage && userUsage.count >= this.perUserLimit) {
    return { valid: false, message: 'You have already used this coupon the maximum number of times' };
  }

  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (this.type === 'percentage') {
    const discount = (subtotal * this.value) / 100;
    return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
  }
  return Math.min(this.value, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
