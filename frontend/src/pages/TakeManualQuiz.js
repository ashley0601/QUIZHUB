import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { 
  Loader, Send, CheckCircle, AlertCircle, Clock, 
  BookOpen, ArrowLeft, ArrowRight, CircleDot
} from 'lucide-react';
import '../styles/TakeManualQuiz.css';

function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TakeManualQuiz() {
  const { id } = useParams(); // Contains the CODE
  const navigate = useNavigate();
  
  const [step, setStep] = useState('INSTRUCTIONS'); 
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // React Router v6 stores state inside window.history.state.usr
    const stateQuiz = window.history.state?.usr?.quiz || window.history.state?.quiz;
    
    if (stateQuiz) {
        initQuiz(stateQuiz);
    } else {
        // Fallback if user refreshes the page directly
        API.get(`/manual-quiz/join/${id}/`).then(res => {
            initQuiz(res.data);
        }).catch(err => setError(err.response?.data?.error || "Failed to load")).finally(() => setLoading(false));
    }
  }, [id]);

  const initQuiz = (data) => {
    let qs = data.shuffle_questions ? shuffle(data.questions) : data.questions;
    qs = qs.map(q => ({
      ...q,
      choices: data.shuffle_choices ? shuffle(q.choices) : q.choices
    }));
    setQuiz({ ...data, questions: qs });
    setLoading(false);
  };

  // FIX: Added handleNext to the dependency array
  const handleNext = useCallback(() => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setStep('CONFIRM');
    }
  }, [currentIndex, quiz]);

  useEffect(() => {
    if (step === 'QUIZ' && quiz?.time_per_question) {
      setTimeLeft(quiz.time_per_question);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, currentIndex, quiz, handleNext]); // <-- FIXED WARNING HERE

  const handleSelect = (qId, cId) => setAnswers(prev => ({ ...prev, [qId]: { choice_id: cId } }));
  
  const handleCheckbox = (qId, cId, isChecked) => {
    setAnswers(prev => {
      const prevChoices = prev[qId]?.choice_ids || [];
      return { ...prev, [qId]: { choice_ids: isChecked ? [...prevChoices, cId] : prevChoices.filter(id => id !== cId) } };
    });
  };

  const handleText = (qId, text) => setAnswers(prev => ({ ...prev, [qId]: { text_answer: text } }));

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, data]) => ({
        question_id: parseInt(qId),
        ...data
      }));
      const res = await API.post(`/manual-quiz/${quiz.id}/submit/`, { answers: formattedAnswers });
      setResult(res.data);
      setStep('RESULTS');
    } catch (err) {
      alert(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="tq-loading"><Loader className="spin" size={40}/></div>;
  if (error) return <div className="tq-error"><AlertCircle size={48}/><h3>{error}</h3></div>;

  const currentQ = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
  const timerColor = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'safe';

  if (step === 'INSTRUCTIONS') {
    return (
      <div className="tq-container modern-quiz">
        <div className="instructions-card">
          <div className="inst-icon"><BookOpen size={40} /></div>
          <h1>{quiz.title}</h1>
          <p className="inst-desc">{quiz.description || "Please read the following instructions carefully before starting."}</p>
          <div className="rules-grid">
            <div className="rule-item"><CircleDot size={18} /> <span>Answer all questions sequentially.</span></div>
            <div className="rule-item"><CircleDot size={18} /> <span>You cannot go back to previous questions.</span></div>
            {quiz.time_per_question > 0 && <div className="rule-item"><Clock size={18} /> <span>Timer: {quiz.time_per_question} seconds per question.</span></div>}
            {quiz.show_results && <div className="rule-item"><CheckCircle size={18} /> <span>Feedback will be shown after submission.</span></div>}
          </div>
          <div className="inst-meta">
            <span className="meta-pill">{quiz.questions.length} Questions</span>
            {quiz.deadline && <span className="meta-pill warning">Due: {new Date(quiz.deadline).toLocaleDateString()}</span>}
          </div>
          <button className="tq-btn primary large" onClick={() => setStep('QUIZ')}>Begin Assessment <ArrowRight size={20} /></button>
        </div>
      </div>
    );
  }

  if (step === 'CONFIRM') {
    return (
      <div className="tq-container modern-quiz">
        <div className="confirm-card">
          <AlertCircle size={48} color="#f59e0b" />
          <h2>Submit Assessment?</h2>
          <p>You have answered <strong>{Object.keys(answers).length}</strong> out of <strong>{quiz.questions.length}</strong> questions.</p>
          <div className="confirm-actions">
            <button className="tq-btn outline" onClick={() => { setCurrentIndex(0); setStep('QUIZ'); }}><ArrowLeft size={18} /> Review</button>
            <button className="tq-btn primary" onClick={submitQuiz} disabled={submitting}>
              {submitting ? <Loader className="spin" size={18}/> : <Send size={18}/>} Confirm Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'RESULTS') {
    return (
      <div className="tq-container modern-quiz">
        <div className="result-card-main">
          <div className="score-circle-main">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" strokeDasharray={`${result.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="percentage">{result.percentage}%</span>
          </div>
          <h2>Assessment Complete!</h2>
          <p className="score-text">You scored <strong>{result.score}</strong> out of <strong>{result.total}</strong> points.</p>
          {quiz.show_results && result.feedback && (
            <div className="review-list">
              {quiz.questions.map((q, i) => {
                const fb = result.feedback.find(f => f.question_id === q.id);
                return (
                  <div key={i} className={`review-item-main ${fb?.is_correct ? 'correct' : 'incorrect'}`}>
                    <div className="review-header">
                      <span className="q-num">Q{i+1}</span>
                      <span className="fb-text">{fb?.feedback}</span>
                    </div>
                    <p className="q-text-review">{q.text}</p>
                  </div>
                );
              })}
            </div>
          )}
          <button className="tq-btn primary large" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tq-container modern-quiz active">
      <div className="quiz-topbar-main">
        <h3>{quiz.title}</h3>
        {quiz.time_per_question > 0 && (
          <div className={`timer-pill ${timerColor}`}><Clock size={16} /> {timeLeft}s</div>
        )}
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>

      <div className="question-card-main">
        <span className="q-index-main">Question {currentIndex + 1} of {quiz.questions.length}</span>
        <h2 className="q-title-main">{currentQ.text}</h2>
        <div className="options-area">
          {currentQ.question_type === 'multiple_choice' && currentQ.choices.map(c => (
            <div key={c.id} className={`option-card ${answers[currentQ.id]?.choice_id === c.id ? 'selected' : ''}`} onClick={() => handleSelect(currentQ.id, c.id)}>
              <div className="option-radio-main"></div><span>{c.text}</span>
            </div>
          ))}
          {currentQ.question_type === 'checkboxes' && currentQ.choices.map(c => (
            <div key={c.id} className={`option-card ${answers[currentQ.id]?.choice_ids?.includes(c.id) ? 'selected' : ''}`} onClick={() => handleCheckbox(currentQ.id, c.id, !answers[currentQ.id]?.choice_ids?.includes(c.id))}>
              <div className="option-checkbox-main"></div><span>{c.text}</span>
            </div>
          ))}
          {currentQ.question_type === 'true_false' && currentQ.choices.map(c => (
            <div key={c.id} className={`option-card tf-card ${answers[currentQ.id]?.choice_id === c.id ? 'selected' : ''}`} onClick={() => handleSelect(currentQ.id, c.id)}>
              <span>{c.text}</span>
            </div>
          ))}
          {currentQ.question_type === 'dropdown' && (
            <select className="dropdown-main" value={answers[currentQ.id]?.choice_id || ''} onChange={e => handleSelect(currentQ.id, parseInt(e.target.value))}>
              <option value="" disabled>Choose an answer...</option>
              {currentQ.choices.map(c => <option key={c.id} value={c.id}>{c.text}</option>)}
            </select>
          )}
          {(currentQ.question_type === 'short_text' || currentQ.question_type === 'paragraph') && (
            <textarea className={`text-input-main ${currentQ.question_type === 'paragraph' ? 'large' : ''}`} placeholder="Type your answer here..." value={answers[currentQ.id]?.text_answer || ''} onChange={e => handleText(currentQ.id, e.target.value)} />
          )}
        </div>
      </div>

      <div className="nav-footer-main">
        <div className="nav-placeholder"></div>
        <div className="nav-buttons">
          {currentIndex < quiz.questions.length - 1 ? (
            <button className="tq-btn primary" onClick={handleNext}>Next <ArrowRight size={18} /></button>
          ) : (
            <button className="tq-btn success" onClick={() => setStep('CONFIRM')}>Finish Quiz <Send size={18} /></button>
          )}
        </div>
      </div>
    </div>
  );
}