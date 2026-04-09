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
    <div className="form-page">
      <h2 className="form-title">🔴 Report Lost Item</h2>
      {status === 'success' && <div className="alert success">Item reported successfully!</div>}
      {status === 'error' && <div className="alert error">Something went wrong. Try again.</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input name="title" placeholder="Item Title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="category" placeholder="Category (e.g. Electronics, ID Card)" value={form.category} onChange={handleChange} />
        <input name="location" placeholder="Last seen location" value={form.location} onChange={handleChange} required />
        <input name="date_lost" type="date" value={form.date_lost} onChange={handleChange} required />
        <input name="contact" placeholder="Your contact (email/phone)" value={form.contact} onChange={handleChange} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Report Lost Item'}
        </button>
      </form>
    </div>
  )
}