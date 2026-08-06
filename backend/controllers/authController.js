const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_readpulse_jwt_key_2026_dev_mode', {
    expiresIn: '30d'
  });
};

// Helper to build user response payload
const userPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isSellerApproved: user.isSellerApproved,
  subscriptionStatus: user.subscriptionStatus,
  subscriptionPlan: user.subscriptionPlan,
  walletBalance: user.walletBalance,
  avatar: user.avatar,
  token
});

// @desc    Register a new user (buyer, seller, or admin with secret key)
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, adminSecretKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Role validation — admin requires a secret key
    let assignedRole = role || 'buyer';
    if (assignedRole === 'admin') {
      const validAdminKey = process.env.ADMIN_SECRET_KEY || 'READPULSE_ADMIN_2026';
      if (adminSecretKey !== validAdminKey) {
        return res.status(403).json({ message: 'Invalid admin registration key' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      isSellerApproved: assignedRole === 'seller' || assignedRole === 'admin',
      walletBalance: 0
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json(userPayload(user, token));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.json(userPayload(user, token));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle seller role for user
// @route   POST /api/auth/become-seller
exports.becomeSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.role = 'seller';
    user.isSellerApproved = true;
    await user.save();

    res.json({
      message: 'Seller status granted successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSellerApproved: user.isSellerApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset — generates token, stores hash in DB
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL (frontend will handle the UI)
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?reset=${resetToken}`;

    // In production you'd send an email here. For this demo we return the link directly
    // so the user can click it — simulates the email flow without an SMTP provider.
    res.json({
      success: true,
      message: 'Password reset link generated! In production this would be emailed to you.',
      resetUrl,
      resetToken // Exposed for demo/portfolio — remove in production
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Hash the incoming token and find user with matching hash + non-expired
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password and clear the reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);
    res.json({
      success: true,
      message: 'Password has been reset successfully!',
      ...userPayload(user, jwtToken)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (name, avatar)
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    if (req.body.avatar) user.avatar = req.body.avatar;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      walletBalance: updated.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (when logged in)
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
