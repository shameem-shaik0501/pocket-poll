/**
 * Pocket Poll - Core Data & Election Service
 * Manages Voters, Candidates, and the Global Countdown Timer.
 * Interacts with MongoDB Atlas (shameem278700_db_user) with auto-resilient state.
 * Full Admin Capability: Add/Remove/Block Voter, Add/Remove/Vote Leader Candidate, Timer Start/Stop/Duration.
 */

import { Voter } from './models/Voter.js';
import { Candidate } from './models/Candidate.js';
import { PollTimer } from './models/PollTimer.js';
import { connectDB, getDbStatus } from './db.js';
import mongoose from 'mongoose';

// 5 Official Candidates
export const INITIAL_CANDIDATES = [
  {
    candidateId: 'CAND-1',
    name: 'Dr. Elena Vance',
    party: 'Digital Integrity Alliance',
    tagline: 'Cryptographic Transparency & Civil Liberties in Civic Tech',
    keyInitiative: 'Open-source state audit algorithms with real-time public verification',
    accentColor: '#06b6d4', // Cyan
    votesCount: 0,
    isDesignatedLeader: false,
  },
  {
    candidateId: 'CAND-2',
    name: 'Marcus Sterling',
    party: 'Future Forward Movement',
    tagline: 'Autonomous Infrastructure & Next-Gen Smart Communities',
    keyInitiative: 'Decentralized energy grids and high-speed municipal data conduits',
    accentColor: '#3b82f6', // Blue
    votesCount: 0,
    isDesignatedLeader: false,
  },
  {
    candidateId: 'CAND-3',
    name: 'Aria Chen',
    party: 'Civic Protocol Collective',
    tagline: 'Participatory Governance & Open Public Budgeting',
    keyInitiative: 'Citizen-directed neighborhood allocations and automated fiscal transparency',
    accentColor: '#10b981', // Emerald
    votesCount: 0,
    isDesignatedLeader: false,
  },
  {
    candidateId: 'CAND-4',
    name: 'David Okonjo',
    party: 'NextGen Economy Forum',
    tagline: 'Fair Algorithmic Commerce & Small Enterprise Empowerment',
    keyInitiative: 'Universal digital infrastructure subsidies and local tech incubators',
    accentColor: '#f59e0b', // Amber
    votesCount: 0,
    isDesignatedLeader: false,
  },
  {
    candidateId: 'CAND-5',
    name: 'Sophia Rodriguez',
    party: 'Clean Horizons Initiative',
    tagline: 'Carbon-Neutral Modernization & Resilient Civic Ecosystems',
    keyInitiative: '100% renewable sensor networks and green tech transition grants',
    accentColor: '#8b5cf6', // Violet
    votesCount: 0,
    isDesignatedLeader: false,
  },
];

// Helper to generate 100 voter IDs CAN-001 through CAN-100
export function generate100Voters() {
  const voters = [];
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Pat', 'Riley', 'Casey', 'Avery',
    'Dakota', 'Reese', 'Cameron', 'Logan', 'Skyler', 'Finley', 'Hayden', 'Rowan', 'Quinn', 'Emerson',
    'Harper', 'Peyton', 'Sawyer', 'Eden', 'Amari', 'Kai', 'River', 'Milan', 'Sage', 'Kendall',
    'Shiloh', 'Dallas', 'Phoenix', 'Elliott', 'Rory', 'Remi', 'Lennon', 'Charlie', 'Blake', 'Sloan'
  ];
  const lastNames = [
    'Nazeer', 'Rahman', 'Chen', 'Patel', 'Kim', 'Okonjo', 'Silva', 'Mendoza', 'Novak', 'Tanaka',
    'Johansson', 'Dubois', 'Santos', 'Kowalski', 'Al-Mansoor', 'Ito', 'Gomez', 'Fischer', 'Bauer', 'Rossi'
  ];

  for (let i = 1; i <= 100; i++) {
    const idNum = String(i).padStart(3, '0');
    const voterId = `CAN-${idNum}`;
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 13) % lastNames.length];
    voters.push({
      voterId,
      name: `${fn} ${ln}`,
      password: voterId, // Exact uppercase ID
      hasVoted: false,
      isBlocked: false,
      votedCandidateId: null,
      votedAt: null,
    });
  }
  return voters;
}

// Global In-Memory mirror
let memoryVoters = generate100Voters();
let memoryCandidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
let timerDurationMinutes = 100;
let timerIsRunning = true;
let timerStartTime = Date.now();
let timerExpiresTime = timerStartTime + timerDurationMinutes * 60 * 1000;
let timerPausedRemainingSeconds = null;

export async function initializeDatabase() {
  const dbStatus = getDbStatus();
  if (dbStatus.isConnected) {
    try {
      // Seed Candidates if empty
      const candidateCount = await Candidate.countDocuments();
      if (candidateCount === 0) {
        await Candidate.insertMany(INITIAL_CANDIDATES);
        console.log('🗳️ [Seed] Initialized candidates in MongoDB Atlas');
      } else {
        const dbCandidates = await Candidate.find().lean();
        memoryCandidates = dbCandidates;
      }

      // Seed Voters if empty
      const voterCount = await Voter.countDocuments();
      if (voterCount === 0) {
        const seedVoters = generate100Voters();
        await Voter.insertMany(seedVoters);
        console.log('👥 [Seed] Initialized 100 pre-seeded voters in MongoDB Atlas');
      } else {
        const dbVoters = await Voter.find().lean();
        memoryVoters = dbVoters;
      }

      // Seed / load PollTimer
      let timer = await PollTimer.findOne({ timerId: 'global_100m_timer' });
      if (!timer) {
        timer = await PollTimer.create({
          timerId: 'global_100m_timer',
          durationMinutes: timerDurationMinutes,
          startedAt: new Date(timerStartTime),
          expiresAt: new Date(timerExpiresTime),
          isRunning: true,
        });
        console.log('⏱️ [Seed] Initialized global timer in MongoDB Atlas');
      } else {
        timerDurationMinutes = timer.durationMinutes || 100;
        timerStartTime = new Date(timer.startedAt).getTime();
        timerExpiresTime = new Date(timer.expiresAt).getTime();
        timerIsRunning = timer.isRunning !== false;
        timerPausedRemainingSeconds = timer.pausedRemainingSeconds;
      }
    } catch (err) {
      console.error('Error during MongoDB seeding:', err.message);
    }
  }
}

export async function getVotersList() {
  if (mongoose.connection.readyState === 1) {
    try {
      const voters = await Voter.find({}, 'voterId name hasVoted isBlocked votedAt').sort({ voterId: 1 }).lean();
      if (voters && voters.length > 0) {
        return voters;
      }
    } catch (e) {
      console.warn('Fallback to memory voters:', e.message);
    }
  }

  return memoryVoters.map(v => ({
    voterId: v.voterId,
    name: v.name,
    hasVoted: Boolean(v.hasVoted),
    isBlocked: Boolean(v.isBlocked),
    votedAt: v.votedAt,
  }));
}

export async function getVoterById(voterId) {
  const normalizedId = voterId.trim().toUpperCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const voter = await Voter.findOne({ voterId: normalizedId }).lean();
      if (voter) return voter;
    } catch (e) {
      console.warn('Error fetching voter from DB:', e.message);
    }
  }

  return memoryVoters.find(v => v.voterId === normalizedId) || null;
}

export async function authenticateVoter(voterId, password) {
  const cleanId = (voterId || '').trim().toUpperCase();
  const cleanPassword = (password || '').trim();

  const voter = await getVoterById(cleanId);
  if (!voter) {
    return { success: false, error: 'Voter ID not recognized in the electoral registry.' };
  }

  if (voter.isBlocked) {
    return {
      success: false,
      error: `Voter ${cleanId} is BLOCKED by election administrators. Authorization denied.`,
      isBlocked: true,
    };
  }

  if (voter.hasVoted) {
    return {
      success: false,
      error: `Voter ${cleanId} has already cast their ballot and cannot vote again.`,
      alreadyVoted: true,
    };
  }

  const expectedPassword = (voter.password || cleanId).trim();
  if (
    cleanPassword !== expectedPassword &&
    cleanPassword.toUpperCase() !== expectedPassword.toUpperCase() &&
    cleanPassword !== cleanId
  ) {
    return {
      success: false,
      error: `Invalid credentials for voter ${cleanId}. The default password is their exact uppercase ID (${cleanId}).`,
    };
  }

  return {
    success: true,
    voter: {
      voterId: voter.voterId,
      name: voter.name,
      hasVoted: voter.hasVoted,
      isBlocked: Boolean(voter.isBlocked),
    },
  };
}

