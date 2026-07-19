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

    return () => {
      supabase.removeChannel(subscription);
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
      flags: []
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
      flags: []
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
    // Optimistic
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, allocatedTeam: team } : s));

    // DB
    const { error } = await supabase.from('students').update({ allocatedTeam: team }).eq('id', studentId);
    if (error) console.error("Error allocating team:", error);
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
    deleteStudents
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
