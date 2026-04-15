import https from 'https';

export async function exportToN8N(templateData) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("N8N_WEBHOOK_URL not defined. Skipping export.");
        return;
    }

    const payload = JSON.stringify({
        source: "Prompt Toolkit",
        action: "save_optimized_template",
        data: {
            prompt_title: templateData.title,
            version: templateData.versionId,
            optimized_content: templateData.content,
            best_ai_response: templateData.bestResponse,
            performance_score: templateData.averageScore,
            timestamp: templateData.savedAt
        }
    });

    const url = new URL(webhookUrl);
    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`N8N Export Status: ${res.statusCode}`);
                resolve(body);
            });
        });

        req.on('error', (e) => {
            console.error(`N8N Export Error: ${e.message}`);
            resolve(null);
        });

        req.write(payload);
        req.end();
    });
}
