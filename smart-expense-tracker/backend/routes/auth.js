const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// Default categories to seed for new users
const defaultCategories = [
  { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#8b5cf6' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#f59e0b' },
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#f97316' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#a855f7' },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#14b8a6' },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#eab308' },
  { name: 'Rent/Mortgage', type: 'expense', icon: '🏠', color: '#6366f1' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#0ea5e9' },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#84cc16' },
  { name: 'Savings', type: 'expense', icon: '🏦', color: '#22c55e' },
  { name: 'Other Expense', type: 'expense', icon: '📦', color: '#94a3b8' }
];

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const user = await User.create({ name, email, password });

      // Seed default categories for new user
      const cats = defaultCategories.map((c) => ({ ...c, user: user._id, isDefault: true }));
      await Category.insertMany(cats);

      const token = user.getSignedJwtToken();

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, currency: user.currency }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = user.getSignedJwtToken();

      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, currency: user.currency, monthlyBudget: user.monthlyBudget }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, currency, monthlyBudget } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, currency, monthlyBudget },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
