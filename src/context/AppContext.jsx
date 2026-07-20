import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const TEAMS = [
  'Xemius', 'Powerhouse', 'Laasya', 'Majestic Swaggers', 'Taal', 'Contemporary', 'Z crew'
];

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dance-auditions-user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [students, setStudents] = useState([]);
  const [facultyRoles, setFacultyRoles] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Save current user to local storage for persistence across reloads
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dance-auditions-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dance-auditions-user');
    }
  }, [currentUser]);

  // Fetch initial data & setup realtime subscription
  useEffect(() => {
    fetchStudents();
    fetchFacultyRoles();
    fetchLogs();
    
    const subscription = supabase
      .channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        if (payload.eventType === 'INSERT') {
          setStudents(prev => {
            if (prev.find(s => s.id === payload.new.id)) return prev; // Avoid duplicates from optimistic UI
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === 'DELETE') {
          setStudents(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const facultySubscription = supabase
      .channel('public:faculty_roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_roles' }, payload => {
        if (payload.eventType === 'INSERT') {
          setFacultyRoles(prev => {
            if (prev.find(r => r.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setFacultyRoles(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    const logsSubscription = supabase
      .channel('public:activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, payload => {
        setActivityLogs(prev => {
          if (prev.find(l => l.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(facultySubscription);
      supabase.removeChannel(logsSubscription);
    };
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('*').order('regNo');
    if (data) {
      // Sort them by chest number logically if possible, or leave as returned
      setStudents(data);
    }
    if (error) console.error("Error fetching students:", error);
  };

  const fetchFacultyRoles = async () => {
    const { data, error } = await supabase.from('faculty_roles').select('*').order('name');
    if (data) {
      setFacultyRoles(data);
    }
    if (error) console.error("Error fetching faculty roles:", error);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
    if (data) {
      setActivityLogs(data);
    }
    if (error) console.error("Error fetching logs:", error);
  };

  const logActivity = async (message, type) => {
    // Optimistic log id
    const tempLog = { id: 'temp-' + Date.now(), message, type, created_at: new Date().toISOString() };
    setActivityLogs(prev => [tempLog, ...prev]);
    const { data, error } = await supabase.from('activity_logs').insert([{ message, type }]).select();
    if (error) {
      console.error("Error logging activity:", error);
    } else if (data) {
      setActivityLogs(prev => prev.map(l => l.id === tempLog.id ? data[0] : l));
    }
  };

  const login = (role, team) => {
    setCurrentUser({ role, team });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addStudent = async (studentData) => {
    // We omit ID so Supabase generates the UUID
    const newStudent = { 
      name: studentData.name,
      regNo: studentData.regNo,
      chestNo: studentData.chestNo,
      danceForm: studentData.danceForm,
      allocatedTeam: null,
      scores: {},
      comments: {},
      flags: [],
      transferRequests: []
    };
    
    // Optimistic UI update
    setStudents(prev => [...prev, { ...newStudent, id: 'temp-' + Date.now() }]);
    
    // Real DB insert
    const { data, error } = await supabase.from('students').insert([newStudent]).select();
    if (error) {
      console.error("Error adding student:", error);
      fetchStudents(); // Revert optimistic update on error
    } else if (data) {
      // Replace temp ID with real ID
      setStudents(prev => prev.map(s => s.id.toString().startsWith('temp-') && s.regNo === newStudent.regNo ? data[0] : s));
    }
  };

  const importStudents = async (studentsList) => {
    const formattedStudents = studentsList.map(s => ({
      name: s.name,
      regNo: s.regNo,
      chestNo: s.chestNo,
      danceForm: s.danceForm || 'Any',
      allocatedTeam: null,
      scores: {},
      comments: {},
      flags: [],
      transferRequests: []
    }));
    
    const { data, error } = await supabase.from('students').insert(formattedStudents).select();
    if (error) {
      console.error("Error importing students:", error);
    } else if (data) {
      setStudents(prev => [...prev, ...data]);
    }
  };

  const updateStudentScore = async (studentId, team, criteria, score) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedScores = {
      ...student.scores,
      [team]: {
        ...(student.scores[team] || {}),
        [criteria]: score
      }
    };

    // Optimistic
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, scores: updatedScores } : s));

    // DB
    const { error } = await supabase.from('students').update({ scores: updatedScores }).eq('id', studentId);
    if (error) console.error("Error updating score:", error);
  };

  const updateStudentComment = async (studentId, team, comment) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedComments = {
      ...student.comments,
      [team]: comment
    };

    // Optimistic
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, comments: updatedComments } : s));

    // DB
    const { error } = await supabase.from('students').update({ comments: updatedComments }).eq('id', studentId);
    if (error) console.error("Error updating comment:", error);
  };

  const toggleFlag = async (studentId, team) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentFlags = student.flags || [];
    const newFlags = currentFlags.includes(team) 
      ? currentFlags.filter(t => t !== team)
      : [...currentFlags, team];

    // Optimistic
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, flags: newFlags } : s));

    // DB
    const { error } = await supabase.from('students').update({ flags: newFlags }).eq('id', studentId);
    if (error) console.error("Error toggling flag:", error);
  };

  const allocateTeam = async (studentId, team) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Log the activity if the team is changing
    if (student.allocatedTeam !== team) {
      const studentName = `${student.name} (#${student.chestNo})`;
      if (student.allocatedTeam && team) {
        logActivity(`${studentName} was transferred from ${student.allocatedTeam} to ${team}`, 'TRANSFER');
      } else if (team) {
        logActivity(`${studentName} was added to ${team}`, 'ADD');
      }
    }

    // Optimistic (clear transfer requests on allocation)
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, allocatedTeam: team, transferRequests: [] } : s));

    // DB
    const { error } = await supabase.from('students').update({ allocatedTeam: team, transferRequests: [] }).eq('id', studentId);
    if (error) console.error("Error allocating team:", error);
  };

  const requestTransfer = async (studentId, requestingTeam) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentReqs = student.transferRequests || [];
    if (currentReqs.some(r => r.requestingTeam === requestingTeam)) return;

    const newReqs = [...currentReqs, { requestingTeam, status: 'pending' }];
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, transferRequests: newReqs } : s));
    const { error } = await supabase.from('students').update({ transferRequests: newReqs }).eq('id', studentId);
    if (error) console.error("Error requesting transfer:", error);
  };

  const cancelTransfer = async (studentId, requestingTeam) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newReqs = (student.transferRequests || []).filter(r => r.requestingTeam !== requestingTeam);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, transferRequests: newReqs } : s));
    const { error } = await supabase.from('students').update({ transferRequests: newReqs }).eq('id', studentId);
    if (error) console.error("Error canceling transfer:", error);
  };

  const authorizeTransfer = async (studentId, requestingTeam) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newReqs = (student.transferRequests || []).map(r => 
      r.requestingTeam === requestingTeam ? { ...r, status: 'authorized' } : r
    );
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, transferRequests: newReqs } : s));
    const { error } = await supabase.from('students').update({ transferRequests: newReqs }).eq('id', studentId);
    if (error) console.error("Error authorizing transfer:", error);
  };

  const clearData = async () => {
    // Assuming you want to delete everything. Supabase doesn't have a bulk truncate from the client easily unless you do a big delete.
    // For safety, let's select all IDs and delete them, or delete where id != null
    const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) {
      setStudents([]);
    } else {
      console.error("Error clearing data:", error);
    }
  };

  const deleteStudents = async (ids) => {
    // Optimistic
    setStudents(prev => prev.filter(s => !ids.includes(s.id)));

    // DB
    const { error } = await supabase.from('students').delete().in('id', ids);
    if (error) console.error("Error deleting students:", error);
  };

  const addFacultyRole = async (name) => {
    const roleName = name.startsWith('Faculty ') ? name : `Faculty - ${name}`;
    const { data, error } = await supabase.from('faculty_roles').insert([{ name: roleName }]).select();
    if (error) {
      console.error("Error adding faculty role:", error);
    } else if (data) {
      setFacultyRoles(prev => [...prev, ...data]);
    }
  };

  const deleteFacultyRole = async (id) => {
    const { error } = await supabase.from('faculty_roles').delete().eq('id', id);
    if (error) {
      console.error("Error deleting faculty role:", error);
    } else {
      setFacultyRoles(prev => prev.filter(r => r.id !== id));
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    students,
    addStudent,
    importStudents,
    updateStudentScore,
    updateStudentComment,
    toggleFlag,
    allocateTeam,
    clearData,
    deleteStudents,
    facultyRoles,
    addFacultyRole,
    deleteFacultyRole,
    activityLogs,
    requestTransfer,
    cancelTransfer,
    authorizeTransfer,
    logActivity
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
