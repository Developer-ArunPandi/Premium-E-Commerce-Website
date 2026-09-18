const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/auth');

// Customer route to validate
router.post('/validate', protect, couponController.validateCoupon);

// Admin routes
router.use(protect, restrictTo('admin'));
router.get('/', couponController.getCoupons);
router.post('/', couponController.createCoupon);
router.patch('/:id', couponController.updateCoupon);
router.patch('/:id/toggle', couponController.toggleCouponStatus);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
