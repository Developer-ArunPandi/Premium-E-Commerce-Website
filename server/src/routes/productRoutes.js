const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (static paths first, before dynamic /:identifier)
router.get('/featured', productController.getFeaturedProducts);
router.get('/brands', productController.getBrands);

// Admin routes (must be before /:identifier to avoid being caught)
router.get('/admin/all', protect, restrictTo('admin'), productController.adminGetProducts);
router.post('/', protect, restrictTo('admin'), upload.array('images', 10), productController.createProduct);

// Dynamic public route
router.get('/', productController.getProducts);
router.get('/:identifier', productController.getProduct);

// Admin routes with dynamic IDs
router.patch('/:id/toggle', protect, restrictTo('admin'), productController.toggleProductStatus);
router.delete('/:id/images', protect, restrictTo('admin'), productController.deleteProductImage);
router.patch('/:id', protect, restrictTo('admin'), upload.array('images', 10), productController.updateProduct);
router.delete('/:id', protect, restrictTo('admin'), productController.deleteProduct);

module.exports = router;
