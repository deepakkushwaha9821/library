const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { 
    type: String, 
    enum: ['buyer', 'seller', 'admin'], 
    default: 'buyer' 
  },
  isSellerApproved: { type: Boolean, default: false },
  subscriptionStatus: {
    type: String,
    enum: ['inactive', 'active', 'canceled'],
    default: 'inactive'
  },
  subscriptionPlan: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },

  // Wallet System
  walletBalance: { type: Number, default: 0 },

  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  // Wishlist
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate a hashed password reset token and store it + expiry in DB
userSchema.methods.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken; // Return the UNHASHED token (sent to user)
};

module.exports = mongoose.model('User', userSchema);
