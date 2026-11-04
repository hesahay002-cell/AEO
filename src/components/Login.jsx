import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 

const classOptions = ["Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "NEET", "JEE", "Graduation", "Government Job"];

export default function Login({ onLogin, onAdminLogin }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [profileData, setProfileData] = useState({ name: '', school: '', className: '' });
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // ================= META WHATSAPP API CREDENTIALS =================
  const META_TOKEN = "EAAUzbFPL5GIBSb8M09o9XYfhoCDcroxJaZCTGl985d2OqgAaZBFiZA3k1ZAWoDhfMzQe2mN8O2tTzLtpAHyxlpaCc9ybSGu1SkAl4f24tjnSfpIyu6gct8CmPVpYijcq8KOAi8TQvQ780W7oDG8PtzkaDqZBS2pLGvgMY3lTUOFkoqGUf8DxvbhXiRGHt3v5sLAZDZD"; 
  const PHONE_NUMBER_ID = "1258484434020011";

  // FINAL WHATSAPP OTP FUNCTION (Meta Auth Template Puzzle Solved!)
  const sendWhatsAppOTP = async (phoneNumber, otpCode) => {
    const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: `91${phoneNumber}`,
      type: "template",
      template: {
        name: "aeo_login_otp",
        language: { code: "en_US" },
        // SUPER FIX: Meta ke naye Auth Templates mein sirf Button bhejte hain, 
        // Body automatically fill ho jati hai. Aur index string "0" hona chahiye!
        components: [
          {
            type: "button",
            sub_type: "url",
            index: "0", 
            parameters: [
              { type: "text", text: otpCode }
            ]
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }
    return true;
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) return setError("Please enter a valid 10-digit WhatsApp number.");

    setLoading(true);
    try {
      const userRef = doc(db, "students", phone);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setIsExistingUser(true);
        setProfileData(userSnap.data());
      } else {
        setIsExistingUser(false);
      }

      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      
      await sendWhatsAppOTP(phone, newOtp);
      
      setOtp('');
      setStep(2);
      
    } catch (err) {
      setError("Meta Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    
    if (otp === generatedOtp) {
      if (isExistingUser) {
        setStep(4);
      } else {
        setStep(3); 
      }
    } else {
      setError("Invalid OTP! Please check your WhatsApp.");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!profileData.name || !profileData.school || !profileData.className) {
      return setError("All fields are required to register!");
    }

    setLoading(true);
    try {
      const userRef = doc(db, "students", phone);
      const userData = { ...profileData, phone, uid: phone, joinedAt: new Date().toISOString() };
      await setDoc(userRef, userData, { merge: true });
      setProfileData(userData);
      setStep(4); 
    } catch (err) {
      setError("Database Error!");
    }
    setLoading(false);
  };

  const handleEnterExam = () => {
    onLogin({ ...profileData, phone, uid: phone });
  };

  const handleSecretAdminLogin = () => {
    if (adminPassword === '525077') {
      onAdminLogin();
      setShowAdminSecret(false);
      setAdminPassword('');
    } else {
      setShowAdminSecret(false);
      setAdminPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden select-none">
      
      {/* ================= SECRET ADMIN HOVER ================= */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 z-40 cursor-default"
        onMouseEnter={() => setShowAdminSecret(true)}
      ></div>
      {showAdminSecret && (
        <div 
          className="absolute top-4 right-4 bg-gray-950 border-2 border-gray-800 p-2 rounded-xl z-50 flex gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
          onMouseLeave={() => setShowAdminSecret(false)}
        >
          <input 
            type="password" 
            value={adminPassword} 
            onChange={(e) => setAdminPassword(e.target.value)} 
            placeholder="Passcode" 
            className="bg-black text-red-400 font-bold px-3 py-1.5 rounded-lg w-28 text-sm outline-none border border-gray-800 focus:border-red-500 text-center tracking-widest shadow-inner" 
            autoFocus 
            onKeyDown={(e) => e.key === 'Enter' && handleSecretAdminLogin()} 
          />
          <button 
            type="button" 
            onClick={handleSecretAdminLogin} 
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-black shadow-lg"
          >
            OK
          </button>
        </div>
      )}

      {/* ================= 3D BACKGROUND ORBS ================= */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[160px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-600 rounded-full blur-[160px] opacity-15"></div>

      {/* ================= MAIN GLASS CARD ================= */}
      <div className={`w-full ${step === 4 ? 'max-w-3xl' : 'max-w-lg'} bg-gray-950/80 backdrop-blur-2xl border border-gray-800 p-8 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] z-10 relative transition-all duration-500`}>
        
        {step !== 4 && (
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-red-400 mb-2 drop-shadow-lg tracking-wider">AEO PORTAL</h1>
            <p className="text-gray-400 font-bold tracking-[0.2em] text-xs uppercase">Academic Excellence Olympiad</p>
          </div>
        )}

        {/* ERROR MESSAGE BOX */}
        {error && <div className="bg-red-950/80 border-l-4 border-red-500 text-red-200 p-4 rounded-xl mb-6 text-sm font-bold shadow-lg break-words">{error}</div>}

        {/* STEP 1: PHONE NUMBER */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-6">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-2">Secure Student Login</h2>
              <p className="text-gray-400 text-sm">Please enter your WhatsApp number to begin.</p>
            </div>
            <div className="relative">
              <label className="text-xs font-extrabold text-blue-400 uppercase ml-2 mb-2 block tracking-wider">WhatsApp Number</label>
              <div className="flex bg-black/60 border-2 border-gray-800 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all shadow-inner">
                <span className="flex items-center px-4 bg-gray-900 text-gray-400 font-bold border-r border-gray-800">+91</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0,10))} placeholder="9876543210" className="w-full bg-transparent text-white text-2xl p-4 outline-none font-bold tracking-widest" autoFocus />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-0.5">
              {loading ? 'Authenticating...' : 'Send OTP on WhatsApp'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <div className="text-center mb-2 bg-black/40 p-4 rounded-2xl border border-gray-800 shadow-inner">
              <p className="text-green-400 font-bold">OTP sent securely to +91 {phone}</p>
              <button type="button" onClick={() => setStep(1)} className="text-blue-400 text-xs font-bold underline mt-2 hover:text-blue-300">Change Number</button>
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2 block text-center tracking-widest">Enter 4-Digit OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} placeholder="••••" className="w-full bg-black/60 border-2 border-gray-800 text-white text-center text-4xl tracking-[1em] p-4 rounded-2xl outline-none focus:border-green-500 focus:shadow-[0_0_20px_rgba(34,197,94,0.4)] shadow-inner font-black" autoFocus />
            </div>
            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5">
              Verify Identity
            </button>
          </form>
        )}

        {/* STEP 3: NEW STUDENT PROFILE */}
        {step === 3 && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white">Welcome! Complete Profile</h2>
              <p className="text-gray-400 text-sm mt-1">First-time registration for +91 {phone}</p>
            </div>
            <div className="relative">
                <label className="text-xs font-extrabold text-blue-400 uppercase ml-2 mb-1 block">Full Name</label>
                <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} placeholder="Rahul Kumar" className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-3.5 rounded-2xl outline-none focus:border-blue-500 shadow-inner font-medium" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <label className="text-xs font-extrabold text-green-400 uppercase ml-2 mb-1 block">Class / Target</label>
                    <select value={profileData.className} onChange={(e) => setProfileData({...profileData, className: e.target.value})} className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-3.5 rounded-2xl outline-none focus:border-green-500 shadow-inner appearance-none cursor-pointer">
                        <option value="" disabled>Select Class</option>
                        {classOptions.map(cls => <option key={cls} value={cls} className="bg-gray-900 text-white">{cls}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <label className="text-xs font-extrabold text-yellow-400 uppercase ml-2 mb-1 block">School / Institute</label>
                    <input type="text" value={profileData.school} onChange={(e) => setProfileData({...profileData, school: e.target.value})} placeholder="DAV Public School" className="w-full bg-black/60 border-2 border-gray-800 text-white text-lg p-3.5 rounded-2xl outline-none focus:border-yellow-500 shadow-inner font-medium" />
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5">
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        )}

        {/* STEP 4: INSTRUCTIONS & WARNINGS */}
        {step === 4 && (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-white">AEO EXAM GUIDELINES</h1>
              <p className="text-blue-400 font-bold text-sm uppercase mt-1">Read Carefully Before Proceeding</p>
            </div>
            
            <div className="bg-black/50 border border-gray-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6 shadow-inner">
              
              {/* English Section */}
              <div>
                <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2 mb-3">📌 Important Instructions</h3>
                <ul className="list-disc list-outside ml-5 text-gray-300 text-sm space-y-2 leading-relaxed">
                  <li><strong className="text-blue-400">About AEO:</strong> The Academic Excellence Olympiad is a highly secure, time-bound examination designed to test your core conceptual clarity.</li>
                  <li><strong className="text-red-400">Anti-Cheat System Active:</strong> If you try to open a new tab, switch applications, or split the screen, the system will record a warning. Multiple warnings may auto-submit your exam.</li>
                  <li><strong className="text-yellow-400">Do Not Refresh:</strong> Do NOT press F5, back button, or refresh the page during the test. Doing so may terminate your session.</li>
                  <li>Ensure you have a stable internet connection. If disconnected, answers saved up to that point will be submitted.</li>
                </ul>
              </div>

              {/* Hindi Section */}
              <div>
                <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2 mb-3">📌 महत्वपूर्ण निर्देश</h3>
                <ul className="list-disc list-outside ml-5 text-gray-300 text-sm space-y-2 leading-relaxed">
                  <li><strong className="text-blue-400">AEO के बारे में:</strong> यह एक अत्यंत सुरक्षित और समयबद्ध परीक्षा है। यह परीक्षा आपकी वैचारिक स्पष्टता (Conceptual Clarity) को परखने के लिए बनाई गई है।</li>
                  <li><strong className="text-red-400">एंटी-चीट वार्निंग:</strong> परीक्षा के दौरान अगर आप नया टैब खोलते हैं, किसी अन्य ऐप पर जाते हैं, या स्क्रीन बदलते हैं, तो सिस्टम चेतावनी दर्ज करेगा। ज्यादा चेतावनी मिलने पर परीक्षा अपने आप सबमिट हो जाएगी।</li>
                  <li><strong className="text-yellow-400">पेज रिफ्रेश न करें:</strong> टेस्ट के दौरान गलती से भी 'Back' बटन या 'Refresh' (F5) न दबाएं। ऐसा करने से आपकी परीक्षा रद्द हो सकती है।</li>
                  <li>कृपया सुनिश्चित करें कि आपका इंटरनेट कनेक्शन स्थिर है।</li>
                </ul>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
              <button onClick={handleEnterExam} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.4)] transform hover:-translate-y-1 transition-all uppercase tracking-wide">
                I Agree, Show Available Tests
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
