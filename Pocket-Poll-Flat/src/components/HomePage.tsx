import React, { useEffect } from 'react';
import DigitalCanvas from './DigitalCanvas';

interface HomePageProps {
  onEnter: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div
      onClick={onEnter}
      role="button"
      tabIndex={0}
      aria-label="Enter Pocket Poll"
      className="relative w-screen h-screen flex items-center justify-center cursor-pointer select-none overflow-hidden focus:outline-none bg-[#07080b]"
    >
      {/* Dynamic Cursor-following Hexagonal Background */}
      <DigitalCanvas interactive={true} />

      {/* Centered Professional Glassmorphic Hero Card */}
      <div className="relative z-10 text-center px-8 py-12 sm:px-16 sm:py-16 rounded-3xl glass-panel border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-w-2xl mx-4 transition-all duration-300 hover:border-orange-500/40 hover:scale-[1.01]">
        {/* Status pill with Orange & Green accents */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 mb-6 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse" />
          <span className="text-xs sm:text-sm font-mono tracking-widest text-white/90 uppercase font-semibold">
            Electronic Consensus Protocol
          </span>
          <span className="w-2 h-2 rounded-full bg-orange-400" />
        </div>

        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.25)]">
          Pocket Poll
        </h1>

        <p className="mt-5 text-base sm:text-lg font-normal text-white/80 max-w-lg mx-auto leading-relaxed">
          Decentralized ballot verification & consensus governance engine with real-time auditability.
        </p>

        {/* Feature Highlights Pills: Orange, Green, Red, White */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-mono font-medium">
          <span className="px-3.5 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/35 text-orange-300">
            Real-Time Tallies
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
            Verified Roster
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300">
            Fraud Guard
          </span>
        </div>

        <div className="mt-9 flex items-center justify-center gap-3">
          <span className="px-8 py-3.5 rounded-2xl glass-button-orange text-sm uppercase tracking-wider font-bold cursor-pointer shadow-lg hover:scale-105 transition-all">
            Enter Registry
          </span>
        </div>

        <p className="mt-7 text-xs sm:text-sm font-mono tracking-widest text-white/50 uppercase">
          Click or Press Space to enter
        </p>
      </div>
    </div>
  );
};

export default HomePage;
