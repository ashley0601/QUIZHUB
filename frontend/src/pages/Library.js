import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Play,
  Upload,
  Download,
  X,
  Eye,
  Globe,
  Users,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [quizSearch, setQuizSearch] = useState('');
  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalLessons: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    subject: '',
    description: '',
    visibility: 'public',
  });
  const [lessonFile, setLessonFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewingLesson, setViewingLesson] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const cardStrips = [
    'linear-gradient(135deg, #8f67ff, #6d42f4)',
    'linear-gradient(135deg, #ffcc8f, #f59e0b)',
    'linear-gradient(135deg, #8db5ff, #6a8dff)',
    'linear-gradient(135deg, #b99aff, #8f67ff)',
  ];

  useEffect(() => {
    const update = () => {
      const sidebar =
        document.querySelector('.sidebar') ||
        document.querySelector('[class*="sidebar"]') ||
        document.querySelector('aside');
      if (!sidebar) return;
      const width = sidebar.getBoundingClientRect().width;
      setSidebarCollapsed(width <= 90);
    };

    update();

    let observer = null;
    const sidebar =
      document.querySelector('.sidebar') ||
      document.querySelector('[class*="sidebar"]') ||
      document.querySelector('aside');
    if (sidebar && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(sidebar);
    }

    const onToggle = () => setTimeout(update, 50);
    window.addEventListener('sidebar-toggle', onToggle);
    window.addEventListener('sidebar-collapsed', onToggle);
    window.addEventListener('sidebar-expanded', onToggle);

    const intervals = [];
    for (let i = 0; i < 10; i++) {
      const id = setTimeout(update, 300 * (i + 1));
      intervals.push(id);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener('sidebar-toggle', onToggle);
      window.removeEventListener('sidebar-collapsed', onToggle);
      window.removeEventListener('sidebar-expanded', onToggle);
      intervals.forEach(clearTimeout);
    };
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      const [quizRes, manualQuizRes, lessonRes] = await Promise.all([
        API.get(`/quiz/library/?search=${quizSearch}`),
        API.get(`/manual-quiz/library/?search=${quizSearch}`),
        API.get(`/library/lessons/?search=${quizSearch}`),
      ]);

      const quizzesData = Array.isArray(quizRes.data) ? quizRes.data : [];
      const manualQuizzesData = Array.isArray(manualQuizRes.data) ? manualQuizRes.data : [];
      
      // CRITICAL: Filter only quizzes where shared_to_library is strictly true
      const combinedQuizzes = [...manualQuizzesData, ...quizzesData].filter(
        (quiz) => quiz.shared_to_library === true
      );

      setQuizzes(combinedQuizzes);
      setLessons(Array.isArray(lessonRes.data) ? lessonRes.data : []);
      setStats({
        totalQuizzes: combinedQuizzes.length,
        totalLessons: Array.isArray(lessonRes.data) ? lessonRes.data.length : 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, [quizSearch]);

  useEffect(() => {
    fetchContent();
  }, [activeTab, quizSearch, filterDifficulty, fetchContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContent();
    }, 1000);
    return () => clearTimeout(timer);
  }, [fetchContent]);

  const handleLessonChange = (e) => {
    setLessonForm({ ...lessonForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setLessonFile(e.target.files[0]);
  };

  const handleLessonSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!lessonFile) return alert('Please select a file');

    setUploading(true);
    const formData = new FormData();
    formData.append('title', lessonForm.title);
    formData.append('subject', lessonForm.subject);
    formData.append('description', lessonForm.description);
    formData.append('file', lessonFile);
    formData.append('visibility', lessonForm.visibility);

    try {
      await API.post('/library/lessons/', formData);
      alert('Lesson uploaded successfully!');
      setShowUploadModal(false);
      setLessonForm({ title: '', subject: '', description: '', visibility: 'public' });
      setLessonFile(null);
      fetchContent();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await API.delete(`/library/lessons/${id}/`);
        fetchContent();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  const handleViewLesson = (lesson) => {
    const fileUrl = getFileUrl(lesson.file);
    const ext = lesson.file.split('.').pop().toLowerCase();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (ext === 'pdf') {
      window.open(fileUrl, '_blank');
      return;
    }

    if (['ppt', 'pptx', 'doc', 'docx'].includes(ext)) {
      if (isLocalhost) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = lesson.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      setViewingLesson(lesson);
      return;
    }

    window.open(fileUrl, '_blank');
  };

  const getVisibilityInfo = (visibility) => {
    switch (visibility) {
      case 'public':
        return { text: 'PUBLIC', icon: <Globe size={11} />, class: 'vis-public' };
      case 'friends':
        return { text: 'FRIENDS', icon: <Users size={11} />, class: 'vis-friends' };
      case 'private':
        return { text: 'PRIVATE', icon: <Lock size={11} />, class: 'vis-private' };
      default:
        return { text: 'PUBLIC', icon: <Globe size={11} />, class: 'vis-public' };
    }
  };

  const getDifficultyClass = (difficulty) => {
    switch ((difficulty || '').toString().toLowerCase()) {
      case 'easy':
        return 'easy';
      case 'medium':
        return 'medium';
      case 'hard':
        return 'hard';
      case 'manual':
        return 'manual';
      default:
        return 'medium';
    }
  };

  const filteredQuizzes =
    filterDifficulty === 'all'
      ? quizzes
      : quizzes.filter((q) => q.difficulty?.toLowerCase() === filterDifficulty);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="library-shell">
      <Sidebar />

      <div className={`library-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />

        <div className="library-content">
          <section className="library-hero">
            <div className="library-hero-copy">
              <div className="library-hero-stars">✦ ✦ ✦</div>
              <p className="library-hero-kicker">
                Welcome back, {localStorage.getItem('username') || 'Student'}!
              </p>
              <h1>Public Library</h1>

              <div className="library-hero-stats">
                <div className="library-stat-card">
                  <div className="library-stat-icon purple">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <strong>{stats.totalQuizzes}</strong>
                    <span>Shared Quizzes</span>
                  </div>
                </div>

                <div className="library-stat-card">
                  <div className="library-stat-icon gold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <strong>{stats.totalLessons}</strong>
                    <span>Total Lessons</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="library-hero-tip">
              <div className="tip-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="tip-title">Public Library</div>
                <div className="tip-sub">Only shared quizzes appear here</div>
              </div>
            </div>
          </section>

          <section className="library-toolbar">
            <div className="library-tabs">
              <button
                className={`library-tab ${activeTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('quizzes');
                  setFilterDifficulty('all');
                }}
              >
                <Play size={15} />
                Shared Quizzes
                <span>{quizzes.length}</span>
              </button>

              <button
                className={`library-tab ${activeTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setActiveTab('lessons')}
              >
                <BookOpen size={15} />
                Lessons
                <span>{lessons.length}</span>
              </button>
            </div>

            <div className="library-actions">
              <div className="library-search">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={quizSearch}
                  onChange={(e) => setQuizSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchContent()}
                />
                <button onClick={fetchContent}>
                  <Search size={18} />
                </button>
              </div>

              {activeTab === 'quizzes' && (
                <select
                  className="library-filter"
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              )}

              {activeTab === 'lessons' && (
                <button className="library-upload-btn" onClick={() => setShowUploadModal(true)}>
                  <Upload size={15} />
                  Upload Lesson
                </button>
              )}
            </div>
          </section>

          <section className="library-grid">
            {activeTab === 'quizzes' ? (
              filteredQuizzes.length === 0 ? (
                <div className="library-empty">
                  <div className="library-empty-icon">
                    <BookOpen size={28} />
                  </div>
                  <h3>No shared quizzes found</h3>
                  <p>Only quizzes explicitly shared to the library appear here</p>
                </div>
              ) : (
                filteredQuizzes.map((q, idx) => {
                  const strip = cardStrips[idx % cardStrips.length];

                  return (
                    <article key={q.id} className="library-card">
                      <div className="library-card-strip" style={{ background: strip }} />

                      <div className="library-card-body">
                        <div className="library-card-badges">
                          <span className="difficulty-badge shared-badge">
                            <Globe size={11} /> SHARED
                          </span>
                          <span className={`difficulty-badge ${getDifficultyClass(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>

                        <h3 className="library-card-title">{q.title}</h3>

                        <div className="library-meta">
                          <div className="library-meta-row">
                            <span>Subject</span>
                            <strong>{q.subject || (q.quiz_type === 'manual' ? 'Manual Quiz' : 'N/A')}</strong>
                          </div>
                          <div className="library-meta-row">
                            <span>Questions</span>
                            <strong>{q.questions_count}</strong>
                          </div>
                        </div>

                        <div className="library-card-user">
                          <div className="library-user-avatar">
                            {(q.created_by || '?')[0].toUpperCase()}
                          </div>
                          <span className="library-user-name">{q.created_by}</span>
                          <span className="library-user-date">{formatDate(q.created_at)}</span>
                        </div>
                      </div>

                      <div className="library-card-footer">
                        <button
                          className="library-primary-btn take-quiz-full"
                          onClick={() => navigate(q.quiz_type === 'manual' ? `/join-quiz/${q.unique_code}` : `/quiz/take/${q.id}`)}
                        >
                          <Play size={15} />
                          Take Quiz
                        </button>
                      </div>
                    </article>
                  );
                })
              )
            ) : lessons.length === 0 ? (
              <div className="library-empty">
                <div className="library-empty-icon">
                  <BookOpen size={28} />
                </div>
                <h3>No lessons found</h3>
                <p>Upload your first lesson to get started</p>
              </div>
            ) : (
              lessons.map((lesson, idx) => {
                const visInfo = getVisibilityInfo(lesson.visibility);
                const strip = cardStrips[idx % cardStrips.length];

                return (
                  <article key={lesson.id} className="library-card lesson-card">
                    <div className="library-card-strip" style={{ background: strip }} />

                    <div className="library-card-body">
                      <div className="lesson-head">
                        <h3 className="library-card-title">{lesson.title}</h3>
                        <span className={`visibility-badge ${visInfo.class}`}>
                          {visInfo.icon} {visInfo.text}
                        </span>
                      </div>

                      <div className="library-meta">
                        <div className="library-meta-row">
                          <span>Subject</span>
                          <strong>{lesson.subject}</strong>
                        </div>
                      </div>

                      <p className="lesson-description">
                        {lesson.description || 'No description provided.'}
                      </p>

                      <div className="library-card-user">
                        <div className="library-user-avatar">
                          {(lesson.created_by_username || '?')[0].toUpperCase()}
                        </div>
                        <span className="library-user-name">{lesson.created_by_username}</span>
                        <span className="library-user-date">{formatDate(lesson.created_at)}</span>
                      </div>
                    </div>

                    <div className="lesson-footer">
                      <button className="library-secondary-btn" onClick={() => handleViewLesson(lesson)}>
                        <Eye size={14} />
                        View
                      </button>

                      <a
                        href={getFileUrl(lesson.file)}
                        download
                        className="library-secondary-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={14} />
                        Download
                      </a>

                      {lesson.is_owner && (
                        <button className="library-icon-btn delete" onClick={() => handleDeleteLesson(lesson.id)}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>

      {/* Document Viewer Modal (PPT/DOCX on production) */}
      {viewingLesson && (
        <div className="library-modal-overlay" onClick={() => setViewingLesson(null)}>
          <div className="library-doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="library-doc-header">
              <h3>{viewingLesson.title}</h3>
              <div className="library-doc-actions">
                <a href={getFileUrl(viewingLesson.file)} download className="library-download-btn">
                  <Download size={14} />
                  Download
                </a>
                <button className="library-close-btn" onClick={() => setViewingLesson(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="library-doc-body">
              {(() => {
                const fileUrl = getFileUrl(viewingLesson.file);
                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
                return (
                  <iframe
                    src={viewerUrl}
                    width="100%"
                    height="100%"
                    title="Document Viewer"
                  >
                    This browser does not support embedded documents.
                  </iframe>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* New Modern Upload Lesson Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal-box" onClick={(e) => e.stopPropagation()}>
            
            <div className="upload-modal-header">
              <h3>
                <Upload size={20} />
                Upload Lesson
              </h3>
              <button className="upload-modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="upload-modal-body">
              {/* Visibility Selector */}
              <div>
                <div className="upload-section-label">Visibility</div>
                <div className="visibility-grid">
                  <div 
                    className={`visibility-card ${lessonForm.visibility === 'public' ? 'active' : ''}`}
                    onClick={() => setLessonForm({...lessonForm, visibility: 'public'})}
                  >
                    <Globe size={20} />
                    <span>Public</span>
                  </div>
                  
                  <div 
                    className={`visibility-card ${lessonForm.visibility === 'friends' ? 'active' : ''}`}
                    onClick={() => setLessonForm({...lessonForm, visibility: 'friends'})}
                  >
                    <Users size={20} />
                    <span>Friends</span>
                  </div>
                  
                  <div 
                    className={`visibility-card ${lessonForm.visibility === 'private' ? 'active' : ''}`}
                    onClick={() => setLessonForm({...lessonForm, visibility: 'private'})}
                  >
                    <Lock size={20} />
                    <span>Only Me</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLessonSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {/* Title Input */}
                <div className="upload-input-group">
                  <label>Lesson Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={lessonForm.title}
                    onChange={handleLessonChange}
                    placeholder="e.g., Introduction to Biology"
                    required
                  />
                </div>

                {/* Subject Input */}
                <div className="upload-input-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={lessonForm.subject}
                    onChange={handleLessonChange}
                    placeholder="e.g., Science"
                    required
                  />
                </div>

                {/* Description Textarea */}
                <div className="upload-input-group">
                  <label>Description (Optional)</label>
                  <textarea
                    name="description"
                    value={lessonForm.description}
                    onChange={handleLessonChange}
                    placeholder="Brief summary of what this lesson covers..."
                  />
                </div>

                {/* Modern File Dropzone */}
                <div 
                  className={`file-dropzone ${lessonFile ? 'has-file' : ''}`}
                  onClick={() => document.getElementById('lesson-file-input').click()}
                >
                  <input 
                    id="lesson-file-input"
                    type="file" 
                    onChange={handleFileChange} 
                    required 
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                  />
                  {lessonFile ? (
                    <div className="file-dropzone-name">
                      <FileText size={18} />
                      {lessonFile.name}
                    </div>
                  ) : (
                    <>
                      <div className="file-dropzone-icon">
                        <Upload size={28} />
                      </div>
                      <div className="file-dropzone-text">
                        Click to upload PDF, PPT, or DOCX
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="upload-modal-footer">
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-submit-upload" 
                disabled={uploading}
                onClick={handleLessonSubmit}
              >
                {uploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Lesson
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Library;