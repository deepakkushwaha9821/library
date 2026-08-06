const Book = require('../models/Book');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');

// @desc    Get Admin System Metrics
// @route   GET /api/admin/metrics
exports.getAdminMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBooks = await Book.countDocuments();
    const pendingBooksCount = await Book.countDocuments({ status: 'pending' });
    const approvedBooksCount = await Book.countDocuments({ status: 'approved' });

    const totalPurchases = await Purchase.find();
    const grossRevenue = totalPurchases.reduce((sum, p) => sum + p.pricePaid, 0);

    const activeSubscribersCount = await Subscription.countDocuments({ status: 'active' });

    res.json({
      totalUsers,
      totalSellers,
      totalBooks,
      pendingBooksCount,
      approvedBooksCount,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      activeSubscribersCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending books for moderation
// @route   GET /api/admin/pending-books
exports.getPendingBooks = async (req, res) => {
  try {
    const pendingBooks = await Book.find({ status: 'pending' }).populate('seller', 'name email');
    res.json(pendingBooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a book upload
// @route   PUT /api/admin/moderate-book/:id
exports.moderateBook = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    book.status = status;
    await book.save();

    res.json({ message: `Book status updated to ${status}`, book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
