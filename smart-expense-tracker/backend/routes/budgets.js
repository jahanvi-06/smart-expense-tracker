const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @route   GET /api/budgets
// @desc    Get budgets for a month/year
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Get spending for each budget category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    const spendingMap = {};
    spending.forEach((s) => {
      spendingMap[s._id] = s.spent;
    });

    const budgetsWithSpending = budgets.map((b) => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.limit - (spendingMap[b.category] || 0),
      percentage: Math.round(((spendingMap[b.category] || 0) / b.limit) * 100)
    }));

    res.json({ success: true, budgets: budgetsWithSpending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create or update budget
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { limit, alertThreshold },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
