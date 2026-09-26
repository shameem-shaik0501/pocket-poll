import React, { useState } from 'react';
import { Voter } from '../types';
import { authenticateVoterApi } from '../api';
import { KeyRound, AlertCircle, ArrowRight, X, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  voter: Voter | null;
  onClose: () => void;
  onAuthenticated: (voter: Voter) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  voter,
  onClose,
  onAuthenticated,
}) => {
  if (!voter) return null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your voter password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticateVoterApi(voter.voterId, password.trim());
      if (response.success && response.voter) {
        onAuthenticated(response.voter);
      } else {
        setError('Authentication failed. Check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultPassword = () => {
    setPassword(voter.voterId);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-7 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-orange-500/35">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-13 h-13 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Voter Authentication</h3>
            <p className="text-sm text-white/60 mt-0.5">Identity verification required</p>
          </div>
        </div>

        {/* Voter Details Glass Pill */}
        <div className="p-4.5 rounded-2xl glass-panel-subtle mb-6 border-white/10 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase text-white/50 font-semibold">Voter ID</span>
            <span className="text-sm font-mono font-bold text-orange-400 px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30">
              {voter.voterId}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/5">
            <span className="text-xs font-mono uppercase text-white/50 font-semibold">Full Name</span>
            <span className="text-base font-bold text-white/95">{voter.name}</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl glass-panel border-red-500/40 bg-red-950/40 text-red-200 flex items-center gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-white/80">
                Voter Password
              </label>
              <button
                type="button"
                onClick={fillDefaultPassword}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Auto-fill (Default ID)
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter "${voter.voterId}"`}
                className="w-full px-4 py-3 text-sm rounded-xl glass-input placeholder:text-white/40 pr-12 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-button-secondary text-sm cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl glass-button-orange text-sm flex items-center justify-center gap-2.5 cursor-pointer font-bold shadow-lg"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Identity</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-white/40 font-mono">
          Protected by AES cryptographic verification protocol
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
