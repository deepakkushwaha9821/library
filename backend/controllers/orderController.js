const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Process Checkout Session (Stripe Mock & Real Integration)
// @route   POST /api/orders/checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const { bookId, purchaseType, plan } = req.body;
    const userId = req.user._id;

    // 1. Subscription Checkout
    if (purchaseType === 'subscription') {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30-day billing cycle

      // Create or update subscription record
      let sub = await Subscription.findOne({ user: userId });
      if (sub) {
        sub.status = 'active';
        sub.currentPeriodEnd = currentPeriodEnd;
        sub.plan = plan || 'unlimited_catalog';
        await sub.save();
      } else {
        sub = await Subscription.create({
          user: userId,
          plan: plan || 'unlimited_catalog',
          status: 'active',
          currentPeriodEnd
        });
      }

      // Update user model state
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'unlimited_catalog'
      });

      return res.json({
        success: true,
        message: 'Subscription activated successfully!',
        subscription: sub
      });
    }

    // 2. Individual Book Buy or Rent Checkout
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    let rentExpiresAt = null;
    let pricePaid = book.price;

    if (purchaseType === 'rent') {
      pricePaid = book.rentPrice;
      rentExpiresAt = new Date();
      rentExpiresAt.setDate(rentExpiresAt.getDate() + 14); // 14-day rental
    }

    // Check if already purchased buy
    const existingBuy = await Purchase.findOne({ user: userId, book: bookId, type: 'buy' });
    if (existingBuy) {
      return res.status(400).json({ message: 'You already own this book outright!' });
    }

    const purchase = await Purchase.create({
      user: userId,
      book: bookId,
      type: purchaseType,
      pricePaid,
      rentExpiresAt,
      stripePaymentId: 'ch_mock_' + Date.now()
    });

    // Increment seller counters
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

// @desc    Get user's personal library ("My Books" with rental expiry countdowns)
// @route   GET /api/orders/my-library
exports.getUserLibrary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch individual purchases (Buy & Rent)
    const purchases = await Purchase.find({ user: userId }).populate({
      path: 'book',
      populate: { path: 'seller', select: 'name' }
    }).sort({ createdAt: -1 });

    // Separate into active purchases and filter out expired rentals
    const now = new Date();
    const ownedBooks = [];
    const rentedBooks = [];

    purchases.forEach(p => {
      if (!p.book) return;
      if (p.type === 'buy') {
        ownedBooks.push({
          purchaseId: p._id,
          book: p.book,
          type: 'buy',
          purchasedAt: p.createdAt
        });
      } else if (p.type === 'rent') {
        const isExpired = p.rentExpiresAt && new Date(p.rentExpiresAt) < now;
        rentedBooks.push({
          purchaseId: p._id,
          book: p.book,
          type: 'rent',
          rentExpiresAt: p.rentExpiresAt,
          isExpired,
          rentedAt: p.createdAt
        });
      }
    });

    // Check if user has active subscription
    let subscriptionCatalogBooks = [];
    if (req.user.subscriptionStatus === 'active') {
      const activeSub = await Subscription.findOne({ user: userId, status: 'active' });
      if (activeSub && new Date(activeSub.currentPeriodEnd) > now) {
        subscriptionCatalogBooks = await Book.find({
          status: 'approved',
          isIncludedInSubscription: true
        }).populate('seller', 'name');
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
