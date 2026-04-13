import https from 'https';
import fs from 'fs';
import path from 'path';

class ExecutionEngine {
    constructor() {
        this.loadEnv();
    }

    loadEnv() {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    process.env[key] = value;
                }
            });
        }
    }

    async runPrompt(promptContent, input, model = 'llama-3.3-70b-versatile') {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return `[Error] Groq API Key not found in .env. Ensure GROQ_API_KEY is set.`;
        }

        // Mapping model IDs
        let modelId = model;
        if (model === 'GPT-4o') modelId = 'llama-3.3-70b-versatile'; 
        if (model === 'Claude 3.5' || model === 'Claude-3') modelId = 'mixtral-8x7b-32768';
        if (model === 'Gemini 1.5') modelId = 'gemma2-9b-it';

        const data = JSON.stringify({
            messages: [
                { role: 'system', content: promptContent },
                { role: 'user', content: input }
            ],
            model: modelId,
            temperature: 0.7,
            max_tokens: 1024
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (d) => body += d);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.choices && json.choices[0]) {
                            resolve(json.choices[0].message.content);
                        } else if (json.error) {
                            resolve(`[API Error] ${json.error.message}`);
                        } else {
                            resolve(`[Unexpected Response] ${body}`);
                        }
                    } catch (e) {
                        resolve(`[Parse Error] ${body}`);
                    }
                });
            });

            req.on('error', (e) => {
                resolve(`[Network Error] ${e.message}`);
            });

            req.write(data);
            req.end();
        });
    }
}

const instance = new ExecutionEngine();
export default instance;
