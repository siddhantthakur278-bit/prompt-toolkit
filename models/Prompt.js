import mongoose from 'mongoose';

const PromptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  versions: [{
    version: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);
