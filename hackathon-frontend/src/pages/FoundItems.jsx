import { useState, useEffect } from 'react'
import { getFoundItems } from '../api'
import ItemCard from '../components/ItemCard'
import './Items.css'

export default function FoundItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFoundItems()
      .then(data => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load items.")
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="status">Loading found items...</div>
  if (error) return <div className="status error">{error}</div>

  return (
    <div className="page">
      <h2 className="page-title">🟢 Found Items</h2>
      {items.length === 0 ? (
        <div className="empty">No found items reported yet.</div>
      ) : (
        <div className="grid">
          {items.map((item, i) => (
            <ItemCard
              key={i}
              title={item.title}
              description={item.description}
              location={item.location}
              date={item.date_found}
              contact={item.contact}
            />
          ))}
        </div>
      )}
    </div>
  )
}