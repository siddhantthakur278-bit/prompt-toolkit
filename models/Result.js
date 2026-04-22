import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  promptId: String,
  promptVersion: String,
  suiteId: String,
  input: String,
  output: String,
  scores: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Result || mongoose.model('Result', ResultSchema);