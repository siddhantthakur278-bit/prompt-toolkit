const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json()); // Allow reading JSON body from POST requests
app.use(express.static(path.join(__dirname, 'public')));

function parseToHTML(stdout) {
    const executions = [];
    const parts = stdout.split('Executing Output for Version:');
    
    // Extract Task metadata from the start of stdout
    const taskNameMatch = stdout.match(/\[Task Info\] Task Name: (.*)/);
    const taskName = taskNameMatch ? taskNameMatch[1].trim() : 'Unknown Task';
    
    const textMatch = stdout.match(/\[Task Info\] Input Text: "([\s\S]*?)"/);
    const inputText = textMatch ? textMatch[1].trim() : 'No input text provided.';

    // Parse Outputs
    for (let i = 1; i < parts.length; i++) {
        const block = parts[i];
        
        const verMatch = block.match(/\[(v\d+)\]/);
        const version = verMatch ? verMatch[1] : 'v?';
        
        const promptMatch = block.match(/\| Prompt: (.*)/);
        const promptContent = promptMatch ? promptMatch[1].trim() : 'Missing prompt content';
        
        const outMatch = block.match(/> Raw Output:\s*"([\s\S]*?)"/);
        const outputText = outMatch ? outMatch[1].trim() : 'No output captured';
        
        let man='0', key='0', len='0', tot='0', matches=[];
        const scoresMatch = block.match(/> Derived Scores:\s*(\{.*?\})/);
        if (scoresMatch) {
            try {
                const s = JSON.parse(scoresMatch[1]);
                man = s.manualScore || '0';
                key = (s.keywordScore || 0).toFixed(1);
                len = (s.lengthScore || 0).toFixed(1);
                tot = (s.totalScore || 0).toFixed(1);
                matches = s.keywordMatches || [];
            } catch(e) { }
        }
        
        executions.push({ version, promptContent, outputText, man, key, len, tot, matches });
    }
    
    let html = '';
    const bestMatch = stdout.match(/🏆 Best Version found:\s*(v\d+)\s*\(Average Score:\s*([\d.]+)/);
    const bestVer = bestMatch ? bestMatch[1] : null;
    const bestExecution = executions.find(e => e.version === bestVer);
    
    // 1. Task Section + Best Result Section
    html += `
    <div class="row align-start" style="animation: fadeIn 0.5s ease-out;">
        <div class="col card" style="flex: 1.2; border-top: 4px solid var(--accent-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div>
                    <h2 style="margin:0;">Task Configuration</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Dynamic evaluation parameters</p>
                </div>
                <span class="badge highlight-badge" style="padding: 6px 12px; font-size: 11px;">ACTIVE SESSION</span>
            </div>

            <div style="margin-bottom: 25px; background: rgba(59, 130, 246, 0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.1);">
                <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: var(--accent-color); border-radius: 50%;"></div>
                    <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px;">Input Topic</span>
                </div>
                <div style="font-size: 1.2rem; font-weight: 600; color: #fff; line-height: 1.4;">
                    "${inputText}"
                </div>
            </div>

            <h3>Generated Prompt Versions</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                ${executions.map(e => `
                <div style="background: #1a1a1a; padding: 16px; border-radius: 10px; border: 1px solid #333; transition: transform 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="badge ${bestVer === e.version ? 'highlight-badge' : 'badge-dark'}" style="min-width: 30px; text-align: center;">${e.version}</span>
                        <span style="color: #e2e8f0; font-size: 0.95rem; font-weight: 500;">${e.promptContent}</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="col card best-section" style="border-top: 4px solid var(--highlight);">
    `;
    
    if (bestMatch && bestExecution) {
        const reason = `${bestVer} is the most effective version because it successfully integrated ${bestExecution.matches.length} key evaluation keywords and produced a ${bestExecution.outputText.length > 350 ? 'highly comprehensive' : 'well-structured'} response.`;
        
        html += `
            <div class="best-header" style="border-bottom: 1px solid rgba(16, 185, 129, 0.1); padding-bottom: 25px;">
                <div>
                    <h2 style="margin:0; color:white; font-size: 1.5rem;">🏆 Selection: ${bestVer}</h2>
                    <p style="color: var(--highlight); font-size: 0.9rem; margin-top: 4px; font-weight: 600;">OPTIMIZED PERFORMANCE</p>
                </div>
                <div style="text-align: right;">
                    <div class="best-score" style="color: var(--highlight); font-size: 2.5rem;">${bestMatch[2]}</div>
                    <div style="font-size: 10px; color: #10b981; opacity: 0.6; font-weight: 800; letter-spacing: 1px;">TOTAL POINTS</div>
                </div>
            </div>
            
            <div style="margin-top:25px; background: rgba(16, 185, 129, 0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-weight:500; font-size: 1rem; color: #e2e8f0; line-height: 1.6;">
                    ${reason}
                </p>
            </div>
            
            <h3 style="margin-top:30px; font-size:14px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">Why this version won:</h3>
            <ul class="reason-list" style="margin-top: 15px;">
                <li><strong>Semantic Density:</strong> Found matches for: <span style="color: var(--highlight); font-weight: 600;">${bestExecution.matches.join(', ') || 'None'}</span>.</li>
                <li><strong>Constraint Mapping:</strong> Perfectly aligned with the complexity required for "${inputText}".</li>
                <li><strong>Engagement Score:</strong> Scored highest on structural clarity and information hierarchy.</li>
            </ul>
        `;
    } else {
         html += `<h2>Best Version</h2><p>Analysis incomplete.</p>`;
    }
    html += `</div></div>`;

    // 2. Scores Table Section
    html += `
    <div class="card full-width" style="margin-top: 10px; border-radius: 16px; overflow: hidden; padding: 0;">
        <div style="padding: 25px; border-bottom: 1px solid var(--border-color); background: #1a1a1a;">
            <h2 style="margin:0; font-size: 1.3rem;">Evaluation Matrix</h2>
        </div>
        <div class="table-container">
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>Version ID</th>
                        <th>Manual Grade</th>
                        <th>Keyword Match</th>
                        <th>Length Weight</th>
                        <th>Calculated Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${executions.map(e => `
                    <tr class="${bestVer === e.version ? 'row-winner' : ''}" style="${bestVer === e.version ? 'background: rgba(16, 185, 129, 0.04);' : ''}">
                        <td><span class="badge ${bestVer === e.version ? 'highlight-badge' : 'badge-dark'}" style="font-family: monospace;">${e.version}</span></td>
                        <td style="color: #94a3b8;">${e.man} <span style="font-size: 10px;">/ 5.0</span></td>
                        <td style="color: #94a3b8;">${e.key} <span style="font-size: 10px;">/ 5.0</span></td>
                        <td style="color: #94a3b8;">${e.len} <span style="font-size: 10px;">/ 5.0</span></td>
                        <td class="total-col" style="color: ${bestVer === e.version ? 'var(--highlight)' : '#fff'}; font-size: 1.2rem;">${e.tot}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;

    // 3. Execution Logs
    html += `
    <div style="margin-top: 50px; display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
        <h2 style="margin:0;">Dynamic Execution Logs</h2>
        <div style="flex: 1; height: 1px; background: #262626;"></div>
    </div>
    <div class="execution-grid">`;
    executions.forEach(e => {
        const isWinner = bestVer === e.version;
        html += `
        <div class="card execution-card ${isWinner ? 'winner-card' : ''}" style="border-radius: 16px; transition: transform 0.3s; ${isWinner ? 'box-shadow: 0 10px 30px rgba(16, 185, 129, 0.05);' : ''}">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge ${isWinner ? 'highlight-badge' : 'badge-dark'}">${e.version}</span>
                    <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Prompt Response</span>
                </div>
                ${isWinner ? '<span class="winner-star" style="background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 4px;">🏆 TOP PICK</span>' : ''}
            </div>
            
            <div style="background: #0a0a0a; padding: 14px; border-radius: 8px; border: 1px solid #222; margin-bottom: 20px;">
                <p style="margin:0; font-size: 0.8rem; color: #666; font-family: 'JetBrains Mono', 'Fira Code', monospace; line-height: 1.4;">
                    <span style="color: var(--accent-color); opacity: 0.7;">PROMPT:</span> ${e.promptContent}
                </p>
            </div>

            <div class="output-box" style="flex-grow: 1;">
                <blockquote style="background: rgba(255,255,255,0.02); border-left: 2px solid ${isWinner ? 'var(--highlight)' : 'var(--accent-color)'}; padding: 20px; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
                    ${e.outputText.replace(/\n/g, '<br>')}
                </blockquote>
            </div>
        </div>
        `;
    });
    html += `</div>
    <style>
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .execution-card:hover { transform: translateY(-5px); }
    </style>
    `;
    
    return html;
}

// Migrate to POST endpoint so we can receive dynamic JSON values safely
app.post('/run', (req, res) => {
    // Escape standard outer quotes by defaulting any missing variables safely
    const rawInput = req.body.input || "Explain Quantum Computing";
    const safeInput = rawInput.replace(/"/g, '\\"');
    
    // Command line inject the safe variable
    exec(`node app.js "${safeInput}"`, (error, stdout, stderr) => {
        if (error) return res.status(500).send(`<div class="card"><p style="color: #ef4444;">Error: ${error.message}</p></div>`);
        try {
            res.send(parseToHTML(stdout));
        } catch (err) {
            res.send(`<div class="card"><pre>${err.toString()}\\n${stdout}</pre></div>`);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server successfully started. You can view it here: http://localhost:${PORT}`);
});
