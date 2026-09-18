const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:identifier', categoryController.getCategory);

// Admin routes
router.use(protect, restrictTo('admin'));
router.get('/admin/all', categoryController.adminGetCategories);
router.post('/', upload.single('image'), categoryController.createCategory);
router.patch('/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
