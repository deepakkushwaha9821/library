const { Op } = require('sequelize');
const Book = require('../models/Book');
const Review = require('../models/Review');
const User = require('../models/User');

const buildBookOrder = (sort) => {
  switch (sort) {
    case 'price-low': return [['price', 'ASC']];
    case 'price-high': return [['price', 'DESC']];
    case 'rating': return [['averageRating', 'DESC']];
    default: return [['createdAt', 'DESC']];
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { category, format, search, subscriptionOnly, sort } = req.query;
    const where = { status: 'approved' };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (format && format !== 'All') {
      where.format = { [Op.in]: [format, 'both'] };
    }

    if (subscriptionOnly === 'true') {
      where.isIncludedInSubscription = true;
    }

    if (search) {
      const normalizedSearch = search.toLowerCase();
      where[Op.or] = [
        { title: { [Op.like]: `%${normalizedSearch}%` } },
        { authorName: { [Op.like]: `%${normalizedSearch}%` } },
        { description: { [Op.like]: `%${normalizedSearch}%` } }
      ];
    }

    const books = await Book.findAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['name', 'email'] }],
      order: buildBookOrder(sort)
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['name', 'email'] }]
    });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const reviews = await Review.findAll({
      where: { bookId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }]
    });
    res.json({ book, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const {
      title,
      authorName,
      format,
      price,
      rentPrice,
      isIncludedInSubscription,
      category,
      description,
      sampleEbookText
    } = req.body;

    let coverUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
    if (req.files && req.files.cover && req.files.cover[0]) {
      coverUrl = `/uploads/covers/${req.files.cover[0].filename}`;
    } else if (req.body.coverUrl) {
      coverUrl = req.body.coverUrl;
    }

    let fileUrl = '';
    if (req.files && req.files.ebookFile && req.files.ebookFile[0]) {
      fileUrl = `/uploads/ebooks/${req.files.ebookFile[0].filename}`;
    }

    let audioUrls = [];
    if (req.files && req.files.audioFiles) {
      audioUrls = req.files.audioFiles.map(f => `/uploads/audio/${f.filename}`);
    }

    let sampleAudioUrl = '';
    if (req.files && req.files.sampleAudio && req.files.sampleAudio[0]) {
      sampleAudioUrl = `/uploads/audio/${req.files.sampleAudio[0].filename}`;
    }

    const book = await Book.create({
      title,
      authorName: authorName || req.user.name,
      sellerId: req.user.id,
      format: format || 'both',
      fileUrl,
      audioUrls,
      sampleAudioUrl,
      sampleEbookText: sampleEbookText || 'Free preview chapter of ' + title,
      coverUrl,
      price: Number(price) || 9.99,
      rentPrice: Number(rentPrice) || 2.99,
      isIncludedInSubscription: isIncludedInSubscription === 'true' || isIncludedInSubscription === true,
      category: category || 'Fiction',
      description,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSellerBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      where: { sellerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const totalSalesRevenue = books.reduce((acc, b) => acc + (b.salesCount * b.price), 0);
    const totalRentalRevenue = books.reduce((acc, b) => acc + (b.rentCount * b.rentPrice), 0);
    const totalEarnings = (totalSalesRevenue + totalRentalRevenue) * 0.85;

    res.json({
      books,
      metrics: {
        totalBooks: books.length,
        totalSalesCount: books.reduce((acc, b) => acc + b.salesCount, 0),
        totalRentCount: books.reduce((acc, b) => acc + b.rentCount, 0),
        totalSalesRevenue,
        totalRentalRevenue,
        totalEarnings: Number(totalEarnings.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
