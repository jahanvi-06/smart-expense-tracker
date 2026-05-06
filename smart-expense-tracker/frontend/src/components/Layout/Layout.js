import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdSwapHoriz, MdAccountBalance, MdBarChart,
  MdSettings, MdLogout, MdMenu, MdClose, MdAttachMoney
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { path: '/', icon: MdDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: MdSwapHoriz, label: 'Transactions' },
  { path: '/budgets', icon: MdAccountBalance, label: 'Budgets' },
  { path: '/analytics', icon: MdBarChart, label: 'Analytics' },
  { path: '/settings', icon: MdSettings, label: 'Settings' }
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <MdAttachMoney className="sidebar__logo-icon" aria-hidden="true" />
            <span className="sidebar__logo-text">SmartExpense</span>
          </div>
          <button
            className="sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <MdClose />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
              aria-label={label}
            >
              <Icon className="sidebar__nav-icon" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-email">{user?.email}</p>
            </div>
          </div>
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <MdLogout aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <button
            className="topbar__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <MdMenu />
          </button>
          <div className="topbar__title">
            {navItems.find((n) => n.path === window.location.pathname)?.label || 'Dashboard'}
          </div>
          <div className="topbar__user">
            <div className="topbar__avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
