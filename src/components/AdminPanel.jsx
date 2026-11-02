import React, { useState } from 'react';

export default function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState('generate');
  const [jsonInput, setJsonInput] = useState('');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-red-500">AEO Admin Panel</h1>
        <button onClick={onLogout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('generate')} className={`px-4 py-2 rounded ${tab === 'generate' ? 'bg-blue-600' : 'bg-gray-800'}`}>Generate Test</button>
        <button onClick={() => setTab('download')} className={`px-4 py-2 rounded ${tab === 'download' ? 'bg-green-600' : 'bg-gray-800'}`}>Download & Manage</button>
      </div>

      {tab === 'generate' && (
        <div className="border border-blue-500 p-6 rounded-lg bg-gray-900">
          <h2 className="text-yellow-400 text-xl mb-4">Create New Test</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Class" className="p-2 bg-black border border-gray-600 rounded text-white"/>
            <input type="text" placeholder="Subject" className="p-2 bg-black border border-gray-600 rounded text-white"/>
            <input type="number" placeholder="Marks per Q" className="p-2 bg-black border border-gray-600 rounded text-white"/>
            <input type="number" placeholder="Negative Mark" className="p-2 bg-black border border-gray-600 rounded text-white"/>
            <input type="datetime-local" className="p-2 bg-black border border-gray-600 rounded text-white"/>
            <input type="datetime-local" className="p-2 bg-black border border-gray-600 rounded text-white"/>
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">JSON Questions Format</label>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} rows="5" className="w-full p-2 bg-black border border-gray-600 rounded text-green-400 font-mono text-sm" placeholder='[{"question":"...","options":["..."], "answer":"..."}]'></textarea>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={() => alert("Prompt template copied!")} className="text-sm text-blue-400 underline">Get ChatGPT Prompt</button>
            <button className="bg-green-600 px-6 py-2 rounded font-bold text-white">Generate Test (Live)</button>
          </div>
        </div>
      )}

      {tab === 'download' && (
        <div className="border border-green-500 p-6 rounded-lg bg-gray-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-6 bg-red-900 border border-red-500 rounded hover:bg-red-800">
            <h3 className="font-bold text-xl mb-2 text-left">Remove Past Tests</h3>
            <p className="text-xs text-gray-300 text-left">Delete expired tests from student view.</p>
          </button>
          <button className="p-6 bg-blue-900 border border-blue-500 rounded hover:bg-blue-800">
            <h3 className="font-bold text-xl mb-2 text-left">Download Student Data</h3>
            <p className="text-xs text-gray-300 text-left">Export Excel sheet of students.</p>
          </button>
          <button className="p-6 bg-yellow-900 border border-yellow-500 rounded hover:bg-yellow-800">
            <h3 className="font-bold text-xl mb-2 text-left">Download Result PDF</h3>
            <p className="text-xs text-gray-300 text-left">Beautiful PDF with rankings and marks.</p>
          </button>
          <button className="p-6 bg-purple-900 border border-purple-500 rounded hover:bg-purple-800">
            <h3 className="font-bold text-xl mb-2 text-left">Live Result Analysis</h3>
            <p className="text-xs text-gray-300 text-left">View individual sheets and detailed explanations.</p>
          </button>
        </div>
      )}
    </div>
  );
}