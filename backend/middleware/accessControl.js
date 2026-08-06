const Book = require('../models/Book');
const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');

// CORE DRM-LITE ACCESS CONTROL LOGIC
// Checks if the requesting user has valid access to stream or view the full book
const verifyContentAccess = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bookId = req.params.bookId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // 1. Seller or Admin has instant access to their own content
    if (req.user.role === 'admin' || book.seller.toString() === userId.toString()) {
      req.accessType = 'full_owner_or_admin';
      req.book = book;
      return next();
    }

    // 2. Check for Permanent Buy
    const buyRecord = await Purchase.findOne({
      user: userId,
      book: bookId,
      type: 'buy'
    });

    if (buyRecord) {
      req.accessType = 'permanent_buy';
      req.book = book;
      return next();
    }

    // 3. Check for Active Rental (rentExpiresAt > now)
    const rentalRecord = await Purchase.findOne({
      user: userId,
      book: bookId,
      type: 'rent',
      rentExpiresAt: { $gt: new Date() }
    });

    if (rentalRecord) {
      req.accessType = 'active_rental';
      req.rentExpiresAt = rentalRecord.rentExpiresAt;
      req.book = book;
      return next();
    }

    // 4. Check for Active Unlimited Subscription + Book inclusion in subscription
    if (req.user.subscriptionStatus === 'active' && book.isIncludedInSubscription) {
      const activeSub = await Subscription.findOne({
        user: userId,
        status: 'active',
        currentPeriodEnd: { $gt: new Date() }
      });

      if (activeSub || req.user.subscriptionStatus === 'active') {
        req.accessType = 'active_subscription';
        req.book = book;
        return next();
      }
    }

    // Otherwise -> DENY ACCESS (DRM Protection)
    return res.status(403).json({
      message: 'Access Denied: You must purchase, rent, or have an active subscription to access this content.',
      isLocked: true,
      sampleAvailable: true
    });
  } catch (error) {
    console.error('Error verifying content access:', error);
    return res.status(500).json({ message: 'Server error checking content permission' });
  }
};

module.exports = { verifyContentAccess };
