import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  candidateId: {
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
  party: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    default: '',
  },
  keyInitiative: {
    type: String,
    default: '',
  },
  accentColor: {
    type: String,
    default: '#06b6d4',
  },
  votesCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isDesignatedLeader: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
export default Candidate;
