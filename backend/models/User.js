const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('./index');

User.beforeSave(async (user) => {
  if (!user.changed('password')) return;
  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

User.prototype.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
  return resetToken;
};

module.exports = User;
