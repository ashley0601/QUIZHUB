import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Timer,
  CheckCircle,
  XCircle,
  ArrowRight,
  BookOpen,
  Trophy,
  Crown,
  Medal,
  Sparkles,
  Copy,
  Link as LinkIcon,
  RotateCcw,
  Ban,
  PartyPopper,
  Target,
} from 'lucide-react';
import './TakeQuiz.css';

// Mirrors Django backend normalize_answer exactly
const normalizeText = (value) => {
  let v = String(value || '').trim().toLowerCase();
  v = v.replace(/[-_]/g, ' ');
  v = v.replace(/[^\w\s]/g, '');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
};

// Safe JSON parse — handles single-quoted Python dicts
const safeJsonParse = (str) => {
  if (!str || typeof str !== 'string') return null;
  try { return JSON.parse(str); } catch (_) {}
  try { return JSON.parse(str.replace(/'/g, '"')); } catch (_) {}
  return null;
};

const TakeQuiz = () => {
  const { quiz_id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState({ results: [] });
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  // Ref = always synchronous, never stale
  const matchingRef = useRef({});
  // State = only for rendering dropdowns
  const [matchingState, setMatchingState] = useState({});

  // Snapshot of matching selections at the moment of submit
  const submittedMatchingRef = useRef(null);

  useEffect(() => {
    API.get(`/quiz/${quiz_id}/`)
      .then((res) => {
        const quizData = res.data;
        if (quizData.quiz.can_take === false) {
          setIsBlocked(true);
          setQuiz(quizData);
          return;
        }
        setQuiz(quizData);
        setTimeLeft(quizData.quiz.time_per_question || 30);
        if (quizData.quiz?.invite_link) setInviteLink(quizData.quiz.invite_link);
      })
      .catch(() => alert('Failed to load quiz.'));
  }, [quiz_id]);

  useEffect(() => {
    if (!quiz || isFinished || showAnswer || isBlocked) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimeout(() => handleTimeUp(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, currentIndex, showAnswer, isFinished, isBlocked]);

  useEffect(() => {
    if (isFinished && quiz?.quiz?.leaderboard_type) {
      API.get(`/quiz/${quiz_id}/leaderboard/?scope=${quiz.quiz.leaderboard_type}`)
        .then((res) => setLeaderboard(res.data || { results: [] }))
        .catch(() => setLeaderboard({ results: [] }));
    }
  }, [isFinished, quiz_id, quiz]);

  const currentQuestion = quiz?.questions[currentIndex];

  const setAnswerForCurrent = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const copyInviteLink = async (link) => {
    try { await navigator.clipboard.writeText(link); alert('Copied!'); }
    catch (err) { alert('Failed to copy.'); }
  };

  const handleTimeUp = () => {
    if (!currentQuestion || showAnswer) return;
    if (currentQuestion.type === 'matching') {
      submittedMatchingRef.current = { ...matchingRef.current };
      setAnswerForCurrent(JSON.stringify(submittedMatchingRef.current));
    } else {
      const val = answers[currentQuestion.id];
      setAnswerForCurrent(typeof val === 'string' ? val : '');
    }
    setShowAnswer(true);
  };

  const handleSelectChoice = (choice) => {
    if (showAnswer) return;
    setAnswerForCurrent(choice);
    setShowAnswer(true);
  };

  const handleTextSubmit = () => {
    if (showAnswer) return;
    setAnswerForCurrent(answers[currentQuestion.id] || '');
    setShowAnswer(true);
  };

  const handleFillBlankChange = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleFillBlankSubmit = () => {
    if (showAnswer) return;
    setAnswerForCurrent(answers[currentQuestion.id] || '');
    setShowAnswer(true);
  };

  const handleMatchingChange = (leftItem, rightItem) => {
    matchingRef.current[leftItem] = rightItem;
    setMatchingState({ ...matchingRef.current });
  };

  const handleMatchingSubmit = () => {
    if (showAnswer) return;
    // Snapshot ref into a separate ref — this is synchronous, no stale state
    submittedMatchingRef.current = { ...matchingRef.current };
    // Also save to answers for final submission
    setAnswerForCurrent(JSON.stringify(submittedMatchingRef.current));
    setShowAnswer(true);
  };

  const handleNext = async () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setTimeLeft(quiz.quiz.time_per_question || 30);
      matchingRef.current = {};
      setMatchingState({});
      submittedMatchingRef.current = null;
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      const submitAnswers = {};
      Object.entries(answers).forEach(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          submitAnswers[key] = JSON.stringify(val);
        } else {
          submitAnswers[key] = String(val || '');
        }
      });
      const res = await API.post(`/quiz/${quiz_id}/submit/`, { answers: submitAnswers });
      setResults(res.data);
      if (res.data?.invite_link) setInviteLink(res.data.invite_link);
      setIsFinished(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const isRecordEqual = (first, second) => {
    const a = first || {};
    const b = second || {};
    if (typeof a !== 'object' || typeof b !== 'object')
      return normalizeText(String(a)) === normalizeText(String(b));
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      normalizeText(String(a[key])) === normalizeText(String(b[key]))
    );
  };

  const isAnswerCorrect = () => {
    if (!currentQuestion) return false;
    const userAnswer = answers[currentQuestion.id];
    const correctAnswer = currentQuestion.answer;
    const acceptedAnswers = currentQuestion.accepted_answers || [];

    if (currentQuestion.type === 'matching') {
      try {
        const parsedUser = typeof userAnswer === 'string' ? safeJsonParse(userAnswer) : userAnswer;
        const parsedCorrect = typeof correctAnswer === 'string' ? safeJsonParse(correctAnswer) : correctAnswer;
        return isRecordEqual(parsedUser || {}, parsedCorrect || {});
      } catch (_) {
        return false;
      }
    }

    if (currentQuestion.type === 'identification' || currentQuestion.type === 'fill_blank') {
      const normalizedUser = normalizeText(userAnswer);
      if (!normalizedUser) return false;
      if (normalizedUser === normalizeText(correctAnswer)) return true;
      if (Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0) {
        return acceptedAnswers.some((a) => normalizeText(a) === normalizedUser);
      }
      return false;
    }

    return normalizeText(userAnswer) === normalizeText(correctAnswer);
  };

  const getScoreTier = (pct) => {
    if (pct >= 90) return { label: 'Outstanding!', color: 'legendary', emoji: '🏆' };
    if (pct >= 75) return { label: 'Great Job!', color: 'epic', emoji: '🌟' };
    if (pct >= 50) return { label: 'Good Effort!', color: 'rare', emoji: '💪' };
    return { label: 'Keep Going!', color: 'common', emoji: '📖' };
  };

  const renderAnswerReveal = () => {
    if (!currentQuestion || !showAnswer) return null;
    if (currentQuestion.type === 'matching') return null;

    const correct = isAnswerCorrect();
    return (
      <div className={`answer-reveal-box ${correct ? 'correct' : 'wrong'}`}>
        <div className="answer-reveal-icon">
          {correct ? <CheckCircle size={24} /> : <XCircle size={24} />}
        </div>
        <div className="answer-reveal-content">
          <div className="answer-reveal-title">{correct ? 'Correct!' : 'Incorrect'}</div>
          {correct && <div className="answer-reveal-points">+1 Point</div>}
          {!correct && (
            <>
              <div className="answer-reveal-label">Correct Answer:</div>
              <div className="answer-reveal-main">{currentQuestion.answer}</div>
            </>
          )}
        </div>
        {currentQuestion.explanation && (
          <div className="answer-explanation"><strong>💡 Explanation:</strong> {currentQuestion.explanation}</div>
        )}
      </div>
    );
  };

  const renderFillBlankQuestion = () => {
    const questionText = currentQuestion.question;
    const parts = questionText.split(/________/);
    const blankCount = parts.length - 1;
    const currentValue = typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : '';
    const isCorrect = showAnswer && isAnswerCorrect();

    return (
      <div className="fill-blank-wrap">
        <div className="fill-blank-question">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < blankCount && (
                <input
                  type="text"
                  className={`fill-blank-input ${showAnswer ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                  placeholder="type here..."
                  value={index === 0 ? currentValue : ''}
                  disabled={showAnswer}
                  onChange={(e) => handleFillBlankChange(e.target.value)}
                  autoFocus
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {!showAnswer && (
          <button type="button" className="submit-answer-btn" onClick={handleFillBlankSubmit}>Submit Answer</button>
        )}
        {showAnswer && !isCorrect && (
          <div className="fill-blank-correct-answer">Correct answer: <strong>{currentQuestion.answer}</strong></div>
        )}
      </div>
    );
  };

  const renderMatchingQuestion = () => {
    let leftItems = currentQuestion.choices?.left || [];
    let rightItems = [...(currentQuestion.choices?.right || [])];

    // Fallback: extract from answer if choices are empty
    if (leftItems.length === 0 && rightItems.length === 0) {
      const parsed = safeJsonParse(currentQuestion.answer);
      if (parsed && typeof parsed === 'object') {
        leftItems = Object.keys(parsed).map(String);
        rightItems = Object.values(parsed).map(String);
      }
    }

    // Parse correct mapping — multiple strategies
    let correctMapping = {};
    if (typeof currentQuestion.answer === 'object' && currentQuestion.answer !== null && !Array.isArray(currentQuestion.answer)) {
      correctMapping = currentQuestion.answer;
    } else {
      const parsed = safeJsonParse(currentQuestion.answer);
      if (parsed && typeof parsed === 'object') {
        correctMapping = parsed;
      }
    }

    // Build normalized lookup: normalizedKey → raw value string
    const correctLookup = {};
    for (const [key, val] of Object.entries(correctMapping)) {
      const nk = normalizeText(key);
      if (nk && val !== undefined && val !== null) {
        correctLookup[nk] = String(val);
      }
    }

    // Use submittedMatchingRef (synchronous snapshot) — never stale
    const userAns = submittedMatchingRef.current || {};

    // Build row results
    const rowResults = [];
    let allCorrect = true;
    let anyAnswered = false;

    for (const leftItem of leftItems) {
      const nk = normalizeText(leftItem);

      // Look up correct value using normalized key
      let correctVal = correctLookup[nk] || '';

      // Look up user's value — try exact key first, then normalized
      let userVal = '';
      if (userAns[leftItem]) {
        userVal = String(userAns[leftItem]);
      } else {
        for (const [uk, uv] of Object.entries(userAns)) {
          if (normalizeText(uk) === nk && uv) {
            userVal = String(uv);
            break;
          }
        }
      }

      if (userVal) anyAnswered = true;

      // Both sides normalized for comparison
      const isRowCorrect = Boolean(userVal) && normalizeText(userVal) === normalizeText(correctVal);
      if (!isRowCorrect) allCorrect = false;

      rowResults.push({ leftItem, userVal, correctVal, isRowCorrect });
    }

    if (!anyAnswered) allCorrect = false;

    return (
      <div className="matching-wrap">
        <div className="matching-header-row">
          <span className="matching-col-label">Column A</span>
          <span className="matching-col-label">Column B</span>
          {showAnswer && <span className="matching-col-label">Result</span>}
        </div>

        {leftItems.map((leftItem, index) => {
          const { userVal, isRowCorrect } = rowResults[index];
          const dropdownValue = showAnswer ? userVal : (matchingState[leftItem] || '');

          return (
            <div key={index} className={`matching-row ${showAnswer ? (isRowCorrect ? 'correct' : 'wrong') : ''}`}>
              <div className="matching-left">{leftItem}</div>
              <select
                className={`matching-select ${showAnswer ? (isRowCorrect ? 'correct' : 'wrong') : ''}`}
                value={dropdownValue}
                disabled={showAnswer}
                onChange={(e) => handleMatchingChange(leftItem, e.target.value)}
              >
                <option value="">-- Select --</option>
                {rightItems.map((rightItem, i) => (
                  <option key={i} value={rightItem}>{rightItem}</option>
                ))}
              </select>
              {showAnswer && (
                <div className={`matching-feedback ${isRowCorrect ? 'correct' : 'wrong'}`}>
                  {isRowCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
              )}
            </div>
          );
        })}

        {!showAnswer && (
          <button type="button" className="submit-answer-btn" onClick={handleMatchingSubmit}>Submit Matches</button>
        )}

        {showAnswer && (
          <div className={`matching-feedback-summary ${allCorrect ? 'summary-correct' : 'summary-wrong'}`}>
            <strong>
              {allCorrect ? (
                <><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: '#16a34a' }} /> All matches correct! +1 Point</>
              ) : (
                <><XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: '#dc2626' }} /> Some matches are incorrect</>
              )}
            </strong>
            <ul>
              {rowResults.map(({ leftItem, userVal, correctVal, isRowCorrect }, idx) => (
                <li key={idx} className={isRowCorrect ? 'match-correct' : 'match-wrong'}>
                  <span className="match-term">{leftItem}</span>
                  <span className="match-result-text">
                    Your answer: {userVal ? userVal : <em style={{ opacity: 0.5 }}>No selection</em>}
                  </span>
                  {!isRowCorrect && (
                    <span className="match-correct-answer">Correct: {correctVal}</span>
                  )}
                </li>
              ))}
            </ul>
            {currentQuestion.explanation && (
              <div className="match-explanation">
                <strong>💡 Explanation:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!quiz) {
    return (
      <div className="quiz-loader-screen">
        <div className="loader-spinner" />
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="take-quiz-page">
        <div className="blocked-quiz-card">
          <div className="blocked-icon-wrap"><Ban size={56} /></div>
          <h1>No More Attempts</h1>
          <p className="blocked-subtitle">You have used all available attempts for this quiz.</p>
          <div className="blocked-info-box">
            <div className="blocked-info-row"><span>Quiz:</span><strong>{quiz.quiz.title}</strong></div>
            <div className="blocked-info-row"><span>Max Attempts:</span><strong>{(quiz.quiz.max_retakes || 0) + 1}</strong></div>
          </div>
          <button className="blocked-back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const leaderboardRows = Array.isArray(leaderboard) ? leaderboard : Array.isArray(leaderboard?.results) ? leaderboard.results : [];
    const tier = getScoreTier(results.percentage);

    return (
      <div className="quiz-result-page">
        <div className="quiz-result-card">
          <div className="result-top-glow" />
          <div className="result-celebration"><span className="celebration-emoji">{tier.emoji}</span></div>
          <div className={`result-score-tier ${tier.color}`}>{tier.label}</div>
          <div className="result-score-circle-wrap">
            <div className={`result-score-circle ${tier.color}`}><span className="score-number">{results.percentage}%</span></div>
            <div className="result-score-label">{results.score} out of {results.total} correct</div>
          </div>
          <div className="result-stats-row">
            <div className="result-stat-box"><Target size={20} /><div><span>Accuracy</span><strong>{results.percentage}%</strong></div></div>
            <div className="result-stat-box"><Sparkles size={20} /><div><span>Points</span><strong>{results.score}/{results.total}</strong></div></div>
          </div>

          {inviteLink && quiz?.quiz?.visibility === 'private' && (
            <div className="result-invite-box">
              <div className="result-invite-title"><LinkIcon size={16} /> Private Invite Link</div>
              <div className="result-invite-row">
                <input type="text" readOnly value={inviteLink} />
                <button type="button" onClick={() => copyInviteLink(inviteLink)}><Copy size={16} /> Copy</button>
              </div>
            </div>
          )}

          <div className="result-actions">
            {quiz?.quiz?.remaining_retakes > 0 && (
              <button type="button" className="result-btn primary" onClick={() => navigate(`/quiz/take/${quiz_id}`)}>
                <RotateCcw size={18} /> Retake ({quiz.quiz.remaining_retakes} left)
              </button>
            )}
            <button type="button" className="result-btn primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>

          <div className="result-grid">
            <div className="result-panel">
              <div className="result-panel-head"><Trophy size={18} /> Leaderboard</div>
              <div className="leaderboard-list">
                {leaderboardRows.length === 0 ? (
                  <div className="leaderboard-empty">No data yet.</div>
                ) : (
                  leaderboardRows.map((entry, i) => (
                    <div key={i} className="leaderboard-row">
                      <div className="leaderboard-rank">
                        {entry.rank === 1 ? <Crown size={16} className="gold" /> : entry.rank === 2 ? <Medal size={16} className="silver" /> : entry.rank === 3 ? <Medal size={16} className="bronze" /> : <span className="rank-num">#{entry.rank}</span>}
                      </div>
                      <div className="leaderboard-name">{entry.username}</div>
                      <div className="leaderboard-score">{entry.score}/{entry.total}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="result-panel">
              <div className="result-panel-head"><CheckCircle size={18} /> Answer Review</div>
              <div className="review-list">
                {results.results.map((r, i) => {
                  const question = quiz.questions.find((q) => q.id === r.question_id);
                  let correctAnswer = r.correct_answer;
                  let userAnswer = r.user_answer || 'No Answer';
                  if (question?.type === 'matching') {
                    try {
                      const ca = typeof r.correct_answer === 'string' ? safeJsonParse(r.correct_answer) : r.correct_answer;
                      correctAnswer = ca && typeof ca === 'object' ? Object.entries(ca).map(([l, rn]) => `${l} → ${rn}`).join(', ') : String(r.correct_answer);
                      const ua = typeof r.user_answer === 'string' ? safeJsonParse(r.user_answer) : r.user_answer;
                      userAnswer = ua && typeof ua === 'object' && Object.keys(ua).length > 0 ? Object.entries(ua).map(([l, rn]) => `${l} → ${rn}`).join(', ') : 'No Answer';
                    } catch (_) { correctAnswer = String(r.correct_answer); }
                  }
                  return (
                    <div key={i} className={`review-item ${r.correct ? 'correct' : 'wrong'}`}>
                      <div className="review-num">{r.correct ? '✓' : '✗'}</div>
                      <div className="review-content">
                        <div className="review-question">Q{i + 1}. {question?.question}</div>
                        <div className="review-answer">Your Answer: <strong>{userAnswer}</strong></div>
                        {!r.correct && <div className="review-answer correct-ans">Correct: <strong>{correctAnswer}</strong></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedValue = answers[currentQuestion.id] || '';
  const progressPct = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="take-quiz-page">
      <div className="take-quiz-card">
        <div className="take-quiz-topbar">
          <div className="topbar-left">
            <h2>{quiz.quiz.title}</h2>
            <div className="topbar-meta">
              <span className="meta-badge type-badge">
                {currentQuestion.type === 'true_false' ? 'True / False' : String(currentQuestion.type).replace('_', ' ')}
              </span>
              <span className="meta-badge progress-badge">Q{currentIndex + 1} of {quiz.questions.length}</span>
              {quiz.quiz.remaining_retakes !== undefined && (
                <span className="meta-badge retake-badge"><RotateCcw size={12} /> {quiz.quiz.remaining_retakes} left</span>
              )}
            </div>
          </div>
          <div className={`quiz-timer-pill ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : ''}`}>
            <Timer size={18} /><span className="timer-number">{timeLeft}</span><span className="timer-label">sec</span>
          </div>
        </div>

        <div className="take-quiz-progress-wrap">
          <div className="take-quiz-progress-info"><span>Progress</span><span>{Math.round(progressPct)}%</span></div>
          <div className="take-quiz-progress"><div className="take-quiz-progress-fill" style={{ width: `${progressPct}%` }} /></div>
        </div>

        <div className="question-block">
          <h3>{currentQuestion.question}</h3>

          {currentQuestion.type === 'mcq' && (
            <div className="choices-grid mcq-grid">
              {(currentQuestion.choices || []).map((choice, i) => {
                const isSelected = selectedValue === choice;
                const isCorrectChoice = showAnswer && normalizeText(choice) === normalizeText(currentQuestion.answer);
                const isWrongSelected = showAnswer && isSelected && normalizeText(choice) !== normalizeText(currentQuestion.answer);
                return (
                  <button key={i} type="button" className={`choice-button ${isSelected ? 'selected' : ''} ${isCorrectChoice ? 'correct' : ''} ${isWrongSelected ? 'wrong' : ''}`} disabled={showAnswer} onClick={() => handleSelectChoice(choice)}>
                    <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="choice-text">{choice}</span>
                    {isCorrectChoice && <CheckCircle size={18} className="choice-icon" />}
                    {isWrongSelected && <XCircle size={18} className="choice-icon" />}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className="choices-grid tf-grid">
              {['True', 'False'].map((option, i) => {
                const isSelected = selectedValue === option;
                const isCorrectChoice = showAnswer && normalizeText(option) === normalizeText(currentQuestion.answer);
                const isWrongSelected = showAnswer && isSelected && normalizeText(option) !== normalizeText(currentQuestion.answer);
                return (
                  <button key={i} type="button" className={`choice-button tf-btn ${isSelected ? 'selected' : ''} ${isCorrectChoice ? 'correct' : ''} ${isWrongSelected ? 'wrong' : ''}`} disabled={showAnswer} onClick={() => handleSelectChoice(option)}>
                    <span className="choice-text">{option}</span>
                    {isCorrectChoice && <CheckCircle size={20} className="choice-icon" />}
                    {isWrongSelected && <XCircle size={20} className="choice-icon" />}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'identification' && (
            <div className="text-answer-wrap">
              <input type="text" className="text-answer-input" placeholder="Type your answer here..." value={selectedValue} disabled={showAnswer} onChange={(e) => setAnswerForCurrent(e.target.value)} />
              {!showAnswer && <button type="button" className="submit-answer-btn" onClick={handleTextSubmit}>Submit Answer</button>}
            </div>
          )}

          {currentQuestion.type === 'fill_blank' && renderFillBlankQuestion()}
          {currentQuestion.type === 'matching' && renderMatchingQuestion()}
          {renderAnswerReveal()}

          {showAnswer && (
            <button type="button" className="next-question-btn" onClick={handleNext} disabled={submitting}>
              {currentIndex < quiz.questions.length - 1 ? (<>Next Question <ArrowRight size={18} /></>) : (<><PartyPopper size={18} /> Finish Quiz</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;