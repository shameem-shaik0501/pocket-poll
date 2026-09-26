import mongoose from 'mongoose';

const VoterSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  hasVoted: {
    type: Boolean,
    default: false,
    index: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true,
  },
  votedCandidateId: {
    type: String,
    default: null,
  },
  votedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Always uppercase the password and voter ID
VoterSchema.pre('save', function (next) {
  if (this.voterId) this.voterId = this.voterId.toUpperCase();
  if (this.password) this.password = this.password.toUpperCase();
  next();
});

export const Voter = mongoose.models.Voter || mongoose.model('Voter', VoterSchema);
export default Voter;
