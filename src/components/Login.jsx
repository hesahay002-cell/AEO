import React, { useState } from 'react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Login({ onLogin, onAdminLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const requestOtp = (e) => {
    e.preventDefault();
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, "+91" + phone, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        setShowOtp(true);
        alert("OTP bhej diya gaya hai!");
      }).catch((error) => {
        console.error(error);
        alert("Error: " + error.message);
      });
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    window.confirmationResult.confirm(otp).then((result) => {
      onLogin(result.user);
    }).catch((error) => {
      alert("Galat OTP!");
    });
  };

  const handleAdminAuth = () => {
    if (adminPin === '525077') onAdminLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{backgroundColor: 'black'}}>
      <div className="absolute top-2 right-2 flex flex-col opacity-20 hover:opacity-100 transition-opacity">
        <input 
          type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} 
          placeholder="Pin" className="w-16 p-1 text-xs text-center rounded bg-gray-800 text-yellow-400 border border-gray-600 outline-none"
        />
        <button onClick={handleAdminAuth} className="mt-1 bg-red-600 text-white text-xs py-1 rounded">Admin</button>
      </div>
      <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl shadow-[0_0_20px_rgba(0,0,255,0.5)] p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-red-500 text-center mb-2">AEO</h1>
        <h2 className="text-xl font-semibold text-yellow-400 text-center mb-8">Academic Excellence Olympiad</h2>
        {!showOtp ? (
          <form onSubmit={requestOtp} className="flex flex-col gap-4">
            <input type="text" placeholder="Student Name" required className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            <input type="text" placeholder="School Name" required className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            <select required className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none">
              <option value="">Select Class</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp Mobile Number" required className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none"/>
            <button type="submit" className="mt-4 p-3 bg-blue-600 text-white font-bold rounded-lg">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="flex flex-col gap-4">
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required className="p-3 bg-black text-yellow-300 border border-green-500 rounded-lg outline-none text-center text-2xl tracking-widest"/>
            <button type="submit" className="mt-4 p-3 bg-green-600 text-white font-bold rounded-lg">Verify & Login</button>
          </form>
        )}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}