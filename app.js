import { runOptimizationPipeline } from './lib/pipelineRunner.js';

// Reading dynamic parameters from Node's argv array.
const dynamicInput = process.argv[2];
const modelName = process.argv[3]; 
const targetPromptId = process.argv[4];
const targetVersionId = process.argv[5];

async function main() {
    await runOptimizationPipeline(dynamicInput, modelName, targetPromptId, targetVersionId);
}

main().catch(console.error);
