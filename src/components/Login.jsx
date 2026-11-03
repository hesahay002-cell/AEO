import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Login({ onLogin, onAdminLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);

  // ================= META WHATSAPP API SETTINGS =================
  // YAHAN APNA META API TOKEN AUR PHONE ID DAALEIN
  const META_TOKEN = "EAAUzbFPL5GIBSb8M09o9XYfhoCDcroxJaZCTGl985d2OqgAaZBFiZA3k1ZAWoDhfMzQe2mN8O2tTzLtpAHyxlpaCc9ybSGu1SkAl4f24tjnSfpIyu6gct8CmPVpYijcq8KOAi8TQvQ780W7oDG8PtzkaDqZBS2pLGvgMY3lTUOFkoqGUf8DxvbhXiRGHt3v5sLAZDZD"; 
  const PHONE_NUMBER_ID = "1258484434020011";
  // ==============================================================

  const sendWhatsAppOTP = async (phoneNumber, otpCode) => {
    const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: `91${phoneNumber}`, // India country code added automatically
      type: "template",
      template: {
        name: "aeo_login_otp",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [ { type: "text", text: otpCode } ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [ { type: "text", text: otpCode } ]
          }
        ]
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return true;
    } catch (err) {
      console.error("WhatsApp API Error:", err);
      return false;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // ADMIN BYPASS
    if (phone === 'admin' || phone === '1234567890') {
        onAdminLogin();
        return;
    }

    if (phone.length !== 10) {
        return setError("Please enter a valid 10-digit mobile number.");
    }

    setLoading(true);
    try {
      // Check if student exists in database
      const q = query(collection(db, "students"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("Your number is not registered. Please contact Safal Academy.");
        setLoading(false);
        return;
      }

      // Student found
      const student = querySnapshot.docs[0].data();
      setStudentData({ id: querySnapshot.docs[0].id, ...student });

      // Generate 4-digit Random OTP
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);

      // Send OTP via Meta WhatsApp API
      const isSent = await sendWhatsAppOTP(phone, newOtp);
      
      if (isSent) {
          setStep(2);
      } else {
          // Failsafe: Agar API fail ho jaye toh screen par OTP dikha do (Testing ke liye)
          alert(`API Error! Your OTP is: ${newOtp} (Check console for API error details)`);
          setStep(2);
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    if (otp === generatedOtp) {
      onLogin(studentData);
    } else {
      setError("Invalid OTP! Please check your WhatsApp and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900 rounded-full blur-[150px] opacity-30"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-900 rounded-full blur-[150px] opacity-20"></div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-500 mb-2 tracking-wide">AEO PORTAL</h1>
          <p className="text-gray-400 font-medium">Academic Excellence Olympiad</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-6 text-center text-sm font-semibold">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
            <div>
              <label className="block text-gray-400 font-bold mb-2 text-sm uppercase tracking-wider">WhatsApp Number</label>
              <div className="flex bg-black border-2 border-gray-700 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
                <span className="flex items-center px-4 bg-gray-800 text-gray-300 font-bold border-r border-gray-700">+91</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0,10))}
                  placeholder="Enter 10-digit number"
                  className="w-full bg-transparent text-white text-xl p-4 outline-none font-bold placeholder-gray-600"
                  autoComplete="off"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending OTP...' : 'Get OTP on WhatsApp'}
            </button>
            
            <p className="text-center text-gray-500 text-xs mt-4">
              Protected by Meta WhatsApp Business API
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <div className="text-center mb-2">
              <p className="text-green-400 font-bold">OTP sent to +91 {phone}</p>
              <button type="button" onClick={() => setStep(1)} className="text-blue-400 text-sm underline hover:text-blue-300 mt-1">Change Number</button>
            </div>
            
            <div>
              <label className="block text-gray-400 font-bold mb-2 text-sm uppercase tracking-wider">Enter 4-Digit OTP</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                placeholder="• • • •"
                className="w-full bg-black border-2 border-gray-700 rounded-xl text-white text-center text-3xl tracking-[1em] p-4 outline-none focus:border-blue-500 transition-colors font-bold"
                autoComplete="off"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all mt-2"
            >
              Verify & Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
