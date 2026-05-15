import React, { useState, useEffect, useRef } from 'react';
import API from '../api';
import MainLayout from '../components/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, User, ArrowLeft, Share2 } from 'lucide-react';
import '../styles/ChatRoom.css';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  const ws = useRef(null);

  useEffect(() => {
    fetchDetails();
    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (showShare) {
      API.get('/quiz/library/')
        .then((res) => setQuizzes(Array.isArray(res.data) ? res.data : []))
        .catch(() => setQuizzes([]));
    }
  }, [showShare]);

  const fetchDetails = async () => {
    try {
      const res = await API.get(`/chat/${roomId}/`);
      setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
      setMembers(Array.isArray(res.data.members) ? res.data.members : []);
      setRoomInfo(res.data.room || null);
    } catch {
      navigate('/chatrooms');
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');

    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/?token=${token}`);

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [
        ...prev,
        {
          sender: data.sender,
          sender_id: data.sender_id,
          content: data.message,
          type: data.type,
          quiz_id: data.quiz_id,
        },
      ]);
    };
  };

  const sendMessage = (type = 'chat_message', payload = null) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const data =
      payload || {
        type: 'chat_message',
        message: message,
      };

    if (!payload && !message.trim()) return;

    ws.current.send(JSON.stringify(data));
    setMessage('');
  };

  const handleShareQuiz = (quizId, title) => {
    sendMessage('share_quiz', {
      type: 'share_quiz',
      quiz_id: quizId,
      title: title,
    });
    setShowShare(false);
  };

  const currentUserId = String(localStorage.getItem('user_id') || '');

  return (
    <MainLayout>
      <div className="chat-room-container">
        <div className="chat-sidebar">
          <h3>Members</h3>

          {members.map((m) => (
            <div key={m.id} className="member-item">
              <User size={16} />
              <span className="member-name">{m.username}</span>
              <span className="role">{m.role}</span>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-header">
            <button className="btn-icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>

            <div className="chat-header-meta">
              <h3>{roomInfo?.name || 'Chat Room'}</h3>
              <span className="code">Code: {roomInfo?.invite_code || '—'}</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => {
              const isOwn = String(msg.sender_id) === currentUserId;

              return (
                <div key={i} className={`message ${isOwn ? 'own' : ''}`}>
                  <div className="msg-sender">{msg.sender}</div>

                  <div className="msg-content">
                    {msg.type === 'quiz' ? (
                      <div
                        className="shared-quiz"
                        onClick={() => navigate(`/quiz/take/${msg.quiz_id}`)}
                      >
                        <Share2 size={18} />
                        <span>{msg.content}</span>
                        <button className="btn-small">Take Quiz</button>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-input-area">
            <button className="btn-icon" onClick={() => setShowShare((prev) => !prev)}>
              <Share2 size={20} />
            </button>

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />

            <button className="btn" onClick={() => sendMessage()}>
              <Send size={18} />
            </button>
          </div>

          {showShare && (
            <div className="share-popup">
              <h4>Select Quiz to Share</h4>

              {quizzes.length > 0 ? (
                quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="share-item"
                    onClick={() => handleShareQuiz(q.id, q.title)}
                  >
                    {q.title}
                  </div>
                ))
              ) : (
                <div className="share-empty">No quizzes available</div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatRoom;