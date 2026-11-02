import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function Dashboard({ user, onLogout }) {
  const [availableTests, setAvailableTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  
  // Test Taking States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({}); // 'unattempted'(blue), 'answered'(green), 'skipped'(red)
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStatus, setTestStatus] = useState('dashboard'); // dashboard, taking, submitted, review
  const [warnings, setWarnings] = useState(0);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('english'); // english or hindi

  useEffect(() => {
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    try {
      const q = query(collection(db, "tests"), where("className", "==", user.className));
      const querySnapshot = await getDocs(q);
      const fetchedTests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableTests(fetchedTests);
    } catch (error) {
      console.error("Error fetching tests: ", error);
    }
  };

  // ================= TIMER LOGIC =================
  useEffect(() => {
    let timer;
    if (testStatus === 'taking' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (testStatus === 'taking' && timeLeft === 0) {
      handleSubmitTest(); // Auto-submit when time is up
    }
    return () => clearInterval(timer);
  }, [testStatus, timeLeft]);

  // ================= STRICT ANTI-CHEAT LOGIC (3 Warnings) =================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStatus === 'taking') {
        setWarnings(prev => {
          const newCount = prev + 1;
          if (newCount < 3) {
            alert(`WARNING ${newCount}/3: Window switching or minimizing is not allowed! Your test will auto-submit on the 3rd warning.`);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testStatus]);

  // Trigger Submit on 3rd Warning
  useEffect(() => {
    if (warnings >= 3 && testStatus === 'taking') {
      alert("🚨 MAXIMUM WARNINGS REACHED! You violated the rules 3 times. Test is automatically submitting.");
      handleSubmitTest();
    }
  }, [warnings, testStatus]);

  const checkTimeStatus = (startTime, endTime) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (now < start) return { status: 'upcoming', text: 'Upcoming' };
    if (now > end) return { status: 'expired', text: 'Expired' };
    return { status: 'active', text: 'Start Test' };
  };

  const handleStartTest = (test) => {
    const timeStatus = checkTimeStatus(test.startTime, test.endTime);
    if (timeStatus.status === 'upcoming') return alert("This test has not started yet.");
    if (timeStatus.status === 'expired') return alert("This test has expired.");
    
    setActiveTest(test);
    setTimeLeft(test.durationMinutes * 60);
    setAnswers({});
    setQuestionStatus({});
    setCurrentQIndex(0);
    setWarnings(0);
    setLanguage('english');
    setTestStatus('taking');
    
    if(document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    }
  };

  // Smart Parser for English/Hindi Separation
  const parseText = (text) => {
    if (!text) return "";
    
    // Format 1: Eng: ... Hin: ...
    if (text.includes("Eng:") && text.includes("Hin:")) {
      const parts = text.split("Hin:");
      const engPart = parts[0].replace("Eng:", "").trim();
      const hinPart = parts[1].trim();
      return language === 'english' ? engPart : hinPart;
    }
    
    // Format 2: English / Hindi (Options format)
    if (text.includes(" / ")) {
      const parts = text.split(" / ");
      return language === 'english' ? parts[0].trim() : (parts[1] ? parts[1].trim() : parts[0].trim());
    }
    
    return text; // Default fallback
  };

  const handleOptionSelect = (opt) => {
    setAnswers({ ...answers, [currentQIndex]: opt });
    setQuestionStatus({ ...questionStatus, [currentQIndex]: 'answered' });
  };

  const handleSkip = () => {
    setQuestionStatus({ ...questionStatus, [currentQIndex]: 'skipped' });
    if (currentQIndex < activeTest.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handleSubmitTest = async () => {
    const isConfirmed = (timeLeft === 0 || warnings >= 3) ? true : window.confirm("Are you sure you want to submit the entire test?");
    if (!isConfirmed) return;

    setTestStatus('processing');
    if(document.fullscreenElement) document.exitFullscreen().catch(e=>console.log(e));

    let marksObtained = 0;
    let correctCount = 0;
    let wrongCount = 0;

    activeTest.questions.forEach((q, index) => {
      const studentAns = answers[index];
      if (studentAns === q.answer) {
        marksObtained += activeTest.marksPerQuestion;
        correctCount++;
      } else if (studentAns) {
        marksObtained -= activeTest.negativeMarks;
        wrongCount++;
      }
    });

    const totalMarks = activeTest.questions.length * activeTest.marksPerQuestion;
    const percentage = ((marksObtained / totalMarks) * 100).toFixed(2);

    const finalResult = {
      testId: activeTest.id,
      studentId: user.uid || user.phone,
      studentName: user.name,
      school: user.school,
      className: user.className,
      obtainedMarks: marksObtained,
      totalMarks: totalMarks,
      percentage: percentage,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      warnings: warnings,
      submittedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "results"), finalResult);
      setResult(finalResult);
      setTestStatus('submitted');
    } catch (error) {
      alert("Error saving result! Please take a screenshot.");
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ================= NEW: SMART REVIEW HANDLER =================
  const handleReviewClick = () => {
    const now = new Date().getTime();
    const end = new Date(activeTest.endTime).getTime();
    
    if (now < end) {
      const formattedTime = new Date(activeTest.endTime).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      alert(`Review and Answer Key will be available after the test expires on ${formattedTime}.`);
    } else {
      setTestStatus('review');
    }
  };

  // ================= VIEW: DASHBOARD =================
  if (testStatus === 'dashboard') {
    return (
      <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-red-500 tracking-wider">AEO Portal</h1>
            <p className="text-yellow-400 mt-2 text-lg font-semibold">Welcome, {user.name} ({user.className})</p>
          </div>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg w-full md:w-auto">Logout</button>
        </div>

        <div className="bg-gray-900 border-2 border-blue-900 rounded-3xl p-6 md:p-10 shadow-2xl">
          <h2 className="text-3xl text-yellow-400 font-bold mb-8">Available Tests for You</h2>
          
          {availableTests.length === 0 ? (
            <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-2xl">
              <p className="text-gray-400 text-2xl">No tests are currently assigned to your class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableTests.map((test) => {
                const timeStatus = checkTimeStatus(test.startTime, test.endTime);
                return (
                  <div key={test.id} className="bg-black border-2 border-gray-700 p-6 rounded-2xl flex flex-col justify-between hover:border-blue-500 transition-colors shadow-lg">
                    <div>
                      <h3 className="text-3xl font-extrabold text-blue-400 mb-2">{test.subject}</h3>
                      <p className="text-gray-300 text-lg mb-1">Time: {test.durationMinutes} Mins | {test.questions?.length || 0} Qs</p>
                      <p className="text-gray-400 text-md">Marks: +{test.marksPerQuestion} / -{test.negativeMarks}</p>
                      <div className="mt-4 p-3 bg-gray-800 rounded-xl text-sm text-gray-300">
                        <p>Starts: {new Date(test.startTime).toLocaleString()}</p>
                        <p>Ends: {new Date(test.endTime).toLocaleString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartTest(test)}
                      className={`mt-6 py-4 px-6 rounded-xl font-extrabold text-xl w-full shadow-lg transition-transform active:scale-95
                        ${timeStatus.status === 'active' ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                          timeStatus.status === 'upcoming' ? 'bg-blue-800 text-gray-300 cursor-not-allowed' : 
                          'bg-red-900 text-gray-400 cursor-not-allowed'}`}
                    >
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

  // ================= VIEW: TAKING TEST =================
  if (testStatus === 'taking' && activeTest) {
    const question = activeTest.questions[currentQIndex];
    return (
      <div className="min-h-screen bg-black w-full text-white flex flex-col font-sans select-none">
        
        {/* Top Header: Info, Language, Timer, Submit */}
        <div className="bg-gray-900 p-4 border-b-2 border-blue-600 flex flex-wrap justify-between items-center shadow-lg sticky top-0 z-50 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-blue-400">{activeTest.subject}</h2>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLanguage(lang => lang === 'english' ? 'hindi' : 'english')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              🌐 {language === 'english' ? 'View in Hindi' : 'View in English'}
            </button>
            <div className={`text-xl md:text-3xl font-extrabold px-4 py-1 rounded-xl shadow-inner ${timeLeft < 300 ? 'bg-red-900 text-red-100 animate-pulse' : 'bg-gray-800 text-yellow-400'}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmitTest} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg hidden md:block">
              Submit Test
            </button>
          </div>
        </div>

        {/* Question Palette (1, 2, 3...) */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
          {activeTest.questions.map((_, idx) => {
            const status = questionStatus[idx] || 'unattempted';
            let btnColor = 'bg-blue-600 border-blue-700'; // Default unattempted
            if (status === 'answered') btnColor = 'bg-green-500 border-green-600';
            if (status === 'skipped') btnColor = 'bg-red-500 border-red-600';
            
            const isCurrent = currentQIndex === idx;
            if (isCurrent) btnColor += ' ring-4 ring-yellow-400 transform scale-110';

            return (
              <button 
                key={idx} 
                onClick={() => setCurrentQIndex(idx)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg font-bold text-white border-2 shadow-md transition-all ${btnColor}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Area */}
        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col">
          <div className="mb-4 flex justify-between items-end">
            <span className="text-xl md:text-2xl font-bold text-gray-400">Question {currentQIndex + 1} of {activeTest.questions.length}</span>
            <span className="text-sm text-red-500 font-bold">Warnings: {warnings}/3</span>
          </div>

          <div className="bg-gray-900 p-6 md:p-10 rounded-3xl border-2 border-gray-700 shadow-xl mb-6 flex-1">
            <h3 className="text-2xl md:text-3xl font-semibold text-yellow-300 mb-8 whitespace-pre-wrap leading-relaxed">
              {parseText(question.question)}
            </h3>

            <div className="flex flex-col gap-4">
              {question.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleOptionSelect(opt)}
                  className={`text-left p-5 md:p-6 rounded-2xl text-xl md:text-2xl font-medium border-2 transition-all duration-200
                    ${answers[currentQIndex] === opt 
                      ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)] text-white' 
                      : 'bg-black border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-gray-800'}`}
                >
                  <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                  {parseText(opt)}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex flex-wrap justify-between items-center bg-gray-900 p-4 rounded-2xl border-2 border-gray-800 gap-4">
            <button 
              disabled={currentQIndex === 0} 
              onClick={() => setCurrentQIndex(prev => prev - 1)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-xl font-bold text-xl transition-colors"
            >
              Previous
            </button>
            
            <button 
              onClick={handleSkip}
              className="px-6 py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold text-xl transition-colors"
            >
              Skip
            </button>

            {currentQIndex < activeTest.questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQIndex(prev => prev + 1)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl shadow-[0_0_15px_rgba(0,0,255,0.3)] transition-colors"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleSubmitTest}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl shadow-[0_0_15px_rgba(0,255,0,0.4)] transition-colors animate-pulse md:hidden"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW: SUBMITTED (RESULT) =================
  if (testStatus === 'submitted' && result) {
    return (
      <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 flex items-center justify-center font-sans">
        <div className="bg-gray-900 border-2 border-green-500 rounded-3xl p-8 md:p-12 max-w-3xl w-full text-center shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-400 mb-4">Test Submitted Successfully!</h1>
          <h2 className="text-2xl text-yellow-400 mb-8">{activeTest.subject}</h2>

          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 text-left">
            <div className="bg-black p-6 rounded-2xl border border-gray-700">
              <p className="text-gray-400 text-lg">Total Score</p>
              <p className="text-4xl font-bold text-blue-400">{result.obtainedMarks} <span className="text-xl text-gray-500">/ {result.totalMarks}</span></p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-gray-700">
              <p className="text-gray-400 text-lg">Percentage</p>
              <p className="text-4xl font-bold text-yellow-400">{result.percentage}%</p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-gray-700">
              <p className="text-gray-400 text-lg">Correct Answers</p>
              <p className="text-3xl font-bold text-green-500">{result.correctAnswers}</p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-gray-700">
              <p className="text-gray-400 text-lg">Wrong Answers</p>
              <p className="text-3xl font-bold text-red-500">{result.wrongAnswers}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {/* Click karne par expiry time check hoga */}
            <button onClick={handleReviewClick} className="bg-yellow-600 hover:bg-yellow-700 font-bold py-4 px-8 text-xl rounded-xl shadow-lg transition-transform active:scale-95 w-full md:w-auto">
              Review Answers
            </button>
            <button onClick={() => {setTestStatus('dashboard'); setActiveTest(null);}} className="bg-blue-600 hover:bg-blue-700 font-bold py-4 px-8 text-xl rounded-xl shadow-lg transition-transform active:scale-95 w-full md:w-auto">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW: REVIEW ANSWERS =================
  if (testStatus === 'review' && activeTest) {
    return (
      <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 font-sans">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4 sticky top-0 bg-black z-10 pt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400">Answer Key & Review</h1>
          <button onClick={() => setTestStatus('submitted')} className="bg-gray-700 hover:bg-gray-600 font-bold py-3 px-8 text-xl rounded-xl transition-colors">Back to Score</button>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {activeTest.questions.map((q, idx) => {
            const studentAns = answers[idx];
            const isCorrect = studentAns === q.answer;
            const isUnanswered = !studentAns;

            return (
              <div key={idx} className={`bg-gray-900 p-6 md:p-8 rounded-3xl border-l-8 shadow-lg ${isCorrect ? 'border-green-500' : isUnanswered ? 'border-gray-500' : 'border-red-500'}`}>
                <h3 className="text-xl md:text-2xl font-bold text-gray-200 mb-6 whitespace-pre-wrap">Q{idx + 1}. {parseText(q.question)}</h3>
                
                <div className="flex flex-col gap-3 mb-6">
                  {q.options.map((opt, oIdx) => {
                    let optStyle = "bg-black border-gray-700 text-gray-400";
                    if (opt === q.answer) optStyle = "bg-green-900 border-green-500 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
                    else if (opt === studentAns && !isCorrect) optStyle = "bg-red-900 border-red-500 text-red-100";
                    
                    return (
                      <div key={oIdx} className={`p-4 rounded-xl border-2 text-lg ${optStyle}`}>
                        {String.fromCharCode(65 + oIdx)}. {parseText(opt)}
                      </div>
                    );
                  })}
                </div>

                {q.review && (
                  <div className="mt-4 p-5 bg-blue-900/30 border border-blue-800 rounded-xl">
                    <p className="text-blue-300 font-bold mb-2">Explanation (व्याख्या):</p>
                    <p className="text-gray-300 text-lg whitespace-pre-wrap leading-relaxed">{parseText(q.review)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
