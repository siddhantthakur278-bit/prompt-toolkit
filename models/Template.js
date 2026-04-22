import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  versionId: String,
  content: String,
  bestResponse: String,
  averageScore: Number,
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);