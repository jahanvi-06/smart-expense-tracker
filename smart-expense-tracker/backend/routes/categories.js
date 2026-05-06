const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = { $in: [type, 'both'] };

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    const existing = await Category.findOne({ user: req.user._id, name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      user: req.user._id,
      name,
      type: type || 'both',
      icon: icon || '📦',
      color: color || '#6366f1'
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default categories' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
