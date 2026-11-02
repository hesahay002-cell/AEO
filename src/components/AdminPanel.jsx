import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newTest, setNewTest] = useState({
    class: '',
    subject: '',
    marks: '',
    duration: '',
    startTime: '',
    endTime: '',
    jsonInput: ''
  });

  useEffect(() => {
    fetchTests();
    fetchStudents();
  }, []);

  const fetchTests = async () => {
    const querySnapshot = await getDocs(collection(db, "tests"));
    const testsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTests(testsData);
  };

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(studentsData);
  };

  const handleGenerateTest = async () => {
    if (!newTest.class || !newTest.subject || !newTest.jsonInput) {
      alert("Please fill all required fields and provide JSON data.");
      return;
    }
    
    try {
      setLoading(true);
      const questions = JSON.parse(newTest.jsonInput);
      
      await addDoc(collection(db, "tests"), {
        className: newTest.class,
        subject: newTest.subject,
        marksPerQuestion: Number(newTest.marks),
        durationMinutes: Number(newTest.duration),
        startTime: newTest.startTime,
        endTime: newTest.endTime,
        questions: questions,
        createdAt: new Date().toISOString(),
        status: "active"
      });
      
      alert("Test Generated Successfully!");
      setNewTest({ class: '', subject: '', marks: '', duration: '', startTime: '', endTime: '', jsonInput: '' });
      fetchTests();
    } catch (error) {
      alert("Invalid JSON format! Please check your questions data.\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (id) => {
    if(window.confirm("Are you sure you want to delete this test?")) {
      await deleteDoc(doc(db, "tests", id));
      fetchTests();
    }
  };

  const downloadStudentData = () => {
    if (students.length === 0) {
      alert("No student data available to download.");
      return;
    }
    const headers = ["Name", "School", "Class", "WhatsApp", "Joined At"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + students.map(s => `${s.name},${s.school},${s.className},${s.phone || s.uid},${s.joinedAt}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AEO_Students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = () => {
    const promptText = `Generate 10 multiple choice questions for [Subject] class [Class] in the exact following JSON format only, with no markdown or extra text:\n[{"question": "What is...", "options": ["A", "B", "C", "D"], "answer": "Correct Option String"}]`;
    navigator.clipboard.writeText(promptText);
    alert("ChatGPT Prompt copied to clipboard! Paste it in ChatGPT.");
  };

  return (
    <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-red-500 tracking-wider text-center md:text-left">AEO Admin Panel</h1>
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 w-full md:w-auto">Logout</button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={() => setActiveTab('generate')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(0,0,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Generate Test</button>
        <button onClick={() => setActiveTab('manage')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(0,0,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Download & Manage</button>
      </div>

      <div className="bg-gray-900 border-2 border-blue-900 rounded-3xl p-6 md:p-10 shadow-2xl">
        
        {activeTab === 'generate' && (
          <div>
            <h2 className="text-3xl text-yellow-400 font-bold mb-8 border-b border-gray-700 pb-4">Create New Test</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Class / Category</label>
                <select value={newTest.class} onChange={(e) => setNewTest({...newTest, class: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer appearance-none focus:border-blue-500 transition-colors">
                  <option value="" disabled>Select Category</option>
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
              </div>

              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Subject Name</label>
                <input type="text" placeholder="e.g. Physics" value={newTest.subject} onChange={(e) => setNewTest({...newTest, subject: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full focus:border-blue-500 transition-colors" />
              </div>

              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Marks per Question</label>
                <input type="number" placeholder="e.g. 4" value={newTest.marks} onChange={(e) => setNewTest({...newTest, marks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full focus:border-blue-500 transition-colors" />
              </div>

              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Duration (Minutes)</label>
                <input type="number" placeholder="e.g. 60" value={newTest.duration} onChange={(e) => setNewTest({...newTest, duration: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full focus:border-blue-500 transition-colors" />
              </div>

              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Test Start Time</label>
                <input type="datetime-local" value={newTest.startTime} onChange={(e) => setNewTest({...newTest, startTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full focus:border-blue-500 transition-colors" />
              </div>

              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Test End Time</label>
                <input type="datetime-local" value={newTest.endTime} onChange={(e) => setNewTest({...newTest, endTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <div className="w-full mb-8">
              <label className="text-yellow-400 text-sm font-bold mb-2 block">JSON Questions Format</label>
              <textarea 
                rows="8" 
                placeholder='[{"question":"...","options":["..."],"answer":"..."}]'
                value={newTest.jsonInput}
                onChange={(e) => setNewTest({...newTest, jsonInput: e.target.value})}
                className="p-5 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-blue-500 transition-colors"
              ></textarea>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-xl font-bold">Copy ChatGPT Prompt</button>
              <button onClick={handleGenerateTest} disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold text-2xl py-5 px-12 rounded-2xl shadow-[0_0_25px_rgba(0,255,0,0.3)] transition-transform transform active:scale-95 disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate Test (Live)'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="flex flex-col gap-12">
            <div>
              <h2 className="text-3xl text-yellow-400 font-bold mb-6 border-b border-gray-700 pb-4">Active Tests</h2>
              {tests.length === 0 ? <p className="text-gray-400 text-xl">No tests available.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tests.map(test => (
                    <div key={test.id} className="bg-black border-2 border-gray-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-500 transition-colors">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-400">{test.className} - {test.subject}</h3>
                        <p className="text-lg text-gray-400 mt-2">Duration: {test.durationMinutes} mins | Marks: {test.marksPerQuestion}/q</p>
                        <p className="text-md text-gray-500 mt-1">Total Qs: {test.questions?.length || 0}</p>
                      </div>
                      <button onClick={() => handleDeleteTest(test.id)} className="bg-red-900 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full md:w-auto">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-700 pb-4 gap-4">
                <h2 className="text-3xl text-yellow-400 font-bold">Registered Students</h2>
                <button onClick={downloadStudentData} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl w-full md:w-auto">Download CSV</button>
              </div>
              {students.length === 0 ? <p className="text-gray-400 text-xl">No students registered yet.</p> : (
                <div className="overflow-x-auto rounded-2xl border-2 border-gray-800">
                  <table className="w-full text-left bg-black border-collapse">
                    <thead className="bg-gray-800 text-yellow-400 text-xl">
                      <tr>
                        <th className="p-5 font-bold">Name</th>
                        <th className="p-5 font-bold">Class</th>
                        <th className="p-5 font-bold">School</th>
                        <th className="p-5 font-bold">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="text-lg">
                      {students.map(student => (
                        <tr key={student.id} className="border-t border-gray-800 hover:bg-gray-900 transition-colors">
                          <td className="p-5 font-semibold">{student.name}</td>
                          <td className="p-5">{student.className}</td>
                          <td className="p-5 text-gray-400">{student.school}</td>
                          <td className="p-5">{student.phone || student.uid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
