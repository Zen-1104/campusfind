import { useState } from 'react'
import { reportLostItem } from '../api'
import './Form.css'

export default function ReportLost() {
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    location: '', date_lost: '', contact: ''
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
      await reportLostItem(form)
      setStatus('success')
      setForm({ title: '', description: '', category: '', location: '', date_lost: '', contact: '' })
    } catch {
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <div className="form-page form-lost">
      <div className="form-header lost-header">
        <div className="form-header-icon">🔴</div>
        <div>
          <h2>Report Lost Item</h2>
          <p>Fill in the details and we'll help you find it</p>
        </div>
      </div>

      {status === 'success' && <div className="alert success">✅ Item reported successfully!</div>}
      {status === 'error' && <div className="alert error">❌ Something went wrong. Try again.</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Title</label>
          <input name="title" placeholder="e.g. Black Dell Laptop" value={form.title} onChange={handleChange} required />
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
            <label>Date Lost</label>
            <input name="date_lost" type="date" value={form.date_lost} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
          <label>Last Seen Location</label>
          <input name="location" placeholder="e.g. Library 2nd Floor" value={form.location} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Your Contact</label>
          <input name="contact" placeholder="Email or phone number" value={form.contact} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-btn lost-btn" disabled={loading}>
          {loading ? 'Submitting...' : '🔴 Report Lost Item'}
        </button>
      </form>
    </div>
  )
}