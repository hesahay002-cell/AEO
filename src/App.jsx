import React, { useState } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aeo_student');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (userData) => {
    localStorage.setItem('aeo_student', JSON.stringify(userData));
    setUser(userData);
    setIsAdmin(false);
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('aeo_student');
    setUser(null);
    setIsAdmin(false);
  };

  if (isAdmin) {
    return <AdminPanel onBack={() => setIsAdmin(false)} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
  }

  // Yahan ab poora functional Dashboard render hoga jo tests fetch karega!
  return <Dashboard user={user} onLogout={handleLogout} />;
}
