import React from 'react';
import './ItemCard.css';

export default function ItemCard({ title, description, location, status, date, contact, claimantName, claimantEmail, claimedTime }) {
  // Map specific statuses to nice readable names
  const statusLabels = {
    'submitted': '🟢 Just Found',
    'at_security': '🛡️ At Security',
    'collected': '✓ Returned',
    'lost': '🔴 Missing'
  };

  const displayStatus = statusLabels[status] || status || (date ? '🔴 Missing' : '🟢 Found');

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-tag">{displayStatus}</div>
        <h3>{title}</h3>
        <p className="card-description">{description}</p>
        <div className="card-meta">
          <span>📍 {location}</span>
          {date && <span>📅 Date: {date.split('T')[0]}</span>}
          {contact && (
            <span>
              📞 <a href={`tel:${contact}`} style={{textDecoration: 'none', color: 'inherit'}}>{contact}</a>
            </span>
          )}
          {claimantName && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color: '#2dd4bf', fontWeight: 'bold'}}>CLAIMANT</span><br/>
              <span style={{color: '#e2e8f0'}}>{claimantName}</span>
              {claimantEmail && <span><br/>✉️ {claimantEmail}</span>}
              {claimedTime && <span><br/>🕒 {new Date(claimedTime).toLocaleString()}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}