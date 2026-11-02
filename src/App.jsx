import React, { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  if (isAdmin) return <AdminPanel onLogout={() => setIsAdmin(false)} />;
  if (user) return <Dashboard user={user} onLogout={() => setUser(null)} />;
  
  return <Login onLogin={setUser} onAdminLogin={() => setIsAdmin(true)} />;
}

export default App;