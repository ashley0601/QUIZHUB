import React, { useState, useEffect } from 'react';
import API from '../api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Lock,
    Save,
    ArrowLeft,
    Eye,
    EyeOff,
    Mail,
    AtSign,
    ShieldCheck
} from 'lucide-react';
import '../styles/Settings.css';

const Settings = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: ''
    });

    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    // ── Detect sidebar collapse state ──
    useEffect(() => {
        const updateSidebarState = () => {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;
            const width = sidebar.offsetWidth;
            setSidebarCollapsed(width <= 90);
        };

        updateSidebarState();
        window.addEventListener('sidebar-collapsed', updateSidebarState);
        return () => window.removeEventListener('sidebar-collapsed', updateSidebarState);
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get('/profile/');
            const userData = res.data.user || res.data;

            setProfile({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                username: userData.username || '',
                email: userData.email || ''
            });
            setLoading(false);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            await API.put('/profile/', profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to update profile'
            });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await API.post('/change-password/', {
                old_password: passwords.old_password,
                new_password: passwords.new_password
            });

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to change password'
            });
        }
    };

    if (loading) {
        return <div className="settings-loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <Sidebar />

            <div className={`settings-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="settings-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>

                    <div className="settings-header-text">
                        <span className="settings-mini-badge">
                            <ShieldCheck size={14} />
                            Account Center
                        </span>
                        <h1>Settings</h1>
                        <p>Manage your profile details and secure your account.</p>
                    </div>
                </div>

                <div className="settings-hero">
                    <div className="settings-hero-content">
                        <h2>Personalize your account</h2>
                        <p>
                            Keep your profile updated and make sure your password stays
                            secure with the same dashboard look and feel.
                        </p>
                    </div>

                    <div className="settings-hero-chip-group">
                        <div className="settings-hero-chip">Profile</div>
                        <div className="settings-hero-chip">Security</div>
                    </div>
                </div>

                {message.text && (
                    <div className={`settings-alert ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="settings-grid">
                    <div className="settings-card profile-card">
                        <div className="card-glow"></div>

                        <div className="card-header">
                            <div className="card-icon">
                                <User size={20} />
                            </div>

                            <div className="card-header-text">
                                <h2>Profile Information</h2>
                                <p>Update your personal information for your account.</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <div className="input-shell">
                                        <span className="input-icon">
                                            <User size={17} />
                                        </span>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={profile.first_name}
                                            onChange={handleProfileChange}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Last Name</label>
                                    <div className="input-shell">
                                        <span className="input-icon">
                                            <User size={17} />
                                        </span>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={profile.last_name}
                                            onChange={handleProfileChange}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Username</label>
                                <div className="input-shell readonly-shell">
                                    <span className="input-icon">
                                        <AtSign size={17} />
                                    </span>
                                    <input
                                        type="text"
                                        name="username"
                                        value={profile.username}
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>
                                <span className="field-note">
                                    Username is locked to avoid account conflicts.
                                </span>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-shell">
                                    <span className="input-icon">
                                        <Mail size={17} />
                                    </span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="save-btn">
                                <Save size={18} />
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <div className="settings-card security-card">
                        <div className="card-glow"></div>

                        <div className="card-header">
                            <div className="card-icon">
                                <Lock size={20} />
                            </div>

                            <div className="card-header-text">
                                <h2>Change Password</h2>
                                <p>Choose a strong password to keep your account safe.</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="input-shell password-shell">
                                    <input
                                        type={showOldPassword ? 'text' : 'password'}
                                        name="old_password"
                                        value={passwords.old_password}
                                        onChange={handlePasswordChange}
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                    >
                                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <div className="input-shell password-shell">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="new_password"
                                        value={passwords.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="input-shell password-shell">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        value={passwords.confirm_password}
                                        onChange={handlePasswordChange}
                                        required
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="security-tip-box">
                                <span className="security-tip-dot"></span>
                                Use at least 8 characters with a mix of letters and numbers.
                            </div>

                            <button type="submit" className="save-btn secondary">
                                <Lock size={18} />
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;