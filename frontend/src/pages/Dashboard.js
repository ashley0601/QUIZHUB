import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const RenderContent = () => {
    if (user?.role === 'teacher') return <TeacherDashboard />;
    return <StudentDashboard />;
  };

  return (
    <>
      <style>{`
        :root {
          --sidebar-width: 260px;
          --sidebar-collapsed-width: 84px;
        }

        .main-content {
          margin-left: var(--sidebar-width);
          width: calc(100% - var(--sidebar-width));
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: visible;
          transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: margin-left, width;
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F3F4F6' }}>
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <RenderContent />
        </div>
      </div>
    </>
  );
};

export default Dashboard;