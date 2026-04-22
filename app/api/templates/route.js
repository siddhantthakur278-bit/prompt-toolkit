import { NextResponse } from 'next/server';
import templateLibrary from '@/templateLibrary';

export async function GET() {
    try {
        const list = await templateLibrary.listTemplates();
        return NextResponse.json(list);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
