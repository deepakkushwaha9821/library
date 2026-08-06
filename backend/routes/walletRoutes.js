const express = require('express');
const router = express.Router();
const { getWallet, topUpWallet, payWithWallet } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.post('/topup', protect, topUpWallet);
router.post('/pay', protect, payWithWallet);

module.exports = router;
