import React, { useState, useMemo } from 'react';
import { Voter } from '../types';
import { Search, UserCheck, CheckCircle2, AlertCircle, RefreshCw, Ban, ShieldAlert, KeyRound } from 'lucide-react';

interface VotersPageProps {
  voters: Voter[];
  isLoading: boolean;
  onSelectVoter: (voter: Voter) => void;
  onRefresh: () => void;
  notification?: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export const VotersPage: React.FC<VotersPageProps> = ({
  voters,
  isLoading,
  onSelectVoter,
  onRefresh,
  notification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'voted' | 'blocked'>('all');

  const filteredVoters = useMemo(() => {
    return voters.filter((voter) => {
      const matchesSearch =
        voter.voterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'pending') return !voter.hasVoted && !voter.isBlocked;
      if (filter === 'voted') return voter.hasVoted;
      if (filter === 'blocked') return voter.isBlocked;
      return true;
    });
  }, [voters, searchQuery, filter]);

  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const blockedCount = voters.filter((v) => v.isBlocked).length;
  const pendingCount = voters.filter((v) => !v.hasVoted && !v.isBlocked).length;
  const turnoutPercent = totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(0) : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Notification banner */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl glass-panel flex items-center justify-between text-base font-medium ${
            notification.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              : notification.type === 'error'
              ? 'border-red-500/40 bg-red-950/40 text-red-200'
              : 'border-orange-500/40 bg-orange-950/40 text-orange-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header & Quick Stats in Professional Glass Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="p-6 rounded-2xl glass-panel border-white/15">
          <p className="text-xs font-mono uppercase tracking-wider text-white/60 font-semibold">Total Registered</p>
          <p className="text-4xl font-extrabold text-white mt-2">{totalVoters}</p>
          <p className="text-sm text-white/50 mt-1">Certified Citizen Roster</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-emerald-500/30">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">Ballots Cast</p>
          <p className="text-4xl font-extrabold text-emerald-400 mt-2">{votedCount}</p>
          <p className="text-sm text-emerald-400/80 mt-1 font-medium">{turnoutPercent}% Verified Turnout</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-orange-500/30">
          <p className="text-xs font-mono uppercase tracking-wider text-orange-400 font-semibold">Pending Vote</p>
          <p className="text-4xl font-extrabold text-orange-400 mt-2">{pendingCount}</p>
          <p className="text-sm text-orange-400/80 mt-1 font-medium">Eligible to authenticate</p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border-red-500/30">
          <p className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">Blocked Access</p>
          <p className="text-4xl font-extrabold text-red-400 mt-2">{blockedCount}</p>
          <p className="text-sm text-red-400/80 mt-1 font-medium">Security hold</p>
        </div>
      </div>

      {/* Search & Filter Glass Bar */}
      <div className="p-5 rounded-2xl glass-panel mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID (e.g. CAN-001) or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 text-sm rounded-xl glass-input placeholder:text-white/40 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {(
            [
              { id: 'all', label: 'All Voters' },
              { id: 'pending', label: 'Pending' },
              { id: 'voted', label: 'Voted' },
              { id: 'blocked', label: 'Blocked' },
            ] as const
          ).map((item) => {
            const isSelected = filter === item.id;
            let activeClass = 'glass-button-primary';
            if (item.id === 'pending') activeClass = 'bg-orange-500 text-white font-bold border-orange-400';
            if (item.id === 'voted') activeClass = 'bg-emerald-500 text-white font-bold border-emerald-400';
            if (item.id === 'blocked') activeClass = 'bg-red-500 text-white font-bold border-red-400';

            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-4 py-2 rounded-xl text-sm capitalize tracking-wide transition-all cursor-pointer font-semibold ${
                  isSelected
                    ? activeClass
                    : 'glass-button-secondary text-white/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            onClick={onRefresh}
            title="Refresh database records"
            className="p-2.5 rounded-xl glass-button-secondary ml-auto md:ml-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Voter Cards Grid */}
      {isLoading ? (
        <div className="py-28 text-center glass-panel rounded-3xl">
          <RefreshCw className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-white/60 uppercase tracking-widest font-semibold">
            Synchronizing Roster from Database...
          </p>
        </div>
      ) : filteredVoters.length === 0 ? (
        <div className="py-28 text-center glass-panel rounded-3xl">
          <UserCheck className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-lg font-bold text-white">No voters matched your filter</p>
          <p className="text-sm text-white/50 mt-1">Try resetting the search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVoters.map((voter) => {
            const isBlocked = voter.isBlocked;
            const hasVoted = voter.hasVoted;

            return (
              <div
                key={voter.voterId}
                className={`group relative p-5 sm:p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between ${
                  isBlocked
                    ? 'border-red-500/35'
                    : hasVoted
                    ? 'border-emerald-500/35'
                    : 'border-white/15 hover:border-orange-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-lg bg-white/10 text-white border border-white/20">
                      {voter.voterId}
                    </span>

                    {/* Status Badge */}
                    {isBlocked ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono tracking-wider px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
                        <Ban className="w-3.5 h-3.5 text-red-400" />
                        <span>BLOCKED</span>
                      </span>
                    ) : hasVoted ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>VOTED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono tracking-wider px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/35 text-orange-300 font-bold">
                        ELIGIBLE
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">
                    {voter.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/50 mt-1">
                    Registered Citizen
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  {hasVoted ? (
                    <span className="text-sm text-emerald-400/90 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Ballot verified
                    </span>
                  ) : isBlocked ? (
                    <span className="text-sm text-red-400/90 flex items-center gap-2 font-medium">
                      <ShieldAlert className="w-4 h-4" />
                      Contact admin
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectVoter(voter)}
                      className="w-full py-2.5 px-3.5 rounded-xl glass-button-orange text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer font-bold"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Authenticate & Vote</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VotersPage;
