// ===== ForgotPassword.jsx =====
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  Lock,
  MailCheck,
  Sparkles,
  Trophy,
  Brain,
  Zap,
  BookOpen,
  Star,
  Rocket,
  GraduationCap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

import quizhubLogo from '../assets/quizhub-logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call — replace with your actual API
    try {
      // await axios.post('/api/auth/forgot-password/', { email });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .fp-root {
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
        .fp-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          z-index: 0;
          pointer-events: none;
          animation: fpBlobFloat 14s infinite ease-in-out;
        }
        .fp-blob-1 { width: 500px; height: 500px; background: #a78bfa; top: -120px; right: -120px; }
        .fp-blob-2 { width: 600px; height: 600px; background: #60a5fa; bottom: -150px; left: -150px; animation-delay: -7s; }
        .fp-blob-3 { width: 350px; height: 350px; background: #f472b6; top: 40%; right: 40%; animation-delay: -3.5s; }

        @keyframes fpBlobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.06); }
          66% { transform: translate(-30px, 30px) scale(0.94); }
        }

        /* ── Nav ── */
        .fp-nav {
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
        .fp-nav-logo {
          height: 40px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(124, 77, 255, 0.15));
          transition: transform 0.2s;
        }
        .fp-nav-logo:hover { transform: scale(1.05); }
        .fp-nav-back {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7c3aed;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.1);
          transition: all 0.2s;
        }
        .fp-nav-back:hover {
          background: rgba(139, 92, 246, 0.18);
          transform: translateX(-2px);
        }

        /* ── Main ── */
        .fp-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 24px 60px;
          position: relative;
          z-index: 10;
        }

        .fp-card {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          width: 100%;
          max-width: 1020px;
          min-height: 600px;
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
        .fp-form-side {
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .fp-form-badge {
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
          width: fit-content;
        }
        .fp-form-header h1 {
          font-size: 30px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 8px;
        }
        .fp-form-header p {
          font-size: 14px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.65;
          margin-bottom: 36px;
        }

        /* Input */
        .fp-field { margin-bottom: 24px; }
        .fp-field label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #4c4884;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .fp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fp-input-wrap .field-icon {
          position: absolute;
          left: 14px;
          color: #a5a0c8;
          pointer-events: none;
          transition: color 0.25s;
        }
        .fp-input {
          width: 100%;
          padding: 14px 14px 14px 42px;
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
        .fp-input::placeholder { color: #c4bfee; font-weight: 500; }
        .fp-input:focus {
          border-color: #8b5cf6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1), 0 6px 12px rgba(139, 92, 246, 0.04);
          transform: translateY(-1px);
        }
        .fp-input:focus ~ .field-icon,
        .fp-input-wrap:focus-within .field-icon { color: #8b5cf6; }
        .fp-input:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Error */
        .fp-error {
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
          margin-bottom: 24px;
          animation: fpShake 0.4s ease;
        }
        @keyframes fpShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        /* Button */
        .fp-submit {
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
        .fp-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.6s;
        }
        .fp-submit:hover::before { left: 100%; }
        .fp-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(99, 102, 241, 0.4);
        }
        .fp-submit:active {
          transform: translateY(0) scale(0.98);
        }
        .fp-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2) !important;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.7s linear infinite; }

        /* Switch */
        .fp-switch {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #726b88;
        }
        .fp-switch a {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: none;
          margin-left: 4px;
          transition: color 0.2s;
        }
        .fp-switch a:hover { color: #4c1d95; }

        /* ── Success State ── */
        .fp-success {
          text-align: center;
          padding: 20px 0;
        }
        .fp-success-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #059669;
          animation: fpSuccessPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fpSuccessPop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .fp-success h2 {
          font-size: 22px;
          font-weight: 900;
          color: #1e1b4b;
          margin-bottom: 8px;
        }
        .fp-success p {
          font-size: 14px;
          color: #726b88;
          line-height: 1.6;
          max-width: 320px;
          margin: 0 auto 6px;
        }
        .fp-success-email {
          font-weight: 800;
          color: #7c3aed;
        }
        .fp-success-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.12);
          border-radius: 12px;
          padding: 14px 16px;
          margin: 20px auto 0;
          max-width: 320px;
          text-align: left;
        }
        .fp-success-note svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #8b5cf6;
        }
        .fp-success-note span {
          font-size: 12px;
          color: #6366f1;
          font-weight: 600;
          line-height: 1.5;
        }

        /* ── Visual Side ── */
        .fp-visual-side {
          background: linear-gradient(145deg, #7c3aed 0%, #6366f1 40%, #4f46e5 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          overflow: hidden;
        }
        .fp-visual-side::before {
          content: '';
          position: absolute;
          width: 220%;
          height: 220%;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          opacity: 0.35;
          animation: fpDotDrift 25s linear infinite;
        }
        @keyframes fpDotDrift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(22px, 22px); }
        }

        .fp-ambient {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .fp-amb-1 {
          width: 280px; height: 280px;
          background: rgba(255,255,255,0.06);
          top: -100px; right: -100px;
          animation: fpAmbPulse 8s ease-in-out infinite;
        }
        .fp-amb-2 {
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.05);
          bottom: -60px; left: -60px;
          animation: fpAmbPulse 8s ease-in-out infinite 4s;
        }
        @keyframes fpAmbPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        .fp-float-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.12);
          z-index: 1;
          animation: fpFloatIcon 7s infinite ease-in-out;
        }
        .ffi-1 { top: 8%; right: 12%; animation-delay: 0s; }
        .ffi-2 { top: 14%; left: 10%; animation-delay: -1.5s; }
        .ffi-3 { bottom: 20%; right: 8%; animation-delay: -3s; }
        .ffi-4 { bottom: 10%; left: 12%; animation-delay: -4.5s; }
        .ffi-5 { top: 45%; right: 5%; animation-delay: -2s; }
        .ffi-6 { top: 5%; left: 48%; animation-delay: -5s; }
        .ffi-7 { bottom: 42%; left: 6%; animation-delay: -6s; }

        @keyframes fpFloatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(8deg); }
        }

        .fp-visual-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
        }
        .fp-big-logo {
          width: 200px;
          height: auto;
          margin: 0 auto 32px;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.2));
          animation: fpLogoHover 5s ease-in-out infinite;
        }
        @keyframes fpLogoHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .fp-visual-content h2 {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 10px;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        .fp-visual-content h2 span {
          display: inline-block;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          padding: 2px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .fp-visual-content > p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
          line-height: 1.65;
          margin-bottom: 32px;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .fp-feature-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 320px;
          margin: 0 auto 32px;
        }
        .fp-pill {
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
        .fp-pill:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .fp-security-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          max-width: 300px;
          margin: 0 auto;
          transition: all 0.25s;
        }
        .fp-security-badge:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
        }
        .fp-security-badge svg {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.6);
        }
        .fp-security-badge span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          line-height: 1.4;
        }

        /* ── Responsive ── */
        @media (max-width: 920px) {
          .fp-nav { padding: 14px 20px; }
          .fp-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .fp-visual-side {
            min-height: 240px;
            padding: 32px 24px;
          }
          .fp-big-logo { width: 130px; margin-bottom: 20px; }
          .fp-visual-content h2 { font-size: 22px; }
          .fp-feature-pills { gap: 8px; }
          .fp-pill { font-size: 11px; padding: 8px 12px; }
          .fp-security-badge { max-width: 260px; }
          .fp-form-side { padding: 36px 28px; }
          .fp-form-header h1 { font-size: 24px; }
          .fp-float-icon { display: none; }
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-blob fp-blob-1"></div>
        <div className="fp-blob fp-blob-2"></div>
        <div className="fp-blob fp-blob-3"></div>

        <nav className="fp-nav">
          <Link to="/">
            <img src={quizhubLogo} alt="QuizHub" className="fp-nav-logo" />
          </Link>
          <Link to="/login" className="fp-nav-back">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </nav>

        <div className="fp-main">
          <div className="fp-card">
            {/* LEFT */}
            <div className="fp-form-side">
              {!isSubmitted ? (
                <>
                  <div className="fp-form-header">
                    <div className="fp-form-badge">
                      <KeyRound size={13} />
                      Account Recovery
                    </div>
                    <h1>Forgot your password?</h1>
                    <p>
                      No worries! Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="fp-field">
                      <label>Email Address</label>
                      <div className="fp-input-wrap">
                        <input
                          type="email"
                          className="fp-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                        />
                        <Mail size={15} className="field-icon" />
                      </div>
                    </div>

                    {error && (
                      <div className="fp-error">
                        <Shield size={15} style={{ flexShrink: 0 }} />
                        {error}
                      </div>
                    )}

                    <button type="submit" className="fp-submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 size={18} className="spin" />
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="fp-switch">
                    Remember your password? <Link to="/login">Sign in</Link>
                  </p>
                </>
              ) : (
                <div className="fp-success">
                  <div className="fp-success-icon">
                    <MailCheck size={32} />
                  </div>
                  <h2>Check your email</h2>
                  <p>
                    We&apos;ve sent a password reset link to
                  </p>
                  <p className="fp-success-email">{email}</p>
                  <div className="fp-success-note">
                    <Sparkles size={16} />
                    <span>
                      Didn&apos;t receive the email? Check your spam folder or try again with a different email address.
                    </span>
                  </div>
                  <div style={{ marginTop: '28px' }}>
                    <Link to="/login" className="fp-submit" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%' }}>
                      Back to Login
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  <p className="fp-switch" style={{ marginTop: '16px' }}>
                    Wrong email?{' '}
                    <button
                      onClick={() => { setIsSubmitted(false); setEmail(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#7c3aed',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="fp-visual-side">
              <div className="fp-ambient fp-amb-1"></div>
              <div className="fp-ambient fp-amb-2"></div>

              <KeyRound size={26} className="fp-float-icon ffi-1" />
              <Lock size={22} className="fp-float-icon ffi-2" />
              <Shield size={28} className="fp-float-icon ffi-3" />
              <Mail size={20} className="fp-float-icon ffi-4" />
              <GraduationCap size={24} className="fp-float-icon ffi-5" />
              <Star size={18} className="fp-float-icon ffi-6" />
              <CheckCircle2 size={22} className="fp-float-icon ffi-7" />

              <div className="fp-visual-content">
                <img src={quizhubLogo} alt="QuizHub" className="fp-big-logo" />
                <h2>
                  Secure <span>account</span> access
                </h2>
                <p>
                  Your account security is our priority. Resetting your password takes just a few steps.
                </p>

                <div className="fp-feature-pills">
                  <div className="fp-pill">
                    <Shield size={13} />
                    Encrypted
                  </div>
                  <div className="fp-pill">
                    <Zap size={13} />
                    Instant Reset
                  </div>
                  <div className="fp-pill">
                    <Lock size={13} />
                    Secure Link
                  </div>
                </div>

                <div className="fp-security-badge">
                  <Shield size={20} />
                  <span>
                    All reset links are encrypted and expire after 15 minutes for your security.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;