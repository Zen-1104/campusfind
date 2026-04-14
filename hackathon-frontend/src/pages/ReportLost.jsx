import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportLostItem, scanItemUpload } from '../api';
import ItemCard from '../components/ItemCard'; // To display matched found items
import './Form.css';

export default function ReportLost() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'scan'
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    date_lost: '',
    contact: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Scan State ---
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [scanDescription, setScanDescription] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const [scanError, setScanError] = useState('');
  const [showAllFallback, setShowAllFallback] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // --- Form Submission ---
  const handleFormSubmit = async (e) => {
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

  // --- Scan Handlers ---
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
    setScanFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setScanPreview(e.target.result);
    reader.readAsDataURL(file);
    setScanResults(null); // Reset previous matches if new photo picked
    setExtractedKeywords([]);
  };

  const handleScanSubmit = async () => {
    if (!scanFile) return;
    setIsScanning(true);
    setScanError('');
    try {
      // Send both photo AND optional description for fallback search
      const formData = new FormData();
      formData.append('photo', scanFile);
      if (scanDescription.trim()) formData.append('description', scanDescription.trim());

      const res = await fetch('http://localhost:8080/api/scan_item', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Scan failed');

      setScanResults(result.matches || []);
      setExtractedKeywords(result.keywords || []);
      setAiUsed(result.ai_used || false);
      setShowAllFallback(result.show_all_fallback || false);
      setAiDescription(result.ai_description || '');
      if (result.message) setScanError(result.message);

    } catch (err) {
      setScanError('Scan failed. Please add a description below and try again.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '800px', width: '100%' }}>
        
        {/* Toggle Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
          <button 
            onClick={() => setActiveTab('form')}
            style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'transparent', 
              color: activeTab === 'form' ? '#2dd4bf' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'form' ? '2px solid #2dd4bf' : '2px solid transparent',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1.05rem',
              transition: 'all 0.2s ease'
            }}
          >
            ✍️ Report Manually
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'transparent', 
              color: activeTab === 'scan' ? '#6366f1' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'scan' ? '2px solid #6366f1' : '2px solid transparent',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1.05rem',
              transition: 'all 0.2s ease'
            }}
          >
            🤖 AI Visual Scan
          </button>
        </div>

        {/* ─── TAB: FORM ─── */}
        {activeTab === 'form' && (
          <>
            <div className="form-header">
              <div className="form-icon-circle">🔍</div>
              <h2>Report a Lost Item</h2>
              <p>Provide details so the community can help you find it.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="campus-form">
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
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                />
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
          </>
        )}

        {/* ─── TAB: AI SCAN ─── */}
        {activeTab === 'scan' && (
          <div style={{ padding: '0 20px' }}>
            <div className="form-header" style={{ marginBottom: '24px' }}>
              <div className="form-icon-circle" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                📸
              </div>
              <h2>AI Item Scanner</h2>
              <p>Upload a photo of your lost item (or a similar reference image). Our AI will scan its visual details and search the Found gallery instantly!</p>
            </div>

            <div 
              className={`photo-upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handlePhotoChange(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '24px', borderColor: isDragging ? '#6366f1' : '' }}
            >
              {scanPreview ? (
                <div className="photo-preview-wrapper" style={{ maxHeight: '280px', overflow: 'hidden', borderRadius: '12px', position: 'relative' }}>
                  <img src={scanPreview} alt="Preview" className="photo-preview-img" style={{ width: '100%', height: '100%', maxHeight: '280px', objectFit: 'contain', background: '#080c14' }} />
                  <div className="photo-overlay cursor-swap" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '10px', color: '#fff', fontSize: '0.85rem' }}>
                    <span>Click to change photo</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p><strong>Click to browse</strong> or drag and drop a photo</p>
                  <span className="upload-hint">Supports JPG, PNG (Max 16MB)</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => handlePhotoChange(e.target.files[0])} 
            />

            {/* Description hint - visible after photo picked, always helps fallback */}
            {scanFile && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>
                  📝 Describe the item <span style={{ color: '#475569' }}>(e.g. "blue BMW car") — helps if AI is busy</span>
                </label>
                <input
                  type="text"
                  value={scanDescription}
                  onChange={e => setScanDescription(e.target.value)}
                  placeholder="e.g. black headphones, red wallet, blue water bottle..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Error banner */}
            {scanError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '16px' }}>
                ⚠️ {scanError}
              </div>
            )}

            {scanFile && !scanResults && (
              <button
                className="submit-btn"
                onClick={handleScanSubmit}
                disabled={isScanning}
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
              >
                {isScanning ? '🤖 Scanning...' : '🔍 Scan & Search'}
              </button>
            )}

            {/* Scan Results */}
            {scanResults && (
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>

                {/* Header */}
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '6px' }}>
                  {showAllFallback
                    ? '📋 Showing all found items — scroll to find yours'
                    : scanResults.length > 0
                      ? `✅ Found ${scanResults.length} potential match${scanResults.length > 1 ? 'es' : ''}!`
                      : '❌ No matches found.'}
                </h3>
                <p style={{ color: aiUsed ? '#2dd4bf' : '#f59e0b', fontSize: '0.78rem', marginBottom: '16px' }}>
                  {aiUsed ? '🤖 Powered by Gemini AI vision + image-to-image comparison' : showAllFallback ? '🎨 Could not extract keywords — showing everything' : '🔍 Searched by keyword / dominant color'}
                </p>

                {/* What AI detected in the photo */}
                {aiUsed && aiDescription && (
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>🔎 AI identified in your photo:</span>
                    <span style={{ color: '#c7d2fe', fontSize: '0.85rem' }}>{aiDescription}</span>
                  </div>
                )}

                {/* Fallback notice */}
                {showAllFallback && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '12px 16px', color: '#fcd34d', fontSize: '0.85rem', marginBottom: '20px' }}>
                    💡 Tip: Add a description below (e.g. "black headphones") and scan again for precise results.
                  </div>
                )}

                {/* Keyword chips */}
                {extractedKeywords.length > 0 && !showAllFallback && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}>Searched:</span>
                    {extractedKeywords.map((kw, i) => (
                      <span key={i} style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '0.78rem',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}>{kw}</span>
                    ))}
                  </div>
                )}

                {/* Results grid */}
                {scanResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {scanResults.map(item => {
                      const score = item.similarity_score;
                      const scoreColor = score >= 70 ? '#2dd4bf' : score >= 40 ? '#f59e0b' : '#94a3b8';
                      return (
                        <div key={item.id} style={{ position: 'relative', cursor: 'pointer' }}
                          onClick={() => navigate(`/found?search=${encodeURIComponent(item.title)}`)}>
                          <ItemCard {...item} hideImage={true} />
                          {/* Similarity badge */}
                          {score !== undefined && (
                            <div style={{ position: 'absolute', top: '12px', right: '12px',
                              background: scoreColor, color: '#000',
                              padding: '4px 10px', borderRadius: '99px',
                              fontSize: '0.75rem', fontWeight: 800 }}>
                              {score}% Match
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                            <span style={{ background: '#6366f1', color: '#fff', padding: '5px 10px',
                              borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              View Details →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Nothing matched. Try adding a description and scanning again.</p>
                    <button className="cta-btn secondary" onClick={() => setActiveTab('form')} style={{ padding: '10px 24px' }}>Fill Manual Report</button>
                  </div>
                )}

                {/* Scan again button */}
                <button
                  onClick={() => { setScanResults(null); setScanError(''); setShowAllFallback(false); }}
                  style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  🔄 Scan a Different Photo
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}