const BASE_URL = 'https://campusfind-h94e.onrender.com/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
});

export const googleLogin = async (token) => {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return res.json();
};

export const getLostItems = () => fetch(`${BASE_URL}/items/lost`).then(r => r.json());
export const getFoundItems = () => fetch(`${BASE_URL}/items/found`).then(r => r.json());

export const reportLostItem = (data) => fetch(`${BASE_URL}/items/lost`, {
  method: 'POST',
  headers: getHeaders(),
  body: JSON.stringify(data)
}).then(r => r.json());

export const reportFoundItem = (data) => fetch(`${BASE_URL}/items/found`, {
  method: 'POST',
  headers: getHeaders(),
  body: JSON.stringify(data)
}).then(r => r.json());

// Fetch all items for the Admin Dashboard
export const getAdminDashboard = async () => {
    const response = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Admin access denied');
    return response.json();
};

// Update status (The Ticker Logic)
export const updateItemStatus = async (itemType, itemId, status) => {
    const response = await fetch(`${BASE_URL}/admin/update-status/${itemType}/${itemId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status })
    });
    return response.json();
};