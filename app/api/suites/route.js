import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TestSuiteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  tests: [{
    input: String,
    criteria: String
  }]
}, { timestamps: true });

const TestSuite = mongoose.models.TestSuite || mongoose.model('TestSuite', TestSuiteSchema);

export async function GET() {
    try {
        await connectDB();
        const suites = await TestSuite.find({});
        return NextResponse.json(suites);
    } catch (e) {
        const SUITES_DIR = path.join(process.cwd(), 'data', 'test_suites');
        if (fs.existsSync(SUITES_DIR)) {
            const files = fs.readdirSync(SUITES_DIR).filter(f => f.endsWith('.json'));
            const list = files.map(f => {
                const data = JSON.parse(fs.readFileSync(path.join(SUITES_DIR, f), 'utf8'));
                return {
                    id: data.id,
                    title: data.title,
                    tests: data.tests || []
                };
            });
            return NextResponse.json(list);
        }
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const { title } = await request.json();
        const suite = new TestSuite({
            id: 's-' + Date.now(),
            title,
            tests: []
        });
        await suite.save();
        return NextResponse.json(suite);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
