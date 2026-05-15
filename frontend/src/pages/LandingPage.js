import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  BookOpen,
  BrainCircuit,
  ChartPie,
  MessageCircleHeart,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap,
  Star,
  GraduationCap,
  Rocket,
  CheckCircle2,
  Users,
  Target,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import quizhubLogo from '../assets/quizhub-logo.png';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  const services = [
    {
      icon: BookOpen,
      title: 'Fun Quizzes',
      desc: 'Engage in interactive quizzes across numerous subjects and topics. Learning has never been this enjoyable.',
      color: 'lavender',
    },
    {
      icon: ChartPie,
      title: 'Track Progress',
      desc: 'Monitor your improvement with smart progress views, detailed analytics, and personalized insights.',
      color: 'rainbow',
    },
    {
      icon: MessageCircleHeart,
      title: 'Friendly Community',
      desc: 'Connect with friends, educators, and learners who share your passion for knowledge.',
      color: 'sky',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Students' },
    { value: '50K+', label: 'Quizzes' },
    { value: '95%', label: 'Engagement' },
    { value: '4.9', label: 'Rating' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .lp-root {
          min-height: 100vh;
          background: #f5f1ff;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Fixed Background Blobs ── */
        .lp-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.45;
          z-index: 0;
          pointer-events: none;
          animation: lpBlobFloat 16s infinite ease-in-out;
        }
        .lp-blob-1 { width: 600px; height: 600px; background: #a78bfa; top: -200px; left: -200px; }
        .lp-blob-2 { width: 700px; height: 700px; background: #60a5fa; bottom: -200px; right: -200px; animation-delay: -8s; }
        .lp-blob-3 { width: 400px; height: 400px; background: #f472b6; top: 40%; left: 50%; animation-delay: -4s; }
        .lp-blob-4 { width: 300px; height: 300px; background: #818cf8; top: 20%; right: 20%; animation-delay: -12s; }

        @keyframes lpBlobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -70px) scale(1.08); }
          66% { transform: translate(-40px, 40px) scale(0.92); }
        }

        /* ── Navbar ── */
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 48px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(245, 241, 255, 0.35);
          border-bottom: 1px solid rgba(139, 92, 246, 0.12);
          transition: all 0.3s;
        }
        .lp-nav-logo {
          height: 42px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(124, 77, 255, 0.15));
          transition: transform 0.2s;
        }
        .lp-nav-logo:hover { transform: scale(1.05); }
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .lp-nav-links a {
          color: #5b5570;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: color 0.2s;
          position: relative;
        }
        .lp-nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: #8b5cf6;
          border-radius: 2px;
          transition: width 0.25s;
        }
        .lp-nav-links a:hover { color: #7c3aed; }
        .lp-nav-links a:hover::after { width: 100%; }
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lp-nav-link {
          color: #5b5570;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .lp-nav-link:hover { color: #7c3aed; background: rgba(139, 92, 246, 0.08); }
        .lp-nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white !important;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          padding: 11px 22px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(109, 74, 255, 0.25);
          transition: all 0.25s;
        }
        .lp-nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(109, 74, 255, 0.35);
          color: white !important;
        }

        /* ── Glass Card Utility ── */
        .glass {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow:
            0 8px 32px rgba(109, 74, 255, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .glass-strong {
          background: rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow:
            0 12px 40px rgba(109, 74, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        /* ── Sections Common ── */
        .lp-section {
          position: relative;
          z-index: 5;
          padding: 100px 48px;
        }
        .lp-section-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 16px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.15);
          color: #7c3aed;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          margin-bottom: 16px;
          letter-spacing: 0.02em;
        }
        .lp-section-title {
          font-size: 44px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 14px;
        }
        .lp-section-sub {
          font-size: 17px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.7;
          max-width: 560px;
        }
        .lp-section-sub.center {
          margin-left: auto;
          margin-right: auto;
          text-align: center;
        }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 80px;
          position: relative;
          z-index: 5;
        }
        .lp-hero-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 60px;
        }
        .lp-hero-copy h1 {
          font-size: 56px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin-bottom: 20px;
        }
        .lp-hero-copy h1 span {
          background: linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero-copy > p {
          font-size: 18px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.7;
          margin-bottom: 36px;
          max-width: 460px;
        }
        .lp-hero-ctas {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%);
          color: white;
          text-decoration: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 14px 32px rgba(99, 102, 241, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .lp-btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.6s;
        }
        .lp-btn-primary:hover::before { left: 100%; }
        .lp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
          color: white;
        }
        .lp-btn-primary:active { transform: translateY(0) scale(0.98); }

        .lp-btn-glass {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          color: #4c4884;
          text-decoration: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(109, 74, 255, 0.06), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .lp-btn-glass:hover {
          border-color: rgba(139, 92, 246, 0.35);
          color: #7c3aed;
          background: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(109, 74, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.4);
          color: #7c3aed;
        }

        .lp-hero-trust {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid rgba(139, 92, 246, 0.12);
        }
        .lp-trust-avatars { display: flex; }
        .lp-trust-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.6);
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: white;
        }
        .lp-trust-avatar:first-child { margin-left: 0; }
        .lp-trust-avatar.av-1 { background: #8b5cf6; }
        .lp-trust-avatar.av-2 { background: #6366f1; }
        .lp-trust-avatar.av-3 { background: #f472b6; }
        .lp-trust-avatar.av-4 { background: #60a5fa; }
        .lp-trust-text {
          font-size: 13px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.4;
        }
        .lp-trust-text strong { color: #1e1b4b; font-weight: 800; }

        /* Hero Visual */
        .lp-hero-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
        }
        .lp-hero-glow {
          position: absolute;
          width: 440px;
          height: 440px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: lpGlowPulse 4s ease-in-out infinite;
        }
        @keyframes lpGlowPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
        }
        .lp-hero-card-main {
          position: relative;
          z-index: 2;
          width: 320px;
          padding: 36px;
          border-radius: 28px;
          text-align: center;
          animation: lpCardFloat 6s ease-in-out infinite;
        }
        @keyframes lpCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .lp-hero-card-main img {
          width: 160px;
          margin-bottom: 20px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
        }
        .lp-hero-card-main h3 {
          font-size: 20px;
          font-weight: 900;
          color: #1e1b4b;
          margin-bottom: 8px;
        }
        .lp-hero-card-main p {
          font-size: 13px;
          color: #726b88;
          font-weight: 500;
        }

        /* Floating mini cards */
        .lp-hero-float {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          color: #1e1b4b;
          animation: lpMiniFloat 5s infinite ease-in-out;
        }
        .lp-hero-float .float-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-hf-1 { top: 10%; right: -10%; animation-delay: 0s; }
        .lp-hf-1 .float-icon { background: rgba(139, 92, 246, 0.18); color: #8b5cf6; }
        .lp-hf-2 { bottom: 18%; left: -8%; animation-delay: -1.7s; }
        .lp-hf-2 .float-icon { background: rgba(244, 114, 182, 0.18); color: #f472b6; }
        .lp-hf-3 { top: 55%; right: -14%; animation-delay: -3.3s; }
        .lp-hf-3 .float-icon { background: rgba(96, 165, 250, 0.18); color: #60a5fa; }

        @keyframes lpMiniFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }

        /* ── STATS BAR ── */
        .lp-stats-bar {
          position: relative;
          z-index: 5;
          padding: 0 48px;
          margin-top: -40px;
          margin-bottom: 40px;
        }
        .lp-stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .lp-stat-card {
          padding: 28px 24px;
          border-radius: 20px;
          text-align: center;
          transition: all 0.3s;
        }
        .lp-stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.32);
          border-color: rgba(139, 92, 246, 0.25);
          box-shadow: 0 16px 48px rgba(109, 74, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.35);
        }
        .lp-stat-card h3 {
          font-size: 32px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        .lp-stat-card span {
          font-size: 13px;
          color: #726b88;
          font-weight: 600;
        }

        /* ── SERVICES ── */
        .lp-services { background: transparent; }
        .lp-services-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .lp-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .lp-service-card {
          padding: 36px 30px;
          border-radius: 24px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .lp-service-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 24px 24px 0 0;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-service-card:hover::before { opacity: 1; }
        .lp-service-card:hover {
          transform: translateY(-6px);
          background: rgba(255, 255, 255, 0.32);
          border-color: rgba(139, 92, 246, 0.25);
          box-shadow: 0 20px 52px rgba(109, 74, 255, 0.12), inset 0 1px 0 rgba(255,255,255,0.35);
        }
        .lp-service-card[data-color="lavender"]::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
        .lp-service-card[data-color="rainbow"]::before { background: linear-gradient(90deg, #f472b6, #fb923c); }
        .lp-service-card[data-color="sky"]::before { background: linear-gradient(90deg, #60a5fa, #34d399); }

        .lp-service-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          transition: transform 0.3s;
        }
        .lp-service-card:hover .lp-service-icon { transform: scale(1.08) rotate(-3deg); }
        .lp-service-icon.lavender { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
        .lp-service-icon.rainbow { background: rgba(244, 114, 182, 0.15); color: #f472b6; }
        .lp-service-icon.sky { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }

        .lp-service-card h3 {
          font-size: 20px;
          font-weight: 900;
          color: #1e1b4b;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .lp-service-card p {
          font-size: 14px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.7;
          margin-bottom: 22px;
        }
        .lp-service-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7c3aed;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: all 0.2s;
        }
        .lp-service-link:hover { gap: 10px; color: #4c1d95; }

        /* ── ABOUT ── */
        .lp-about { overflow: hidden; }
        .lp-about-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .lp-about-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 420px;
        }
        .lp-about-glass {
          width: 340px;
          height: 380px;
          background: linear-gradient(145deg, rgba(139, 92, 246, 0.12), rgba(99, 102, 241, 0.08));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 32px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          position: relative;
          z-index: 2;
          animation: lpAboutPulse 6s ease-in-out infinite;
          box-shadow: 0 16px 48px rgba(109, 74, 255, 0.08), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        @keyframes lpAboutPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .lp-about-glass img {
          width: 120px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
        }
        .lp-about-glass-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.4);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .lp-about-float-1 {
          position: absolute;
          top: 10%;
          right: 0;
          z-index: 3;
          animation: lpMiniFloat 5s infinite ease-in-out;
        }
        .lp-about-float-2 {
          position: absolute;
          bottom: 10%;
          left: 0;
          z-index: 3;
          animation: lpMiniFloat 5s infinite ease-in-out -2s;
        }
        .lp-about-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          color: #1e1b4b;
        }
        .lp-about-mini .mini-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lp-about-copy h2 {
          font-size: 40px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .lp-about-copy > p {
          font-size: 16px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.8;
          margin-bottom: 32px;
        }
        .lp-about-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 36px;
        }
        .lp-about-feature {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .lp-about-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          flex-shrink: 0;
        }
        .lp-about-feature div {
          font-size: 14px;
          color: #1e1b4b;
          font-weight: 700;
        }
        .lp-about-feature span {
          display: block;
          font-size: 12px;
          color: #726b88;
          font-weight: 500;
          margin-top: 2px;
        }

        /* ── CTA SECTION ── */
        .lp-cta { padding: 100px 48px; }
        .lp-cta-inner {
          max-width: 900px;
          margin: 0 auto;
          background: linear-gradient(145deg, rgba(124, 58, 237, 0.65), rgba(99, 102, 241, 0.55), rgba(79, 70, 229, 0.6));
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 32px;
          padding: 64px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(79, 70, 229, 0.2), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .lp-cta-inner::before {
          content: '';
          position: absolute;
          width: 250%;
          height: 250%;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.6;
          animation: lpCtaDots 30s linear infinite;
        }
        @keyframes lpCtaDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(24px, 24px); }
        }
        .lp-cta-inner::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          top: -100px;
          right: -100px;
          pointer-events: none;
        }
        .lp-cta-content {
          position: relative;
          z-index: 2;
        }
        .lp-cta-content h2 {
          font-size: 40px;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 14px;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .lp-cta-content > p {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .lp-cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: rgba(255, 255, 255, 0.95);
          color: #4f46e5;
          text-decoration: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
          transition: all 0.25s;
        }
        .lp-cta-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
          color: #4f46e5;
        }
        .lp-cta-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          text-decoration: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.25s;
        }
        .lp-cta-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
          color: white;
        }

        /* ── FOOTER ── */
        .lp-footer {
          position: relative;
          z-index: 5;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(139, 92, 246, 0.12);
          padding: 56px 48px 32px;
        }
        .lp-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 48px;
          margin-bottom: 40px;
        }
        .lp-footer-brand img {
          height: 36px;
          margin-bottom: 14px;
        }
        .lp-footer-brand p {
          font-size: 13px;
          color: #726b88;
          font-weight: 500;
          line-height: 1.7;
          max-width: 260px;
        }
        .lp-footer-col h4 {
          font-size: 13px;
          font-weight: 800;
          color: #1e1b4b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 18px;
        }
        .lp-footer-col a {
          display: block;
          color: #726b88;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 5px 0;
          transition: all 0.2s;
        }
        .lp-footer-col a:hover {
          color: #7c3aed;
          transform: translateX(2px);
        }
        .lp-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          border-top: 1px solid rgba(139, 92, 246, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lp-footer-bottom p {
          font-size: 12px;
          color: #9b92b5;
          font-weight: 500;
        }
        .lp-footer-socials { display: flex; gap: 10px; }
        .lp-footer-social {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          text-decoration: none;
          transition: all 0.2s;
        }
        .lp-footer-social:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .lp-hero-inner { grid-template-columns: 1fr; text-align: center; }
          .lp-hero-copy > p { margin-left: auto; margin-right: auto; }
          .lp-hero-ctas { justify-content: center; }
          .lp-hero-trust { justify-content: center; }
          .lp-hero-visual { min-height: 400px; }
          .lp-services-grid { grid-template-columns: 1fr 1fr; }
          .lp-about-inner { grid-template-columns: 1fr; gap: 48px; }
          .lp-about-visual { min-height: 320px; }
          .lp-footer-inner { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 768px) {
          .lp-nav { padding: 14px 20px; }
          .lp-nav-links { display: none; }
          .lp-section { padding: 60px 20px; }
          .lp-hero-inner { padding: 0 20px; }
          .lp-hero-copy h1 { font-size: 38px; }
          .lp-section-title { font-size: 32px; }
          .lp-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .lp-stats-bar { padding: 0 20px; margin-top: -20px; }
          .lp-services-grid { grid-template-columns: 1fr; }
          .lp-cta { padding: 60px 20px; }
          .lp-cta-inner { padding: 40px 24px; }
          .lp-cta-content h2 { font-size: 28px; }
          .lp-footer { padding: 40px 20px 24px; }
          .lp-footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .lp-footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
          .lp-hero-float { display: none; }
          .lp-about-float-1, .lp-about-float-2 { display: none; }
          .lp-about-copy h2 { font-size: 30px; }
          .lp-hero-card-main { width: 260px; padding: 28px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-blob lp-blob-1"></div>
        <div className="lp-blob lp-blob-2"></div>
        <div className="lp-blob lp-blob-3"></div>
        <div className="lp-blob lp-blob-4"></div>

        {/* ── NAVBAR ── */}
        <nav className="lp-nav">
          <Link to="/">
            <img src={quizhubLogo} alt="QuizHub" className="lp-nav-logo" />
          </Link>
          <div className="lp-nav-links">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#about">About</a>
          </div>
          <div className="lp-nav-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="lp-nav-link">Dashboard</Link>
                <Link to="/dashboard" className="lp-nav-cta">Open App <ChevronRight size={14} /></Link>
              </>
            ) : (
              <>
                <Link to="/login" className="lp-nav-link">Login</Link>
                <Link to="/register" className="lp-nav-cta">Register <ChevronRight size={14} /></Link>
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="home" className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-copy">
              <div className="lp-section-label">
                <Sparkles size={13} />
                Smart Learning Platform
              </div>
              <h1>
                Learn, quiz, and<br />
                <span>level up</span> your skills.
              </h1>
              <p>
                Join thousands of students and teachers using QuizHub to create quizzes, track progress, and make learning truly interactive.
              </p>
              <div className="lp-hero-ctas">
                <Link to={user ? '/dashboard' : '/register'} className="lp-btn-primary">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <a href="#services" className="lp-btn-glass">
                  Explore Features
                </a>
              </div>
              <div className="lp-hero-trust">
                <div className="lp-trust-avatars">
                  <div className="lp-trust-avatar av-1">A</div>
                  <div className="lp-trust-avatar av-2">B</div>
                  <div className="lp-trust-avatar av-3">C</div>
                  <div className="lp-trust-avatar av-4">D</div>
                </div>
                <div className="lp-trust-text">
                  <strong>10,000+</strong> students already<br />learning on QuizHub
                </div>
              </div>
            </div>

            <div className="lp-hero-visual">
              <div className="lp-hero-glow"></div>

              <div className="lp-hero-card-main glass-strong">
                <img src={quizhubLogo} alt="QuizHub" />
                <h3>Your Learning Hub</h3>
                <p>Create, share, and conquer quizzes</p>
              </div>

              <div className="lp-hero-float lp-hf-1 glass">
                <div className="float-icon"><BrainCircuit size={18} /></div>
                AI-Powered
              </div>
              <div className="lp-hero-float lp-hf-2 glass">
                <div className="float-icon"><Trophy size={18} /></div>
                #1 Ranked
              </div>
              <div className="lp-hero-float lp-hf-3 glass">
                <div className="float-icon"><Zap size={18} /></div>
                Instant Results
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div className="lp-stats-bar">
          <div className="lp-stats-inner">
            {stats.map((stat, i) => (
              <div className="lp-stat-card glass" key={i}>
                <h3>{stat.value}</h3>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SERVICES ── */}
        <section id="services" className="lp-section lp-services">
          <div className="lp-services-header">
            <div className="lp-section-label" style={{ margin: '0 auto 16px' }}>
              <Zap size={13} />
              What We Offer
            </div>
            <h2 className="lp-section-title">Our Services</h2>
            <p className="lp-section-sub center">
              Everything you need to master new skills and make learning enjoyable.
            </p>
          </div>
          <div className="lp-services-grid">
            {services.map((svc, i) => (
              <article className="lp-service-card glass" key={i} data-color={svc.color}>
                <div className={`lp-service-icon ${svc.color}`}>
                  <svc.icon size={24} />
                </div>
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
                <a href="#get-started" className="lp-service-link">
                  Learn More <ArrowRight size={14} />
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="lp-section lp-about">
          <div className="lp-about-inner">
            <div className="lp-about-visual">
              <div className="lp-about-glass">
                <img src={quizhubLogo} alt="QuizHub" />
                <div className="lp-about-glass-icon">
                  <Lightbulb size={24} />
                </div>
              </div>
              <div className="lp-about-float-1">
                <div className="lp-about-mini glass">
                  <div className="mini-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  95% Satisfaction
                </div>
              </div>
              <div className="lp-about-float-2">
                <div className="lp-about-mini glass">
                  <div className="mini-icon" style={{ background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6' }}>
                    <GraduationCap size={16} />
                  </div>
                  Free to Start
                </div>
              </div>
            </div>

            <div className="lp-about-copy">
              <div className="lp-section-label">
                <Star size={13} />
                About QuizHub
              </div>
              <h2>Your gateway to fun learning!</h2>
              <p>
                At QuizHub, we believe learning should be fun and engaging. Our platform offers a wide range of quizzes that make learning enjoyable and effective. Join our vibrant community, track your progress, and achieve your learning goals.
              </p>
              <div className="lp-about-features">
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon"><Target size={18} /></div>
                  <div>
                    Goal-Oriented Learning
                    <span>Set targets and track your journey</span>
                  </div>
                </div>
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon"><BarChart3 size={18} /></div>
                  <div>
                    Detailed Analytics
                    <span>Understand your strengths and weaknesses</span>
                  </div>
                </div>
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon"><Users size={18} /></div>
                  <div>
                    Collaborative Experience
                    <span>Learn together with friends and classmates</span>
                  </div>
                </div>
              </div>
              <a href="#get-started" className="lp-btn-primary">
                Start Learning Now <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="get-started" className="lp-cta">
          <div className="lp-cta-inner">
            <div className="lp-cta-content">
              <div className="lp-section-label" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', margin: '0 auto 16px' }}>
                <Rocket size={13} />
                Get Started Today
              </div>
              <h2>Ready to transform<br />how you learn?</h2>
              <p>
                Sign up now and start your learning journey with QuizHub. It&apos;s free and easy to get started.
              </p>
              <div className="lp-cta-actions">
                <Link to="/register" className="lp-cta-btn-primary">
                  Create Free Account <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="lp-cta-btn-ghost">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <img src={quizhubLogo} alt="QuizHub" />
              <p>The smart learning platform that makes quizzes fun, progress trackable, and collaboration effortless.</p>
            </div>
            <div className="lp-footer-col">
              <h4>Quick Links</h4>
              <a href="#home">Home</a>
              <a href="#services">Services</a>
              <a href="#about">About Us</a>
              <Link to="/register">Register</Link>
            </div>
            <div className="lp-footer-col">
              <h4>Services</h4>
              <a href="#services">Fun Quizzes</a>
              <a href="#services">Track Progress</a>
              <a href="#services">Community</a>
            </div>
            <div className="lp-footer-col">
              <h4>Support</h4>
              <Link to="/login">Help Center</Link>
              <Link to="/forgot-password">Reset Password</Link>
              <Link to="/login">Contact Us</Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 QuizHub. All rights reserved.</p>
            <div className="lp-footer-socials">
              <a href="#home" className="lp-footer-social" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#home" className="lp-footer-social" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#home" className="lp-footer-social" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;