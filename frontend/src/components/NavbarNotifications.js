import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, MessageSquare, UserPlus, UserCheck, ChevronRight } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import './NavbarNotifications.css';

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NavbarNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      // Reset state when closed so it fetches fresh next time
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Fetch unread count periodically when dropdown is closed (optional but recommended)
  useEffect(() => {
    let interval;
    if (!isOpen) {
      fetchUnreadCount(); // Initial fetch
      interval = setInterval(fetchUnreadCount, 15000); // Check every 15s
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const [friendRes, chatRes] = await Promise.allSettled([
        API.get('/notifications/'),
        API.get('/chat/notifications/'),
      ]);

      const friendNotifs = friendRes.status === 'fulfilled' ? friendRes.value.data : [];
      const chatNotifs = chatRes.status === 'fulfilled' ? chatRes.value.data : [];

      const unreadFriends = friendNotifs.filter(n => n.status === 'pending').length;
      const unreadChats = chatNotifs.length;
      
      setUnreadCount(unreadFriends + unreadChats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [friendRes, chatRes] = await Promise.allSettled([
        API.get('/notifications/'),
        API.get('/chat/notifications/'),
      ]);

      const friendNotifs = friendRes.status === 'fulfilled' ? friendRes.value.data : [];
      const chatNotifs = chatRes.status === 'fulfilled' ? chatRes.value.data : [];

      const all = [
        ...friendNotifs.map(n => ({ ...n, category: 'friends', read: n.status !== 'pending' })),
        ...chatNotifs.map(n => ({ ...n, category: 'messages', read: false }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(all.slice(0, 8)); // Show top 8
      setUnreadCount(all.filter(n => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'friend_request': return <UserPlus size={14} />;
      case 'friend_accepted': return <UserCheck size={14} />;
      case 'chat_message': return <MessageSquare size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const handleNotifClick = (notif) => {
    setIsOpen(false);
    if (notif.type === 'chat_message' && notif.room_id) {
      navigate(`/chatrooms/${notif.room_id}`);
    } else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
      navigate('/notifications');
    }
  };

  return (
    <div className="navbar-notif-wrapper" ref={dropdownRef}>
      <button 
        className="navbar-notif-btn" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="navbar-notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="navbar-notif-dropdown">
          <div className="navbar-notif-dropdown-header">
            <h4>Notifications</h4>
            <button onClick={(e) => { e.stopPropagation(); navigate('/notifications'); setIsOpen(false); }}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="navbar-notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="navbar-notif-empty">
                <Bell size={24} />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`navbar-notif-item ${!notif.read ? 'navbar-notif-unread' : ''}`}
                  onClick={() => handleNotifClick(notif)}
                >
                  <div className={`navbar-notif-icon ${notif.type}`}>
                    {getNotifIcon(notif.type)}
                  </div>
                  
                  <div className="navbar-notif-content">
                    <p>
                      <strong>
                        {notif.sender_name || notif.friend_name || 'Someone'}
                      </strong>
                      {notif.type === 'chat_message' 
                        ? ` in ${notif.room_name || 'chat'}`
                        : notif.message?.replace(notif.sender_name || notif.friend_name || '', '').trim()
                      }
                    </p>
                    <span className="navbar-notif-time">
                      {getRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  {!notif.read && <div className="navbar-notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarNotifications;