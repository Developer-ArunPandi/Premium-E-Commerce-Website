const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'payment', 'shipping', 'delivery', 'cancellation', 'return', 'refund', 'system', 'promotion'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed }, // Extra data like orderId, etc.
    link: { type: String }, // Frontend link to navigate to
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
