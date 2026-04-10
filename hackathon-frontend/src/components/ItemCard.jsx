import React from 'react';
import './ItemCard.css';

export default function ItemCard({ title, description, location, status, date, contact }) {
  return (
    <div className="item-card">
      <div className={`badge ${status}`}>{status}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="card-meta">
        <span>📍 {location}</span>
        {date && <span>📅 {date}</span>}
        {contact && (
          <span>
            <a href={`tel:${contact}`} style={{textDecoration: 'none', color: 'inherit'}}>{contact}</a>
          </span>
        )}
      </div>
    </div>
  );
}