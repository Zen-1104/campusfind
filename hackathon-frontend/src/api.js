const BASE_URL = 'http://127.0.0.1:8080/api';

// --- Auth ---
export const loginGoogle = async (token) => {
    const res = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return res.json();
};

// --- Found Items (Providing both names to prevent crashes) ---
export const getLostItems = async () => {
    const res = await fetch(`${BASE_URL}/items/lost`);
    if (!res.ok) throw new Error('Failed to fetch lost items');
    return res.json();
};

export const fetchFoundItems = async () => {
    const res = await fetch(`${BASE_URL}/items/found`);
    return res.json();
};
export const getFoundItems = fetchFoundItems; 

// --- Reporting ---
export const reportLostItem = async (itemData) => {
    const res = await fetch(`${BASE_URL}/items/lost`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemData)
    });
    return res.json();
};

export const reportFoundItem = async (itemData) => {
    const res = await fetch(`${BASE_URL}/items/found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    return res.json();
};

// --- Admin ---
export const getAdminDashboard = async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
};

export const updateItemStatus = async (id, newStatus) => {
    const endpoint = newStatus === 'at_security' ? 'verify' : 'collect';
    const res = await fetch(`${BASE_URL}/admin/${endpoint}/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
};