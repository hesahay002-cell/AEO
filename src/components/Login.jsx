import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Login({ onLogin, onAdminLogin }) {
  const [formData, setFormData] = useState({ name: '', school: '', className: '', phone: '' });
  const [adminPin, setAdminPin] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.school || !formData.className || !formData.phone) {
      alert("Kripya sabhi details bharein!");
      return;
    }
    alert("Testing Mode Active: Login ke liye OTP '123456' use karein.");
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp === '123456') {
      const user = { uid: formData.phone, ...formData };
      try {
        await setDoc(doc(db, "students", formData.phone), {
          ...formData,
          joinedAt: new Date().toISOString()
        });
        onLogin(user);
      } catch (error) {
        console.error("Database error:", error);
        onLogin(user); 
      }
    } else {
      alert("Galat OTP! Testing ke liye '123456' dalein.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{backgroundColor: 'black'}}>
      <div className="absolute top-2 right-2 flex flex-col opacity-20 hover:opacity-100 transition-opacity">
        <input 
          type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} 
          placeholder="PIN" className="w-16 p-1 text-xs text-center rounded bg-gray-800 text-yellow-400 border border-gray-600 outline-none"
        />
        <button onClick={() => { if(adminPin === '525077') onAdminLogin(); else alert("Wrong PIN"); }} 
          className="mt-1 bg-red-600 text-white text-xs py-1 rounded">Admin</button>
      </div>

      <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl shadow-[0_0_20px_rgba(0,0,255,0.5)] p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-red-500 text-center mb-2">AEO</h1>
        <h2 className="text-xl font-semibold text-yellow-400 text-center mb-8">Academic Excellence Olympiad</h2>
        
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <input type="text" placeholder="Student Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            <input type="text" placeholder="School Name" required onChange={(e) => setFormData({...formData, school: e.target.value})} className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            
            {/* New Class Dropdown */}
            <select required value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none">
              <option value="" disabled>Select Class / Category</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="Graduation">Graduation</option>
              <option value="Government Job">Government Job</option>
            </select>

            <input type="tel" placeholder="WhatsApp Mobile Number" required onChange={(e) => setFormData({...formData, phone: e.target.value})} className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            <button type="submit" className="mt-4 p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input type="text" placeholder="Enter OTP (123456)" required onChange={(e) => setOtp(e.target.value)} className="p-3 text-center tracking-widest bg-black text-yellow-300 border border-green-500 rounded-lg outline-none text-2xl"/>
            <button type="submit" className="mt-4 p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Verify & Login</button>
          </form>
        )}
      </div>
    </div>
  );
}
