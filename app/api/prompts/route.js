import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';
import { classifyPrompt } from '@/lib/classifier';
import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

export async function GET() {
    try {
        await connectDB();
        const mongoPrompts = await Prompt.find({}).sort({ updatedAt: -1 });
        const list = mongoPrompts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            versionCount: p.versions.length
        }));
        return NextResponse.json(list);
    } catch (e) {
        // Fallback to JSON
        if (fs.existsSync(PROMPTS_DIR)) {
            const files = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.json') && f !== 'prompts.json');
            const list = files.map(f => {
                const data = JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8'));
                return {
                    id: data.id,
                    title: data.title,
                    category: 'Local Storage',
                    versionCount: (data.versions || []).length
                };
            });
            return NextResponse.json(list);
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const { title, content } = await request.json();
        const category = await classifyPrompt(content);
        const id = 'p-' + Date.now();
        const newPrompt = new Prompt({
            id, title, category,
            versions: [{ version: 'v1', content, createdAt: new Date() }]
        });
        await newPrompt.save();
        return NextResponse.json(newPrompt);
    } catch (e) {
        // For POST, keep it simple for now, maybe just write to JSON
        return NextResponse.json({ error: "Storage Engine Error (Mongo Down)" }, { status: 400 });
    }
}
