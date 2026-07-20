import React, { useState } from 'react';
import { useAppContext, TEAMS } from '../context/AppContext';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';

const FinalReview = () => {
  const { students, currentUser, allocateTeam, facultyRoles } = useAppContext();
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canManageStudents = currentUser?.role === 'Admin' || currentUser?.role === 'Faculty Coordinator';

  if (!canManageStudents) {
    return <div className="container">Access Denied. Only Admin or Faculty can view this page.</div>;
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.chestNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Final Review & Allocation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review all feedback and allocate students to teams.</p>
        </div>
      </div>

      <div className="glass-panel mb-4" style={{ padding: '1.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Search by Name or Chest No..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredStudents.map((student, index) => {
          const isExpanded = expandedId === student.id;
          const nextStudent = index < filteredStudents.length - 1 ? filteredStudents[index + 1] : null;
          
          let totalScore = 0;
          let scoreCount = 0;
          if (student.scores) {
            Object.values(student.scores).forEach(teamScores => {
              Object.values(teamScores).forEach(score => {
                if (typeof score === 'number') {
                  totalScore += score;
                  scoreCount++;
                }
              });
            });
          }
          const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 'N/A';

          return (
            <div key={student.id} className="glass-panel" style={{ overflow: 'hidden' }}>
              <div 
                className="flex-between" 
                style={{ padding: '1.5rem', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                onClick={() => setExpandedId(isExpanded ? null : student.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="badge badge-filled" style={{ backgroundColor: 'var(--bg-primary)' }}>#{student.chestNo}</div>
                  <div>
                    <h3 style={{ margin: 0 }}>{student.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.danceForm}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {student.flags?.map(team => (
                      <div key={team} className={`team-flag flag-${team.replace(' ', '')}`} title={`${team} flagged`}>
                        <Flag size={12} fill="currentColor" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="badge badge-outline" style={{ color: 'var(--accent-pink)' }}>
                    Avg: {avgScore}
                  </div>
                  
                  {student.allocatedTeam ? (
                    <span className="badge badge-filled" style={{ backgroundColor: 'var(--accent-purple)' }}>{student.allocatedTeam}</span>
                  ) : (
                    <span className="badge badge-outline" style={{ color: 'var(--text-secondary)' }}>Pending</span>
                  )}
                  
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-primary)' }}>
                  <div className="flex-between mb-4">
                    <h4 style={{ color: 'var(--accent-blue)' }}>Team Feedback</h4>
                    
                    <div className="flex-center gap-2" style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Allocate:</span>
                      <select 
                        className="input-field" 
                        style={{ padding: '0.25rem 0.5rem', width: '200px' }}
                        value={student.allocatedTeam || ''} 
                        onChange={(e) => allocateTeam(student.id, e.target.value)}
                      >
                        <option value="">Pending Allocation</option>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {[...TEAMS, ...facultyRoles.map(f => f.name)].map(team => {
                      const hasFeedback = student.scores?.[team] || student.comments?.[team];
                      if (!hasFeedback) return null;

                      let teamAvg = 'N/A';
                      let extraForm = null;
                      if (student.scores?.[team]) {
                        const scores = Object.entries(student.scores[team])
                          .filter(([k, v]) => typeof v === 'number' && k !== 'ExtraFormName')
                          .map(([k, v]) => v);
                        if (scores.length > 0) {
                          teamAvg = (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(1);
                        }
                        if (student.scores[team]['ExtraFormName']) {
                          extraForm = { 
                            name: student.scores[team]['ExtraFormName'], 
                            score: student.scores[team]['ExtraFormScore'] 
                          };
                        }
                      }

                      return (
                        <div key={team} className="glass-panel" style={{ padding: '1rem' }}>
                          <div className="flex-between mb-2">
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{team.startsWith('Faculty - ') ? team.replace('Faculty - ', '') : team === 'Faculty Coordinator' ? 'Faculty' : team}</span>
                            <span className="badge badge-outline">Avg: {teamAvg}</span>
                          </div>
                          {extraForm && (
                            <div className="mb-2" style={{ fontSize: '0.85rem', color: 'var(--accent-red)' }}>
                              <strong>Extra Form:</strong> {extraForm.name} ({extraForm.score || '-'} / 10)
                            </div>
                          )}
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {student.comments?.[team] || <span style={{ fontStyle: 'italic' }}>No comments.</span>}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {nextStudent && (
                    <div className="flex-between mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Allocations are saved automatically.</span>
                      <button 
                        className="btn btn-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(nextStudent.id);
                        }}
                      >
                        Save & Next Student
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default FinalReview;
