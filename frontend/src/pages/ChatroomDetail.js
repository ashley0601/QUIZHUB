import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import API from '../api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import {
  Send,
  Users,
  X,
  Image,
  Plus,
  Smile,
  ThumbsUp,
  Search,
  Edit,
  Trash2,
  Forward,
  Crown,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Save,
  UserPlus,
  Download,
  ExternalLink,
  FileQuestion,
  Loader2,
  Palette,
  ChevronLeft,
  Medal,
  CircleDot,
  Info,
  ClipboardList,
  GraduationCap,
  Camera,
  MoreVertical,
  Zap,
  Target,
  BookOpen,
  Trophy,
  TrendingUp,
  Heart,
  Star,
  Award,
} from 'lucide-react';
import '../styles/ChatroomDetail.css';

const QUICK_REACTIONS = [
  { key: 'like', emoji: '👍' }, { key: 'heart', emoji: '❤️' }, { key: 'care', emoji: '🤗' },
  { key: 'haha', emoji: '😂' }, { key: 'wow', emoji: '😮' }, { key: 'sad', emoji: '😢' }, { key: 'angry', emoji: '😡' },
];

const POLL_INTERVAL = 5000;
const SCROLL_THRESHOLD = 200;
const NEW_MESSAGE_DURATION = 3000;

const THEME_PRESETS = [
  { id: 'purple', name: 'Purple', color: '#7c5cff', gradient: 'linear-gradient(135deg, #7c5cff, #5b3cc4)' },
  { id: 'blue', name: 'Ocean', color: '#2563eb', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  { id: 'green', name: 'Emerald', color: '#059669', gradient: 'linear-gradient(135deg, #10b981, #047857)' },
  { id: 'red', name: 'Rose', color: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e, #be123c)' },
  { id: 'orange', name: 'Sunset', color: '#ea580c', gradient: 'linear-gradient(135deg, #f97316, #c2410c)' },
  { id: 'pink', name: 'Pink', color: '#db2777', gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { id: 'teal', name: 'Teal', color: '#0d9488', gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)' },
  { id: 'indigo', name: 'Indigo', color: '#4f46e5', gradient: 'linear-gradient(135deg, #6366f1, #4338ca)' },
];

const WALLPAPER_PRESETS = [
  { id: 'default', name: 'Default', style: 'linear-gradient(180deg, #fbf8ff 0%, #f4ecff 48%, #efe6ff 100%)' },
  { id: 'dark', name: 'Dark', style: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { id: 'warm', name: 'Warm', style: 'linear-gradient(180deg, #fff5eb 0%, #ffe4cc 50%, #ffd4aa 100%)' },
  { id: 'ocean', name: 'Ocean', style: 'linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)' },
  { id: 'forest', name: 'Forest', style: 'linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' },
  { id: 'sunset', name: 'Sunset', style: 'linear-gradient(180deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)' },
  { id: 'lavender', name: 'Lavender', style: 'linear-gradient(180deg, #f3e5f5 0%, #e1bee7 50%, #ce93d8 100%)' },
  { id: 'midnight', name: 'Midnight', style: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d44 50%, #404060 100%)' },
];

const AWARD_TYPES = [
  { id: 'top_scorer', name: 'Top Scorer', icon: Trophy, color: '#f59e0b' },
  { id: 'most_improved', name: 'Most Improved', icon: TrendingUp, color: '#10b981' },
  { id: 'perfect_score', name: 'Perfect Score', icon: Target, color: '#ef4444' },
  { id: 'quiz_master', name: 'Quiz Master', icon: BookOpen, color: '#8b5cf6' },
  { id: 'fastest_finisher', name: 'Fastest Finisher', icon: Zap, color: '#f97316' },
  { id: 'outstanding', name: 'Outstanding', icon: Star, color: '#ec4899' },
  { id: 'heart_of_class', name: 'Heart of Class', icon: Heart, color: '#ef4444' },
  { id: 'participation', name: 'Participation', icon: Medal, color: '#6366f1' },
];

const toSafeString = (v) => (typeof v === 'string' ? v : '');
const normalizeId = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') return 'id' in v ? String(v.id) : '';
  return String(v);
};

const getUserIdFromToken = () => {
  try {
    const t = localStorage.getItem('access');
    if (!t) return null;
    const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return p.user_id || p.sub || p.id;
  } catch { return null; }
};

const isPdfFile = (u = '', n = '') => {
  const s = toSafeString(u).toLowerCase(), t = toSafeString(n).toLowerCase();
  return s.endsWith('.pdf') || t.endsWith('.pdf') || s.includes('.pdf?');
};
const isImageFile = (u = '', n = '') => /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(toSafeString(u)) || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(toSafeString(n));
const isImageLikeUrl = (u = '') => /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i.test(toSafeString(u));
const getFileNameFromUrl = (u = '') => {
  const s = toSafeString(u);
  if (!s) return 'download';
  try { const c = s.split('?')[0]; return c.substring(c.lastIndexOf('/') + 1) || 'download'; } catch { return 'download'; }
};
const getHostFromUrl = (u = '') => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const formatBytes = (b) => {
  const v = Number(b); if (!v || isNaN(v)) return '';
  if (v < 1024) return `${v} B`; if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1073741824) return `${(v / 1048576).toFixed(1)} MB`; return `${(v / 1073741824).toFixed(1)} GB`;
};
const extractSingleUrl = (t = '') => {
  const m = toSafeString(t).trim().match(/^(https?:\/\/[^\s]+|www\.[^\s]+)$/i);
  return !m ? '' : m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
};

const linkifyText = (text) => {
  const s = toSafeString(text);
  if (!s || !/(https?:\/\/[^\s]+)|(www\.[^\s]+)/i.test(s)) return s;
  const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const parts = [];
  let last = 0;
  s.replace(regex, (match, _p1, _p2, offset) => {
    if (offset > last) parts.push(s.slice(last, offset));
    parts.push(
      <a key={`${match}-${offset}`} href={match.startsWith('http') ? match : `https://${match}`} target="_blank" rel="noreferrer" className="message-link" onClick={(e) => e.stopPropagation()}>
        {match}
      </a>
    );
    last = offset + match.length;
    return match;
  });
  if (last < s.length) parts.push(s.slice(last));
  return parts;
};

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    document.addEventListener('mousedown', fn); document.addEventListener('touchstart', fn);
    return () => { document.removeEventListener('mousedown', fn); document.removeEventListener('touchstart', fn); };
  }, [ref, handler]);
};