export async function getCandidatesList() {
  if (mongoose.connection.readyState === 1) {
    try {
      const candidates = await Candidate.find({}).sort({ candidateId: 1 }).lean();
      if (candidates && candidates.length > 0) {
        return candidates;
      }
    } catch (e) {
      console.warn('Fallback to memory candidates:', e.message);
    }
  }

  return memoryCandidates;
}

export async function castVote(voterId, candidateId) {
  const cleanVoterId = (voterId || '').trim().toUpperCase();
  const cleanCandId = (candidateId || '').trim().toUpperCase();

  let candidate = memoryCandidates.find(c => c.candidateId === cleanCandId);
  if (!candidate && mongoose.connection.readyState === 1) {
    try {
      candidate = await Candidate.findOne({ candidateId: cleanCandId }).lean();
      if (candidate) memoryCandidates.push(candidate);
    } catch (e) {
      console.warn('Candidate DB lookup fallback error:', e.message);
    }
  }
  if (!candidate) {
    return { success: false, error: 'Invalid candidate selection.' };
  }

  const voter = await getVoterById(cleanVoterId);
  if (!voter) {
    return { success: false, error: 'Voter not found in registry.' };
  }

  if (voter.isBlocked) {
    return { success: false, error: 'Voter is blocked by election administration.' };
  }

  if (voter.hasVoted) {
    return { success: false, error: 'Double voting prohibited: This voter has already cast a ballot.' };
  }

  const votedAt = new Date();

  const memVoter = memoryVoters.find(v => v.voterId === cleanVoterId);
  if (memVoter) {
    memVoter.hasVoted = true;
    memVoter.votedCandidateId = cleanCandId;
    memVoter.votedAt = votedAt;
  }

  const memCandidate = memoryCandidates.find(c => c.candidateId === cleanCandId);
  if (memCandidate) {
    memCandidate.votesCount = (memCandidate.votesCount || 0) + 1;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      await Voter.updateOne(
        { voterId: cleanVoterId },
        { $set: { hasVoted: true, votedCandidateId: cleanCandId, votedAt } }
      );
      await Candidate.updateOne(
        { candidateId: cleanCandId },
        { $inc: { votesCount: 1 } }
      );
      console.log(`🗳️ [Vote Committed to Atlas] Voter ${cleanVoterId} -> Candidate ${cleanCandId}`);
    } catch (e) {
      console.error('Error committing vote to MongoDB Atlas:', e.message);
    }
  }

  return {
    success: true,
    message: `Vote successfully recorded for Candidate ${cleanCandId}.`,
    voterId: cleanVoterId,
  };
}

// ---------------- ADMIN MANAGEMENT FUNCTIONS ----------------

