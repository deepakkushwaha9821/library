const express = require('express');
const router = express.Router();
const { downloadBookPDF } = require('../controllers/downloadController');
const { protect } = require('../middleware/auth');
const { verifyContentAccess } = require('../middleware/accessControl');

router.get('/pdf/:bookId', protect, verifyContentAccess, downloadBookPDF);

module.exports = router;
