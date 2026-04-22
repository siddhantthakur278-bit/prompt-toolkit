import path from 'path';
import fs from 'fs';
import { readData, writeData } from './utils.js';
import connectDB from './lib/db.js';
import Input from './models/Input.js';

const INPUTS_FILE = path.join(process.cwd(), 'data', 'inputs', 'history.json');

class InputManager {
    constructor() {
        const dir = path.dirname(INPUTS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async saveInput(content) {
        if (!content) return null;
        
        const id = 'in-' + Date.now();
        const data = { id, content, timestamp: new Date() };

        try {
            await connectDB();
            // Avoid duplicate inputs if they are identical
            const existing = await Input.findOne({ content });
            if (existing) return existing;
            
            const input = new Input(data);
            await input.save();
        } catch (e) {
            const inputs = readData(INPUTS_FILE);
            const exists = inputs.find(i => i.content === content);
            if (exists) return exists;
            
            inputs.push(data);
            writeData(INPUTS_FILE, inputs);
        }
        return data;
    }

    async listInputs() {
        try {
            await connectDB();
            return await Input.find({}).sort({ timestamp: -1 });
        } catch (e) {
            const inputs = readData(INPUTS_FILE);
            return inputs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }
}

const instance = new InputManager();
export default instance;