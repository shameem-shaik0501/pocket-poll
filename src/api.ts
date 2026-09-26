import { Voter, Candidate, TimerState, ElectionAnalytics, DbStatus } from './types';

const API_BASE = '/api';

/** Safely parse JSON. Prevents "Unexpected end of JSON input" crashes. */
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from server (HTTP ${res.status}). Is the API running?`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON (HTTP ${res.status}): ${text.slice(0, 150)}`);
  }
}

export async function fetchVoters(): Promise<Voter[]> {
  const res = await fetch(`${API_BASE}/voters`);
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch voters');
  }
  return data.voters;
}

export async function authenticateVoterApi(voterId: string, password: string): Promise<{ success: boolean; voter: Voter }> {
  const res = await fetch(`${API_BASE}/voters/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, password }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Authentication failed');
  }
  return data;
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${API_BASE}/candidates`);
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch candidates');
  }
  return data.candidates;
}

export async function castVoteApi(voterId: string, candidateId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, candidateId }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to record vote');
  }
  return data;
}

export async function fetchTimer(): Promise<TimerState> {
  const res = await fetch(`${API_BASE}/timer`);
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch timer');
  }
  return data.timer;
}

export async function adminLoginApi(username: string, password: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Admin credentials invalid');
  }
  return data;
}

export async function fetchAdminAnalytics(adminToken?: string): Promise<ElectionAnalytics> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    const error = new Error(data.error || 'Failed to load admin analytics');
    (error as any).timeLocked = data.timeLocked;
    (error as any).remainingSeconds = data.remainingSeconds;
    throw error;
  }
  return data;
}

export async function connectDatabaseApi(password: string): Promise<{ success: boolean; dbStatus: DbStatus }> {
  const res = await fetch(`${API_BASE}/admin/connect-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to connect database');
  }
  return data;
}

export async function resetElectionApi(): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/reset`, {
    method: 'POST',
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reset election');
  }
  return data;
}

export async function adminAddVoterApi(voterId?: string, name?: string, password?: string): Promise<{ success: boolean; voter: Voter; message: string }> {
  const res = await fetch(`${API_BASE}/admin/voter/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, name, password }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add voter');
  return data;
}

export async function adminRemoveVoterApi(voterId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/voter/${encodeURIComponent(voterId)}`, {
    method: 'DELETE',
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove voter');
  return data;
}

export async function adminToggleBlockVoterApi(voterId: string, isBlocked?: boolean): Promise<{ success: boolean; result: { voterId: string; isBlocked: boolean }; message: string }> {
  const res = await fetch(`${API_BASE}/admin/voter/toggle-block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, isBlocked }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle block voter');
  return data;
}

export async function adminAddCandidateApi(candidate: {
  name: string;
  party: string;
  tagline?: string;
  keyInitiative?: string;
  accentColor?: string;
}): Promise<{ success: boolean; candidate: Candidate; message: string }> {
  const res = await fetch(`${API_BASE}/admin/candidate/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidate),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add candidate');
  return data;
}

export async function adminRemoveCandidateApi(candidateId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/candidate/${encodeURIComponent(candidateId)}`, {
    method: 'DELETE',
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove candidate');
  return data;
}

export async function adminToggleVoteLeaderApi(candidateId: string, isLeader: boolean): Promise<{ success: boolean; message: string; result: { candidateId: string; isDesignatedLeader: boolean } }> {
  const res = await fetch(`${API_BASE}/admin/candidate/leader`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId, isLeader }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update vote leader');
  return data;
}

export async function adminStartTimerApi(): Promise<{ success: boolean; timer: TimerState; message: string }> {
  const res = await fetch(`${API_BASE}/admin/timer/start`, {
    method: 'POST',
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start timer');
  return data;
}

export async function adminStopTimerApi(): Promise<{ success: boolean; timer: TimerState; message: string }> {
  const res = await fetch(`${API_BASE}/admin/timer/stop`, {
    method: 'POST',
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to stop timer');
  return data;
}

export async function adminSetTimerDurationApi(minutes: number): Promise<{ success: boolean; timer: TimerState; message: string }> {
  const res = await fetch(`${API_BASE}/admin/timer/duration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes }),
  });
  const data = await safeJson(res);
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set timer duration');
  return data;
}
