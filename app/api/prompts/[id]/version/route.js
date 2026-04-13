import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';

export async function POST(request, { params }) {
    const { id } = params;
    const { content } = await request.json();
    try {
        await connectDB();
        const prompt = await Prompt.findOne({ id });
        if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        const nextVerNum = prompt.versions.length + 1;
        prompt.versions.push({
            version: 'v' + nextVerNum,
            content,
            createdAt: new Date()
        });
        
        await prompt.save();
        return NextResponse.json(prompt);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
