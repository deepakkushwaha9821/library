const express = require('express');
const router = express.Router();
const { getBooks, getBookById, createBook, getSellerBooks } = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getBooks);
router.get('/seller/my-books', protect, authorize('seller', 'admin'), getSellerBooks);
router.get('/:id', getBookById);

router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'ebookFile', maxCount: 1 },
    { name: 'audioFiles', maxCount: 10 },
    { name: 'sampleAudio', maxCount: 1 }
  ]),
  createBook
);

module.exports = router;
