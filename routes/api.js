/**
 * Pocket Poll - API Routing Module
 * Exposes endpoints for Voters, Authentication, Candidates, Voting, Timer, and Admin Operations
 */

import express from 'express';
import {
  getVotersList,
  authenticateVoter,
  getCandidatesList,
  castVote,
  getTimerState,
  getElectionAnalytics,
  resetAllData,
  initializeDatabase,
  addVoter,
  removeVoter,
  toggleBlockVoter,
  addCandidate,
  removeCandidate,
  toggleVoteLeader,
  setTimerDuration,
  startTimer,
  stopTimer,
} from '../pollService.js';
import { connectDB, getDbStatus, getMongoURI } from '../db.js';

export const apiRouter = express.Router();

// 1. Health & Database Status
apiRouter.get('/status', (req, res) => {
  const dbStatus = getDbStatus();
  const timer = getTimerState();
  res.json({
    app: 'Pocket Poll',
    status: 'online',
    database: dbStatus,
    timer,
    timestamp: new Date().toISOString(),
  });
});

// 2. Get All Voters (CAN-001 to CAN-100+)
apiRouter.get('/voters', async (req, res) => {
  try {
    const voters = await getVotersList();
    res.json({ success: true, count: voters.length, voters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Voter Authentication (Password must match voter ID e.g. CAN-001)
apiRouter.post('/voters/auth', async (req, res) => {
  try {
    const { voterId, password } = req.body || {};
    if (!voterId || !password) {
      return res.status(400).json({ success: false, error: 'Voter ID and Password are required.' });
    }

    const authResult = await authenticateVoter(voterId, password);
    if (!authResult.success) {
      return res.status(401).json(authResult);
    }

    return res.json({
      success: true,
      message: 'Authentication successful',
      voter: authResult.voter,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Candidates
apiRouter.get('/candidates', async (req, res) => {
  try {
    const candidates = await getCandidatesList();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Cast Single Vote
apiRouter.post('/vote', async (req, res) => {
  try {
    const { voterId, candidateId } = req.body || {};
    if (!voterId || !candidateId) {
      return res.status(400).json({ success: false, error: 'Both voterId and candidateId are required.' });
    }

    const voteResult = await castVote(voterId, candidateId);
    if (!voteResult.success) {
      return res.status(400).json(voteResult);
    }

    return res.json({
      success: true,
      message: voteResult.message,
      voterId: voteResult.voterId,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Global Countdown Timer Status
apiRouter.get('/timer', (req, res) => {
  const timer = getTimerState();
  res.json({ success: true, timer });
});

// 7. Admin Authentication (nazeer / nazeer)
apiRouter.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (cleanUser === 'nazeer' && cleanPass === 'nazeer') {
    return res.json({
      success: true,
      role: 'admin',
      token: 'admin_session_nazeer',
      message: 'Admin authorization granted.',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid administrator credentials. Username and password are strictly lowercase.',
  });
});

// Helper to check admin authorization
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.includes('admin_session_nazeer');
}

// 8. Admin Analytics & Tallies (Time-locked or Admin Bypass)
apiRouter.get('/admin/analytics', async (req, res) => {
  try {
    const timer = getTimerState();
    const isBypassed = checkAdminAuth(req);

    if (!timer.isExpired && !isBypassed) {
      return res.status(403).json({
        success: false,
        timeLocked: true,
        error: 'Admin dashboard is currently time-locked. It unlocks automatically when the countdown concludes, or via manual admin authentication.',
        remainingSeconds: timer.remainingSeconds,
      });
    }

    const analytics = await getElectionAnalytics();
    res.json({ success: true, ...analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin: Add Voter
apiRouter.post('/admin/voter/add', async (req, res) => {
  try {
    const { voterId, name, password } = req.body || {};
    const newVoter = await addVoter({ voterId, name, password });
    res.json({ success: true, message: `Voter ${newVoter.voterId} added successfully.`, voter: newVoter });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 10. Admin: Remove Voter
apiRouter.delete('/admin/voter/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;
    const removed = await removeVoter(voterId);
    res.json({ success: true, message: `Voter ${voterId} removed.`, removed });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. Admin: Block / Unblock Voter
apiRouter.post('/admin/voter/toggle-block', async (req, res) => {
  try {
    const { voterId, isBlocked } = req.body || {};
    if (!voterId) {
      return res.status(400).json({ success: false, error: 'voterId is required.' });
    }
    const result = await toggleBlockVoter(voterId, isBlocked);
    res.json({
      success: true,
      message: `Voter ${voterId} is now ${result.isBlocked ? 'BLOCKED' : 'UNBLOCKED'}.`,
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 12. Admin: Add Candidate
apiRouter.post('/admin/candidate/add', async (req, res) => {
  try {
    const { name, party, tagline, keyInitiative, accentColor } = req.body || {};
    const newCand = await addCandidate({ name, party, tagline, keyInitiative, accentColor });
    res.json({ success: true, message: `Candidate ${newCand.name} added.`, candidate: newCand });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 13. Admin: Remove Candidate
apiRouter.delete('/admin/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const removed = await removeCandidate(candidateId);
    res.json({ success: true, message: `Candidate ${candidateId} removed.`, removed });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 14. Admin: Add or Remove Vote Leader
apiRouter.post('/admin/candidate/leader', async (req, res) => {
  try {
    const { candidateId, isLeader } = req.body || {};
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required.' });
    }
    const result = await toggleVoteLeader(candidateId, isLeader !== false);
    res.json({
      success: true,
      message: result.isDesignatedLeader
        ? `Candidate ${candidateId} designated as official Vote Leader.`
        : `Vote Leader status removed from Candidate ${candidateId}.`,
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 15. Admin: Start Timer
apiRouter.post('/admin/timer/start', async (req, res) => {
  try {
    const timer = await startTimer();
    res.json({ success: true, message: 'Countdown timer started.', timer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Admin: Stop Timer
apiRouter.post('/admin/timer/stop', async (req, res) => {
  try {
    const timer = await stopTimer();
    res.json({ success: true, message: 'Countdown timer stopped/paused.', timer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 17. Admin: Set Timer Duration
apiRouter.post('/admin/timer/duration', async (req, res) => {
  try {
    const { minutes } = req.body || {};
    const timer = await setTimerDuration(minutes);
    res.json({ success: true, message: `Timer set to ${minutes} minutes.`, timer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 18. Update / Test MongoDB Atlas credentials dynamically
apiRouter.post('/admin/connect-db', async (req, res) => {
  try {
    const { password, customUri } = req.body || {};
    let targetUri = customUri;
    if (!targetUri && password) {
      targetUri = getMongoURI(password);
    }

    const result = await connectDB(targetUri);
    if (result.connected) {
      await initializeDatabase();
    }
    res.json({ success: result.connected, result, dbStatus: getDbStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. Reset Election Data (Admin utility)
apiRouter.post('/admin/reset', async (req, res) => {
  try {
    await resetAllData();
    res.json({ success: true, message: 'All votes, voters, and timer have been reset to initial state.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default apiRouter;
