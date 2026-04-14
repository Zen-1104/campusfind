import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportFoundItem } from '../api';
import './Form.css';

/**
 * ReportFound Component
 * Allows anyone to report a found item with an optional photo.
 * Photo is stored securely and only visible to authenticated admins.
 */
export default function ReportFound() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    reporter_phone: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedLocation, setSubmittedLocation] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handlePhotoChange = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      alert('Image must be under 16MB.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => handlePhotoChange(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoChange(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      alert('A photo of the item is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await reportFoundItem(formData, photoFile);
      if (response.id) {
        setSubmittedLocation(formData.location);
        setIsSuccess(true);
      } else {
        throw new Error('Failed to save report');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('There was an error submitting your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="form-page-container">
        <div className="form-card" style={{ maxWidth: '580px', textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '16px' }}>Item Reported Successfully!</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Thank you for your honesty.
          </p>
          <div style={{ 
            background: 'rgba(45, 212, 191, 0.1)', 
            border: '1px solid rgba(45, 212, 191, 0.25)', 
            padding: '24px', 
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <p style={{ color: '#2dd4bf', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
              Please ensure you drop off this item at the <strong>{submittedLocation} reception desk</strong> so the rightful owner can collect it securely.
            </p>
          </div>
          <button 
            className="submit-btn" 
            onClick={() => navigate('/found')}
            style={{ width: 'auto', padding: '14px 40px' }}
          >
            Go to Found Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '580px' }}>
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Category</label>
            <select onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="Electronics">Electronics</option>
              <option value="Books/Documents">Books/Documents</option>
              <option value="Accessories">Accessories (Bags, Watches)</option>
              <option value="Wallets/Keys">Wallets/Keys</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="input-group">
            <label>Where did you find it?</label>
            <select
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            >
              <option value="" disabled>Select a block</option>
              <option value="A-Block">A-Block</option>
              <option value="B-Block">B-Block</option>
              <option value="C-Block">C-Block</option>
              <option value="D-Block">D-Block</option>
              <option value="F-Block">F-Block</option>
              <option value="G-Block">G-Block</option>
              <option value="I-Block">I-Block</option>
              <option value="Law-Block">Law-Block</option>
            </select>
          </div>

          <div className="input-group">
            <label>Your Phone Number</label>
            <input
              type="tel"
              placeholder="e.g., 9876543210"
              required
              maxLength={10}
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              inputMode="numeric"
              onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}
              onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Additional Description</label>
            <textarea
              placeholder="Mention brand, color, or any distinguishing marks..."
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* ---- Photo Upload Section ---- */}
          <div className="input-group">
            <label>
              Photo of Item
              <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: 8, fontSize: '0.82rem' }}>
                (required)
              </span>
            </label>

            {photoPreview ? (
              /* Preview of selected photo */
              <div className="photo-preview-wrapper">
                <img src={photoPreview} alt="Item preview" className="photo-preview-img" />
                <div className="photo-preview-overlay">
                  <button type="button" className="photo-remove-btn" onClick={removePhoto}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Remove
                  </button>
                  <button
                    type="button"
                    className="photo-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                </div>
                <div className="photo-lock-badge">🔒 Admin only</div>
              </div>
            ) : (
              /* Drop zone / Upload trigger */
              <div
                className={`photo-upload-zone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="photo-upload-icon">📷</div>
                <p className="photo-upload-title">Tap to take a photo or choose from gallery</p>
                <p className="photo-upload-sub">JPG, PNG, WEBP · max 16 MB</p>
                <div className="photo-upload-buttons">
                  {/* accept="image/*;capture=camera" triggers camera on mobile */}
                  <span className="photo-btn-chip">📸 Camera</span>
                  <span className="photo-btn-chip">🖼️ Gallery</span>
                </div>
              </div>
            )}

            {/* Hidden file input — capture="environment" opens rear camera on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : '📤 Post Found Report'}
          </button>
        </form>
      </div>
    </div>
  );
}