import { useState, useEffect } from 'react'
import { getLostItems } from '../api'
import ItemCard from '../components/ItemCard'
import './Items.css'

export default function LostItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getLostItems()
      .then(data => {
        setItems(Array.isArray(data) ? data : (data.items || []))
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load items.")
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="status">Loading lost items...</div>
  if (error) return <div className="status error">{error}</div>

  return (
    <div className="gallery-page-wrapper">
      <div className="items-page">
        <div className="items-header">
          <h2 className="page-title">🔴 Lost Items</h2>
          <p>These items have been reported missing across the campus.</p>
        </div>
      {items.length === 0 ? (
        <div className="empty">No lost items reported yet.</div>
      ) : (
        <div className="grid">
          {items.map((item, i) => (
            <ItemCard
              key={i}
              title={item.title}
              description={item.description}
              location={item.location}
              date={item.date_lost}
              contact={item.contact}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}