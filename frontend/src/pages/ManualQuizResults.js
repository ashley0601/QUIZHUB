import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { Trophy, Medal, ArrowLeft, Crown, Download, Users, TrendingUp, Target, Search, SlidersHorizontal } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/ManualQuizResults.css';

export default function ManualQuizResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`/manual-quiz/${id}/results/`);
        const data = res.data;
        if (data && typeof data === 'object') {
          setQuizTitle(data.quiz_title || '');
          setResults(Array.isArray(data.results) ? data.results : []);
        } else {
          setQuizTitle('');
          setResults([]);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleExport = async () => {
    try {
      const res = await API.get(`/manual-quiz/${id}/export/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url; a.download = `leaderboard_${quizTitle || id}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.error || 'No results yet'));
    }
  };

  const sorted = [...results].sort((a, b) => {
    const pctA = a.percentage || 0;
    const pctB = b.percentage || 0;
    if (pctB !== pctA) return pctB - pctA;
    if (a.score !== b.score) return b.score - a.score;
    return 0;
  });

  const filtered = sorted.filter(r => {
    const name = (r.full_name || r.student_name || '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    if (scoreFilter === 'pass') return matchSearch && (r.percentage || 0) >= 50;
    if (scoreFilter === 'fail') return matchSearch && (r.percentage || 0) < 50;
    if (scoreFilter === 'top25') return matchSearch && (r.percentage || 0) >= 75;
    return matchSearch;
  });

  const totalParticipants = sorted.length;
  const highestScore = sorted[0]?.percentage || 0;
  const average = totalParticipants ? Math.round(sorted.reduce((s, r) => s + (r.percentage || 0), 0) / totalParticipants) : 0;
  const passRate = totalParticipants ? Math.round(sorted.filter(r => (r.percentage || 0) >= 50).length / totalParticipants * 100) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } 
    catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="lb-loading"><div className="lb-spinner"></div>Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="lb-error">
            <Trophy size={48} color="#d1d5db" />
            <h3>{error}</h3>
            <button className="lb-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="lb-error">
            <Trophy size={48} color="#d1d5db" />
            <h3>No submissions yet</h3>
            <p className="lb-error-desc">Results will appear here once students take the quiz.</p>
            <button className="lb-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="lb-page">
          
          {/* Header */}
          <div className="lb-header">
            <div className="lb-header-left">
              <button className="lb-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
              <div className="lb-title-area">
                <div className="lb-crown-glow">
                  <Crown size={26} />
                </div>
                <h1 className="lb-main-title">Leaderboard</h1>
              </div>
            </div>
            <button className="lb-export-btn" onClick={handleExport}>
              <Download size={16} /> Export Excel
            </button>
          </div>

          {/* Advanced Stats */}
          <div className="lb-stats-bar">
            <div className="lb-stat-card">
              <div className="lb-stat-icon participants"><Users size={20} /></div>
              <div className="lb-stat-content">
                <span className="lb-stat-num">{totalParticipants}</span>
                <span className="lb-stat-label">Participants</span>
              </div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-icon highest"><TrendingUp size={20} /></div>
              <div className="lb-stat-content">
                <span className="lb-stat-num">{highestScore}%</span>
                <span className="lb-stat-label">Highest Score</span>
              </div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-icon average"><Target size={20} /></div>
              <div className="lb-stat-content">
                <span className="lb-stat-num">{average}%</span>
                <span className="lb-stat-label">Average</span>
              </div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-icon passrate"><Trophy size={20} /></div>
              <div className="lb-stat-content">
                <span className="lb-stat-num">{passRate}%</span>
                <span className="lb-stat-label">Pass Rate</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="lb-toolbar">
            <div className="lb-search-box">
              <Search size={16} className="lb-search-icon" />
              <input 
                placeholder="Search by full name..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="lb-search-input"
              />
            </div>
            <div className="lb-filter-box">
              <SlidersHorizontal size={15} className="lb-filter-icon" />
              <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="lb-filter-select">
                <option value="all">All Scores</option>
                <option value="pass">Passing (≥50%)</option>
                <option value="fail">Failing (&lt;50%)</option>
                <option value="top25">Top 25%</option>
              </select>
            </div>
            <div className="lb-results-count">
              Showing {filtered.length} of {totalParticipants}
            </div>
          </div>

          {/* Table */}
          <div className="lb-table-wrapper">
            <table className="lb-table">
              <thead>
                <tr>
                  <th className="lb-th-rank">Rank</th>
                  <th className="lb-th-student">Full Name</th>
                  <th className="lb-th-score">Score</th>
                  <th className="lb-th-pct">Percentage</th>
                  <th className="lb-th-date">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="lb-no-results">No students match your search criteria.</td>
                  </tr>
                ) : (
                  filtered.map((r, i) => {
                    const rank = i + 1;
                    const isTop3 = rank <= 3;
                    const studentName = r.full_name || r.student_name || 'Student';
                    return (
                      <tr key={r.id} className={`lb-table-row ${isTop3 ? 'top3' : ''}`}>
                        <td className="lb-td-rank">
                          {isTop3 ? (
                            <div className={`lb-badge lb-badge-${rank}`}>
                              {rank === 1 ? <Crown size={15} /> : <Medal size={15} />}
                              <span>{rank}</span>
                            </div>
                          ) : (
                            <span className="lb-rank-num">{rank}</span>
                          )}
                        </td>

                        <td className="lb-td-student">
                          <div className="lb-student-cell">
                            <div className={`lb-avatar ${isTop3 ? `lb-avatar-${rank}` : ''}`}>
                              {studentName.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="lb-student-info">
                              <span className="lb-name">{studentName}</span>
                              {r.student_email && <span className="lb-email">{r.student_email}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="lb-td-score">
                          <span className="lb-score-val">{r.score}</span>
                          <span className="lb-score-total"> / {r.total_points}</span>
                        </td>

                        <td className="lb-td-pct">
                          <div className="lb-pct-wrapper">
                            <div className="lb-pct-bar-track">
                              <div
                                className={`lb-pct-bar-fill ${r.percentage >= 80 ? 'fill-high' : r.percentage >= 50 ? 'fill-mid' : 'fill-low'}`}
                                style={{ width: `${r.percentage || 0}%` }}
                              />
                            </div>
                            <span className={`lb-pct-text ${r.percentage >= 80 ? 'pct-high' : r.percentage >= 50 ? 'pct-mid' : 'pct-low'}`}>
                              {r.percentage || 0}%
                            </span>
                          </div>
                        </td>

                        <td className="lb-td-date">
                          {formatDate(r.submitted_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
