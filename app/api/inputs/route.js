import { NextResponse } from 'next/server';
import inputManager from '@/inputManager';

export async function GET() {
    try {
        const list = await inputManager.listInputs();
        return NextResponse.json(list);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { content } = await request.json();
        const data = await inputManager.saveInput(content);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}