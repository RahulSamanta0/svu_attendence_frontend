const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getPersons() {
  const response = await fetch(`${API_URL}/persons`);
  if (!response.ok) {
    throw new Error('Failed to fetch persons');
  }
  return response.json();
}

export async function createPerson(data: { name: string; employeeId: string }) {
  const response = await fetch(`${API_URL}/persons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create person');
  }
  return response.json();
}

export async function getAttendance(date: string) {
  const response = await fetch(`${API_URL}/attendance?date=${date}`);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance');
  }
  return response.json();
}

export async function submitAttendance(data: {
  date: string;
  records: {
    personId: string;
    status: string;
    checkInTime: string;
    checkOutTime: string;
    isEarlyCheckOut: boolean;
  }[];
}) {
  const response = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to submit attendance');
  }
  return response.json();
}

export async function getReports(startDate?: string, endDate?: string) {
  let url = `${API_URL}/reports`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  return response.json();
}

export async function getAnalytics() {
  const response = await fetch(`${API_URL}/analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return response.json();
}
