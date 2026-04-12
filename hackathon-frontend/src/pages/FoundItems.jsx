import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getFoundItems } from '../api'
import ItemCard from '../components/ItemCard'
import './Items.css'

export default function FoundItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFoundItems()
      .then(data => {
        setItems(Array.isArray(data) ? data : (data.items || []))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const locationHook = useLocation()
  const searchParams = new URLSearchParams(locationHook.search)
  const searchQuery = searchParams.get('search') ? searchParams.get('search').toLowerCase() : ''

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const titleMatch = item.title && item.title.toLowerCase().includes(searchQuery);
    const descMatch = item.description && item.description.toLowerCase().includes(searchQuery);
    const catMatch = item.category && item.category.toLowerCase().includes(searchQuery);
    const locMatch = item.location && item.location.toLowerCase().includes(searchQuery);
    return titleMatch || descMatch || catMatch || locMatch;
  });

  if (loading) return <div className="status">Syncing with campus database...</div>

  return (
    <div className="gallery-page-wrapper">
      <div className="items-page">
        <div className="items-header">
          <h2 className="page-title">🟢 Found Items</h2>
          <p>Recently found items waiting to be claimed at security.</p>
        </div>
        <div className="grid">
        {filteredItems.length === 0 ? <p>No records found matching your search.</p> : filteredItems.map((item) => (
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
    </div>
  )
}