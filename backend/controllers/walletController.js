const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Book = require('../models/Book');
const Purchase = require('../models/Purchase');

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['walletBalance', 'name', 'email'] });
    const transactions = await WalletTransaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Book, as: 'relatedBook', attributes: ['title', 'coverUrl'] }],
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    res.json({
      balance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const topupAmount = Number(amount);

    if (!topupAmount || topupAmount <= 0 || topupAmount > 500) {
      return res.status(400).json({ message: 'Amount must be between $0.01 and $500.00' });
    }

    const user = await User.findByPk(req.user.id);
    user.walletBalance = Number((user.walletBalance + topupAmount).toFixed(2));
    await user.save();

    await WalletTransaction.create({
      userId: req.user.id,
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

exports.payWithWallet = async (req, res) => {
  try {
    const { bookId, purchaseType } = req.body;

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const price = purchaseType === 'rent' ? book.rentPrice : book.price;

    if (purchaseType === 'buy') {
      const existing = await Purchase.findOne({ where: { userId: req.user.id, bookId, type: 'buy' } });
      if (existing) {
        return res.status(400).json({ message: 'You already own this book!' });
      }
    }

    const user = await User.findByPk(req.user.id);
    if (user.walletBalance < price) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Need $${price.toFixed(2)}, have $${user.walletBalance.toFixed(2)}`,
        needsTopup: true
      });
    }

    user.walletBalance = Number((user.walletBalance - price).toFixed(2));
    await user.save();

    let rentExpiresAt = null;
    if (purchaseType === 'rent') {
      rentExpiresAt = new Date();
      rentExpiresAt.setDate(rentExpiresAt.getDate() + 14);
    }

    const purchase = await Purchase.create({
      userId: req.user.id,
      bookId,
      type: purchaseType,
      pricePaid: price,
      rentExpiresAt,
      stripePaymentId: 'wallet_' + Date.now()
    });

    if (purchaseType === 'buy') book.salesCount += 1;
    else book.rentCount += 1;
    await book.save();

    await WalletTransaction.create({
      userId: req.user.id,
      type: purchaseType === 'rent' ? 'rental' : 'purchase',
      amount: -price,
      balanceAfter: user.walletBalance,
      description: `${purchaseType === 'buy' ? 'Purchased' : 'Rented'} "${book.title}"`,
      relatedBookId: bookId
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
