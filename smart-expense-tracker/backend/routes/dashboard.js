const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Current month summary
    const monthlySummary = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthly = { income: 0, expense: 0, balance: 0 };
    monthlySummary.forEach((item) => {
      if (item._id === 'income') monthly.income = item.total;
      if (item._id === 'expense') monthly.expense = item.total;
    });
    monthly.balance = monthly.income - monthly.expense;

    // All-time summary
    const allTimeSummary = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const allTime = { income: 0, expense: 0, savings: 0 };
    allTimeSummary.forEach((item) => {
      if (item._id === 'income') allTime.income = item.total;
      if (item._id === 'expense') allTime.expense = item.total;
    });
    allTime.savings = allTime.income - allTime.expense;

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 8 }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(5);

    // Budget alerts
    const budgets = await Budget.find({
      user: req.user._id,
      month: currentMonth,
      year: currentYear
    });

    const budgetAlerts = [];
    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            category: budget.category,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spentAmount = spent[0]?.total || 0;
      const percentage = (spentAmount / budget.limit) * 100;

      if (percentage >= budget.alertThreshold) {
        budgetAlerts.push({
          category: budget.category,
          limit: budget.limit,
          spent: spentAmount,
          percentage: Math.round(percentage),
          isExceeded: percentage >= 100
        });
      }
    }

    res.json({
      success: true,
      data: {
        monthly,
        allTime,
        monthlyTrend,
        categoryBreakdown,
        recentTransactions,
        budgetAlerts
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get detailed analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    // Monthly income vs expense for the year
    const yearlyData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Category spending for the year
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Daily spending for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        yearlyData,
        categorySpending,
        dailySpending
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
