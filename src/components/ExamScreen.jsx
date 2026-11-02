import React, { useState, useEffect } from 'react';

export default function ExamScreen({ onFinish }) {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            alert("Test Auto-Submitted due to multiple tab switches (Chori ki roktham).");
            onFinish();
          } else {
            alert("Warning: Do not switch tabs. 1 more warning will auto-submit your test.");
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [onFinish]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Time is up! Auto-submitting.");
      onFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFinish]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 className="text-red-500 font-bold text-xl">AEO Live Test</h2>
        <div className="text-yellow-400 font-mono text-xl">
          Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
        </div>
      </div>
      <div className="mb-4">
        <div className="flex gap-2 mb-6">
          {[1,2,3,4,5].map(q => <button key={q} className="w-10 h-10 bg-gray-800 border border-blue-500 rounded text-center">{q}</button>)}
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-green-500 min-h-[300px]">
          <h3 className="text-xl mb-4 text-yellow-300">Q1. Sample Question from Firebase JSON?</h3>
          <div className="flex flex-col gap-3">
            {['Option A', 'Option B', 'Option C', 'Option D'].map(opt => (
              <label key={opt} className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700 flex items-center gap-3">
                <input type="radio" name="q1" className="w-4 h-4"/> {opt}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Previous</button>
        <button className="px-6 py-2 bg-green-600 text-white rounded font-bold" onClick={() => {
          alert("Thank you! Test Submitted.\nReview will be available on 20 June after 4 PM.");
          onFinish();
        }}>Submit Test</button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Next</button>
      </div>
    </div>
  );
}