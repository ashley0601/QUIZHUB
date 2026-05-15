import React, { useContext, useRef, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import API from '../api';
import {
  User,
  Search,
  UserPlus,
  MessageSquare,
  Camera,
  Award,
  FileQuestion,
  Users,
  Check,
  Clock,
  Play,
  FileText,
  Eye,
  Download,
  X,
  Grid3X3,
  BookOpen,
  Trophy,
  TrendingUp,
  Target,
  Zap,
  Star,
  Medal,
  Heart,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Profile.css';

const AWARD_ICONS = {
  top_scorer: Trophy,
  most_improved: TrendingUp,
  perfect_score: Target,
  quiz_master: BookOpen,
  fastest_finisher: Zap,
  outstanding: Star,
  heart_of_class: Heart,
  participation: Medal,
};

const AWARD_COLORS = {
  top_scorer: '#f59e0b',
  most_improved: '#10b981',
  perfect_score: '#ef4444',
  quiz_master: '#8b5cf6',
  fastest_finisher: '#f97316',
  outstanding: '#ec4899',
  heart_of_class: '#ef4444',
  participation: '#6366f1',
};

const Profile = () => {
  const { user: authUser, setUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { userId } = useParams();

  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [requestId, setRequestId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [viewingLesson, setViewingLesson] = useState(null);
  const [contentTab, setContentTab] = useState('quizzes');

  const safeUpdateUser = (data) => {
    if (typeof updateUser === 'function') {
      updateUser(data);
    } else if (typeof setUser === 'function') {
      setUser((prev) => ({ ...prev, ...data }));
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url}`;
  };

  const getInitials = (person) => {
    const first = person?.first_name?.[0] || '';
    const last = person?.last_name?.[0] || '';

    if (first || last) return `${first}${last}`.toUpperCase();

    const username =
      person?.username ||
      person?.display_name ||
      person?.name ||
      'U';

    return username.slice(0, 2).toUpperCase();
  };

  const normalizeFriend = (friend) => ({
    ...friend,
    display_name:
      friend.username ||
      `${friend.first_name || ''} ${friend.last_name || ''}`.trim() ||
      'User',
    profile_pic: friend.profile_pic || friend.profile_picture || null
  });

  const fetchProfile = useCallback(async () => {
    try {
      const endpoint = userId ? `/profile/${userId}/` : '/profile/';
      const res = await API.get(endpoint);

      const data = res.data;

      setProfileData({
        ...data,
        awards: data.awards || [],
        quizzes: data.quizzes || [],
        lessons: data.lessons || [],
        friends: (data.friends || []).map(normalizeFriend)
      });

      setIsOwner(data.is_owner);

      if (!data.is_owner) {
        setFriendStatus(data.friend_status || 'none');
        setRequestId(data.request_id || null);
      } else {
        setFriendStatus('none');
        setRequestId(null);
      }
    } catch (e) {
      console.error('Profile load error', e);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const searchUsers = useCallback(async () => {
    try {
      const res = await API.get(`/users/search/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults((res.data || []).map(normalizeFriend));
    } catch (e) {
      console.error('Search error', e);
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) searchUsers();
      else setSearchResults([]);
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchUsers]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploading(true);
    try {
      const res = await API.patch('/profile/', formData);

      safeUpdateUser(res.data);

      setProfileData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          profile_picture: res.data.profile_picture
        }
      }));
    } catch (err) {
      alert('Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const startChat = async (friendId) => {
    try {
      const res = await API.post('/chat/chatrooms/', {
        is_direct: true,
        user_id: friendId
      });
      navigate(`/chatrooms/${res.data.id}`);
    } catch (e) {
      alert('Could not start chat');
    }
  };

  const handleAddFriend = async () => {
    try {
      await API.post(`/friends/request/${profileData.user.id}/`);
      setFriendStatus('sent');
      alert('Friend request sent!');
    } catch (e) {
      alert('Error sending request');
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await API.post(`/friends/handle/${requestId}/`, { action: 'accept' });
      setFriendStatus('friends');
    } catch (e) {
      alert('Error accepting request');
    }
  };

  if (!profileData) {
    return <div className="loading-center">Loading...</div>;
  }

  const quizCount = profileData.quizzes.length;
  const lessonCount = profileData.lessons.length;
  const friendCount = profileData.friends.length;
  const awardCount = profileData.awards.length;

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="content-body">
          <div className="profile-container">
            <div className="profile-card cover-card">
              <div className="profile-header-inner">
                <div
                  className={`avatar-container ${isOwner ? 'clickable' : ''}`}
                  onClick={() => isOwner && fileInputRef.current?.click()}
                >
                  {profileData.user?.profile_picture ? (
                    <img
                      src={getImageUrl(profileData.user.profile_picture)}
                      alt="Profile"
                      className="main-avatar"
                    />
                  ) : (
                    <div className="main-avatar placeholder">
                      <span className="initials big">{getInitials(profileData.user)}</span>
                    </div>
                  )}

                  {isOwner && (
                    <div className="camera-icon">
                      {uploading ? '...' : <Camera size={18} />}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    hidden
                    accept="image/*"
                    disabled={!isOwner}
                  />
                </div>

                <h1>
                  {profileData.user?.first_name} {profileData.user?.last_name}
                </h1>

                <p className="sub-text">
                  {profileData.user?.role} • ID: {profileData.user?.unique_id}
                </p>

                {!isOwner && (
                  <div className="visitor-actions">
                    {friendStatus === 'friends' && (
                      <>
                        <button
                          className="fb-btn secondary"
                          onClick={() => startChat(profileData.user.id)}
                        >
                          <MessageSquare size={16} /> Message
                        </button>
                        <button className="fb-btn secondary">
                          <User size={16} /> Friends
                        </button>
                      </>
                    )}

                    {friendStatus === 'sent' && (
                      <button className="fb-btn secondary disabled">
                        <Clock size={16} /> Pending
                      </button>
                    )}

                    {friendStatus === 'received' && (
                      <button className="fb-btn primary" onClick={handleAcceptRequest}>
                        <Check size={16} /> Accept Request
                      </button>
                    )}

                    {friendStatus === 'none' && (
                      <button className="fb-btn primary" onClick={handleAddFriend}>
                        <UserPlus size={16} /> Add Friend
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-card search-card fancy-card">
              <div className="section-header">
                <h3 className="card-title">
                  <Search size={20} /> Find Friends
                </h3>
                <span className="section-chip">Search classmates</span>
              </div>

              <div className="search-wrapper-relative">
                <div className="search-input-flex">
                  <Search className="search-icon" size={18} />
                  <input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="user-row"
                        onClick={() => {
                          navigate(`/profile/${u.id}`);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <div className="user-info">
                          {u.profile_pic ? (
                            <img
                              src={getImageUrl(u.profile_pic)}
                              alt="Pic"
                              className="avatar-img"
                              style={{ width: 42, height: 42 }}
                            />
                          ) : (
                            <div className="avatar-placeholder sm initials-avatar">
                              {getInitials(u)}
                            </div>
                          )}

                          <div>
                            <strong>{u.display_name}</strong>
                            <small>{u.unique_id || u.username}</small>
                          </div>
                        </div>

                        <button className="fb-btn secondary btn-sm">View</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {profileData.user?.role?.toLowerCase() !== 'teacher' && (
              <div className="profile-card fancy-card">
                <div className="section-header">
                  <h3 className="card-title">
                    <Award size={20} /> Awards
                  </h3>
                  <span className="section-chip">
                    {awardCount} Achievement{awardCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {awardCount > 0 ? (
                  <div className="awards-grid">
                    {profileData.awards.map((award, i) => {
                      const IconComponent = AWARD_ICONS[award.award_type] || Award;
                      const iconColor = AWARD_COLORS[award.award_type] || '#7c4dff';

                      return (
                        <div key={award.id || i} className="award-card-enhanced">
                          <div className="award-icon-wrapper" style={{ background: `${iconColor}15` }}>
                            <IconComponent size={24} style={{ color: iconColor }} />
                          </div>
                          <div className="award-info">
                            <strong>{award.title || award.award_name}</strong>
                            <div className="given-by">
                              Given by {award.given_by}
                            </div>
                            {award.chatroom_name && (
                              <span className="chatroom-badge">
                                {award.chatroom_name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <Award size={34} />
                    <h4>No awards yet</h4>
                    <p>Achievements and badges from your teachers will appear here.</p>
                  </div>
                )}
              </div>
            )}

            <div className="profile-card fancy-card">
              <div className="section-header">
                <h3 className="card-title">
                  <Users size={20} /> Friends <span className="count">({friendCount})</span>
                </h3>
                <span className="section-chip">Connected People</span>
              </div>

              <div className="friends-grid enhanced-friends-grid">
                {profileData.friends.length === 0 && (
                  <div className="empty-state-card">
                    <Users size={34} />
                    <h4>No friends yet</h4>
                    <p>Start connecting with classmates and teachers.</p>
                  </div>
                )}

                {profileData.friends.map((f) => (
                  <div
                    key={f.id}
                    className="friend-card enhanced-friend-card"
                    onClick={() => navigate(`/profile/${f.id}`)}
                  >
                    <div className="friend-card-top-glow"></div>

                    {f.profile_pic ? (
                      <img
                        src={getImageUrl(f.profile_pic)}
                        alt="Pic"
                        className="avatar-img lg"
                      />
                    ) : (
                      <div className="avatar-placeholder lg initials-avatar">
                        {getInitials(f)}
                      </div>
                    )}

                    <strong>{f.display_name}</strong>
                    <span>View Profile</span>

                    <button className="mini-profile-btn">Open Profile</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-card fancy-card learning-content-card">
              <div className="bg-orb orb-one"></div>
              <div className="bg-orb orb-two"></div>

              <div className="content-toggle-header">
                <div>
                  <h3 className="card-title">
                    <Grid3X3 size={20} /> Learning Content
                  </h3>
                  <p className="section-subtitle">
                    Browse quizzes and uploaded learning materials.
                  </p>
                </div>

                <div className="content-toggle glass-toggle">
                  <button
                    className={`toggle-btn ${contentTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setContentTab('quizzes')}
                  >
                    <FileQuestion size={16} />
                    Quizzes
                  </button>
                  <button
                    className={`toggle-btn ${contentTab === 'lessons' ? 'active' : ''}`}
                    onClick={() => setContentTab('lessons')}
                  >
                    <BookOpen size={16} />
                    Lessons
                  </button>
                </div>
              </div>

              {contentTab === 'quizzes' && (
                <>
                  {profileData.quizzes.length > 0 ? (
                    <div className="content-box-grid">
                      {profileData.quizzes.map((q) => (
                        <div key={q.id} className="content-box-card">
                          <div className="content-box-top">
                            <div className="content-icon-wrap quiz">
                              <FileQuestion size={20} />
                            </div>
                            <span className="content-badge">Quiz</span>
                          </div>

                          <h4 className="content-box-title">{q.title}</h4>

                          <p className="content-box-subtitle">
                            Interactive quiz generated for learning and review.
                          </p>

                          <div className="content-box-stats">
                            <span className="stat-chip">Practice Assessment</span>
                          </div>

                          <div className="content-box-actions">
                            <button
                              className="fb-btn primary content-box-btn"
                              onClick={() => navigate(`/quiz/take/${q.id}`)}
                            >
                              <Play size={14} /> Take Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-card">
                      <FileQuestion size={34} />
                      <h4>No quizzes generated yet</h4>
                      <p>Generated quizzes will appear here.</p>
                    </div>
                  )}
                </>
              )}

              {contentTab === 'lessons' && (
                <>
                  {profileData.lessons.length > 0 ? (
                    <div className="content-box-grid">
                      {profileData.lessons.map((l) => (
                        <div key={l.id} className="content-box-card">
                          <div className="content-box-top">
                            <div className="content-icon-wrap lesson">
                              <FileText size={20} />
                            </div>
                            <span className="content-badge">Lesson</span>
                          </div>

                          <h4 className="content-box-title">{l.title}</h4>

                          <p className="content-box-subtitle">
                            Uploaded learning material for reading and review.
                          </p>

                          <div className="content-box-stats">
                            <span className="stat-chip">Study Material</span>
                          </div>

                          <div className="content-box-actions">
                            <button
                              className="fb-btn secondary content-box-btn"
                              onClick={() => setViewingLesson(l)}
                            >
                              <Eye size={14} /> View
                            </button>

                            <a
                              href={getImageUrl(l.file)}
                              download
                              className="fb-btn primary content-box-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={14} /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-card">
                      <FileText size={34} />
                      <h4>No lessons uploaded yet</h4>
                      <p>Uploaded lessons will appear here.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewingLesson && (
        <div className="doc-viewer-modal-overlay">
          <div className="doc-viewer-modal">
            <div className="doc-viewer-header">
              <h3>{viewingLesson.title}</h3>

              <div className="doc-viewer-actions">
                <a
                  href={getImageUrl(viewingLesson.file)}
                  download
                  className="fb-btn primary btn-sm"
                >
                  <Download size={16} /> Download
                </a>

                <button
                  className="btn-icon-close"
                  onClick={() => setViewingLesson(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="doc-viewer-content">
              <iframe
                src={getImageUrl(viewingLesson.file)}
                title="Document Viewer"
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;