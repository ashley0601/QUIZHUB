import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import '../styles/TakeManualQuiz.css';

const JoinManualQuiz = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyQuiz = async () => {
            try {
                // Fetch the full quiz data
                const res = await API.get(`/manual-quiz/join/${code}/`);
                
                // Instantly redirect and pass data via state to avoid a second loading screen
                navigate(`/take-manual-quiz/${code}`, { state: { quiz: res.data } });
            } catch (err) {
                setError(err.response?.data?.error || "Invalid Quiz Code");
            }
        };
        
        if (code) verifyQuiz();
    }, [code, navigate]);

    // Minimalist loading state (no heavy spinners that feel slow)
    if (!error) {
        return (
            <div className="tq-portal">
                <div className="tq-portal-card verifying">
                    <ShieldCheck size={48} color="#6366f1" strokeWidth={1.5} />
                    <h2>Verifying Access Code</h2>
                    <div className="code-display">Code: <strong>{code}</strong></div>
                </div>
            </div>
        );
    }

    return (
        <div className="tq-portal">
            <div className="tq-portal-card error-portal">
                <div className="error-icon-circle">
                    <AlertCircle size={48} color="#ef4444" />
                </div>
                <h2>Access Denied</h2>
                <p className="error-desc">{error}</p>
                <div className="code-display invalid">Code: <strong>{code}</strong></div>
                <button onClick={() => navigate('/dashboard')} className="tq-btn primary">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};

export default JoinManualQuiz;