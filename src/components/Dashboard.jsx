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
    
    // SAFE MATH REPLACEMENT (No aggressive Regex)
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
              <div className={`text-xl md:text-3xl font-extrabold px-4 py-1 rounded-xl shadow-inner ${timeLeft < 300 ? 'bg-red-900 text-red-100 animate-pulse' : 'bg-gray-800 text-yellow-400'}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
              <button onClick={handleSubmitTest} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg hidden md:block">Submit</button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 border-b border-gray-700 flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
            {questionsList.map((_, idx) => {
              const status = questionStatus[idx] || 'unattempted';
              let btnColor = 'bg-blue-600 border-blue-700'; 
              if (status === 'answered') btnColor = 'bg-green-500 border-green-600';
              if (status === 'skipped') btnColor = 'bg-red-500 border-red-600';
              if (currentQIndex === idx) btnColor += ' ring-4 ring-yellow-400 transform scale-110';
              return <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`w-10 h-10 md:w-12 md:h-12 rounded-lg font-bold text-white border-2 transition-all ${btnColor}`}>{idx + 1}</button>;
            })}
          </div>

          <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col">
            <div className="mb-4 flex justify-between items-end">
              <span className="text-xl md:text-2xl font-bold text-gray-400">Question {currentQIndex + 1} of {questionsList.length}</span>
              <span className="text-sm text-red-500 font-bold">Warnings: {warnings}/3</span>
            </div>

            <div className="bg-gray-900 p-6 md:p-10 rounded-3xl border-2 border-gray-700 shadow-xl mb-6 flex-1 overflow-auto">
              <h3 className="text-2xl md:text-3xl font-semibold text-yellow-300 mb-8 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: parseText(question?.question) }} />
              <div className="flex flex-col gap-4">
                {(question?.options || []).map((opt, idx) => (
                  <button key={idx} onClick={() => handleOptionSelect(opt)} className={`text-left p-5 md:p-6 rounded-2xl text-xl md:text-2xl font-medium border-2 transition-all duration-200 flex items-start gap-3 ${answers[currentQIndex] === opt ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-black border-gray-600 text-gray-300 hover:bg-gray-800'}`}>
                    <span className="font-bold">{String.fromCharCode(65 + idx)}.</span>
                    <span dangerouslySetInnerHTML={{ __html: parseText(opt) }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center bg-gray-900 p-4 rounded-2xl border-2 border-gray-800 gap-4">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-xl font-bold text-xl">Previous</button>
              <button onClick={handleSkip} className="px-6 py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold text-xl">Skip</button>
              {currentQIndex < questionsList.length - 1 ? (
                <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl">Next</button>
              ) : (
                <button onClick={handleSubmitTest} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl md:hidden">Submit</button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (testStatus === 'submitted' && result) {
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 flex items-center justify-center font-sans">
          <div className="bg-gray-900 border-2 border-green-500 rounded-3xl p-8 md:p-12 max-w-3xl w-full text-center shadow-[0_0_40px_rgba(34,197,94,0.3)]">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-400 mb-4">Test Submitted!</h1>
            <h2 className="text-2xl text-yellow-400 mb-8">{activeTest?.subject || 'Test'}</h2>
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 text-left">
              <div className="bg-black p-6 rounded-2xl border border-gray-700"><p className="text-gray-400 text-lg">Total Score</p><p className="text-4xl font-bold text-blue-400">{result.obtainedMarks} / {result.totalMarks}</p></div>
              <div className="bg-black p-6 rounded-2xl border border-gray-700"><p className="text-gray-400 text-lg">Percentage</p><p className="text-4xl font-bold text-yellow-400">{result.percentage}%</p></div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={handleReviewClick} className="bg-yellow-600 hover:bg-yellow-700 font-bold py-4 px-8 text-xl rounded-xl">Review Answers</button>
              <button onClick={() => {setTestStatus('dashboard'); setActiveTest(null);}} className="bg-blue-600 hover:bg-blue-700 font-bold py-4 px-8 text-xl rounded-xl">Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    if (testStatus === 'review' && activeTest) {
      const questionsList = activeTest.questions || [];
      return (
        <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4 sticky top-0 bg-black z-10 pt-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400">Review</h1>
            <button onClick={() => setTestStatus('submitted')} className="bg-gray-700 hover:bg-gray-600 font-bold py-3 px-8 text-xl rounded-xl">Back</button>
          </div>
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            {questionsList.map((q, idx) => {
              if (!q) return null;
              const studentAns = answers[idx]; const isCorrect = studentAns === q.answer; const isUnanswered = !studentAns;
              return (
                <div key={idx} className={`bg-gray-900 p-6 md:p-8 rounded-3xl border-l-8 shadow-lg ${isCorrect ? 'border-green-500' : isUnanswered ? 'border-gray-500' : 'border-red-500'}`}>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-200 mb-6 flex items-start gap-2">
                    <span>Q{idx + 1}.</span> <span dangerouslySetInnerHTML={{ __html: parseText(q.question) }} />
                  </h3>
                  <div className="flex flex-col gap-3 mb-6">
                    {(q.options || []).map((opt, oIdx) => {
                      let optStyle = "bg-black border-gray-700 text-gray-400";
                      if (opt === q.answer) optStyle = "bg-green-900 border-green-500 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
                      else if (opt === studentAns && !isCorrect) optStyle = "bg-red-900 border-red-500 text-red-100";
                      return (
                        <div key={oIdx} className={`p-4 rounded-xl border-2 text-lg flex items-start gap-3 ${optStyle}`}>
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span dangerouslySetInnerHTML={{ __html: parseText(opt) }} />
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
        return <div className="min-h-screen bg-black text-white flex items-center justify-center"><h2 className="text-3xl animate-pulse">Processing Test...</h2></div>
    }

    return <div className="min-h-screen bg-black text-white flex items-center justify-center"><h2 className="text-3xl text-red-500">Error: Please refresh the page.</h2></div>;
    
  } catch (e) {
    setTimeout(() => setRenderError(e.message || "Unknown rendering error occurred."), 0);
    return null;
  }
}
