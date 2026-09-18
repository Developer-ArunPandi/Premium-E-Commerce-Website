const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createSendToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');
const { successResponse } = require('../utils/response');

// Register
exports.register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
  });

  createSendToken(user, 201, res);
});

// Login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +loginAttempts +lockUntil +isActive'
  );

  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return next(new AppError(`Account locked. Please try again in ${minutesLeft} minute(s).`, 423));
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Increment failed attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      user.loginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // Reset failed attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }
  successResponse(res, { user });
});

// Update profile
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('Use /change-password to change your password.', 400));
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
  const filteredBody = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) filteredBody[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  successResponse(res, { user }, 'Profile updated successfully');
});

// Change password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long.', 400));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res);
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return successResponse(res, null, 'If an account exists with this email, you will receive a password reset link.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken, process.env.CLIENT_URL);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send email. Please try again later.', 500));
  }

  successResponse(res, null, 'Password reset link sent to your email.');
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(new AppError('Token is invalid or has expired. Please request a new password reset.', 400));
  }

  if (!password || password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

// Address management
exports.getAddresses = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('addresses');
  successResponse(res, { addresses: user.addresses });
});

exports.addAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const newAddress = req.body;

  // If this is the first address or marked as default, reset others
  if (newAddress.isDefault || user.addresses.length === 0) {
    newAddress.isDefault = true;
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(newAddress);
  await user.save({ validateBeforeSave: false });

  successResponse(res, { addresses: user.addresses }, 'Address added successfully', 201);
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  const updates = req.body;

  // Handle default address
  if (updates.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, updates);
  await user.save({ validateBeforeSave: false });

  successResponse(res, { addresses: user.addresses }, 'Address updated successfully');
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  const wasDefault = address.isDefault;
  user.addresses.pull({ _id: req.params.addressId });

  // Set first remaining address as default if deleted was default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save({ validateBeforeSave: false });

  successResponse(res, { addresses: user.addresses }, 'Address deleted successfully');
});

exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  user.addresses.forEach((addr) => (addr.isDefault = false));
  address.isDefault = true;

  await user.save({ validateBeforeSave: false });

  successResponse(res, { addresses: user.addresses }, 'Default address updated');
});
