const BASE_URL = 'http://localhost:8080/api';

// --- Auth ---
export const loginGoogle = async (token) => {
    const res = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return res.json();
};

export const adminLogin = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
};

export const addAdmin = async (email, password, name) => {
    const res = await fetch(`${BASE_URL}/auth/add-admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create admin');
    return data;
};

// --- Fetching Items ---
export const getLostItems = async () => {
    const res = await fetch(`${BASE_URL}/items/lost`);
    if (!res.ok) throw new Error('Failed to fetch lost items');
    return res.json();
};

export const getFoundItems = async () => {
    const res = await fetch(`${BASE_URL}/items/found`);
    if (!res.ok) throw new Error('Failed to fetch found items');
    return res.json();
};
export const fetchFoundItems = getFoundItems;

// --- Reporting ---
export const reportLostItem = async (itemData) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/items/lost`, {
        method: 'POST',
        headers,
        body: JSON.stringify(itemData)
    });
    return res.json();
};

export const reportFoundItem = async (itemData) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/items/found`, {
        method: 'POST',
        headers,
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

export const updateItemStatus = async (id, newStatus, collectorData = null) => {
    const endpoint = newStatus === 'at_security' ? 'verify' : 'collect';
    
    const options = {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };
    
    if (collectorData && newStatus === 'collected') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(collectorData);
    }
    
    const res = await fetch(`${BASE_URL}/admin/${endpoint}/${id}`, options);
    return res.json();
};

export const deleteItem = async (type, id) => {
    const res = await fetch(`${BASE_URL}/admin/delete/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
};