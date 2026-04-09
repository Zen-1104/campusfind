export const BASE_URL = "https://campusfind-h94e.onrender.com"

export async function getLostItems() {
  const res = await fetch(`${BASE_URL}/api/items/lost`)
  return res.json()
}

export async function getFoundItems() {
  const res = await fetch(`${BASE_URL}/api/items/found`)
  return res.json()
}

export async function reportLostItem(data) {
  const res = await fetch(`${BASE_URL}/api/items/lost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function reportFoundItem(data) {
  const res = await fetch(`${BASE_URL}/api/items/found`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return res.json()
}