export async function addVoter({ voterId, name, password }) {
  let finalId = (voterId || '').trim().toUpperCase();
  if (!finalId) {
    let maxNum = 0;
    memoryVoters.forEach(v => {
      const num = parseInt(v.voterId.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    finalId = `CAN-${String(maxNum + 1).padStart(3, '0')}`;
  }

  const existing = await getVoterById(finalId);
  if (existing) {
    throw new Error(`Voter with ID ${finalId} already exists.`);
  }

  const cleanName = (name || `Voter ${finalId}`).trim();
  const cleanPassword = (password || finalId).trim().toUpperCase();

  const newVoter = {
    voterId: finalId,
    name: cleanName,
    password: cleanPassword,
    hasVoted: false,
    isBlocked: false,
    votedCandidateId: null,
    votedAt: null,
    createdAt: new Date(),
  };

  memoryVoters.push(newVoter);

  if (mongoose.connection.readyState === 1) {
    try {
      await Voter.create(newVoter);
    } catch (e) {
      console.error('MongoDB add voter error:', e.message);
    }
  }

  return newVoter;
}

export async function removeVoter(voterId) {
  const cleanId = (voterId || '').trim().toUpperCase();
  const index = memoryVoters.findIndex(v => v.voterId === cleanId);
  if (index === -1) {
    throw new Error(`Voter ${cleanId} not found.`);
  }

  const removed = memoryVoters.splice(index, 1)[0];

  if (mongoose.connection.readyState === 1) {
    try {
      await Voter.deleteOne({ voterId: cleanId });
    } catch (e) {
      console.error('MongoDB remove voter error:', e.message);
    }
  }

  return removed;
}

export async function toggleBlockVoter(voterId, isBlocked) {
  const cleanId = (voterId || '').trim().toUpperCase();
  const voter = memoryVoters.find(v => v.voterId === cleanId);
  if (!voter) {
    throw new Error(`Voter ${cleanId} not found.`);
  }

  const targetBlocked = typeof isBlocked === 'boolean' ? isBlocked : !voter.isBlocked;
  voter.isBlocked = targetBlocked;

  if (mongoose.connection.readyState === 1) {
    try {
      await Voter.updateOne({ voterId: cleanId }, { $set: { isBlocked: targetBlocked } });
    } catch (e) {
      console.error('MongoDB block voter error:', e.message);
    }
  }

  return { voterId: cleanId, isBlocked: targetBlocked };
}

export async function addCandidate({ name, party, tagline, keyInitiative, accentColor }) {
  let maxNum = 0;
  memoryCandidates.forEach(c => {
    const num = parseInt(c.candidateId.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  const candidateId = `CAND-${maxNum + 1}`;

  const newCand = {
    candidateId,
    name: (name || `Candidate ${count}`).trim(),
    party: (party || 'Independent').trim(),
    tagline: (tagline || 'Forward-looking governance').trim(),
    keyInitiative: (keyInitiative || 'Public welfare and transparency').trim(),
    accentColor: accentColor || '#06b6d4',
    votesCount: 0,
    isDesignatedLeader: false,
    createdAt: new Date(),
  };

  memoryCandidates.push(newCand);

  if (mongoose.connection.readyState === 1) {
    try {
      await Candidate.create(newCand);
    } catch (e) {
      console.error('MongoDB add candidate error:', e.message);
    }
  }

  return newCand;
}

export async function removeCandidate(candidateId) {
  const cleanId = (candidateId || '').trim().toUpperCase();
  const index = memoryCandidates.findIndex(c => c.candidateId === cleanId);
  if (index === -1) {
    throw new Error(`Candidate ${cleanId} not found.`);
  }

  const removed = memoryCandidates.splice(index, 1)[0];

  if (mongoose.connection.readyState === 1) {
    try {
      await Candidate.deleteOne({ candidateId: cleanId });
    } catch (e) {
      console.error('MongoDB remove candidate error:', e.message);
    }
  }

  return removed;
}

export async function toggleVoteLeader(candidateId, designateAsLeader = true) {
  const cleanId = (candidateId || '').trim().toUpperCase();
  const targetCand = memoryCandidates.find(c => c.candidateId === cleanId);
  if (!targetCand) {
    throw new Error(`Candidate ${cleanId} not found.`);
  }

  if (designateAsLeader) {
    memoryCandidates.forEach(c => {
      c.isDesignatedLeader = (c.candidateId === cleanId);
    });
  } else {
    targetCand.isDesignatedLeader = false;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      if (designateAsLeader) {
        await Candidate.updateMany({}, { $set: { isDesignatedLeader: false } });
        await Candidate.updateOne({ candidateId: cleanId }, { $set: { isDesignatedLeader: true } });
      } else {
        await Candidate.updateOne({ candidateId: cleanId }, { $set: { isDesignatedLeader: false } });
      }
    } catch (e) {
      console.error('MongoDB designated leader error:', e.message);
    }
  }

  return { candidateId: cleanId, isDesignatedLeader: targetCand.isDesignatedLeader };
}

export function getTimerState() {
  let remainingSeconds = 0;
  if (!timerIsRunning && timerPausedRemainingSeconds !== null) {
    remainingSeconds = Math.max(0, timerPausedRemainingSeconds);
  } else {
    const now = Date.now();
    const remainingMs = Math.max(0, timerExpiresTime - now);
    remainingSeconds = Math.floor(remainingMs / 1000);
  }

  const totalSeconds = timerDurationMinutes * 60;
  const isExpired = remainingSeconds <= 0;

  return {
    timerId: 'global_100m_timer',
    durationMinutes: timerDurationMinutes,
    totalSeconds,
    remainingSeconds,
    isRunning: timerIsRunning,
    isExpired,
    startedAt: new Date(timerStartTime).toISOString(),
    expiresAt: new Date(timerExpiresTime).toISOString(),
  };
}

export async function setTimerDuration(minutes) {
  const m = Number(minutes);
  if (!m || m < 1) {
    throw new Error('Timer duration must be at least 1 minute.');
  }

  timerDurationMinutes = m;
  timerStartTime = Date.now();
  timerExpiresTime = timerStartTime + timerDurationMinutes * 60 * 1000;
  timerPausedRemainingSeconds = null;

  if (mongoose.connection.readyState === 1) {
    try {
      await PollTimer.updateOne(
        { timerId: 'global_100m_timer' },
        {
          $set: {
            durationMinutes: timerDurationMinutes,
            startedAt: new Date(timerStartTime),
            expiresAt: new Date(timerExpiresTime),
            isRunning: timerIsRunning,
            pausedRemainingSeconds: null,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.error('MongoDB timer update error:', e.message);
    }
  }

  return getTimerState();
}

export async function stopTimer() {
  if (!timerIsRunning) return getTimerState();

  const now = Date.now();
  const remainingMs = Math.max(0, timerExpiresTime - now);
  timerPausedRemainingSeconds = Math.floor(remainingMs / 1000);
  timerIsRunning = false;

  if (mongoose.connection.readyState === 1) {
    try {
      await PollTimer.updateOne(
        { timerId: 'global_100m_timer' },
        { $set: { isRunning: false, pausedRemainingSeconds: timerPausedRemainingSeconds } }
      );
    } catch (e) {
      console.error('MongoDB stop timer error:', e.message);
    }
  }

  return getTimerState();
}

export async function startTimer() {
  if (timerIsRunning) return getTimerState();

  const remainingSec = timerPausedRemainingSeconds !== null
    ? timerPausedRemainingSeconds
    : timerDurationMinutes * 60;

  timerStartTime = Date.now();
  timerExpiresTime = timerStartTime + remainingSec * 1000;
  timerIsRunning = true;
  timerPausedRemainingSeconds = null;

  if (mongoose.connection.readyState === 1) {
    try {
      await PollTimer.updateOne(
        { timerId: 'global_100m_timer' },
        {
          $set: {
            isRunning: true,
            pausedRemainingSeconds: null,
            startedAt: new Date(timerStartTime),
            expiresAt: new Date(timerExpiresTime),
          },
        }
      );
    } catch (e) {
      console.error('MongoDB start timer error:', e.message);
    }
  }

  return getTimerState();
}

export function resetTimer() {
  timerStartTime = Date.now();
  timerExpiresTime = timerStartTime + timerDurationMinutes * 60 * 1000;
  timerIsRunning = true;
  timerPausedRemainingSeconds = null;
  return getTimerState();
}

export async function resetAllData() {
  memoryVoters = generate100Voters();
  memoryCandidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
  timerDurationMinutes = 100;
  resetTimer();

  if (mongoose.connection.readyState === 1) {
    try {
      await Voter.deleteMany({});
      await Voter.insertMany(memoryVoters);
      await Candidate.deleteMany({});
      await Candidate.insertMany(INITIAL_CANDIDATES);
      await PollTimer.deleteMany({});
      await PollTimer.create({
        timerId: 'global_100m_timer',
        durationMinutes: timerDurationMinutes,
        startedAt: new Date(timerStartTime),
        expiresAt: new Date(timerExpiresTime),
        isRunning: true,
      });
      console.log('🔄 [Reset] Reset all voters, candidates, and timer in MongoDB Atlas');
    } catch (e) {
      console.error('Error resetting MongoDB Atlas data:', e.message);
    }
  }

  return { success: true };
}

export async function getElectionAnalytics() {
  const voters = await getVotersList();
  const candidates = await getCandidatesList();
  const timer = getTimerState();

  const totalVoters = voters.length;
  const totalVotesCast = voters.filter(v => v.hasVoted).length;
  const blockedVoters = voters.filter(v => v.isBlocked).length;
  const pendingVoters = totalVoters - totalVotesCast;
  const turnoutPercentage = totalVoters > 0 ? ((totalVotesCast / totalVoters) * 100).toFixed(1) : '0.0';

  const designated = candidates.find(c => c.isDesignatedLeader);
  const sortedByVotes = [...candidates].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
  const leadingCandidate = designated || (sortedByVotes.length > 0 && sortedByVotes[0].votesCount > 0 ? sortedByVotes[0] : sortedByVotes[0] || null);

  return {
    totalVoters,
    totalVotesCast,
    blockedVoters,
    pendingVoters,
    turnoutPercentage,
    candidates: sortedByVotes,
    leadingCandidate,
    designatedLeaderId: designated ? designated.candidateId : null,
    timer,
    dbStatus: getDbStatus(),
  };
}
