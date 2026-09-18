const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Customer routes
router.use(protect);
router.post('/', reviewController.createReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Admin routes
router.get('/admin/all', protect, restrictTo('admin'), reviewController.adminGetReviews);
router.patch('/admin/:id/moderate', protect, restrictTo('admin'), reviewController.moderateReview);
router.delete('/admin/:id', protect, restrictTo('admin'), reviewController.adminDeleteReview);

module.exports = router;
