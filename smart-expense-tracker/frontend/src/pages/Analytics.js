import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getShortMonthName } from '../utils/formatters';
import './Analytics.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#a855f7', '#ec4899', '#84cc16', '#f97316', '#14b8a6'
];

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/analytics', { params: { year } });
      setData(res.data.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const tooltipConfig = {
    backgroundColor: '#1e293b',
    titleColor: '#f1f5f9',
    bodyColor: '#94a3b8',
    borderColor: '#334155',
    borderWidth: 1,
    callbacks: {
      label: (ctx) => ` ${formatCurrency(ctx.raw, user?.currency)}`
    }
  };

  const axisConfig = {
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
  };

  // Build yearly bar chart
  const monthlyLabels = Array.from({ length: 12 }, (_, i) => getShortMonthName(i + 1));
  const incomeByMonth = new Array(12).fill(0);
  const expenseByMonth = new Array(12).fill(0);

  data?.yearlyData?.forEach(({ _id, total }) => {
    const idx = _id.month - 1;
    if (_id.type === 'income') incomeByMonth[idx] = total;
    if (_id.type === 'expense') expenseByMonth[idx] = total;
  });

  const savingsByMonth = incomeByMonth.map((inc, i) => Math.max(0, inc - expenseByMonth[i]));

  const yearlyBarData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Income',
        data: incomeByMonth,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 5,
        borderSkipped: false
      },
      {
        label: 'Expenses',
        data: expenseByMonth,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 5,
        borderSkipped: false
      }
    ]
  };

  const savingsLineData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Net Savings',
        data: savingsByMonth,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4
      }
    ]
  };

  // Daily spending
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dailyAmounts = new Array(daysInMonth).fill(0);
  data?.dailySpending?.forEach(({ _id, total }) => {
    dailyAmounts[_id - 1] = total;
  });

  const dailyBarData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Daily Spending',
        data: dailyAmounts,
        backgroundColor: dailyAmounts.map((v) =>
          v > 0 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(51, 65, 85, 0.3)'
        ),
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };

  // Category doughnut
  const categoryData = {
    labels: data?.categorySpending?.map((c) => c._id) || [],
    datasets: [
      {
        data: data?.categorySpending?.map((c) => c.total) || [],
        backgroundColor: COLORS,
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  const totalExpenses = data?.categorySpending?.reduce((s, c) => s + c.total, 0) || 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="analytics-loading" aria-label="Loading analytics">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Detailed insights into your finances</p>
        </div>
        <div className="analytics-year-select">
          <label htmlFor="year-select" className="sr-only">Select year</label>
          <select
            id="year-select"
            className="input-field input-select"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: 120 }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Yearly income vs expense */}
      <div className="analytics-chart-card">
        <h2 className="analytics-chart-title">Monthly Income vs Expenses — {year}</h2>
        <div style={{ height: 300 }}>
          <Bar
            data={yearlyBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip: tooltipConfig },
              scales: axisConfig
            }}
          />
        </div>
      </div>

      {/* Savings trend */}
      <div className="analytics-chart-card">
        <h2 className="analytics-chart-title">Monthly Net Savings — {year}</h2>
        <div style={{ height: 260 }}>
          <Line
            data={savingsLineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip: tooltipConfig },
              scales: axisConfig
            }}
          />
        </div>
      </div>

      {/* Two column: category + daily */}
      <div className="analytics-two-col">
        <div className="analytics-chart-card">
          <h2 className="analytics-chart-title">Spending by Category — {year}</h2>
          {data?.categorySpending?.length > 0 ? (
            <>
              <div style={{ height: 280 }}>
                <Doughnut
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, boxWidth: 10 }
                      },
                      tooltip: {
                        ...tooltipConfig,
                        callbacks: {
                          label: (ctx) => {
                            const pct = ((ctx.raw / totalExpenses) * 100).toFixed(1);
                            return ` ${formatCurrency(ctx.raw, user?.currency)} (${pct}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="analytics-category-list">
                {data.categorySpending.slice(0, 6).map((cat, i) => (
                  <div key={cat._id} className="analytics-category-item">
                    <div className="analytics-category-item__left">
                      <span
                        className="analytics-category-item__dot"
                        style={{ background: COLORS[i % COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="analytics-category-item__name">{cat._id}</span>
                    </div>
                    <div className="analytics-category-item__right">
                      <span className="analytics-category-item__amount">
                        {formatCurrency(cat.total, user?.currency)}
                      </span>
                      <span className="analytics-category-item__pct">
                        {((cat.total / totalExpenses) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="analytics-empty">No expense data for {year}</div>
          )}
        </div>

        <div className="analytics-chart-card">
          <h2 className="analytics-chart-title">Daily Spending — This Month</h2>
          <div style={{ height: 280 }}>
            <Bar
              data={dailyBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: tooltipConfig
                },
                scales: {
                  x: {
                    ticks: { color: '#64748b', maxTicksLimit: 10 },
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
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
