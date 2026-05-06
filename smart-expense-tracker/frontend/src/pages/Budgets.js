import React, { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getMonthName } from '../utils/formatters';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import Input, { Select } from '../components/UI/Input';
import toast from 'react-hot-toast';
import './Budgets.css';

const Budgets = () => {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ category: '', limit: '', alertThreshold: 80 });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month, year } });
      setBudgets(res.data.budgets);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories', { params: { type: 'expense' } });
        setCategories(res.data.categories);
      } catch {}
    };
    fetchCategories();
  }, []);

  const navigateMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.category) errs.category = 'Category is required';
    if (!form.limit || parseFloat(form.limit) <= 0) errs.limit = 'Valid limit is required';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      await api.post('/budgets', {
        category: form.category,
        limit: parseFloat(form.limit),
        alertThreshold: parseInt(form.alertThreshold),
        month,
        year
      });
      toast.success('Budget saved');
      setShowModal(false);
      setForm({ category: '', limit: '', alertThreshold: 80 });
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      setDeleteId(null);
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="budgets-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Set and track your spending limits</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <MdAdd aria-hidden="true" /> Add Budget
        </Button>
      </div>

      {/* Month navigator */}
      <div className="month-nav" role="navigation" aria-label="Month navigation">
        <button
          className="month-nav__btn"
          onClick={() => navigateMonth(-1)}
          aria-label="Previous month"
        >
          <MdChevronLeft />
        </button>
        <h2 className="month-nav__label">
          {getMonthName(month)} {year}
        </h2>
        <button
          className="month-nav__btn"
          onClick={() => navigateMonth(1)}
          aria-label="Next month"
        >
          <MdChevronRight />
        </button>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="budget-summary">
          <div className="budget-summary__info">
            <div>
              <p className="budget-summary__label">Total Budget</p>
              <p className="budget-summary__value">{formatCurrency(totalBudget, user?.currency)}</p>
            </div>
            <div>
              <p className="budget-summary__label">Total Spent</p>
              <p className="budget-summary__value budget-summary__value--spent">
                {formatCurrency(totalSpent, user?.currency)}
              </p>
            </div>
            <div>
              <p className="budget-summary__label">Remaining</p>
              <p className={`budget-summary__value ${totalBudget - totalSpent < 0 ? 'budget-summary__value--over' : 'budget-summary__value--remaining'}`}>
                {formatCurrency(Math.abs(totalBudget - totalSpent), user?.currency)}
                {totalBudget - totalSpent < 0 && ' over'}
              </p>
            </div>
          </div>
          <div className="budget-summary__bar-wrapper">
            <div
              className="budget-summary__bar"
              role="progressbar"
              aria-valuenow={overallPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall budget: ${overallPercentage}% used`}
            >
              <div
                className={`budget-summary__bar-fill ${overallPercentage >= 100 ? 'budget-summary__bar-fill--over' : overallPercentage >= 80 ? 'budget-summary__bar-fill--warning' : ''}`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
            <span className="budget-summary__pct">{overallPercentage}%</span>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="budgets-loading" aria-label="Loading budgets">
          <div className="spinner" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="budgets-empty">
          <p>No budgets set for {getMonthName(month)} {year}</p>
          <Button onClick={() => setShowModal(true)} variant="secondary">
            <MdAdd aria-hidden="true" /> Create your first budget
          </Button>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((budget) => {
            const pct = Math.min(budget.percentage, 100);
            const isOver = budget.percentage >= 100;
            const isWarning = budget.percentage >= budget.alertThreshold && !isOver;

            return (
              <div
                key={budget._id}
                className={`budget-card ${isOver ? 'budget-card--over' : isWarning ? 'budget-card--warning' : ''}`}
              >
                <div className="budget-card__header">
                  <h3 className="budget-card__category">{budget.category}</h3>
                  <button
                    className="budget-card__delete"
                    onClick={() => setDeleteId(budget._id)}
                    aria-label={`Delete ${budget.category} budget`}
                  >
                    <MdDelete />
                  </button>
                </div>

                <div className="budget-card__amounts">
                  <span className="budget-card__spent">
                    {formatCurrency(budget.spent, user?.currency)}
                  </span>
                  <span className="budget-card__limit">
                    / {formatCurrency(budget.limit, user?.currency)}
                  </span>
                </div>

                <div
                  className="budget-card__bar"
                  role="progressbar"
                  aria-valuenow={budget.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${budget.category}: ${budget.percentage}% of budget used`}
                >
                  <div
                    className={`budget-card__bar-fill ${isOver ? 'budget-card__bar-fill--over' : isWarning ? 'budget-card__bar-fill--warning' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="budget-card__footer">
                  <span className={`budget-card__pct ${isOver ? 'budget-card__pct--over' : isWarning ? 'budget-card__pct--warning' : ''}`}>
                    {budget.percentage}% used
                  </span>
                  <span className="budget-card__remaining">
                    {budget.remaining >= 0
                      ? `${formatCurrency(budget.remaining, user?.currency)} left`
                      : `${formatCurrency(Math.abs(budget.remaining), user?.currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormErrors({}); }} title="Add Budget">
        <form onSubmit={handleSave} className="budget-form" noValidate>
          <Select
            label="Category"
            id="budget-category"
            value={form.category}
            onChange={(e) => { setForm({ ...form, category: e.target.value }); setFormErrors({ ...formErrors, category: '' }); }}
            error={formErrors.category}
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </Select>

          <Input
            label="Monthly Limit"
            id="budget-limit"
            type="number"
            value={form.limit}
            onChange={(e) => { setForm({ ...form, limit: e.target.value }); setFormErrors({ ...formErrors, limit: '' }); }}
            placeholder="0.00"
            min="1"
            step="0.01"
            error={formErrors.limit}
            required
          />

          <Input
            label="Alert Threshold (%)"
            id="budget-threshold"
            type="number"
            value={form.alertThreshold}
            onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
            placeholder="80"
            min="1"
            max="100"
          />

          <div className="budget-form__actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Budget</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      {deleteId && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-dialog">
            <h3 id="confirm-title" className="confirm-title">Delete Budget</h3>
            <p className="confirm-text">Are you sure you want to delete this budget?</p>
            <div className="confirm-actions">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
