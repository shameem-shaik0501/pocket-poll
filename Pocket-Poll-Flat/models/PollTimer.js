import mongoose from 'mongoose';

const PollTimerSchema = new mongoose.Schema({
  timerId: {
    type: String,
    required: true,
    unique: true,
    default: 'global_100m_timer',
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 100,
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRunning: {
    type: Boolean,
    default: true,
  },
  pausedRemainingSeconds: {
    type: Number,
    default: null,
  },
  isManuallyBypassed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const PollTimer = mongoose.models.PollTimer || mongoose.model('PollTimer', PollTimerSchema);
export default PollTimer;
