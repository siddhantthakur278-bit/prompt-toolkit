import { NextResponse } from 'next/server';
import promptManager from '@/promptManager';
import { classifyPrompt } from '@/lib/classifier';
import { generateImprovedVariants } from '@/lib/aiOptimizer';

export async function GET() {
    try {
        const list = await promptManager.listPrompts();
        return NextResponse.json(list);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { title, content, autoOptimize } = await request.json();
        const category = await classifyPrompt(content);
        const id = 'p-' + Date.now();
        
        const data = await promptManager.createPrompt(id, title, content);
        
        if (autoOptimize) {
            const variants = await generateImprovedVariants(content);
            for (const v of variants) {
                await promptManager.addVersion(id, v);
            }
        }

        const updatedData = await promptManager.getPrompt(id);
        return NextResponse.json({ ...updatedData, category });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