const OtherNicknameInput = ({ otherMember, chatroomId, fetchRoomData, showToast }) => {
  const [nick, setNick] = useState(otherMember?.nickname || '');
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    try {
      await API.post(`/chat/chatrooms/${chatroomId}/nickname/`, { user_id: otherMember.id, nickname: nick });
      setEditing(false); fetchRoomData(); showToast('Nickname updated');
    } catch (err) { showToast(err.response?.data?.error || 'Failed to update'); }
  };

  const handleClear = async () => {
    try {
      await API.post(`/chat/chatrooms/${chatroomId}/nickname/`, { user_id: otherMember.id, nickname: '' });
      setNick(''); setEditing(false); fetchRoomData(); showToast('Nickname cleared');
    } catch (err) { showToast('Failed to clear'); }
  };

  if (!editing) {
    return (
      <div className="nickname-display-row">
        <span className="nickname-display-value">{otherMember?.nickname || otherMember?.username}</span>
        <button onClick={() => setEditing(true)} className="nickname-edit-btn" type="button"><Edit size={14} /> Edit</button>
      </div>
    );
  }

  return (
    <div className="nickname-input-group">
      <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={otherMember?.username} autoFocus />
      <button onClick={handleSave} className="nickname-save-btn" type="button"><Check size={16} /></button>
      <button onClick={handleClear} className="nickname-clear-btn" type="button"><X size={14} /></button>
      <button onClick={() => setEditing(false)} className="nickname-cancel-btn" type="button">Cancel</button>
    </div>
  );
};

