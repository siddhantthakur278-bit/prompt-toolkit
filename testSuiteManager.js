import path from 'path';
import fs from 'fs';
import { readData, writeData } from './utils.js';
import connectDB from './lib/db.js';
import TestSuite from './models/TestSuite.js';

const SUITES_DIR = path.join(process.cwd(), 'data', 'test_suites');

class TestSuiteManager {
    constructor() {
        if (!fs.existsSync(SUITES_DIR)) {
            fs.mkdirSync(SUITES_DIR, { recursive: true });
        }
    }

    async createSuite(id, title) {
        const data = { id, title, tests: [] };
        try {
            await connectDB();
            const suite = new TestSuite(data);
            await suite.save();
        } catch (e) {
            const suiteFile = path.join(SUITES_DIR, `${id}.json`);
            writeData(suiteFile, data);
        }
        return data;
    }

    async addTest(id, input, criteria) {
        let data = await this.getSuite(id);
        if (!data) return null;
        
        data.tests.push({ input, criteria });
        
        try {
            await connectDB();
            await TestSuite.findOneAndUpdate({ id }, { tests: data.tests });
        } catch (e) {
            const suiteFile = path.join(SUITES_DIR, `${id}.json`);
            writeData(suiteFile, data);
        }
        return data;
    }

    async getSuite(id) {
        try {
            await connectDB();
            const suite = await TestSuite.findOne({ id });
            if (suite) return suite;
        } catch (e) {}

        const suiteFile = path.join(SUITES_DIR, `${id}.json`);
        if (!fs.existsSync(suiteFile)) return null;
        return readData(suiteFile);
    }

    async listSuites() {
        try {
            await connectDB();
            const suites = await TestSuite.find({});
            return suites.map(s => ({ 
                id: s.id, 
                title: s.title, 
                testCount: s.tests.length 
            }));
        } catch (e) {
            if (!fs.existsSync(SUITES_DIR)) return [];
            const files = fs.readdirSync(SUITES_DIR).filter(f => f.endsWith('.json'));
            return files.map(f => {
                const data = readData(path.join(SUITES_DIR, f));
                return { id: data.id, title: data.title, testCount: (data.tests || []).length };
            });
        }
    }
}

const instance = new TestSuiteManager();
export default instance;
