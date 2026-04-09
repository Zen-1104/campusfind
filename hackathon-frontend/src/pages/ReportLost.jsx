import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportLostItem } from '../api'
import './Form.css'

const CAMPUS_LOCATIONS = {
  "Academic Blocks": ["A Block", "B Block", "C Block", "D Block", "E Block", "F Block", "G Block", "H Block", "I Block", "J Block", "K Block"],
  "Canteens": ["Anti-clock", "Clockwise", "Container", "Mess Hall"],
  "General Campus": ["Basketball Court", "Ground", "Parking Lot", "Campus Walkways", "Other General Area"]
};

export default function ReportLost() {
  const navigate = useNavigate();
  
  // 1. Verify Authentication on Mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth'); // Redirect to login if no token is found
    }
  }, [navigate]);

  const [form, setForm] = useState({
    title: '', description: '', category: '', date_lost: '', contact: ''
  })
  
  const [areaType, setAreaType] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Construct the formatted location string based on user selection
    let finalLocation = `${areaType} -> ${specificLocation}`;
    if (areaType === "Academic Blocks" && roomNumber) {
        finalLocation += ` -> Class/Room ${roomNumber}`;
    }

    const payload = { ...form, location: finalLocation };

    try {
      await reportLostItem(payload) // API call automatically includes token from getHeaders()
      alert('Report posted successfully!')
      navigate('/lost') // Navigate back to the lost items list after success
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <div className="form-header-icon">🔴</div>
        <div>
          <h2>Report Lost Item</h2>
          <p>Provide details to help the campus community identify your item.</p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Name</label>
          <input name="title" placeholder="e.g. Blue Water Bottle" value={form.title} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="" disabled>Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents/IDs</option>
              <option value="Accessories">Accessories (Keys, Wallets)</option>
              <option value="Clothing">Clothing</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date Lost</label>
            <input type="date" name="date_lost" value={form.date_lost} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description" 
            placeholder="Mention any unique marks, brand, or color..." 
            value={form.description} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>General Area</label>
            <select value={areaType} onChange={(e) => { setAreaType(e.target.value); setSpecificLocation(''); }} required>
              <option value="" disabled>Select Area Type</option>
              {Object.keys(CAMPUS_LOCATIONS).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {areaType && (
            <div className="form-group cascading-reveal">
              <label>Specific Location</label>
              <select value={specificLocation} onChange={(e) => setSpecificLocation(e.target.value)} required>
                <option value="" disabled>Select Specific Area</option>
                {CAMPUS_LOCATIONS[areaType].map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {areaType === "Academic Blocks" && specificLocation && (
          <div className="form-group cascading-reveal">
            <label>Class / Room Number (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. D2, Auditorium, Lab, etc." 
              value={roomNumber} 
              onChange={(e) => setRoomNumber(e.target.value)} 
            />
          </div>
        )}

        <div className="form-group">
          <label>Your Contact</label>
          <input name="contact" placeholder="Email or phone number" value={form.contact} onChange={handleChange} required />
        </div>
        
        <button type="submit" className="submit-btn lost-btn" disabled={loading}>
          {loading ? 'Submitting...' : '🔴 Post Report'}
        </button>
      </form>
    </div>
  )
}