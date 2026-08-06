const express = require('express');
const router = express.Router();
const { streamAudio, streamEbook } = require('../controllers/streamController');
const { protect } = require('../middleware/auth');
const { verifyContentAccess } = require('../middleware/accessControl');

// DRM Gated Streaming Routes
router.get('/audio/:bookId', protect, verifyContentAccess, streamAudio);
router.get('/ebook/:bookId', protect, verifyContentAccess, streamEbook);

module.exports = router;
