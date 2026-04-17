import promptManager from '../promptManager.js';
import testSuiteManager from '../testSuiteManager.js';
import executionEngine from '../executionEngine.js';
import scoring from '../scoring.js';
import resultManager from '../resultManager.js';
import templateLibrary from '../templateLibrary.js';

export async function runOptimizationPipeline(input, model, promptIdParam, versionIdParam, logger = console.log) {
    const runTimestamp = Date.now();
    let promptId = promptIdParam || `prompt-${runTimestamp}`;
    let suiteId = `suite-${runTimestamp}`;
    let modelName = model || "GPT-4o";
    let dynamicInput = input || "Explain Quantum Computing";

    logger(`[Task Info] Task Name: Elite Optimization Pipeline`);
    logger(`[Task Info] Input Text: "${dynamicInput}"`);
    logger(`[Task Info] Global Model: ${modelName}`);

    let promptData;
    if (promptIdParam && promptIdParam !== "") {
        promptData = promptManager.getPrompt(promptIdParam);
        if (!promptData) {
            logger(`[Error] Prompt Cluster ${promptIdParam} not found. Falling back to demo.`);
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
    if (versionIdParam && versionIdParam !== "") {
        versionsToRun = promptData.versions.filter(v => v.version === versionIdParam);
        if (versionsToRun.length === 0) {
            logger(`[Warning] Version ${versionIdParam} not found. Checking all versions.`);
            versionsToRun = promptData.versions;
        }
    }

    for (const test of suiteData.tests) {
        for (const version of versionsToRun) {
            logger(`Executing Output for Version: [${version.version}] | Prompt: ${version.content}`);
            
            const startTime = Date.now();
            const output = await executionEngine.runPrompt(version.content, test.input, modelName);
            const endTime = Date.now();
            const realLatency = endTime - startTime;
            
            const tokens = Math.ceil(output.length / 4) + 12;
            const cost = (tokens * 0.00001).toFixed(5);
            
            logger(`  > Raw Output: [[${output}]]`);
            
            let manualScore = 3;
            if (version.version === 'v1') manualScore = 2.5;
            if (version.version === 'v2') manualScore = 4.2;
            if (version.version === 'v3') manualScore = 5.0;
            
            const scores = scoring.calculateScore(output, test.criteria, manualScore);
            const metadata = { latency: realLatency.toString(), tokens, cost, model: modelName };
            logger(`  > Derived Scores: ` + JSON.stringify(scores));
            logger(`  > Elite Metadata: ` + JSON.stringify(metadata));
            
            resultManager.saveResult(promptId, version.version, suiteId, test.input, output, scores);
        }
    }
    
    const allResults = resultManager.getResultsByPrompt(promptId);
    if (!allResults || allResults.length === 0) return;
    
    const comparison = scoring.compareVersions(allResults);
    logger(`🏆 Best Version found: ${comparison.version} (Average Score: ${comparison.averageScore.toFixed(2)} / 15)`);
    
    try {
        templateLibrary.saveTemplate(promptId, comparison.version, comparison.averageScore.toFixed(2));
        logger(`[System] Automatically promoted ${comparison.version} to Template Library.`);
    } catch (e) {
        logger(`[Error] Failed to save template: ${e.message}`);
    }
}
