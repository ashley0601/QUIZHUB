import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Check,
  XCircle,
  CheckCircle,
  XOctagon,
  MessageSquare,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [friendNotifs, setFriendNotifs] = useState([]);
  const [chatNotifs, setChatNotifs] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url}`;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return user?.role === 'teacher' ? 'Teacher Overview' : 'Dashboard';
    if (path.startsWith('/library')) return 'Library';
    if (path.startsWith('/quiz-generator') || path.startsWith('/quiz/take')) return 'Quiz Generator';
    if (path.startsWith('/chatrooms')) return 'Chatrooms';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/notifications')) return 'Notifications';
    return 'LearnHub';
  };

  // Merge both sources, newest first
  const allNotifs = [
    ...friendNotifs.map(n => ({ ...n, _source: 'friend' })),
    ...chatNotifs.map(n => ({ ...n, _source: 'chat' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const pendingFriendCount = friendNotifs.filter(
    (n) => n.type === 'friend_request' && n.status === 'pending'
  ).length;

  const unreadChatCount = chatNotifs.reduce((sum, n) => sum + (n.unread_count || 1), 0);
  const totalCount = pendingFriendCount + chatNotifs.length;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchAll = () => {
      if (cancelled) return;

      API.get('/notifications/')
        .then((res) => {
          if (!cancelled) setFriendNotifs(res.data);
        })
        .catch(() => {});

      API.get('/chat/notifications/')
        .then((res) => {
          if (!cancelled && Array.isArray(res.data)) {
            setChatNotifs(res.data);
          }
        })
        .catch(() => {});
    };

    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    API.post('/logout/')
      .then(() => {
        logout();
        navigate('/login');
      })
      .catch((err) => console.error(err));
  };

  const handleAccept = async (reqId) => {
    try {
      await API.post(`/friends/request/${reqId}/handle/`, { action: 'accept' });
      setFriendNotifs((prev) =>
        prev.map((n) =>
          n.id === reqId ? { ...n, status: 'accepted', message: 'You are now friends!' } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (reqId) => {
    try {
      await API.post(`/friends/request/${reqId}/handle/`, { action: 'reject' });
      setFriendNotifs((prev) =>
        prev.map((n) =>
          n.id === reqId ? { ...n, status: 'rejected', message: 'Request rejected.' } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // --- NEW: Function to mark chat messages as read & remove from UI instantly ---
  const handleChatNotifClick = async (notif) => {
    if (!notif.room_id) return;

    // Optimistically remove from UI instantly for smooth feel
    setChatNotifs((prev) => prev.filter((n) => n.room_id !== notif.room_id));
    setNotifOpen(false);
    navigate(`/chatrooms/${notif.room_id}`);

    // Tell backend to mark messages as read permanently
    try {
      await API.post('/chat/notifications/');
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const getNotifIcon = (notif) => {
    switch (notif.type) {
      case 'friend_request': return <UserPlus size={14} />;
      case 'friend_accepted': return <UserCheck size={14} />;
      case 'chat_message': return <MessageSquare size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const getNotifIconClass = (notif) => {
    switch (notif.type) {
      case 'friend_request': return 'notif-type-icon friend-req-icon';
      case 'friend_accepted': return 'notif-type-icon friend-acc-icon';
      case 'chat_message': return 'notif-type-icon chat-msg-icon';
      default: return 'notif-type-icon default-icon';
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  };

  return (
    <header className="navbar">
      <h3>{getPageTitle()}</h3>

      <div className="navbar-right">
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="notification-icon"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell size={20} />
            {totalCount > 0 && <span className="notif-badge">{totalCount}</span>}
          </button>

          {notifOpen && (
            <div className="dropdown-menu notification-dropdown">
              <div className="dropdown-header">
                <strong>Notifications</strong>
                {totalCount > 0 && (
                  <span className="dropdown-header-count">{totalCount}</span>
                )}
              </div>

              <div className="dropdown-list">
                {allNotifs.length === 0 ? (
                  <div className="dropdown-empty">No notifications yet</div>
                ) : (
                  allNotifs.slice(0, 6).map((notif) => {
                    // Determine if this specific notification is unread
                    const isUnread = notif._source === 'chat' || (notif._source === 'friend' && notif.status === 'pending');

                    return (
                      <div
                        key={notif.id}
                        className={`notification-item ${isUnread ? 'notif-unread' : ''} ${notif._source === 'chat' ? 'notification-item-chat' : ''}`}
                        onClick={() => {
                          if (notif._source === 'chat') {
                            handleChatNotifClick(notif);
                          }
                        }}
                      >
                        <div className="notif-avatar-stack">
                          <div className="notif-avatar">
                            {(notif.sender_pic || notif.friend_pic) ? (
                              <img src={notif.sender_pic || notif.friend_pic} alt="" />
                            ) : (
                              <div className="avatar-placeholder-sm">
                                <User size={14} />
                              </div>
                            )}
                          </div>
                          <div className={getNotifIconClass(notif)}>
                            {getNotifIcon(notif)}
                          </div>
                        </div>

                        <div className="notif-content">
                          {notif.type === 'chat_message' ? (
                            <>
                              <p className="notif-text">
                                <strong>{notif.sender_name}</strong>
                                <span className="notif-room-label">
                                  in {notif.room_name}
                                </span>
                              </p>
                              <p className="notif-text notif-text-preview">
                                {notif.message}
                              </p>
                              <div className="notif-time-row">
                                <span className="notif-time">
                                  {getRelativeTime(notif.created_at)}
                                </span>
                                {notif.unread_count > 1 && (
                                  <span className="notif-unread-badge">
                                    {notif.unread_count}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="notif-text">{notif.message}</p>
                              <span className="notif-time">
                                {getRelativeTime(notif.created_at)}
                              </span>

                              {notif.type === 'friend_request' && notif.status === 'pending' && (
                                <div className="notif-actions">
                                  <button
                                    type="button"
                                    className="btn-mini-accept"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAccept(notif.id);
                                    }}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-mini-reject"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(notif.id);
                                    }}
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              )}

                              {notif.status === 'accepted' && (
                                <div className="notif-status accepted">
                                  <CheckCircle size={12} /> Accepted
                                </div>
                              )}

                              {notif.status === 'rejected' && (
                                <div className="notif-status rejected">
                                  <XOctagon size={12} /> Rejected
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Highlight dot for unread */}
                        {isUnread && <div className="notif-unread-dot" />}
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="dropdown-view-all"
                onClick={() => {
                  setNotifOpen(false);
                  navigate('/notifications');
                }}
              >
                View all notifications
                <ChevronRight size={14} />
              </div>
            </div>
          )}
        </div>

        <div className="profile-menu" ref={dropdownRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <div className="avatar">
              {user?.profile_picture ? (
                <img src={getImageUrl(user.profile_picture)} alt="profile" />
              ) : (
                <User size={18} />
              )}
            </div>

            <span className="username">{user?.username}</span>
            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate('/profile');
                  setDropdownOpen(false);
                }}
              >
                <User size={16} /> My Profile
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;