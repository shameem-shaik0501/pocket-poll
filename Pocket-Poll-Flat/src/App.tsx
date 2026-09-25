/**
 * Pocket Poll - Main Application Controller
 * Handles 5 distinct views:
 * 1. Home Page: Blank screen with centered "Pocket Poll" & dynamic digital stream background
 * 2. Voters Page: 100 Pre-Seeded Users (CAN-001 to CAN-100)
 * 3. Authentication Phase: Password validation (default: exact uppercase ID)
 * 4. Voting Page: 5 Candidates, 1 Vote lock, Commits to MongoDB & redirects to Voters Page
 * 5. Admin Dashboard: Time-locked by 100m countdown, manual bypass via nazeer/nazeer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Voter, Candidate, TimerState } from './types';
import { fetchVoters, fetchCandidates, fetchTimer } from './api';

import HomePage from './components/HomePage';
import TopBar from './components/TopBar';
import VotersPage from './components/VotersPage';
import AuthModal from './components/AuthModal';
import VotingPage from './components/VotingPage';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthModal from './components/AdminAuthModal';
import DigitalCanvas from './components/DigitalCanvas';

type ViewMode = 'home' | 'voters' | 'voting' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [isLoadingVoters, setIsLoadingVoters] = useState(false);

  // Authentication State for Voters
  const [selectedVoterForAuth, setSelectedVoterForAuth] = useState<Voter | null>(null);
  const [authenticatedVoter, setAuthenticatedVoter] = useState<Voter | null>(null);

  // Admin Security State
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Notifications (e.g. after vote save redirection)
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load Initial Voters & Candidates
  const loadInitialData = useCallback(async () => {
    setIsLoadingVoters(true);
    try {
      const [votersData, candidatesData, timerData] = await Promise.all([
        fetchVoters(),
        fetchCandidates(),
        fetchTimer(),
      ]);
      setVoters(votersData);
      setCandidates(candidatesData);
      setTimer(timerData);
    } catch (err) {
      console.error('Initial load error:', err);
    } finally {
      setIsLoadingVoters(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Global 100-Minute Timer Ticker
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (!prev) return prev;
        if (!prev.isRunning) return prev; // Pause client countdown when stopped by admin
        if (prev.remainingSeconds <= 1) {
          return {
            ...prev,
            remainingSeconds: 0,
            isExpired: true,
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Periodic Server Timer Sync
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const freshTimer = await fetchTimer();
        setTimer(freshTimer);
      } catch (e) {
        // silent sync fail
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  // Page 1: Interaction Handler (Click/Enter transitions to Page 2 Voters)
  const handleHomeInteraction = () => {
    setCurrentView('voters');
  };

  // Page 2: Voter Card Click -> Open Authentication Phase
  const handleSelectVoter = (voter: Voter) => {
    setSelectedVoterForAuth(voter);
  };

  // Page 3: Successful Authentication -> Proceed to Voting Page
  const handleAuthenticated = (voter: Voter) => {
    setSelectedVoterForAuth(null);
    setAuthenticatedVoter(voter);
    setCurrentView('voting');
  };

  // Page 4: Save Vote -> Commit to MongoDB and Immediately Redirect to Page 2 (Voters Page)
  const handleVoteComplete = async (voterId: string, candidateName: string) => {
    // Reset authenticated voter session
    setAuthenticatedVoter(null);

    // Refresh voters list to show new 'hasVoted = true' state
    try {
      const updatedVoters = await fetchVoters();
      setVoters(updatedVoters);
    } catch (e) {
      // Local optimistic update
      setVoters((prev) =>
        prev.map((v) => (v.voterId === voterId ? { ...v, hasVoted: true } : v))
      );
    }

    // Set notification banner
    setNotification({
      type: 'success',
      message: `Ballot successfully committed to MongoDB for voter ${voterId} (${candidateName}). Double voting is now locked.`,
    });

    // IMMEDIATELY REDIRECT TO VOTERS PAGE (DO NOT REDIRECT TO HOME PAGE)
    setCurrentView('voters');

    // Auto clear notification after 8 seconds
    setTimeout(() => {
      setNotification((curr) => (curr?.message.includes(voterId) ? null : curr));
    }, 8000);
  };

  // Admin login success
  const handleAdminBypassSuccess = (token: string) => {
    setAdminToken(token);
    setCurrentView('admin');
  };

  // Render Page 1: Home Page
  if (currentView === 'home') {
    return <HomePage onEnter={handleHomeInteraction} />;
  }

  const isAdminUnlocked = Boolean(adminToken) || Boolean(timer && timer.isExpired);

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans relative selection:bg-orange-500 selection:text-black">
      {/* Dynamic Digital Animated Background - Cursor Interactive */}
      <DigitalCanvas interactive={true} />

      {/* Top Bar for Navigation & Global Status */}
      <TopBar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'voting' && !authenticatedVoter) {
            setCurrentView('voters');
            setNotification({
              type: 'info',
              message: 'Please select a registered voter card and authenticate first.',
            });
            return;
          }
          setCurrentView(view);
        }}
        activeVoter={authenticatedVoter}
        timer={timer}
        isAdminUnlocked={isAdminUnlocked}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        onLogoClick={() => setCurrentView('voters')}
      />

      {/* Main View Container */}
      <main className="flex-1 relative z-10">
        {currentView === 'voters' && (
          <VotersPage
            voters={voters}
            isLoading={isLoadingVoters}
            onSelectVoter={handleSelectVoter}
            onRefresh={loadInitialData}
            notification={notification}
          />
        )}

        {currentView === 'voting' && authenticatedVoter && (
          <VotingPage
            voter={authenticatedVoter}
            candidates={candidates}
            onVoteComplete={handleVoteComplete}
            onCancel={() => {
              setAuthenticatedVoter(null);
              setCurrentView('voters');
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            timer={timer}
            adminToken={adminToken}
            onAdminLoginSuccess={(token) => setAdminToken(token)}
            onVotersUpdated={loadInitialData}
          />
        )}
      </main>

      {/* Page 3: Voter Authentication Phase Modal */}
      {selectedVoterForAuth && (
        <AuthModal
          voter={selectedVoterForAuth}
          onClose={() => setSelectedVoterForAuth(null)}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {/* Admin Manual Bypass Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminBypassSuccess}
      />
    </div>
  );
}
