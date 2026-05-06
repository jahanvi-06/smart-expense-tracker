import React, { useState, useEffect, useCallback } from 'react';
import {
  MdTrendingUp, MdTrendingDown, MdAccountBalance, MdSavings,
  MdWarning, MdAdd, MdArrowForward
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatRelativeDate, getShortMonthName } from '../utils/formatters';
import StatCard from '../components/UI/StatCard';
import TransactionModal from '../components/Transactions/TransactionModal';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#a855f7', '#ec4899', '#84cc16'
];

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="dashboard-loading" aria-label="Loading dashboard">
        <div className="spinner" />
      </div>
    );
  }

  const { monthly, allTime, monthlyTrend, categoryBreakdown, recentTransactions, budgetAlerts } = data || {};

  // Build monthly trend chart data
  const trendLabels = [];
  const incomeData = [];
  const expenseData = [];

  if (monthlyTrend) {
    const months = {};
    monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (!months[key]) months[key] = { income: 0, expense: 0, month: _id.month, year: _id.year };
      months[key][_id.type] = total;
    });

    Object.values(months).forEach(({ income, expense, month }) => {
      trendLabels.push(getShortMonthName(month));
      incomeData.push(income);
      expenseData.push(expense);
    });
  }

  const barChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: 'Expenses',
        data: expenseData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const doughnutData = {
    labels: categoryBreakdown?.map((c) => c._id) || [],
    datasets: [
      {
        data: categoryBreakdown?.map((c) => c.total) || [],
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw, user?.currency)}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(51, 65, 85, 0.5)' }
      },
      y: {
        ticks: {
          color: '#64748b',
          callback: (v) => formatCurrency(v, user?.currency)
        },
        grid: { color: 'rgba(51, 65, 85, 0.5)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', font: { size: 12 }, padding: 16, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${formatCurrency(ctx.raw, user?.currency)}`
        }
      }
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="dashboard__subtitle">Here's your financial overview for this month</p>
        </div>
        <button
          className="dashboard__add-btn"
          onClick={() => setShowAddModal(true)}
          aria-label="Add new transaction"
        >
          <MdAdd aria-hidden="true" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Budget alerts */}
      {budgetAlerts?.length > 0 && (
        <div className="dashboard__alerts" role="alert" aria-label="Budget alerts">
          {budgetAlerts.map((alert, i) => (
            <div
              key={i}
              className={`budget-alert ${alert.isExceeded ? 'budget-alert--exceeded' : 'budget-alert--warning'}`}
            >
              <MdWarning className="budget-alert__icon" aria-hidden="true" />
              <span>
                <strong>{alert.category}</strong>:{' '}
                {alert.isExceeded
                  ? `Budget exceeded! Spent ${formatCurrency(alert.spent, user?.currency)} of ${formatCurrency(alert.limit, user?.currency)}`
                  : `${alert.percentage}% of budget used (${formatCurrency(alert.spent, user?.currency)} / ${formatCurrency(alert.limit, user?.currency)})`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="dashboard__stats">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(monthly?.income, user?.currency)}
          subtitle="This month"
          icon={<MdTrendingUp />}
          color="income"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(monthly?.expense, user?.currency)}
          subtitle="This month"
          icon={<MdTrendingDown />}
          color="expense"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(monthly?.balance, user?.currency)}
          subtitle="Income - Expenses"
          icon={<MdAccountBalance />}
          color={monthly?.balance >= 0 ? 'income' : 'expense'}
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(allTime?.savings, user?.currency)}
          subtitle="All time"
          icon={<MdSavings />}
          color="savings"
        />
      </div>

      {/* Charts row */}
      <div className="dashboard__charts">
        <div className="chart-card">
          <h2 className="chart-card__title">Income vs Expenses (6 months)</h2>
          <div className="chart-card__body" style={{ height: 260 }}>
            {trendLabels.length > 0 ? (
              <Bar data={barChartData} options={chartOptions} />
            ) : (
              <div className="chart-empty">No data available yet</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h2 className="chart-card__title">Spending by Category</h2>
          <div className="chart-card__body" style={{ height: 260 }}>
            {categoryBreakdown?.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="chart-empty">No expenses this month</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="dashboard__recent">
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
          <Link to="/transactions" className="section-link">
            View all <MdArrowForward aria-hidden="true" />
          </Link>
        </div>

        {recentTransactions?.length > 0 ? (
          <div className="recent-list">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="recent-item">
                <div className="recent-item__left">
                  <div
                    className={`recent-item__dot recent-item__dot--${tx.type}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="recent-item__desc">
                      {tx.description || tx.category}
                    </p>
                    <p className="recent-item__meta">
                      {tx.category} · {formatRelativeDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`recent-item__amount recent-item__amount--${tx.type}`}
                  aria-label={`${tx.type === 'income' ? 'Income' : 'Expense'}: ${formatCurrency(tx.amount, user?.currency)}`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, user?.currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet. Add your first one!</p>
            <button className="empty-state__btn" onClick={() => setShowAddModal(true)}>
              <MdAdd aria-hidden="true" /> Add Transaction
            </button>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <TransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
