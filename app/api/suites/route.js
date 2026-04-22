import { NextResponse } from 'next/server';
import testSuiteManager from '@/testSuiteManager';

export async function GET() {
    try {
        const list = await testSuiteManager.listSuites();
        return NextResponse.json(list);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { title } = await request.json();
        const id = 's-' + Date.now();
        const data = await testSuiteManager.createSuite(id, title);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
