import mongoose from 'mongoose';

const TestSuiteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  tests: [{
    input: String,
    criteria: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

export default mongoose.models.TestSuite || mongoose.model('TestSuite', TestSuiteSchema);