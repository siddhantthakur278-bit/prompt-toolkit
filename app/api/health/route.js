import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

export async function GET() {
    try {
        await connectDB();
        const status = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        return NextResponse.json({ status });
    } catch (e) {
        return NextResponse.json({ status: 'error' });
    }
}
