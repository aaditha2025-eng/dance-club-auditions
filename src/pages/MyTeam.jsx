import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, TEAMS } from '../context/AppContext';

const MyTeam = () => {
  const { students, currentUser, authorizeTransfer } = useAppContext();
  const navigate = useNavigate();

  const role = currentUser?.role;
  const isTeamLead = TEAMS.includes(role);

  if (!isTeamLead) {
    return <div className="container empty-state">You do not have access to this page.</div>;
  }

  const teamMembers = useMemo(() => students.filter(s => s.allocatedTeam === role), [students, role]);
  
  const membersWithRequests = useMemo(() => teamMembers.filter(s => s.transferRequests && s.transferRequests.length > 0), [teamMembers]);

  return (
    <div className="container animate-fade-in">
      <h1 className="mb-4">My Team: <span style={{ color: 'var(--accent-red)' }}>{role}</span></h1>

      {membersWithRequests.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--accent-red)' }}>
          <h2 className="mb-4" style={{ color: 'var(--accent-red)' }}>Action Required: Transfer Requests</h2>
          <div className="grid-cards">
            {membersWithRequests.map(student => (
              <div key={student.id} className="card" style={{ background: 'rgba(255, 42, 42, 0.05)' }}>
                <div onClick={() => navigate(`/student/${student.id}`)}>
                  <div className="flex-between mb-2">
                    <span className="badge badge-filled">#{student.chestNo}</span>
                    <span className="badge badge-outline" style={{ color: 'var(--accent-pink)' }}>{student.regNo}</span>
                  </div>
                  <h3 className="mb-2">{student.name}</h3>
                </div>
                
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  {student.transferRequests.map((req, idx) => (
                    <div key={idx} className="flex-between mb-2">
                      <span style={{ fontSize: '0.9rem' }}>
                        <strong>{req.requestingTeam}</strong> wants this member.
                      </span>
                      {req.status === 'pending' ? (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={(e) => { e.stopPropagation(); authorizeTransfer(student.id, req.requestingTeam); }}
                        >
                          Authorize
                        </button>
                      ) : (
                        <span className="badge badge-outline" style={{ color: 'var(--accent-blue)' }}>Authorized</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="flex-between mb-4">
          <h2>Current Members</h2>
          <span className="badge badge-filled" style={{ fontSize: '1rem' }}>Total: {teamMembers.length}</span>
        </div>

        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <h3>No members yet</h3>
            <p>Your team members will appear here once allocated by the Admin.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {teamMembers.map(student => (
              <div key={student.id} className="card" onClick={() => navigate(`/student/${student.id}`)}>
                <div className="flex-between mb-2">
                  <span className="badge badge-filled">#{student.chestNo}</span>
                  <span className="badge badge-outline" style={{ color: 'var(--text-secondary)' }}>{student.danceForm}</span>
                </div>
                <h3 className="mb-1">{student.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{student.regNo}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
