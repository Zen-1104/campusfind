const BASE_URL = 'http://192.168.49.134:5000'

function getToken() {
    return localStorage.getItem('token')
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    }
}

export async function register(name, email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    return res.json()
}

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    return res.json()
}

export async function getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: authHeaders()
    })
    return res.json()
}

export async function getLostItems() {
    const res = await fetch(`${BASE_URL}/api/items/lost`)
    return res.json()
}

export async function reportLostItem(data) {
    const res = await fetch(`${BASE_URL}/api/items/lost`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
    })
    return res.json()
}

export async function getFoundItems() {
    const res = await fetch(`${BASE_URL}/api/items/found`)
    return res.json()
}

export async function reportFoundItem(data) {
    const res = await fetch(`${BASE_URL}/api/items/found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    return res.json()
}

export async function getAdminDashboard() {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
        headers: authHeaders()
    })
    return res.json()
}

export async function updateItemStatus(itemType, itemId, status) {
    const res = await fetch(`${BASE_URL}/api/items/${itemType}/${itemId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status })
    })
    return res.json()
}

export async function seedAdmin() {
    const res = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST' })
    return res.json()
}