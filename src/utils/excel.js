import * as XLSX from 'xlsx';

export const importFromExcel = (file, slot) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Transform based on expected headers: Name, RegNo, DanceForm
        const students = jsonData.map((row, index) => ({
          name: row.Name || row.name || `Student ${index+1}`,
          regNo: row.RegNo || row['Registration Number'] || row.regNo || '',
          danceForm: row.DanceForm || row['Dance Form'] || 'Open',
          chestNo: `${index + 1}${slot}` // e.g., 1A, 2A
        }));
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (students) => {
  // Transform students state into flat format for Excel
  const exportData = students.map(s => {
    const row = {
      'Chest Number': s.chestNo,
      'Registration Number': s.regNo,
      'Name': s.name,
      'Primary Dance Form': s.danceForm,
      'Extra Dance Form': s.extraDanceForm || 'N/A',
      'Allocated Team': s.allocatedTeam || 'Pending',
      'Flags': s.flags.join(', ') || 'None'
    };

    // Flatten scores and comments
    // Example: TeamName - Criteria - Score
    // But for a simple table, maybe just average score or JSON string for simplicity,
    // or specific columns if we know the criteria
    
    let totalScore = 0;
    let scoreCount = 0;
    
    if (s.scores) {
      Object.entries(s.scores).forEach(([team, criteriaScores]) => {
        Object.entries(criteriaScores).forEach(([criteria, score]) => {
          row[`${team} - ${criteria}`] = score;
          totalScore += score;
          scoreCount++;
        });
      });
    }
    
    row['Average Score'] = scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : 'N/A';
    
    if (s.comments) {
      Object.entries(s.comments).forEach(([team, comment]) => {
        row[`${team} Comment`] = comment;
      });
    }

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditions Data');
  XLSX.writeFile(workbook, `Dance_Auditions_${new Date().toISOString().split('T')[0]}.xlsx`);
};
