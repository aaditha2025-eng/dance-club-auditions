import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, TEAMS } from '../context/AppContext';

const Login = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [role, setRole] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (role) {
      login(role);
      navigate('/');
    }
  };

  const ROLES = ['Admin', ...TEAMS, 'Faculty Coordinator'];

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '2rem', color: 'white',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-neon)'
          }}>
            D
          </div>
          <h1 className="text-gradient">DanceAuditions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select your role to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Login As</label>
            <select 
              className="input-field" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>Select Team or Faculty</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Enter Platform
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
