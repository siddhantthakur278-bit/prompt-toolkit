const path = require('path');
const { readData, writeData } = require('./utils');

const SUITES_FILE = path.join(__dirname, 'data', 'test_suites', 'suites.json');

class TestSuiteManager {
    /**
     * Creates a new test suite where test cases and inputs will reside.
     * Prevents duplication on reruns by resetting if it exists.
     */
    createSuite(id, title) {
         const suites = readData(SUITES_FILE);
         
         const existingIndex = suites.findIndex(s => s.id === id);
         if (existingIndex !== -1) {
             suites.splice(existingIndex, 1);
         }
         
         const suite = { id, title, tests: [] };
         
         suites.push(suite);
         writeData(SUITES_FILE, suites);
         return suite;
    }

    /**
     * Adds a test (input and evaluation criteria) to a given suite.
     */
    addTest(suiteId, input, criteria) {
        const suites = readData(SUITES_FILE);
        const suite = suites.find(s => s.id === suiteId);
        
        if (!suite) {
            throw new Error(`Test suite with id ${suiteId} not found`);
        }
        
        suite.tests.push({ input, criteria });
        
        writeData(SUITES_FILE, suites);
        return suite;
    }

    getSuite(id) {
        const suites = readData(SUITES_FILE);
        return suites.find(s => s.id === id);
    }
}

module.exports = new TestSuiteManager();
