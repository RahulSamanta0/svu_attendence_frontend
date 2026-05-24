export const MOCK_PERSONS = [
  { _id: 'm1', name: 'Sarah Jenkins', rollNumber: 'SVU-1001' },
  { _id: 'm2', name: 'Michael Chen', rollNumber: 'SVU-1002' },
  { _id: 'm3', name: 'Emily Rodriguez', rollNumber: 'SVU-1003' },
  { _id: 'm4', name: 'James Wilson', rollNumber: 'SVU-1004' },
  { _id: 'm5', name: 'Priya Patel', rollNumber: 'SVU-1005' },
  { _id: 'm6', name: 'David Kim', rollNumber: 'SVU-1006' },
  { _id: 'm7', name: 'Lisa Taylor', rollNumber: 'SVU-1007' },
  { _id: 'm8', name: 'Marcus Johnson', rollNumber: 'SVU-1008' },
  { _id: 'm9', name: 'Anna Martinez', rollNumber: 'SVU-1009' },
  { _id: 'm10', name: 'Robert Lee', rollNumber: 'SVU-1010' },
];

export const generateMockReports = (dates: string[], persons: any[] = MOCK_PERSONS) => {
  const reports: any[] = [];
  dates.forEach(dateStr => {
    if (new Date(dateStr) > new Date()) return;
    persons.forEach((p) => {
       const dayNum = new Date(dateStr).getDate();
       const rand = (p.name.length + dayNum) % 10;
       let status = 'Present';
       if (rand === 0) status = 'Absent';
       else if (rand === 1 || rand === 2) status = 'Late';
       
       reports.push({
         date: dateStr,
         personId: p._id,
         name: p.name,
         rollNumber: p.rollNumber,
         status,
         checkInTime: status === 'Late' ? '09:45' : status === 'Present' ? '08:55' : '',
         checkOutTime: status !== 'Absent' ? '17:05' : '',
         isEarlyCheckOut: rand === 3
       });
    });
  });
  return reports;
};
