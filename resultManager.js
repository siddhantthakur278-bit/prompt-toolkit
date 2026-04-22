import path from 'path';
import { readData, writeData } from './utils.js';
import templateLibrary from './templateLibrary.js';
import connectDB from './lib/db.js';
import Result from './models/Result.js';

const RESULTS_FILE = path.join(process.cwd(), 'data', 'results', 'results_log.json');

class ResultManager {
    async saveResult(promptId, promptVersion, suiteId, input, output, scores) {
        const resultEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            promptId, promptVersion, suiteId, input, output, scores,
            timestamp: new Date().toISOString()
        };

        try {
            await connectDB();
            const result = new Result(resultEntry);
            await result.save();
        } catch (e) {
            const results = readData(RESULTS_FILE);
            results.push(resultEntry);
            writeData(RESULTS_FILE, results);
        }
        return resultEntry;
    }
    
    async getResultsByPrompt(promptId) {
        try {
            await connectDB();
            return await Result.find({ promptId });
        } catch (e) {
            const results = readData(RESULTS_FILE);
            return results.filter(r => r.promptId === promptId);
        }
    }
    
    async saveTemplate(promptObj, versionId, averageScore, bestResponse) {
        return await templateLibrary.saveTemplate(promptObj.id, versionId, averageScore, bestResponse);
    }
}

const instance = new ResultManager();
export default instance;
