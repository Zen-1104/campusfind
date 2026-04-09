const BASE_URL = 'https://campusfind-h94e.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const googleLogin = async (googleToken) => {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: googleToken })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Google Auth failed');
  }
  return res.json();
};

export const reportLostItem = async (data) => {
  const res = await fetch(`${BASE_URL}/items/lost`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to report lost item');
  return res.json();
};

export const reportFoundItem = async (data) => {
  const res = await fetch(`${BASE_URL}/items/found`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to report found item');
  return res.json();
};

export const fetchLostItems = async () => {
  const res = await fetch(`${BASE_URL}/items/lost`);
  return res.json();
};

export const fetchFoundItems = async () => {
  const res = await fetch(`${BASE_URL}/items/found`);
  return res.json();
};