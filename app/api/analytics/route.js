import { NextResponse } from 'next/server';
import connectDB from '@/lib/db.js';
import Result from '@/models/Result.js';
import fs from 'fs';
import path from 'path';

const RESULTS_FILE = path.join(process.cwd(), 'data', 'results', 'results_log.json');

export async function GET() {
    try {
        let results = [];
        try {
            await connectDB();
            results = await Result.find({}).lean();
        } catch (dbErr) {
            if (fs.existsSync(RESULTS_FILE)) {
                const data = fs.readFileSync(RESULTS_FILE, 'utf8');
                results = JSON.parse(data);
            }
        }
        
        const defaultResponse = {
            history: [],
            stats: { totalRuns: 0, avgScore: "0.00", avgLatency: 0 }
        };

        if (!Array.isArray(results) || results.length === 0) {
            return NextResponse.json(defaultResponse);
        }

        const history = results.slice(-20).map(r => ({
            timestamp: r.timestamp || new Date(),
            score: (r.scores && r.scores.totalScore) || 0,
            latency: (r.latency || (r.meta && parseInt(r.meta.latency)) || 0)
        }));

        const totalRuns = results.length;
        const sumScore = results.reduce((a, b) => a + (b.scores?.totalScore || 0), 0);
        const sumLatency = results.reduce((a, b) => a + (parseInt(b.latency) || (b.meta && parseInt(b.meta.latency)) || 0), 0);

        return NextResponse.json({
            history,
            stats: {
                totalRuns,
                avgScore: (sumScore / totalRuns).toFixed(2),
                avgLatency: Math.round(sumLatency / totalRuns)
            }
        });
    } catch (e) {
        console.error("Analytics Error:", e);
        return NextResponse.json({ history: [], error: e.message, stats: { totalRuns: 0, avgScore: "0.00", avgLatency: 0 } });
    }
}
