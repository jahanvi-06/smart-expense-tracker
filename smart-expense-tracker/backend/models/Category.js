const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      default: 'both'
    },
    icon: {
      type: String,
      default: '💰'
    },
    color: {
      type: String,
      default: '#6366f1'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

CategorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
