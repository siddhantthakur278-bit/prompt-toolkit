import path from 'path';
import { readData, writeData } from './utils.js';
import templateLibrary from './templateLibrary.js';

const RESULTS_FILE = path.join(process.cwd(), 'data', 'results', 'results_log.json');

class ResultManager {
    saveResult(promptId, promptVersion, suiteId, input, output, scores) {
        const results = readData(RESULTS_FILE);
        const resultEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            promptId, promptVersion, suiteId, input, output, scores,
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
    
    saveTemplate(promptObj, versionId) {
        return templateLibrary.saveTemplate(promptObj.id, versionId, 15); // Default high score for manual save
    }
}

const instance = new ResultManager();
export default instance;
