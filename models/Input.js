import mongoose from 'mongoose';

const InputSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Input || mongoose.model('Input', InputSchema);