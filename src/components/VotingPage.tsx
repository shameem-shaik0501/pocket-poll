import React, { useState } from 'react';
import { Candidate, Voter } from '../types';
import { castVoteApi } from '../api';
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, Send, Check } from 'lucide-react';

interface VotingPageProps {
  voter: Voter;
  candidates: Candidate[];
  onVoteComplete: (voterId: string, candidateName: string) => void;
  onCancel: () => void;
}

export const VotingPage: React.FC<VotingPageProps> = ({
  voter,
  candidates,
  onVoteComplete,
  onCancel,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCandidate = candidates.find((c) => c.candidateId === selectedCandidateId);

  const handleSaveVote = async () => {
    if (!selectedCandidateId) {
      setError('Please select one of the certified candidates before saving your vote.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await castVoteApi(voter.voterId, selectedCandidateId);
      if (result.success) {
        onVoteComplete(voter.voterId, selectedCandidate?.name || selectedCandidateId);
      } else {
        setError('Failed to record vote.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while committing vote.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="mb-6 text-sm font-semibold text-white/70 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Voters Directory</span>
      </button>

      {/* Authenticated Voter Banner with Green Verified Accent */}
      <div className="p-6 rounded-2xl glass-panel border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-bold">
                Verified Citizen Ballot
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                {voter.voterId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{voter.name}</h2>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
          <span className="text-xs font-mono text-white/50 uppercase tracking-widest block font-medium">
            Ballot Rule
          </span>
          <span className="text-sm font-bold text-orange-400">
            1 Non-transferable Vote
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl glass-panel border-red-500/40 text-red-200 flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidate Selection List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold uppercase tracking-wider text-white">
            Select Your Candidate
          </h3>
          <span className="text-sm text-white/50 font-medium">5 Certified Contenders</span>
        </div>

        <div className="space-y-3.5">
          {candidates.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.candidateId;

            return (
              <div
                key={candidate.candidateId}
                onClick={() => setSelectedCandidateId(candidate.candidateId)}
                className={`relative p-6 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-5 ${
                  isSelected
                    ? 'glass-panel border-emerald-500/60 bg-emerald-500/10 shadow-[0_10px_35px_rgba(16,185,129,0.2)] scale-[1.01]'
                    : 'glass-panel-subtle hover:bg-white/5 hover:border-orange-500/30'
                }`}
              >
                <div className="flex items-center gap-4.5">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'border-white/30 bg-transparent text-transparent'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-bold text-white">
                        {candidate.name}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/20">
                        {candidate.party}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mt-1">
                      {candidate.keyInitiative || candidate.tagline || 'Committed to democratic civic integrity.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-white/40 block">
                    Candidate Code
                  </span>
                  <span className="text-sm font-mono font-bold text-orange-400">
                    {candidate.candidateId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Save Vote Action */}
      <div className="p-6 sm:p-7 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <h4 className="text-base font-bold text-white">Ready to record ballot?</h4>
          <p className="text-sm text-white/70 mt-1">
            {selectedCandidate ? (
              <span className="text-emerald-400 font-semibold text-base">
                Selected: {selectedCandidate.name} ({selectedCandidate.party})
              </span>
            ) : (
              'Please choose one candidate above to continue.'
            )}
          </p>
        </div>

        <button
          onClick={handleSaveVote}
          disabled={!selectedCandidateId || isSubmitting}
          className={`px-8 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer shadow-lg ${
            !selectedCandidateId || isSubmitting
              ? 'bg-white/10 text-white/30 border border-white/10 cursor-not-allowed'
              : 'glass-button-green hover:scale-105'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Locking Ballot...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Save & Submit Ballot</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VotingPage;
