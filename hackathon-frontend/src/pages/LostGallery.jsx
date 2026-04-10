import React, { useEffect, useState } from 'react';
import { getLostItems } from '../api';
import './Items.css'; // Reuses the gallery grid styling

export default function LostGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLostItems().then(data => {
      setItems(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="items-page">
      <header className="items-header">
        <h2>🔴 Lost Items List</h2>
        <p>Help your fellow students! If you found one of these, contact the owner.</p>
      </header>

      <div className="items-grid">
        {items.length === 0 ? <p>No lost items reported yet.</p> : items.map(item => (
          <div key={item.id} className="item-card lost-border">
            <div className="status-badge lost">LOST</div>
            <h3>{item.title}</h3>
            <p className="description">{item.description}</p>
            <div className="card-footer">
              <span>📍 {item.location}</span>
              <span>📅 {item.date_lost}</span>
            </div>
            <div className="contact-info">📞 Contact: {item.contact}</div>
          </div>
        ))}
      </div>
    </div>
  );
}