const ChatroomDetail = () => {
  const { chatroomId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [sidebarView, setSidebarView] = useState('menu');
  const [settings, setSettings] = useState({ name: '', theme: '#7c5cff', photo: null, wallpaper: 'default' });
  const [showComposerEmojis, setShowComposerEmojis] = useState(false);
  const [friends, setFriends] = useState([]);
  const [chatrooms, setChatrooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [forwardModal, setForwardModal] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);
  const [fullReactionPickerFor, setFullReactionPickerFor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAwardType, setSelectedAwardType] = useState(null);
  const [memberActionMenu, setMemberActionMenu] = useState(null);
  const [nicknameEditFor, setNicknameEditFor] = useState(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [myNicknameInput, setMyNicknameInput] = useState('');
  const [addMemberInput, setAddMemberInput] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [awards, setAwards] = useState([]);
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const prevMessageCountRef = useRef(0);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const roomPhotoInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachModalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const initialScrollRef = useRef(true);
  const searchInputRef = useRef(null);

  const currentUserId = normalizeId(getUserIdFromToken() || '0');

  useClickOutside(emojiPickerRef, () => setShowComposerEmojis(false));
  useClickOutside(attachModalRef, () => setShowAttachModal(false));

  useEffect(() => {
    const COLLAPSED_THRESHOLD = 100;
    const EXPANDED_THRESHOLD = 150;
    
    const detectSidebarState = () => {
      const sidebarSelectors = [
        '.sidebar',
        '[class*="sidebar"]',
        '[class*="Sidebar"]',
        'aside',
        '.app-sidebar',
        '.main-sidebar',
        'nav[class*="sidebar"]'
      ];
      
      let sidebarEl = null;
      for (const selector of sidebarSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (!el.closest('.chatroom-detail-grid') && 
              !el.classList.contains('chatroom-side-panel') &&
              el.getBoundingClientRect().width > 0) {
            sidebarEl = el;
            break;
          }
        }
        if (sidebarEl) break;
      }
      
      if (sidebarEl) {
        const width = sidebarEl.getBoundingClientRect().width;
        setSidebarWidth(width);
        const isCollapsed = width <= COLLAPSED_THRESHOLD;
        setSidebarCollapsed(isCollapsed);
        document.documentElement.style.setProperty('--sidebar-actual-width', `${width}px`);
      } else {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState !== null) {
          setSidebarCollapsed(storedState === 'true');
        }
      }
    };

    detectSidebarState();
    
    const initTimeout = setTimeout(detectSidebarState, 100);
    const initTimeout2 = setTimeout(detectSidebarState, 300);
    const initTimeout3 = setTimeout(detectSidebarState, 600);

    let observer = null;
    const sidebarSelectors = ['.sidebar', '[class*="sidebar"]', 'aside'];
    
    const setupObserver = () => {
      for (const selector of sidebarSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (!el.closest('.chatroom-detail-grid') && 
              !el.classList.contains('chatroom-side-panel')) {
            observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                  detectSidebarState();
                }
              }
            });
            observer.observe(el, {
              attributes: true,
              attributeFilter: ['class', 'style']
            });
            break;
          }
        }
        if (observer) break;
      }
    };
    
    const observerTimeout = setTimeout(setupObserver, 200);

    let resizeObserver = null;
    const setupResizeObserver = () => {
      for (const selector of sidebarSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (!el.closest('.chatroom-detail-grid') && 
              !el.classList.contains('chatroom-side-panel')) {
            resizeObserver = new ResizeObserver(() => {
              detectSidebarState();
            });
            resizeObserver.observe(el);
            break;
          }
        }
        if (resizeObserver) break;
      }
    };
    
    const resizeObserverTimeout = setTimeout(setupResizeObserver, 200);

    const handleToggleEvent = (e) => {
      setTimeout(detectSidebarState, 50);
    };
    
    const eventNames = [
      'sidebarToggle', 'sidebar-toggle', 'sidebarCollapsed', 'sidebar-collapsed',
      'sidebarExpanded', 'sidebar-expanded', 'sidebarChange', 'sidebar-change'
    ];
    
    eventNames.forEach(eventName => {
      window.addEventListener(eventName, handleToggleEvent);
    });

    const handleGlobalClick = (e) => {
      const target = e.target.closest('[class*="toggle"], [class*="collapse"], [class*="menu-btn"], [class*="hamburger"]');
      if (target) {
        setTimeout(detectSidebarState, 100);
        setTimeout(detectSidebarState, 200);
        setTimeout(detectSidebarState, 300);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);

    const intervalId = setInterval(detectSidebarState, 2000);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(initTimeout2);
      clearTimeout(initTimeout3);
      clearTimeout(observerTimeout);
      clearTimeout(resizeObserverTimeout);
      
      observer?.disconnect();
      resizeObserver?.disconnect();
      
      eventNames.forEach(eventName => {
        window.removeEventListener(eventName, handleToggleEvent);
      });
      
      document.removeEventListener('click', handleGlobalClick);
      clearInterval(intervalId);
      
      document.documentElement.style.removeProperty('--sidebar-actual-width');
    };
  }, []);

  useEffect(() => {
    if (!data?.messages || !Array.isArray(data.messages)) return;
    
    const currentCount = data.messages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount && prevCount > 0) {
      const newIds = new Set();
      for (let i = 0; i < currentCount - prevCount; i++) {
        if (data.messages[i]?.id) {
          newIds.add(data.messages[i].id);
        }
      }
      
      if (newIds.size > 0) {
        setNewMessageIds(prev => new Set([...prev, ...newIds]));
        
        setTimeout(() => {
          setNewMessageIds(prev => {
            const next = new Set(prev);
            newIds.forEach(id => next.delete(id));
            return next;
          });
        }, NEW_MESSAGE_DURATION);
      }
    }
    
    prevMessageCountRef.current = currentCount;
  }, [data?.messages]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--new-msg-color', `${settings.theme}25`);
    return () => root.style.removeProperty('--new-msg-color');
  }, [settings.theme]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const memberMap = useMemo(() => {
    const m = new Map();
    if (Array.isArray(data?.members)) data.members.forEach((x) => m.set(String(x.id), x));
    return m;
  }, [data?.members]);

  const getDisplaySenderName = useCallback((id) => {
    const m = memberMap.get(String(id));
    return m?.nickname || m?.username || 'User';
  }, [memberMap]);

  const scrollToTop = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior });
    }
  }, []);
  
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ 
        top: messagesContainerRef.current.scrollHeight, 
        behavior 
      });
    }
  }, []);
  
  const isNearTop = useCallback(() => {
    const c = messagesContainerRef.current;
    if (!c) return true;
    return c.scrollTop < SCROLL_THRESHOLD;
  }, []);
  
  const getImageUrl = useCallback((url) => {
    const u = toSafeString(url);
    return !u ? '' : u.startsWith('http') ? u : `http://localhost:8000${u}`;
  }, []);
  const getMessageOwnerId = useCallback((msg) => normalizeId(msg?.sender_id || msg?.sender?.id || msg?.user_id), []);
  const isMyMessage = useCallback((msg) => getMessageOwnerId(msg) === currentUserId, [currentUserId, getMessageOwnerId]);

  const fetchRoomData = useCallback(async (showLoad = false) => {
    try {
      if (showLoad) setIsLoading(true);
      const res = await API.get(`/chat/chatrooms/${chatroomId}/`);
      const p = res.data || {};
      setData(p);
      setSettings((prev) => ({
        ...prev,
        name: p.room?.name || '',
        theme: p.room?.theme_color || p.room?.theme || prev.theme,
        wallpaper: p.room?.wallpaper || prev.wallpaper,
      }));
      const my = (p.members || []).find((m) => String(m.id) === currentUserId);
      setMyNicknameInput(my?.nickname || '');
      if (!p.room?.is_direct) {
        try { const r = await API.get(`/chat/chatrooms/${chatroomId}/awards/`); setAwards(Array.isArray(r.data) ? r.data : []); } catch { setAwards([]); }
      } else { setAwards([]); }
    } catch (err) { if (err.response?.status === 404) navigate('/chatrooms'); } finally { setIsLoading(false); }
  }, [chatroomId, navigate, currentUserId]);

  const fetchFriends = useCallback(async () => {
    try { const r = await API.get('/friends/'); setFriends(Array.isArray(r.data) ? r.data : []); } catch { setFriends([]); }
  }, []);

  const fetchChatrooms = useCallback(async () => {
    try { const r = await API.get('/chat/chatrooms/'); setChatrooms(Array.isArray(r.data) ? r.data : []); } catch { setChatrooms([]); }
  }, []);

  const markRead = useCallback(async () => { try { await API.post(`/chat/chatrooms/${chatroomId}/mark_read/`); } catch {} }, [chatroomId]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      if (!isNearTop() && document.hidden) return;
      try {
        const res = await API.get(`/chat/chatrooms/${chatroomId}/`);
        const p = res.data || {};
        const prev = Array.isArray(data?.messages) ? data.messages.length : 0;
        const next = Array.isArray(p?.messages) ? p.messages.length : 0;
        setData(p);
        setSettings((prev2) => ({
          ...prev2,
          theme: p.room?.theme_color || p.room?.theme || prev2.theme,
          wallpaper: p.room?.wallpaper || prev2.wallpaper,
        }));
        if (next > prev && isNearTop()) setTimeout(() => scrollToTop(), 100);
        markRead();
      } catch {}
    }, POLL_INTERVAL);
  }, [chatroomId, data?.messages, isNearTop, scrollToTop, markRead]);

  useEffect(() => {
    initialScrollRef.current = true;
    fetchRoomData(true);
    fetchFriends();
    fetchChatrooms();
  }, [fetchRoomData, fetchFriends, fetchChatrooms, chatroomId]);
  useEffect(() => {
    if (data) {
      if (initialScrollRef.current) {
        scrollToBottom('auto');
        initialScrollRef.current = false;
      }
      markRead();
      startPolling();
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [data, scrollToBottom, markRead, startPolling]);

  useEffect(() => {
    const fn = (e) => {
      if (!e.target.closest('.message-hover-tools') && !e.target.closest('.message-reaction-popup') && !e.target.closest('.full-reaction-picker')) {
        setActiveReactionPickerId(null); setFullReactionPickerFor(null);
      }
      if (!e.target.closest('.member-action-menu')) setMemberActionMenu(null);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const navToProfile = (id) => navigate(`/profile/${id}`);

  const sendMessage = async (type = 'text', content = newMessage) => {
    const s = toSafeString(content).trim();
    if (!s || isSending) return;
    setIsSending(true);
    try {
      await API.post(`/chat/chatrooms/${chatroomId}/messages/`, { content: s, message_type: type });
      setNewMessage(''); setShowComposerEmojis(false); setShowAttachModal(false);
      await fetchRoomData();
      scrollToBottom('auto');
    } catch { showToast('Failed to send'); } finally { setIsSending(false); }
  };

  const handleImageUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setIsSending(true);
    const fd = new FormData(); fd.append('file', f); fd.append('message_type', 'image'); fd.append('content', f.name || 'Image');
    try { await API.post(`/chat/chatrooms/${chatroomId}/messages/`, fd); setShowAttachModal(false); await fetchRoomData(); scrollToBottom('auto'); }
    catch { showToast('Upload failed'); } finally { setIsSending(false); e.target.value = ''; }
  };

  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setIsSending(true);
    const fd = new FormData(); fd.append('file', f); fd.append('message_type', 'file'); fd.append('content', f.name);
    try { await API.post(`/chat/chatrooms/${chatroomId}/messages/`, fd); setShowAttachModal(false); await fetchRoomData(); scrollToBottom('auto'); }
    catch { showToast('Upload failed'); } finally { setIsSending(false); e.target.value = ''; }
  };

  const handleGroupPhotoChange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setIsUploadingPhoto(true);
    const fd = new FormData(); fd.append('photo', f);
    try { await API.put(`/chat/chatrooms/${chatroomId}/`, fd); fetchRoomData(); showToast('Group photo updated'); }
    catch { showToast('Failed to update photo'); } finally { setIsUploadingPhoto(false); e.target.value = ''; }
  };

  const handleSetNickname = async (targetId, nick, isForOther) => {
    try {
      const payload = isForOther ? { user_id: targetId, nickname: nick } : { nickname: nick };
      await API.post(`/chat/chatrooms/${chatroomId}/nickname/`, payload);
      setNicknameEditFor(null);
      if (!isForOther) setMyNicknameInput(nick);
      fetchRoomData(); showToast('Nickname updated');
    } catch (err) { showToast(err.response?.data?.error || 'Failed to update'); }
  };

  const handleRemoveMember = async (mId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await API.post(`/chat/chatrooms/${chatroomId}/remove_member/`, { user_id: mId }); fetchRoomData(); setMemberActionMenu(null); showToast('Member removed'); }
    catch (err) { showToast(err.response?.data?.error || 'Failed'); }
  };

  const handleAwardStudent = async (sId, aType) => {
    try {
      const res = await API.post(`/chat/chatrooms/${chatroomId}/awards/`, { student_id: sId, award_type: aType });
      if (res.status === 201) {
        setSelectedAwardType(null); setSidebarView('menu'); showToast('Award given successfully!'); fetchRoomData();
      } else { showToast(res.data?.message || 'Award already given'); }
    } catch (err) { showToast(err.response?.data?.error || 'Failed to give award'); }
  };

  const handleUpdateSettings = async () => {
    const fd = new FormData();
    if (settings.name) fd.append('name', settings.name);
    if (settings.theme) fd.append('theme_color', settings.theme);
    fd.append('wallpaper', settings.wallpaper);
    setIsLoading(true);
    try {
      await API.put(`/chat/chatrooms/${chatroomId}/`, fd);
      setSettings((prev) => ({ ...prev, photo: null }));
      showToast('Saved!'); fetchRoomData();
    } catch { showToast('Failed'); } finally { setIsLoading(false); }
  };

  const handleAddMember = async () => {
    if (!addMemberInput.trim()) return;
    try { await API.post(`/chat/chatrooms/${chatroomId}/add_member/`, { identifier: addMemberInput }); showToast('Added!'); setAddMemberInput(''); fetchRoomData(); }
    catch (err) { showToast(err.response?.data?.error || 'Failed'); }
  };

  const handleEditStart = (msg) => { setEditingMsg(msg); setEditContent(msg?.content || ''); };
  const saveEdit = async (id) => { if (!editContent.trim()) return; try { await API.put(`/chat/messages/${id}/edit/`, { content: editContent }); setEditingMsg(null); fetchRoomData(); } catch { showToast('Failed'); } };
  const handleDelete = async (id) => { if (!window.confirm('Unsend?')) return; try { await API.delete(`/chat/messages/${id}/delete/`); fetchRoomData(); } catch { showToast('Failed'); } };

  const handleForward = async (rId) => {
    if (!forwardMsg) return;
    try { await API.post(`/chat/messages/${forwardMsg.id}/forward/`, { room_id: rId }); setForwardModal(false); setForwardMsg(null); showToast('Forwarded!'); }
    catch (err) { showToast(err.response?.data?.error || 'Failed to forward'); }
  };

  const handleReaction = async (id, r) => { try { await API.post(`/chat/messages/${id}/react/`, { reaction: r }); setActiveReactionPickerId(null); setFullReactionPickerFor(null); fetchRoomData(); } catch {} };
  const handleComposerEmojiClick = (e) => setNewMessage((p) => p + (e.emoji || ''));
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleHeaderSearch = () => { setShowInfo(true); setTimeout(() => searchInputRef.current?.focus(), 150); };
  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('msg-highlight'); setTimeout(() => el.classList.remove('msg-highlight'), 2500); }
    setShowInfo(false); setSearchQuery('');
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDateSep = (d) => {
    if (!d) return '';
    const dt = new Date(d), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (dt.toDateString() === t.toDateString()) return 'Today';
    if (dt.toDateString() === y.toDateString()) return 'Yesterday';
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const messages = Array.isArray(data?.messages) ? data.messages : [];
  const members = Array.isArray(data?.members) ? data.members : [];
  const room = data?.room || {};
  const chatTheme = settings.theme || room.theme_color || room.theme || '#7c5cff';
  const wallpaperStyle = WALLPAPER_PRESETS.find((w) => w.id === settings.wallpaper)?.style || WALLPAPER_PRESETS[0].style;
  const isDirect = room.is_direct;
  const otherMember = isDirect ? members.find((m) => String(m.id) !== currentUserId) || null : null;
  const myMember = members.find((m) => String(m.id) === currentUserId);
  const isAdmin = myMember?.role === 'admin';
  const roomPhotoRaw = room.photo || room.photo_url || room.image || room.avatar || '';
  const roomPhotoUrl = roomPhotoRaw ? getImageUrl(roomPhotoRaw) : '';
  const isOtherOnline = otherMember?.is_online === true;
  const otherLastSeen = otherMember?.last_seen;

  const { photoCount, fileCount, linkCount } = useMemo(() => ({
    photoCount: messages.filter((m) => m?.type === 'image').length,
    fileCount: messages.filter((m) => m?.type === 'file').length,
    linkCount: messages.filter((m) => /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i.test(toSafeString(m?.content))).length,
  }), [messages]);

  const photoMsgs = useMemo(() => messages.filter((m) => m?.type === 'image'), [messages]);
  const fileMsgs = useMemo(() => messages.filter((m) => m?.type === 'file'), [messages]);
  const linkMsgs = useMemo(() => messages.filter((m) => /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i.test(toSafeString(m?.content))), [messages]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => toSafeString(m?.content).toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const searchResultsGrouped = useMemo(() => {
    const el = []; let ld = null;
    searchResults.forEach((msg, i) => {
      const d = msg?.created_at ? new Date(msg.created_at).toDateString() : `n-${i}`;
      if (d !== ld) { el.push({ type: 'date', label: formatDateSep(msg?.created_at), key: `sd-${i}` }); ld = d; }
      el.push({ type: 'msg', msg, key: `sm-${msg?.id || i}` });
    });
    return el;
  }, [searchResults]);

  const convTitle = isDirect ? (otherMember?.nickname || otherMember?.username || room.name || 'Chat') : (settings.name || room.name || 'Group Chat');
  const convSub = isDirect ? (isOtherOnline ? 'Active now' : (otherLastSeen ? `Last seen ${formatTime(otherLastSeen)}` : 'Offline')) : `${members.length} member${members.length === 1 ? '' : 's'}`;
  const convAvatarRaw = isDirect ? (otherMember?.profile_picture || otherMember?.profile_pic || '') : roomPhotoRaw;
  const convAvatar = convAvatarRaw ? getImageUrl(convAvatarRaw) : '';
  const convInit = toSafeString(convTitle).charAt(0).toUpperCase() || 'C';

  const fwdCandidates = useMemo(() => {
    const candidates = chatrooms.filter((r) => String(r.id) !== chatroomId).map((r) => ({ id: r.id, name: r.name, avatar: r.photo ? getImageUrl(r.photo) : '' }));
    friends.forEach((f) => {
      if (!candidates.find((c) => String(c.id) === String(f.chatroom_id))) {
        candidates.push({ id: f.chatroom_id || f.id, name: f.username, avatar: f.profile_pic ? getImageUrl(f.profile_pic) : '' });
      }
    });
    return candidates.filter((it, i, arr) => arr.findIndex((x) => String(x.id) === String(it.id)) === i);
  }, [chatrooms, friends, chatroomId]);

  const filteredFwd = fwdCandidates.filter((it) => it.name?.toLowerCase().includes(forwardSearch.toLowerCase()));

  const renderStatus = (msg) => {
    if (!isMyMessage(msg)) return null;
    return msg?.read_at ? <span className="msg-status seen"><CheckCheck size={13} /> Seen</span> : <span className="msg-status"><Check size={13} /> Sent</span>;
  };

  const renderFileMessage = (msg) => {
    const raw = msg?.file_url || msg?.file || msg?.url || '';
    const url = raw ? getImageUrl(raw) : '';
    const name = msg?.content || getFileNameFromUrl(url || raw);
    if (!url) return <div className="message-text">{name || 'Unavailable'}</div>;
    return (
      <div className="file-message-card">
        <div className="file-message-main" onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}>
          <div className="file-message-icon"><FileQuestion size={18} /></div>
          <div className="file-message-info">
            <div className="file-message-name">{name}</div>
            <div className="file-message-meta">{isPdfFile(url, name) ? 'PDF' : 'File'}{msg?.file_size ? ` • ${formatBytes(msg.file_size)}` : ''}</div>
          </div>
          <ExternalLink size={16} className="file-message-open" />
        </div>
        <div className="file-message-actions">
          <a href={url} target="_blank" rel="noreferrer" className="file-action-btn" onClick={(e) => e.stopPropagation()}>Open</a>
          <a href={url} download={name} className="file-action-btn primary" onClick={(e) => e.stopPropagation()}><Download size={14} /> Download</a>
        </div>
      </div>
    );
  };

  const renderImageMessage = (msg) => {
    const raw = msg?.file_url || msg?.file || msg?.url || '';
    const url = raw ? getImageUrl(raw) : '';
    if (!url) return <div className="message-text">{msg?.content || 'Unavailable'}</div>;
    return <div className="msg-image-card" onClick={() => setPreviewImage(url)}><img src={url} alt="" className="msg-image" /></div>;
  };

  const renderMsgContent = (msg) => {
    const raw = msg?.file_url || msg?.file || msg?.url || '';
    const url = raw ? getImageUrl(raw) : '';
    const t = toSafeString(msg?.type);
    const su = extractSingleUrl(msg?.content || '');
    if (t === 'image' || isImageFile(url, msg?.content || '') || isImageLikeUrl(su)) return renderImageMessage({ ...msg, file_url: url || su });
    if (t === 'file') return renderFileMessage(msg);
    return <div className="message-text">{linkifyText(msg?.content || '')}</div>;
  };

  const renderReactions = (msg) => {
    if (!msg?.reactions || !Object.keys(msg.reactions).length) return null;
    const g = {};
    Object.values(msg.reactions).forEach((r) => { g[r] = (g[r] || 0) + 1; });
    return (
      <div className="reaction-summary-row">
        {Object.entries(g).map(([e, c]) => (
          <button key={`${msg.id}-${e}`} className="reaction-summary-chip" onClick={() => handleReaction(msg.id, e)} type="button"><span>{e}</span><span>{c}</span></button>
        ))}
      </div>
    );
  };

  const renderHoverTools = (msg, mine) => {
    const po = activeReactionPickerId === msg.id;
    const fo = fullReactionPickerFor === msg.id;
    const io = po || fo;
    return (
      <div className={`message-hover-tools ${mine ? 'mine' : 'theirs'} ${io ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="hover-tool-btn icon-only" onClick={(e) => { e.stopPropagation(); setActiveReactionPickerId(po ? null : msg.id); setFullReactionPickerFor(null); }} type="button"><Smile size={15} /></button>
        <button className="hover-tool-btn icon-only" onClick={(e) => { e.stopPropagation(); setForwardMsg(msg); setForwardModal(true); fetchChatrooms(); }} type="button"><Forward size={15} /></button>
        {mine && (
          <>
            <button className="hover-tool-btn text-btn" onClick={(e) => { e.stopPropagation(); handleEditStart(msg); }} type="button"><Edit size={14} /><span>Edit</span></button>
            <button className="hover-tool-btn text-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }} type="button"><Trash2 size={14} /><span>Unsend</span></button>
          </>
        )}
        {po && (
          <div className={`message-reaction-popup ${mine ? 'mine' : 'theirs'}`} onClick={(e) => e.stopPropagation()}>
            {QUICK_REACTIONS.map((i) => (
              <button key={i.key} className="reaction-popup-btn" onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, i.emoji); }} type="button">{i.emoji}</button>
            ))}
            <button className="reaction-popup-btn plus-btn" onClick={(e) => { e.stopPropagation(); setFullReactionPickerFor(fo ? null : msg.id); }} type="button">+</button>
          </div>
        )}
        {fo && (
          <div className={`full-reaction-picker ${mine ? 'mine' : 'theirs'}`} onClick={(e) => e.stopPropagation()}>
            <EmojiPicker onEmojiClick={(ed) => handleReaction(msg.id, ed.emoji)} lazyLoadEmojis searchDisabled previewConfig={{ showPreview: false }} width={300} height={360} />
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    let lastD = null;
    const el = [];
    if (!messages.length) {
      return (
        <div className="empty-chat-state">
          <div className="empty-chat-icon-large"><Users size={28} /></div>
          <h3>No messages yet</h3><p>Start the conversation.</p>
        </div>
      );
    }
    messages.forEach((msg, i) => {
      const d = msg?.created_at ? new Date(msg.created_at).toDateString() : `n-${i}`;
      if (d !== lastD) {
        el.push(<div key={`d-${i}`} className="date-separator"><span>{formatDateSep(msg?.created_at)}</span></div>);
        lastD = d;
      }
      const mine = isMyMessage(msg);
      const isEdit = editingMsg && editingMsg.id === msg.id;
      const isNew = newMessageIds.has(msg.id);
      
      el.push(
        <div key={msg?.id || i} id={`msg-${msg?.id}`} className={`msg-row ${mine ? 'mine' : 'theirs'} ${isNew ? 'new-message-highlight' : ''}`}>
          {!mine && (
            <div className="msg-avatar" style={{ background: msg?.sender_pic ? `url(${getImageUrl(msg.sender_pic)})` : 'linear-gradient(135deg, #5b3cc4, #7c5cff)', backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={() => navToProfile(getMessageOwnerId(msg))}>
              {!msg?.sender_pic && (toSafeString(msg?.sender).charAt(0).toUpperCase() || 'U')}
            </div>
          )}
          <div className="msg-bubble-wrap">
            {!mine && <div className="msg-sender-name">{getDisplaySenderName(msg?.sender_id)}</div>}
            <div className={`message-row-shell ${mine ? 'mine' : 'theirs'}`}>
              {mine && renderHoverTools(msg, mine)}
              <div className="message-bubble-stack">
                {isEdit ? (
                  <div className="edit-input-wrapper">
                    <input value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit(msg.id)} />
                    <button onClick={() => saveEdit(msg.id)} className="save-edit-btn" type="button"><Save size={14} /> Save</button>
                  </div>
                ) : (
                  <>
                    <div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`} style={mine ? { background: chatTheme } : { background: `${chatTheme}15` }}>
                      {renderMsgContent(msg)}
                      {msg?.is_edited && <span className="edited-tag">(edited)</span>}
                    </div>
                    {renderReactions(msg)}
                    <div className={`msg-meta ${mine ? 'mine' : 'theirs'}`}>
                      <div className="msg-meta-row">
                        <span className="msg-time">{formatTime(msg?.created_at)}</span>
                        {renderStatus(msg)}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!mine && renderHoverTools(msg, mine)}
            </div>
          </div>
        </div>
      );
    });
    return el;
  };

  const renderVH = (title, onBack) => (
    <div className="sidebar-view-header">
      <button onClick={onBack || (() => setSidebarView('menu'))} type="button" className="sidebar-back-btn"><ChevronLeft size={20} /></button>
      <h4>{title}</h4>
    </div>
  );

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;
    if (!searchResultsGrouped.length) return <div className="sidebar-empty"><Search size={24} /><p>No results found</p></div>;
    return (
      <div className="search-results-list">
        {searchResultsGrouped.map((it) => {
          if (it.type === 'date') return <div key={it.key} className="search-date-label">{it.label}</div>;
          return (
            <button key={it.key} className="search-result-item" onClick={() => scrollToMessage(it.msg.id)} type="button">
              <div className="search-result-content">{toSafeString(it.msg?.content).substring(0, 80)}...</div>
              <div className="search-result-meta">
                <span>{isMyMessage(it.msg) ? 'You' : getDisplaySenderName(it.msg?.sender_id)}</span>
                <span>{formatTime(it.msg?.created_at)}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderPhotosView = () => {
    if (!photoMsgs.length) return <div className="sidebar-empty"><ImageIcon size={24} /><p>No photos</p></div>;
    return (
      <div className="sidebar-photo-grid">
        {photoMsgs.map((m) => {
          const s = getImageUrl(m.file_url || m.file || m.url || '');
          return <button key={m.id} className="sidebar-photo-item" onClick={() => setPreviewImage(s)} type="button"><img src={s} alt="" /></button>;
        })}
      </div>
    );
  };

  const renderFilesView = () => {
    if (!fileMsgs.length) return <div className="sidebar-empty"><FileText size={24} /><p>No files</p></div>;
    return (
      <div className="sidebar-file-list">
        {fileMsgs.map((m) => {
          const u = getImageUrl(m.file_url || m.file || m.url || '');
          const n = m.content || getFileNameFromUrl(u);
          return (
            <a key={m.id} href={u} target="_blank" rel="noreferrer" className="sidebar-file-item">
              <FileText size={18} />
              <div className="sidebar-file-info"><span>{n}</span><small>{getDisplaySenderName(m?.sender_id)} • {formatTime(m?.created_at)}</small></div>
              <ExternalLink size={14} />
            </a>
          );
        })}
      </div>
    );
  };

  const renderLinksView = () => {
    if (!linkMsgs.length) return <div className="sidebar-empty"><LinkIcon size={24} /><p>No links</p></div>;
    return (
      <div className="sidebar-file-list">
        {linkMsgs.map((m) => {
          const rw = toSafeString(m?.content);
          const mt = rw.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
          const u = mt ? (mt[0].startsWith('http') ? mt[0] : `https://${mt[0]}`) : '#';
          return (
            <a key={m.id} href={u} target="_blank" rel="noreferrer" className="sidebar-file-item">
              <LinkIcon size={18} />
              <div className="sidebar-file-info"><span>{getHostFromUrl(u)}</span><small>{formatTime(m?.created_at)}</small></div>
              <ExternalLink size={14} />
            </a>
          );
        })}
      </div>
    );
  };

  const renderNicknameView = () => (
    <div className="nickname-edit-view">
      <div className="nickname-section">
        <h5 className="nickname-section-title">Your Display Name</h5>
        <p className="nickname-hint">Set how you appear in this chat.</p>
        <div className="nickname-input-group">
          <input value={myNicknameInput} onChange={(e) => setMyNicknameInput(e.target.value)} placeholder={myMember?.username || "Your username"} />
          <button onClick={() => handleSetNickname(null, myNicknameInput, false)} className="nickname-save-btn" type="button"><Check size={16} /></button>
        </div>
        {myMember?.nickname && (
          <button className="clear-nickname-btn" onClick={() => handleSetNickname(null, '', false)} type="button"><X size={14} /> Reset to username</button>
        )}
      </div>
      {isDirect && otherMember && (
        <div className="nickname-section" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <h5 className="nickname-section-title">Nickname for {otherMember.username}</h5>
          <p className="nickname-hint">Set how you see {otherMember.username} in this chat.</p>
          <OtherNicknameInput otherMember={otherMember} chatroomId={chatroomId} fetchRoomData={fetchRoomData} showToast={showToast} />
        </div>
      )}
    </div>
  );

  const renderMembersView = () => (
    <div className="members-sidebar-list">
      {members.map((m) => {
        const pic = m.profile_picture || m.profile_pic || m.avatar;
        const av = pic ? getImageUrl(pic) : '';
        const ini = toSafeString(m.username).charAt(0).toUpperCase() || 'U';
        const isMe = String(m.id) === currentUserId;
        const setterName = m.nickname_set_by_name || 'unknown';
        return (
          <div key={m.id} className="members-sidebar-item">
            <button className="members-sidebar-avatar-btn" onClick={() => !isMe && navToProfile(m.id)} type="button">
              <div className="members-sidebar-avatar" style={av ? { backgroundImage: `url(${av})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!av && ini}</div>
            </button>
            <div className="members-sidebar-info">
              <span className="members-sidebar-name">{isMe ? 'You' : (m.nickname || m.username)}</span>
              <span className="members-sidebar-sub">
                {m.role === 'admin' && <Crown size={11} className="crown-inline" />}
                {m.nickname && !isMe && <span className="nickname-set-by">Nicknamed by {setterName}</span>}
                {!m.nickname && (isMe ? 'Member' : m.role || 'Member')}
              </span>
            </div>
            <div className="members-sidebar-actions">
              {nicknameEditFor === m.id ? (
                <div className="inline-nickname-edit">
                  <input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="Nickname" autoFocus />
                  <button onClick={() => { handleSetNickname(m.id, nicknameInput, true); setNicknameEditFor(null); }} type="button"><Check size={14} /></button>
                  <button onClick={() => { handleSetNickname(m.id, '', true); setNicknameEditFor(null); }} type="button"><X size={14} /></button>
                </div>
              ) : (
                <div className="members-action-wrapper">
                  <button className="members-more-btn" onClick={(e) => { e.stopPropagation(); setMemberActionMenu(memberActionMenu === m.id ? null : m.id); }} type="button"><MoreVertical size={16} /></button>
                  {memberActionMenu === m.id && (
                    <div className="member-action-menu">
                      <button onClick={() => { setNicknameEditFor(m.id); setNicknameInput(m.nickname || ''); setMemberActionMenu(null); }} type="button"><Edit size={14} /> {isMe ? 'Set your nickname' : 'Set nickname'}</button>
                      {!isMe && isAdmin && <button onClick={() => handleRemoveMember(m.id)} className="danger" type="button"><Trash2 size={14} /> Remove from group</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isAdmin && (
        <div className="add-member-bar">
          <UserPlus size={16} />
          <input placeholder="Add by username..." value={addMemberInput} onChange={(e) => setAddMemberInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddMember()} />
          <button onClick={handleAddMember} type="button"><Plus size={16} /></button>
        </div>
      )}
    </div>
  );

  const renderAwardsSelectView = () => (
    <div className="awards-select-grid">
      {AWARD_TYPES.map((a) => { const Icon = a.icon; return (
        <button key={a.id} className="award-type-card" onClick={() => { setSelectedAwardType(a.id); setSidebarView('awards-give'); }} type="button">
          <Icon size={28} style={{ color: a.color }} /><span>{a.name}</span>
        </button>
      ); })}
      {awards.length > 0 && (
        <div className="awards-history-section">
          <h5 className="awards-history-title">Recent Awards</h5>
          {awards.slice(0, 5).map((a) => { const aType = AWARD_TYPES.find((t) => t.id === a.award_type); const Icon = aType?.icon || Award; return (
            <div key={a.id} className="award-history-item">
              <Icon size={16} style={{ color: aType?.color || '#7c5cff' }} /><span>{a.student_name}</span><small>{a.award_name}</small>
            </div>
          ); })}
        </div>
      )}
    </div>
  );

  const renderAwardsGiveView = () => {
    const aInfo = AWARD_TYPES.find((a) => a.id === selectedAwardType);
    const sts = members.filter((m) => String(m.id) !== currentUserId);
    return (
      <div className="awards-give-view">
        <div className="awards-give-header">
          <button onClick={() => { setSelectedAwardType(null); setSidebarView('awards-select'); }} type="button"><ChevronLeft size={18} /></button>
          <span style={{ color: aInfo?.color }}>{aInfo?.name}</span>
        </div>
        <p className="awards-give-hint">Select a student to give this award</p>
        <div className="awards-student-list">
          {sts.map((m) => { const pic = m.profile_picture || m.profile_pic; const av = pic ? getImageUrl(pic) : ''; return (
            <button key={m.id} className="awards-student-btn" onClick={() => handleAwardStudent(m.id, selectedAwardType)} type="button">
              <div className="awards-student-avatar" style={av ? { backgroundImage: `url(${av})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!av && toSafeString(m.username).charAt(0).toUpperCase()}</div>
              <span>{m.nickname || m.username}</span>
            </button>
          ); })}
        </div>
      </div>
    );
  };

  const renderCustomizeView = () => (
    <div className="customize-panel">
      <div className="customize-section">
        <label>Theme Color</label>
        <div className="theme-color-row">
          {THEME_PRESETS.map((p) => (
            <button key={p.id} className={`theme-dot ${settings.theme === p.color ? 'active' : ''}`} style={{ background: p.gradient }} onClick={() => setSettings((prev) => ({ ...prev, theme: p.color }))} title={p.name} type="button" />
          ))}
        </div>
        <div className="custom-color-row">
          <label>Custom:</label>
          <input type="color" value={settings.theme} onChange={(e) => setSettings((p) => ({ ...p, theme: e.target.value }))} />
        </div>
      </div>
      <div className="customize-section">
        <label>Wallpaper</label>
        <div className="wallpaper-row">
          {WALLPAPER_PRESETS.map((w) => (
            <button key={w.id} className={`wallpaper-dot ${settings.wallpaper === w.id ? 'active' : ''}`} style={{ background: w.style }} onClick={() => setSettings((p) => ({ ...p, wallpaper: w.id }))} title={w.name} type="button">
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="customize-save-btn" onClick={handleUpdateSettings} type="button" disabled={isLoading}>
        {isLoading ? <Loader2 size={16} className="spinner" /> : 'Apply Changes'}
      </button>
    </div>
  );

  const renderMenu = () => (
    <div className="sidebar-menu">
      {isDirect ? (
        <button className="profile-card-btn" onClick={() => otherMember && navToProfile(otherMember.id)} type="button">
          <div className="profile-avatar-large" style={convAvatar ? { backgroundImage: `url(${convAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!convAvatar && convInit}</div>
          <h3>{convTitle}</h3>
          {otherMember?.username && <p>@{otherMember.username}</p>}
          <div className={`profile-status-badge ${isOtherOnline ? 'online' : 'offline'}`}>
            <CircleDot size={10} />
            {isOtherOnline ? 'Active now' : (otherLastSeen ? `Last seen ${formatTime(otherLastSeen)}` : 'Offline')}
          </div>
        </button>
      ) : (
        <div className="group-profile-section">
          <div className="profile-avatar-large group-avatar-lg" style={roomPhotoUrl ? { backgroundImage: `url(${roomPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!roomPhotoUrl && toSafeString(settings.name || room.name).charAt(0).toUpperCase()}</div>
          <h3>{settings.name || room.name}</h3>
          <p>{members.length} members</p>
          {isAdmin && (
            <button className="change-photo-btn" onClick={() => roomPhotoInputRef.current?.click()} disabled={isUploadingPhoto} type="button">
              {isUploadingPhoto ? <Loader2 size={14} className="spinner" /> : <Camera size={14} />} Change group photo
            </button>
          )}
          <input ref={roomPhotoInputRef} type="file" hidden accept="image/*" onChange={handleGroupPhotoChange} />
          {isAdmin && (
            <div className="group-name-edit-row">
              <input className="group-name-input" value={settings.name} onChange={(e) => setSettings((p) => ({ ...p, name: e.target.value }))} placeholder="Group name" />
              <button onClick={handleUpdateSettings} disabled={isLoading} className="group-name-save" type="button">{isLoading ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}</button>
            </div>
          )}
        </div>
      )}
      <div className="menu-buttons">
        <button className="menu-btn" onClick={() => setSidebarView('customize')} type="button"><Palette size={18} /><span>Customize chat</span></button>
        <button className="menu-btn" onClick={() => setSidebarView('photos')} type="button"><ImageIcon size={18} /><span>Photos</span>{photoCount > 0 && <span className="menu-count">{photoCount}</span>}</button>
        <button className="menu-btn" onClick={() => setSidebarView('files')} type="button"><FileText size={18} /><span>Files</span>{fileCount > 0 && <span className="menu-count">{fileCount}</span>}</button>
        <button className="menu-btn" onClick={() => setSidebarView('links')} type="button"><LinkIcon size={18} /><span>Links</span>{linkCount > 0 && <span className="menu-count">{linkCount}</span>}</button>
        {isDirect && <button className="menu-btn" onClick={() => setSidebarView('nickname')} type="button"><Edit size={18} /><span>Set nickname</span></button>}
        {!isDirect && (
          <>
            <button className="menu-btn" onClick={() => setSidebarView('members')} type="button"><Users size={18} /><span>Chat members</span><span className="menu-count">{members.length}</span></button>
            {isAdmin && <button className="menu-btn" onClick={() => setSidebarView('awards-select')} type="button"><GraduationCap size={18} /><span>Teacher Awards</span></button>}
            <button className="menu-btn" onClick={() => { navigator.clipboard.writeText(room.invite_code || ''); showToast('Invite code copied!'); }} type="button"><UserPlus size={18} /><span>Invite code</span><span className="menu-count invite">{room.invite_code}</span></button>
          </>
        )}
      </div>
    </div>
  );

  const renderSidebarContent = () => {
    if (searchQuery.trim()) return renderSearchResults();
    switch (sidebarView) {
      case 'menu': return renderMenu();
      case 'photos': return <>{renderVH('Photos')}{renderPhotosView()}</>;
      case 'files': return <>{renderVH('Files')}{renderFilesView()}</>;
      case 'links': return <>{renderVH('Links')}{renderLinksView()}</>;
      case 'nickname': return <>{renderVH('Set Nickname')}{renderNicknameView()}</>;
      case 'members': return <>{renderVH('Members')}{renderMembersView()}</>;
      case 'awards-select': return <>{renderVH('Teacher Awards')}{renderAwardsSelectView()}</>;
      case 'awards-give': return renderAwardsGiveView();
      case 'customize': return <>{renderVH('Customize')}{renderCustomizeView()}</>;
      default: return renderMenu();
    }
  };

  if (!data) {
    return (
      <div className="chat-home-scope chatroom-detail-page">
        <Sidebar />
        <div className="chat-home-main">
          <Navbar />
          <div className="loading-center"><Loader2 size={40} className="spinner" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-home-scope chatroom-detail-page">
      <Sidebar />
      <div 
        className={`chat-home-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ 
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`
        }}
      >
        <Navbar />
        <div className="chat-home-content chatroom-detail-content">
          <section className={`chatroom-detail-grid ${showInfo ? 'with-panel' : 'full-width'}`}>
            <div className="chatroom-conversation" style={{ background: wallpaperStyle }}>
              <div className="conversation-header" style={{ borderBottomColor: `${chatTheme}15` }}>
                <div className="conversation-header-main">
                  <div className="conversation-header-avatar" style={convAvatar ? { backgroundImage: `url(${convAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `linear-gradient(135deg, ${chatTheme}, ${chatTheme}cc)` }} onClick={() => isDirect && otherMember && navToProfile(otherMember.id)}>{!convAvatar && convInit}</div>
                  <div className="conversation-header-text" onClick={() => isDirect && otherMember && navToProfile(otherMember.id)}>
                    <h2>{convTitle}</h2>
                    <p style={{ color: isDirect ? (isOtherOnline ? '#16a34a' : '#8d87b3') : '#8d87b3' }}>{convSub}</p>
                  </div>
                </div>
                <div className="conversation-header-actions">
                  <button className="header-action-btn" onClick={handleHeaderSearch} type="button" style={{ color: chatTheme }}><Search size={18} /></button>
                  <button className="header-action-btn" onClick={() => { setShowInfo((p) => !p); setSidebarView('menu'); setSearchQuery(''); }} type="button" style={{ color: chatTheme }}><Info size={18} /></button>
                </div>
              </div>

              <div className="conversation-body">
                <div className="messages-scroll-area" ref={messagesContainerRef}>
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="chat-input-fixed-bar">
                <div className="chat-input-shell">
                  <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
                  <div className="chat-input-toolbar">
                    <button className="toolbar-icon-btn" onClick={() => setShowAttachModal((p) => !p)} type="button" style={{ color: chatTheme }}><Plus size={20} /></button>
                    <button className="toolbar-icon-btn" onClick={() => setShowComposerEmojis((p) => !p)} type="button" style={{ color: chatTheme }}><Smile size={19} /></button>
                    <button className="toolbar-icon-btn quiz-icon" onClick={() => navigate('/quiz-generator')} type="button" title="Generate Quiz"><ClipboardList size={19} /></button>
                  </div>
                  {showAttachModal && (
                    <div className="attach-modal modern" ref={attachModalRef}>
                      <button onClick={() => imageInputRef.current?.click()} type="button"><Image size={20} /><span>Photo</span></button>
                      <button onClick={() => fileInputRef.current?.click()} type="button"><FileText size={20} /><span>File</span></button>
                      <button onClick={() => navigate('/quiz-generator')} type="button"><ClipboardList size={20} /><span>Quiz</span></button>
                    </div>
                  )}
                  {showComposerEmojis && (
                    <div className="emoji-picker-modern" ref={emojiPickerRef}>
                      <EmojiPicker onEmojiClick={handleComposerEmojiClick} lazyLoadEmojis searchDisabled previewConfig={{ showPreview: false }} width={320} height={380} />
                    </div>
                  )}
                  <div className="chat-input-row">
                    <div className="input-wrapper modern" style={{ borderColor: `${chatTheme}30` }}>
                      <input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} disabled={isSending} />
                    </div>
                    {newMessage.trim() ? (
                      <button className="send-btn modern" onClick={() => sendMessage()} style={{ background: chatTheme, boxShadow: `0 4px 12px ${chatTheme}40` }} type="button" disabled={isSending}>
                        {isSending ? <Loader2 size={18} className="spinner" /> : <Send size={18} />} Send
                      </button>
                    ) : (
                      <button className="send-btn modern like-btn" onClick={() => sendMessage('text', '👍')} type="button" style={{ color: chatTheme }}><ThumbsUp size={18} /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showInfo && (
              <aside className="chatroom-side-panel">
                <div className="side-panel-top">
                  <button className="side-panel-close" onClick={() => setShowInfo(false)} type="button" style={{ color: chatTheme }}><X size={18} /></button>
                  <h3>{isDirect ? 'Chat info' : 'Group info'}</h3>
                </div>
                <div className="side-panel-search">
                  <Search size={16} style={{ color: chatTheme }} />
                  <input ref={searchInputRef} placeholder="Search in conversation..." value={searchQuery} onChange={handleSearchChange} />
                  {searchQuery && <button onClick={() => setSearchQuery('')} type="button"><X size={14} /></button>}
                </div>
                <div className="side-panel-scroll">{renderSidebarContent()}</div>
              </aside>
            )}
          </section>
        </div>
      </div>

      {toast && <div className="toast-notification">{toast}</div>}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <button className="image-preview-close" onClick={() => setPreviewImage(null)} type="button"><X size={18} /></button>
          <img src={previewImage} alt="Preview" className="image-preview-full" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {forwardModal && (
        <div className="modal-overlay" onClick={() => setForwardModal(false)}>
          <div className="forward-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h2>Forward Message</h2>
              <button onClick={() => setForwardModal(false)} type="button"><X size={22} /></button>
            </div>
            <div className="forward-modal-body">
              <div className="forward-search-bar">
                <Search size={18} />
                <input placeholder="Search chats..." value={forwardSearch} onChange={(e) => setForwardSearch(e.target.value)} />
              </div>
              <div className="forward-list">
                {!filteredFwd.length ? <div className="sidebar-empty"><p>No chats available</p></div> : (
                  filteredFwd.map((it) => (
                    <div key={it.id} className="forward-row">
                      <div className="forward-row-left">
                        <div className="forward-avatar" style={{ background: it.avatar ? `url(${it.avatar})` : `linear-gradient(135deg, ${chatTheme}, ${chatTheme}cc)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>{!it.avatar && it.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="forward-name">{it.name}</div>
                      </div>
                      <button className="forward-send-btn" onClick={() => handleForward(it.id)} type="button" style={{ background: chatTheme }}>Send</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatroomDetail;