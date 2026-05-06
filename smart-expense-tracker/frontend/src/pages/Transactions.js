import React, { useState, useEffect, useCallback } from 'react';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList,
  MdTrendingUp, MdTrendingDown, MdClose
} from 'react-icons/md';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import TransactionModal from '../components/Transactions/TransactionModal';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';
import './Transactions.css';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch {}
    };
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', startDate: '', endDate: '', search: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const filteredTransactions = filters.search
    ? transactions.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          tx.category.toLowerCase().includes(filters.search.toLowerCase())
      )
    : transactions;

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <Button onClick={() => { setEditTransaction(null); setShowModal(true); }}>
          <MdAdd aria-hidden="true" /> Add Transaction
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="tx-controls">
        <div className="tx-search">
          <MdSearch className="tx-search__icon" aria-hidden="true" />
          <input
            type="search"
            className="tx-search__input"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            aria-label="Search transactions"
          />
        </div>
        <button
          className={`tx-filter-btn ${showFilters ? 'tx-filter-btn--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
        >
          <MdFilterList aria-hidden="true" />
          Filters
          {hasActiveFilters && <span className="tx-filter-badge" aria-label="Active filters" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="tx-filters" role="region" aria-label="Transaction filters">
          <div className="tx-filters__grid">
            <div className="input-group">
              <label className="input-label" htmlFor="filter-type">Type</label>
              <select
                id="filter-type"
                className="input-field input-select"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                className="input-field input-select"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="filter-start">From date</label>
              <input
                id="filter-start"
                type="date"
                className="input-field"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="filter-end">To date</label>
              <input
                id="filter-end"
                type="date"
                className="input-field"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="tx-clear-filters" onClick={clearFilters}>
              <MdClose aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Transactions table */}
      <div className="tx-table-wrapper">
        {loading ? (
          <div className="tx-loading" aria-label="Loading transactions">
            <div className="spinner" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="tx-empty">
            <p>No transactions found</p>
            {hasActiveFilters && (
              <button className="tx-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="tx-table" aria-label="Transactions list">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Type</th>
                <th scope="col" className="tx-table__amount">Amount</th>
                <th scope="col" className="tx-table__actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="tx-table__date">{formatDate(tx.date)}</td>
                  <td>
                    <div className="tx-table__desc">{tx.description || '—'}</div>
                  </td>
                  <td>
                    <span className="tx-category-badge">{tx.category}</span>
                  </td>
                  <td>
                    <span className={`tx-type-badge tx-type-badge--${tx.type}`}>
                      {tx.type === 'income' ? (
                        <MdTrendingUp aria-hidden="true" />
                      ) : (
                        <MdTrendingDown aria-hidden="true" />
                      )}
                      {tx.type}
                    </span>
                  </td>
                  <td className={`tx-table__amount tx-amount--${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, user?.currency)}
                  </td>
                  <td className="tx-table__actions">
                    <button
                      className="tx-action-btn tx-action-btn--edit"
                      onClick={() => { setEditTransaction(tx); setShowModal(true); }}
                      aria-label={`Edit transaction: ${tx.description || tx.category}`}
                    >
                      <MdEdit />
                    </button>
                    <button
                      className="tx-action-btn tx-action-btn--delete"
                      onClick={() => setDeleteId(tx._id)}
                      aria-label={`Delete transaction: ${tx.description || tx.category}`}
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="tx-pagination" role="navigation" aria-label="Pagination">
          <button
            className="tx-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="tx-page-info" aria-current="page">
            Page {page} of {pages}
          </span>
          <button
            className="tx-page-btn"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="confirm-dialog">
            <h3 id="confirm-title" className="confirm-title">Delete Transaction</h3>
            <p className="confirm-text">Are you sure you want to delete this transaction? This cannot be undone.</p>
            <div className="confirm-actions">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <TransactionModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditTransaction(null); }}
          onSuccess={() => { setShowModal(false); setEditTransaction(null); fetchTransactions(); }}
          transaction={editTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;
