const path = require('path');
const { readData, writeData } = require('./utils');

const PROMPTS_FILE = path.join(__dirname, 'data', 'prompts', 'prompts.json');

class PromptManager {
    /**
     * Creates a new prompt with a title and initial version (v1).
     * If a prompt with the ID already exists, it resets it to prevent duplicate accumulation.
     */
    createPrompt(id, title, content) {
        const prompts = readData(PROMPTS_FILE);
        
        // Remove existing prompt to ensure clean runs
        const existingIndex = prompts.findIndex(p => p.id === id);
        if (existingIndex !== -1) {
            prompts.splice(existingIndex, 1);
        }
        
        const newPrompt = {
            id,
            title,
            versions: [
                {
                    version: 'v1',
                    content: content,
                    createdAt: new Date().toISOString()
                }
            ]
        };
        
        prompts.push(newPrompt);
        writeData(PROMPTS_FILE, prompts);
        
        return newPrompt;
    }

    /**
     * Adds a new version to an existing prompt.
     */
    addVersion(id, content) {
        const prompts = readData(PROMPTS_FILE);
        const promptIndex = prompts.findIndex(p => p.id === id);
        
        if (promptIndex === -1) {
            throw new Error(`Prompt with id ${id} not found`);
        }
        
        const currentVersionsCount = prompts[promptIndex].versions.length;
        const nextVersion = `v${currentVersionsCount + 1}`;
        
        prompts[promptIndex].versions.push({
            version: nextVersion,
            content: content,
            createdAt: new Date().toISOString()
        });
        
        writeData(PROMPTS_FILE, prompts);
        return prompts[promptIndex];
    }
    
    getPrompt(id) {
        const prompts = readData(PROMPTS_FILE);
        return prompts.find(p => p.id === id);
    }
}

module.exports = new PromptManager();
