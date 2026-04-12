import { useState, useEffect } from 'react';
import { getAdminDashboard, updateItemStatus, deleteItem } from '../api';
import './AdminDashboard.css';

const STATUS_STEPS = ['submitted', 'verified', 'at_security', 'collected'];

const CATEGORIES = [
  "All",
  "Electronics",
  "ID Card / Documents",
  "Water Bottle",
  "Keys",
  "Wallet / Purse",
  "Bag / Backpack",
  "Clothing",
  "Books / Stationery",
  "Other"
];

export default function AdminDashboard() {
  const [data, setData] = useState({ lost: [], found: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [foundCategory, setFoundCategory] = useState("All");
  const [lostCategory, setLostCategory] = useState("All");

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingItemId, setCollectingItemId] = useState(null);
  const [collectorData, setCollectorData] = useState({
    collector_name: '',
    collector_phone: '',
    collector_email: '',
    collector_time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAdminDashboard();
      if (res.error || res.msg) {
        throw new Error(res.error || res.msg);
      }
      setData({ lost: res.lost || [], found: res.found || [] });
      setError(null);
    } catch {
      setError('Access Denied or Failed to fetch data. Ensure you have admin privileges and your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await updateItemStatus(id, 'at_security');
      fetchData();
    } catch {
      alert('Failed to update status. Please try again.');
    }
  };

  const openCollectModal = (id) => {
    setCollectingItemId(id);
    const now = new Date();
    // format as YYYY-MM-DDTHH:MM for datetime-local
    // adding timezone offset manually since toISOString is strict UTC
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setCollectorData({ collector_name: '', collector_phone: '', collector_email: '', collector_time: localDateTime });
    setShowCollectModal(true);
  };

  const submitCollectModal = async (e) => {
    e.preventDefault();
    try {
      await updateItemStatus(collectingItemId, 'collected', collectorData);
      setShowCollectModal(false);
      setCollectingItemId(null);
      fetchData();
    } catch {
      alert('Failed to mark item as collected. Please try again.');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type} item?`)) return;
    try {
      await deleteItem(type, id);
      fetchData();
    } catch {
      alert('Failed to delete item. Please try again.');
    }
  };

  if (loading) return <div className="admin-status">Loading Command Center...</div>;
  if (error) return <div className="admin-status error">{error}</div>;

  const filteredFound = foundCategory === "All" ? data.found : data.found.filter(item => item.category === foundCategory);
  const filteredLost = lostCategory === "All" ? data.lost : data.lost.filter(item => item.category === lostCategory);

  return (
    <div className="admin-page-wrapper">
      <div className="admin-dashboard">
        <div className="admin-header">
        <h2>🛡️ Security Command Center</h2>
        <p>Manage campus reports and verify found items.</p>
      </div>

      <div className="admin-section">
        <div className="section-header-flex">
          <h3>Found Items (Pending Verification)</h3>
          <select className="filter-select" value={foundCategory} onChange={(e) => setFoundCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {filteredFound.length === 0 ? <p className="empty">No found items in this category.</p> : (
          <div className="admin-list">
            {filteredFound.map(item => (
              <div key={item.id} className="admin-card">
                <div className="card-info">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <span className="location">📍 {item.location}</span>
                </div>
                
                {/* Status Ticker UI */}
                <div className="status-ticker">
                  {STATUS_STEPS.map((step, index) => {
                    const isActive = STATUS_STEPS.indexOf(item.status) >= index;
                    return (
                      <div key={step} className={`step ${isActive ? 'active' : ''}`}>
                        <div className="step-dot"></div>
                        <span className="step-label">{step.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="card-actions">
                  {item.status === 'submitted' && (
                    <button 
                      className="verify-btn"
                      onClick={() => handleVerify(item.id)}
                    >
                      Verify & Log at Security
                    </button>
                  )}
                  {item.status === 'at_security' && (
                    <button 
                      className="verify-btn"
                      style={{ background: '#f59e0b' }}
                      onClick={() => openCollectModal(item.id)}
                    >
                      🤝 Mark as Collected
                    </button>
                  )}
                  {item.status === 'collected' && (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Item Returned to Owner</span>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete('found', item.id)}
                  >
                    🗑️ Delete Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="section-header-flex">
          <h3>Lost Items Reports</h3>
          <select className="filter-select" value={lostCategory} onChange={(e) => setLostCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {filteredLost.length === 0 ? <p className="empty">No lost items in this category.</p> : (
          <div className="admin-list">
            {filteredLost.map(item => (
              <div key={item.id} className="admin-card lost-card">
                <div className="card-info">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <span className="location">📍 {item.location}</span>
                  {item.contact && (
                    <span className="contact">
                      <a href={`tel:${item.contact}`} style={{textDecoration: 'none', color: 'inherit'}}>{item.contact}</a>
                    </span>
                  )}

                  <div className="card-actions" style={{marginTop: '20px'}}>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete('lost', item.id)}
                    >
                      🗑️ Delete Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Modal Overlay */}
      {showCollectModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-form">
            <h3>Record Claimant Details</h3>
            <p className="modal-desc">Log the details of the person collecting this item to complete validation.</p>
            <form onSubmit={submitCollectModal}>
              <div className="form-group">
                <label>Claimant Full Name</label>
                <input 
                  type="text" 
                  required
                  value={collectorData.collector_name}
                  onChange={e => setCollectorData({...collectorData, collector_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={collectorData.collector_phone}
                  onChange={e => setCollectorData({...collectorData, collector_phone: e.target.value})}
                  placeholder="i.e. +1 555 123 4567"
                />
              </div>
              <div className="form-group">
                <label>College Email ID</label>
                <input 
                  type="email" 
                  required
                  value={collectorData.collector_email}
                  onChange={e => setCollectorData({...collectorData, collector_email: e.target.value})}
                  placeholder="jdoe@campus.edu"
                />
              </div>
              <div className="form-group">
                <label>Claimed Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={collectorData.collector_time}
                  onChange={e => setCollectorData({...collectorData, collector_time: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCollectModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Confirm Handover</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}