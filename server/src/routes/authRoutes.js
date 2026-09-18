const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.patch('/change-password', authController.changePassword);

// Address routes
router.get('/addresses', authController.getAddresses);
router.post('/addresses', authController.addAddress);
router.patch('/addresses/:addressId', authController.updateAddress);
router.delete('/addresses/:addressId', authController.deleteAddress);
router.patch('/addresses/:addressId/set-default', authController.setDefaultAddress);

module.exports = router;
