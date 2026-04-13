import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESULTS_FILE = path.join(process.cwd(), 'data', 'results', 'results_log.json');

export async function GET() {
    try {
        const defaultResponse = {
            history: [],
            stats: { totalRuns: 0, avgScore: "0.00", avgLatency: 0 }
        };

        if (!fs.existsSync(RESULTS_FILE)) return NextResponse.json(defaultResponse);
        
        const data = fs.readFileSync(RESULTS_FILE, 'utf8');
        const results = JSON.parse(data);
        
        if (!Array.isArray(results) || results.length === 0) {
            return NextResponse.json(defaultResponse);
        }

        const history = results.slice(-20).map(r => ({
            timestamp: r.timestamp || new Date(),
            score: (r.scores && r.scores.totalScore) || 0,
            latency: (r.meta && parseInt(r.meta.latency)) || 0
        }));

        const totalRuns = results.length;
        const sumScore = results.reduce((a, b) => a + (b.scores?.totalScore || 0), 0);
        const sumLatency = results.reduce((a, b) => a + (parseInt(b.meta?.latency) || 0), 0);

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
