import React, { useState } from 'react';
import ExamScreen from './ExamScreen.jsx';

export default function Dashboard({ user, onLogout }) {
  const [startExam, setStartExam] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);

  if (startExam) return <ExamScreen onFinish={() => setStartExam(false)} />;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto border-2 border-green-500 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Welcome to AEO Dashboard</h1>
        <p className="text-yellow-400 mb-6">Choose your test from the available options below.</p>
        
        {!acceptedRules ? (
          <div className="bg-gray-900 p-6 rounded-lg border border-blue-500">
            <h2 className="text-xl font-bold text-red-400 mb-4">Important Instructions (Hindi / English)</h2>
            <ul className="list-disc pl-5 text-gray-300 space-y-2 mb-6">
              <li>Ye test JEE-Mains aur NATA ke pattern par aadharit hai.</li>
              <li>Timer automatically chalu ho jayega.</li>
              <li>Tab/Screen badalne par warning aayegi. Do baar badalne par test auto-submit ho jayega.</li>
              <li>Aap language kabhi bhi change kar sakte hain.</li>
              <li>Sabhi 10 niyam dhyaan se padhein.</li>
            </ul>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={acceptedRules} onChange={(e) => setAcceptedRules(e.target.checked)} className="w-5 h-5"/>
              <span className="text-yellow-300">I have read and understood the rules.</span>
            </label>
            <button 
              disabled={!acceptedRules} 
              onClick={() => setStartExam(true)} 
              className="px-6 py-2 bg-green-600 disabled:bg-gray-600 text-white rounded-lg font-bold"
            >
              Start Test
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}