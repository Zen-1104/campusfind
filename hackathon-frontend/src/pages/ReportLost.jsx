import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportLostItem } from '../api';
import './Form.css'; // Reuses the same clean form styling

export default function ReportLost() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    date_lost: '',
    contact: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await reportLostItem(formData);
      if (res.id) {
        alert('Lost item report posted! We will notify you if a match is found.');
        navigate('/lost');
      }
    } catch (err) {
      alert('Error posting report. Make sure you are logged in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <div className="form-header">
          <div className="form-icon-circle">🔍</div>
          <h2>Report a Lost Item</h2>
          <p>Provide details so the community can help you find it.</p>
        </div>

        <form onSubmit={handleSubmit} className="campus-form">
          <div className="input-group">
            <label>What did you lose?</label>
            <input type="text" placeholder="e.g., Blue Water Bottle" required 
              onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Where did you last see it?</label>
            <input type="text" placeholder="e.g., Block C, Room 202" required 
              onChange={(e) => setFormData({...formData, location: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Date Lost</label>
            <input type="date" required 
              onChange={(e) => setFormData({...formData, date_lost: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Your Contact Info (Phone/Email)</label>
            <input type="text" placeholder="How can the finder reach you?" required 
              onChange={(e) => setFormData({...formData, contact: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea placeholder="Any specific stickers, scratches, or brand names?"
              onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Lost Report'}
          </button>
        </form>
      </div>
    </div>
  );
}