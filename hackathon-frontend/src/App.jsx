import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FoundItems from './pages/FoundItems';
import ReportFound from './pages/ReportFound';
import Auth from './pages/Auth';
import LostItems from './pages/LostItems';
import ReportLost from './pages/ReportLost';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminSignup from './pages/AdminSignup';
import ClaimedDetails from './pages/ClaimedDetails';
import './App.css';

// AdminRoute: Protects the dashboard from regular students
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lost" element={<LostItems />} />
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/found" element={<FoundItems />} />
          <Route path="/report-found" element={<ReportFound />} />
          
          {/* About Page */}
          <Route path="/about" element={<About />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin-signup" element={
            <AdminRoute>
              <AdminSignup />
            </AdminRoute>
          } />
          <Route path="/claimed" element={
            <AdminRoute>
              <ClaimedDetails />
            </AdminRoute>
          } />

          {/* Catch-all: Redirect any broken links to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;