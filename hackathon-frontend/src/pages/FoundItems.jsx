import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getFoundItems } from '../api';
import ItemCard from '../components/ItemCard';
import './Items.css';

export default function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detect if the current user is an admin
  const isAdmin = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.role === 'admin' && !!localStorage.getItem('token');
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    getFoundItems()
      .then(data => {
        setItems(Array.isArray(data) ? data : (data.items || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Search filtering from URL query ?search=
  const locationHook = useLocation();
  const searchParams = new URLSearchParams(locationHook.search);
  const searchQuery = searchParams.get('search')
    ? searchParams.get('search').toLowerCase()
    : '';

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    return (
      (item.title       && item.title.toLowerCase().includes(searchQuery)) ||
      (item.description && item.description.toLowerCase().includes(searchQuery)) ||
      (item.category    && item.category.toLowerCase().includes(searchQuery)) ||
      (item.location    && item.location.toLowerCase().includes(searchQuery))
    );
  });

  if (loading) return <div className="status">Syncing with campus database...</div>;

  return (
    <div className="gallery-page-wrapper">
      <div className="items-page">
        <div className="items-header">
          <h2 className="page-title">🟢 Found Items</h2>
          <p>Recently found items waiting to be claimed at security.</p>
        </div>

        <div className="grid">
          {filteredItems.length === 0 ? (
            <p className="status">No records found matching your search.</p>
          ) : (
            filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                description={item.description}
                location={item.location}
                status={item.status}
                category={item.category}
                photo_url={item.photo_url}
                hideImage={!isAdmin}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}