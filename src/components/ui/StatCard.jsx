import React from 'react';
import './StatCard.css';

export function StatCard({ title, value, icon: Icon, color = 'primary', subtext, trend }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={17} />
          </div>
        )}

      </div>
      <div className="stat-card-value">{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
    </div>
  );
}
