const promptManager = require('./promptManager');
const testSuiteManager = require('./testSuiteManager');
const executionEngine = require('./executionEngine');
const scoring = require('./scoring');
const resultManager = require('./resultManager');

// Reading dynamic parameter from Node's argv array. Fallback if empty.
const dynamicInput = process.argv[2] || "Explain Quantum Computing";

async function main() {
    console.log("=========================================");
    console.log("   Prompt Engineering Toolkit Flow       ");
    console.log("=========================================\n");
    
    const runTimestamp = Date.now();
    const promptId = `prompt-${runTimestamp}`;
    const suiteId = `suite-${runTimestamp}`;
    
    console.log(`[Task Info] Task Name: Fully Dynamic Evaluation`);
    console.log(`[Task Info] Input Text: "${dynamicInput}"`);

    console.log("\n[1] Creating initial prompt (v1)...");
    promptManager.createPrompt(
        promptId, 
        "Dynamic Topic Analysis", 
        `Explain "${dynamicInput}" briefly`
    );
    
    console.log("[2] Adding new versions (v2, v3)...");
    promptManager.addVersion(
        promptId, 
        `Explain "${dynamicInput}" in detail with examples`
    );
    const promptData = promptManager.addVersion(
        promptId, 
        `Explain "${dynamicInput}" with key points and real-world applications`
    );
    
    console.log("\n[3] Creating test suite and adding criteria...");
    testSuiteManager.createSuite(suiteId, "Automated Prompt Evaluation");
    
    // Criteria is now mostly handled in scoring.js for keywords, but we pass constraints here
    const criteria = {
        min_length: 100,
        max_length: 800
    };
    testSuiteManager.addTest(suiteId, dynamicInput, criteria);
    
    const suiteData = testSuiteManager.getSuite(suiteId);
    
    console.log(`\n--- Running tests for all versions of prompt: ${promptData.title} ---\n`);
    
    for (const test of suiteData.tests) {
        for (const version of promptData.versions) {
            console.log(`Executing Output for Version: [${version.version}] | Prompt: ${version.content}`);
            
            const output = await executionEngine.runPrompt(version.content, test.input);
            console.log(`  > Raw Output: "${output}"`);
            
            // Manual score variance simulated based on version complexity
            let manualScore = 3.0; // base
            if (version.version === 'v1') manualScore = 2.5; 
            if (version.version === 'v2') manualScore = 4.0; 
            if (version.version === 'v3') manualScore = 5.0; 
            
            const scores = scoring.calculateScore(output, test.criteria, manualScore);
            console.log(`  > Derived Scores: ` + JSON.stringify(scores));
            
            resultManager.saveResult(promptId, version.version, suiteId, test.input, output, scores);
            console.log(`  ✓ Result saved.\n`);
        }
    }
    
    console.log("[7] Comparing prompt versions based on total score...");
    const allResults = resultManager.getResultsByPrompt(promptId);
    if (!allResults || allResults.length === 0) return;
    
    const comparison = scoring.compareVersions(allResults);
    
    console.log(`🏆 Best Version found: ${comparison.bestVersion} (Average Score: ${comparison.averageScore.toFixed(2)} / 15)`);
    
    console.log(`\n[8] Saving best version (${comparison.bestVersion}) to Template Library...`);
    resultManager.saveTemplate(promptData, comparison.bestVersion);
    console.log("✓ Template saved successfully.\n");
    console.log("=========================================");
}

main().catch(console.error);
