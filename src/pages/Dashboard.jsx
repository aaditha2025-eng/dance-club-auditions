import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { importFromExcel, exportToExcel } from '../utils/excel';
import { Upload, Download, Plus, Search, Flag, ClipboardList, Trash2, CheckSquare } from 'lucide-react';

const Dashboard = () => {
  const { students, importStudents, addStudent, currentUser, deleteStudents, clearData } = useAppContext();
  const canManageStudents = currentUser?.role === 'Admin' || currentUser?.role === 'Faculty Coordinator';
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [slot, setSlot] = useState('A');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, ids: [], type: '' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', regNo: '', danceForm: '' });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file, slot);
      importStudents(imported);
      e.target.value = null; // reset
    } catch (err) {
      alert("Error importing Excel file. Ensure it has Name, RegNo, DanceForm columns.");
      console.error(err);
    }
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    // Calculate next chest number for this slot
    const slotStudents = students.filter(s => s.chestNo.endsWith(slot));
    const nextNum = slotStudents.length + 1;
    
    addStudent({
      ...newStudent,
      chestNo: `${nextNum}${slot}`
    });
    
    setNewStudent({ name: '', regNo: '', danceForm: '' });
    setShowAddModal(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.chestNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      setDeleteConfirm({ show: true, ids: selectedIds, type: 'bulk' });
    }
  };

  const handleDeleteAll = () => {
    setDeleteConfirm({ show: true, ids: [], type: 'all' });
  };

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Audition Roster</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Total Registered: {students.length}</p>
        </div>
        <div className="flex-center gap-4">
          <button onClick={() => exportToExcel(students)} className="btn btn-glass">
            <Download size={18} /> Export Data
          </button>
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
              placeholder="Name, Chest No, or Reg No" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {canManageStudents && (
          <>
            <div className="input-group" style={{ margin: 0, width: '150px' }}>
              <label>Import Slot</label>
              <select className="input-field" value={slot} onChange={(e) => setSlot(e.target.value)}>
                {['A', 'B', 'C', 'D', 'E', 'F'].map(s => <option key={s} value={s}>Slot {s}</option>)}
              </select>
            </div>

            <button onClick={() => fileInputRef.current?.click()} className="btn btn-glass" style={{ height: '46px' }}>
              <Upload size={18} /> Import Excel
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
              />
            </button>

            <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ height: '46px' }}>
              <Plus size={18} /> Manual Add
            </button>
            
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn" style={{ height: '46px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                <Trash2 size={18} /> Delete Selected ({selectedIds.length})
              </button>
            )}

            {students.length > 0 && (
              <button onClick={handleDeleteAll} className="btn" style={{ height: '46px', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                Delete All
              </button>
            )}
          </>
        )}
      </div>

      {showAddModal && canManageStudents && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 className="mb-4">Add Student Manually</h2>
            <form onSubmit={handleAddStudent}>
              <div className="input-group">
                <label>Name</label>
                <input required type="text" className="input-field" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Registration Number</label>
                <input required type="text" className="input-field" value={newStudent.regNo} onChange={e => setNewStudent({...newStudent, regNo: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Dance Form</label>
                <input required type="text" className="input-field" value={newStudent.danceForm} onChange={e => setNewStudent({...newStudent, danceForm: e.target.value})} />
              </div>
              <div className="input-group mb-4">
                <label>Slot to Add To</label>
                <select className="input-field" value={slot} onChange={e => setSlot(e.target.value)}>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(s => <option key={s} value={s}>Slot {s}</option>)}
                </select>
              </div>
              <div className="flex-between">
                <button type="button" className="btn btn-glass" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div className="glass-panel empty-state">
          <ClipboardList size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
          <h3>No Students Yet</h3>
          <p>Import an Excel file or add a student manually to begin.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredStudents.map(student => (
            <div key={student.id} className={`card glass-panel ${selectedIds.includes(student.id) ? 'selected' : ''}`} onClick={() => navigate(`/student/${student.id}`)} style={selectedIds.includes(student.id) ? { borderColor: 'var(--accent-pink)' } : {}}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {canManageStudents && (
                    <div 
                      onClick={(e) => handleSelect(e, student.id)}
                      style={{ cursor: 'pointer', color: selectedIds.includes(student.id) ? 'var(--accent-pink)' : 'var(--text-secondary)' }}
                    >
                      <CheckSquare size={18} />
                    </div>
                  )}
                  <div className="badge badge-filled" style={{ fontSize: '1rem', padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-primary)' }}>
                    #{student.chestNo}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {student.flags?.map(team => (
                    <div key={team} className={`team-flag flag-${team.replace(' ', '')}`} title={`${team} flagged`}>
                      <Flag size={12} fill="currentColor" />
                    </div>
                  ))}
                  
                  {canManageStudents && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, ids: [student.id], type: 'single' }); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '0.5rem' }}
                      title="Delete Student"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{student.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Reg No: {student.regNo}</p>
              </div>
              
              <div className="flex-between mt-2">
                <span style={{ fontSize: '0.875rem', color: 'var(--accent-blue)' }}>{student.danceForm}</span>
                {student.allocatedTeam ? (
                  <span className="badge badge-outline" style={{ color: 'var(--accent-purple)' }}>{student.allocatedTeam}</span>
                ) : (
                  <span className="badge badge-outline" style={{ color: 'var(--text-secondary)' }}>Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <h2 className="mb-2">Are you sure?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {deleteConfirm.type === 'all' 
                ? 'This will permanently delete all student records. This action cannot be undone.' 
                : `This will delete ${deleteConfirm.ids.length} selected student(s). This action cannot be undone.`}
            </p>
            <div className="flex-between gap-4">
              <button 
                className="btn btn-glass" 
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirm({ show: false, ids: [], type: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: '#ef4444', color: 'white' }}
                onClick={() => {
                  if (deleteConfirm.type === 'all') {
                    clearData();
                  } else {
                    deleteStudents(deleteConfirm.ids);
                  }
                  setSelectedIds([]);
                  setDeleteConfirm({ show: false, ids: [], type: '' });
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
