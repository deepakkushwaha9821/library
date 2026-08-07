const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_readpulse_jwt_key_2026_dev_mode', {
    expiresIn: '30d'
  });
};

const userPayload = (user, token) => ({
  _id: user.id,
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

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, adminSecretKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

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
      const token = generateToken(user.id);
      res.status(201).json(userPayload(user, token));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email } });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user.id);
      res.json(userPayload(user, token));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.becomeSeller = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.role = 'seller';
    user.isSellerApproved = true;
    await user.save();

    res.json({
      message: 'Seller status granted successfully!',
      user: {
        _id: user.id,
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/?reset=${resetToken}`;
    res.json({
      success: true,
      message: 'Password reset link generated! In production this would be emailed to you.',
      resetUrl,
      resetToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    const jwtToken = generateToken(user.id);
    res.json({
      success: true,
      message: 'Password has been reset successfully!',
      ...userPayload(user, jwtToken)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    if (req.body.avatar) user.avatar = req.body.avatar;

    const updated = await user.save();
    res.json({
      _id: updated.id,
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

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

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
