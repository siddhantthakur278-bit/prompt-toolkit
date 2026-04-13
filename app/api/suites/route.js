import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

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
        return NextResponse.json({ error: e.message }, { status: 500 });
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
