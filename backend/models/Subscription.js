const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, default: 'unlimited_catalog' },
  stripeSubscriptionId: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'past_due'], 
    default: 'active' 
  },
  currentPeriodEnd: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
