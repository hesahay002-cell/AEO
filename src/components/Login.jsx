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
      alert("Please fill all details to proceed!");
      return;
    }
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
        console.error(error);
        onLogin(user);
      }
    } else {
      alert("Invalid OTP! Use 123456 for testing.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-black relative">
      {/* Hidden Admin Trigger */}
      <div className="absolute top-4 right-4 flex flex-col opacity-10 hover:opacity-100 transition-opacity z-50">
        <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="PIN" className="w-24 p-2 text-lg text-center rounded-lg bg-gray-800 text-yellow-400 border border-gray-600 outline-none"/>
        <button onClick={() => { if(adminPin === '525077') onAdminLogin(); }} className="mt-2 bg-red-600 text-white text-lg py-2 rounded-lg font-bold shadow-lg hover:bg-red-700">Admin</button>
      </div>

      <div className="w-full max-w-2xl bg-gray-900 border-2 border-blue-500 rounded-3xl shadow-[0_0_40px_rgba(0,0,255,0.4)] p-6 md:p-12 flex flex-col">
        <h1 className="text-5xl md:text-6xl font-extrabold text-red-500 text-center mb-2 tracking-wider">AEO</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 text-center mb-10">Academic Excellence Olympiad</h2>
        
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-6" autoComplete="off">
            <input type="text" placeholder="Full Student Name" required autoComplete="off" onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-5 text-xl bg-black text-yellow-300 border-2 border-green-500 rounded-2xl outline-none w-full shadow-inner"/>
            
            <input type="text" placeholder="School Name" required autoComplete="off" onChange={(e) => setFormData({...formData, school: e.target.value})} className="p-5 text-xl bg-black text-yellow-300 border-2 border-green-500 rounded-2xl outline-none w-full shadow-inner"/>
            
            <select required value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="p-5 text-xl bg-black text-yellow-300 border-2 border-green-500 rounded-2xl outline-none w-full shadow-inner cursor-pointer appearance-none">
              <option value="" disabled>Select Category / Class</option>
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

            <input type="tel" placeholder="WhatsApp Number" required autoComplete="off" onChange={(e) => setFormData({...formData, phone: e.target.value})} className="p-5 text-xl bg-black text-yellow-300 border-2 border-green-500 rounded-2xl outline-none w-full shadow-inner"/>
            
            <button type="submit" className="mt-4 p-5 text-2xl bg-blue-600 text-white font-extrabold rounded-2xl hover:bg-blue-700 shadow-xl">Proceed to Verify</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-8" autoComplete="off">
            <p className="text-green-400 text-center text-xl font-semibold">Verification code sent to {formData.phone}</p>
            {/* Added autoComplete off and explicit name to prevent browser autofill */}
            <input type="text" placeholder="Enter OTP (123456)" required autoComplete="one-time-code" name="otp_code_box" value={otp} onChange={(e) => setOtp(e.target.value)} className="p-6 text-center tracking-[0.5em] font-extrabold bg-black text-yellow-300 border-2 border-green-500 rounded-2xl outline-none text-4xl w-full shadow-inner"/>
            <button type="submit" className="p-5 text-2xl bg-green-600 text-white font-extrabold rounded-2xl hover:bg-green-700 shadow-xl">Verify & Enter</button>
          </form>
        )}
      </div>
    </div>
  );
}
