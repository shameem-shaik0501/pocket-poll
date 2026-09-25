export interface Voter {
  voterId: string;
  name: string;
  hasVoted: boolean;
  isBlocked: boolean;
  votedAt?: string | null;
}

export interface Candidate {
  candidateId: string;
  name: string;
  party: string;
  tagline: string;
  keyInitiative: string;
  accentColor: string;
  votesCount: number;
  isDesignatedLeader?: boolean;
}

export interface TimerState {
  timerId: string;
  durationMinutes: number;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isExpired: boolean;
  startedAt: string;
  expiresAt: string;
}

export interface DbStatus {
  isConnected: boolean;
  readyState: number;
  readyStateText: string;
  clusterUser: string;
  clusterHost: string;
  dbName: string;
  lastError: string | null;
}

export interface ElectionAnalytics {
  totalVoters: number;
  totalVotesCast: number;
  blockedVoters: number;
  pendingVoters: number;
  turnoutPercentage: string;
  candidates: Candidate[];
  leadingCandidate: Candidate | null;
  designatedLeaderId: string | null;
  timer: TimerState;
  dbStatus: DbStatus;
}
