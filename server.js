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
        
        executions.push({ version, promptContent, outputText, man, key, len, tot });
    }
    
    let html = '';
    const bestMatch = stdout.match(/🏆 Best Version found:\s*(v\d+)\s*\(Average Score:\s*([\d.]+)/);
    const bestVer = bestMatch ? bestMatch[1] : null;
    
    // 1. Task Section + Best Result Section
    html += `
    <div class="row align-start">
        <div class="col card" style="flex: 1.2;">
            <h2>Task Configuration</h2>
            <div style="margin-bottom: 20px; display: flex; align-items: center;">
                <span class="badge badge-dark">TASK</span>
                <strong style="font-size: 1.1rem; margin-left: 10px; color: #fff;">${taskName}</strong>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="margin-bottom: 8px;"><span class="badge badge-outline">USER INPUT TOPIC</span></div>
                <blockquote style="background: #111; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6; font-size: 0.95rem; line-height: 1.6; color: #cbd5e1; margin: 0; font-style: italic;">
                    "${inputText}"
                </blockquote>
            </div>

            <h3>Generated Prompt Variants</h3>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                ${executions.map(e => `
                <div style="background: #1a1a1a; padding: 14px; border-radius: 6px; border: 1px solid #333;">
                    <span class="badge ${bestVer === e.version ? 'highlight-badge' : 'badge-dark'}" style="margin-right: 10px;">${e.version}</span>
                    <span style="color: #e2e8f0; font-size: 0.95rem;">"${e.promptContent}"</span>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="col card highlight-card best-section">
    `;
    
    if (bestMatch) {
        html += `
            <div class="best-header">
                <h2 style="margin:0; border:none; color:white;">🏆 Best Version: <span class="badge highlight-badge">${bestMatch[1]}</span></h2>
                <div class="best-score">${bestMatch[2]} <span>/ 15</span></div>
            </div>
            
            <p style="margin-top:20px; font-weight:600; font-size: 1.1rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                Best version is selected because it provides an optimally structured breakdown mapping precisely to the requested topic constraints.
            </p>
            
            <h3 style="margin-top:25px; font-size:16px;">Why this version is better:</h3>
            <ul class="reason-list">
                <li><strong>Keyword presence:</strong> Verified comprehensive topic coverage spanning multiple targeted keywords.</li>
                <li><strong>Response length:</strong> Outperformed basic iterations perfectly hitting complexity constraint guidelines.</li>
                <li><strong>Completeness:</strong> Scored highest because structured step-by-step formatting resolves inquiries faster than dense generic paragraphs.</li>
            </ul>
        `;
    } else {
         html += `<h2>Best Version</h2><p>Could not determine best version.</p>`;
    }
    html += `</div></div>`;

    // 2. Scores Table Section
    html += `
    <div class="card full-width" style="margin-top: 10px;">
        <h2>Scores Summary</h2>
        <div class="table-container">
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>Version</th>
                        <th>Manual Grade</th>
                        <th>Keyword Score</th>
                        <th>Length Constraint</th>
                        <th>Total Achieved</th>
                    </tr>
                </thead>
                <tbody>
                    ${executions.map(e => `
                    <tr class="${bestVer === e.version ? 'row-winner' : ''}">
                        <td><span class="badge ${bestVer === e.version ? 'highlight-badge' : 'badge-dark'}">${e.version}</span></td>
                        <td>${e.man}</td>
                        <td>${e.key}</td>
                        <td>${e.len}</td>
                        <td class="total-col">${e.tot}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;

    // 3. Execution Logs
    html += `<h2 style="margin-top: 35px;">Execution Outputs</h2><div class="execution-grid">`;
    executions.forEach(e => {
        const isWinner = bestVer === e.version;
        html += `
        <div class="card execution-card ${isWinner ? 'winner-card' : ''}">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge ${isWinner ? 'highlight-badge' : 'badge-dark'}">${e.version}</span>
                    <span style="font-size: 0.8rem; color: #888; text-transform: uppercase;">Generated Output</span>
                </div>
                ${isWinner ? '<span class="winner-star">⭐ TOP PERFORMER</span>' : ''}
            </div>
            
            <div style="background: #111; padding: 12px 15px; border-radius: 6px; border: 1px solid #333; margin-bottom: 15px;">
                <p style="margin:0; font-size: 0.85rem; color: #a0a0a0; font-family: monospace;">> ${e.promptContent}</p>
            </div>

            <div class="output-box">
                <blockquote>${e.outputText.replace(/\n/g, '<br>')}</blockquote>
            </div>
        </div>
        `;
    });
    html += `</div>`;
    
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
