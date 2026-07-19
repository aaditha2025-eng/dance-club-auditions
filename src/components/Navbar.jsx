import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogOut, Users, ClipboardList, BarChart3, ListChecks } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const canManageStudents = currentUser?.role === 'Admin' || currentUser?.role === 'Faculty Coordinator';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="flex-center gap-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.2rem', color: 'white'
          }}>
            D
          </div>
          <h2 className="text-gradient" style={{ margin: 0 }}>DanceAuditions</h2>
        </div>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardList size={18} /> Roster
        </NavLink>
        {canManageStudents && (
          <NavLink to="/review" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListChecks size={18} /> Final Review
          </NavLink>
        )}
        <NavLink to="/teams" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> Teams
        </NavLink>
        <NavLink to="/scores" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} /> Scores
        </NavLink>
      </div>

      <div className="flex-center gap-4">
        <div className="badge badge-outline" style={{ color: 'var(--accent-pink)', padding: '0.5rem 1rem' }}>
          {currentUser?.role}
        </div>
        <button onClick={handleLogout} className="btn btn-glass" style={{ padding: '0.5rem' }} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
