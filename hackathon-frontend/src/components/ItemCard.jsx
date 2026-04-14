import React, { useState } from 'react';
import './ItemCard.css';

import { BACKEND_URL } from '../api';
export default function ItemCard({
  title,
  description,
  location,
  status,
  date,
  contact,
  category,
  photo_url,
  claimantName,
  claimantEmail,
  claimedTime,
  hideImage = false
}) {
  const [lightbox, setLightbox] = useState(false);

  const statusLabels = {
    'submitted':  '🟢 Just Found',
    'at_security': '🛡️ At Security',
    'collected':  '✓ Returned',
    'lost':       '🔴 Missing'
  };

  const displayStatus = statusLabels[status] || status || (date ? '🔴 Missing' : '🟢 Found');

  return (
    <>
      <div className="card">
        {/* Photo at the top of the card */}
        {photo_url && (
          <div className="card-photo-wrap" style={hideImage ? { cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
            {hideImage ? (
              <div style={{ color: '#475569', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                Cannot see the image
              </div>
            ) : (
              <img
                src={`${BACKEND_URL}${photo_url}`}
                alt={title}
                className="card-photo"
                onClick={() => setLightbox(true)}
                title="Click to enlarge"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        )}

        <div className="card-body">
          <div className="card-tag">{displayStatus}</div>
          <h3>{title}</h3>

          {category && (
            <span className="card-category">🏷️ {category}</span>
          )}

          <p className="card-description">{description}</p>

          <div className="card-meta">
            {location && <span>📍 {location}</span>}
            {date    && <span>📅 {date.split('T')[0]}</span>}
            {contact && (
              <span>
                📞 <a href={`tel:${contact}`} style={{ textDecoration: 'none', color: 'inherit' }}>{contact}</a>
              </span>
            )}

            {claimantName && (
              <div className="card-claimant">
                <span className="claimant-label">CLAIMANT</span>
                <span>{claimantName}</span>
                {claimantEmail && <span>✉️ {claimantEmail}</span>}
                {claimedTime   && <span>🕒 {new Date(claimedTime).toLocaleString()}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightbox && photo_url && (
        <div className="ic-lightbox" onClick={() => setLightbox(false)}>
          <img src={`${BACKEND_URL}${photo_url}`} alt={title} className="ic-lightbox-img" />
          <button
            className="ic-lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}