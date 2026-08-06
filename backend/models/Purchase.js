const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  type: { 
    type: String, 
    enum: ['buy', 'rent'], 
    required: true 
  },
  pricePaid: { type: Number, required: true },
  rentExpiresAt: { type: Date, default: null }, // Null for lifetime buy, 14 days for rent
  stripePaymentId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
