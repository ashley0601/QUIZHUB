import React, { useState, useEffect } from 'react';
import API from '../api';
import {
  Plus, Trash2, Settings, Copy, Send, CheckCircle, Image,
  AlertCircle, ArrowLeft, FileText, Globe, Lock, Users,
  Calendar, Clock, Eye, Edit3, AlertTriangle, Search, Trophy
} from 'lucide-react';
import QuizSettingsModal from './QuizSettingsModal';
import Sidebar from '../components/Sidebar';
import './QuizSettingsModal.css';
import '../styles/CreateManualQuiz.css';
import { useNavigate, useLocation } from 'react-router-dom';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'short_text', label: 'Short Answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'true_false', label: 'True / False' },
];

export default function CreateManualQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const editQuiz = location.state?.editQuiz;
  const [tab, setTab] = useState(editQuiz ? 'builder' : 'list');
  const [quizzes, setQuizzes] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listFilter, setListFilter] = useState('all');
  const [listSearch, setListSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [quizImage, setQuizImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [settings, setSettings] = useState({
    shuffle_questions: false, shuffle_choices: false, collect_email: false,
    show_progress_bar: true, deadline: '', show_results: false, time_per_question: 30,
    is_public: false, allow_review: true,
    instructions: "Please read each question carefully. You cannot go back once you proceed."
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [publishData, setPublishData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { if (tab === 'list') fetchQuizzes(); }, [tab]);
  useEffect(() => { if (editQuiz) loadQuizData(editQuiz); }, [editQuiz]);

  const fetchQuizzes = async () => {
    setListLoading(true);
    try { const res = await API.get('/manual-quiz/my-quizzes/'); setQuizzes(res.data); }
    catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  const loadQuizData = (q) => {
    setIsEditing(true); setEditId(q.id); setTab('builder');
    setTitle(q.title || ''); setDescription(q.description || ''); setImagePreview(q.image || null);
    setQuestions((q.questions || []).map(qu => ({
      text: qu.text || '', question_type: qu.question_type || 'multiple_choice', required: qu.required ?? true,
      points: qu.points || 1,
      choices: (qu.choices || []).map(c => ({ text: c.text || '', is_correct: c.is_correct || false })),
      correct_text_answer: qu.correct_text_answer || '', image: null,
      feedback_correct: qu.feedback_correct || 'Correct!', feedback_incorrect: qu.feedback_incorrect || 'Incorrect.'
    })));
    setSettings({
      shuffle_questions: q.shuffle_questions || false, shuffle_choices: q.shuffle_choices || false,
      collect_email: q.collect_email || false, show_progress_bar: q.show_progress_bar ?? true,
      deadline: q.deadline ? q.deadline.slice(0, 16) : '', show_results: q.show_results || false,
      time_per_question: q.time_per_question || 30, is_public: q.is_public || false,
      allow_review: q.allow_review ?? true, instructions: q.instructions || "Please read each question carefully."
    });
  };

  const startEdit = async (quiz) => {
    try { const res = await API.get(`/manual-quiz/${quiz.id}/`); loadQuizData(res.data); }
    catch (err) { alert('Failed to load quiz'); }
  };

  const startNew = () => {
    setIsEditing(false); setEditId(null); setTitle(''); setDescription('');
    setQuestions([]); setQuizImage(null); setImagePreview(null);
    setSettings({
      shuffle_questions: false, shuffle_choices: false, collect_email: false,
      show_progress_bar: true, deadline: '', show_results: false, time_per_question: 30,
      is_public: false, allow_review: true,
      instructions: "Please read each question carefully. You cannot go back once you proceed."
    });
    setErrors({}); setTab('builder');
  };

  const copyLink = (code) => { navigator.clipboard.writeText(`${window.location.origin}/join-quiz/${code}`); alert('Link copied!'); };

  const handleDelete = async (id) => {
    try { await API.delete(`/manual-quiz/${id}/delete/`); setQuizzes(p => p.filter(q => q.id !== id)); setDeleteConfirm(null); }
    catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const addQuestion = () => {
    setQuestions(p => [...p, {
      text: '', question_type: 'multiple_choice', required: true, points: 1,
      choices: [{ text: '', is_correct: false }], correct_text_answer: '', image: null,
      feedback_correct: 'Correct!', feedback_incorrect: 'Incorrect.'
    }]);
  };

  const handleQuestionChange = (i, field, value) => {
    const u = [...questions]; u[i][field] = value;
    if (field === 'question_type') {
      if (['short_text', 'paragraph'].includes(value)) u[i].choices = [];
      else if (value === 'true_false') u[i].choices = [{ text: 'True', is_correct: false }, { text: 'False', is_correct: false }];
      else if (!u[i].choices.length) u[i].choices = [{ text: '', is_correct: false }];
    }
    setQuestions(u);
    if (field === 'text') setErrors(p => ({ ...p, [`q_text_${i}`]: null }));
    if (field === 'correct_text_answer') setErrors(p => ({ ...p, [`q_answer_${i}`]: null }));
  };

  const handleChoiceChange = (qi, ci, val) => {
    setQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, choices: q.choices.map((c, j) => j === ci ? { ...c, text: val } : c) }));
  };

  const addChoice = (qi) => {
    setQuestions(p => p.map((q, i) => i !== qi ? q : { ...q, choices: [...q.choices, { text: '', is_correct: false }] }));
  };

  const toggleCorrect = (qi, ci) => {
    setQuestions(p => p.map((q, i) => {
      if (i !== qi) return q;
      if (q.question_type === 'checkboxes') return { ...q, choices: q.choices.map((c, j) => j === ci ? { ...c, is_correct: !c.is_correct } : c) };
      return { ...q, choices: q.choices.map((c, j) => ({ ...c, is_correct: j === ci })) };
    }));
  };

  const handlePublish = async (isDraft = false) => {
    if (!title.trim()) return alert("Enter a quiz title.");
    const cleaned = questions.filter(q => q.text.trim()).map(q => ({
      text: q.text, question_type: q.question_type, required: Boolean(q.required), points: parseInt(q.points) || 1,
      correct_text_answer: q.correct_text_answer || "", feedback_correct: q.feedback_correct || "Correct!",
      feedback_incorrect: q.feedback_incorrect || "Incorrect.",
      choices: ['short_text', 'paragraph'].includes(q.question_type) ? [] : q.choices.filter(c => c.text.trim()).map(c => ({ text: c.text, is_correct: Boolean(c.is_correct) }))
    }));
    if (cleaned.length === 0) return alert("Add at least one question.");
    const fd = new FormData();
    fd.append('title', title); fd.append('description', description || ""); fd.append('is_active', String(!isDraft));
    fd.append('shuffle_questions', settings.shuffle_questions); fd.append('shuffle_choices', settings.shuffle_choices);
    fd.append('collect_email', settings.collect_email); fd.append('show_progress_bar', settings.show_progress_bar);
    fd.append('show_results', settings.show_results); fd.append('time_per_question', settings.time_per_question);
    fd.append('is_public', settings.is_public); fd.append('allow_review', settings.allow_review);
    fd.append('instructions', settings.instructions);
    if (settings.deadline) fd.append('deadline', settings.deadline);
    fd.append('questions', JSON.stringify(cleaned));
    if (quizImage) fd.append('image', quizImage);
    setLoading(true);
    try {
      let res;
      if (isEditing) res = await API.put(`/manual-quiz/${editId}/update/`, fd);
      else res = await API.post('/manual-quiz/create/', fd);
      if (isDraft) { alert(isEditing ? "Draft updated!" : "Draft saved!"); setTab('list'); fetchQuizzes(); }
      else setPublishData({ link: `${window.location.origin}/join-quiz/${res.data.unique_code}`, id: res.data.id });
    } catch (err) { alert("Error: " + (err.response?.data ? JSON.stringify(err.response.data) : "Network error")); }
    finally { setLoading(false); }
  };

  const ErrorText = ({ text }) => text ? <div className="field-error"><AlertCircle size={12} /> {text}</div> : null;

  const filtered = quizzes.filter(q => {
    const m = q.title.toLowerCase().includes(listSearch.toLowerCase());
    if (listFilter === 'published') return m && q.is_active;
    if (listFilter === 'drafts') return m && !q.is_active;
    return m;
  });
  const stats = { total: quizzes.length, published: quizzes.filter(q => q.is_active).length, drafts: quizzes.filter(q => !q.is_active).length };

  const publishModalStyles = {
    wrapper: { textAlign: "center", padding: "40px 32px" },
    input: { flex: 1, padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, color: "#374151" },
    copyBtn: { padding: "10px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
    saveBtn: { width: "100%" }
  };

  if (tab === 'list') {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="quiz-history-page">

            <div className="qh-banner">
              <div className="qh-banner-bg" />
              <div className="qh-banner-content">
                <div className="qh-banner-left">
                  <h1>Quiz Manual</h1>
                  <p>Create, manage, and track your quizzes</p>
                </div>
                <div className="qh-banner-stats">
                  <div className="qh-banner-stat">
                    <span className="qh-banner-stat-num">{stats.total}</span>
                    <span className="qh-banner-stat-label">Total Quizzes</span>
                  </div>
                  <div className="qh-banner-stat-divider" />
                  <div className="qh-banner-stat">
                    <span className="qh-banner-stat-num">{stats.published}</span>
                    <span className="qh-banner-stat-label">Published</span>
                  </div>
                  <div className="qh-banner-stat-divider" />
                  <div className="qh-banner-stat">
                    <span className="qh-banner-stat-num">{stats.drafts}</span>
                    <span className="qh-banner-stat-label">Drafts</span>
                  </div>
                </div>
              </div>
              <button className="qh-banner-btn" onClick={startNew}>
                <Plus size={20} /> New Quiz
              </button>
            </div>

            <div className="qh-content-area">

              <div className="qh-stats">
                <div className="qh-stat-card">
                  <div className="qh-stat-icon all"><FileText size={20} /></div>
                  <div className="qh-stat-info"><span className="qh-stat-num">{stats.total}</span><span className="qh-stat-label">Total</span></div>
                </div>
                <div className="qh-stat-card">
                  <div className="qh-stat-icon published"><Globe size={20} /></div>
                  <div className="qh-stat-info"><span className="qh-stat-num">{stats.published}</span><span className="qh-stat-label">Published</span></div>
                </div>
                <div className="qh-stat-card">
                  <div className="qh-stat-icon drafts"><Edit3 size={20} /></div>
                  <div className="qh-stat-info"><span className="qh-stat-num">{stats.drafts}</span><span className="qh-stat-label">Drafts</span></div>
                </div>
              </div>

              <div className="qh-toolbar">
                <div className="qh-search">
                  <Search size={16} />
                  <input placeholder="Search quizzes..." value={listSearch} onChange={e => setListSearch(e.target.value)} />
                </div>
                <div className="qh-filters">
                  {['all', 'published', 'drafts'].map(f => (
                    <button key={f} className={`qh-filter-btn ${listFilter === f ? 'active' : ''}`} onClick={() => setListFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      <span className="qh-filter-count">{f === 'all' ? stats.total : f === 'published' ? stats.published : stats.drafts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {listLoading ? (
                <div className="qh-loading">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="qh-empty">
                  <FileText size={48} strokeWidth={1} color="#d1d5db" />
                  <h3>No quizzes found</h3>
                  <p>{listSearch ? 'Try a different search' : 'Create your first quiz'}</p>
                  {!listSearch && <button className="btn-primary" onClick={startNew}><Plus size={16} /> New Quiz</button>}
                </div>
              ) : (
                <div className="qh-grid">
                  {filtered.map(quiz => (
                    <div key={quiz.id} className="qh-card">
                      <div className="qh-card-top">
                        {quiz.image ? <img src={quiz.image} alt="" className="qh-card-img" /> : <div className="qh-card-img-placeholder"><FileText size={24} /></div>}
                        <div className="qh-card-badges">
                          <div className={`qh-status-badge ${quiz.is_active ? 'published' : 'draft'}`}>
                            {quiz.is_active ? <><Globe size={12} /> Published</> : <><Lock size={12} /> Draft</>}
                          </div>
                        </div>
                      </div>
                      <div className="qh-card-body">
                        <h3 className="qh-card-title">{quiz.title}</h3>
                        {quiz.description && <p className="qh-card-desc">{quiz.description.slice(0, 80)}{quiz.description.length > 80 ? '...' : ''}</p>}
                        <div className="qh-card-meta">
                          <span><FileText size={13} /> {quiz.questions_count}Q</span>
                          <span><Users size={13} /> {quiz.attempts_count}</span>
                          <span><Calendar size={13} /> {quiz.created_at}</span>
                        </div>
                        {quiz.deadline && <div className="qh-deadline"><Clock size={12} /> Due: {quiz.deadline}</div>}
                        <div className="qh-card-code">Code: <strong>{quiz.unique_code}</strong></div>
                      </div>
                      <div className="qh-card-actions">
                        <button className="qh-action-btn primary" onClick={() => copyLink(quiz.unique_code)} title="Copy link"><Copy size={15} /></button>
                        <button className="qh-action-btn leaderboard" onClick={() => navigate(`/manual-quiz-results/${quiz.id}`)} title="Leaderboard"><Trophy size={15} /></button>
                        <button className="qh-action-btn" onClick={() => startEdit(quiz)} title="Edit"><Edit3 size={15} /></button>
                        <button className="qh-action-btn danger" onClick={() => setDeleteConfirm(quiz.id)} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {deleteConfirm && (
            <div className="sm-overlay" onClick={() => setDeleteConfirm(null)}>
              <div className="delete-modal" onClick={e => e.stopPropagation()}>
                <div className="delete-modal-icon"><AlertTriangle size={40} color="#ef4444" /></div>
                <h3>Delete Quiz?</h3>
                <p>This cannot be undone.</p>
                <div className="delete-modal-actions">
                  <button className="sm-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* BUILDER TAB */
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="quiz-builder-container">
          <div className="builder-tab-bar">
            <button className="back-to-history" onClick={() => setTab('list')}><ArrowLeft size={16} /> My Quizzes</button>
            <div className="builder-tab-indicator">
              <span className="tab-dot active"></span>
              <span className="tab-text">{isEditing ? 'Editing Quiz' : 'New Quiz'}</span>
            </div>
          </div>
          <div className="builder-topbar">
            <div style={{ width: '100%' }}>
              <input className="title-input" placeholder="Untitled Quiz" value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }} />
              <ErrorText text={errors.title} />
            </div>
            <div className="topbar-actions" style={{ marginTop: errors.title ? '24px' : '0' }}>
              <button className="btn-outline" onClick={() => handlePublish(true)} disabled={loading}>{isEditing ? 'Update Draft' : 'Save Draft'}</button>
              <button className="btn-outline" onClick={() => setShowSettings(true)}><Settings size={18} /></button>
              <button className="btn-primary" onClick={() => handlePublish(false)} disabled={loading}><Send size={16} /> {isEditing ? 'Update' : 'Publish'}</button>
            </div>
          </div>
          <div className="card banner-card">
            {quizImage || imagePreview ? (
              <div className="banner-preview">
                <img src={quizImage ? URL.createObjectURL(quizImage) : imagePreview} alt="banner" />
                <button className="remove-btn" onClick={() => { setQuizImage(null); setImagePreview(null); }}>x</button>
              </div>
            ) : (
              <label className="banner-upload">
                <Image size={32} strokeWidth={1.5} />
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Click to upload banner image</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Recommended: 1200x400px (Optional)</span>
                <input type="file" accept="image/*" hidden onChange={e => { setQuizImage(e.target.files[0]); setImagePreview(null); }} />
              </label>
            )}
            <textarea className="desc-textarea" placeholder="Add a description to your quiz (optional)..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          {questions.map((q, i) => (
            <div key={i} className="card question-card-builder">
              <div className="q-header">
                <span className="q-badge">Question {i + 1}</span>
                <select className="type-select" value={q.question_type} onChange={e => handleQuestionChange(i, 'question_type', e.target.value)}>
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="q-header-right">
                  <label className="points-badge">Pts:
                    <input type="number" min="1" max="100" value={q.points} onChange={e => handleQuestionChange(i, 'points', parseInt(e.target.value))} className="points-input" />
                  </label>
                  <button className="btn-icon-danger" onClick={() => setQuestions(qs => qs.filter((_, idx) => idx !== i))}><Trash2 size={16} /></button>
                </div>
              </div>
              <textarea className="q-text-input" placeholder="Type your question here..." value={q.text} onChange={e => handleQuestionChange(i, 'text', e.target.value)} />
              <label className="file-upload-small"><Image size={14} /> Add Image<input type="file" hidden onChange={e => { const u = [...questions]; u[i].image = e.target.files[0]; setQuestions(u); }} /></label>
              {q.image && <img src={URL.createObjectURL(q.image)} className="q-img-preview" alt="q" />}
              {['multiple_choice', 'checkboxes', 'dropdown', 'true_false'].includes(q.question_type) && (
                <div className="options-container">
                  {q.choices && q.choices.map((c, ci) => (
                    <div key={ci} className="option-row-builder">
                      <input type={q.question_type === 'checkboxes' ? 'checkbox' : 'radio'} disabled className="option-radio" />
                      <input className="option-text-input" placeholder={`Option ${ci + 1}`} value={c.text} onChange={e => handleChoiceChange(i, ci, e.target.value)} disabled={q.question_type === 'true_false'} />
                      <button className={`btn-correct ${c.is_correct ? 'active' : ''}`} onClick={() => toggleCorrect(i, ci)}>{c.is_correct ? '✓' : 'Correct'}</button>
                      {q.question_type !== 'true_false' && q.choices.length > 1 && (
                        <button className="btn-icon-danger-sm" onClick={() => { const u = [...questions]; u[i].choices.splice(ci, 1); setQuestions(u); }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                  {q.question_type !== 'true_false' && <button className="btn-add-option" onClick={() => addChoice(i)}>+ Add Option</button>}
                </div>
              )}
              {['short_text', 'paragraph'].includes(q.question_type) && (
                <div className="text-answer-key">
                  <label>Correct Answer:</label>
                  <input className="option-text-input" placeholder="Expected answer" value={q.correct_text_answer} onChange={e => handleQuestionChange(i, 'correct_text_answer', e.target.value)} />
                </div>
              )}
            </div>
          ))}
          <button className="btn-add-question" onClick={addQuestion}><Plus size={20} /> Add Question</button>
        </div>
        {showSettings && <QuizSettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
        {publishData && (
          <div className="sm-overlay" onClick={() => setPublishData(null)}>
            <div className="sm-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
              <div style={publishModalStyles.wrapper}>
                <CheckCircle size={48} color="#10B981" />
                <h2 style={{ margin: "16px 0 8px", color: "#111827" }}>{isEditing ? "Quiz Updated!" : "Quiz Published!"}</h2>
                <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
                  <input readOnly value={publishData.link} style={publishModalStyles.input} />
                  <button onClick={() => navigator.clipboard.writeText(publishData.link)} style={publishModalStyles.copyBtn}><Copy size={14} /> Copy</button>
                </div>
                <button className="sm-btn-save" style={publishModalStyles.saveBtn} onClick={() => { setPublishData(null); setTab("list"); fetchQuizzes(); }}>Go to My Quizzes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}