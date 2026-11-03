import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';

const classOptions = ["Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "NEET", "JEE", "Graduation", "Government Job"];

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newTest, setNewTest] = useState({ class: '', subject: '', marks: '', negativeMarks: '', duration: '', startTime: '', endTime: '', textInput: '' });
  const [promptLang, setPromptLang] = useState('bilingual');

  const [resultClass, setResultClass] = useState('');
  const [resultTest, setResultTest] = useState('');
  const [csvClass, setCsvClass] = useState('All');
  const [deleteClass, setDeleteClass] = useState('');
  const [deleteTest, setDeleteTest] = useState('');

  const [appendClass, setAppendClass] = useState('');
  const [appendTest, setAppendTest] = useState('');
  const [appendText, setAppendText] = useState('');

  const fileInputNewRef = useRef(null);
  const fileInputAppendRef = useRef(null);

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

  // ================= 100% FIXED IMAGE PASTE (WITH CURSOR LOCK) =================
  const handleImagePaste = (e, isAppendTab = false) => {
    const items = (e.clipboardData || window.clipboardData).items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); 
        const file = items[i].getAsFile();
        
        // Lock cursor position BEFORE async reading starts
        const textarea = e.target;
        const start = textarea.selectionStart !== undefined ? textarea.selectionStart : textarea.value.length;
        const end = textarea.selectionEnd !== undefined ? textarea.selectionEnd : textarea.value.length;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target.result;
          const imgTag = `\n<img src="${base64Data}" alt="question-img" style="max-width:100%; border-radius:8px; margin:10px 0; border: 1px solid #4b5563;" />\n`;
          
          if (isAppendTab) {
            setAppendText(prev => prev.substring(0, start) + imgTag + prev.substring(end));
          } else {
            setNewTest(prev => ({ 
              ...prev, 
              textInput: prev.textInput.substring(0, start) + imgTag + prev.textInput.substring(end) 
            }));
          }
        };
        reader.readAsDataURL(file);
        break; 
      }
    }
  };

  // ================= FALLBACK MANUAL IMAGE UPLOAD =================
  const handleManualImageUpload = (e, isAppendTab = false) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const imgTag = `\n<img src="${base64Data}" alt="question-img" style="max-width:100%; border-radius:8px; margin:10px 0; border: 1px solid #4b5563;" />\n`;
      
      if (isAppendTab) {
        setAppendText(prev => prev + imgTag);
      } else {
        setNewTest(prev => ({ ...prev, textInput: prev.textInput + imgTag }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ================= SUPER CLEANER PARSER =================
  const parseCustomFormat = (rawText) => {
    const lines = rawText.split('\n');
    const questions = [];
    let currentQ = null;
    let currentMode = '';

    lines.forEach(line => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^\\+/, '');
      if (trimmed.endsWith('\\')) trimmed = trimmed.slice(0, -1).trim();
      if (!trimmed) return; 

      if (trimmed.startsWith('#') && !/^#\d/.test(trimmed)) {
        if (currentQ) questions.push(currentQ);
        let cleanQ = trimmed.substring(1).trim();
        cleanQ = cleanQ.replace(/^(Q(uestion)?\s*\d+[\.\:\-]?\s*)/i, '');
        currentQ = { q: cleanQ, o1: '', o2: '', o3: '', o4: '', ans: '', exp: '' };
        currentMode = 'q';
      } else if (trimmed.startsWith('#1')) {
        if(!currentQ) return; currentQ.o1 = trimmed.substring(2).trim(); currentMode = '1';
      } else if (trimmed.startsWith('#2')) {
        if(!currentQ) return; currentQ.o2 = trimmed.substring(2).trim(); currentMode = '2';
      } else if (trimmed.startsWith('#3')) {
        if(!currentQ) return; currentQ.o3 = trimmed.substring(2).trim(); currentMode = '3';
      } else if (trimmed.startsWith('#4')) {
        if(!currentQ) return; currentQ.o4 = trimmed.substring(2).trim(); currentMode = '4';
      } else if (trimmed.startsWith('@@')) {
        if(!currentQ) return; currentQ.exp = trimmed.substring(2).trim(); currentMode = 'exp';
      } else if (trimmed.startsWith('@')) {
        if(!currentQ) return; currentQ.ans = trimmed.substring(1).trim(); currentMode = 'ans';
      } else if (currentQ) {
        currentQ[currentMode] += '\n' + trimmed;
      }
    });
    
    if (currentQ) questions.push(currentQ);
    if(questions.length === 0) throw new Error("No valid questions found! Please check the format.");

    return questions.map(q => ({
      question: q.q.trim(),
      options: [q.o1.trim(), q.o2.trim(), q.o3.trim(), q.o4.trim()].filter(Boolean),
      answer: q.ans.trim(),
      review: q.exp.trim()
    }));
  };

  const copyPrompt = () => {
    let langInstruction = "in BOTH English and Hindi (e.g., Eng: [Text]\\nHin: [Text])";
    if (promptLang === 'english') langInstruction = "in ENGLISH ONLY";
    if (promptLang === 'hindi') langInstruction = "in HINDI ONLY";

    const promptText = `Act as an expert exam setter. Generate 10 multiple choice questions for [Subject] class [Class] ${langInstruction}.
    
CRITICAL RULES FOR AI:
1. Start EVERY single question with "# Q" followed by the number. (e.g., # Q1. Eng: ...)
2. Do NOT use JSON or markdown code blocks (No \`\`\`). Do NOT use backslashes to escape characters.
3. Use standard LaTeX format for Mathematical equations and Chemistry formulas (e.g., $C_2H_5Cl$).
4. LEAVE ONE BLANK LINE between the explanation (@@) of one question and the start (# Q) of the next question.
5. Output STRICTLY in this exact text format and do not add any conversational text:

# Q1. [Question text here]
#1 [Option A]
#2 [Option B]
#3 [Option C]
#4 [Option D]
@ [Exact string of correct option]
@@ [Explanation/Review]

# Q2. [Next Question...]`;

    navigator.clipboard.writeText(promptText);
    alert(`Strict Dynamic Prompt (${promptLang.toUpperCase()}) copied! Paste it in ChatGPT.`);
  };

  const handleGenerateTest = async () => {
    if (!newTest.class || !newTest.subject || !newTest.textInput || !newTest.marks || !newTest.negativeMarks) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      setLoading(true);
      const questions = parseCustomFormat(newTest.textInput);
      
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
      alert(`Success! Generated test with ${questions.length} questions.`);
      setNewTest({ class: '', subject: '', marks: '', negativeMarks: '', duration: '', startTime: '', endTime: '', textInput: '' });
      fetchTests();
    } catch (error) {
      alert("Format Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreQuestions = async () => {
    if (!appendTest || !appendText) return alert("Please select a test and paste text.");
    try {
      setLoading(true);
      const newQuestions = parseCustomFormat(appendText);

      const testIndex = tests.findIndex(t => t.id === appendTest);
      if(testIndex === -1) throw new Error("Test not found");
      
      const existingTest = tests[testIndex];
      const updatedQuestions = [...(existingTest.questions || []), ...newQuestions];

      await updateDoc(doc(db, "tests", appendTest), {
        questions: updatedQuestions
      });

      alert(`Successfully added ${newQuestions.length} new questions!`);
      setAppendText('');
      setAppendTest('');
      fetchTests();
    } catch (error) {
      alert(error.message);
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
      ? resultsData.map((res, index) => `<tr><td><strong>${index + 1}</strong></td><td>${res.studentName}</td><td>${res.school}</td><td><strong>${res.obtainedMarks}</strong> / ${res.totalMarks}</td><td>${res.percentage}%</td></tr>`).join('')
      : `<tr><td colSpan="5">No results found yet.</td></tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${testName} - Results</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
            body { font-family: 'Poppins', sans-serif; padding: 40px; color: #111; }
            .header { text-align: center; border-bottom: 4px solid #d32f2f; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #d32f2f; margin: 0; font-size: 36px; text-transform: uppercase; }
            .info { text-align: center; font-size: 18px; margin-bottom: 30px; color: #555; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
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
          <div class="header"><h1>Academic Excellence Olympiad</h1><h2>Official Result Declaration</h2></div>
          <div class="info"><p>Class: ${selectedTestData?.className} | Subject: ${selectedTestData?.subject}</p></div>
          <table><thead><tr><th>Rank</th><th>Student Name</th><th>School Name</th><th>Marks Obtained</th><th>Percentage</th></tr></thead><tbody>${tableRows}</tbody></table>
          <div style="text-align:center; margin-top: 40px;"><button onclick="window.print()" style="padding: 15px 30px; font-size: 18px; background-color: #d32f2f; color: white; border: none; cursor: pointer; border-radius: 8px;">Print / Save as PDF</button></div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadCSV = () => {
    const filteredStudents = csvClass === 'All' ? students : students.filter(s => s.className === csvClass);
    if (filteredStudents.length === 0) return alert("No student data found.");
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
    if (window.confirm("Are you absolutely sure you want to delete this test?")) {
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
        <button onClick={() => setActiveTab('generate')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(0,0,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>1. Generate New Test</button>
        <button onClick={() => setActiveTab('append')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'append' ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>2. Add Questions (Append)</button>
        <button onClick={() => setActiveTab('manage')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'manage' ? 'bg-yellow-600 text-white shadow-[0_0_15px_rgba(202,138,4,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>3. Manage & Analytics</button>
      </div>

      <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 md:p-10 shadow-2xl">
        
        {/* ================= TAB 1: GENERATE TEST ================= */}
        {activeTab === 'generate' && (
          <div>
            <h2 className="text-3xl text-blue-400 font-bold mb-8 border-b border-gray-700 pb-4">Create New Test</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Class / Category</label>
                <select value={newTest.class} onChange={(e) => setNewTest({...newTest, class: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                  <option value="" disabled>Select Category</option>
                  {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Subject Name</label>
                <input type="text" placeholder="e.g. Physics" value={newTest.subject} onChange={(e) => setNewTest({...newTest, subject: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Marks per Question</label>
                <input type="number" placeholder="e.g. 4" value={newTest.marks} onChange={(e) => setNewTest({...newTest, marks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Negative Marking</label>
                <input type="number" placeholder="e.g. 1 (Enter 0 for none)" value={newTest.negativeMarks} onChange={(e) => setNewTest({...newTest, negativeMarks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full md:col-span-2">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Duration (Minutes)</label>
                <input type="number" placeholder="e.g. 60" value={newTest.duration} onChange={(e) => setNewTest({...newTest, duration: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Test Start Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.startTime} onChange={(e) => setNewTest({...newTest, startTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Test End Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.endTime} onChange={(e) => setNewTest({...newTest, endTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer" />
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-800 rounded-2xl border border-gray-600">
              <h3 className="text-yellow-400 font-bold mb-3">1. Select AI Generation Language</h3>
              <div className="flex gap-4">
                <button onClick={() => setPromptLang('english')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${promptLang === 'english' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>🇬🇧 English Only</button>
                <button onClick={() => setPromptLang('hindi')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${promptLang === 'hindi' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>🇮🇳 Hindi Only</button>
                <button onClick={() => setPromptLang('bilingual')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${promptLang === 'bilingual' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>🌐 Bilingual (Both)</button>
              </div>
            </div>

            <div className="w-full mb-8">
              <label className="text-green-400 text-sm font-bold mb-2 flex justify-between items-center">
                <span>2. Paste Custom Text Format here (Ctrl+V works for Text & Screenshots!)</span>
                <input type="file" accept="image/*" ref={fileInputNewRef} className="hidden" onChange={(e) => handleManualImageUpload(e, false)} />
                <button onClick={() => fileInputNewRef.current.click()} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600">📤 Upload Image</button>
              </label>
              <textarea 
                rows="10" 
                placeholder="# Q1. Question\n#1 Option A\n#2 Option B\n#3 Option C\n#4 Option D\n@ Correct Answer\n@@ Explanation\n\n(Tip: You can directly paste screenshots inside this box!)" 
                value={newTest.textInput} 
                onChange={(e) => setNewTest({...newTest, textInput: e.target.value})}
                onPaste={(e) => handleImagePaste(e, false)}
                className="p-5 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-blue-500 leading-relaxed"
              ></textarea>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-xl font-bold">Copy Dynamic Prompt for ChatGPT</button>
              <button onClick={handleGenerateTest} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-2xl py-5 px-12 rounded-2xl shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                {loading ? 'Generating...' : 'Generate Test'}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: APPEND QUESTIONS ================= */}
        {activeTab === 'append' && (
          <div>
            <h2 className="text-3xl text-green-400 font-bold mb-6 border-b border-gray-700 pb-4">➕ Add More Questions</h2>
            
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
              <label className="text-green-400 text-sm font-bold mb-2 flex justify-between items-center">
                <span>Paste Custom Text Format here (Ctrl+V works for Screenshots!)</span>
                <input type="file" accept="image/*" ref={fileInputAppendRef} className="hidden" onChange={(e) => handleManualImageUpload(e, true)} />
                <button onClick={() => fileInputAppendRef.current.click()} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600">📤 Upload Image</button>
              </label>
              <textarea 
                rows="8" 
                placeholder="# Q1. Question..." 
                value={appendText} 
                onChange={(e) => setAppendText(e.target.value)} 
                onPaste={(e) => handleImagePaste(e, true)}
                className="p-5 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-green-500"
              ></textarea>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-lg font-bold">Copy Prompt</button>
              <button onClick={handleAddMoreQuestions} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                {loading ? 'Adding...' : 'Add Questions to Test'}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MANAGE & DOWNLOAD ================= */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 gap-10">
            <div className="bg-gray-800 border-l-4 border-yellow-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-yellow-400 mb-6">🏆 Result PDF Generator</h3>
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
                <button onClick={handleDownloadPDF} className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Generate PDF</button>
              </div>
            </div>

            <div className="bg-gray-800 border-l-4 border-blue-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-blue-400 mb-6">📊 Export Student Database</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-2/3">
                  <label className="text-gray-300 text-sm font-bold mb-2 block">Select Class to Export</label>
                  <select value={csvClass} onChange={(e) => setCsvClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer">
                    <option value="All">All Classes</option>
                    {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <button onClick={handleDownloadCSV} className="w-full md:w-1/3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Download CSV</button>
              </div>
            </div>

            <div className="bg-gray-800 border-l-4 border-red-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-red-500 mb-6">🗑️ Permanently Delete Test</h3>
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
                <button onClick={handleDeleteTest} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Delete Test</button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
