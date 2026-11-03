import React, { useState } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel'; // Apne project ke mutabiq path check kar lein

export default function App() {
  // 1. App khulte hi check karega ki kya student pehle se logged-in hai
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aeo_student');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (userData) => {
    // 2. Login hote hi localStorage mein data save kar lo
    localStorage.setItem('aeo_student', JSON.stringify(userData));
    setUser(userData);
    setIsAdmin(false);
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    // 3. Logout par localStorage clear kar do
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            Welcome, {user.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Class: {user.className} | School: {user.school}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]">
          Logout
        </button>
      </div>

      {/* Aapka Student Dashboard / Exam Screen */}
      <div className="max-w-4xl mx-auto bg-gray-950 border border-gray-800 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-xl font-bold text-blue-400 mb-4">Available Tests</h2>
        <p className="text-gray-400">Aapka test portal yahan active hai. Ab bar-bar WhatsApp par OTP nahi aayega!</p>
      </div>
    </div>
  );
}
