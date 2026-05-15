import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import QuizGenerator from './pages/QuizGenerator';
import TakeQuiz from './pages/TakeQuiz';
import Library from './pages/Library';
import ChatroomHome from './pages/ChatroomHome';
import ChatroomDetail from './pages/ChatroomDetail';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateManualQuiz from './pages/CreateManualQuiz';
import JoinManualQuiz from './pages/JoinManualQuiz';
import TakeManualQuiz from './pages/TakeManualQuiz';
import ManualQuizResults from './pages/ManualQuizResults';
import QuizInviteStart from './pages/QuizInviteStart';

// NEW: Notifications Page
import NotificationsPage from './pages/NotificationsPage';

import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/quiz-generator" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
          <Route path="/quiz/take/:quiz_id" element={<ProtectedRoute><TakeQuiz /></ProtectedRoute>} />
          <Route path="/quiz/invite/:inviteCode" element={<QuizInviteStart />} />

          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />

          <Route path="/chatrooms" element={<ProtectedRoute><ChatroomHome /></ProtectedRoute>} />
          <Route path="/chatrooms/:chatroomId" element={<ProtectedRoute><ChatroomDetail /></ProtectedRoute>} />

          <Route path="/create-quiz" element={<ProtectedRoute><CreateManualQuiz /></ProtectedRoute>} />
          <Route path="/join-quiz/:code" element={<ProtectedRoute><JoinManualQuiz /></ProtectedRoute>} />
          <Route path="/take-manual-quiz/:id" element={<ProtectedRoute><TakeManualQuiz /></ProtectedRoute>} />
          <Route path="/manual-quiz-results/:id" element={<ProtectedRoute><ManualQuizResults /></ProtectedRoute>} />

          {/* NEW: Notifications Page */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
