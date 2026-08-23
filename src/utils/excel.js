import * as XLSX from 'xlsx';

export const importFromExcel = (file, defaultSlot) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (jsonData.length === 0) return resolve([]);

        // Find Calendly's time column
        const timeKey = Object.keys(jsonData[0]).find(k => k.toLowerCase().includes('start date') || k.toLowerCase().includes('time'));
        
        if (timeKey) {
          jsonData.sort((a, b) => new Date(a[timeKey]) - new Date(b[timeKey]));
        }

        const slotLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        let currentSlotIdx = slotLetters.indexOf(defaultSlot) !== -1 ? slotLetters.indexOf(defaultSlot) : 0;
        let lastTime = null;
        let chestCounter = 1;

        const getRegNo = (row) => {
          for (let key in row) {
            if (key.toLowerCase().includes('reg') && !key.toLowerCase().includes('region')) return row[key];
          }
          return '';
        };

        const getDanceForm = (row) => {
          for (let key in row) {
            if (key.toLowerCase().includes('dance form') || key.toLowerCase().includes('style') || key.toLowerCase().includes('genre')) return row[key];
          }
          return 'Open';
        };

        const getName = (row) => row['Invitee Name'] || row.Name || row.name || 'Unknown Participant';

        const students = jsonData.map((row) => {
          if (timeKey && row[timeKey] && defaultSlot === 'Auto') {
            const currentTime = new Date(row[timeKey]).getTime();
            if (lastTime) {
               // If gap > 2 hours (7200000 ms), switch to next slot letter
               if (currentTime - lastTime > 7200000) {
                 currentSlotIdx++;
                 chestCounter = 1;
               }
            }
            lastTime = currentTime;
          }

          const assignedSlot = slotLetters[currentSlotIdx] || 'Z';
          const student = {
            name: getName(row),
            regNo: getRegNo(row),
            danceForm: getDanceForm(row),
            chestNo: `${chestCounter}${assignedSlot}`
          };
          chestCounter++;
          return student;
        });

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
