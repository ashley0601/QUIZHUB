import React, { useState, useEffect, useMemo } from 'react';
import API from '../api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  PlusCircle,
  Loader,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Upload,
  CheckCircle2,
  Clock3,
  BarChart3,
  Sparkles,
  Calendar,
  Wand2,
  Trophy,
  ClipboardList,
  ChevronRight,
  Link as LinkIcon,
  Copy,
  Edit,
  Trash2,
  ArrowRight,
  Crown,
  Medal,
} from 'lucide-react';
import './QuizGenerator.css';

const QuizGenerator = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [chatroomModalOpen, setChatroomModalOpen] = useState(false);
  const [chatroomSearch, setChatroomSearch] = useState('');
  const [chatrooms, setChatrooms] = useState([]);
  const [selectedQuizIdForShare, setSelectedQuizIdForShare] = useState(null);
  const [sharingToChatroom, setSharingToChatroom] = useState(false);
  const [historySubjectFilter, setHistorySubjectFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('all');
  const [statusMessage, setStatusMessage] = useState(null);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardQuiz, setLeaderboardQuiz] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [loadingQuizEdit, setLoadingQuizEdit] = useState(false);
  const [postGenModalOpen, setPostGenModalOpen] = useState(false);
  const [generatedQuizId, setGeneratedQuizId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    difficulty: 'medium',
    num_questions: 5,
    time_per_question: 30,
    focus_area: '',
    allow_retake: true,
    max_retakes: 3,
  });

  const [file, setFile] = useState(null);
  const [qTypes, setQTypes] = useState(['mcq']);
  const [subjects, setSubjects] = useState([]);
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [subjectFormName, setSubjectFormName] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectError, setSubjectError] = useState('');

  useEffect(() => {
    const detectCollapsed = () => {
      const sidebar = document.querySelector('.sidebar-container, .sidebar, [class*="sidebar"], [class*="Sidebar"]');
      const body = document.body;

      const isCollapsed =
        body.classList.contains('sidebar-collapsed') ||
        body.classList.contains('collapsed') ||
        body.classList.contains('sidebar-mini') ||
        body.classList.contains('mini-sidebar') ||
        (sidebar && (
          sidebar.classList.contains('collapsed') ||
          sidebar.classList.contains('sidebar-collapsed') ||
          sidebar.classList.contains('mini') ||
          sidebar.classList.contains('mini-sidebar') ||
          sidebar.getAttribute('data-collapsed') === 'true' ||
          sidebar.getAttribute('aria-expanded') === 'false'
        ));

      let widthFallback = false;
      if (sidebar) {
        const width = sidebar.getBoundingClientRect().width;
        widthFallback = width < 100;
      }

      setSidebarCollapsed(isCollapsed || widthFallback);
    };

    detectCollapsed();

    const observer = new MutationObserver(detectCollapsed);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const sidebarEl = document.querySelector('.sidebar-container, .sidebar, [class*="sidebar"], [class*="Sidebar"]');
    if (sidebarEl) {
      observer.observe(sidebarEl, { attributes: true, attributeFilter: ['class', 'data-collapsed', 'aria-expanded'] });
    }

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(detectCollapsed, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const fetchSubjects = () => {
    API.get(`/quiz/subjects/?t=${Date.now()}`)
      .then((res) => {
        const mySubjects = Array.isArray(res.data) ? res.data : [];
        setSubjects(mySubjects);
      })
      .catch((err) => console.error('Error fetching subjects:', err));
  };

  useEffect(() => {
    if (!chatroomModalOpen) return;

    API.get(`/quiz/chatrooms/search/?q=${encodeURIComponent(chatroomSearch)}`)
      .then((res) => setChatrooms(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error(err);
        setChatrooms([]);
      });
  }, [chatroomModalOpen, chatroomSearch]);

  const fetchHistory = () => {
    API.get('/quiz/history/')
      .then((res) => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  };

  const filteredHistory = useMemo(() => {
    let list = history;

    if (historySubjectFilter) {
      list = list.filter((quiz) => {
        const subjectId = quiz.subject_id || quiz.subject?.id || quiz.subject?.pk;
        return subjectId?.toString() === historySubjectFilter.toString();
      });
    }

    if (historyDateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter((quiz) => new Date(quiz.date) >= weekAgo);
    } else if (historyDateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      list = list.filter((quiz) => new Date(quiz.date) >= monthAgo);
    }

    return list;
  }, [history, historySubjectFilter, historyDateFilter]);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
  };

  const handleLoadQuizForEdit = async (quizId) => {
    setLoadingQuizEdit(true);
    try {
      const res = await API.get(`/quiz/${quizId}/`);
      const quiz = res.data.quiz;
      setFormData((prev) => ({
        ...prev,
        title: quiz.title,
        subject: quiz.subject?.id || '',
        difficulty: quiz.difficulty || 'medium',
        time_per_question: quiz.time_per_question || 30,
        max_retakes: quiz.max_retakes || 3,
        allow_retake: quiz.allow_retake ?? true,
      }));
      setEditingQuizId(quizId);
      showStatus('success', 'Quiz details loaded. Generate to create a new version.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showStatus('error', err.response?.data?.error || 'Failed to load quiz for editing');
    } finally {
      setLoadingQuizEdit(false);
    }
  };

  const handleOpenLeaderboard = async (quizId, scope = 'private') => {
    setLeaderboardModalOpen(true);
    setLeaderboardData([]);
    setLeaderboardQuiz({ id: quizId, scope });

    try {
      const res = await API.get(`/quiz/${quizId}/leaderboard/?scope=${scope}`);
      setLeaderboardData(res.data?.results || []);
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to load leaderboard');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await API.delete(`/quiz/${quizId}/`);
      fetchHistory();
      showStatus('success', 'Quiz deleted successfully');
    } catch (err) {
      console.error(err);
      showStatus('error', err.response?.data?.error || 'Failed to delete quiz');
    }
  };

  const resetSubjectForm = () => {
    setSubjectFormName('');
    setEditingSubject(null);
    setSubjectError('');
  };

  const openNewSubjectForm = () => {
    resetSubjectForm();
    setSubjectFormOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSubjectFormName(subject.name);
    setEditingSubject(subject);
    setSubjectFormOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectFormName.trim()) {
      setSubjectError('Subject name is required');
      return;
    }

    setSubjectSaving(true);
    setSubjectError('');

    try {
      const payload = { name: subjectFormName.trim() };

      if (editingSubject) {
        await API.put(`/quiz/subjects/${editingSubject.id}/`, payload);
      } else {
        await API.post('/quiz/subjects/', payload);
      }

      fetchSubjects();
      setSubjectFormOpen(false);
      resetSubjectForm();
    } catch (err) {
      console.error(err);
      setSubjectError(
        err.response?.data?.name?.[0] || err.response?.data?.error || 'Failed to save subject'
      );
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Delete this subject?')) return;

    try {
      await API.delete(`/quiz/subjects/${subjectId}/`);
      fetchSubjects();
      if (formData.subject === subjectId) {
        setFormData((prev) => ({ ...prev, subject: '' }));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  const scrollToSubjectManager = () => {
    const element = document.getElementById('subject-manager-panel');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const allTypes = [
    { id: 'mcq', label: 'Multiple Choice', icon: '●' },
    { id: 'true_false', label: 'True / False', icon: '✓' },
    { id: 'short_answer', label: 'Identification', icon: '✎' },
    { id: 'fill_blank', label: 'Fill in Blank', icon: '▭' },
    { id: 'matching', label: 'Matching', icon: '⇄' },
  ];

  const handleTypeChange = (typeId) => {
    setQTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleMixToggle = () => {
    if (qTypes.length === allTypes.length) {
      setQTypes([]);
    } else {
      setQTypes(allTypes.map((t) => t.id));
    }
  };

  const isMixChecked = qTypes.length === allTypes.length;

  const validateFile = (pickedFile) => {
    if (!pickedFile) return false;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    const ext = pickedFile.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'docx', 'pptx', 'txt', 'png', 'jpg', 'jpeg', 'webp'];

    if (!allowedTypes.includes(pickedFile.type) && !allowedExtensions.includes(ext)) {
      setFileError('Only PDF, DOCX, PPTX, TXT, PNG, JPG, JPEG, and WEBP are supported.');
      return false;
    }

    setFileError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const pickedFile = e.target.files?.[0];
    if (pickedFile && validateFile(pickedFile)) setFile(pickedFile);
  };

  const copyInviteLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      alert('Invite link copied!');
    } catch (err) {
      console.error(err);
      alert('Failed to copy invite link.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.subject.trim()) {
      showStatus('error', 'Please complete the title and subject.');
      return;
    }

    if (qTypes.length === 0) {
      showStatus('error', 'Please select at least one question type.');
      return;
    }

    setLoading(true);
    setLastInviteLink('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('subject', formData.subject);
      data.append('difficulty', formData.difficulty);
      data.append('num_questions', formData.num_questions);
      data.append('time_per_question', formData.time_per_question);
      data.append('focus_area', formData.focus_area);
      data.append('allow_retake', String(formData.allow_retake));
      data.append('max_retakes', formData.max_retakes);

      if (file) data.append('file', file);

      qTypes.forEach((type) => data.append('question_types[]', type));

      const res = await API.post('/quiz/generate/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.invite_link) setLastInviteLink(res.data.invite_link);
      const generatedId = res.data?.id || res.data?.quiz_id;
      if (generatedId) setGeneratedQuizId(generatedId);

      showStatus('success', 'Quiz generated successfully! Choose what to do next.');
      setPostGenModalOpen(true);
    } catch (err) {
      console.error(err);
      showStatus('error', err.response?.data?.error || 'Error generating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = (quizId, canRetake = true) => {
    if (!canRetake) {
      showStatus('error', 'Retake is disabled for this quiz.');
      return;
    }
    navigate(`/quiz/take/${quizId}`);
  };

  const handleShare = async (quizId, target) => {
    if (target === 'chatroom') {
      setSelectedQuizIdForShare(quizId);
      setChatroomModalOpen(true);
      return;
    }

    try {
      const res = await API.post(`/quiz/${quizId}/share/`, { target });

      if (res.data?.invite_link) setLastInviteLink(res.data.invite_link);

      showStatus('success', res.data?.message || `Successfully shared to ${target}!`);
      fetchHistory();
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to share quiz.');
    }
  };

  const handleSendToChatroom = async (chatroomId) => {
    if (!selectedQuizIdForShare) return;

    try {
      setSharingToChatroom(true);

      const res = await API.post(`/quiz/${selectedQuizIdForShare}/share/`, {
        target: 'chatroom',
        chatroom_id: chatroomId,
      });

      if (res.data?.invite_link) setLastInviteLink(res.data.invite_link);

      showStatus('success', res.data?.message || 'Quiz link sent to chatroom.');
      setChatroomModalOpen(false);
      setSelectedQuizIdForShare(null);
      setChatroomSearch('');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showStatus('error', err.response?.data?.error || 'Failed to send quiz to chatroom.');
    } finally {
      setSharingToChatroom(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'average';
  };

  const avgScore =
    filteredHistory.length > 0
      ? Math.round(
          filteredHistory.reduce((acc, h) => acc + (h.score / h.total) * 100, 0) / filteredHistory.length
        )
      : 0;

  const thisWeekCount = history.filter((h) => {
    const date = new Date(h.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  return (
    <div className={`quiz-generator-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />

      <div className="quiz-generator-main">
        <Navbar />

        <main className="quiz-generator-content">
          <div className="quiz-page-topbar">
            <h1>Quiz Generator</h1>
          </div>

          <section className="quiz-hero-banner">
            <div className="quiz-hero-copy">
              <div className="quiz-hero-stars">✦ ✦ ✦</div>
              <h2>Quiz Generator</h2>
              <p>Create AI-powered quizzes tailored to your learning needs</p>
            </div>
            <div className="quiz-hero-rocket">🚀</div>
          </section>

          {statusMessage && (
            <section className={`status-banner ${statusMessage.type}`}>
              {statusMessage.text}
            </section>
          )}

          {lastInviteLink && (
            <section className="glass-card invite-link-card">
              <div className="invite-link-header">
                <h3>
                  <LinkIcon size={18} /> Private Quiz Invite Link
                </h3>
              </div>

              <div className="invite-link-body">
                <input type="text" value={lastInviteLink} readOnly />
                <button type="button" onClick={() => copyInviteLink(lastInviteLink)}>
                  <Copy size={16} /> Copy
                </button>
              </div>
            </section>
          )}

          <section className="quiz-grid-top">
            <div className="glass-card quiz-creator-card">
              <div className="quiz-card-header soft-cloud-header">
                <div className="icon-bubble purple">
                  <PlusCircle size={22} />
                </div>
                <h3>Create New Quiz</h3>
              </div>

              <form onSubmit={handleSubmit} className="quiz-form-area">
                <div className="quiz-form-row two">
                  <div className="quiz-form-group">
                    <label>Quiz Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Advanced Mathematics"
                      required
                    />
                  </div>

                  <div className="quiz-form-group">
                    <label>Subject / Topic</label>
                    {/* REMOVED subject-inline-btn from here */}
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <small className="field-note">
                      Organize your quiz by subject and reuse the topic later.
                    </small>
                  </div>
                </div>

                <div className="quiz-form-row three">
                  <div className="quiz-form-group">
                    <label>Difficulty Level</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="quiz-form-group">
                    <label>
                      <BarChart3 size={13} /> Number of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.num_questions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          num_questions: parseInt(e.target.value || 1, 10),
                        })
                      }
                    />
                  </div>

                  <div className="quiz-form-group">
                    <label>
                      <Clock3 size={13} /> Time Per Question (secs)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={formData.time_per_question}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time_per_question: parseInt(e.target.value || 30, 10),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="quiz-form-row one">
                  <div className="quiz-form-group">
                    <label>
                      <RotateCcw size={13} /> Maximum Retakes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.max_retakes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_retakes: parseInt(e.target.value || 3, 10),
                        })
                      }
                      disabled={!formData.allow_retake}
                    />
                    {!formData.allow_retake && (
                      <small className="field-note">Enable retakes above to set this value.</small>
                    )}
                  </div>
                </div>

                <div className="quiz-form-group">
                  <label>Focus Area (optional)</label>
                  <input
                    type="text"
                    value={formData.focus_area}
                    onChange={(e) => setFormData({ ...formData, focus_area: e.target.value })}
                    placeholder="e.g. loops, photosynthesis, derivatives"
                  />
                </div>

                <div className="quiz-form-group">
                  <div className="inline-label-row">
                    <label>Study Material (optional)</label>
                    <span className="supported-files-label">
                      PDF, DOCX, PPTX, TXT, PNG, JPG, WEBP
                    </span>
                  </div>

                  <div
                    className={`quiz-file-dropzone ${dragActive ? 'active' : ''} ${
                      file ? 'has-file' : ''
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.webp"
                    />

                    {file ? (
                      <div className="file-state success">
                        <CheckCircle2 size={34} />
                        <h4>{file.name}</h4>
                        <p>Ready for quiz generation</p>
                      </div>
                    ) : (
                      <div className="file-state">
                        <Upload size={40} />
                        <h4>
                          Drag & drop file here, or <span>Browse</span>
                        </h4>
                        <p>Upload notes, reviewers, handouts, slides, or pictures with text</p>
                      </div>
                    )}
                  </div>

                  {fileError && <div className="quiz-error-text">{fileError}</div>}
                </div>

                <div className="quiz-form-group">
                  <div className="inline-label-row">
                    <label>Question Types</label>
                    <button
                      type="button"
                      className={`mix-toggle-pill ${isMixChecked ? 'active' : ''}`}
                      onClick={handleMixToggle}
                    >
                      <span className="mix-toggle-circle" />
                      Mix All
                    </button>
                  </div>

                  <div className="question-type-pills">
                    {allTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeChange(type.id)}
                        className={`question-pill ${qTypes.includes(type.id) ? 'active' : ''}`}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-form-group">
                  <div className="retake-toggle-row">
                    <label>Allow Retake</label>

                    <button
                      type="button"
                      className={`mix-toggle-pill ${formData.allow_retake ? 'active' : ''}`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          allow_retake: !prev.allow_retake,
                        }))
                      }
                    >
                      <span className="mix-toggle-circle" />
                      {formData.allow_retake ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="generate-quiz-btn">
                  {loading ? (
                    <>
                      <Loader size={18} className="spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} /> Generate Quiz
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="glass-card quiz-history-side-card">
              <div className="side-title-row">
                <h3>Quiz Creation History</h3>
              </div>

              <div className="history-mini-stats">
                <div className="mini-stat-box lilac">
                  <Sparkles size={18} />
                  <div>
                    <span>Average Score</span>
                    <strong>{avgScore}%</strong>
                  </div>
                </div>

                <div className="mini-stat-box peach">
                  <ClipboardList size={18} />
                  <div>
                    <span>Quizzes</span>
                    <strong>{history.length}</strong>
                  </div>
                </div>

                <div className="mini-stat-box sky">
                  <Calendar size={18} />
                  <div>
                    <span>This Week</span>
                    <strong>{thisWeekCount}</strong>
                  </div>
                </div>
              </div>

              {/* MOVED MY SUBJECTS PANEL HERE */}
              <div id="subject-manager-panel" className="subject-manager-card">
                <div className="subject-manager-header">
                  <h4>My Subjects <span className="subject-count">({subjects.length})</span></h4>
                  <button type="button" className="small-action-btn" onClick={openNewSubjectForm}>
                    + Subject
                  </button>
                </div>

                {subjectFormOpen && (
                  <div className="subject-form-panel">
                    <input
                      type="text"
                      value={subjectFormName}
                      onChange={(e) => setSubjectFormName(e.target.value)}
                      placeholder="Subject name"
                    />
                    <div className="subject-form-actions">
                      <button
                        type="button"
                        className="small-action-btn"
                        onClick={handleSaveSubject}
                        disabled={subjectSaving}
                      >
                        {editingSubject ? 'Save' : 'Create'}
                      </button>
                      <button
                        type="button"
                        className="secondary-action-btn"
                        onClick={() => {
                          setSubjectFormOpen(false);
                          resetSubjectForm();
                        }}
                        disabled={subjectSaving}
                      >
                        Cancel
                      </button>
                    </div>
                    {subjectError && <div className="subject-error">{subjectError}</div>}
                  </div>
                )}

                <div className="subject-list-panel">
                  {subjects.length === 0 ? (
                    <div className="side-empty-state">No subjects yet.</div>
                  ) : (
                    subjects.map((subject) => (
                      <div key={subject.id} className="subject-list-item">
                        <span>{subject.name}</span>
                        <div className="subject-actions">
                          <button type="button" onClick={() => handleEditSubject(subject)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteSubject(subject.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="recent-side-list-head">
                <h4>
                  <FileQuestion size={18} /> Recent Quizzes
                </h4>
              </div>

              <div className="recent-side-list">
                {history.length === 0 ? (
                  <div className="side-empty-state">No recent quizzes yet.</div>
                ) : (
                  history.slice(0, 4).map((h) => {
                    const percentage = Math.round((h.score / h.total) * 100);

                    return (
                      <div key={h.quiz_id} className="recent-side-item">
                        <div className="recent-side-icon">
                          <FileQuestion size={18} />
                        </div>

                        <div className="recent-side-content">
                          <div className="recent-side-title">{h.quiz_title}</div>
                          <div className="recent-side-meta">
                            {h.subject?.name || 'General'} • {h.status || `${h.attempt_count || 1} take`}
                          </div>
                          <div className="recent-side-score">
                            {percentage}%
                          </div>
                        </div>

                        <div className="recent-side-actions">
                          <button
                            onClick={() => handleRetake(h.quiz_id, h.can_retake)}
                            title={h.can_retake ? 'Retake' : 'Retake disabled'}
                            disabled={!h.can_retake}
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            onClick={() => handleShare(h.quiz_id, 'library')}
                            title="Share to Library"
                          >
                            <BookOpen size={15} />
                          </button>

                          <button
                            onClick={() => handleShare(h.quiz_id, 'chatroom')}
                            title="Share to Chatroom"
                          >
                            <MessageSquare size={15} />
                          </button>

                          {h.visibility === 'private' && h.invite_code && (
                            <button
                              onClick={() =>
                                copyInviteLink(
                                  `${window.location.origin}/quiz/invite/${h.invite_code}`
                                )
                              }
                              title="Copy Invite Link"
                            >
                              <LinkIcon size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                className="view-all-history-btn"
                onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })}
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
          </section>

          <section className="glass-card history-table-card">
            <div className="quiz-card-header plain">
              <div className="history-header-left">
                <FileQuestion size={18} />
                <h3>List of Quizzes</h3>
              </div>

              <div className="history-header-actions">
                <button
                  type="button"
                  className="manage-subjects-btn"
                  onClick={scrollToSubjectManager}
                  title="Manage Subjects"
                >
                  Subjects
                </button>
                <button onClick={fetchHistory} className="refresh-history-btn" title="Refresh">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            <div className="history-filter-bar">
              <div className="filter-chip">
                <label>Subject</label>
                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-chip">
                <label>Date</label>
                <select
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </select>
              </div>
            </div>

            <div className="quiz-history-table-wrap">
              <table className="quiz-history-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Score</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th>Visibility</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="history-empty-state">
                          <Trophy size={36} />
                          <p>
                            {history.length === 0
                              ? 'No quizzes taken yet'
                              : 'No quizzes match the selected filters'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((h) => {
                      const percentage = Math.round((h.score / h.total) * 100);
                      const scoreClass = getScoreColor(percentage);

                      return (
                        <tr key={h.quiz_id}>
                          <td>
                            <div className="table-quiz-title">{h.subject_name || 'General'}</div>
                            <div className="table-quiz-subtitle">{h.quiz_title}</div>
                            <div className="table-attempt-badge">
                              Retakes: {h.retake_count || 0}/{h.max_retakes || 3}
                            </div>
                          </td>

                          <td>
                            <div className="table-score">
                              <strong>{h.score}</strong>
                              <span> / {h.total}</span>
                            </div>
                          </td>

                          <td>
                            <div className="table-performance-wrap">
                              <div className="table-progress-bar">
                                <div
                                  className={`table-progress-fill ${scoreClass}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className={`table-score-badge ${scoreClass}`}>
                                {percentage}%
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="table-status-badge">
                              {h.status || `${h.attempt_count || 1} take`}
                            </span>
                          </td>

                          <td>
                            <span className={`table-visibility-badge ${h.visibility || 'private'}`}>
                              {h.visibility || 'private'}
                            </span>
                          </td>

                          <td>
                            <div className="table-date-cell">
                              <Calendar size={12} />
                              {new Date(h.date || h.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </td>

                          <td>
                            <div className="table-action-row">
                              <button
                                onClick={() => handleLoadQuizForEdit(h.quiz_id)}
                                title="Edit Quiz"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenLeaderboard(h.quiz_id, h.visibility === 'public' ? 'public' : 'private')}
                                title="Leaderboard"
                              >
                                <Trophy size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteQuiz(h.quiz_id)}
                                title="Delete Quiz"
                              >
                                <Trash2 size={14} />
                              </button>

                              <button
                                onClick={() => handleRetake(h.quiz_id, h.can_retake)}
                                title={h.can_retake ? 'Retake' : 'Retake disabled'}
                                disabled={!h.can_retake}
                              >
                                <RotateCcw size={14} />
                              </button>

                              <button
                                onClick={() => handleShare(h.quiz_id, 'library')}
                                title="Share to Library"
                              >
                                <BookOpen size={14} />
                              </button>

                              <button
                                onClick={() => handleShare(h.quiz_id, 'chatroom')}
                                title="Share to Chatroom"
                              >
                                <MessageSquare size={14} />
                              </button>

                              {h.visibility === 'private' && h.invite_code && (
                                <button
                                  onClick={() =>
                                    copyInviteLink(
                                      `${window.location.origin}/quiz/invite/${h.invite_code}`
                                    )
                                  }
                                  title="Copy Invite Link"
                                >
                                  <LinkIcon size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Post Generation Modal */}
      {postGenModalOpen && (
        <div className="post-gen-modal-overlay" onClick={() => setPostGenModalOpen(false)}>
          <div className="post-gen-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="post-gen-modal-header">
              <h3>Quiz Generated Successfully!</h3>
              <p>What would you like to do next?</p>
            </div>
            <div className="post-gen-modal-actions">
              <button
                className="post-gen-btn continue"
                onClick={() => {
                  setPostGenModalOpen(false);
                  navigate(`/quiz/take/${generatedQuizId}`);
                }}
              >
                <ArrowRight size={18} />
                Continue to Quiz
              </button>
              <button
                className="post-gen-btn library"
                onClick={() => {
                  setPostGenModalOpen(false);
                  navigate('/library');
                }}
              >
                <BookOpen size={18} />
                Store in Library
              </button>
              <button
                className="post-gen-btn share"
                onClick={() => {
                  setPostGenModalOpen(false);
                  handleShare(generatedQuizId, 'chatroom');
                }}
              >
                <MessageSquare size={18} />
                Share to Chatroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chatroom Modal */}
      {chatroomModalOpen && (
        <div className="chatroom-modal-overlay" onClick={() => setChatroomModalOpen(false)}>
          <div className="chatroom-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chatroom-modal-header">
              <h3>Select Chatroom</h3>
            </div>

            <div className="chatroom-modal-body">
              <input
                type="text"
                placeholder="Search chatroom..."
                value={chatroomSearch}
                onChange={(e) => setChatroomSearch(e.target.value)}
                className="chatroom-search-input"
              />

              <div className="chatroom-list">
                {chatrooms.length === 0 ? (
                  <div className="chatroom-empty">No chatrooms found.</div>
                ) : (
                  chatrooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      className="chatroom-item-btn"
                      onClick={() => handleSendToChatroom(room.id)}
                      disabled={sharingToChatroom}
                    >
                      {room.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {leaderboardModalOpen && (
        <div className="chatroom-modal-overlay" onClick={() => setLeaderboardModalOpen(false)}>
          <div className="chatroom-modal-card leaderboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chatroom-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={18} /> Leaderboard
              </h3>
              <span className={`table-visibility-badge ${leaderboardQuiz?.scope || 'private'}`}>
                {leaderboardQuiz?.scope || 'private'}
              </span>
            </div>

            <div className="chatroom-modal-body" style={{ padding: '16px 20px 24px' }}>
              {leaderboardData.length === 0 ? (
                <div className="chatroom-empty">
                  <Trophy size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No entries yet.</p>
                </div>
              ) : (
                <div className="leaderboard-modal-list">
                  {leaderboardData.map((entry, i) => (
                    <div key={i} className="leaderboard-modal-row">
                      <div className="leaderboard-modal-rank">
                        {entry.rank === 1 ? (
                          <Crown size={18} style={{ color: '#f59e0b' }} />
                        ) : entry.rank === 2 ? (
                          <Medal size={18} style={{ color: '#94a3b8' }} />
                        ) : entry.rank === 3 ? (
                          <Medal size={18} style={{ color: '#d97706' }} />
                        ) : (
                          <span style={{ fontWeight: 800, color: '#8f88b5', fontSize: 14 }}>#{entry.rank}</span>
                        )}
                      </div>
                      <div className="leaderboard-modal-name">{entry.username}</div>
                      <div className="leaderboard-modal-score">
                        <strong>{entry.score}</strong>
                        <span>/{entry.total}</span>
                      </div>
                      {entry.percentage !== undefined && (
                        <span className={`table-score-badge ${entry.percentage >= 80 ? 'excellent' : entry.percentage >= 60 ? 'good' : 'average'}`}>
                          {Math.round(entry.percentage)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;