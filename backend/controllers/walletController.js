const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// @desc    Get wallet balance + recent transactions
// @route   GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name email');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .populate('relatedBook', 'title coverUrl')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      balance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Top up wallet (simulated — in production this would go through Stripe)
// @route   POST /api/wallet/topup
exports.topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const topupAmount = Number(amount);

    if (!topupAmount || topupAmount <= 0 || topupAmount > 500) {
      return res.status(400).json({ message: 'Amount must be between $0.01 and $500.00' });
    }

    const user = await User.findById(req.user._id);
    user.walletBalance = Number((user.walletBalance + topupAmount).toFixed(2));
    await user.save();

    await WalletTransaction.create({
      user: req.user._id,
      type: 'topup',
      amount: topupAmount,
      balanceAfter: user.walletBalance,
      description: `Wallet top-up of $${topupAmount.toFixed(2)}`
    });

    res.json({
      success: true,
      message: `$${topupAmount.toFixed(2)} added to wallet!`,
      balance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay for a book using wallet balance
// @route   POST /api/wallet/pay
exports.payWithWallet = async (req, res) => {
  try {
    const { bookId, purchaseType } = req.body;
    const Book = require('../models/Book');
    const Purchase = require('../models/Purchase');

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const price = purchaseType === 'rent' ? book.rentPrice : book.price;

    // Check if already bought
    if (purchaseType === 'buy') {
      const existing = await Purchase.findOne({ user: req.user._id, book: bookId, type: 'buy' });
      if (existing) {
        return res.status(400).json({ message: 'You already own this book!' });
      }
    }

    const user = await User.findById(req.user._id);
    if (user.walletBalance < price) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Need $${price.toFixed(2)}, have $${user.walletBalance.toFixed(2)}`,
        needsTopup: true
      });
    }

    // Debit wallet
    user.walletBalance = Number((user.walletBalance - price).toFixed(2));
    await user.save();

    // Create purchase
    let rentExpiresAt = null;
    if (purchaseType === 'rent') {
      rentExpiresAt = new Date();
      rentExpiresAt.setDate(rentExpiresAt.getDate() + 14);
    }

    const purchase = await Purchase.create({
      user: req.user._id,
      book: bookId,
      type: purchaseType,
      pricePaid: price,
      rentExpiresAt,
      stripePaymentId: 'wallet_' + Date.now()
    });

    // Update book stats
    if (purchaseType === 'buy') book.salesCount += 1;
    else book.rentCount += 1;
    await book.save();

    // Record transaction
    await WalletTransaction.create({
      user: req.user._id,
      type: purchaseType === 'rent' ? 'rental' : 'purchase',
      amount: -price,
      balanceAfter: user.walletBalance,
      description: `${purchaseType === 'buy' ? 'Purchased' : 'Rented'} "${book.title}"`,
      relatedBook: bookId
    });

    res.json({
      success: true,
      message: purchaseType === 'buy'
        ? `Book purchased! $${price.toFixed(2)} debited from wallet.`
        : `Book rented for 14 days! $${price.toFixed(2)} debited from wallet.`,
      purchase,
      newBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
