import React from 'react';
import { TimerState, Voter } from '../types';
import { Shield, Clock, Lock, CheckCircle2, User } from 'lucide-react';

interface TopBarProps {
  currentView: 'voters' | 'voting' | 'admin';
  onNavigate: (view: 'voters' | 'voting' | 'admin') => void;
  activeVoter: Voter | null;
  timer: TimerState | null;
  isAdminUnlocked: boolean;
  onOpenAdminAuth: () => void;
  onLogoClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  activeVoter,
  timer,
  isAdminUnlocked,
  onOpenAdminAuth,
  onLogoClick,
}) => {
  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07080b]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onLogoClick}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-white hover:text-white/80 transition-colors flex items-center gap-3 cursor-pointer focus:outline-none"
        >
          <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)] animate-pulse" />
          <span className="tracking-tight">Pocket Poll</span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/80 font-bold">
            PRO
          </span>
        </button>

        {/* Navigation Links */}
        <nav className="hidden sm:flex items-center gap-3 text-sm font-semibold tracking-wide">
          <button
            onClick={() => onNavigate('voters')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'voters'
                ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Voters Registry (100)
          </button>

          {activeVoter && (
            <button
              onClick={() => onNavigate('voting')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                currentView === 'voting'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Ballot ({activeVoter.voterId})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('admin')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              currentView === 'admin'
                ? 'bg-white/15 text-white border border-white/25 shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Control</span>
          </button>
        </nav>

        {/* Right Info Badges */}
        <div className="flex items-center gap-3">
          {/* Global Poll Timer Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl glass-panel-subtle border border-orange-500/30">
            <Clock className="w-4 h-4 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-orange-300/80 leading-none">
                Time Remaining
              </span>
              <span className="text-sm font-mono font-extrabold text-white tracking-wide leading-tight">
                {formatTime(timer?.remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Admin Unlock Status or Bypass Trigger */}
          {isAdminUnlocked ? (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold cursor-pointer backdrop-blur-md hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Admin Active</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              title="Time-locked. Click to unlock with admin credentials"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 hover:text-red-200 hover:bg-red-500/25 text-sm font-semibold transition-all cursor-pointer backdrop-blur-md"
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Locked</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
