import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, TEAMS } from '../context/AppContext';
import { BarChart3, Search } from 'lucide-react';

const CRITERIA = ['Rhythm', 'Expression', 'Technique', 'Overall Impact'];

const ScoresOverview = () => {
  const { students, currentUser, facultyRoles } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.chestNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Scores Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View all scores from all team leads (Read Only).</p>
        </div>
      </div>

      <div className="glass-panel mb-4" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label>Search Student</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Name or Chest No" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel table-responsive" style={{ padding: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
              <th style={{ padding: '1rem', width: '250px' }}>Student</th>
              {[...TEAMS, ...facultyRoles.map(f => f.name)].map(team => (
                <th key={team} style={{ padding: '1rem', textAlign: 'center' }}>
                  {team.startsWith('Faculty - ') ? team.replace('Faculty - ', '') : team === 'Faculty Coordinator' ? 'Faculty' : team}
                </th>
              ))}
              <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-pink)' }}>Average</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => {
              let totalScore = 0;
              let scoreCount = 0;

              return (
                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="badge badge-filled" style={{ backgroundColor: 'var(--glass-bg)' }}>#{student.chestNo}</div>
                      <div 
                        style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => navigate(`/student/${student.id}`)}
                      >
                        <div style={{ fontWeight: 500 }}>{student.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.danceForm}</div>
                      </div>
                    </div>
                  </td>
                  
                  {[...TEAMS, ...facultyRoles.map(f => f.name)].map(team => {
                    const teamScores = student.scores?.[team];
                    let teamTotal = 0;
                    let teamCount = 0;
                    
                    if (teamScores) {
                      Object.entries(teamScores).forEach(([k, s]) => {
                        if (typeof s === 'number') {
                          teamTotal += s;
                          teamCount++;
                          totalScore += s;
                          scoreCount++;
                        }
                      });
                    }
                    
                    const teamAvg = teamCount > 0 ? (teamTotal / teamCount).toFixed(1) : '-';

                    return (
                      <td key={team} style={{ padding: '1rem', textAlign: 'center', color: teamAvg !== '-' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {teamAvg}
                      </td>
                    );
                  })}
                  
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                    {scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoresOverview;
