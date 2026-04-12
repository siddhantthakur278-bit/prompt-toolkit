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
    
    console.log(`[Task Info] Task Name: Dynamic Content Generation`);
    console.log(`[Task Info] Input Text: "${dynamicInput}"`);

    console.log("\n[1] Creating initial prompt (v1)...");
    promptManager.createPrompt(
        promptId, 
        "Dynamic Topic Context", 
        "Answer basically"
    );
    
    console.log("[2] Adding new versions (v2, v3)...");
    promptManager.addVersion(
        promptId, 
        "Answer in detail"
    );
    const promptData = promptManager.addVersion(
        promptId, 
        "Answer in a structured format with keywords"
    );
    
    console.log("\n[3] Creating test suite and adding criteria...");
    testSuiteManager.createSuite(suiteId, "Dynamic Validation Suite");
    
    const criteria = {
        keywords: ['important', 'details', 'structure'],
        min_length: 50,
        max_length: 600
    };
    testSuiteManager.addTest(suiteId, dynamicInput, criteria);
    
    const suiteData = testSuiteManager.getSuite(suiteId);
    
    console.log(`\n--- Running tests for all versions of prompt: ${promptData.title} ---\n`);
    
    for (const test of suiteData.tests) {
        for (const version of promptData.versions) {
            console.log(`Executing Output for Version: [${version.version}] | Prompt: ${version.content}`);
            
            const output = await executionEngine.runPrompt(version.content, test.input);
            console.log(`  > Raw Output: "${output}"`);
            
            // Manual score variance mimicking real test results evaluating formats
            let manualScore = 3;
            if (version.version === 'v1') manualScore = 2; // too brief
            if (version.version === 'v2') manualScore = 3.5; // informative but blocky
            if (version.version === 'v3') manualScore = 5; // excellent semantic structuring
            
            const scores = scoring.calculateScore(output, test.criteria, manualScore);
            console.log(`  > Derived Scores: ` + JSON.stringify(scores));
            
            resultManager.saveResult(promptId, version.version, suiteId, test.input, output, scores);
            console.log(`  ✓ Result saved to logs.\n`);
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
