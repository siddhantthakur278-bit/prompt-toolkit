import { NextResponse } from 'next/server';
import promptManager from '@/promptManager';

export async function POST(request, { params }) {
    const { id } = await params;
    try {
        const { content } = await request.json();
        const data = await promptManager.addVersion(id, content);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
