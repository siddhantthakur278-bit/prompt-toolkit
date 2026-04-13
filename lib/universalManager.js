import connectDB from '@/lib/db';
import Prompt from '@/models/Prompt';
const promptJSONManager = require('../../../../promptManager');

export async function getPrompts() {
    try {
        await connectDB();
        // Check if connection is actually open
        if (require('mongoose').connection.readyState === 1) {
            const prompts = await Prompt.find({}).sort({ updatedAt: -1 });
            return prompts.map(p => ({
                id: p.id,
                title: p.title,
                category: p.category,
                versionCount: p.versions.length
            }));
        }
    } catch (e) {
        console.warn("MongoDB not responsive, falling back to JSON storage.");
    }
    return promptJSONManager.listPrompts();
}

export async function createPrompt(data) {
    try {
        await connectDB();
        if (require('mongoose').connection.readyState === 1) {
            const newPrompt = new Prompt(data);
            await newPrompt.save();
            return newPrompt;
        }
    } catch (e) {
        console.warn("MongoDB error on create, falling back to JSON.");
    }
    return promptJSONManager.createPrompt(data.id, data.title, data.versions[0].content);
}
