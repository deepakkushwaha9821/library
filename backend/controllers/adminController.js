const Book = require('../models/Book');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Subscription = require('../models/Subscription');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalSellers = await User.count({ where: { role: 'seller' } });
    const totalBooks = await Book.count();
    const pendingBooksCount = await Book.count({ where: { status: 'pending' } });
    const approvedBooksCount = await Book.count({ where: { status: 'approved' } });

    const totalPurchases = await Purchase.findAll();
    const grossRevenue = totalPurchases.reduce((sum, p) => sum + p.pricePaid, 0);
    const activeSubscribersCount = await Subscription.count({ where: { status: 'active' } });

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

exports.getPendingBooks = async (req, res) => {
  try {
    const pendingBooks = await Book.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'seller', attributes: ['name', 'email'] }]
    });
    res.json(pendingBooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moderateBook = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const book = await Book.findByPk(req.params.id);
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
