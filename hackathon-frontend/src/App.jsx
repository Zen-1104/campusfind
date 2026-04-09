import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Auth from './pages/Auth';
import './App.css';

// Direct check for authentication state
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lost" element={<LostItems />} />
          <Route path="/found" element={<FoundItems />} />
          <Route path="/report-found" element={<ReportFound />} />
          
          {/* Protected Route for Reporting Lost Items */}
          <Route 
            path="/report-lost" 
            element={
              <ProtectedRoute>
                <ReportLost />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;