import React from 'react';
import './PageHeader.css';

export function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div className="page-header-title-box">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
