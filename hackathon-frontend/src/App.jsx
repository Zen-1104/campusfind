import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/items/lost')
      .then(res => res.json())
      .then(data => setStatus(' Backend connected. Items: ' + data.items.length))
      .catch(() => setStatus(' Cannot reach backend.'))
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>CampusFind</h1>
      <p>{status}</p>
    </div>
  )
}

export default App