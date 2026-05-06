import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input, { Select } from '../UI/Input';
import api from '../../utils/api';
import { formatDateInput } from '../../utils/formatters';
import toast from 'react-hot-toast';
import './TransactionModal.css';

const TransactionModal = ({ isOpen, onClose, onSuccess, transaction }) => {
  const isEdit = !!transaction;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: formatDateInput(new Date()),
    tags: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        date: formatDateInput(transaction.date),
        tags: transaction.tags?.join(', ') || ''
      });
    }
  }, [transaction]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'both'
  );

  const validate = () => {
    const errs = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Valid amount is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      };

      if (isEdit) {
        await api.put(`/transactions/${transaction._id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction added');
      }

      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));

    // Reset category when type changes
    if (name === 'type') {
      setForm((prev) => ({ ...prev, type: value, category: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className="tx-form" noValidate>
        {/* Type toggle */}
        <div className="tx-type-toggle" role="group" aria-label="Transaction type">
          <button
            type="button"
            className={`tx-type-btn ${form.type === 'expense' ? 'tx-type-btn--active tx-type-btn--expense' : ''}`}
            onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            aria-pressed={form.type === 'expense'}
          >
            Expense
          </button>
          <button
            type="button"
            className={`tx-type-btn ${form.type === 'income' ? 'tx-type-btn--active tx-type-btn--income' : ''}`}
            onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            aria-pressed={form.type === 'income'}
          >
            Income
          </button>
        </div>

        <div className="tx-form__grid">
          <Input
            label="Amount"
            id="amount"
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            error={errors.amount}
            required
          />

          <Input
            label="Date"
            id="date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            error={errors.date}
            required
          />
        </div>

        <Select
          label="Category"
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          error={errors.category}
          required
        >
          <option value="">Select a category</option>
          {filteredCategories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </Select>

        <Input
          label="Description (optional)"
          id="description"
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="What was this for?"
          maxLength={200}
        />

        <Input
          label="Tags (optional, comma-separated)"
          id="tags"
          type="text"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="e.g. groceries, weekly"
        />

        <div className="tx-form__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Update' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
