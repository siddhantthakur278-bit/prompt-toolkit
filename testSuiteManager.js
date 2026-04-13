import path from 'path';
import fs from 'fs';
import { readData, writeData } from './utils.js';

const SUITES_DIR = path.join(process.cwd(), 'data', 'test_suites');

class TestSuiteManager {
    constructor() {
        if (!fs.existsSync(SUITES_DIR)) {
            fs.mkdirSync(SUITES_DIR, { recursive: true });
        }
    }

    createSuite(id, title) {
        const suiteFile = path.join(SUITES_DIR, `${id}.json`);
        const data = { id, title, tests: [] };
        writeData(suiteFile, data);
        return data;
    }

    addTest(id, input, criteria) {
        const suiteFile = path.join(SUITES_DIR, `${id}.json`);
        if (!fs.existsSync(suiteFile)) return null;
        const data = readData(suiteFile);
        data.tests.push({ input, criteria });
        writeData(suiteFile, data);
        return data;
    }

    getSuite(id) {
        const suiteFile = path.join(SUITES_DIR, `${id}.json`);
        if (!fs.existsSync(suiteFile)) return null;
        return readData(suiteFile);
    }

    listSuites() {
        if (!fs.existsSync(SUITES_DIR)) return [];
        const files = fs.readdirSync(SUITES_DIR).filter(f => f.endsWith('.json'));
        return files.map(f => {
            const data = readData(path.join(SUITES_DIR, f));
            return { id: data.id, title: data.title, testCount: data.tests.length };
        });
    }
}

const instance = new TestSuiteManager();
export default instance;
