import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
  Users,
  BarChart2,
  Trophy,
  Activity,
  MessageSquare,
  Search,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Award,
  UserCircle2,
  X,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '../styles/TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Filter State
  const [selectedChatroom, setSelectedChatroom] = useState('');

  // Fetch Dashboard Stats
  useEffect(() => {
    setIsFetching(true);
    const params = selectedChatroom ? `?chatroom_id=${selectedChatroom}` : '';
    API.get(`/dashboard-stats/${params}`)
      .then((res) => setStats(res.data || {}))
      .catch((err) => {
        console.error(err);
        if (!stats) setError('Failed to load dashboard data.');
      })
      .finally(() => setIsFetching(false));
  }, [selectedChatroom]);

  // Fetch User Search Results
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      API.get(`/search-users/?q=${searchQuery}`)
        .then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chatrooms = useMemo(() => Array.isArray(stats?.chatrooms) ? stats.chatrooms : [], [stats]);
  const activityData = useMemo(() => Array.isArray(stats?.activity_data) ? stats.activity_data : [], [stats]);
  const topStudents = useMemo(() => Array.isArray(stats?.top_students) ? stats.top_students : [], [stats]);
  const recentAttempts = useMemo(() => Array.isArray(stats?.recent_attempts) ? stats.recent_attempts : [], [stats]);
  
  // Derived data for Class Health
  const passFailData = stats?.pass_fail_data || { passed: 0, failed: 0, total_attempts: 0, pass_rate: 0 };
  const scoreExtremesData = stats?.score_extremes_data || { highest: 0, lowest: 0, avg_attempts: 0 };

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); };

  if (error && !stats) return (
    <div className="content-body teacher-dashboard-error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="content-body teacher-dashboard-shell">
      {/* TOPBAR */}
      <div className="teacher-dashboard-topbar">
        <h2>Teacher Overview</h2>
        <div className="td-search-container" ref={searchRef}>
          <div className="td-search-input-wrap">
            <Search size={18} className="td-search-icon" />
            <input type="text" placeholder="Search students or users..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }} onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }} />
            {isSearching && <Loader2 size={18} className="td-search-spinner" />}
            {searchQuery && !isSearching && <X size={18} className="td-search-clear" onClick={clearSearch} />}
          </div>
          {showSearchDropdown && (
            <div className="td-search-dropdown">
              {searchQuery.length < 2 ? <div className="td-search-empty">Type at least 2 characters...</div>
              : !isSearching && searchResults.length === 0 ? <div className="td-search-empty">No users found for "{searchQuery}"</div>
              : searchResults.map((u) => (
                <div key={u.id} className="td-search-result-item" onClick={() => { navigate(`/profile/${u.id}`); clearSearch(); }}>
                  <img src={u.profile_pic || `https://ui-avatars.com/api/?name=${u.username}&background=8B5CF6&color=fff`} alt="" className="td-search-avatar" />
                  <div className="td-search-user-info"><strong>{u.username}</strong><span>ID: {u.unique_id || u.id}</span></div>
                  <div className="td-search-badge-wrap">
                    {u.is_friend && <span className="td-badge-friend">Friends</span>}
                    {u.request_sent && <span className="td-badge-pending">Sent</span>}
                    <ChevronRight size={16} className="td-arrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <section className="teacher-hero-banner">
        <div className="teacher-hero-copy">
          <div className="teacher-hero-stars">✦ ✦ ✦</div>
          <h1>Welcome back, Teacher 👋</h1>
          <p>Monitor class performance, track engagement, and manage your students.</p>
        </div>
        <div className="teacher-hero-icon"><Sparkles size={40} /></div>
      </section>

      <div className={`td-content-wrapper ${isFetching ? 'td-is-loading' : ''}`}>
        {isFetching && <div className="td-filter-loader"><Loader2 size={24} /></div>}

        {/* STAT CARDS */}
        <section className="teacher-stat-grid">
          <div className="teacher-stat-card purple"><div className="teacher-stat-icon"><Users size={20} /></div><div><strong>{stats?.total_students ?? 0}</strong><span>Total Students</span></div></div>
          <div className="teacher-stat-card green"><div className="teacher-stat-icon"><BarChart2 size={20} /></div><div><strong>{stats?.average_score ?? 0}%</strong><span>Average Score</span></div></div>
          <div className="teacher-stat-card blue"><div className="teacher-stat-icon"><MessageSquare size={20} /></div><div><strong>{chatrooms.length}</strong><span>Group Chatrooms</span></div></div>
          <div className="teacher-stat-card orange"><div className="teacher-stat-icon"><Trophy size={20} /></div><div><strong>{topStudents.length}</strong><span>Top Performers</span></div></div>
        </section>

        {/* FILTER PILLS */}
        {chatrooms.length > 0 && (
          <div className="td-filter-container">
            <div className="td-filter-pills">
              <button className={`td-pill ${!selectedChatroom ? 'td-pill-active' : ''}`} onClick={() => setSelectedChatroom('')}>All Classes</button>
              {chatrooms.map((room) => (
                <button key={room.id} className={`td-pill ${selectedChatroom === room.id ? 'td-pill-active' : ''}`} onClick={() => setSelectedChatroom(room.id)}>
                  {room.name}
                  <span className="td-pill-count">{room.members}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHARTS & CHATROOMS ROW */}
        <section className="teacher-main-grid">
          <div className="teacher-card teacher-chart-card">
            <div className="teacher-card-header"><h3><Activity size={18} /> Weekly Activity</h3><span className="teacher-card-chip">Mon - Fri</span></div>
            {activityData.length > 0 ? (
              <div className="teacher-chart-wrap"><ResponsiveContainer width="100%" height={280}><LineChart data={activityData}><CartesianGrid strokeDasharray="3 3" stroke="#E9DFFF" /><XAxis dataKey="name" stroke="#8D87B3" /><YAxis stroke="#8D87B3" allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="students" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: "#8B5CF6" }} activeDot={{ r: 7 }} /></LineChart></ResponsiveContainer></div>
            ) : <div className="teacher-empty-state"><Activity size={32} strokeWidth={1.5} /><p>No activity data for this period</p></div>}
          </div>

          {/* MOVED GROUP CHATROOMS HERE */}
          <div className="teacher-card teacher-chatrooms-card">
            <div className="teacher-card-header"><h3><MessageSquare size={18} /> Group Chatrooms</h3></div>
            {chatrooms.length > 0 ? (
              <div className="teacher-chatroom-list">{chatrooms.map((room) => (
                <div key={room.id} className="teacher-interactive-row" style={{ padding: '14px 8px' }} onClick={() => navigate(`/chat/${room.id}`)}>
                  <div className="teacher-chatroom-avatar">{(room.name || 'C').charAt(0).toUpperCase()}</div>
                  <div className="teacher-chatroom-info"><strong>{room.name}</strong><p>{room.last_message || 'No messages yet'}</p><small>{room.members || 0} members</small></div>
                  <ChevronRight size={16} className="teacher-chatroom-arrow" />
                </div>
              ))}</div>
            ) : <div className="teacher-empty-state"><MessageSquare size={32} strokeWidth={1.5} /><p>No group chatrooms found</p><span>Create a group to start messaging your class</span></div>}
          </div>
        </section>

        {/* FULL WIDTH CLASS HEALTH ROW */}
        <section className="teacher-main-grid td-full-width-section" style={{ marginTop: '16px' }}>
          <div className="teacher-card td-health-card">
            <div className="teacher-card-header">
              <h3><CheckCircle size={18} /> Class Health & Analytics</h3>
              <span className={`td-health-badge ${passFailData.pass_rate >= 75 ? 'good' : passFailData.pass_rate >= 50 ? 'warn' : 'bad'}`}>
                {passFailData.pass_rate >= 75 ? 'Good Standing' : passFailData.pass_rate >= 50 ? 'Needs Attention' : 'At Risk'}
              </span>
            </div>
            
            {passFailData.total_attempts > 0 ? (
              <div className="td-health-content-extended">
                <div className="td-health-col">
                  <div className="td-health-ring-wrapper">
                    <div className="td-health-ring" style={{ background: `conic-gradient(#22c55e 0% ${passFailData.pass_rate}%, #f3f4f6 ${passFailData.pass_rate}% 100%)` }}>
                      <div className="td-health-ring-inner">
                        <strong>{passFailData.pass_rate}%</strong>
                        <span>Pass Rate</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="td-health-col td-extremes-col">
                  <div className="td-extremes-header">Score Extremes</div>
                  <div className="td-extremes-grid">
                    <div className="td-extreme-item high">
                      <TrendingUp size={18} />
                      <div><strong>{scoreExtremesData.highest}%</strong><span>Highest Score</span></div>
                    </div>
                    <div className="td-extreme-item low">
                      <TrendingDown size={18} />
                      <div><strong>{scoreExtremesData.lowest}%</strong><span>Lowest Score</span></div>
                    </div>
                  </div>
                  <div className="td-extremes-divider"></div>
                  <div className="td-extreme-item total" style={{marginTop: '0'}}>
                    <Activity size={18} />
                    <div><strong>{scoreExtremesData.avg_attempts}</strong><span>Avg Attempts / Student</span></div>
                  </div>
                </div>

                <div className="td-health-col">
                  <div className="td-health-stats">
                    <div className="td-health-stat-row passed"><CheckCircle size={20} /><div><strong>{passFailData.passed}</strong><span>Passed (≥60%)</span></div></div>
                    <div className="td-health-stat-row failed"><XCircle size={20} /><div><strong>{passFailData.failed}</strong><span>Failed (&lt;60%)</span></div></div>
                    <div className="td-health-stat-row total"><Users size={20} /><div><strong>{passFailData.total_attempts}</strong><span>Total Submissions</span></div></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="teacher-empty-state"><CheckCircle size={32} strokeWidth={1.5} /><p>No submissions yet</p><span>Class health metrics will appear here</span></div>
            )}
          </div>
        </section>

        {/* RECENT ACTIVITY & TOP PERFORMERS */}
        <section className="teacher-main-grid" style={{ marginTop: '16px' }}>
          <div className="teacher-card">
            <div className="teacher-card-header"><h3><Activity size={18} /> Recent Student Activity</h3></div>
            {recentAttempts.length > 0 ? (
              <div className="teacher-performer-list">{recentAttempts.map((a, i) => (
                <div key={i} className="teacher-interactive-row" onClick={() => navigate(`/profile/${a.student_id}`)}>
                  <div className="teacher-performer-avatar"><UserCircle2 size={22} /></div>
                  <div className="teacher-performer-info"><strong>{a.student}</strong><p>Took: {a.quiz}</p></div>
                  <div style={{textAlign: 'right'}}><div className="teacher-score-pill">{a.score}%</div><small style={{color: '#9d95bf', fontSize: '11px'}}>{a.date}</small></div>
                </div>
              ))}</div>
            ) : <div className="teacher-empty-state"><Activity size={32} strokeWidth={1.5} /><p>No recent activity</p></div>}
          </div>

          <div className="teacher-card">
            <div className="teacher-card-header"><h3><Award size={18} /> Top Performers</h3></div>
            {topStudents.length > 0 ? (
              <div className="teacher-performer-list">{topStudents.map((student, index) => (
                <div key={index} className="teacher-interactive-row" onClick={() => navigate(`/profile/${student.id}`)}>
                  <div className="teacher-rank-badge">#{index + 1}</div>
                  <div className="teacher-performer-info"><div className="teacher-performer-avatar"><UserCircle2 size={22} /></div><div><strong>{student.name}</strong><p>Top student performance</p></div></div>
                  <div className="teacher-score-pill">{student.score}%</div>
                </div>
              ))}</div>
            ) : <div className="teacher-empty-state"><Award size={32} strokeWidth={1.5} /><p>No top performers in this selection</p></div>}
          </div>
        </section>

      </div>
    </div>
  );
};

export default TeacherDashboard;