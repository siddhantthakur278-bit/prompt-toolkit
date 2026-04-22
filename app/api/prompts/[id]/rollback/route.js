import { NextResponse } from 'next/server';
import promptManager from '@/promptManager';

export async function POST(request, { params }) {
    const { id } = await params;
    try {
        const { versionId } = await request.json();
        const data = await promptManager.rollbackVersion(id, versionId);
        if (data) return NextResponse.json(data);
        return NextResponse.json({ error: 'Rollback failed or version not found' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
