import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Trophy,
  Brain,
  Zap,
  Star,
  Rocket
} from 'lucide-react';

import quizhubLogo from '../assets/quizhub-logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'student'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState({ label: '', class: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const pass = formData.password;
    if (pass.length === 0) {
      setStrength({ label: '', class: '' });
    } else if (pass.length < 6) {
      setStrength({ label: 'Weak', class: 'weak' });
    } else if (pass.length < 10 || !/\d/.test(pass)) {
      setStrength({ label: 'Medium', class: 'medium' });
    } else {
      setStrength({ label: 'Strong', class: 'strong' });
    }
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.password2) {
      setErrors({ password2: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .reg-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f1ff;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        /* ── Background Blobs ── */
        .reg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          z-index: 0;
          pointer-events: none;
          animation: regBlobFloat 14s infinite ease-in-out;
        }
        .reg-blob-1 { width: 500px; height: 500px; background: #a78bfa; top: -120px; left: -120px; }
        .reg-blob-2 { width: 600px; height: 600px; background: #60a5fa; bottom: -150px; right: -150px; animation-delay: -7s; }
        .reg-blob-3 { width: 350px; height: 350px; background: #f472b6; top: 45%; left: 50%; animation-delay: -3.5s; }

        @keyframes regBlobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.06); }
          66% { transform: translate(-30px, 30px) scale(0.94); }
        }

        /* ── NAVBAR ── */
        .reg-nav {
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
        .reg-nav-logo {
          height: 40px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(124, 77, 255, 0.15));
          transition: transform 0.2s;
        }
        .reg-nav-logo:hover { transform: scale(1.05); }
        .reg-nav-actions {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .reg-nav-actions a {
          color: #5b5570;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: color 0.2s;
        }
        .reg-nav-actions a:hover { color: #7c3aed; }
        .reg-nav-cta {
          background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
          color: white !important;
          padding: 10px 22px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(109, 74, 255, 0.25);
          transition: all 0.2s !important;
        }
        .reg-nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(109, 74, 255, 0.35) !important;
          color: white !important;
        }

        /* ── MAIN ── */
        .reg-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 24px 60px;
          position: relative;
          z-index: 10;
        }

        .reg-card {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          width: 100%;
          max-width: 1020px;
          min-height: 700px;
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

        /* ── LEFT: FORM ── */
        .reg-form-side {
          padding: 40px 40px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
          max-height: 700px;
        }
        .reg-form-side::-webkit-scrollbar { width: 4px; }
        .reg-form-side::-webkit-scrollbar-track { background: transparent; }
        .reg-form-side::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 4px; }

        .reg-form-header {
          margin-bottom: 24px;
        }
        .reg-form-badge {
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
          letter-spacing: 0.02em;
        }
        .reg-form-header h1 {
          font-size: 28px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .reg-form-header p {
          font-size: 14px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.5;
        }

        /* Row */
        .reg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Fields */
        .reg-field {
          margin-bottom: 14px;
        }
        .reg-field label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #4c4884;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .reg-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .reg-input-wrap .field-icon {
          position: absolute;
          left: 14px;
          color: #a5a0c8;
          pointer-events: none;
          transition: color 0.25s;
        }
        .reg-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border: 2px solid #e9e5ff;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 600;
          color: #1e1b4b;
          outline: none;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reg-input::placeholder { color: #c4bfee; font-weight: 500; }
        .reg-input:focus {
          border-color: #8b5cf6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1), 0 6px 12px rgba(139, 92, 246, 0.04);
          transform: translateY(-1px);
        }
        .reg-input:focus ~ .field-icon,
        .reg-input-wrap:focus-within .field-icon {
          color: #8b5cf6;
        }
        .reg-input:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Select */
        .reg-select-wrap { position: relative; }
        .reg-select-wrap .field-icon { z-index: 1; }
        .reg-select {
          width: 100%;
          padding: 11px 38px 11px 40px;
          border: 2px solid #e9e5ff;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 600;
          color: #1e1b4b;
          outline: none;
          font-family: inherit;
          appearance: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reg-select:focus {
          border-color: #8b5cf6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          transform: translateY(-1px);
        }
        .reg-select-wrap:focus-within .field-icon { color: #8b5cf6; }
        .reg-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #a5a0c8;
          pointer-events: none;
        }

        /* Password toggle */
        .reg-pw-toggle {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: #a5a0c8;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          transition: all 0.2s;
        }
        .reg-pw-toggle:hover { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }

        /* Strength */
        .reg-strength-track {
          height: 4px;
          border-radius: 99px;
          background: #ede9fe;
          margin-top: 8px;
          overflow: hidden;
        }
        .reg-strength-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 0.35s ease, background 0.35s ease;
        }
        .reg-strength-bar.weak { width: 33%; background: linear-gradient(90deg, #ef4444, #f87171); }
        .reg-strength-bar.medium { width: 66%; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .reg-strength-bar.strong { width: 100%; background: linear-gradient(90deg, #10b981, #34d399); }

        .reg-strength-label {
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
          display: block;
        }
        .reg-strength-label.weak { color: #ef4444; }
        .reg-strength-label.medium { color: #f59e0b; }
        .reg-strength-label.strong { color: #10b981; }

        /* Errors */
        .reg-error {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
          margin-top: 5px;
        }
        .reg-error-general {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 14px;
          animation: regShake 0.4s ease;
        }
        @keyframes regShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        /* Submit */
        .reg-submit {
          width: 100%;
          padding: 14px;
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
          margin-top: 6px;
        }
        .reg-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.6s;
        }
        .reg-submit:hover::before { left: 100%; }
        .reg-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(99, 102, 241, 0.4);
        }
        .reg-submit:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 6px 12px rgba(99, 102, 241, 0.2);
        }
        .reg-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2) !important;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.7s linear infinite; }

        /* Switch */
        .reg-switch {
          text-align: center;
          margin-top: 18px;
          font-size: 13px;
          color: #726b88;
        }
        .reg-switch a {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: none;
          margin-left: 4px;
          transition: color 0.2s;
        }
        .reg-switch a:hover { color: #4c1d95; }

        /* ── RIGHT: VISUAL ── */
        .reg-visual-side {
          background: linear-gradient(145deg, #7c3aed 0%, #6366f1 40%, #4f46e5 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          overflow: hidden;
        }

        /* Dot pattern */
        .reg-visual-side::before {
          content: '';
          position: absolute;
          width: 220%;
          height: 220%;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          opacity: 0.35;
          animation: regDotDrift 25s linear infinite;
        }
        @keyframes regDotDrift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(22px, 22px); }
        }

        /* Ambient circles */
        .reg-ambient {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .reg-amb-1 {
          width: 280px; height: 280px;
          background: rgba(255,255,255,0.06);
          top: -100px; left: -100px;
          animation: regAmbPulse 8s ease-in-out infinite;
        }
        .reg-amb-2 {
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.05);
          bottom: -60px; right: -60px;
          animation: regAmbPulse 8s ease-in-out infinite 4s;
        }
        @keyframes regAmbPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        /* Floating icons */
        .reg-float-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.12);
          z-index: 1;
          animation: regFloatIcon 7s infinite ease-in-out;
        }
        .rfi-1 { top: 8%; left: 12%; animation-delay: 0s; }
        .rfi-2 { top: 12%; right: 10%; animation-delay: -1.5s; }
        .rfi-3 { bottom: 22%; left: 8%; animation-delay: -3s; }
        .rfi-4 { bottom: 12%; right: 12%; animation-delay: -4.5s; }
        .rfi-5 { top: 42%; left: 5%; animation-delay: -2s; }
        .rfi-6 { top: 6%; left: 50%; animation-delay: -5s; }
        .rfi-7 { bottom: 45%; right: 6%; animation-delay: -6s; }
        .rfi-8 { top: 60%; left: 15%; animation-delay: -3.5s; }

        @keyframes regFloatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(8deg); }
        }

        /* Content */
        .reg-visual-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
        }

        .reg-big-logo {
          width: 200px;
          height: auto;
          margin: 0 auto 32px;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.2));
          animation: regLogoHover 5s ease-in-out infinite;
        }
        @keyframes regLogoHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .reg-visual-content h2 {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 10px;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        .reg-visual-content h2 span {
          display: inline-block;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          padding: 2px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .reg-visual-content > p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
          line-height: 1.65;
          margin-bottom: 32px;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Feature pills */
        .reg-feature-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 320px;
          margin: 0 auto 32px;
        }
        .reg-pill {
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
        .reg-pill:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        /* Stats */
        .reg-stats {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        .reg-stat-box {
          min-width: 120px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 18px 20px;
          text-align: center;
          transition: all 0.25s;
        }
        .reg-stat-box:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
        }
        .reg-stat-box h3 {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 2px;
        }
        .reg-stat-box span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 920px) {
          .reg-nav { padding: 14px 20px; }
          .reg-nav-actions a:not(.reg-nav-cta) { display: none; }
          .reg-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .reg-visual-side {
            min-height: 280px;
            padding: 32px 24px;
          }
          .reg-big-logo { width: 130px; margin-bottom: 20px; }
          .reg-visual-content h2 { font-size: 24px; }
          .reg-feature-pills { gap: 8px; }
          .reg-pill { font-size: 11px; padding: 8px 12px; }
          .reg-stats { gap: 10px; }
          .reg-stat-box { min-width: 100px; padding: 14px 16px; }
          .reg-stat-box h3 { font-size: 22px; }
          .reg-form-side {
            padding: 28px 24px;
            max-height: none;
            overflow: visible;
          }
          .reg-form-header h1 { font-size: 24px; }
          .reg-row { grid-template-columns: 1fr; }
          .reg-float-icon { display: none; }
        }
      `}</style>

      <div className="reg-root">
        {/* Background blobs */}
        <div className="reg-blob reg-blob-1"></div>
        <div className="reg-blob reg-blob-2"></div>
        <div className="reg-blob reg-blob-3"></div>

        {/* NAVBAR */}
        <nav className="reg-nav">
          <Link to="/">
            <img src={quizhubLogo} alt="QuizHub" className="reg-nav-logo" />
          </Link>
          <div className="reg-nav-actions">
            <Link to="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#about">About</a>
            <Link to="/login" className="reg-nav-cta">Login</Link>
          </div>
        </nav>

        {/* MAIN */}
        <div className="reg-main">
          <div className="reg-card">

            {/* LEFT — FORM */}
            <div className="reg-form-side">
              <div className="reg-form-header">
                <div className="reg-form-badge">
                  <Sparkles size={13} />
                  Join the community
                </div>
                <h1>Create your account</h1>
                <p>Set up your profile and start your learning journey.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="reg-row">
                  <div className="reg-field">
                    <label>First Name</label>
                    <div className="reg-input-wrap">
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="John"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        disabled={isLoading}
                      />
                      <User size={15} className="field-icon" />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>Last Name</label>
                    <div className="reg-input-wrap">
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="Doe"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        disabled={isLoading}
                      />
                      <User size={15} className="field-icon" />
                    </div>
                  </div>
                </div>

                <div className="reg-field">
                  <label>Username</label>
                  <div className="reg-input-wrap">
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="your.username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <User size={15} className="field-icon" />
                  </div>
                  {errors.username && (
                    <div className="reg-error">
                      <AlertCircle size={12} />
                      {Array.isArray(errors.username) ? errors.username.join(', ') : errors.username}
                    </div>
                  )}
                </div>

                <div className="reg-field">
                  <label>Email Address</label>
                  <div className="reg-input-wrap">
                    <input
                      type="email"
                      className="reg-input"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <Mail size={15} className="field-icon" />
                  </div>
                  {errors.email && (
                    <div className="reg-error">
                      <AlertCircle size={12} />
                      {Array.isArray(errors.email) ? errors.email.join(', ') : errors.email}
                    </div>
                  )}
                </div>

                <div className="reg-field">
                  <label>Password</label>
                  <div className="reg-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="reg-input"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <Lock size={15} className="field-icon" />
                    <button
                      type="button"
                      className="reg-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {formData.password && (
                    <>
                      <div className="reg-strength-track">
                        <div className={`reg-strength-bar ${strength.class}`}></div>
                      </div>
                      <span className={`reg-strength-label ${strength.class}`}>
                        {strength.label}
                      </span>
                    </>
                  )}
                </div>

                <div className="reg-field">
                  <label>Confirm Password</label>
                  <div className="reg-input-wrap">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      className="reg-input"
                      placeholder="Confirm your password"
                      value={formData.password2}
                      onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <Lock size={15} className="field-icon" />
                    <button
                      type="button"
                      className="reg-pw-toggle"
                      onClick={() => setShowPassword2(!showPassword2)}
                      tabIndex={-1}
                    >
                      {showPassword2 ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password2 && (
                    <div className="reg-error">
                      <AlertCircle size={12} />
                      {errors.password2}
                    </div>
                  )}
                </div>

                <div className="reg-field">
                  <label>Register As</label>
                  <div className="reg-input-wrap reg-select-wrap">
                    <select
                      className="reg-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={isLoading}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                    <ShieldCheck size={15} className="field-icon" />
                    <ChevronDown size={14} className="reg-chevron" />
                  </div>
                </div>

                {errors.general && (
                  <div className="reg-error-general">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {errors.general}
                  </div>
                )}

                <button type="submit" className="reg-submit" disabled={isLoading}>
                  {isLoading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="reg-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>

            {/* RIGHT — VISUAL */}
            <div className="reg-visual-side">
              {/* Ambient circles */}
              <div className="reg-ambient reg-amb-1"></div>
              <div className="reg-ambient reg-amb-2"></div>

              {/* Floating icons */}
              <GraduationCap size={26} className="reg-float-icon rfi-1" />
              <Trophy size={22} className="reg-float-icon rfi-2" />
              <Brain size={28} className="reg-float-icon rfi-3" />
              <Zap size={20} className="reg-float-icon rfi-4" />
              <BookOpen size={24} className="reg-float-icon rfi-5" />
              <Star size={18} className="reg-float-icon rfi-6" />
              <Rocket size={22} className="reg-float-icon rfi-7" />
              <CheckCircle2 size={20} className="reg-float-icon rfi-8" />

              {/* Content */}
              <div className="reg-visual-content">
                <img src={quizhubLogo} alt="QuizHub" className="reg-big-logo" />

                <h2>
                  Level up your <span>learning</span>!
                </h2>

                <p>
                  Join thousands of students and teachers creating, sharing, and crushing quizzes together.
                </p>

                <div className="reg-feature-pills">
                  <div className="reg-pill">
                    <Zap size={13} />
                    AI Quizzes
                  </div>
                  <div className="reg-pill">
                    <BookOpen size={13} />
                    Interactive
                  </div>
                  <div className="reg-pill">
                    <Trophy size={13} />
                    Leaderboards
                  </div>
                  <div className="reg-pill">
                    <Brain size={13} />
                    Smart Prep
                  </div>
                </div>

                <div className="reg-stats">
                  <div className="reg-stat-box">
                    <h3>10K+</h3>
                    <span>Students</span>
                  </div>
                  <div className="reg-stat-box">
                    <h3>95%</h3>
                    <span>Engagement</span>
                  </div>
                  <div className="reg-stat-box">
                    <h3>50K+</h3>
                    <span>Quizzes</span>
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

export default Register;