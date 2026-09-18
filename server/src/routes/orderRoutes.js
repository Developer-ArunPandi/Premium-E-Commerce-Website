const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

// Razorpay webhook - must be raw body, no auth
router.post('/webhook', express.raw({ type: 'application/json' }), orderController.razorpayWebhook);

// Customer routes
router.use(protect);
router.post('/create-payment', orderController.createPaymentOrder);
router.post('/confirm', orderController.confirmOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getOrder);
router.patch('/my-orders/:id/cancel', orderController.cancelOrder);
router.post('/my-orders/:id/return', orderController.requestReturn);

// Admin routes
router.use(restrictTo('admin'));
router.get('/analytics', orderController.getAnalytics);
router.get('/', orderController.adminGetOrders);
router.get('/:id', orderController.adminGetOrder);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
