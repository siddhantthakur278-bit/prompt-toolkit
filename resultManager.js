const path = require('path');
const { readData, writeData } = require('./utils');

const RESULTS_FILE = path.join(__dirname, 'data', 'results', 'results_log.json');
const TEMPLATES_FILE = path.join(__dirname, 'data', 'templates', 'templates.json');

class ResultManager {
    saveResult(promptId, promptVersion, suiteId, input, output, scores) {
        const results = readData(RESULTS_FILE);
        
        const resultEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            promptId,
            promptVersion,
            suiteId,
            input,
            output,
            scores,
            timestamp: new Date().toISOString()
        };
        
        results.push(resultEntry);
        writeData(RESULTS_FILE, results);
        
        return resultEntry;
    }
    
    getResultsByPrompt(promptId) {
        const results = readData(RESULTS_FILE);
        return results.filter(r => r.promptId === promptId);
    }
    
    /**
     * Save the best performing prompt into the templates library to lock it in.
     */
    saveTemplate(promptObj, versionId) {
        const templates = readData(TEMPLATES_FILE);
        const versionData = promptObj.versions.find(v => v.version === versionId);
        
        if (!versionData) {
            throw new Error(`Version ${versionId} not found in prompt data`);
        }
        
        const templateEntry = {
            id: promptObj.id,
            title: promptObj.title,
            bestVersion: versionId,
            content: versionData.content,
            savedAt: new Date().toISOString()
        };
        
        // Remove existing template for this prompt if it exists, to update it safely
        const existingIndex = templates.findIndex(t => t.id === promptObj.id);
        if (existingIndex !== -1) {
            templates[existingIndex] = templateEntry;
        } else {
            templates.push(templateEntry);
        }
        
        writeData(TEMPLATES_FILE, templates);
        return templateEntry;
    }
}

module.exports = new ResultManager();
