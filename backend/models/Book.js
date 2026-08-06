const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authorName: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  format: { 
    type: String, 
    enum: ['ebook', 'audiobook', 'both'], 
    required: true 
  },
  fileUrl: { type: String }, // DRM-protected raw eBook file path
  audioUrls: [{ type: String }], // DRM-protected audio chapter files
  sampleAudioUrl: { type: String },
  sampleEbookText: { type: String, default: "This is a free preview sample chapter of the book..." },
  coverUrl: { type: String, required: true },
  price: { type: Number, required: true, default: 0 }, // Outright buy price
  rentPrice: { type: Number, required: true, default: 0 }, // 14-day rental price
  isIncludedInSubscription: { type: Boolean, default: true },
  category: { 
    type: String, 
    enum: ['Technology', 'Fiction', 'Sci-Fi', 'Business', 'Self-Help', 'Fantasy', 'History'], 
    default: 'Fiction' 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  salesCount: { type: Number, default: 0 },
  rentCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
