import React, { useState } from 'react';
import Login from './components/Login';
// Aur aapke baaki components...

export default function App() {
  // 1. App khulte hi check karega ki kya student pehle se logged-in hai
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aeo_student');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    // 2. Login hote hi localStorage mein data save kar lo
    localStorage.setItem('aeo_student', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    // 3. Logout par localStorage clear kar do
    localStorage.removeItem('aeo_student');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} onAdminLogin={/* admin handler */} />;
  }

  return (
    <div>
      {/* Aapka Student Dashboard ya Exam Screen */}
      <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-xl">
        Logout
      </button>
    </div>
  );
}
