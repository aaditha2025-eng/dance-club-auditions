import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDetails from './pages/StudentDetails';
import TeamsOverview from './pages/TeamsOverview';
import ScoresOverview from './pages/ScoresOverview';
import FinalReview from './pages/FinalReview';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAppContext();

  return (
    <Router>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={
          currentUser ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/:id" element={
          <ProtectedRoute>
            <StudentDetails />
          </ProtectedRoute>
        } />
        <Route path="/teams" element={
          <ProtectedRoute>
            <TeamsOverview />
          </ProtectedRoute>
        } />
        <Route path="/scores" element={
          <ProtectedRoute>
            <ScoresOverview />
          </ProtectedRoute>
        } />
        <Route path="/review" element={
          <ProtectedRoute>
            <FinalReview />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
