/* eslint-disable */
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

  const [imgModal, setImgModal] = useState({ isOpen: false, src: '', targetTab: '', start: 0, end: 0 });
  const [imgSettings, setImgSettings] = useState({ brightness: 100, contrast: 100, grayscale: 0 });
  const currentImgRef = useRef(new Image());

  useEffect(() => { fetchTests(); fetchStudents(); }, []);

  const fetchTests = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "tests"));
        setTests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch(e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch(e) { console.error(e); }
  };

  const handleImagePaste = (e, tab) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData || window.clipboardData).items;
    if (!items) return;

    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault(); 
        const blob = item.getAsFile();
        
        const textarea = e.target;
        const start = textarea.selectionStart !== undefined ? textarea.selectionStart : textarea.value.length;
        const end = textarea.selectionEnd !== undefined ? textarea.selectionEnd : textarea.value.length;

        const reader = new FileReader();
        reader.onload = function(event) {
            currentImgRef.current.src = event.target.result;
            currentImgRef.current.onload = () => {
                setImgSettings({ brightness: 100, contrast: 100, grayscale: 0 });
                setImgModal({ isOpen: true, src: event.target.result, targetTab: tab, start, end });
            };
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const insertProcessedImage = () => {
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    
    let width = currentImgRef.current.width;
    let height = currentImgRef.current.height;
    const MAX_WIDTH = 800;
    if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
    }
    cvs.width = width; cvs.height = height;
    
    ctx.filter = `brightness(${imgSettings.brightness}%) contrast(${imgSettings.contrast}%) grayscale(${imgSettings.grayscale}%)`;
    ctx.drawImage(currentImgRef.current, 0, 0, width, height);
    
    const finalBase64 = cvs.toDataURL('image/jpeg', 0.75); 
    const imgHTML = `\n<div style="text-align:center; margin:15px 0;"><img src="${finalBase64}" style="max-width:100%; border-radius:8px; border:2px solid #374151;" /></div>\n`;
    
    if (imgModal.targetTab === 'new') {
        setNewTest(prev => ({ ...prev, textInput: prev.textInput.substring(0, imgModal.start) + imgHTML + prev.textInput.substring(imgModal.end) }));
    } else {
        setAppendText(prev => prev.substring(0, imgModal.start) + imgHTML + prev.substring(imgModal.end));
    }
    setImgModal({ isOpen: false, src: '', targetTab: '', start: 0, end: 0 });
  };

  const parseCustomFormat = (rawText) => {
    const lines = String(rawText).split('\n');
    const questions = [];
    let currentQ = null;
    let currentMode = '';
    let optCount = 0;
    let preamble = ''; 

    lines.forEach(line => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^\\+/, '');
      if (trimmed.endsWith('\\')) trimmed = trimmed.slice(0, -1).trim();
      if (!trimmed) return; 

      if (trimmed.startsWith('@@@')) {
          if (!currentQ) return;
          optCount++;
          if (optCount === 1) { currentQ.o1 = trimmed.substring(3).trim(); currentMode = 'o1'; }
          else if (optCount === 2) { currentQ.o2 = trimmed.substring(3).trim(); currentMode = 'o2'; }
          else if (optCount === 3) { currentQ.o3 = trimmed.substring(3).trim(); currentMode = 'o3'; }
          else if (optCount === 4) { currentQ.o4 = trimmed.substring(3).trim(); currentMode = 'o4'; }
      } else if (trimmed.startsWith('@@')) {
          if (!currentQ) return; currentQ.ans = trimmed.substring(2).replace(/^Answer:/i, '').trim(); currentMode = 'ans';
      } else if (trimmed.startsWith('@')) {
          if (currentQ) questions.push(currentQ);
          let cleanQ = trimmed.substring(1).trim().replace(/^\d+[\.\:\-]?\s*/, '');
          if (preamble) { cleanQ = preamble + "\n<br/>" + cleanQ; preamble = ''; } 
          currentQ = { q: cleanQ, o1: '', o2: '', o3: '', o4: '', ans: '', exp: '' };
          optCount = 0; currentMode = 'q';
      } 
      else if (trimmed.startsWith('#') && !/^#\d/.test(trimmed)) {
        if (currentQ) questions.push(currentQ);
        let cleanQ = trimmed.substring(1).trim().replace(/^(Q(uestion)?\s*\d+[\.\:\-]?\s*)/i, '');
        if (preamble) { cleanQ = preamble + "\n<br/>" + cleanQ; preamble = ''; } 
        currentQ = { q: cleanQ, o1: '', o2: '', o3: '', o4: '', ans: '', exp: '' };
        optCount = 0; currentMode = 'q';
      } else if (trimmed.startsWith('#1')) {
        if(!currentQ) return; currentQ.o1 = trimmed.substring(2).trim(); currentMode = 'o1';
      } else if (trimmed.startsWith('#2')) {
        if(!currentQ) return; currentQ.o2 = trimmed.substring(2).trim(); currentMode = 'o2';
      } else if (trimmed.startsWith('#3')) {
        if(!currentQ) return; currentQ.o3 = trimmed.substring(2).trim(); currentMode = 'o3';
      } else if (trimmed.startsWith('#4')) {
        if(!currentQ) return; currentQ.o4 = trimmed.substring(2).trim(); currentMode = 'o4';
      } else if (currentQ) {
        currentQ[currentMode] += '\n' + trimmed;
      } else {
        preamble += '\n' + trimmed; 
      }
    });
    
    if (currentQ) questions.push(currentQ);
    if(questions.length === 0) throw new Error("No valid questions found! Start questions with '@' or '# Q1'.");

    return questions.map(q => ({
      question: (q.q || '').trim(),
      options: [(q.o1 || '').trim(), (q.o2 || '').trim(), (q.o3 || '').trim(), (q.o4 || '').trim()].filter(Boolean),
      answer: (q.ans || '').trim(),
      review: (q.exp || '').trim()
    }));
  };

  const copyPrompt = () => {
    let langInstruction = "in BOTH English and Hindi";
    if (promptLang === 'english') langInstruction = "in ENGLISH ONLY";
    if (promptLang === 'hindi') langInstruction = "in HINDI ONLY";

    const promptText = `Act as an expert exam setter. Generate 10 multiple choice questions for [Subject] class [Class] ${langInstruction}.
    
CRITICAL RULES FOR AI:
1. Start EVERY question with "@" followed by number.
2. Start EVERY option with "@@@"
3. Provide the EXACT correct option text starting with "@@"
4. Use standard LaTeX for Mathematical/Chemistry equations.
5. Do NOT use markdown code blocks. Do NOT use JSON.

Output Format Example:
@ 1. Question text
@@@ Option A
@@@ Option B
@@@ Option C
@@@ Option D
@@ Correct Option Text`;

    navigator.clipboard.writeText(promptText);
    alert(`Prospectus Format Prompt (${promptLang.toUpperCase()}) copied! Paste it in ChatGPT.`);
  };

  const handleGenerateTest = async () => {
    if (!newTest.class || !newTest.subject || !newTest.textInput || !newTest.marks || !newTest.negativeMarks) return alert("Please fill all required fields.");
    try {
      setLoading(true);
      const questions = parseCustomFormat(newTest.textInput);
      await addDoc(collection(db, "tests"), {
        className: newTest.class, subject: newTest.subject, marksPerQuestion: Number(newTest.marks),
        negativeMarks: Number(newTest.negativeMarks), durationMinutes: Number(newTest.duration),
        startTime: newTest.startTime, endTime: newTest.endTime, questions: questions,
        createdAt: new Date().toISOString(), status: "active"
      });
      alert(`Success! Generated test with ${questions.length} questions.`);
      setNewTest({ class: '', subject: '', marks: '', negativeMarks: '', duration: '', startTime: '', endTime: '', textInput: '' });
      fetchTests();
    } catch (error) { alert("Format Error: " + error.message); } finally { setLoading(false); }
  };

  const handleAddMoreQuestions = async () => {
    if (!appendTest || !appendText) return alert("Please select a test and paste text.");
    try {
      setLoading(true);
      const newQuestions = parseCustomFormat(appendText);
      const testIndex = tests.findIndex(t => t.id === appendTest);
      if(testIndex === -1) throw new Error("Test not found");
      const existingTest = tests[testIndex];
      await updateDoc(doc(db, "tests", appendTest), { questions: [...(existingTest.questions || []), ...newQuestions] });
      alert(`Successfully added ${newQuestions.length} new questions!`);
      setAppendText(''); setAppendTest(''); fetchTests();
    } catch (error) { alert(error.message); } finally { setLoading(false); }
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
        <head><title>${testName} - Results</title><style>body { font-family: sans-serif; padding: 40px; } table { width: 100%; border-collapse: collapse; } th { background-color: #0f172a; color: #facc15; padding: 15px; border: 1px solid #0f172a; } td { padding: 12px 15px; text-align: center; border: 1px solid #ddd; }</style></head>
        <body><div style="text-align:center;"><h1>AEO Results</h1><h2>${testName}</h2></div><table><thead><tr><th>Rank</th><th>Name</th><th>School</th><th>Marks</th><th>%</th></tr></thead><tbody>${tableRows}</tbody></table><div style="text-align:center; margin-top: 20px;"><button onclick="window.print()">Print PDF</button></div></body>
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
    if (window.confirm("Are you absolutely sure you want to delete this test? This cannot be undone.")) {
      await deleteDoc(doc(db, "tests", deleteTest));
      alert("Test deleted successfully.");
      setDeleteTest('');
      fetchTests();
    }
  };

  return (
    <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans relative">
      
      {imgModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl p-6 md:p-10 w-full max-w-2xl shadow-[0_0_40px_rgba(0,0,255,0.4)] flex flex-col items-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Adjust Image</h2>
            
            <div className="w-full bg-black rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center p-2 mb-6" style={{ minHeight: '200px' }}>
              <img src={imgModal.src} alt="Preview" style={{ filter: `brightness(${imgSettings.brightness}%) contrast(${imgSettings.contrast}%) grayscale(${imgSettings.grayscale}%)`, maxHeight: '300px' }} className="max-w-full object-contain rounded-md" />
            </div>

            <div className="w-full mb-4">
              <label className="text-gray-300 font-bold mb-2 flex justify-between"><span>Brightness</span><span className="text-blue-400">{imgSettings.brightness}%</span></label>
              <input type="range" min="50" max="150" value={imgSettings.brightness} onChange={(e) => setImgSettings({...imgSettings, brightness: e.target.value})} className="w-full cursor-pointer" />
            </div>
            
            <div className="w-full mb-4">
              <label className="text-gray-300 font-bold mb-2 flex justify-between"><span>Contrast</span><span className="text-blue-400">{imgSettings.contrast}%</span></label>
              <input type="range" min="50" max="200" value={imgSettings.contrast} onChange={(e) => setImgSettings({...imgSettings, contrast: e.target.value})} className="w-full cursor-pointer" />
            </div>
            
            <div className="w-full mb-8">
              <label className="text-gray-300 font-bold mb-2 flex justify-between"><span>Grayscale</span><span className="text-blue-400">{imgSettings.grayscale}%</span></label>
              <input type="range" min="0" max="100" value={imgSettings.grayscale} onChange={(e) => setImgSettings({...imgSettings, grayscale: e.target.value})} className="w-full cursor-pointer" />
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={() => setImgModal({ isOpen: false, src: '', targetTab: '', start: 0, end: 0 })} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg">Cancel</button>
              <button onClick={insertProcessedImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">✅ Insert</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-red-500 tracking-wider">AEO Admin Panel</h1>
        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg w-full md:w-auto">Logout</button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={() => setActiveTab('generate')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>1. Generate New Test</button>
        <button onClick={() => setActiveTab('append')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'append' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>2. Add Questions</button>
        <button onClick={() => setActiveTab('manage')} className={`px-6 py-4 text-lg font-bold rounded-xl transition-colors w-full md:w-auto ${activeTab === 'manage' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}>3. Manage & Analytics</button>
      </div>

      <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 md:p-10 shadow-2xl">
        
        {activeTab === 'generate' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Class / Category</label>
                <select value={newTest.class} onChange={(e) => setNewTest({...newTest, class: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full">
                  <option value="" disabled>Select Category</option>
                  {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Subject Name</label>
                <input type="text" value={newTest.subject} onChange={(e) => setNewTest({...newTest, subject: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Marks per Question</label>
                <input type="number" value={newTest.marks} onChange={(e) => setNewTest({...newTest, marks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Negative Marking</label>
                <input type="number" value={newTest.negativeMarks} onChange={(e) => setNewTest({...newTest, negativeMarks: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full md:col-span-2">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Duration (Minutes)</label>
                <input type="number" value={newTest.duration} onChange={(e) => setNewTest({...newTest, duration: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Test Start Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.startTime} onChange={(e) => setNewTest({...newTest, startTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
              </div>
              <div className="w-full">
                <label className="text-gray-300 text-sm font-bold mb-2 block">Test End Time</label>
                <input type="datetime-local" style={{ colorScheme: 'dark' }} value={newTest.endTime} onChange={(e) => setNewTest({...newTest, endTime: e.target.value})} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
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
              <label className="text-green-400 text-sm font-bold mb-2 block">
                2. Paste Custom Text Format here (Right-Click & Paste / Ctrl+V to open Advanced Image Editor!)
              </label>
              <textarea 
                rows="10" 
                value={newTest.textInput} 
                onChange={(e) => setNewTest({...newTest, textInput: e.target.value})}
                onPaste={(e) => handleImagePaste(e, 'new')}
                className="p-5 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-blue-500 leading-relaxed"
                placeholder="@ 1. Question..."
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

        {activeTab === 'append' && (
          <div>
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
                  {tests.filter(t => t.className === appendClass).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}
                </select>
              </div>
            </div>

            <div className="w-full mb-6">
              <label className="text-green-400 text-sm font-bold mb-2 block">
                Paste Custom Text Format here (Right-Click & Paste / Ctrl+V to open Image Editor!)
              </label>
              <textarea 
                rows="8" 
                value={appendText} 
                onChange={(e) => setAppendText(e.target.value)} 
                onPaste={(e) => handleImagePaste(e, 'append')}
                className="p-5 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-2xl outline-none w-full font-mono resize-none focus:border-green-500"
              ></textarea>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={copyPrompt} className="text-blue-400 underline hover:text-blue-300 text-lg font-bold">Copy Prompt</button>
              <button onClick={handleAddMoreQuestions} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xl py-4 px-10 rounded-xl">
                {loading ? 'Adding...' : 'Add Questions to Test'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 gap-10">
            <div className="bg-gray-800 border-l-4 border-yellow-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-yellow-400 mb-6">🏆 Result PDF Generator</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full">
                  <select value={resultClass} onChange={(e) => setResultClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full"><option value="" disabled>Select Class</option>{classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select>
                </div>
                <div className="w-full">
                  <select value={resultTest} onChange={(e) => setResultTest(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full"><option value="" disabled>Select Test</option>{tests.filter(t => t.className === resultClass).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}</select>
                </div>
                <button onClick={handleDownloadPDF} className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Generate PDF</button>
              </div>
            </div>

            <div className="bg-gray-800 border-l-4 border-blue-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-blue-400 mb-6">📊 Export Student Database</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-2/3">
                  <select value={csvClass} onChange={(e) => setCsvClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full"><option value="All">All Classes</option>{classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select>
                </div>
                <button onClick={handleDownloadCSV} className="w-full md:w-1/3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Download CSV</button>
              </div>
            </div>

            <div className="bg-gray-800 border-l-4 border-red-500 p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-extrabold text-red-500 mb-6">🗑️ Permanently Delete Test</h3>
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full">
                  <select value={deleteClass} onChange={(e) => setDeleteClass(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full"><option value="" disabled>Select Class</option>{classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select>
                </div>
                <div className="w-full">
                  <select value={deleteTest} onChange={(e) => setDeleteTest(e.target.value)} className="p-4 text-xl bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full"><option value="" disabled>Select Test</option>{tests.filter(t => t.className === deleteClass).map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}</select>
                </div>
                <button onClick={handleDeleteTest} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-4 px-10 rounded-xl whitespace-nowrap">Delete Test</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
