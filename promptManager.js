import path from 'path';
import fs from 'fs';
import { readData, writeData } from './utils.js';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

class PromptManager {
    constructor() {
        if (!fs.existsSync(PROMPTS_DIR)) {
            fs.mkdirSync(PROMPTS_DIR, { recursive: true });
        }
    }

    createPrompt(id, title, initialContent) {
        const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
        const data = {
            id,
            title,
            versions: [{
                version: 'v1',
                content: initialContent,
                createdAt: new Date()
            }]
        };
        writeData(promptFile, data);
        return data;
    }

    addVersion(id, content) {
        const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
        const data = this.getPrompt(id);
        if (!data) throw new Error("Prompt not found");

        const newVersion = `v${data.versions.length + 1}`;
        data.versions.push({
            version: newVersion,
            content,
            createdAt: new Date()
        });
        writeData(promptFile, data);
        return data;
    }

    getPrompt(id) {
        const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
        if (!fs.existsSync(promptFile)) return null;
        return readData(promptFile);
    }

    listPrompts() {
        if (!fs.existsSync(PROMPTS_DIR)) return [];
        const files = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.json'));
        return files.map(f => {
            const data = readData(path.join(PROMPTS_DIR, f));
            return {
                id: data.id,
                title: data.title,
                versionCount: data.versions.length
            };
        });
    }

    rollbackVersion(id, targetVersion) {
        const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
        const data = this.getPrompt(id);
        if (!data) return null;

        const versionIndex = data.versions.findIndex(v => v.version === targetVersion);
        if (versionIndex === -1) return null;

        data.versions = data.versions.slice(0, versionIndex + 1);
        writeData(promptFile, data);
        return data;
    }
}

const instance = new PromptManager();
export default instance;
