const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['topup', 'purchase', 'rental', 'subscription', 'refund', 'seller_payout'],
    required: true 
  },
  amount: { type: Number, required: true }, // Positive = credit, Negative = debit
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  relatedBook: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
