import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import LostItems from './pages/LostItems'
import FoundItems from './pages/FoundItems'
import ReportLost from './pages/ReportLost'
import ReportFound from './pages/ReportFound'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lost" element={<LostItems />} />
        <Route path="/found" element={<FoundItems />} />
        <Route path="/report-lost" element={<ReportLost />} />
        <Route path="/report-found" element={<ReportFound />} />
      </Routes>
    </BrowserRouter>
  )
}