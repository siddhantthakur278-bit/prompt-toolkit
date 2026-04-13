import https from 'https';

export async function generateImprovedVariants(initialPrompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return [];

    const systemPrompt = `You are a Prompt Engineering Expert. Given a user's initial prompt, generate TWO distinct, improved, and highly structured versions of it. 
    Version 1: Focus on Chain-of-Thought reasoning.
    Version 2: Focus on professional, concise framing.
    
    Return ONLY a JSON array of strings: ["Version 1 content", "Version 2 content"]`;

    const data = JSON.stringify({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Initial Prompt: ${initialPrompt}` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        response_format: { type: "json_object" }
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    const content = JSON.parse(json.choices[0].message.content);
                    // The model might return { "variants": [...] } or similar depending on JSON mode
                    const variants = content.variants || Object.values(content)[0] || [];
                    resolve(variants);
                } catch (e) {
                    console.error("AI Variant Gen Error:", e);
                    resolve([]);
                }
            });
        });
        req.write(data);
        req.end();
    });
}
