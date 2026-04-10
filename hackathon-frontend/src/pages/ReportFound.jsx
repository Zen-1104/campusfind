import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportFoundItem } from '../api';
import './Form.css';

/**
 * ReportFound Component
 * Allows students to report items they have found on campus.
 */
export default function ReportFound() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    location: '' // This maps to location_found in the backend
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  /**
   * Handles form submission by sending the data to the backend.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send report to the backend API via the helper in api.js
      const response = await reportFoundItem(formData);
      
      if (response.id) {
        alert('Item Reported Successfully! Please hand it over to the nearest security desk.');
        navigate('/found');
      } else {
        throw new Error('Failed to save report');
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert('There was an error submitting your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <div className="form-header">
          <div className="form-icon-circle">🤝</div>
          <h2>Report a Found Item</h2>
          <p>Help return a lost item to its rightful owner.</p>
        </div>

        <form onSubmit={handleSubmit} className="campus-form">
          <div className="input-group">
            <label>Item Name</label>
            <input 
              type="text" 
              placeholder="e.g., Sony Headphones" 
              required 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          <div className="input-group">
            <label>Category</label>
            <select onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="Electronics">Electronics</option>
              <option value="Books/Documents">Books/Documents</option>
              <option value="Accessories">Accessories (Bags, Watches)</option>
              <option value="Wallets/Keys">Wallets/Keys</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="input-group">
            <label>Where did you find it?</label>
            <input 
              type="text" 
              placeholder="e.g., Library 3rd Floor" 
              required 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
          </div>

          <div className="input-group">
            <label>Additional Description</label>
            <textarea 
              placeholder="Mention brand, color, or any distinguishing marks..."
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Post Found Report'}
          </button>
        </form>
      </div>
    </div>
  );
}