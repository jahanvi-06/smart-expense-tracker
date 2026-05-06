import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <div className="stat-card__info">
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
          {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
        </div>
        {icon && (
          <div className="stat-card__icon" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`stat-card__trend ${trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
