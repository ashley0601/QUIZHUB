import React, { useState, useEffect, useContext } from 'react';
import API from '../api';
import {
  BookOpen, FileQuestion, Flame, Trophy, Search, UserPlus, X, Loader,
  MessageCircle, Bell, Users, ChevronRight, Zap, Target, Rocket,
  TrendingUp, Award, CalendarDays, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchSocialData();
    fetchAnalyticsData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await API.get('/dashboard-stats/');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const res = await API.get('/dashboard-analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics', err);
    }
  };

  const fetchSocialData = async () => {
    try {
      const friendsRes = await API.get('/friends/');
      setFriends(friendsRes.data);
      const reqRes = await API.get('/friends/requests/pending/');
      setFriendRequests(reqRes.data);
    } catch (err) {
      console.error('Error fetching social data', err);
    }
  };

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const debounce = setTimeout(() => {
      API.get('/users/search/', { params: { q: searchQuery } })
        .then((res) => setSearchResults(res.data))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddFriend = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}/`);
      alert('Friend request sent!');
      const res = await API.get('/users/search/', { params: { q: searchQuery } });
      setSearchResults(res.data);
    } catch (err) { alert(err.response?.data?.message || 'Error sending request'); }
  };

  const handleAcceptRequest = async (reqId) => {
    try { await API.post(`/friends/request/${reqId}/handle/`, { action: 'accept' }); fetchSocialData(); }
    catch (err) { alert('Error accepting request'); }
  };

  const handleRejectRequest = async (reqId) => {
    try { await API.post(`/friends/request/${reqId}/handle/`, { action: 'reject' }); fetchSocialData(); }
    catch (err) { alert('Error rejecting request'); }
  };

  const startChat = () => navigate('/chatrooms');

  /* Helper to format last_seen_at into human-readable text */
  const formatLastSeen = (lastSeenAt, isOnline) => {
    if (isOnline) return 'Online now';
    if (!lastSeenAt) return 'Offline';
    
    const now = new Date();
    const last = new Date(lastSeenAt);
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return last.toLocaleDateString();
  };

  if (!stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Loader className="spin" size={40} color="#7c4dff" />
      </div>
    );
  }

  const displayName = user?.first_name || user?.username || 'Ashfley';

  const renderFriendButton = (u) => {
    if (u.is_friend) return <span className="qh-soft-disabled">Friends</span>;
    if (u.request_sent) return <span className="qh-soft-disabled">Pending</span>;
    return (
      <button className="qh-add-btn" onClick={() => handleAddFriend(u.id)}>
        <UserPlus size={14} /> Add
      </button>
    );
  };

  const statCards = [
    { label: 'Total Points', value: `${analytics?.xp_earned || 0}`, icon: <Zap size={20} />, softBg: 'rgba(153,102,255,0.12)', iconBg: 'linear-gradient(135deg, #f0e5ff, #eadbff)', iconColor: '#7c4dff' },
    { label: 'Average Score', value: `${analytics?.average_score || stats.average_score || 0}%`, icon: <Trophy size={20} />, softBg: 'rgba(104,211,145,0.12)', iconBg: 'linear-gradient(135deg, #d9fff0, #d1fae5)', iconColor: '#22c55e' },
    { label: 'Study Streak', value: `${analytics?.study_streak || stats.study_streak || 0} Days`, icon: <Flame size={20} />, softBg: 'rgba(255,179,71,0.13)', iconBg: 'linear-gradient(135deg, #fff0d9, #ffedd5)', iconColor: '#fb923c' },
    { label: 'Friends', value: `${friends.length || 0}`, icon: <Users size={20} />, softBg: 'rgba(59,130,246,0.12)', iconBg: 'linear-gradient(135deg, #dbeafe, #e0ecff)', iconColor: '#60a5fa' },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const streakData = analytics?.streak_data || [];
  const accuracyData = analytics?.accuracy_data || [
    { name: 'Correct', value: 0, color: '#22c55e' },
    { name: 'Incorrect', value: 0, color: '#f87171' },
    { name: 'Skipped', value: 0, color: '#fbbf24' },
  ];
  const scoreDistribution = analytics?.score_distribution || [
    { range: '0-20', count: 0 }, { range: '21-40', count: 0 }, { range: '41-60', count: 0 },
    { range: '61-80', count: 0 }, { range: '81-100', count: 0 },
  ];
  const weeklyComparison = analytics?.weekly_comparison || [
    { day: 'Mon', thisWeek: 0, lastWeek: 0 }, { day: 'Tue', thisWeek: 0, lastWeek: 0 },
    { day: 'Wed', thisWeek: 0, lastWeek: 0 }, { day: 'Thu', thisWeek: 0, lastWeek: 0 },
    { day: 'Fri', thisWeek: 0, lastWeek: 0 }, { day: 'Sat', thisWeek: 0, lastWeek: 0 },
    { day: 'Sun', thisWeek: 0, lastWeek: 0 },
  ];
  const weakTopics = analytics?.weak_topics || [];
  const strongTopics = analytics?.strong_topics || [];
  const completionData = analytics?.completion_data || { completed: 0, in_progress: 0, abandoned: 0 };

  const tooltipStyle = { borderRadius: 14, border: '1px solid rgba(124,77,255,0.12)', boxShadow: '0 10px 24px rgba(124,77,255,0.12)' };

  const TopicCard = ({ topic, variant }) => {
    const accentColor = variant === 'weak' ? '#f87171' : '#22c55e';
    const bgColor = variant === 'weak' ? 'rgba(248,113,113,0.08)' : 'rgba(34,197,94,0.08)';
    const borderColor = variant === 'weak' ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)';
    return (
      <div style={{ padding: '14px 16px', borderRadius: 14, background: bgColor, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#2f2a60' }}>{topic.name}</div>
          <div style={{ fontSize: 12, color: '#9b95b8', marginTop: 2 }}>{topic.accuracy}% accuracy</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg width="40" height="40" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="17" fill="none" stroke={variant === 'weak' ? 'rgba(248,113,113,0.2)' : 'rgba(34,197,94,0.2)'} strokeWidth="3" />
            <circle cx="20" cy="20" r="17" fill="none" stroke={accentColor} strokeWidth="3" strokeDasharray={`${(topic.accuracy / 100) * 107} 107`} strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="qh-page-shell">
      <style>{`
        .qh-page-shell {
          min-height: 100vh;
          padding: 0;
          position: relative;
          overflow: hidden;
        }
        .qh-container {
          position: relative;
          z-index: 1;
          width: 100%;
          margin: 0 auto;
        }
        .qh-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .qh-title { font-size: 20px; font-weight: 800; color: #2f2a60; margin: 0; }
        .qh-search-wrap {
          width: min(100%, 360px); display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 52px;
          border-radius: 999px; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px);
          border: 1px solid rgba(145, 102, 255, 0.12); box-shadow: 0 8px 24px rgba(124, 77, 255, 0.08);
        }
        .qh-search-wrap input { flex: 1; border: 0; outline: 0; background: transparent; color: #6b6891; font-size: 14px; }
        .qh-avatar-chip { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #845ef7, #b197fc); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(124, 77, 255, 0.25); }
        .qh-banner { position: relative; min-height: 160px; border-radius: 24px; padding: 34px; background: radial-gradient(circle at 15% 30%, rgba(255,255,255,0.18), transparent 16%), radial-gradient(circle at 35% 18%, rgba(255,255,255,0.22), transparent 8%), radial-gradient(circle at 68% 28%, rgba(255,255,255,0.16), transparent 12%), linear-gradient(135deg, #5f34da 0%, #8358f8 45%, #bb86ff 100%); overflow: hidden; box-shadow: 0 16px 45px rgba(122, 76, 255, 0.22); margin-bottom: 18px; }
        .qh-banner::before { content: ''; position: absolute; inset: auto -5% -35% -5%; height: 120px; background: radial-gradient(circle at 10% 40%, rgba(255,255,255,0.35) 0 70px, transparent 71px), radial-gradient(circle at 28% 70%, rgba(255,255,255,0.26) 0 90px, transparent 91px), radial-gradient(circle at 52% 45%, rgba(255,255,255,0.3) 0 85px, transparent 86px), radial-gradient(circle at 76% 70%, rgba(255,255,255,0.26) 0 92px, transparent 93px), radial-gradient(circle at 94% 50%, rgba(255,255,255,0.3) 0 72px, transparent 73px); }
        .qh-banner::after { content: '✦   ✦   ✦'; position: absolute; top: 22px; left: 28px; color: rgba(255,255,255,0.55); letter-spacing: 8px; font-size: 16px; }
        .qh-banner-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .qh-banner h2 { margin: 0 0 8px; color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .qh-banner p { margin: 0; color: rgba(255,255,255,0.8); font-size: 16px; }
        .qh-rocket-wrap { flex-shrink: 0; width: 132px; height: 132px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,0.22), rgba(255,255,255,0.04)); border: 1px solid rgba(255,255,255,0.18); }
        .qh-rocket-wrap svg { color: #fff; transform: rotate(30deg); filter: drop-shadow(0 8px 18px rgba(255,255,255,0.25)); }
        .qh-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
        .qh-stat-card, .qh-panel { background: rgba(255,255,255,0.56); backdrop-filter: blur(10px); border: 1px solid rgba(148, 126, 255, 0.12); border-radius: 22px; box-shadow: 0 10px 30px rgba(138, 111, 255, 0.08); }
        .qh-stat-card { padding: 18px 20px; display: flex; align-items: center; gap: 16px; min-height: 98px; }
        .qh-stat-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); }
        .qh-stat-meta { min-width: 0; }
        .qh-stat-value { font-size: 19px; font-weight: 800; color: #2f2a60; margin-bottom: 4px; }
        .qh-stat-label { color: #7d76a7; font-size: 14px; font-weight: 600; }
        .qh-main-grid { display: grid; grid-template-columns: 1.65fr 1fr; gap: 16px; margin-bottom: 16px; }
        .qh-bottom-grid { display: grid; grid-template-columns: 1.65fr 1fr; gap: 16px; margin-bottom: 16px; }
        .qh-analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .qh-analytics-grid-full { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
        .qh-panel-header { padding: 18px 20px 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(124, 77, 255, 0.08); }
        .qh-panel-title { display: flex; align-items: center; gap: 8px; color: #332d68; font-size: 15px; font-weight: 800; margin: 0; }
        .qh-panel-title svg { color: #7c4dff; }
        .qh-panel-body { padding: 16px 20px 18px; }
        .qh-friends-list { display: flex; flex-direction: column; gap: 12px; }
        .qh-friend-item { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
        .qh-friend-avatar, .qh-search-user-avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #9d7bff, #6e59f6); color: #fff; font-weight: 800; box-shadow: 0 6px 16px rgba(124, 77, 255, 0.18); flex-shrink: 0; cursor: pointer; }
        .qh-friend-avatar img, .qh-search-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .qh-friend-main { flex: 1; min-width: 0; cursor: pointer; }
        .qh-friend-name { font-size: 14px; font-weight: 700; color: #2f2a60; margin-bottom: 2px; }
        .qh-friend-status { font-size: 13px; color: #8b86ad; display: flex; align-items: center; gap: 5px; }
        .qh-online-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); }
        .qh-pill-btn { width: 74px; height: 32px; border: 0; border-radius: 999px; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #8d67ff, #7c4dff); color: #fff; cursor: pointer; box-shadow: 0 8px 20px rgba(124, 77, 255, 0.18); }
        .qh-pill-dot { width: 10px; height: 10px; border-radius: 50%; background: #d9ffe3; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
        .qh-subtle-note { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-bottom: 10px; border-radius: 14px; background: rgba(255, 246, 199, 0.55); color: #8a6500; font-size: 13px; font-weight: 700; }
        .qh-search-results { margin-top: 8px; padding: 18px; }
        .qh-search-results h3 { margin: 0 0 14px; color: #332d68; font-size: 16px; }
        .qh-search-user { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.65); border: 1px solid rgba(124, 77, 255, 0.08); margin-bottom: 10px; }
        .qh-search-user:last-child { margin-bottom: 0; }
        .qh-search-user-meta { flex: 1; min-width: 0; cursor: pointer; }
        .qh-search-user-meta:hover .qh-search-user-name { color: #7c4dff; }
        .qh-search-user-name { font-size: 14px; font-weight: 700; color: #2f2a60; margin-bottom: 2px; transition: color 0.2s ease; }
        .qh-search-user-id { font-size: 12px; color: #918aad; }
        .qh-add-btn, .qh-soft-disabled, .qh-request-btn { height: 34px; padding: 0 14px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        .qh-add-btn, .qh-request-btn { border: 0; background: linear-gradient(135deg, #8d67ff, #7c4dff); color: #fff; cursor: pointer; }
        .qh-soft-disabled { background: rgba(148, 163, 184, 0.14); color: #8d8aa6; }
        .qh-request-actions { display: flex; gap: 8px; margin-top: 10px; }
        .qh-request-btn.reject { background: rgba(255,255,255,0.8); color: #8d8aa6; border: 1px solid rgba(124, 77, 255, 0.08); }
        .qh-chart-holder { height: 230px; }
        .qh-recent-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-top: 1px solid rgba(124, 77, 255, 0.07); cursor: pointer; transition: background 0.2s ease; }
        .qh-recent-item:hover { background: rgba(255,255,255,0.4); }
        .qh-recent-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #eee2ff, #e8dbff); color: #7c4dff; flex-shrink: 0; }
        .qh-recent-meta { flex: 1; min-width: 0; }
        .qh-recent-title { color: #2f2a60; font-size: 14px; font-weight: 700; margin-bottom: 2px; text-transform: none; }
        .qh-recent-score { color: #ff8b38; font-size: 14px; font-weight: 800; }
        .qh-lessons { padding: 14px 20px 18px; border-top: 1px solid rgba(124, 77, 255, 0.07); }
        .qh-lessons-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #332d68; margin-bottom: 12px; }
        .qh-lesson-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.48); margin-bottom: 8px; }
        .qh-lesson-name { color: #2f2a60; font-size: 13px; font-weight: 800; letter-spacing: 0.01em; }
        .qh-lesson-sub { color: #9b95b8; font-size: 12px; margin-top: 2px; }
        .qh-view-link { color: #8a7fc5; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
        .qh-loading-box, .qh-empty-box { min-height: 160px; display: flex; align-items: center; justify-content: center; color: #938cb3; }
        .qh-streak-grid { display: grid; grid-template-columns: repeat(15, 1fr); gap: 2px; }
        .qh-streak-cell { aspect-ratio: 1; border-radius: 2px; transition: transform 0.1s ease; cursor: default; }
        .qh-streak-cell:hover { transform: scale(1.3); outline: 1px solid rgba(124,77,255,0.4); }
        .qh-streak-legend { display: flex; gap: 4px; margin-top: 10px; align-items: center; justify-content: flex-end; }
        .qh-streak-legend span { font-size: 10px; color: #9b95b8; }
        .qh-streak-legend-cell { width: 10px; height: 10px; border-radius: 2px; }
        .qh-accuracy-row { display: flex; align-items: center; gap: 10px; }
        .qh-accuracy-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .qh-accuracy-label { color: #2f2a60; font-weight: 700; font-size: 14px; }
        .qh-accuracy-value { font-weight: 800; margin-left: auto; font-size: 14px; }
        .qh-topic-section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        @media (max-width: 1100px) {
          .qh-stats-grid, .qh-main-grid, .qh-bottom-grid, .qh-analytics-grid { grid-template-columns: 1fr; }
        }
        .main-content.sidebar-collapsed .qh-page-shell { padding: 0; }
        .main-content.sidebar-collapsed .qh-main-grid,
        .main-content.sidebar-collapsed .qh-bottom-grid {
          grid-template-columns: 2fr 1fr;
          transition: grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: grid-template-columns;
        }
        .dashboard-contents {
          max-width: 1320px; width: 100%; margin: 0 auto; padding: 18px 22px 40px; box-sizing: border-box; overflow: visible;
          background: radial-gradient(circle at 15% 20%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 22%, transparent 45%), radial-gradient(circle at 85% 12%, rgba(255,255,255,0.85) 0%, transparent 30%), linear-gradient(180deg, #faf7ff 0%, #f3ecff 38%, #efe6ff 100%);
          min-height: 100vh; position: relative;
        }
        .dashboard-contents::before {
          content: ''; position: absolute; inset: auto 0 0 0; height: 220px;
          background: radial-gradient(circle at 10% 70%, rgba(255,255,255,0.95) 0 90px, transparent 91px), radial-gradient(circle at 24% 90%, rgba(255,255,255,0.8) 0 120px, transparent 121px), radial-gradient(circle at 42% 65%, rgba(255,255,255,0.95) 0 110px, transparent 111px), radial-gradient(circle at 58% 85%, rgba(255,255,255,0.85) 0 130px, transparent 131px), radial-gradient(circle at 74% 70%, rgba(255,255,255,0.95) 0 110px, transparent 111px), radial-gradient(circle at 91% 80%, rgba(255,255,255,0.9) 0 130px, transparent 131px);
          pointer-events: none; opacity: 0.75; z-index: 0;
        }
        @media (max-width: 760px) {
          .qh-page-shell { padding: 18px; }
          .qh-topbar { flex-direction: column; align-items: stretch; }
          .qh-search-wrap { width: 100%; }
          .qh-banner-inner { flex-direction: column; align-items: flex-start; }
          .qh-rocket-wrap { width: 96px; height: 96px; }
          .qh-streak-grid { grid-template-columns: repeat(10, 1fr); }
        }
      `}</style>

      <div className="dashboard-contents">
        <div className="qh-container">
          <div className="qh-topbar">
            <h1 className="qh-title">Learn Now!</h1>
            <div className="qh-search-wrap">
              <Search size={18} color="#9b95b8" />
              <input type="text" placeholder="Search users by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 0, padding: 0, display: 'flex', cursor: 'pointer' }}>
                  <X size={16} color="#9b95b8" />
                </button>
              ) : (
                <div className="qh-avatar-chip">{displayName?.[0]?.toUpperCase() || 'A'}</div>
              )}
            </div>
          </div>

          <div className="qh-banner">
            <div className="qh-banner-inner">
              <div>
                <h2>Welcome back, {displayName}! 👋</h2>
                <p>How's your learning today?</p>
              </div>
              <div className="qh-rocket-wrap"><Rocket size={56} /></div>
            </div>
          </div>

          {searchQuery.length >= 2 ? (
            <div className="qh-panel qh-search-results">
              <h3>Search Results for "{searchQuery}"</h3>
              {isSearching ? (
                <div className="qh-loading-box"><Loader className="spin" size={30} color="#7c4dff" /></div>
              ) : searchResults.length === 0 ? (
                <div className="qh-empty-box">No users found.</div>
              ) : (
                searchResults.map((u) => (
                  <div key={u.id} className="qh-search-user">
                    <div className="qh-search-user-avatar" onClick={() => navigate(`/profile/${u.id}`)}>
                      {u.profile_pic ? <img src={u.profile_pic} alt="" /> : <span>{u.username[0].toUpperCase()}</span>}
                    </div>
                    <div className="qh-search-user-meta" onClick={() => navigate(`/profile/${u.id}`)}>
                      <div className="qh-search-user-name">{u.username}</div>
                      <div className="qh-search-user-id">ID: {u.unique_id}</div>
                    </div>
                    <ChevronRight size={16} color="#b2a8da" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(`/profile/${u.id}`)} />
                    {renderFriendButton(u)}
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* --- STATS GRID --- */}
              <div className="qh-stats-grid">
                {statCards.map((item, index) => (
                  <div key={index} className="qh-stat-card" style={{ background: item.softBg }}>
                    <div className="qh-stat-icon" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
                    <div className="qh-stat-meta">
                      <div className="qh-stat-value">{item.value}</div>
                      <div className="qh-stat-label">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- QUIZ COMPLETION (MOVED HERE) --- */}
              <div className="qh-analytics-grid-full">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><FileQuestion size={16} /> Quiz Completion</h3>
                  </div>
                  <div className="qh-panel-body">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Completed', value: completionData.completed, color: '#22c55e' },
                        { label: 'In Progress', value: completionData.in_progress, color: '#fbbf24' },
                        { label: 'Abandoned', value: completionData.abandoned, color: '#f87171' },
                      ].map((item, i) => (
                        <div key={i} style={{ flex: 1, padding: '16px', borderRadius: 16, background: `${item.color}10`, border: `1px solid ${item.color}20`, textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#7d76a7', marginTop: 4 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(124,77,255,0.1)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ height: '100%', width: `${(completionData.completed / (completionData.completed + completionData.in_progress + completionData.abandoned || 1)) * 100}%`, background: '#22c55e', borderRadius: '99px 0 0 99px' }} />
                      <div style={{ height: '100%', width: `${(completionData.in_progress / (completionData.completed + completionData.in_progress + completionData.abandoned || 1)) * 100}%`, background: '#fbbf24' }} />
                      <div style={{ height: '100%', width: `${(completionData.abandoned / (completionData.completed + completionData.in_progress + completionData.abandoned || 1)) * 100}%`, background: '#f87171', borderRadius: '0 99px 99px 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: '#9b95b8', fontWeight: 600 }}>
                        {Math.round((completionData.completed / (completionData.completed + completionData.in_progress + completionData.abandoned || 1)) * 100)}% completion rate
                      </span>
                      <span style={{ fontSize: 11, color: '#9b95b8', fontWeight: 600 }}>
                        {completionData.completed + completionData.in_progress + completionData.abandoned} quizzes total
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- MAIN GRID --- */}
              <div className="qh-main-grid">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><TrendingUp size={16} /> Learning Gain</h3>
                    <span className="qh-view-link">{analytics?.xp_earned || 0} pts</span>
                  </div>
                  <div className="qh-panel-body">
                    <div className="qh-chart-holder">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.progress_data}>
                          <defs>
                            <linearGradient id="xpLineFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9b6bff" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#9b6bff" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="#ede7fb" vertical={false} />
                          <XAxis dataKey="name" stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="score" stroke="#9b6bff" strokeWidth={3} fill="url(#xpLineFill)" dot={{ fill: '#8b5cf6', r: 4, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#7c4dff', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Users size={16} /> Friends Online</h3>
                  </div>
                  <div className="qh-panel-body">
                    {friendRequests.length > 0 && (
                      <div className="qh-subtle-note">
                        <Bell size={14} /> {friendRequests.length} pending friend request{friendRequests.length > 1 ? 's' : ''}
                      </div>
                    )}
                    {friendRequests.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        {friendRequests.map((req) => (
                          <div key={req.id} style={{ padding: '12px', borderRadius: 16, background: 'rgba(255,255,255,0.52)', marginBottom: 10 }}>
                            <div style={{ color: '#2f2a60', fontSize: 14, fontWeight: 700 }}>{req.from_user?.username || 'New request'}</div>
                            <div className="qh-request-actions">
                              <button className="qh-request-btn" onClick={() => handleAcceptRequest(req.id)}>Accept</button>
                              <button className="qh-request-btn reject" onClick={() => handleRejectRequest(req.id)}>Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="qh-friends-list">
                      {friends.length === 0 ? (
                        <div className="qh-empty-box" style={{ minHeight: 120 }}>No friends yet.</div>
                      ) : (
                        friends.slice(0, 5).map((friend) => (
                          <div key={friend.id} className="qh-friend-item">
                            <div className="qh-friend-avatar" onClick={() => navigate(`/profile/${friend.id}`)}>
                              {friend.profile_pic ? <img src={friend.profile_pic} alt="" /> : <span>{friend.username[0].toUpperCase()}</span>}
                            </div>
                            <div className="qh-friend-main" onClick={() => navigate(`/profile/${friend.id}`)}>
                              <div className="qh-friend-name">{friend.username}</div>
                              <div className="qh-friend-status">
                                {friend.is_online ? (
                                  <>
                                    <span className="qh-online-dot"></span>
                                    Online now
                                  </>
                                ) : (
                                  formatLastSeen(friend.last_seen_at, friend.is_online)
                                )}
                              </div>
                            </div>
                            <button className="qh-pill-btn" onClick={() => startChat(friend.id)}>
                              <span className="qh-pill-dot" />
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- BOTTOM GRID --- */}
              <div className="qh-bottom-grid">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Award size={16} /> Subject Focus</h3>
                  </div>
                  <div className="qh-panel-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ width: 280, height: 220, margin: '0 auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.subject_data} cx="50%" cy="50%" innerRadius={42} outerRadius={80} paddingAngle={2} labelLine={false} label={renderCustomizedLabel} dataKey="value">
                            {stats.subject_data.map((entry, index) => (
                              <Cell key={index} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 180 }}>
                      {stats.subject_data.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 999, background: item.color, display: 'inline-block' }} />
                          <span style={{ color: '#2f2a60', fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><BookOpen size={16} /> Recent Quizzes</h3>
                    <span className="qh-view-link" onClick={() => navigate('/library')}>View All <ChevronRight size={14} /></span>
                  </div>
                  {(stats.recent_quizzes || []).map((quiz, i) => (
                    <div key={i} className="qh-recent-item" onClick={() => navigate('/library')}>
                      <div className="qh-recent-icon"><FileQuestion size={18} /></div>
                      <div className="qh-recent-meta"><div className="qh-recent-title">{quiz.title}</div></div>
                      <div className="qh-recent-score">{quiz.score}%</div>
                      <ChevronRight size={16} color="#b2a8da" />
                    </div>
                  ))}
                  <div className="qh-lessons">
                    <div className="qh-lessons-title"><CalendarDays size={16} /> My Recent Lessons</div>
                    {stats.recent_lessons && stats.recent_lessons.length > 0 ? (
                      stats.recent_lessons.map((lesson, i) => (
                        <div key={i} className="qh-lesson-item" onClick={() => navigate('/library')}>
                          <div>
                            <div className="qh-lesson-name">{lesson.title}</div>
                            <div className="qh-lesson-sub">{lesson.subject ? `${lesson.subject} • ` : ''}{lesson.date}</div>
                          </div>
                          <ChevronRight size={16} color="#b2a8da" />
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#9b95b8', fontSize: 13, padding: '10px 0' }}>No lessons uploaded yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== ANALYTICS SECTIONS ===== */}

              <div className="qh-analytics-grid-full">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Flame size={16} /> Study Streak — Last 90 Days</h3>
                    <span style={{ color: '#fb923c', fontWeight: 800, fontSize: 14 }}>🔥 {analytics?.study_streak || stats.study_streak || 0} day streak</span>
                  </div>
                  <div className="qh-panel-body" style={{ paddingBottom: '12px' }}>
                    {streakData.length > 0 ? (
                      <>
                        <div className="qh-streak-grid">
                          {streakData.map((d, i) => {
                            const intensity = d.count === 0 ? 0 : d.count <= 1 ? 1 : d.count <= 3 ? 2 : 3;
                            const colors = ['rgba(124,77,255,0.08)', 'rgba(124,77,255,0.25)', 'rgba(124,77,255,0.5)', 'rgba(124,77,255,0.85)'];
                            return <div key={i} title={`${d.date}: ${d.count} sessions`} className="qh-streak-cell" style={{ background: colors[intensity] }} />;
                          })}
                        </div>
                        <div className="qh-streak-legend">
                          <span>Less</span>
                          {['rgba(124,77,255,0.08)', 'rgba(124,77,255,0.25)', 'rgba(124,77,255,0.5)', 'rgba(124,77,255,0.85)'].map((c, i) => (
                            <div key={i} className="qh-streak-legend-cell" style={{ background: c }} />
                          ))}
                          <span>More</span>
                        </div>
                      </>
                    ) : (
                      <div className="qh-empty-box" style={{ minHeight: 80 }}>No streak data yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="qh-analytics-grid">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Target size={16} /> Topic Insights</h3>
                  </div>
                  <div className="qh-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="qh-topic-section-label" style={{ color: '#f87171' }}><AlertTriangle size={12} /> Needs Improvement</div>
                    {weakTopics.length > 0 ? weakTopics.map((t, i) => <TopicCard key={i} topic={t} variant="weak" />) : (
                      <div style={{ color: '#9b95b8', fontSize: 13, padding: '10px 0' }}>Take more quizzes to generate insights!</div>
                    )}
                    <div className="qh-topic-section-label" style={{ color: '#22c55e', marginTop: 8 }}><CheckCircle2 size={12} /> Strong Areas</div>
                    {strongTopics.length > 0 ? strongTopics.map((t, i) => <TopicCard key={i} topic={t} variant="strong" />) : (
                      <div style={{ color: '#9b95b8', fontSize: 13, padding: '10px 0' }}>Take more quizzes to generate insights!</div>
                    )}
                  </div>
                </div>

                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Award size={16} /> Accuracy Breakdown</h3>
                  </div>
                  <div className="qh-panel-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ width: 200, height: 200, margin: '0 auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={accuracyData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                            {accuracyData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minWidth: 160 }}>
                      {accuracyData.map((item, i) => (
                        <div key={i} className="qh-accuracy-row">
                          <div className="qh-accuracy-dot" style={{ background: item.color }} />
                          <span className="qh-accuracy-label">{item.name}</span>
                          <span className="qh-accuracy-value" style={{ color: item.color }}>
                            {accuracyData.reduce((a, b) => a + b.value, 0) > 0 
                              ? `${Math.round((item.value / accuracyData.reduce((a, b) => a + b.value, 0)) * 100)}%` 
                              : '0%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="qh-analytics-grid">
                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><TrendingUp size={16} /> Weekly Activity</h3>
                    <span style={{ color: '#7d76a7', fontSize: 12, fontWeight: 600 }}>This Week vs Last Week</span>
                  </div>
                  <div className="qh-panel-body">
                    <div className="qh-chart-holder">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyComparison} barGap={4}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#ede7fb" vertical={false} />
                          <XAxis dataKey="day" stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="lastWeek" fill="rgba(124,77,255,0.2)" radius={[6, 6, 0, 0]} name="Last Week" />
                          <Bar dataKey="thisWeek" fill="#9b6bff" radius={[6, 6, 0, 0]} name="This Week" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="qh-panel">
                  <div className="qh-panel-header">
                    <h3 className="qh-panel-title"><Target size={16} /> Score Distribution</h3>
                  </div>
                  <div className="qh-panel-body">
                    <div className="qh-chart-holder">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#ede7fb" vertical={false} />
                          <XAxis dataKey="range" stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#9b95b8" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="count" fill="#9b6bff" radius={[8, 8, 0, 0]} name="Quizzes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;