const Book = require('../models/Book');
const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');
const { Op } = require('sequelize');

const verifyContentAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.bookId;

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (req.user.role === 'admin' || book.sellerId === userId) {
      req.accessType = 'full_owner_or_admin';
      req.book = book;
      return next();
    }

    const buyRecord = await Purchase.findOne({
      where: { userId, bookId, type: 'buy' }
    });

    if (buyRecord) {
      req.accessType = 'permanent_buy';
      req.book = book;
      return next();
    }

    const rentalRecord = await Purchase.findOne({
      where: {
        userId,
        bookId,
        type: 'rent',
        rentExpiresAt: { [Op.gt]: new Date() }
      }
    });

    if (rentalRecord) {
      req.accessType = 'active_rental';
      req.rentExpiresAt = rentalRecord.rentExpiresAt;
      req.book = book;
      return next();
    }

    if (req.user.subscriptionStatus === 'active' && book.isIncludedInSubscription) {
      const activeSub = await Subscription.findOne({
        where: {
          userId,
          status: 'active',
          currentPeriodEnd: { [Op.gt]: new Date() }
        }
      });

      if (activeSub || req.user.subscriptionStatus === 'active') {
        req.accessType = 'active_subscription';
        req.book = book;
        return next();
      }
    }

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
