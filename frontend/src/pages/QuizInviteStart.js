import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import './TakeQuiz.css';

const QuizInviteStart = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);

  useEffect(() => {
    API.get(`/quiz/invite/${inviteCode}/`)
      .then((res) => setQuizData(res.data))
      .catch((err) => {
        console.error(err);
        alert('Invalid or expired invite link.');
      });
  }, [inviteCode]);

  if (!quizData) {
    return <div className="quiz-loader-screen">Loading invite...</div>;
  }

  return (
    <div className="quiz-result-page">
      <div className="quiz-result-card">
        <div className="result-badge">Private Quiz Invite</div>
        <h1>{quizData.quiz.title}</h1>
        <p className="result-subtitle">
          Subject: {quizData.quiz.subject}
        </p>

        <div className="result-actions">
          <button
            type="button"
            className="primary-result-btn"
            onClick={() => navigate(`/quiz/take/${quizData.quiz.id}`)}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizInviteStart;