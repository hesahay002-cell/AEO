/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function Dashboard({ user, onLogout }) {
  const [availableTests, setAvailableTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStatus, setTestStatus] = useState('dashboard');
  const [warnings, setWarnings] = useState(0);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('english');
  const [renderError, setRenderError] = useState(""); 

  useEffect(() => { fetchTests(); }, [user]);

  const fetchTests = async () => {
    try {
      const q = query(collection(db, "tests"), where("className", "==", user?.className || ""));
      const querySnapshot = await getDocs(q);
      setAvailableTests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("Error fetching tests:", error); }
  };

  useEffect(() => {
    const renderMath = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        setTimeout(() => {
          try {
            if (window.MathJax.typesetClear) window.MathJax.typesetClear();
            window.MathJax.typesetPromise().catch((err) => console.log("Math Error", err));
          } catch(e) { console.error(e); }
        }, 300);
      }
    };

    if (testStatus === 'taking' || testStatus === 'review') {
      if (!window.MathJax) {
        window.MathJax = {
          tex: { 
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['[', ']']],
            packages: {'[+]': ['mhchem']} 
          },
          loader: {load: ['[tex]/mhchem']},
          startup: { typeset: false }
        };
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
        script.async = true;
        script.onload = renderMath;
        document.head.appendChild(script);
      } else {
        renderMath();
      }
    }
  }, [currentQIndex, language, testStatus, activeTest]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (testStatus === 'taking') { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [testStatus]);

  useEffect(() => {
    if (testStatus === 'taking' && activeTest && !renderError) {
      localStorage.setItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`, JSON.stringify({ testId: activeTest.id, timeLeft, answers, questionStatus, currentQIndex, warnings, language }));
    }
  }, [timeLeft, answers, questionStatus, currentQIndex, warnings, language, testStatus, activeTest, user, renderError]);

  useEffect(() => {
    let timer;
    if (testStatus === 'taking' && timeLeft > 0 && !renderError) timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (testStatus === 'taking' && timeLeft === 0 && !renderError) handleSubmitTest();
    return () => clearInterval(timer);
  }, [testStatus, timeLeft, renderError]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStatus === 'taking' && !renderError) {
        setWarnings(prev => {
          const newCount = prev + 1;
          if (newCount < 3) alert(`WARNING ${newCount}/3: Window switching is not allowed! Auto-submit on 3rd warning.`);
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testStatus, renderError]);

  useEffect(() => { if (warnings >= 3 && testStatus === 'taking') { handleSubmitTest(); } }, [warnings, testStatus]);

  // ================= MISSING FUNCTION ADDED BACK =================
  const checkTimeStatus = (startTime, endTime) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (now < start) return { status: 'upcoming', text: 'Upcoming' };
    if (now > end) return { status: 'expired', text: 'Expired' };
    return { status: 'active', text: 'Start Test' };
  };

  const handleStartTest = (test) => {
    setRenderError(""); 
    const now = new Date().getTime();
    if (now < new Date(test.startTime).getTime()) return alert("This test has not started yet.");
    if (now > new Date(test.endTime).getTime()) return alert("This test has expired.");
    
    if (!test.questions || !Array.isArray(test.questions) || test.questions.length === 0) {
        localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`);
        return alert("Error: This test is corrupted. Please tell Admin to delete and recreate it.");
    }

    const savedSessionStr = localStorage.getItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`);
    if (savedSessionStr) {
      try {
        const savedSession = JSON.parse(savedSessionStr);
        if (savedSession && savedSession.testId === test.id) {
           setActiveTest(test); setTimeLeft(savedSession.timeLeft || test.durationMinutes * 60); setAnswers(savedSession.answers || {});
           setQuestionStatus(savedSession.questionStatus || {}); setCurrentQIndex(savedSession.currentQIndex || 0);
           setWarnings(savedSession.warnings || 0); setLanguage(savedSession.language || 'english'); setTestStatus('taking');
           if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(e=>console.error(e));
           return; 
        }
      } catch(e) {
        localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`);
      }
    }
    setActiveTest(test); setTimeLeft((test.durationMinutes || 60) * 60); setAnswers({}); setQuestionStatus({});
    setCurrentQIndex(0); setWarnings(0); setLanguage('english'); setTestStatus('taking');
    if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(e=>console.error(e));
  };

  const parseText = (rawText) => {
    if (!rawText) return "";
    let text = String(rawText);

    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');

    const hasEng = /Eng:/i.test(text);
    const hasHin = /Hin:/i.test(text);

    if (hasEng || hasHin) {
      const engIndex = hasEng ? text.search(/Eng:/i) : Infinity;
      const hinIndex = hasHin ? text.search(/Hin:/i) : Infinity;
      const firstTagIndex = Math.min(engIndex, hinIndex);
      
      let sharedText = ""; 
      if (firstTagIndex > 0) sharedText = text.substring(0, firstTagIndex).trim();

      const engMatch = text.match(/Eng:\s*([\s\S]*?)(?=Hin:|$)/i);
      const hinMatch = text.match(/Hin:\s*([\s\S]*?)$/i);

      let engPart = engMatch ? engMatch[1].trim() : '';
      let hinPart = hinMatch ? hinMatch[1].trim() : '';
      if (!engPart && hinPart) engPart = hinPart;
      if (!hinPart && engPart) hinPart = engPart;

      text = sharedText ? `${sharedText}<br/><br/>${language === 'english' ? engPart : hinPart}` : (language === 'english' ? engPart : hinPart);
    } else if (text.includes(" / ")) {
      const parts = text.split(" / ");
      text = language === 'english' ? parts[0].trim() : (parts[1] ? parts[1].trim() : parts[0].trim());
    }

    text = text.replace(/\\xrightarrow(?!\s*\{)/g, '\\rightarrow');
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => '\\(' + formula.trim() + '\\)');

    return text.replace(/\n/g, '<br/>');
  };

  const handleOptionSelect = (opt) => {
    setAnswers({ ...answers, [currentQIndex]: opt });
    setQuestionStatus({ ...questionStatus, [currentQIndex]: 'answered' });
  };

  const handleSkip = () => {
    setQuestionStatus({ ...questionStatus, [currentQIndex]: 'skipped' });
    if (activeTest?.questions && currentQIndex < activeTest.questions.length - 1) setCurrentQIndex(currentQIndex + 1);
  };

  const handleSubmitTest = async () => {
    const isConfirmed = (timeLeft === 0 || warnings >= 3) ? true : window.confirm("Are you sure you want to submit the entire test?");
    if (!isConfirmed) return;

    setTestStatus('processing');
    if(document.fullscreenElement) document.exitFullscreen().catch(e=>console.error(e));
    localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`);

    let marksObtained = 0; let correctCount = 0; let wrongCount = 0;
    const questionsList = activeTest?.questions || [];
    
    questionsList.forEach((q, index) => {
      const studentAns = answers[index];
      if (studentAns && q && studentAns === q.answer) { marksObtained += (activeTest.marksPerQuestion || 0); correctCount++; } 
      else if (studentAns) { marksObtained -= (activeTest.negativeMarks || 0); wrongCount++; }
    });

    const totalMarks = questionsList.length * (activeTest?.marksPerQuestion || 0);
    const percentage = totalMarks > 0 ? ((marksObtained / totalMarks) * 100).toFixed(2) : 0;

    const finalResult = {
      testId: activeTest?.id || 'unknown', studentId: user?.uid || user?.phone || 'unknown', studentName: user?.name || 'Unknown',
      school: user?.school || 'N/A', className: user?.className || 'N/A', obtainedMarks: marksObtained,
      totalMarks: totalMarks, percentage: percentage, correctAnswers: correctCount,
      wrongAnswers: wrongCount, warnings: warnings, submittedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "results"), finalResult);
      setResult(finalResult);
      setTestStatus('submitted');
    } catch (error) { alert("Error saving result! Check internet connection."); console.error(error); }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleReviewClick = () => {
    const now = new Date().getTime();
    const end = new Date(activeTest?.endTime || now).getTime();
    if (now < end) {
      const formattedTime = new Date(activeTest.endTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      alert(`Review will be available after test expires on ${formattedTime}.`);
    } else { setTestStatus('review'); }
  };

  if (renderError) {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ Oops! Something broke.</h1>
              <p className="text-xl text-gray-300 mb-8">Error details: {renderError}</p>
              <button onClick={() => { setRenderError(""); setTestStatus('dashboard'); setActiveTest(null); localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`); }} className="bg-blue-600 px-8 py-4 rounded-xl font-bold text-xl">Back to Dashboard</button>
          </div>
      );
  }

  try {
    if (testStatus === 'dashboard') {
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-4 gap-4">
            <div><h1 className="text-3xl md:text-5xl font-extrabold text-red-500 tracking-wider">AEO Portal</h1><p className="text-yellow-400 mt-2 text-lg font-semibold">Welcome, {user?.name || 'Student'} ({user?.className || 'Class'})</p></div>
            <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg w-full md:w-auto">Logout</button>
          </div>

          <div className="bg-gray-900 border-2 border-blue-900 rounded-3xl p-6 md:p-10 shadow-2xl">
            <h2 className="text-3xl text-yellow-400 font-bold mb-8">Available Tests for You</h2>
            {availableTests.length === 0 ? (
              <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-2xl"><p className="text-gray-400 text-2xl">No tests are currently assigned to your class.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableTests.map((test) => {
                  const timeStatus = checkTimeStatus(test.startTime, test.endTime);
                  return (
                    <div key={test.id} className="bg-black border-2 border-gray-700 p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-blue-500 transition-colors">
                      <div>
                        <h3 className="text-3xl font-extrabold text-blue-400 mb-2">{test.subject || 'Subject'}</h3>
                        <p className="text-gray-300 text-lg mb-1">Time: {test.durationMinutes || 0} Mins | {test?.questions?.length || 0} Qs</p>
                        <p className="text-gray-400 text-md">Marks: +{test.marksPerQuestion || 0} / -{test.negativeMarks || 0}</p>
                      </div>
                      <button onClick={() => handleStartTest(test)} className={`mt-6 py-4 px-6 rounded-xl font-extrabold text-xl w-full shadow-lg ${timeStatus.status === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                        {timeStatus.text}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (testStatus === 'taking' && activeTest) {
      const questionsList = activeTest.questions || [];
      const question = questionsList[currentQIndex];
      
      if (!question) {
          setTimeout(() => setRenderError("Question data is missing. Tell Admin to recreate this test."), 0);
          return null;
      }
      
      return (
        <div className="min-h-screen bg-black w-full text-white flex flex-col font-sans select-none">
          <div className="bg-gray-900 p-4 border-b-2 border-blue-600 flex flex-wrap justify-between items-center shadow-lg sticky top-0 z-50 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-blue-400">{activeTest.subject || 'Test'}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setLanguage(lang => lang === 'english' ? 'hindi' : 'english')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                🌐 {language === 'english' ? 'View in Hindi' : 'View in English'}
              </button>
              <div
