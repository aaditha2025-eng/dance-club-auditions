import React, { useState } from 'react';
import { useAppContext, TEAMS } from '../context/AppContext';
import { Users } from 'lucide-react';

const TeamsOverview = () => {
  const { students } = useAppContext();
  const [activeTeam, setActiveTeam] = useState(TEAMS[0]);

  const teamMembers = students.filter(s => s.allocatedTeam === activeTeam);

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Teams Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View allocated members for each team.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TEAMS.map(team => {
          const count = students.filter(s => s.allocatedTeam === team).length;
          return (
            <button 
              key={team}
              onClick={() => setActiveTeam(team)}
              className={`btn ${activeTeam === team ? 'btn-primary' : 'btn-glass'}`}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {team} <span className="badge badge-filled" style={{ backgroundColor: 'rgba(0,0,0,0.3)', marginLeft: '0.5rem' }}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users color="var(--accent-blue)" /> {activeTeam} Roster
        </h2>

        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <p>No members allocated to {activeTeam} yet.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {teamMembers.map(student => (
              <div key={student.id} className="card glass-panel" style={{ background: 'var(--bg-primary)' }}>
                <div className="flex-between mb-2">
                  <div className="badge badge-outline">#{student.chestNo}</div>
                </div>
                <h3>{student.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Reg No: {student.regNo}</p>
                <div className="mt-2">
                  <span style={{ fontSize: '0.875rem', color: 'var(--accent-pink)' }}>{student.danceForm}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsOverview;
