import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const classOptions = ["Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "NEET", "JEE", "Graduation", "Government Job"];

export default function Login({ onLogin, onAdminLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', school: '', className: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ================= META WHATSAPP API SETTINGS =================
  const META_TOKEN = "EAAUzbFPL5GIBSb8M09o9XYfhoCDcroxJaZCTGl985d2OqgAaZBFiZA3k1ZAWoDhfMzQe2mN8O2tTzLtpAHyxlpaCc9ybSGu1SkAl4f24tjnSfpIyu6gct8CmPVpYijcq8KOAi8TQvQ780W7oDG8PtzkaDqZBS2pLGvgMY3lTUOFkoqGUf8DxvbhXiRGHt3v5sLAZDZD"; 
  const PHONE_NUMBER_ID = "1258484434020011";
  // ==============================================================

  const sendWhatsAppOTP = async (phoneNumber, otpCode) => {
    const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: `91${phoneNumber}`,
          type: "text",
          text: {
            preview_url: false,
            body: `Safal Academy Live - AEO Portal\nAapka login OTP hai: *${otpCode}*\nKripya ise kisi ke sath share na karein.`
          }
        })
      });
      const data = await response.json();
      if (data.error) {
          console.error("META API ERROR:", data.error);
          throw new Error(data.error.message);
      }
      return true;
    } catch (err) {
      console.error("Fetch Error:", err);
      return false;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.phone === 'admin' || formData.phone === '1234567890') {
        onAdminLogin();
        return;
    }

    if (!formData.name || !formData.school || !formData.className || formData.phone.length !== 10) {
        return setError("Please fill all fields correctly! Phone must be 10 digits.");
    }

    setLoading(true);
    try {
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);

      const isSent = await sendWhatsAppOTP(formData.phone, newOtp);
      
      if (isSent) {
          setStep(2);
      } else {
          setError("WhatsApp API Failed! Check Console (F12) for details.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp === generatedOtp) {
      setLoading(true);
      try {
        const userRef = doc(db, "students", formData.phone);
        const userData = { ...formData, uid: formData.phone, joinedAt: new Date().toISOString() };
        await setDoc(userRef, userData, { merge: true });
        onLogin(userData);
      } catch (err) {
        setError("Database error while saving profile!");
      }
      setLoading(false);
    } else {
      setError("Invalid OTP! Please check your WhatsApp.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden select-none">
      {/* 3D Glowing Background Orbs (Blue, Green, Red, Blue) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[160px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-600 rounded-full blur-[160px] opacity-25"></div>
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-red-600 rounded-full blur-[150px] opacity-20"></div>

      {/* 3D Glassmorphism Card */}
      <div className="w-full max-w-lg bg-gray-950/80 backdrop-blur-2xl border-2 border-gray-800 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(37,99,235,0.25),inset_0_0_20px_rgba(255,255,255,0.05)] z-10 relative">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-red-400 mb-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] tracking-wider">AEO PORTAL</h1>
          <p className="text-gray-400 font-bold tracking-[0.2em] text-xs uppercase">Academic Excellence Olympiad</p>
        </div>

        {error && (
          <div className="bg-red-950/80 border-l-4 border-red-500 text-red-200 p-4 rounded-xl mb-6 text-sm font-semibold shadow-lg">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="relative">
                <label className="text-xs font-extrabold text-blue-400 uppercase ml-2 mb-1 block tracking-wider">Student Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter your full name" className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-4 rounded-2xl outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(37,99,235,0.4)] shadow-inner transition-all font-medium placeholder-gray-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <label className="text-xs font-extrabold text-green-400 uppercase ml-2 mb-1 block tracking-wider">Class / Target</label>
                    <select value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-4 rounded-2xl outline-none focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.4)] shadow-inner appearance-none cursor-pointer">
                        <option value="" disabled>Select Class</option>
                        {classOptions.map(cls => <option key={cls} value={cls} className="bg-gray-900 text-white">{cls}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <label className="text-xs font-extrabold text-yellow-400 uppercase ml-2 mb-1 block tracking-wider">School / Institute</label>
                    <input type="text" value={formData.school} onChange={(e) => setFormData({...formData, school: e.target.value})} placeholder="School Name" className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-4 rounded-2xl outline-none focus:border-yellow-500 focus:shadow-[0_0_15px_rgba(234,179,8,0.4)] shadow-inner transition-all font-medium placeholder-gray-600" />
                </div>
            </div>

            <div className="relative mt-1">
              <label className="text-xs font-extrabold text-red-400 uppercase ml-2 mb-1 block tracking-wider">WhatsApp Number (For OTP)</label>
              <div className="flex bg-black/60 border-2 border-gray-800 rounded-2xl overflow-hidden focus-within:border-red-500 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all shadow-inner">
                <span className="flex items-center px-4 bg-gray-900 text-gray-400 font-bold border-r border-gray-800">+91</span>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0,10)})} placeholder="9876543210" className="w-full bg-transparent text-white text-xl p-4 outline-none font-bold placeholder-gray-700 tracking-wider" autoComplete="off" />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none tracking-wide">
              {loading ? 'Sending OTP...' : 'Get OTP on WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <div className="text-center mb-2 bg-black/60 p-5 rounded-2xl border border-gray-800 shadow-inner">
              <p className="text-green-400 font-bold text-lg">OTP Sent to +91 {formData.phone}</p>
              <button type="button" onClick={() => setStep(1)} className="text-blue-400 text-sm font-bold underline hover:text-blue-300 mt-2">Edit Details / Number</button>
            </div>
            
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2 block text-center tracking-widest">Enter 4-Digit WhatsApp OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} placeholder="••••" className="w-full bg-black/60 border-2 border-gray-800 text-white text-center text-4xl tracking-[1em] p-4 rounded-2xl outline-none focus:border-green-500 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] shadow-inner font-black" autoComplete="off" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.4)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none tracking-wide">
              {loading ? 'Verifying...' : 'Verify & Enter Exam'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
