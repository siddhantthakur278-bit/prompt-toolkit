import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import promptManager from './promptManager.js';
import testSuiteManager from './testSuiteManager.js';
import templateLibrary from './templateLibrary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json()); // Allow reading JSON body from POST requests
app.use(express.static(path.join(__dirname, 'public')));

function parseToHTML(stdout) {
    const executions = [];
    const parts = stdout.split('Executing Output for Version:');
    
    const taskNameMatch = stdout.match(/\[Task Info\] Task Name: (.*)/);
    const taskName = taskNameMatch ? taskNameMatch[1].trim() : 'Elite Pipeline';
    
    const textMatch = stdout.match(/\[Task Info\] Input Text: "([\s\S]*?)"/);
    const inputText = textMatch ? textMatch[1].trim() : 'No input text';

    const globalModelMatch = stdout.match(/\[Task Info\] Global Model: (.*)/);
    const globalModel = globalModelMatch ? globalModelMatch[1].trim() : 'Unknown Model';

    for (let i = 1; i < parts.length; i++) {
        const block = parts[i];
        const verMatch = block.match(/\[(v\d+)\]/);
        const version = verMatch ? verMatch[1] : 'v?';
        const promptMatch = block.match(/\| Prompt: (.*)/);
        const promptContent = promptMatch ? promptMatch[1].trim() : 'Missing prompt';
        
        // Fixed parsing using new delimiters [[...]]
        const outMatch = block.match(/> Raw Output: \[\[([\s\S]*?)\]\]/);
        const outputText = outMatch ? outMatch[1].trim() : 'No output captured';
        
        let man='0', key='0', len='0', tot='0';
        const scoresMatch = block.match(/> Derived Scores:\s*(\{.*?\})/);
        if (scoresMatch) {
            try {
                const s = JSON.parse(scoresMatch[1]);
                man = s.manualScore || '0';
                key = (s.keywordScore || 0).toFixed(1);
                len = (s.lengthScore || 0).toFixed(1);
                tot = (s.totalScore || 0).toFixed(1);
            } catch(e) { }
        }

        let meta = { latency: '0', tokens: '0', cost: '0.00', model: globalModel };
        const metaMatch = block.match(/> Elite Metadata:\s*(\{.*?\})/);
        if (metaMatch) {
            try { meta = JSON.parse(metaMatch[1]); } catch(e) {}
        }

        executions.push({ version, promptContent, outputText, man, key, len, tot, meta });
    }
    
    const bestMatch = stdout.match(/🏆 Best Version found:\s*(v\d+)\s*\(Average Score:\s*([\d.]+)/);
    const bestVer = bestMatch ? bestMatch[1] : null;
    
    let html = `
    <div class="grid-2">
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 class="section-title" style="margin:0;">Pipeline Intel</h3>
                <span class="badge badge-accent" style="background: var(--gradient-1);">${globalModel}</span>
            </div>
            
            <div style="margin-bottom: 32px;">
                <p style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.1em; font-weight: 700;">ACTIVE INPUT VECTOR</p>
                <div style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 16px; border: 1px solid var(--glass-border); line-height: 1.6; color: var(--text-main); box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
                    <span style="color: var(--accent-primary); font-weight: 800; margin-right: 8px;">&ldquo;</span>${inputText}<span style="color: var(--accent-primary); font-weight: 800; margin-left: 8px;">&rdquo;</span>
                </div>
            </div>

            <h3 class="section-title" style="font-size: 0.9rem; letter-spacing: 0.05em;">AGENT ARCHITECTURES</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${executions.map(e => `
                <div style="background: ${bestVer === e.version ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)'}; padding: 14px 18px; border-radius: 14px; border: 1px solid ${bestVer === e.version ? 'var(--accent-primary)' : 'var(--glass-border)'}; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span class="badge ${bestVer === e.version ? 'badge-success' : 'badge-outline'}" style="min-width: 45px; text-align: center;">${e.version}</span>
                        <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-main); opacity: 0.9;">${e.promptContent}</span>
                    </div>
                    ${bestVer === e.version ? '<span style="color: var(--success); font-size: 1.2rem;">⚡</span>' : ''}
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="glass-card" style="background: radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: var(--accent-secondary); filter: blur(60px); opacity: 0.2;"></div>
    `;
    
    if (bestMatch) {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
                <div>
                    <h3 class="section-title" style="margin-bottom: 6px; color: white;">Elite Recommendation</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="badge badge-success" style="background: var(--success); color: #000;">VERSION ${bestMatch[1]}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">RANK #1</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="score-pill" style="font-size: 3rem; line-height: 1;">${bestMatch[2]}<span class="score-total" style="font-size: 1.2rem;">/15</span></div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border-left: 4px solid var(--success); margin-bottom: 24px;">
                <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; opacity: 0.9;">
                    System analysis confirms <strong style="color: var(--success);">Variant ${bestMatch[1]}</strong> as the elite choice. It achieved peak structural coherence and semantic precision relative to the target vector.
                </p>
            </div>
            
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <p style="color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">LATENCY</p>
                    <p style="font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">${executions.find(e => e.version === bestVer).meta.latency}ms</p>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <p style="color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">EST. COST</p>
                    <p style="font-size: 1.2rem; font-weight: 700; color: var(--success);">$${executions.find(e => e.version === bestVer).meta.cost}</p>
                </div>
            </div>
        `;
    }
    
    html += `
        </div>
    </div>

    <div class="glass-card" style="padding: 0; overflow: hidden;">
        <div style="padding: 32px 32px 0;">
            <h3 class="section-title">Performance Benchmark</h3>
        </div>
        <div style="overflow-x: auto;">
            <table class="table-custom">
                <thead style="background: rgba(255,255,255,0.02);">
                    <tr>
                        <th style="padding-left: 32px;">Architecture</th>
                        <th>Manual Grade</th>
                        <th>Keyword Match</th>
                        <th>Length Compliance</th>
                        <th style="padding-right: 32px; text-align: right;">Total Efficiency</th>
                    </tr>
                </thead>
                <tbody>
                    ${executions.map(e => `
                    <tr ${bestVer === e.version ? 'style="background: rgba(16, 185, 129, 0.04);"' : ''}>
                        <td style="padding-left: 32px;"><span class="badge ${bestVer === e.version ? 'badge-success' : 'badge-outline'}">${e.version}</span></td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${e.man * 20}%; height: 100%; background: var(--accent-primary);"></div>
                                </div>
                                <span>${e.man}</span>
                            </div>
                        </td>
                        <td>${e.key} / 5</td>
                        <td>${e.len} / 5</td>
                        <td style="padding-right: 32px; text-align: right; font-weight: 800; font-size: 1.1rem; color: ${bestVer === e.version ? 'var(--success)' : 'white'};">${e.tot}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <h3 class="section-title" style="margin-top: 48px; margin-left: 12px; letter-spacing: 0.1em;">SYSTEM EXECUTION LOGS</h3>
    <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px;">
        ${executions.map(e => `
        <div class="glass-card" style="margin-bottom: 0; display: flex; flex-direction: column; border-top: 2px solid ${bestVer === e.version ? 'var(--success)' : 'var(--glass-border)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge ${bestVer === e.version ? 'badge-success' : 'badge-outline'}">${e.version}</span>
                    <span style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">${e.meta.model}</span>
                </div>
                <div style="text-align: right;">
                    <p style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; margin-bottom: 2px;">TOKENS</p>
                    <p style="font-size: 0.8rem; font-weight: 800; color: var(--text-main);">${e.meta.tokens}</p>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.2); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--glass-border); margin-bottom: 16px;">
                <p style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--accent-primary); font-weight: 600;">λ prompt: <span style="color: var(--text-muted); font-weight: 400;">${e.promptContent}</span></p>
            </div>
            
            <div class="output-quote" style="flex-grow: 1; border-left-color: ${bestVer === e.version ? 'var(--success)' : 'var(--accent-primary)'};">
                ${e.outputText.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 16px;">
                <span style="font-size: 0.75rem; color: var(--text-muted);">Latency: <strong>${e.meta.latency}ms</strong></span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Cost: <strong style="color: var(--success);">$${e.meta.cost}</strong></span>
            </div>
        </div>
        `).join('')}
    </div>
    `;
    
    return html;
}

// Create new prompt
app.post('/api/prompts', (req, res) => {
    const { title, content } = req.body;
    const id = 'p-' + Date.now();
    try {
        const prompt = promptManager.createPrompt(id, title, content);
        res.json(prompt);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Create new test suite
app.post('/api/suites', (req, res) => {
    const { title } = req.body;
    const id = 's-' + Date.now();
    try {
        const suite = testSuiteManager.createSuite(id, title);
        res.json(suite);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// List all prompts
app.get('/api/prompts', (req, res) => {
    res.json(promptManager.listPrompts());
});

// Get specific prompt details
app.get('/api/prompts/:id', (req, res) => {
    const prompt = promptManager.getPrompt(req.params.id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
});

// Add new version
app.post('/api/prompts/:id/version', (req, res) => {
    const { content } = req.body;
    try {
        const prompt = promptManager.addVersion(req.params.id, content);
        res.json(prompt);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Rollback version
app.post('/api/prompts/:id/rollback', (req, res) => {
    const { versionId } = req.body;
    try {
        const prompt = promptManager.rollbackVersion(req.params.id, versionId);
        res.json(prompt);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// List suites
app.get('/api/suites', (req, res) => {
    res.json(testSuiteManager.listSuites());
});

// Save to template library
app.post('/api/templates', (req, res) => {
    const { promptId, versionId, averageScore } = req.body;
    try {
        const template = templateLibrary.saveTemplate(promptId, versionId, averageScore);
        res.json(template);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// List templates
app.get('/api/templates', (req, res) => {
    res.json(templateLibrary.listTemplates());
});

app.post('/run', (req, res) => {
    const rawInput = req.body.input || "Explain Quantum Computing";
    const model = req.body.model || "GPT-4o";
    const promptId = req.body.promptId || "";
    const versionId = req.body.versionId || "";
    const safeInput = rawInput.replace(/"/g, '\\"');
    
    exec(`node app.js "${safeInput}" "${model}" "${promptId}" "${versionId}"`, (error, stdout, stderr) => {
        if (error) return res.status(500).send(`<div class="glass-card"><p style="color: #ef4444;">Error: ${error.message}</p></div>`);
        try {
            res.send(parseToHTML(stdout));
        } catch (err) {
            res.send(`<div class="glass-card"><pre>${err.toString()}\\n${stdout}</pre></div>`);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server successfully started. You can view it here: http://localhost:${PORT}`);
});
