import React, { useState } from 'react';
import { adminLoginApi } from '../api';
import { Shield, Lock, AlertCircle, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await adminLoginApi(username, password);
      if (res.success && res.token) {
        onSuccess(res.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsername('nazeer');
    setPassword('nazeer');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-7 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95)] border border-orange-500/35">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-13 h-13 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Admin Manual Bypass</h3>
            <p className="text-sm text-white/60 mt-0.5">Time-lock administrative override</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel-subtle mb-5 text-sm text-white/80 flex items-center justify-between border-white/10">
          <span>Standard Admin Credentials:</span>
          <button
            type="button"
            onClick={fillDefaultAdmin}
            className="font-mono text-xs px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition-colors cursor-pointer font-bold"
          >
            Fill "nazeer" / "nazeer"
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl glass-panel border-red-500/40 bg-red-950/40 text-red-200 flex items-center gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4.5">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. nazeer"
              className="w-full px-4 py-3 text-sm rounded-xl glass-input placeholder:text-white/40 font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/80 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-sm rounded-xl glass-input placeholder:text-white/40 font-mono"
            />
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
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;
