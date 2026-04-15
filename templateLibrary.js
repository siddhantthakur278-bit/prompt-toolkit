import fs from 'fs';
import path from 'path';
import { readData, writeData } from './utils.js';
import promptManager from './promptManager.js';
import { exportToN8N } from './lib/n8nClient.js';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'templates', 'library.json');

class TemplateLibrary {
    constructor() {
        if (!fs.existsSync(path.dirname(TEMPLATES_FILE))) {
            fs.mkdirSync(path.dirname(TEMPLATES_FILE), { recursive: true });
        }
    }

    saveTemplate(promptId, versionId, averageScore, bestResponse = "N/A") {
        const templates = readData(TEMPLATES_FILE);
        const promptData = promptManager.getPrompt(promptId);
        if (!promptData) throw new Error("Prompt not found");

        const versionData = promptData.versions.find(v => v.version === versionId);
        if (!versionData) throw new Error("Version not found");

        const templateEntry = {
            id: promptId,
            title: promptData.title,
            versionId,
            content: versionData.content,
            bestResponse, // Captured winning AI output
            averageScore,
            savedAt: new Date().toISOString()
        };

        const existingIdx = templates.findIndex(t => t.id === promptId);
        if (existingIdx !== -1) {
            templates[existingIdx] = templateEntry;
        } else {
            templates.push(templateEntry);
        }

        writeData(TEMPLATES_FILE, templates);
        
        // Asynchronous n8n export (non-blocking)
        exportToN8N(templateEntry).catch(e => console.error("N8N Background Export Failed:", e));

        return templateEntry;
    }

    listTemplates() {
        return readData(TEMPLATES_FILE);
    }
}

const instance = new TemplateLibrary();
export default instance;
