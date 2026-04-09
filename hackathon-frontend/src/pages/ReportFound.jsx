import { useState } from 'react'
import { reportFoundItem } from '../api'
import './Form.css'

export default function ReportFound() {
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    location: '', date_found: '', contact: ''
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await reportFoundItem(form)
      setStatus('success')
      setForm({ title: '', description: '', category: '', location: '', date_found: '', contact: '' })
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
            <input name="category" placeholder="e.g. Electronics, ID Card" value={form.category} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Date Found</label>
            <input name="date_found" type="date" value={form.date_found} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
          <label>Where Did You Find It?</label>
          <input name="location" placeholder="e.g. Canteen, Ground Floor" value={form.location} onChange={handleChange} required />
        </div>
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