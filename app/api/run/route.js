import { NextResponse } from 'next/server';
import { runOptimizationPipeline } from '@/lib/pipelineRunner';

export async function POST(request) {
    try {
        const { input, model, promptId, versionId } = await request.json();
        
        let logs = [];
        const captureLog = (msg) => logs.push(msg);

        // Run the pipeline directly in-process
        await runOptimizationPipeline(input, model, promptId, versionId, captureLog);
        
        const fullOutput = logs.join('\n');
        return NextResponse.json({ raw: fullOutput });

    } catch (e) {
        console.error("API Run Error:", e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
