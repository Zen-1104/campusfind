import { useState } from 'react'
import { reportFoundItem } from '../api'
import './Form.css'

const CAMPUS_LOCATIONS = {
  "Academic Blocks": ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block I", "Block J", "Block K"],
  "Canteens": ["Anti-clock", "Clockwise", "Container", "Main Mess Hall"],
  "General Campus": ["Library", "Main Auditorium", "Sports Ground", "Parking Lot", "Hostel / Dorms", "Campus Walkways"]
};

export default function ReportFound() {
  const [form, setForm] = useState({
    title: '', description: '', category: '', date_found: '', contact: ''
  })
  
  const [areaType, setAreaType] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let finalLocation = `${areaType} -> ${specificLocation}`;
    if (areaType === "Academic Blocks" && roomNumber) {
        finalLocation += ` -> Class/Room ${roomNumber}`;
    }

    const payload = { ...form, location_found: finalLocation };

    try {
      await reportFoundItem(payload)
      setStatus('success')
      setForm({ title: '', description: '', category: '', date_found: '', contact: '' })
      setAreaType('')
      setSpecificLocation('')
      setRoomNumber('')
    } catch {
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <div className="form-page form-found">
      <div className="form-header found-header">
        <div className="form-header-icon">🟢</div>
        <div>
          <h2>Report Found Item</h2>
          <p>Help return this item to its rightful owner</p>
        </div>
      </div>

      {status === 'success' && <div className="alert success">✅ Item reported successfully!</div>}
      {status === 'error' && <div className="alert error">❌ Something went wrong. Try again.</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Title</label>
          <input name="title" placeholder="e.g. Blue Water Bottle" value={form.title} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" placeholder="Describe the item in detail..." value={form.description} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="" disabled>Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="ID Card / Documents">ID Card / Documents</option>
              <option value="Wallet / Purse">Wallet / Purse</option>
              <option value="Keys">Keys</option>
              <option value="Bag / Backpack">Bag / Backpack</option>
              <option value="Clothing">Clothing</option>
              <option value="Books / Stationery">Books / Stationery</option>
              <option value="Water Bottle">Water Bottle</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date Found</label>
            <input name="date_found" type="date" value={form.date_found} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Area Type</label>
            <select value={areaType} onChange={(e) => {
                setAreaType(e.target.value);
                setSpecificLocation('');
                setRoomNumber('');
            }} required>
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
              placeholder="e.g. 15, 3, or Lab 2" 
              value={roomNumber} 
              onChange={(e) => setRoomNumber(e.target.value)} 
            />
          </div>
        )}

        <div className="form-group">
          <label>Your Contact</label>
          <input name="contact" placeholder="Email or phone number" value={form.contact} onChange={handleChange} required />
        </div>
        
        <button type="submit" className="submit-btn found-btn" disabled={loading}>
          {loading ? 'Submitting...' : '🟢 Report Found Item'}
        </button>
      </form>
    </div>
  )
}