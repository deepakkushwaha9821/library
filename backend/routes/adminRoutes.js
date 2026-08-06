const express = require('express');
const router = express.Router();
const { getAdminMetrics, getPendingBooks, moderateBook } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/metrics', getAdminMetrics);
router.get('/pending-books', getPendingBooks);
router.put('/moderate-book/:id', moderateBook);

module.exports = router;
