import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'templates', 'library.json');

const TemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  versionId: String,
  content: String,
  bestResponse: String, // Added field for optimized AI output
  averageScore: Number,
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

export async function GET() {
    try {
        await connectDB();
        const mongoTemplates = await Template.find({}).sort({ savedAt: -1 });
        if (mongoTemplates.length > 0) return NextResponse.json(mongoTemplates);
    } catch (e) {
        // Fallback to JSON
    }
    
    if (fs.existsSync(TEMPLATES_FILE)) {
        const data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
        // Ensure reverse chronological order for aesthetics
        return NextResponse.json(data.reverse ? data.reverse() : data);
    }
    return NextResponse.json([]);
}
