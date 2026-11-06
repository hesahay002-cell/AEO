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
  
  // NEW: Track First Attempt and Loading States
  const [firstAttemptData, setFirstAttemptData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

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
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
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

  const checkTimeStatus = (startTime, endTime) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (now < start) return { status: 'upcoming', text: 'Upcoming' };
    if (now > end) return { status: 'expired', text: 'Expired' };
    return { status: 'active', text: 'Start Test' };
  };

  const handleStartTest = async (test) => {
    setRenderError(""); 
    const now = new Date().getTime();
    if (now < new Date(test.startTime).getTime()) return alert("This test has not started yet.");
    if (now > new Date(test.endTime).getTime()) return alert("This test has expired.");
    
    if (!test.questions || !Array.isArray(test.questions) || test.questions.length === 0) {
        localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`);
        return alert("Error: This test is corrupted. Please tell Admin to delete and recreate it.");
    }

    setIsStarting(true);
    // SMART FIX: Check if first attempt already exists in DB
    try {
      const q = query(collection(db, "results"), where("testId", "==", test.id), where("studentId", "==", user?.phone || user?.uid));
      const pastResults = await getDocs(q);
      if (!pastResults.empty) {
        setFirstAttemptData(pastResults.docs[0].data());
      } else {
        setFirstAttemptData(null);
      }
    } catch (err) {
      console.error("Error fetching past attempts:", err);
    }
    setIsStarting(false);

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

      let engPart = engMatch && engMatch[1] ? engMatch[1].trim() : '';
      let hinPart = hinMatch && hinMatch[1] ? hinMatch[1].trim() : '';
      if (!engPart && hinPart) engPart = hinPart;
      if (!hinPart && engPart) hinPart = engPart;

      text = sharedText ? `${sharedText}<br/><br/>${language === 'english' ? engPart : hinPart}` : (language === 'english' ? engPart : hinPart);
    } else if (text.includes(" / ")) {
      const parts = text.split(" / ");
      text = language === 'english' ? (parts[0]||'').trim() : (parts[1] ? parts[1].trim() : (parts[0]||'').trim());
    }

    text = text.replace(/\\xrightarrow(?!\s*\{)/g, '\\rightarrow');
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => '\\(' + (formula||'').trim() + '\\)');

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
      wrongAnswers: wrongCount, warnings: warnings, submittedAt: new Date().toISOString(),
      answers: answers // IMPORTANT: Save exact answers for accurate future review
    };

    try {
      // SMART FIX: ONLY SAVE TO DB IF IT'S THE FIRST ATTEMPT!
      if (!firstAttemptData) {
        await addDoc(collection(db, "results"), finalResult);
        setFirstAttemptData(finalResult); 

        // --- NEW: WHATSAPP RESULT CODE START ---
        // Sirf pehle attempt par hi WhatsApp par result jayega
        const META_TOKEN = "EAAUzbFPL5GIBSb8M09o9XYfhoCDcroxJaZCTGl985d2OqgAaZBFiZA3k1ZAWoDhfMzQe2mN8O2tTzLtpAHyxlpaCc9ybSGu1SkAl4f24tjnSfpIyu6gct8CmPVpYijcq8KOAi8TQvQ780W7oDG8PtzkaDqZBS2pLGvgMY3lTUOFkoqGUf8DxvbhXiRGHt3v5sLAZDZD"; 
        const PHONE_NUMBER_ID = "1258484434020011";
        
        // Student ka naam (Variable 1), Obtained Marks (Variable 2), Total Marks (Variable 3)
        const studentNameStr = String(finalResult.studentName);
        const marksObtainedStr = String(finalResult.obtainedMarks);
        const totalMarksStr = String(finalResult.totalMarks);
        // Phone number (10 digit confirm karein)
        const targetPhone = String(user?.phone || user?.uid).replace(/[^0-9]/g, '').slice(0, 10);

        if (targetPhone.length === 10) {
            const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
            const payload = {
              messaging_product: "whatsapp",
              to: `91${targetPhone}`,
              type: "template",
              template: {
                name: "aeo_test_result", // Aapka naya approve hua template name
                language: { code: "en" }, // English ke liye. Agar English (US) tha to "en_US"
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: studentNameStr },
                      { type: "text", text: marksObtainedStr },
                      { type: "text", text: totalMarksStr }
                    ]
                  }
                ]
              }
            };
            
            // Meta API ko call karein (background me)
            fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${META_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }).catch(e => console.error("WhatsApp Result Error:", e));
        }
        // --- WHATSAPP RESULT CODE END ---

      }
      
      // UI me marks dikhane ke liye local state update karo (bhale hi 100th baar submit ho)
      setResult(finalResult);
      setTestStatus('submitted');
    } catch (error) { 
      alert("Error saving result! Check internet connection."); 
      console.error(error); 
      setTestStatus('taking'); // Revert so they can try again
    }
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
    } else { 
      // SMART FIX: Force Review to show FIRST ATTEMPT answers!
      if (firstAttemptData && firstAttemptData.answers) {
        setAnswers(firstAttemptData.answers);
      }
      setTestStatus('review'); 
    }
  };

  if (renderError) {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ Oops! Something broke.</h1>
              <p className="text-xl text-gray-300 mb-8">Error details: {renderError}</p>
              <button onClick={() => { setRenderError(""); setTestStatus('dashboard'); setActiveTest(null); localStorage.removeItem(`aeo_test_${user?.phone || user?.uid || 'temp'}`); }} className="bg-blue-600 px-8 py-4 rounded-xl font-bold text-xl shadow-[0_10px_20px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all">Back to Dashboard</button>
          </div>
      );
  }

  try {
    if (testStatus === 'dashboard') {
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-6 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 tracking-wider drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">AEO Portal</h1>
              <p className="text-yellow-400 mt-2 text-lg font-bold tracking-wide">Welcome, {user?.name || 'Student'} ({user?.className || 'Class'})</p>
            </div>
            <button onClick={onLogout} className="bg-gradient-to-t from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-black py-3 px-8 rounded-2xl shadow-[0_8px_20px_rgba(220,38,38,0.4),inset_0_2px_2px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all active:translate-y-1 w-full md:w-auto uppercase tracking-widest text-sm">Logout</button>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-[2rem] p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <h2 className="text-3xl text-yellow-400 font-extrabold mb-8 drop-shadow-md">Available Tests for You</h2>
            {availableTests.length === 0 ? (
              <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-3xl bg-black/30"><p className="text-gray-400 text-2xl font-bold tracking-wide">No tests are currently assigned to your class.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {availableTests.map((test) => {
                  const timeStatus = checkTimeStatus(test.startTime, test.endTime);
                  return (
                    <div key={test.id} className="bg-black/80 backdrop-blur-md border border-gray-700 p-6 rounded-3xl flex flex-col justify-between shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(59,130,246,0.3)] hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-green-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-blue-400 mb-3 drop-shadow-md">{test.subject || 'Subject'}</h3>
                        <p className="text-gray-300 text-lg mb-1 font-semibold flex items-center gap-2">⏱ {test.durationMinutes || 0} Mins | 📝 {test?.questions?.length || 0} Qs</p>
                        <p className="text-gray-400 text-md font-bold flex items-center gap-2">🏆 +{test.marksPerQuestion || 0} / ❌ -{test.negativeMarks || 0}</p>
                      </div>
                      <button disabled={isStarting} onClick={() => handleStartTest(test)} className={`mt-8 py-4 px-6 rounded-2xl font-black text-xl w-full transition-all duration-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] active:translate-y-1 ${timeStatus.status === 'active' ? 'bg-gradient-to-t from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white shadow-[0_8px_20px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_25px_rgba(34,197,94,0.6)]' : 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'}`}>
                        {isStarting ? 'Loading...' : timeStatus.text}
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
        <div className="min-h-screen bg-black w-full text-white flex flex-col font-sans select-none relative">
          <div className="bg-gray-900/90 backdrop-blur-xl p-4 md:p-5 border-b border-blue-900/50 flex flex-wrap justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.5)] sticky top-0 z-50 gap-4">
            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200 tracking-wide">{activeTest.subject || 'Test'}</h2>
            <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto justify-between md:justify-end">
              <button onClick={() => setLanguage(lang => lang === 'english' ? 'hindi' : 'english')} className="bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 text-indigo-300 font-bold py-2.5 px-4 rounded-xl transition-all shadow-inner text-sm md:text-base whitespace-nowrap">
                🌐 {language === 'english' ? 'A↔अ Hindi' : 'A↔अ English'}
              </button>
              <div className={`text-xl md:text-3xl font-black px-5 py-2 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border ${timeLeft < 300 ? 'bg-red-950/80 border-red-500/50 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-black/50 border-gray-700 text-yellow-400'}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
              <button onClick={handleSubmitTest} className="bg-gradient-to-t from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-black py-2.5 px-6 rounded-xl hidden md:block shadow-[0_5px_15px_rgba(220,38,38,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all active:translate-y-1">Submit</button>
            </div>
          </div>

          {/* PALETTE (Responsive & Auto-Adjusting) */}
          <div className="bg-gray-900/50 backdrop-blur-md p-4 border-b border-gray-800 flex flex-wrap gap-2 md:gap-3 justify-center max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
            {questionsList.map((_, idx) => {
              const status = questionStatus[idx] || 'unattempted';
              let btnColor = 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'; 
              if (status === 'answered') btnColor = 'bg-gradient-to-br from-green-500 to-green-700 border-green-400 text-white shadow-[0_2px_10px_rgba(34,197,94,0.3)]';
              if (status === 'skipped') btnColor = 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white shadow-[0_2px_10px_rgba(239,68,68,0.3)]';
              if (currentQIndex === idx) btnColor = 'bg-blue-600 border-yellow-400 text-white ring-2 ring-yellow-400 ring-offset-2 ring-offset-black transform scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10';
              return <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl font-black text-sm md:text-base border transition-all duration-200 ${btnColor}`}>{idx + 1}</button>;
            })}
          </div>

          <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col">
            <div className="mb-4 flex justify-between items-end px-2">
              <span className="text-xl md:text-2xl font-black text-gray-400 drop-shadow-md">Question <span className="text-blue-400">{currentQIndex + 1}</span> / {questionsList.length}</span>
              <span className="text-sm md:text-base text-red-500 font-bold bg-red-950/30 px-3 py-1 rounded-full border border-red-900/50">⚠️ Warnings: {warnings}/3</span>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6 flex-1 overflow-auto custom-scrollbar">
              <h3 className="text-xl md:text-3xl font-bold text-yellow-300 mb-8 whitespace-pre-wrap leading-relaxed drop-shadow-md" dangerouslySetInnerHTML={{ __html: parseText(question?.question) }} />
              <div className="flex flex-col gap-4 md:gap-5">
                {(question?.options || []).map((opt, idx) => (
                  <button key={idx} onClick={() => handleOptionSelect(opt)} className={`w-full text-left p-5 md:p-6 rounded-2xl text-lg md:text-2xl font-semibold border transition-all duration-300 flex items-start gap-4 shadow-sm active:scale-[0.99] ${answers[currentQIndex] === opt ? 'bg-blue-600/20 border-blue-400 text-blue-100 shadow-[0_0_20px_rgba(37,99,235,0.3),inset_0_0_15px_rgba(37,99,235,0.2)]' : 'bg-black/50 border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:border-gray-500'}`}>
                    <span className={`font-black shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg ${answers[currentQIndex] === opt ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-800 text-gray-400'}`}>{String.fromCharCode(65 + idx)}</span>
                    <span className="mt-1" dangerouslySetInnerHTML={{ __html: parseText(opt) }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center bg-gray-900/60 backdrop-blur-xl p-4 md:p-5 rounded-3xl border border-gray-800/80 gap-3 md:gap-4 shadow-xl">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)} className="flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-2xl font-black text-base md:text-xl border border-gray-700 transition-all active:translate-y-1">Previous</button>
              <button onClick={handleSkip} className="flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 bg-gradient-to-t from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white border border-red-500/50 rounded-2xl font-black text-base md:text-xl shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all active:translate-y-1">Skip</button>
              {currentQIndex < questionsList.length - 1 ? (
                <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="flex-[2] md:flex-none px-6 md:px-10 py-3 md:py-4 bg-gradient-to-t from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-2xl font-black text-base md:text-xl shadow-[0_8px_20px_rgba(37,99,235,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 active:translate-y-1">Next Q</button>
              ) : (
                <button onClick={handleSubmitTest} className="flex-[2] md:flex-none px-6 md:px-10 py-3 md:py-4 bg-gradient-to-t from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white rounded-2xl font-black text-base md:text-xl shadow-[0_8px_20px_rgba(34,197,94,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 active:translate-y-1 md:hidden">Submit Final</button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (testStatus === 'submitted' && result) {
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 flex items-center justify-center font-sans relative overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-green-600 rounded-full blur-[150px] opacity-20 animate-pulse"></div>
          
          <div className="bg-gray-900/80 backdrop-blur-2xl border border-green-500/50 rounded-[3rem] p-8 md:p-12 max-w-3xl w-full text-center shadow-[0_20px_60px_rgba(34,197,94,0.2),inset_0_2px_2px_rgba(255,255,255,0.1)] relative z-10">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-4 drop-shadow-lg">Test Submitted!</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-10 tracking-wide drop-shadow-md">{activeTest?.subject || 'Test'}</h2>
            
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-10 text-left">
              <div className="bg-black/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-gray-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-all duration-300">
                <p className="text-gray-400 text-sm md:text-lg font-bold uppercase tracking-widest mb-2">Total Score</p>
                <p className="text-4xl md:text-6xl font-black text-blue-400 drop-shadow-md">{result.obtainedMarks} <span className="text-2xl md:text-4xl text-gray-600">/ {result.totalMarks}</span></p>
              </div>
              <div className="bg-black/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-gray-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-all duration-300">
                <p className="text-gray-400 text-sm md:text-lg font-bold uppercase tracking-widest mb-2">Percentage</p>
                <p className="text-4xl md:text-6xl font-black text-yellow-400 drop-shadow-md">{result.percentage}%</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
              <button onClick={handleReviewClick} className="w-full md:w-auto bg-gradient-to-t from-yellow-700 to-yellow-500 hover:from-yellow-600 hover:to-yellow-400 text-black font-black py-4 px-10 text-lg md:text-xl rounded-2xl shadow-[0_10px_25px_rgba(234,179,8,0.4),inset_0_2px_2px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all active:translate-y-1">Review Answers</button>
              <button onClick={() => {setTestStatus('dashboard'); setActiveTest(null);}} className="w-full md:w-auto bg-gradient-to-t from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-black py-4 px-10 text-lg md:text-xl rounded-2xl shadow-[0_10px_25px_rgba(37,99,235,0.4),inset_0_2px_2px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all active:translate-y-1">Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    if (testStatus === 'review' && activeTest) {
      const questionsList = activeTest.questions || [];
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
          <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6 sticky top-0 bg-black/90 backdrop-blur-xl z-20 pt-4 shadow-xl px-4 rounded-b-2xl">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-lg">Smart Review</h1>
            <button onClick={() => setTestStatus('submitted')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 font-black py-3 px-8 text-sm md:text-lg rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all">Go Back</button>
          </div>
          
          <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-10">
            {questionsList.map((q, idx) => {
              if (!q) return null;
              const studentAns = answers[idx]; const isCorrect = studentAns === q.answer; const isUnanswered = !studentAns;
              return (
                <div key={idx} className={`bg-gray-900/70 backdrop-blur-lg p-6 md:p-10 rounded-[2rem] border-l-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-1 ${isCorrect ? 'border-l-green-500' : isUnanswered ? 'border-l-gray-500' : 'border-l-red-500'}`}>
                  <h3 className="text-xl md:text-3xl font-bold text-gray-100 mb-8 flex items-start gap-4 drop-shadow-md">
                    <span className="text-gray-500 font-black shrink-0">Q{idx + 1}.</span> <span dangerouslySetInnerHTML={{ __html: parseText(q.question) }} />
                  </h3>
                  <div className="flex flex-col gap-4">
                    {(q.options || []).map((opt, oIdx) => {
                      let optStyle = "bg-black/50 border-gray-700/50 text-gray-400";
                      let badge = null;
                      if (opt === q.answer) {
                        optStyle = "bg-green-900/40 border-green-500/50 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.2),inset_0_0_10px_rgba(34,197,94,0.2)] transform scale-[1.02]";
                        badge = <span className="ml-auto bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">CORRECT ANSWER</span>;
                      }
                      else if (opt === studentAns && !isCorrect) {
                        optStyle = "bg-red-900/40 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                        badge = <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">YOUR ANSWER</span>;
                      }
                      return (
                        <div key={oIdx} className={`p-5 md:p-6 rounded-2xl border-2 text-lg md:text-xl font-medium flex items-center gap-4 transition-all ${optStyle}`}>
                          <span className={`font-black shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg ${opt === q.answer ? 'bg-green-600 text-white' : opt === studentAns && !isCorrect ? 'bg-red-600 text-white' : 'bg-gray-800'}`}>{String.fromCharCode(65 + oIdx)}</span>
                          <span dangerouslySetInnerHTML={{ __html: parseText(opt) }} />
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (testStatus === 'processing') {
        return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden"><div className="w-32 h-32 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(37,99,235,0.5)]"></div><h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 animate-pulse tracking-widest uppercase">Processing Test...</h2></div>
    }

    return <div className="min-h-screen bg-black text-white flex items-center justify-center"><h2 className="text-3xl text-red-500 font-bold">Error: Please refresh the page.</h2></div>;
    
  } catch (e) {
    setTimeout(() => setRenderError(e.message || "Unknown rendering error occurred."), 0);
    return null;
  }
}
