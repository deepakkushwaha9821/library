const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'buyer' },
  isSellerApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
  subscriptionStatus: { type: DataTypes.STRING, defaultValue: 'inactive' },
  subscriptionPlan: { type: DataTypes.STRING, allowNull: true },
  stripeCustomerId: { type: DataTypes.STRING, allowNull: true },
  avatar: { type: DataTypes.STRING, defaultValue: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  walletBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpire: { type: DataTypes.DATE, allowNull: true },
  wishlist: { type: DataTypes.JSON, defaultValue: [] }
}, { timestamps: true, tableName: 'users' });

const Book = sequelize.define('Book', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  authorName: { type: DataTypes.STRING, allowNull: false },
  sellerId: { type: DataTypes.STRING, allowNull: false, field: 'seller_id' },
  format: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  audioUrls: { type: DataTypes.JSON, defaultValue: [] },
  sampleAudioUrl: { type: DataTypes.STRING, allowNull: true },
  sampleEbookText: { type: DataTypes.TEXT, defaultValue: 'This is a free preview sample chapter of the book...' },
  coverUrl: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  rentPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  isIncludedInSubscription: { type: DataTypes.BOOLEAN, defaultValue: true },
  category: { type: DataTypes.STRING, defaultValue: 'Fiction' },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  salesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  rentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageRating: { type: DataTypes.FLOAT, defaultValue: 4.8 },
  reviewsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: true, tableName: 'books' });

const Purchase = sequelize.define('Purchase', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.STRING, allowNull: false, field: 'book_id' },
  type: { type: DataTypes.STRING, allowNull: false },
  pricePaid: { type: DataTypes.FLOAT, allowNull: false },
  rentExpiresAt: { type: DataTypes.DATE, allowNull: true },
  stripePaymentId: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true, tableName: 'purchases' });

const Review = sequelize.define('Review', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.STRING, allowNull: false, field: 'book_id' },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false }
}, { timestamps: true, tableName: 'reviews' });

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'user_id' },
  plan: { type: DataTypes.STRING, defaultValue: 'unlimited_catalog' },
  stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  currentPeriodEnd: { type: DataTypes.DATE, allowNull: false }
}, { timestamps: true, tableName: 'subscriptions' });

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
  type: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  balanceAfter: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  relatedBookId: { type: DataTypes.STRING, allowNull: true, field: 'related_book_id' }
}, { timestamps: true, tableName: 'wallet_transactions' });

User.hasMany(Book, { foreignKey: 'sellerId', as: 'books' });
Book.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(Purchase, { foreignKey: 'userId', as: 'purchases' });
Book.hasMany(Purchase, { foreignKey: 'bookId', as: 'purchases' });
Purchase.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Purchase.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Book.hasMany(Review, { foreignKey: 'bookId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'walletTransactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WalletTransaction.belongsTo(Book, { foreignKey: 'relatedBookId', as: 'relatedBook' });

module.exports = { sequelize, User, Book, Purchase, Review, Subscription, WalletTransaction };
