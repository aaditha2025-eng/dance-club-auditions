import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext, TEAMS } from '../context/AppContext';
import { ArrowLeft, Flag, MessageSquare } from 'lucide-react';

const CRITERIA = ['Rhythm', 'Expression', 'Technique', 'Overall Impact'];

const ScoreSection = ({ criteria, currentScore, onScoreChange }) => {
  return (
    <div className="mb-4">
      <p style={{ marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{criteria}</p>
      <div className="score-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
          <button
            key={score}
            className={`score-btn ${currentScore === score ? 'active' : ''}`}
            onClick={() => onScoreChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
};

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, currentUser, updateStudentScore, updateStudentComment, toggleFlag, allocateTeam } = useAppContext();
  
  const student = students.find(s => s.id === id);
  const currentIndex = students.findIndex(s => s.id === id);
  const nextStudent = currentIndex >= 0 && currentIndex < students.length - 1 ? students[currentIndex + 1] : null;
  const prevStudent = currentIndex > 0 ? students[currentIndex - 1] : null;

  const isFacultyOrAdmin = currentUser.role === 'Faculty Coordinator' || currentUser.role === 'Admin';
  const role = currentUser.role;

  const [activeTab, setActiveTab] = useState(isFacultyOrAdmin ? TEAMS[0] : null);

  if (!student) return <div className="container">Student not found</div>;

  const handleScoreChange = (criteria, score) => {
    updateStudentScore(student.id, role, criteria, score);
  };

  const handleCommentChange = (e) => {
    updateStudentComment(student.id, role, e.target.value);
  };

  const hasFlagged = student.flags.includes(role);

  // Calculate Average Score
  let totalScore = 0;
  let scoreCount = 0;
  if (student.scores) {
    Object.values(student.scores).forEach(teamScores => {
      Object.values(teamScores).forEach(score => {
        totalScore += score;
        scoreCount++;
      });
    });
  }
  const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 'N/A';

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn btn-glass mb-4">
        <ArrowLeft size={18} /> Back to Roster
      </button>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="flex-between mb-2">
          <div className="badge badge-filled" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)' }}>
            #{student.chestNo}
          </div>
          <div className="badge badge-outline" style={{ color: 'var(--accent-purple)' }}>
            Avg Score: {avgScore}
          </div>
        </div>
        
        <h1 style={{ fontSize: '2.5rem' }}>{student.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Reg No: {student.regNo} | Primary Dance Form: <span style={{ color: 'var(--accent-blue)' }}>{student.danceForm}</span>
        </p>

        {!isFacultyOrAdmin && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => toggleFlag(student.id, role)}
              className={`btn ${hasFlagged ? 'btn-primary' : 'btn-glass'}`}
            >
              <Flag size={18} fill={hasFlagged ? 'white' : 'transparent'} /> 
              {hasFlagged ? 'Flagged for Team' : 'Flag for Team'}
            </button>
          </div>
        )}
        
        {isFacultyOrAdmin && (
          <div className="mt-4 p-4" style={{ background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
            <h3 className="mb-2 text-gradient">Allocate to Team</h3>
            <div className="flex-center gap-4">
              <select 
                className="input-field" 
                value={student.allocatedTeam || ''} 
                onChange={(e) => allocateTeam(student.id, e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Pending Allocation</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {!isFacultyOrAdmin ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 className="mb-4">Your Evaluation</h2>
            {CRITERIA.map(crit => (
              <ScoreSection 
                key={crit}
                criteria={crit}
                currentScore={student.scores?.[role]?.[crit]}
                onScoreChange={(score) => handleScoreChange(crit, score)}
              />
            ))}
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 className="mb-4">Your Comments</h2>
            <textarea 
              className="input-field"
              style={{ width: '100%', height: '200px', resize: 'vertical' }}
              placeholder="Add your comments here..."
              value={student.comments?.[role] || ''}
              onChange={handleCommentChange}
            />
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 className="mb-4">Team Evaluations</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {TEAMS.map(team => (
              <button 
                key={team}
                onClick={() => setActiveTab(team)}
                className={`btn ${activeTab === team ? 'btn-primary' : 'btn-glass'}`}
                style={{ padding: '0.5rem 1rem' }}
              >
                {team}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px' }}>
            <h3 className="mb-4" style={{ color: 'var(--accent-blue)' }}>{activeTab} Feedback</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 className="mb-2" style={{ color: 'var(--text-secondary)' }}>Scores</h4>
                {CRITERIA.map(crit => (
                  <div key={crit} className="flex-between mb-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <span>{crit}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                      {student.scores?.[activeTab]?.[crit] || '-'} / 10
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="mb-2" style={{ color: 'var(--text-secondary)' }}>Comments</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', minHeight: '100px' }}>
                  {student.comments?.[activeTab] ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{student.comments[activeTab]}</p>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No comments provided yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex-between mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
        {prevStudent ? (
          <button className="btn btn-glass" onClick={() => navigate(`/student/${prevStudent.id}`)}>
            <ArrowLeft size={18} /> Previous Profile
          </button>
        ) : <div />}
        
        {nextStudent ? (
          <button className="btn btn-primary" onClick={() => navigate(`/student/${nextStudent.id}`)}>
            Save & Next Profile
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Finish & Return to Roster
          </button>
        )}
      </div>

    </div>
  );
};

export default StudentDetails;
