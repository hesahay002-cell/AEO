import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';

const classOptions = ["Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "NEET", "JEE", "Graduation", "Government Job"];

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Test Generation State
  const [newTest, setNewTest] = useState({ class: '', subject: '', marks: '', negativeMarks: '', duration: '', startTime: '', endTime: '', jsonInput: '' });

  // Manage Section States
  const [resultClass, setResultClass] = useState('');
  const [resultTest, setResultTest] = useState('');
  
  const [csvClass, setCsvClass] = useState('All');
  
  const [deleteClass, setDeleteClass] = useState('');
  const [deleteTest, setDeleteTest] = useState('');

  const [appendClass, setAppendClass] = useState('');
  const [appendTest, setAppendTest] = useState('');
  const [appendJson, setAppendJson] = useState('');

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

  // ================= AUTO-CORRECT JSON LOGIC =================
  const sanitizeJSON = (jsonString) => {
    let cleanStr = jsonString.replace(/```json/gi, '').replace(/```/gi, '').trim(); // Remove Markdown
    cleanStr = cleanStr.replace(/,\s*([\]}])/g, '$1'); // Fix trailing commas
    return cleanStr;
  };

  const copyPrompt = () => {
    const promptText = `Generate 10 multiple choice questions for [Subject] class [Class]. 
Provide the questions and review (solution) in BOTH English and Hindi. 
Output strictly in VALID JSON format with NO MARKDOWN tags (do not use \`\`\`json). 
Use exactly this structure:
[
  {
    "question": "Eng: [Question here]\\nHin: [प्रश्न यहाँ]",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Exact correct option string",
    "review": "Eng: [Explanation]\\nHin: [व्याख्या]"
  }
]`;
    navigator.clipboard.writeText(promptText);
    alert("Premium AI Prompt copied! Paste it in ChatGPT/Claude.");
  };

  const handleGenerateTest = async () => {
    if (!newTest.class || !newTest.subject || !newTest.jsonInput || !newTest.marks || !newTest.negativeMarks) {
      alert("Please fill all required fields including Negative Marks and JSON data.");
      return;
    }
    try {
      setLoading(true);
      const cleanJson = sanitizeJSON(newTest.jsonInput);
      const questions = JSON.parse(cleanJson);
      
      await addDoc(collection(db, "tests"), {
        className: newTest.class,
        subject: newTest.subject,
        marksPerQuestion: Number(newTest.marks),
        negativeMarks: Number(newTest.negativeMarks),
        durationMinutes: Number(newTest.duration),
        startTime: newTest.startTime,
        endTime: newTest.endTime,
        questions: questions,
        createdAt: new Date().toISOString(),
        status: "active"
      });
      alert("Test Generated Successfully!");
      setNewTest({ class: '', subject: '', marks: '', negativeMarks: '', duration: '', startTime: '', endTime: '', jsonInput: '' });
      fetchTests();
    } catch (error) {
      alert("Auto-correct failed! Please check your JSON data manually.\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreQuestions = async () => {
    if (!appendTest || !appendJson) return alert("Please select a test and provide JSON data.");
    try {
      setLoading(true);
      const cleanJson = sanitizeJSON(appendJson);
      const newQuestions = JSON.parse(cleanJson);

      const testIndex = tests.findIndex(t => t.id === appendTest);
      if(testIndex === -1) throw new Error("Test not found");
      
      const existingTest = tests[testIndex];
      const updatedQuestions = [...(existingTest.questions || []), ...newQuestions];

      await updateDoc(doc(db, "tests", appendTest), {
        questions: updatedQuestions
      });

      alert(`Successfully added ${newQuestions.length} new questions!`);
      setAppendJson('');
      setAppendTest('');
      fetchTests();
    } catch (error) {
      alert("Failed to append questions. Check your JSON format.\nError: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resultTest) return alert("Please select a test first.");
    const q = query(collection(db, "results"), where("testId", "==", resultTest));
    const querySnapshot = await getDocs(q);
    let resultsData = querySnapshot.docs.map(doc => doc.data());
    
    resultsData.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
    
    const selectedTestData = tests.find(t => t.id === resultTest);
    const testName = selectedTestData ? `${selectedTestData.className} - ${selectedTestData.subject}` : 'Test Result';

    const printWindow = window.open('', '_blank');
    const tableRows = resultsData.length > 0 
      ? resultsData.map((res, index) => `
          <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${res.studentName}</td>
            <td>${res.school}</td>
            <td><strong>${res.obtainedMarks}</strong> / ${res.totalMarks}</td>
            <td>${res.percentage}%</td>
          </tr>
        `).join('')
      : `<tr><td colSpan="5">No results found for this test yet.</td></tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${testName} - Results</title>
          <style>
            @import url('[https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap](https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap)');
            body { font-family: 'Poppins', sans-serif; padding: 40px; color: #111; }
            .header { text-align: center; border-bottom: 4px solid #d32f2f; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #d32f2f; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 2px; }
            .header h2 { color: #444; margin: 10px 0; font-size: 24px; }
            .info { text-align: center; font-size: 18px; margin-bottom: 30px; color: #555; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            th { background-color: #0f172a; color: #facc15; padding: 15px; font-size: 18px; text-transform: uppercase; border: 1px solid #0f172a; }
            td { padding: 12px 15px; text-align: center; border: 1px solid #ddd; font-size: 16px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:nth-child(1) td { background-color: #fef08a; font-weight: bold; }
            tr:nth-child(2) td { background-color: #e2e8f0; font-weight: bold; }
            tr:nth-child(3) td { background-color: #fed7aa; font-weight: bold; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Academic Excellence Olympiad</h1>
            <h2>Official Result Declaration</h2>
          </div>
          <div class="info">
            <p>Class Category: ${selectedTestData?.className} &nbsp;&nbsp;|&nbsp;&nbsp; Subject: ${selectedTestData?.subject}</p>
          </div>
          <table>
            <thead><tr><th>Rank</th><th>Student Name</th><th>School Name</th><th>Marks Obtained</th><th>Percentage</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div style="text-align:center; margin-top: 40px;"><button onclick="window.print()" style="padding: 15px 30px; font-size: 18px; background-color: #d32f2f; color: white; border: none; cursor: pointer; border-radius: 8px;">Print / Save as PDF</button></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleDownloadCSV = () => {
    const filteredStudents = csvClass === 'All' ? students : students.filter(s => s.className === csvClass);
    if (filteredStudents.length === 0) return alert("No student data found for selected class.");
    const headers = ["Name", "School", "Class", "WhatsApp", "Joined At"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + filteredStudents.map(s => `${s.name},${s.school},${s.className},${s.phone || s.uid},${s.joinedAt}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `AEO_Students_${csvClass.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTest = async () => {
    if (!deleteTest) return alert("Please select a test to delete.");
    if (window.confirm("Warning: Are you absolutely sure you want to permanently delete this test?")) {
      await deleteDoc(doc(db, "tests", deleteTest));
      alert("Test deleted successfully.");
      setDeleteTest('');
      fetchTests();
    }
  };

  return (
    <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-red-500 tracking-wider">AEO Admin Panel</h1>
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg w-full md:w-auto">Logout</button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={() => setActiveTab('generate')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(0,0,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Generate New Test</button>
        <button onClick={() => setActiveTab('manage')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(0,0,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Manage & Analytics</button>
      </div>

      <div className="bg-gray-900 border-2 border-blue-900 rounded-3xl p-6 md:p-10 shadow-2xl">
        
        {/* ================= GENERATE TEST TAB ================= */}
        {activeTab === 'generate' && (
          <div>
            <h2 className="text-3xl text-yellow-400 font-bold mb-8 border-b border-gray-700 pb-4">Create New Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Class / Category</label>
                <select value={newTest.class} onChange={(e) => setNewTest({...newTest, class: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                  <option value="" disabled>Select Category</option>
                  {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Subject Name</label>
                <input type="text" placeholder="e.g. Physics" value={newTest.subject} onChange={(e) => setNewTest({...newTest, subject: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Marks per Question</label>
                <input type="number" placeholder="e.g. 4" value={newTest.marks} onChange={(e) => setNewTest({...newTest, marks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Negative Marking</label>
                <input type="number" placeholder="e.g. 1 (Enter 0 for none)" value={newTest.negativeMarks} onChange={(e) => setNewTest({...newTest, negativeMarks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full md:col-span-2">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Duration (Minutes)</label>
                <input type="number" placeholder="e.g. 60" value={newTest.duration} onChange={(e) => setNewTest({...newTest, duration: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Test Start Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.startTime} onChange={(e) => setNewTest({...newTest, startTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer" />
              </div>
              <div className="w-full">
                <label className="text-yellow-400 text-sm font-bold mb-2 block">Test End Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.endTime} onChange={(e) => setNewTest({...newTest, endTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer" />
              </div>
            </div>
            <div className="w-full mb-8">
              <label className="text-yellow-400 text-sm font-bold mb-2 block">Bilingual JSON Questions (Auto-Correct Enabled)</label>
              <textarea rows="8" placeholder='Paste AI JSON Here...' value={newTest.jsonInput} onChange={(e) => setNewTest({...newTest, jsonInput: e.target.value})} className="p-5 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-green-500"></textarea>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-xl font-bold">Copy Bilingual Prompt</button>
              <button onClick={handleGenerateTest} disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold text-2xl py-5 px-12 rounded-2xl shadow-[0_0_25px_rgba(0,255,0,0.3)]">
                {loading ? 'Generating...' : 'Generate Test (Live)'}
              </button>
            </div>
          </div>
        )}

        {/* ================= MANAGE & DOWNLOAD TAB ================= */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 gap-10">
            
            {/* 4. Append Questions Section (NEW FEATURE) */}
            <div className="bg-gray-800 border-l-4 border-green-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-green-400 mb-6 flex items-center gap-3">➕ Add More Questions to Existing Test</h3>
              <p className="text-gray-400 mb-6 text-lg">Select a previously created test and paste a new JSON to expand its question bank.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Class</label>
                  <select value={appendClass} onChange={(e) => setAppendClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Class</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Test to Expand</label>
                  <select value={appendTest} onChange={(e) => setAppendTest(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Test</option>
                    {tests.filter(t => t.className === appendClass).map(t => <option key={t.id} value={t.id}>{t.subject} (Total Qs: {t.questions?.length || 0})</option>)}
                  </select>
                </div>
              </div>
              
              <div className="w-full mb-6">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Paste New JSON Output here</label>
                <textarea rows="5" placeholder='Paste extra questions JSON here...' value={appendJson} onChange={(e) => setAppendJson(e.target.value)} className="p-5 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-green-500"></textarea>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-lg font-bold">Copy Prompt</button>
                <button onClick={handleAddMoreQuestions} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  {loading ? 'Adding...' : 'Add Questions to Test'}
                </button>
              </div>
            </div>

            {/* 1. PDF Download Section */}
            <div className="bg-gray-800 border-l-4 border-yellow-500 p-8 rounded-2xl shadow-lg mt-4">
              <h3 className="text-3xl font-extrabold text-yellow-400 mb-6 flex items-center gap-3">🏆 Result PDF Generator</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Class</label>
                  <select value={resultClass} onChange={(e) => setResultClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Class</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Test</label>
                  <select value={resultTest} onChange={(e) => setResultTest(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Test</option>
                    {tests.filter(t => t.className === resultClass).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}
                  </select>
                </div>
                <button onClick={handleDownloadPDF} className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">
                  Generate PDF
                </button>
              </div>
            </div>

            {/* 2. CSV Download Section */}
            <div className="bg-gray-800 border-l-4 border-blue-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-blue-400 mb-6 flex items-center gap-3">📊 Export Student Database</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-2/3">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Class to Export</label>
                  <select value={csvClass} onChange={(e) => setCsvClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="All">All Classes</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <button onClick={handleDownloadCSV} className="w-full md:w-1/3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">
                  Download CSV
                </button>
              </div>
            </div>

            {/* 3. Delete Test Section */}
            <div className="bg-gray-800 border-l-4 border-red-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-red-500 mb-6 flex items-center gap-3">🗑️ Permanently Delete Test</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Class</label>
                  <select value={deleteClass} onChange={(e) => setDeleteClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Class</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="w-full">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Test</label>
                  <select value={deleteTest} onChange={(e) => setDeleteTest(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="" disabled>Select Test</option>
                    {tests.filter(t => t.className === deleteClass).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}
                  </select>
                </div>
                <button onClick={handleDeleteTest} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">
                  Delete Test
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
