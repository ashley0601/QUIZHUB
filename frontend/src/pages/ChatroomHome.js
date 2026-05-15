import React, { useState, useEffect, useMemo } from 'react';
import API from '../api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  MessageSquare,
  User,
  LogIn,
  Users,
  Check,
  X,
  Search,
  Hash,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import './ChatroomHome.css';

const ChatroomHome = () => {
  const navigate = useNavigate();

  const [chatrooms, setChatrooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('group');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [searchChatQuery, setSearchChatQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchChatrooms();
    fetchFriends();
  }, []);

  // ── Detect sidebar collapse state ──
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

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url}`;
  };

  const fetchChatrooms = async () => {
    try {
      const res = await API.get('/chat/chatrooms/');
      setChatrooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get('/friends/');
      setFriends(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) return alert('Group name required');

    try {
      const payload = {
        name,
        is_direct: false,
        members: selectedMembers,
      };

      await API.post('/chat/chatrooms/', payload);
      setShowModal(false);
      setName('');
      setSelectedMembers([]);
      setSearchTerm('');
      fetchChatrooms();
    } catch (err) {
      console.error(err);
      alert('Error creating group');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;

    try {
      const res = await API.post('/chat/join/', { invite_code: joinCode });
      alert(res.data.message || 'Joined successfully');
      setShowModal(false);
      setJoinCode('');
      fetchChatrooms();
      if (res.data.room_id) {
        navigate(`/chatrooms/${res.data.room_id}`);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Invalid Code');
    }
  };

  const handleFriendClick = async (friendId) => {
    try {
      const res = await API.post('/chat/chatrooms/', {
        is_direct: true,
        user_id: friendId,
      });
      navigate(`/chatrooms/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Could not start chat');
    }
  };

  const toggleMember = (friendId) => {
    if (selectedMembers.includes(friendId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== friendId));
    } else {
      setSelectedMembers([...selectedMembers, friendId]);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── SORTED: Chatrooms ordered by most recent message first ──
  const filteredChatrooms = useMemo(() => {
    const filtered = chatrooms.filter((room) => {
      if (activeFilter === 'group' && room.is_direct) return false;
      if (activeFilter === 'direct' && !room.is_direct) return false;
      if (searchChatQuery) {
        return room.name.toLowerCase().includes(searchChatQuery.toLowerCase());
      }
      return true;
    });

    // Sort by last_time descending (most recent first)
    // Chatrooms without messages go to the bottom
    return [...filtered].sort((a, b) => {
      const timeA = a.last_time ? new Date(a.last_time).getTime() : 0;
      const timeB = b.last_time ? new Date(b.last_time).getTime() : 0;
      
      // Both have times - sort descending
      if (timeA > 0 && timeB > 0) {
        return timeB - timeA;
      }
      
      // Only A has time - A comes first
      if (timeA > 0) {
        return -1;
      }
      
      // Only B has time - B comes first
      if (timeB > 0) {
        return 1;
      }
      
      // Neither has time - maintain original order
      return 0;
    });
  }, [chatrooms, activeFilter, searchChatQuery]);

  // ── Format time for display ──
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Today - show time only
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    // This week - show day name
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // ── Check if message is very recent (for visual indicator) ──
  const isRecent = (dateStr) => {
    if (!dateStr) return false;
    const diffMs = new Date() - new Date(dateStr);
    return diffMs < 300000; // 5 minutes
  };

  return (
    <div className="chat-home-page">
      <Sidebar />

      <div className={`chat-home-m ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar />

        <div className="chat-home-contents">
          <section className="chat-home-hero">
            <div className="chat-home-hero-copy">
              <div className="chat-home-stars">✦ ✦ ✦</div>
              <p className="chat-home-kicker">Stay connected with your friends and groups</p>
              <h1>Chatrooms</h1>

              <div className="chat-home-stats">
                <div className="chat-home-stat">
                  <div className="stat-icon purple">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <strong>{chatrooms.length}</strong>
                    <span>Total Chats</span>
                  </div>
                </div>

                <div className="chat-home-stat">
                  <div className="stat-icon blue">
                    <Users size={18} />
                  </div>
                  <div>
                    <strong>{friends.length}</strong>
                    <span>Contacts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-home-tip">
              <div className="tip-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="tip-title">Quick Connect</div>
                <div className="tip-sub">Start a chat or join with a code</div>
              </div>
            </div>
          </section>

          <section className="chat-home-grid">
            <div className="chat-list-panel glass-panel">
              <div className="chat-panel-header">
                <h2>Chats</h2>

                <div className="header-actions">
                  <button
                    className="chat-btn secondary"
                    onClick={() => {
                      setModalType('join');
                      setShowModal(true);
                    }}
                  >
                    <LogIn size={17} />
                    Join
                  </button>

                  <button
                    className="chat-btn primary"
                    onClick={() => {
                      setModalType('group');
                      setShowModal(true);
                    }}
                  >
                    <PlusCircle size={17} />
                    Group
                  </button>
                </div>
              </div>

              <div className="chat-controls-bar">
                <div className="search-input-modern">
                  <Search size={18} />
                  <input
                    placeholder="Search in chats..."
                    value={searchChatQuery}
                    onChange={(e) => setSearchChatQuery(e.target.value)}
                  />
                </div>

                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </button>

                  <button
                    className={`filter-tab ${activeFilter === 'group' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('group')}
                  >
                    <Users size={14} />
                    Groups
                  </button>

                  <button
                    className={`filter-tab ${activeFilter === 'direct' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('direct')}
                  >
                    <User size={14} />
                    Friends
                  </button>
                </div>
              </div>

              <div className="chat-scroll-list">
                {filteredChatrooms.length === 0 ? (
                  <div className="empty-chat-list">
                    <div className="empty-chat-icon">
                      <MessageSquare size={28} />
                    </div>
                    <h3>No chats found</h3>
                    <p>Start a new conversation or join a room</p>
                  </div>
                ) : (
                  filteredChatrooms.map((room) => (
                    <div
                      key={room.id}
                      className={`chat-preview-item ${isRecent(room.last_time) ? 'recent-chat' : ''}`}
                      onClick={() => navigate(`/chatrooms/${room.id}`)}
                    >
                      <div className="chat-preview-avatar-wrapper">
                        <div
                          className="chat-preview-avatar"
                          style={{
                            background: room.photo
                              ? `url(${getImageUrl(room.photo)})`
                              : 'linear-gradient(135deg, #5b3cc4, #7c5cff)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {!room.photo && (room.name ? room.name.charAt(0).toUpperCase() : 'C')}
                        </div>
                        {/* Online indicator for direct chats */}
                        {room.is_direct && room.is_online && (
                          <span className="chat-preview-online-dot"></span>
                        )}
                      </div>

                      <div className="chat-preview-content">
                        <div className="preview-top-row">
                          <strong className="preview-name">
                            {room.name}
                            {!room.is_direct && <span className="room-badge">Group</span>}
                          </strong>
                          <span className={`preview-time ${isRecent(room.last_time) ? 'recent-time' : ''}`}>
                            {formatTime(room.last_time)}
                          </span>
                        </div>

                        <p className="preview-message">
                          {room.last_message || 'Tap to start chatting'}
                        </p>
                      </div>

                      <ChevronRight size={16} className="preview-arrow" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="contacts-panel glass-panel">
              <div className="contacts-header">
                <h3>
                  <Users size={20} />
                  Contacts
                </h3>
              </div>

              <div className="contacts-scroll-list">
                {friends.length === 0 ? (
                  <div className="empty-chat-list small">
                    <p>No contacts yet.</p>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div
                      key={f.id}
                      className="contact-item-row"
                      onClick={() => handleFriendClick(f.id)}
                    >
                      <div className="contact-info">
                        <div className="contact-avatar-wrapper">
                          {f.profile_pic ? (
                            <img
                              src={getImageUrl(f.profile_pic)}
                              alt="Pic"
                              className="contact-avatar-img"
                            />
                          ) : (
                            <div className="contact-avatar-placeholder">
                              {f.username.charAt(0)}
                            </div>
                          )}
                          {f.is_online && <span className="online-status-dot"></span>}
                        </div>

                        <div className="contact-details">
                          <strong>{f.username}</strong>
                          <small>{f.is_online ? 'Active now' : 'Offline'}</small>
                        </div>
                      </div>

                      <button className="msg-icon-btn">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'group' ? <Users size={22} /> : <Hash size={22} />}
                {modalType === 'group' ? 'Create Group' : 'Join Room'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {modalType === 'join' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Invite Code</label>
                    <input
                      className="form-input"
                      placeholder="Paste code here..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                  </div>

                  <div className="join-preview-box">
                    <label>
                      <Lock size={12} /> Shared Code
                    </label>
                    <div className="join-preview-code">
                      {joinCode || 'ABCDEFGH'}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'group' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Group Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g., Study Group"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Add Members ({selectedMembers.length} selected)
                    </label>

                    <div className="member-search-box">
                      <Search size={16} />
                      <input
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="member-selection-list">
                      {filteredFriends.length === 0 ? (
                        <div className="member-empty">No friends available.</div>
                      ) : (
                        filteredFriends.map((f) => (
                          <div
                            key={f.id}
                            className={`member-select-item ${
                              selectedMembers.includes(f.id) ? 'selected' : ''
                            }`}
                            onClick={() => toggleMember(f.id)}
                          >
                            <div className="member-info">
                              {f.profile_pic ? (
                                <img
                                  src={getImageUrl(f.profile_pic)}
                                  className="avatar"
                                  alt=""
                                />
                              ) : (
                                <div className="avatar">{f.username.charAt(0)}</div>
                              )}
                              <span>{f.username}</span>
                            </div>

                            <div className="custom-checkbox">
                              {selectedMembers.includes(f.id) && <Check size={14} />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="chat-btn secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>

              <button
                className="chat-btn primary"
                onClick={modalType === 'group' ? handleCreateGroup : handleJoin}
                disabled={modalType === 'group' && !name.trim()}
              >
                {modalType === 'group' ? 'Create Group' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatroomHome;