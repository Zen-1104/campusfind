import { useState, useEffect } from 'react';
import { fetchAdminImage } from '../api';
import './AdminItemPhoto.css';

/**
 * Renders an admin-only item photo by fetching it via the JWT-protected endpoint.
 * Regular users never see this component — callers must only render it for admins.
 *
 * Props:
 *   filename  — the photo_filename stored in the DB (e.g. "abc123.jpg")
 *   compact   — if true, shows a smaller thumbnail style (for ItemCard)
 */
export default function AdminItemPhoto({ filename, compact = false }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!filename) { setLoading(false); return; }
    let objectUrl;
    fetchAdminImage(filename).then((url) => {
      objectUrl = url;
      setSrc(url);
      setLoading(false);
    });
    // Revoke the blob URL when component unmounts to free memory
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [filename]);

  if (!filename) return null;

  return (
    <>
      <div className={`aip-wrap ${compact ? 'aip-compact' : ''}`}>
        {loading ? (
          <div className="aip-skeleton" />
        ) : src ? (
          <img
            src={src}
            alt="Found item"
            className="aip-img"
            onClick={() => setLightbox(true)}
            title="Click to enlarge"
          />
        ) : (
          <div className="aip-missing">📷 Photo unavailable</div>
        )}
        <span className="aip-badge">🔒 Admin only</span>
      </div>

      {/* Full-screen lightbox */}
      {lightbox && (
        <div className="aip-lightbox" onClick={() => setLightbox(false)}>
          <img src={src} alt="Found item (enlarged)" className="aip-lightbox-img" />
          <button
            className="aip-lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
