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
    <div className="form-page">
      <h2 className="form-title">🟢 Report Found Item</h2>
      {status === 'success' && <div className="alert success">Item reported successfully!</div>}
      {status === 'error' && <div className="alert error">Something went wrong. Try again.</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input name="title" placeholder="Item Title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="category" placeholder="Category (e.g. Electronics, ID Card)" value={form.category} onChange={handleChange} />
        <input name="location" placeholder="Where did you find it?" value={form.location} onChange={handleChange} required />
        <input name="date_found" type="date" value={form.date_found} onChange={handleChange} required />
        <input name="contact" placeholder="Your contact (email/phone)" value={form.contact} onChange={handleChange} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Report Found Item'}
        </button>
      </form>
    </div>
  )
}