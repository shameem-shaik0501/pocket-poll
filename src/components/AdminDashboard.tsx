import React, { useState, useEffect } from 'react';
import { ElectionAnalytics, TimerState, Voter, Candidate } from '../types';
import {
  fetchAdminAnalytics,
  adminLoginApi,
  connectDatabaseApi,
  resetElectionApi,
  adminAddVoterApi,
  adminRemoveVoterApi,
  adminToggleBlockVoterApi,
  adminAddCandidateApi,
  adminRemoveCandidateApi,
  adminToggleVoteLeaderApi,
  adminStartTimerApi,
  adminStopTimerApi,
  adminSetTimerDurationApi,
  fetchVoters,
} from '../api';
import {
  Shield,
  Clock,
  Lock,
  Unlock,
  Database,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  UserPlus,
  Trash2,
  Ban,
  ShieldCheck,
  Play,
  Pause,
  Sliders,
  PlusCircle,
  Crown,
  Search,
  Check,
} from 'lucide-react';

interface AdminDashboardProps {
  timer: TimerState | null;
  adminToken: string | null;
  onAdminLoginSuccess: (token: string) => void;
  onVotersUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  timer,
  adminToken,
  onAdminLoginSuccess,
  onVotersUpdated,
}) => {
  const [analytics, setAnalytics] = useState<ElectionAnalytics | null>(null);
  const [votersList, setVotersList] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: 'analytics' | 'voters' | 'candidates' | 'timer' | 'database'
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'voters' | 'candidates' | 'timer' | 'database'
  >('analytics');

  // Manual Bypass State
  const [username, setUsername] = useState('nazeer');
  const [password, setPassword] = useState('nazeer');
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [bypassLoading, setBypassLoading] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Database Connection input state
  const [dbPasswordInput, setDbPasswordInput] = useState('');
  const [isConnectingDb, setIsConnectingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add Voter Modal/Form state
  const [showAddVoter, setShowAddVoter] = useState(false);
  const [newVoterId, setNewVoterId] = useState('');
  const [newVoterName, setNewVoterName] = useState('');
  const [newVoterPassword, setNewVoterPassword] = useState('');
  const [isAddingVoter, setIsAddingVoter] = useState(false);
  const [voterSearch, setVoterSearch] = useState('');

  // Add Candidate Modal/Form state
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandName, setNewCandName] = useState('');
  const [newCandParty, setNewCandParty] = useState('');
  const [newCandTagline, setNewCandTagline] = useState('');
  const [newCandInitiative, setNewCandInitiative] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  // Timer custom duration state
  const [customTimerMinutes, setCustomTimerMinutes] = useState('100');
  const [isTimerActionLoading, setIsTimerActionLoading] = useState(false);

  // Reset Election state
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const isUnlocked = Boolean(timer?.isExpired) || Boolean(adminToken);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Always load voters list
      const allVoters = await fetchVoters();
      setVotersList(allVoters);

      // Only fetch analytics if unlocked or admin authorized
      if (isUnlocked) {
        const analyticsData = await fetchAdminAnalytics(adminToken || undefined);
        setAnalytics(analyticsData);
      }
    } catch (err: any) {
      if (!err?.timeLocked) {
        console.warn('Admin analytics sync notice:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [adminToken, isUnlocked]);

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBypassLoading(true);
    setBypassError(null);
    try {
      const res = await adminLoginApi(username, password);
      if (res.success && res.token) {
        onAdminLoginSuccess(res.token);
        showToast('Admin manual bypass granted');
      } else {
        setBypassError('Invalid credentials');
      }
    } catch (err: any) {
      setBypassError(err.message || 'Authorization failed');
    } finally {
      setBypassLoading(false);
    }
  };

  const handleStartTimer = async () => {
    setIsTimerActionLoading(true);
    try {
      const res = await adminStartTimerApi();
      showToast(res.message);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to start timer', 'error');
    } finally {
      setIsTimerActionLoading(false);
    }
  };

  const handleStopTimer = async () => {
    setIsTimerActionLoading(true);
    try {
      const res = await adminStopTimerApi();
      showToast(res.message);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to stop timer', 'error');
    } finally {
      setIsTimerActionLoading(false);
    }
  };

  const handleSetTimerDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = Number(customTimerMinutes);
    if (!minutes || minutes < 1) {
      showToast('Duration must be at least 1 minute.', 'error');
      return;
    }
    setIsTimerActionLoading(true);
    try {
      const res = await adminSetTimerDurationApi(minutes);
      showToast(res.message);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to set duration', 'error');
    } finally {
      setIsTimerActionLoading(false);
    }
  };

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterName.trim()) {
      showToast('Please specify a citizen name.', 'error');
      return;
    }
    setIsAddingVoter(true);
    try {
      const res = await adminAddVoterApi(newVoterId.trim() || undefined, newVoterName.trim(), newVoterPassword.trim() || undefined);
      showToast(`Voter ${res.voter.voterId} (${res.voter.name}) added to registry.`);
      setNewVoterId('');
      setNewVoterName('');
      setNewVoterPassword('');
      setShowAddVoter(false);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to add voter', 'error');
    } finally {
      setIsAddingVoter(false);
    }
  };

  const handleRemoveVoter = async (voterId: string) => {
    if (!window.confirm(`Are you sure you want to remove voter ${voterId} from the electoral database?`)) {
      return;
    }
    try {
      await adminRemoveVoterApi(voterId);
      showToast(`Voter ${voterId} successfully removed.`);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove voter', 'error');
    }
  };

  const handleToggleBlockVoter = async (voterId: string, currentBlocked: boolean) => {
    try {
      const res = await adminToggleBlockVoterApi(voterId, !currentBlocked);
      showToast(res.message);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle block voter', 'error');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim()) {
      showToast('Please specify candidate name.', 'error');
      return;
    }
    setIsAddingCandidate(true);
    try {
      const res = await adminAddCandidateApi({
        name: newCandName.trim(),
        party: newCandParty.trim() || 'Independent Alliance',
        tagline: newCandTagline.trim() || 'Citizen First Initiative',
        keyInitiative: newCandInitiative.trim() || 'Open source civic tech',
      });
      showToast(`Candidate ${res.candidate.name} added to ballot.`);
      setNewCandName('');
      setNewCandParty('');
      setNewCandTagline('');
      setNewCandInitiative('');
      setShowAddCandidate(false);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to add candidate', 'error');
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleRemoveCandidate = async (candidateId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove candidate ${name} (${candidateId})?`)) {
      return;
    }
    try {
      await adminRemoveCandidateApi(candidateId);
      showToast(`Candidate ${name} removed from ballot.`);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove candidate', 'error');
    }
  };

  const handleToggleVoteLeader = async (candidateId: string, currentIsLeader: boolean) => {
    try {
      const res = await adminToggleVoteLeaderApi(candidateId, !currentIsLeader);
      showToast(res.message);
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update vote leader', 'error');
    }
  };

  const handleConnectDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPasswordInput.trim()) return;
    setIsConnectingDb(true);
    setDbStatusMsg(null);
    try {
      const res = await connectDatabaseApi(dbPasswordInput.trim());
      setDbStatusMsg({
        text: res.dbStatus?.isConnected
          ? 'MongoDB Atlas Cluster Connected Successfully.'
          : 'Standby mode (fallback memory active).',
        type: res.dbStatus?.isConnected ? 'success' : 'error',
      });
      showToast('Database configuration updated');
      loadData();
    } catch (err: any) {
      setDbStatusMsg({ text: err.message || 'Connection failed', type: 'error' });
      showToast(err.message || 'Atlas connection error', 'error');
    } finally {
      setIsConnectingDb(false);
    }
  };

  const handleResetElection = async () => {
    if (
      !window.confirm(
        'WARNING: This will reset all ballots, reset vote tallies to zero, and restore the default 100m countdown timer. Proceed?'
      )
    ) {
      return;
    }
    setIsResetting(true);
    try {
      await resetElectionApi();
      showToast('Election reset successfully');
      loadData();
      onVotersUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset election', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // View: Locked Screen
  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-red-500/30 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Dashboard is Time-Locked
          </h2>

          <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            Official vote tallies and system controls unlock automatically when the global countdown window expires, or immediately via administrator manual authorization.
          </p>

          <div className="my-8 p-7 rounded-3xl glass-panel-subtle inline-block border border-orange-500/35">
            <div className="flex items-center justify-center gap-3 text-5xl sm:text-6xl font-mono font-bold text-orange-400 tabular-nums">
              <Clock className="w-10 h-10 text-orange-400 animate-pulse" />
              <span>{timer ? formatTime(timer.remainingSeconds) : '01:40:00'}</span>
            </div>
            <span className="block mt-3 text-sm font-mono text-orange-300/80 uppercase tracking-widest font-semibold">
              Countdown to Automatic Unlock
            </span>
          </div>

          <div className="pt-8 border-t border-white/10 text-left max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <span>Manual Admin Bypass</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUsername('nazeer');
                  setPassword('nazeer');
                }}
                className="text-xs font-mono text-orange-400 hover:text-orange-300 underline cursor-pointer font-bold"
              >
                Auto-fill: nazeer / nazeer
              </button>
            </div>

            <form onSubmit={handleBypassSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">
                  Administrator Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nazeer"
                  className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-1.5">
                  Administrator Password (strictly lowercase)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="nazeer"
                  className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white font-mono"
                />
              </div>

              {bypassError && (
                <div className="p-3.5 glass-panel border-red-500/40 bg-red-950/40 rounded-xl text-red-200 text-sm flex items-center gap-2.5 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{bypassError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={bypassLoading}
                className="w-full py-3.5 px-5 glass-button-orange text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-lg"
              >
                {bypassLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>Authorize Manual Bypass</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredVoters = votersList.filter(
    (v) =>
      v.voterId.toLowerCase().includes(voterSearch.toLowerCase()) ||
      v.name.toLowerCase().includes(voterSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl glass-panel flex items-center gap-3 text-sm shadow-2xl animate-in fade-in ${
            toastMsg.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-200'
              : 'border-red-500/50 bg-red-950/60 text-red-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-1">
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">Administrator Control Station</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-white/60">
              {adminToken ? 'Authorized Admin (nazeer)' : 'Timer Expiration Mode'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Modify citizens, manage certified candidates & leader status, control master clock, and monitor database telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Sync all election data"
            className="px-3.5 py-2 glass-button-secondary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleResetElection}
            disabled={isResetting}
            title="Reset votes and timer"
            className="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all font-semibold"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Poll</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {(
          [
            { id: 'analytics', label: 'Tallies & Analytics', icon: Award },
            { id: 'voters', label: `Voter Directory (${votersList.length})`, icon: Users },
            { id: 'candidates', label: 'Candidates & Vote Leader', icon: Crown },
            { id: 'timer', label: 'Timer Control', icon: Clock },
            { id: 'database', label: 'MongoDB Atlas', icon: Database },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'glass-button-orange'
                  : 'glass-button-secondary text-white/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl glass-panel border-white/15">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-white/60 mb-2 font-semibold">
            <span>Registered Citizens</span>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-4xl font-extrabold text-white font-mono tabular-nums">
            {votersList.length}
          </div>
          <div className="mt-2 text-sm text-white/50 font-mono">
            Active voting rights
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2 font-semibold">
            <span>Committed Ballots</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {analytics?.totalVotesCast ?? 0}
          </div>
          <div className="mt-2 text-sm text-emerald-400/80 font-mono">
            Turnout: {analytics?.turnoutPercentage ?? '0.0'}%
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-red-500/30">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-red-400 mb-2 font-semibold">
            <span>Blocked Citizens</span>
            <Ban className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-extrabold text-red-400 font-mono tabular-nums">
            {votersList.filter((v) => v.isBlocked).length}
          </div>
          <div className="mt-2 text-sm text-red-400/80 font-mono">
            Access denied by admin
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-orange-500/30">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-orange-400 mb-2 font-semibold">
            <span>Countdown Clock</span>
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-4xl font-extrabold text-orange-400 font-mono tabular-nums flex items-center gap-2">
            <span>{timer ? formatTime(timer.remainingSeconds) : '00:00:00'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full uppercase font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
              {timer?.isRunning ? 'Running' : 'Paused'}
            </span>
          </div>
          <div className="mt-2 text-sm text-orange-300/70 font-mono">
            Duration: {timer?.durationMinutes ?? 100}m
          </div>
        </div>
      </div>

      {/* TAB 1: Analytics & Tallies */}
      {activeTab === 'analytics' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Candidates Vote Tallies</h3>
                <p className="text-sm text-white/60 mt-0.5">
                  Real-time vote counts, percentage shares, and ranking order.
                </p>
              </div>
              <span className="text-sm font-mono text-emerald-400 font-bold px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                Total: {analytics?.totalVotesCast ?? 0} Votes Cast
              </span>
            </div>

            <div className="space-y-6">
              {analytics?.candidates.map((cand, index) => {
                const total = analytics.totalVotesCast || 0;
                const percent = total > 0 ? ((cand.votesCount / total) * 100).toFixed(1) : '0.0';
                const isLeader = cand.isDesignatedLeader || (index === 0 && cand.votesCount > 0);

                return (
                  <div key={cand.candidateId} className="space-y-2.5">
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white/10 text-white border border-white/15">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-white text-base sm:text-lg">{cand.name}</span>
                        <span className="text-xs sm:text-sm text-white/50 hidden sm:inline font-medium">
                          ({cand.party})
                        </span>
                        {cand.isDesignatedLeader ? (
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center gap-1 font-bold">
                            <Crown className="w-3.5 h-3.5 text-orange-400" />
                            <span>Designated Leader</span>
                          </span>
                        ) : isLeader ? (
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tally Leader</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="text-right font-mono text-sm">
                        <span className="text-white font-extrabold text-base sm:text-lg mr-2">{cand.votesCount}</span>
                        <span className="text-white/60">({percent}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(Number(percent), cand.votesCount > 0 ? 3 : 0)}%`,
                          backgroundColor:
                            cand.isDesignatedLeader
                              ? '#f97316'
                              : index === 0
                              ? '#10b981'
                              : cand.accentColor || '#ffffff',
                        }}
                      />
                    </div>

                    <div className="text-xs sm:text-sm text-white/50 font-mono truncate">
                      Platform: {cand.keyInitiative}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Spotlight Column */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass-panel border-orange-500/30">
              <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase tracking-wider mb-2 font-bold">
                <Crown className="w-4 h-4 text-orange-400" />
                <span>Vote Leader Status</span>
              </div>

              {analytics?.leadingCandidate ? (
                <div>
                  <h4 className="text-xl font-extrabold text-white">
                    {analytics.leadingCandidate.name}
                  </h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    {analytics.leadingCandidate.party}
                  </p>
                  <div className="mt-4 p-3.5 glass-panel-subtle rounded-xl text-xs font-mono space-y-1.5 border-white/10">
                    <div className="flex justify-between">
                      <span className="text-white/50">Leader Status:</span>
                      <span className="text-orange-400 font-bold">
                        {analytics.leadingCandidate.isDesignatedLeader ? 'Admin Designated' : 'Vote Leader (Plurality)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Votes Secured:</span>
                      <span className="text-emerald-400 font-bold">
                        {analytics.leadingCandidate.votesCount}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-white/40 text-xs">
                  No front-runner established yet.
                </div>
              )}
            </div>

            {/* Quick Timer Widget */}
            <div className="p-6 rounded-2xl glass-panel border-white/15">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-orange-400 flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Master Clock</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  {timer?.isRunning ? 'Running' : 'Paused'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {timer?.isRunning ? (
                  <button
                    onClick={handleStopTimer}
                    disabled={isTimerActionLoading}
                    className="flex-1 py-2 glass-button-secondary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-orange-300 hover:text-white"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    disabled={isTimerActionLoading}
                    className="flex-1 py-2 glass-button-green rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Timer</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('timer')}
                  className="px-3 py-2 glass-button-secondary rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Voter Management */}
      {activeTab === 'voters' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 glass-panel rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Manage Registered Voters</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Add new citizens, remove records, or toggle access locks (block/unblock) in real time.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search voter ID or name..."
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs text-white placeholder-white/30"
                />
              </div>

              <button
                onClick={() => setShowAddVoter(!showAddVoter)}
                className="px-4 py-2 glass-button-orange rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Voter</span>
              </button>
            </div>
          </div>

          {/* Add Voter Form Modal/Card */}
          {showAddVoter && (
            <div className="p-6 glass-panel rounded-2xl shadow-xl animate-in fade-in border border-orange-500/40">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-400" />
                <span>Register New Electoral Citizen</span>
              </h4>
              <form onSubmit={handleAddVoter} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Voter ID (e.g. CAN-101 or blank for auto)
                  </label>
                  <input
                    type="text"
                    value={newVoterId}
                    onChange={(e) => setNewVoterId(e.target.value)}
                    placeholder={`CAN-${String(votersList.length + 1).padStart(3, '0')}`}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Citizen Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVoterName}
                    onChange={(e) => setNewVoterName(e.target.value)}
                    placeholder="e.g. Samantha Vance"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Default Password (optional, defaults to ID)
                  </label>
                  <input
                    type="text"
                    value={newVoterPassword}
                    onChange={(e) => setNewVoterPassword(e.target.value)}
                    placeholder="Defaults to exact Voter ID"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVoter(false)}
                    className="px-4 py-2 glass-button-secondary text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingVoter}
                    className="px-5 py-2 glass-button-orange text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isAddingVoter ? 'Adding...' : 'Save New Voter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Voter Records List Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-white/50 font-mono uppercase border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Citizen Name</th>
                    <th className="px-4 py-3.5">Ballot Status</th>
                    <th className="px-4 py-3.5">Access Control</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredVoters.map((voter) => (
                    <tr
                      key={voter.voterId}
                      className={`hover:bg-white/5 transition-colors ${
                        voter.isBlocked ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-orange-400">
                        {voter.voterId}
                      </td>
                      <td className="px-4 py-3 font-sans font-medium text-white/90">
                        {voter.name}
                      </td>
                      <td className="px-4 py-3">
                        {voter.hasVoted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] inline-flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Voted</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-300 text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {voter.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] inline-flex items-center gap-1 font-bold">
                            <Ban className="w-3 h-3 text-red-400" />
                            <span>Blocked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] inline-flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBlockVoter(voter.voterId, voter.isBlocked)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              voter.isBlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>{voter.isBlocked ? 'Unblock' : 'Block'}</span>
                          </button>

                          <button
                            onClick={() => handleRemoveVoter(voter.voterId)}
                            title="Remove voter from registry"
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Candidate Management */}
      {activeTab === 'candidates' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 glass-panel rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Candidates & Vote Leader Designation</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Add candidates, remove candidates, or assign/remove official Vote Leader status.
              </p>
            </div>

            <button
              onClick={() => setShowAddCandidate(!showAddCandidate)}
              className="px-4 py-2 glass-button-orange rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>

          {/* Add Candidate Form */}
          {showAddCandidate && (
            <div className="p-6 glass-panel rounded-2xl shadow-xl animate-in fade-in border border-orange-500/40">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-orange-400" />
                <span>Register New Electoral Candidate</span>
              </h4>
              <form onSubmit={handleAddCandidate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCandName}
                    onChange={(e) => setNewCandName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Party Affiliation
                  </label>
                  <input
                    type="text"
                    value={newCandParty}
                    onChange={(e) => setNewCandParty(e.target.value)}
                    placeholder="e.g. Progressive Digital Coalition"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Campaign Tagline
                  </label>
                  <input
                    type="text"
                    value={newCandTagline}
                    onChange={(e) => setNewCandTagline(e.target.value)}
                    placeholder="e.g. Equitable Tech Infrastructure"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">
                    Key Policy Initiative
                  </label>
                  <input
                    type="text"
                    value={newCandInitiative}
                    onChange={(e) => setNewCandInitiative(e.target.value)}
                    placeholder="e.g. 100% open algorithms and citizen voting grants"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCandidate(false)}
                    className="px-4 py-2 glass-button-secondary text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingCandidate}
                    className="px-5 py-2 glass-button-orange text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isAddingCandidate ? 'Saving...' : 'Add Candidate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics?.candidates.map((cand) => {
              const isLeader = cand.isDesignatedLeader;

              return (
                <div
                  key={cand.candidateId}
                  className={`p-5 rounded-2xl glass-panel transition-all ${
                    isLeader ? 'border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.18)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-400">
                          {cand.candidateId}
                        </span>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-xs text-white/70 font-medium">
                          {cand.party}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {cand.name}
                      </h4>
                    </div>

                    {isLeader ? (
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono font-bold flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-orange-400" />
                        <span>Vote Leader</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {cand.votesCount} votes
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/50 mb-3">{cand.tagline}</p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleVoteLeader(cand.candidateId, Boolean(isLeader))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isLeader
                          ? 'glass-button-orange'
                          : 'glass-button-secondary text-orange-300'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{isLeader ? 'Remove Vote Leader' : 'Make Vote Leader'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveCandidate(cand.candidateId, cand.name)}
                      className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer"
                      title="Remove candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Timer Control */}
      {activeTab === 'timer' && (
        <div className="mt-8 max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase tracking-wider mb-2 font-bold">
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>Global Election Timer Management</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Countdown Clock Operations
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Authoritative controls to pause, resume, and redefine the global time duration.
            </p>

            <div className="my-6 p-6 rounded-2xl glass-panel-subtle border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-white/40 uppercase">
                  Current Time Remaining
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-bold text-orange-400 tabular-nums mt-1">
                  {timer ? formatTime(timer.remainingSeconds) : '00:00:00'}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      timer?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-xs font-mono text-white/70">
                    Status: {timer?.isRunning ? 'Running automatically' : 'Stopped / Paused by Admin'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {timer?.isRunning ? (
                  <button
                    onClick={handleStopTimer}
                    disabled={isTimerActionLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-500/30"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Stop Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    disabled={isTimerActionLoading}
                    className="w-full sm:w-auto px-5 py-2.5 glass-button-green font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Timer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Set Custom Duration Form */}
            <form onSubmit={handleSetTimerDuration} className="pt-4 border-t border-white/10 space-y-3">
              <label className="block text-xs font-medium text-white/70">
                Set Custom Countdown Duration (in Minutes)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customTimerMinutes}
                  onChange={(e) => setCustomTimerMinutes(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-40 px-3.5 py-2 glass-input rounded-xl text-sm text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={isTimerActionLoading}
                  className="px-5 py-2 glass-button-orange font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Apply New Duration
                </button>
              </div>
              <p className="text-[11px] text-white/40 font-mono">
                Applying a new duration immediately updates the database timer and starts countdown.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: Database Telemetry */}
      {activeTab === 'database' && (
        <div className="mt-8 max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <Database className="w-4 h-4" />
                <span>MongoDB Atlas (Cluster0) Live Telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {analytics?.dbStatus?.isConnected ? 'Atlas Connected' : 'Memory Standby Mode'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-white/60 glass-panel-subtle p-4 rounded-xl border border-white/10 mb-5">
              <div className="flex justify-between">
                <span className="text-white/40">Database User:</span>
                <span className="text-orange-400 font-bold">{analytics?.dbStatus?.clusterUser || 'shameem278700_db_user'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Cluster Host:</span>
                <span className="text-white/90">
                  {analytics?.dbStatus?.clusterHost || 'cluster0.hbgacps.mongodb.net'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Database Name:</span>
                <span className="text-white/90">pocket_poll</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Connection State:</span>
                <span className="text-emerald-400 font-bold">{analytics?.dbStatus?.readyStateText}</span>
              </div>
            </div>

            <form onSubmit={handleConnectDb} className="space-y-3">
              <label className="block text-xs font-mono text-white/70">
                Connect / Update Live Atlas Password
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={dbPasswordInput}
                  onChange={(e) => setDbPasswordInput(e.target.value)}
                  placeholder="Enter cluster password for shameem278700_db_user..."
                  className="flex-1 px-3.5 py-2 glass-input rounded-xl text-xs text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={isConnectingDb || !dbPasswordInput.trim()}
                  className="px-4 py-2 glass-button-green text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {isConnectingDb ? 'Connecting...' : 'Connect Atlas'}
                </button>
              </div>

              {dbStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs glass-panel ${
                    dbStatusMsg.type === 'success'
                      ? 'border-emerald-500/40 text-emerald-200'
                      : 'border-red-500/40 text-red-200'
                  }`}
                >
                  {dbStatusMsg.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
