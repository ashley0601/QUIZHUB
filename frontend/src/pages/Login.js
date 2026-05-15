// ===== Login.jsx =====
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Loader2,
  ArrowRight,
  Sparkles,
  Trophy,
  Brain,
  Zap,
  BookOpen,
  Star,
  Rocket,
  GraduationCap,
  CheckCircle2,
  Shield,
} from 'lucide-react';

import quizhubLogo from '../assets/quizhub-logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Invalid credentials');
      } else {
        setError('Cannot connect to server');
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f1ff;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        /* ── Blobs ── */
        .login-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          z-index: 0;
          pointer-events: none;
          animation: loginBlobFloat 14s infinite ease-in-out;
        }
        .login-blob-1 { width: 500px; height: 500px; background: #a78bfa; top: -120px; left: -120px; }
        .login-blob-2 { width: 600px; height: 600px; background: #60a5fa; bottom: -150px; right: -150px; animation-delay: -7s; }
        .login-blob-3 { width: 350px; height: 350px; background: #f472b6; top: 45%; left: 50%; animation-delay: -3.5s; }

        @keyframes loginBlobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.06); }
          66% { transform: translate(-30px, 30px) scale(0.94); }
        }

        /* ── Nav ── */
        .login-nav {
          position: relative;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.45);
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
        }
        .login-nav-logo {
          height: 40px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(124, 77, 255, 0.15));
          transition: transform 0.2s;
        }
        .login-nav-logo:hover { transform: scale(1.05); }
        .login-nav-actions {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .login-nav-actions a {
          color: #5b5570;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: color 0.2s;
        }
        .login-nav-actions a:hover { color: #7c3aed; }
        .login-nav-cta {
          background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
          color: white !important;
          padding: 10px 22px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(109, 74, 255, 0.25);
          transition: all 0.2s !important;
        }
        .login-nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(109, 74, 255, 0.35) !important;
          color: white !important;
        }

        /* ── Main ── */
        .login-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 24px 60px;
          position: relative;
          z-index: 10;
        }

        .login-card {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          width: 100%;
          max-width: 1020px;
          min-height: 660px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 30px 80px rgba(109, 74, 255, 0.08),
            0 0 0 1px rgba(255,255,255,0.5) inset;
          overflow: hidden;
        }

        /* ── Form Side ── */
        .login-form-side {
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .login-form-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          background: rgba(139, 92, 246, 0.1);
          color: #7c3aed;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          margin-bottom: 14px;
        }
        .login-form-header h1 {
          font-size: 32px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .login-form-header p {
          font-size: 14px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.5;
          margin-bottom: 36px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Inputs */
        .login-field { margin-bottom: 20px; }
        .login-field label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #4c4884;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-wrap .field-icon {
          position: absolute;
          left: 14px;
          color: #a5a0c8;
          pointer-events: none;
          transition: color 0.25s;
        }
        .login-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 2px solid #e9e5ff;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          font-weight: 600;
          color: #1e1b4b;
          outline: none;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input::placeholder { color: #c4bfee; font-weight: 500; }
        .login-input:focus {
          border-color: #8b5cf6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1), 0 6px 12px rgba(139, 92, 246, 0.04);
          transform: translateY(-1px);
        }
        .login-input:focus ~ .field-icon,
        .login-input-wrap:focus-within .field-icon { color: #8b5cf6; }
        .login-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-pw-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #a5a0c8;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          transition: all 0.2s;
        }
        .login-pw-toggle:hover { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }

        /* Error */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          animation: loginShake 0.4s ease;
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        /* Meta */
        .login-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .login-meta label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #726b88;
          font-weight: 500;
          cursor: pointer;
        }
        .login-meta label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #8b5cf6;
          cursor: pointer;
        }
        .login-meta a {
          font-size: 13px;
          color: #7c3aed;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-meta a:hover { color: #4c1d95; }

        /* Button */
        .login-submit {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 12px 28px rgba(99, 102, 241, 0.3);
          position: relative;
          overflow: hidden;
        }
        .login-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.6s;
        }
        .login-submit:hover::before { left: 100%; }
        .login-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(99, 102, 241, 0.4);
        }
        .login-submit:active {
          transform: translateY(0) scale(0.98);
        }
        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2) !important;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.7s linear infinite; }

        /* Switch */
        .login-switch {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #726b88;
        }
        .login-switch a {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: none;
          margin-left: 4px;
          transition: color 0.2s;
        }
        .login-switch a:hover { color: #4c1d95; }

        /* ── Visual Side ── */
        .login-visual-side {
          background: linear-gradient(145deg, #7c3aed 0%, #6366f1 40%, #4f46e5 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          overflow: hidden;
        }
        .login-visual-side::before {
          content: '';
          position: absolute;
          width: 220%;
          height: 220%;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          opacity: 0.35;
          animation: loginDotDrift 25s linear infinite;
        }
        @keyframes loginDotDrift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(22px, 22px); }
        }

        .login-ambient {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-amb-1 {
          width: 280px; height: 280px;
          background: rgba(255,255,255,0.06);
          top: -100px; left: -100px;
          animation: loginAmbPulse 8s ease-in-out infinite;
        }
        .login-amb-2 {
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.05);
          bottom: -60px; right: -60px;
          animation: loginAmbPulse 8s ease-in-out infinite 4s;
        }
        @keyframes loginAmbPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        .login-float-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.12);
          z-index: 1;
          animation: loginFloatIcon 7s infinite ease-in-out;
        }
        .lfi-1 { top: 8%; left: 12%; animation-delay: 0s; }
        .lfi-2 { top: 14%; right: 10%; animation-delay: -1.5s; }
        .lfi-3 { bottom: 20%; left: 8%; animation-delay: -3s; }
        .lfi-4 { bottom: 10%; right: 12%; animation-delay: -4.5s; }
        .lfi-5 { top: 45%; left: 5%; animation-delay: -2s; }
        .lfi-6 { top: 5%; left: 52%; animation-delay: -5s; }
        .lfi-7 { bottom: 42%; right: 6%; animation-delay: -6s; }

        @keyframes loginFloatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(8deg); }
        }

        .login-visual-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
        }
        .login-big-logo {
          width: 200px;
          height: auto;
          margin: 0 auto 32px;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.2));
          animation: loginLogoHover 5s ease-in-out infinite;
        }
        @keyframes loginLogoHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .login-visual-content h2 {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 10px;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        .login-visual-content h2 span {
          display: inline-block;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          padding: 2px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .login-visual-content > p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
          line-height: 1.65;
          margin-bottom: 32px;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .login-feature-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 320px;
          margin: 0 auto 32px;
        }
        .login-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          transition: all 0.25s;
        }
        .login-pill:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .login-stats {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        .login-stat-box {
          min-width: 120px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 18px 20px;
          text-align: center;
          transition: all 0.25s;
        }
        .login-stat-box:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
        }
        .login-stat-box h3 {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 2px;
        }
        .login-stat-box span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── Responsive ── */
        @media (max-width: 920px) {
          .login-nav { padding: 14px 20px; }
          .login-nav-actions a:not(.login-nav-cta) { display: none; }
          .login-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .login-visual-side {
            min-height: 260px;
            padding: 32px 24px;
          }
          .login-big-logo { width: 130px; margin-bottom: 20px; }
          .login-visual-content h2 { font-size: 22px; }
          .login-feature-pills { gap: 8px; }
          .login-pill { font-size: 11px; padding: 8px 12px; }
          .login-stats { gap: 10px; }
          .login-stat-box { min-width: 100px; padding: 14px 16px; }
          .login-stat-box h3 { font-size: 22px; }
          .login-form-side { padding: 36px 28px; }
          .login-form-header h1 { font-size: 26px; }
          .login-float-icon { display: none; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-blob login-blob-1"></div>
        <div className="login-blob login-blob-2"></div>
        <div className="login-blob login-blob-3"></div>

        <nav className="login-nav">
          <Link to="/">
            <img src={quizhubLogo} alt="QuizHub" className="login-nav-logo" />
          </Link>
          <div className="login-nav-actions">
            <Link to="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#about">About</a>
            <Link to="/register" className="login-nav-cta">Sign Up</Link>
          </div>
        </nav>

        <div className="login-main">
          <div className="login-card">
            {/* LEFT */}
            <div className="login-form-side">
              <div className="login-form-header">
                <div className="login-form-badge">
                  <Sparkles size={13} />
                  Welcome back
                </div>
                <h1>Sign in to your account</h1>
                <p>
                  <Zap size={15} style={{ color: '#8b5cf6' }} />
                  Continue your learning journey.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label>Username</label>
                  <div className="login-input-wrap">
                    <input
                      type="text"
                      className="login-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      disabled={isLoading}
                    />
                    <User size={15} className="field-icon" />
                  </div>
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <div className="login-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <Lock size={15} className="field-icon" />
                    <button
                      type="button"
                      className="login-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="login-error">
                    <Shield size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <div className="login-meta">
                  <label>
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <button type="submit" className="login-submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="login-switch">
                Don&apos;t have an account? <Link to="/register">Create one</Link>
              </p>
            </div>

            {/* RIGHT */}
            <div className="login-visual-side">
              <div className="login-ambient login-amb-1"></div>
              <div className="login-ambient login-amb-2"></div>

              <GraduationCap size={26} className="login-float-icon lfi-1" />
              <Trophy size={22} className="login-float-icon lfi-2" />
              <Brain size={28} className="login-float-icon lfi-3" />
              <Zap size={20} className="login-float-icon lfi-4" />
              <BookOpen size={24} className="login-float-icon lfi-5" />
              <Star size={18} className="login-float-icon lfi-6" />
              <Rocket size={22} className="login-float-icon lfi-7" />

              <div className="login-visual-content">
                <img src={quizhubLogo} alt="QuizHub" className="login-big-logo" />
                <h2>
                  Ready to <span>level up</span>?
                </h2>
                <p>
                  Pick up right where you left off. Your quizzes, progress, and achievements are waiting.
                </p>

                <div className="login-feature-pills">
                  <div className="login-pill">
                    <Trophy size={13} />
                    Leaderboards
                  </div>
                  <div className="login-pill">
                    <Brain size={13} />
                    Smart Prep
                  </div>
                  <div className="login-pill">
                    <Zap size={13} />
                    AI Quizzes
                  </div>
                </div>

                <div className="login-stats">
                  <div className="login-stat-box">
                    <h3>10K+</h3>
                    <span>Students</span>
                  </div>
                  <div className="login-stat-box">
                    <h3>95%</h3>
                    <span>Engagement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;