import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';
import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

export async function POST(request, { params }) {
    const { id } = params;
    const { content } = await request.json();
    
    try {
        await connectDB();
        const prompt = await Prompt.findOne({ id });
        if (prompt) {
            const nextVerNum = prompt.versions.length + 1;
            prompt.versions.push({
                version: 'v' + nextVerNum,
                content,
                createdAt: new Date()
            });
            await prompt.save();
            return NextResponse.json(prompt);
        }
    } catch (e) {
        // Fallback to JSON below
    }

    // JSON Fallback
    const filePath = path.join(PROMPTS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const nextVerNum = (data.versions?.length || 0) + 1;
        data.versions = data.versions || [];
        data.versions.push({
            version: 'v' + nextVerNum,
            content,
            createdAt: new Date()
        });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Prompt Not Found for Versioning' }, { status: 404 });
}
