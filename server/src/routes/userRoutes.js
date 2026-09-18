const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Notification routes (customer)
router.use(protect);
router.get('/notifications', userController.getNotifications);
router.patch('/notifications/:id/read', userController.markNotificationRead);
router.patch('/notifications/read-all', userController.markAllNotificationsRead);

// Admin customer management
router.use(restrictTo('admin'));
router.get('/customers', userController.getCustomers);
router.get('/customers/:id', userController.getCustomer);
router.patch('/customers/:id/toggle', userController.toggleCustomerStatus);

module.exports = router;
