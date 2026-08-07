const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');
const Book = require('../models/Book');
const User = require('../models/User');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { bookId, purchaseType, plan } = req.body;
    const userId = req.user.id;

    if (purchaseType === 'subscription') {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

      let sub = await Subscription.findOne({ where: { userId } });
      if (sub) {
        sub.status = 'active';
        sub.currentPeriodEnd = currentPeriodEnd;
        sub.plan = plan || 'unlimited_catalog';
        await sub.save();
      } else {
        sub = await Subscription.create({
          userId,
          plan: plan || 'unlimited_catalog',
          status: 'active',
          currentPeriodEnd
        });
      }

      await User.update({
        subscriptionStatus: 'active',
        subscriptionPlan: 'unlimited_catalog'
      }, { where: { id: userId } });

      return res.json({
        success: true,
        message: 'Subscription activated successfully!',
        subscription: sub
      });
    }

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    let rentExpiresAt = null;
    let pricePaid = book.price;

    if (purchaseType === 'rent') {
      pricePaid = book.rentPrice;
      rentExpiresAt = new Date();
      rentExpiresAt.setDate(rentExpiresAt.getDate() + 14);
    }

    const existingBuy = await Purchase.findOne({ where: { userId, bookId, type: 'buy' } });
    if (existingBuy) {
      return res.status(400).json({ message: 'You already own this book outright!' });
    }

    const purchase = await Purchase.create({
      userId,
      bookId,
      type: purchaseType,
      pricePaid,
      rentExpiresAt,
      stripePaymentId: 'ch_mock_' + Date.now()
    });

    if (purchaseType === 'buy') {
      book.salesCount += 1;
    } else {
      book.rentCount += 1;
    }
    await book.save();

    res.json({
      success: true,
      message: purchaseType === 'buy' ? 'Book purchased permanently!' : 'Book rented for 14 days!',
      purchase
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserLibrary = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await Purchase.findAll({
      where: { userId },
      include: [{ model: Book, as: 'book', include: [{ model: User, as: 'seller', attributes: ['name'] }] }],
      order: [['createdAt', 'DESC']]
    });

    const now = new Date();
    const ownedBooks = [];
    const rentedBooks = [];

    purchases.forEach((p) => {
      if (!p.book) return;
      if (p.type === 'buy') {
        ownedBooks.push({
          purchaseId: p.id,
          book: p.book,
          type: 'buy',
          purchasedAt: p.createdAt
        });
      } else if (p.type === 'rent') {
        const isExpired = p.rentExpiresAt && new Date(p.rentExpiresAt) < now;
        rentedBooks.push({
          purchaseId: p.id,
          book: p.book,
          type: 'rent',
          rentExpiresAt: p.rentExpiresAt,
          isExpired,
          rentedAt: p.createdAt
        });
      }
    });

    let subscriptionCatalogBooks = [];
    if (req.user.subscriptionStatus === 'active') {
      const activeSub = await Subscription.findOne({ where: { userId, status: 'active' } });
      if (activeSub && new Date(activeSub.currentPeriodEnd) > now) {
        subscriptionCatalogBooks = await Book.findAll({
          where: { status: 'approved', isIncludedInSubscription: true },
          include: [{ model: User, as: 'seller', attributes: ['name'] }]
        });
      }
    }

    res.json({
      ownedBooks,
      rentedBooks,
      subscriptionCatalogBooks,
      subscriptionInfo: {
        isSubscribed: req.user.subscriptionStatus === 'active',
        plan: req.user.subscriptionPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
