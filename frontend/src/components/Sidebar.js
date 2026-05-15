import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  MessageSquare,
  Settings,
  PenTool,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import quizhubLogo from '../assets/quizhub-logo.png';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const studentMenu = [
    { icon: <LayoutDashboard size={20} />, text: 'Dashboard', path: '/dashboard' },
    { icon: <FileQuestion size={20} />, text: 'Quiz Generator', path: '/quiz-generator' },
    { icon: <BookOpen size={20} />, text: 'Library', path: '/library' },
    { icon: <MessageSquare size={20} />, text: 'Chatrooms', path: '/chatrooms' },
    { icon: <Settings size={20} />, text: 'Settings', path: '/settings' },
  ];

  const teacherMenu = [
    { icon: <LayoutDashboard size={20} />, text: 'Dashboard', path: '/dashboard' },
    { icon: <FileQuestion size={20} />, text: 'Quiz Generator', path: '/quiz-generator' },
    { icon: <PenTool size={20} />, text: 'Quiz Manual', path: '/create-quiz' },
    { icon: <BookOpen size={20} />, text: 'Library', path: '/library' },
    { icon: <MessageSquare size={20} />, text: 'Chatrooms', path: '/chatrooms' },
    { icon: <Settings size={20} />, text: 'Settings', path: '/settings' },
  ];

  const menuItems = user?.role === 'teacher' ? teacherMenu : studentMenu;

  return (
    <>
      <style>{`
  .sidebar {
    width: 260px;
    min-height: 100vh;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    border-right: 1px solid #E5E7EB;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: 84px;
  }

  /* THIS IS THE IMPORTANT FIX */
  .sidebar ~ .main-content,
  .sidebar ~ .settings-main,
  .sidebar ~ .content-body {
    margin-left: 260px;
    width: calc(100% - 260px);
    min-width: 0;
    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: margin-left, width;
  }

  .sidebar.collapsed ~ .main-content,
  .sidebar.collapsed ~ .settings-main,
  .sidebar.collapsed ~ .content-body {
    margin-left: 84px;
    width: calc(100% - 84px);
  }

  /* collapse button aligned with navbar row */
  .sidebar-collapse-wrap {
    position: absolute;
    top: 18px;
    right: 12px;
    z-index: 3;
  }

  .sidebar.collapsed .sidebar-collapse-wrap {
    right: 24px;
  }

  .collapse-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: #F8F7FF;
    color: #5B3CC4;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .collapse-btn:hover {
    background: #EEE9FF;
  }

  .sidebar-logo {
    padding: 82px 16px 16px;
    border-bottom: 1px solid #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 140px;
    box-sizing: border-box;
  }

  .logo-link {
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease, width 0.2s ease;
  }

  .logo-link img {
    height: 150px;
    width: auto;
    object-fit: contain;
    display: block;
  }

  .sidebar.collapsed .logo-link {
    opacity: 0;
    width: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .sidebar-menu {
    list-style: none;
    padding: 16px 12px;
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-section-label {
    font-size: 11px;
    font-weight: 600;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 20px 14px 8px;
    transition: opacity 0.2s ease;
    white-space: nowrap;
  }

  .sidebar.collapsed .sidebar-section-label {
    opacity: 0;
    height: 0;
    padding: 0;
    overflow: hidden;
  }

  .sidebar-item .sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    color: #6B7280;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .sidebar.collapsed .sidebar-item .sidebar-link {
    justify-content: center;
    padding: 12px 0;
    gap: 0;
  }

  .sidebar-item .sidebar-link:hover {
    color: #374151;
    background: #F3F4F6;
  }

  .sidebar-item.active .sidebar-link {
    color: #FFFFFF;
    background: #5B3CC4;
    box-shadow: 0 2px 8px rgba(91, 60, 196, 0.3);
  }

  .sidebar-item.active .sidebar-link svg {
    color: #FFFFFF;
  }

  .sidebar-link span {
    white-space: nowrap;
    transition: opacity 0.2s ease, width 0.2s ease, margin 0.2s ease;
  }

  .sidebar.collapsed .sidebar-link span {
    opacity: 0;
    width: 0;
    margin: 0;
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .sidebar {
      width: 84px;
    }

    .sidebar ~ .main-content,
    .sidebar ~ .settings-main,
    .sidebar ~ .content-body {
      margin-left: 84px;
      width: calc(100% - 84px);
    }

    .sidebar-logo {
      padding-top: 82px;
    }

    .logo-link {
      opacity: 0;
      width: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .sidebar-section-label {
      opacity: 0;
      height: 0;
      padding: 0;
      overflow: hidden;
    }

    .sidebar-item .sidebar-link {
      justify-content: center;
      padding: 12px 0;
      gap: 0;
    }

    .sidebar-link span {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
  }
`}</style>

      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-collapse-wrap">
          <button
            type="button"
            className="collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="sidebar-logo">
          <Link to="/dashboard" className="logo-link">
            <img src={quizhubLogo} alt="QuizHub" />
          </Link>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-section-label">Main Menu</li>

          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={index} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path} className="sidebar-link" title={collapsed ? item.text : ''}>
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
