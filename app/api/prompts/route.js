import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';
import { classifyPrompt } from '@/lib/classifier';
import { generateImprovedVariants } from '@/lib/aiOptimizer';
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
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    try {
        const { title, content, autoOptimize } = await request.json();
        const category = await classifyPrompt(content);
        const id = 'p-' + Date.now();
        
        let versions = [{ version: 'v1', content, createdAt: new Date() }];
        
        if (autoOptimize) {
            const variants = await generateImprovedVariants(content);
            variants.forEach((v, idx) => {
                versions.push({
                    version: `v${idx + 2}`,
                    content: v,
                    createdAt: new Date()
                });
            });
        }

        try {
            await connectDB();
            const newPrompt = new Prompt({ id, title, category, versions });
            await newPrompt.save();
            return NextResponse.json(newPrompt);
        } catch (dbErr) {
            // JSON Fallback for Creation
            const filePath = path.join(PROMPTS_DIR, `${id}.json`);
            const data = { id, title, category, versions };
            if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return NextResponse.json(data);
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
