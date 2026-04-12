const fs = require('fs');
const path = require('path');

/**
 * Utility function to read JSON data from a file.
 * Creates the file and parent directories if they don't exist.
 */
function readData(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        // Fallback in case of malformed JSON
        return [];
    }
}

/**
 * Utility function to write JSON data to a file.
 * Creates parent directories if they don't exist.
 */
function writeData(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };
