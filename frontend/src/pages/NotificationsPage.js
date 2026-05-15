import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
  UserPlus,
  UserCheck,
  MessageSquare,
  Bell,
  BellOff,
  Calendar,
  Users,
  MessageCircle,
  Clock,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Inbox,
  Search,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import './NotificationsPage.css';

const TABS = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'friends', label: 'Friends', icon: Users },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
];

const DATE_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

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
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const matchesDateFilter = (dateStr, filter) => {
  if (!dateStr || filter === 'all') return true;
  const now = new Date();
  const date = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((startOfToday - date) / (1000 * 60 * 60 * 24));
  if (filter === 'today') return diffDays === 0;
  if (filter === 'week') return diffDays >= 0 && diffDays < 7;
  if (filter === 'month') return diffDays >= 0 && diffDays < 30;
  return true;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [friendNotifs, setFriendNotifs] = useState([]);
  const [chatNotifs, setChatNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const dateDropRef = useRef(null);

  const allNotifications = [
    ...friendNotifs.map((n) => ({
      ...n,
      category: 'friends',
      read: n.status !== 'pending',
    })),
    ...chatNotifs.map((n) => ({
      ...n,
      category: 'messages',
      read: false,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredNotifications = allNotifications.filter((n) => {
    if (activeTab !== 'all' && n.category !== activeTab) return false;
    if (!matchesDateFilter(n.created_at, dateFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = (n.message || '').toLowerCase();
      const sender = (n.sender_name || n.friend_name || '').toLowerCase();
      const room = (n.room_name || '').toLowerCase();
      return text.includes(q) || sender.includes(q) || room.includes(q);
    }
    return true;
  });

  const pendingCount = friendNotifs.filter(
    (n) => n.type === 'friend_request' && n.status === 'pending'
  ).length;
  const acceptedCount = friendNotifs.filter(
    (n) => n.type === 'friend_accepted'
  ).length;
  const unreadChatCount = chatNotifs.length;
  const unreadCount = friendNotifs.filter((n) => n.status === 'pending').length + unreadChatCount;
  const totalCount = allNotifications.length;

  const groupedNotifications = (() => {
    const groups = { today: [], yesterday: [], week: [], older: [] };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    filteredNotifications.forEach((n) => {
      if (!n.created_at) { groups.older.push(n); return; }
      const d = new Date(n.created_at);
      if (d >= startOfToday) groups.today.push(n);
      else if (d >= startOfYesterday) groups.yesterday.push(n);
      else if (d >= startOfWeek) groups.week.push(n);
      else groups.older.push(n);
    });
    return groups;
  })();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [friendRes, chatRes] = await Promise.allSettled([
        API.get('/notifications/'),
        API.get('/chat/notifications/'),
      ]);

      if (friendRes.status === 'fulfilled') {
        setFriendNotifs(Array.isArray(friendRes.value.data) ? friendRes.value.data : []);
      }
      if (chatRes.status === 'fulfilled' && Array.isArray(chatRes.value.data)) {
        setChatNotifs(chatRes.value.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setFriendNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setChatNotifs([]);
  };

  const handleAccept = async (reqId) => {
    setActionLoading(reqId);
    try {
      await API.post(`/friends/request/${reqId}/handle/`, { action: 'accept' });
      setFriendNotifs((prev) =>
        prev.map((n) =>
          n.id === reqId ? { ...n, status: 'accepted', message: 'You are now friends!' } : n
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId) => {
    setActionLoading(reqId);
    try {
      await API.post(`/friends/request/${reqId}/handle/`, { action: 'reject' });
      setFriendNotifs((prev) =>
        prev.map((n) =>
          n.id === reqId ? { ...n, status: 'rejected', message: 'Request declined.' } : n
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getNotifIcon = (notif) => {
    switch (notif.type) {
      case 'friend_request': return <UserPlus size={18} />;
      case 'friend_accepted': return <UserCheck size={18} />;
      case 'chat_message': return <MessageSquare size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getIconBg = (notif) => {
    switch (notif.type) {
      case 'friend_request': return 'icon-friend-request';
      case 'friend_accepted': return 'icon-friend-accepted';
      case 'chat_message': return 'icon-chat';
      default: return 'icon-default';
    }
  };

  const renderNotifCard = (notif) => {
    const isPending = notif.type === 'friend_request' && notif.status === 'pending';
    const pic = notif.sender_pic || notif.friend_pic;
    const senderName = notif.sender_name || notif.friend_name || 'Someone';
    const isClickable = notif.type === 'chat_message' && notif.room_id;

    return (
      <div
        key={notif.id}
        className={`notif-card ${isPending ? 'notif-actionable' : ''} ${
          !notif.read ? 'notif-unread' : ''
        } ${isClickable ? 'notif-clickable' : ''}`}
        onClick={() => isClickable && navigate(`/chatrooms/${notif.room_id}`)}
      >
        <div className="notif-card-left">
          <div className={`notif-icon-wrapper ${getIconBg(notif)}`}>
            {getNotifIcon(notif)}
          </div>
          <div className="notif-avatar-wrapper">
            {pic ? (
              <img src={pic} alt={senderName} className="notif-avatar-img" />
            ) : (
              <div className="notif-avatar-placeholder">
                {notif.type === 'chat_message' ? (
                  <MessageSquare size={14} />
                ) : (
                  <UserPlus size={14} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="notif-card-body">
          {notif.type === 'chat_message' ? (
            <>
              <p className="notif-message">
                <span className="notif-sender-name">{senderName}</span>
                <span className="notif-in-label"> in {notif.room_name || 'chat'}</span>
              </p>
              <p className="notif-message-preview">{notif.message}</p>
              <div className="notif-meta-row">
                <div className="notif-meta">
                  <Clock size={12} />
                  <span>{getRelativeTime(notif.created_at)}</span>
                </div>
                {notif.unread_count > 1 && (
                  <span className="notif-count-badge">{notif.unread_count} new</span>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="notif-message">
                <span className="notif-sender-name">{senderName}</span>{' '}
                {notif.message?.replace(senderName, '').trim() || 'sent you a notification'}
              </p>
              <div className="notif-meta">
                <Clock size={12} />
                <span>{getRelativeTime(notif.created_at)}</span>
              </div>

              {isPending && (
                <div className="notif-actions-row">
                  <button
                    className="btn-accept"
                    onClick={(e) => { e.stopPropagation(); handleAccept(notif.id); }}
                    disabled={actionLoading === notif.id}
                  >
                    {actionLoading === notif.id ? (
                      <span className="btn-spinner-sm" />
                    ) : (
                      <><Check size={14} /> Accept</>
                    )}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={(e) => { e.stopPropagation(); handleReject(notif.id); }}
                    disabled={actionLoading === notif.id}
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              )}

              {notif.status === 'accepted' && notif.type === 'friend_request' && (
                <div className="notif-status-badge accepted">
                  <UserCheck size={12} /> Accepted
                </div>
              )}

              {notif.status === 'rejected' && (
                <div className="notif-status-badge rejected">
                  <X size={12} /> Declined
                </div>
              )}

              {notif.type === 'friend_accepted' && (
                <div className="notif-status-badge friend-added">
                  <Sparkles size={12} /> You're now friends!
                </div>
              )}
            </>
          )}
        </div>

        {!notif.read && <div className="notif-unread-dot" />}
        {isClickable && <ChevronRight size={16} className="notif-chevron" />}
      </div>
    );
  };

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div className="notif-group" key={label}>
        <div className="notif-group-header">
          <span>{label}</span>
          <span className="notif-group-count">{items.length}</span>
        </div>
        <div className="notif-group-list">{items.map(renderNotifCard)}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="notif-page">
        <div className="notif-page-loading">
          <div className="loading-spinner-large" />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <div className="notif-header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Notifications</h1>
            <p className="notif-header-subtitle">
              {totalCount === 0
                ? 'No notifications'
                : `${unreadCount > 0 ? `${unreadCount} unread · ` : ''}${totalCount} total`}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={markAllRead}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-stats-bar">
        <div className="notif-stat">
          <div className="notif-stat-icon icon-friend-request">
            <UserPlus size={16} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-number">{pendingCount}</span>
            <span className="notif-stat-label">Pending Requests</span>
          </div>
        </div>
        <div className="notif-stat">
          <div className="notif-stat-icon icon-friend-accepted">
            <UserCheck size={16} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-number">{acceptedCount}</span>
            <span className="notif-stat-label">New Friends</span>
          </div>
        </div>
        <div className="notif-stat">
          <div className="notif-stat-icon icon-chat">
            <MessageSquare size={16} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-number">{unreadChatCount}</span>
            <span className="notif-stat-label">Messages</span>
          </div>
        </div>
        <div className="notif-stat">
          <div className="notif-stat-icon icon-default">
            <Bell size={16} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-number">{unreadCount}</span>
            <span className="notif-stat-label">Unread</span>
          </div>
        </div>
      </div>

      <div className="notif-filter-bar">
        <div className="notif-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === 'all'
                ? totalCount
                : allNotifications.filter((n) => n.category === tab.key).length;
            return (
              <button
                key={tab.key}
                className={`notif-tab ${activeTab === tab.key ? 'notif-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {count > 0 && <span className="notif-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="notif-filter-right">
          <div className="notif-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="notif-date-filter" ref={dateDropRef}>
            <button
              className={`btn-date-filter ${dateDropdownOpen ? 'btn-date-filter-open' : ''}`}
              onClick={() => setDateDropdownOpen((p) => !p)}
            >
              <Calendar size={16} />
              <span>{DATE_FILTERS.find((d) => d.key === dateFilter)?.label || 'All Time'}</span>
            </button>
            {dateDropdownOpen && (
              <div className="date-dropdown">
                {DATE_FILTERS.map((d) => (
                  <button
                    key={d.key}
                    className={`date-dropdown-item ${dateFilter === d.key ? 'date-dropdown-active' : ''}`}
                    onClick={() => { setDateFilter(d.key); setDateDropdownOpen(false); }}
                  >
                    {d.label}
                    {dateFilter === d.key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="notif-list-container">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              {searchQuery ? <Search size={48} /> : activeTab !== 'all' ? <BellOff size={48} /> : <Inbox size={48} />}
            </div>
            <h3>
              {searchQuery
                ? 'No matching notifications'
                : activeTab !== 'all'
                ? `No ${activeTab} notifications`
                : 'All caught up!'}
            </h3>
            <p>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : activeTab !== 'all'
                ? `You don't have any ${activeTab} notifications right now`
                : "You don't have any notifications at the moment"}
            </p>
          </div>
        ) : (
          <>
            {renderGroup('Today', groupedNotifications.today)}
            {renderGroup('Yesterday', groupedNotifications.yesterday)}
            {renderGroup('Earlier This Week', groupedNotifications.week)}
            {renderGroup('Older', groupedNotifications.older)}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;