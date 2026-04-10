import './ItemCard.css'

const categoryEmoji = {
  electronics: '💻',
  'id card': '🪪',
  wallet: '👛',
  keys: '🔑',
  bag: '🎒',
  phone: '📱',
  bottle: '🍶',
  default: '📦'
}

function getEmoji(category) {
  if (!category) return '📦'
  const key = category.toLowerCase()
  for (const k in categoryEmoji) {
    if (key.includes(k)) return categoryEmoji[k]
  }
  return categoryEmoji.default
}

export default function ItemCard({ title, description, location, date, contact, category }) {
  return (
    <div className="card">
      <div className="card-image-area">
        {getEmoji(category || title)}
      </div>
      <div className="card-body">
        {category && <div className="card-tag">{category}</div>}
        <h3>{title}</h3>
        <p className="card-description">{description}</p>
        <div className="card-meta">
          <span>📍 {location}</span>
          <span>📅 {date}</span>
          {contact && <span><a href={`tel:${contact}`} style={{textDecoration: 'none', color: 'inherit'}}>{contact}</a></span>}
        </div>
      </div>
    </div>
  )
}