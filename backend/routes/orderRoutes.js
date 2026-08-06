const express = require('express');
const router = express.Router();
const { createCheckoutSession, getUserLibrary } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/checkout', protect, createCheckoutSession);
router.get('/my-library', protect, getUserLibrary);

module.exports = router;
