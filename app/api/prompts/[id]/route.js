import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';
import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

export async function GET(request, { params }) {
    const { id } = params;
    try {
        await connectDB();
        const prompt = await Prompt.findOne({ id });
        if (prompt) return NextResponse.json(prompt);
    } catch (e) {
        // Fallback to JSON
    }
    
    const filePath = path.join(PROMPTS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
