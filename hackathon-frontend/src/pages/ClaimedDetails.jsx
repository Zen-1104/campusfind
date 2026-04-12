import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../api';
import ItemCard from '../components/ItemCard';
import './AdminDashboard.css';

export default function ClaimedDetails() {
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadClaimedRecords = async () => {
      try {
        const data = await getAdminDashboard();
        // Extract all explicitly collected found items
        const returned = data.found.filter(i => i.status === 'collected');
        setClaimedItems(returned);
      } catch (err) {
        if (err.message.includes('401') || err.message.includes('403')) {
          navigate('/auth');
        } else {
          setError('Failed to load claimed records.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadClaimedRecords();
  }, [navigate]);

  if (loading) return <div className="status" style={{color: '#94a3b8', textAlign: 'center', padding: '100px'}}>Securely loading the registry...</div>;
  if (error) return <div className="status error" style={{textAlign: 'center', padding: '100px'}}>{error}</div>;

  return (
    <div className="gallery-page-wrapper">
      <div className="items-page">
        <div className="items-header">
          <h2 className="page-title" style={{ color: '#ffffff' }}>📒 Returned Handover Records</h2>
          <p>Official log of all items confidently returned to their owners.</p>
        </div>

        <div className="grid" style={{ marginTop: '20px' }}>
          {claimedItems.length === 0 ? (
            <div className="empty">No items have been formally collected and registered yet.</div>
          ) : (
            claimedItems.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                description={item.description}
                location={item.location || item.location_found}
                status={item.status}
                date={item.date_lost || item.created_at}
                claimantName={item.collector_name}
                claimantEmail={item.collector_email}
                claimedTime={item.collector_time}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
