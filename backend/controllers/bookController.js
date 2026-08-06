const Book = require('../models/Book');
const Review = require('../models/Review');

// @desc    Get all books (Marketplace catalog with filter/search)
// @route   GET /api/books
exports.getBooks = async (req, res) => {
  try {
    const { category, format, search, subscriptionOnly, sort } = req.query;
    let query = { status: 'approved' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (format && format !== 'All') {
      query.format = { $in: [format, 'both'] };
    }

    if (subscriptionOnly === 'true') {
      query.isIncludedInSubscription = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-low') sortOptions = { price: 1 };
    if (sort === 'price-high') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { averageRating: -1 };

    const books = await Book.find(query).populate('seller', 'name email').sort(sortOptions);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single book details
// @route   GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('seller', 'name email');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const reviews = await Review.find({ book: req.params.id }).populate('user', 'name avatar');
    res.json({ book, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload / Publish a new book (Seller / Admin)
// @route   POST /api/books
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
      seller: req.user._id,
      format: format || 'both',
      fileUrl,
      audioUrls,
      sampleAudioUrl,
      sampleEbookText: sampleEbookText || "Free preview chapter of " + title,
      coverUrl,
      price: Number(price) || 9.99,
      rentPrice: Number(rentPrice) || 2.99,
      isIncludedInSubscription: isIncludedInSubscription === 'true' || isIncludedInSubscription === true,
      category: category || 'Fiction',
      description,
      status: req.user.role === 'admin' ? 'approved' : 'pending' // Admin auto-approves, seller goes to moderation
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get books uploaded by seller (Seller Analytics & Dashboard)
// @route   GET /api/books/seller/my-books
exports.getSellerBooks = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user._id }).sort({ createdAt: -1 });
    
    // Calculate seller metrics
    const totalSalesRevenue = books.reduce((acc, b) => acc + (b.salesCount * b.price), 0);
    const totalRentalRevenue = books.reduce((acc, b) => acc + (b.rentCount * b.rentPrice), 0);
    const totalEarnings = (totalSalesRevenue + totalRentalRevenue) * 0.85; // 85% creator payout

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
