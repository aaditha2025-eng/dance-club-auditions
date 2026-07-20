import React from 'react';
import { useAppContext } from '../context/AppContext';

const Logs = () => {
  const { activityLogs, currentUser } = useAppContext();

  const role = currentUser?.role;
  const canViewLogs = role === 'Admin' || role?.startsWith('Faculty');

  if (!canViewLogs) {
    return <div className="container empty-state">You do not have access to this page.</div>;
  }

  return (
    <div className="container animate-fade-in">
      <h1 className="mb-4">Activity Logs</h1>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {activityLogs.length === 0 ? (
          <div className="empty-state">
            <h3>No activity yet</h3>
            <p>Team allocations and transfers will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityLogs.map(log => (
              <div key={log.id} style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderLeft: `4px solid ${log.type === 'TRANSFER' ? 'var(--accent-blue)' : 'var(--accent-red)'}`,
                borderRadius: '4px'
              }}>
                <div className="flex-between mb-1">
                  <span className="badge badge-filled" style={{ backgroundColor: 'transparent', border: '1px solid var(--glass-border)' }}>
                    {log.type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '1.1rem' }}>{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
