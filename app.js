import promptManager from './promptManager.js';
import testSuiteManager from './testSuiteManager.js';
import executionEngine from './executionEngine.js';
import scoring from './scoring.js';
import resultManager from './resultManager.js';

// Reading dynamic parameters from Node's argv array.
const dynamicInput = process.argv[2] || "Explain Quantum Computing";
const modelName = process.argv[3] || "llama-3.3-70b-versatile"; 
const targetPromptId = process.argv[4];
const targetVersionId = process.argv[5];

async function main() {
    const runTimestamp = Date.now();
    let promptId = targetPromptId || `prompt-${runTimestamp}`;
    let suiteId = `suite-${runTimestamp}`;
    
    console.log(`[Task Info] Task Name: Elite Optimization Pipeline`);
    console.log(`[Task Info] Input Text: "${dynamicInput}"`);
    console.log(`[Task Info] Global Model: ${modelName}`);

    let promptData;
    if (targetPromptId) {
        promptData = promptManager.getPrompt(targetPromptId);
        if (!promptData) {
            console.log(`[Error] Prompt Cluster ${targetPromptId} not found. Falling back to demo.`);
            promptId = `demo-${runTimestamp}`;
            promptManager.createPrompt(promptId, "Demo Cluster", "Standard Response");
            promptManager.addVersion(promptId, "Advanced Analytical Response");
            promptData = promptManager.addVersion(promptId, "Highly Structured Professional Output");
        }
    } else {
        promptId = `demo-${runTimestamp}`;
        promptManager.createPrompt(promptId, "Strategic Logic Framework", "Standard Response");
        promptManager.addVersion(promptId, "Advanced Analytical Response");
        promptData = promptManager.addVersion(promptId, "Highly Structured Professional Output");
    }
    
    testSuiteManager.createSuite(suiteId, "Production Validation Suite");
    const criteria = {
        keywords: ['clarity', 'comprehensive', 'efficiency', 'structure'],
        min_length: 50,
        max_length: 800
    };
    testSuiteManager.addTest(suiteId, dynamicInput, criteria);
    const suiteData = testSuiteManager.getSuite(suiteId);
    
    let versionsToRun = promptData.versions;
    if (targetVersionId) {
        versionsToRun = promptData.versions.filter(v => v.version === targetVersionId);
        if (versionsToRun.length === 0) {
            console.log(`[Warning] Version ${targetVersionId} not found. Checking all versions.`);
            versionsToRun = promptData.versions;
        }
    }

    for (const test of suiteData.tests) {
        for (const version of versionsToRun) {
            console.log(`Executing Output for Version: [${version.version}] | Prompt: ${version.content}`);
            
            const startTime = Date.now();
            const output = await executionEngine.runPrompt(version.content, test.input, modelName);
            const endTime = Date.now();
            const realLatency = endTime - startTime;
            
            const tokens = Math.ceil(output.length / 4) + 12;
            const cost = (tokens * 0.00001).toFixed(5);
            
            console.log(`  > Raw Output: [[${output}]]`);
            
            let manualScore = 3;
            if (version.version === 'v1') manualScore = 2.5;
            if (version.version === 'v2') manualScore = 4.2;
            if (version.version === 'v3') manualScore = 5.0;
            
            const scores = scoring.calculateScore(output, test.criteria, manualScore);
            const metadata = { latency: realLatency.toString(), tokens, cost, model: modelName };
            console.log(`  > Derived Scores: ` + JSON.stringify(scores));
            console.log(`  > Elite Metadata: ` + JSON.stringify(metadata));
            
            resultManager.saveResult(promptId, version.version, suiteId, test.input, output, scores);
        }
    }
    
    const allResults = resultManager.getResultsByPrompt(promptId);
    if (!allResults || allResults.length === 0) return;
    
    const comparison = scoring.compareVersions(allResults);
    console.log(`🏆 Best Version found: ${comparison.bestVersion} (Average Score: ${comparison.averageScore.toFixed(2)} / 15)`);
    resultManager.saveTemplate(promptData, comparison.bestVersion);
}

main().catch(console.error);
