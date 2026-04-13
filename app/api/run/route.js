import { NextResponse } from 'next/server';
const { exec } = require('child_process');
const path = require('path');

export async function POST(request) {
    try {
        const { input, model, promptId, versionId } = await request.json();
        const safeInput = (input || "Explain Quantum Computing").replace(/"/g, '\\"');
        const safeModel = (model || "llama-3.3-70b-versatile");
        const safePromptId = (promptId || "");
        const safeVersionId = (versionId || "");
        
        return new Promise((resolve) => {
            const appPath = path.join(process.cwd(), 'app.js');
            // Using process.execPath ensure we use the same node binary
            exec(`"${process.execPath}" "${appPath}" "${safeInput}" "${safeModel}" "${safePromptId}" "${safeVersionId}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error("Execution Error:", stderr);
                    return resolve(NextResponse.json({ error: error.message, details: stderr }, { status: 500 }));
                }
                return resolve(NextResponse.json({ raw: stdout }));
            });
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
