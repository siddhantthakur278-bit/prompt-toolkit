import { NextResponse } from 'next/server';
import promptManager from '@/promptManager';

export async function GET(request, { params }) {
    const { id } = params;
    try {
        const data = await promptManager.getPrompt(id);
        if (data) return NextResponse.json(data);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
