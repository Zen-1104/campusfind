import { useState, useEffect } from 'react'
import { getFoundItems } from '../api'
import ItemCard from '../components/ItemCard'
import './Items.css'

export default function FoundItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFoundItems()
      .then(data => {
        // Now correctly looks for the .items property from backend
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="status">Syncing with campus database...</div>

  return (
    <div className="page">
      <h2 className="page-title">🟢 Found Items</h2>
      <div className="grid">
        {items.length === 0 ? <p>No records found.</p> : items.map((item) => (
          <ItemCard
            key={item.id}
            title={item.title}
            description={item.description}
            location={item.location}
            status={item.status}
          />
        ))}
      </div>
    </div>
  )
}