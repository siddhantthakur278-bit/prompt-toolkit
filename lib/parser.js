export function parseStdout(stdout) {
    const executions = [];
    const parts = stdout.split('Executing Output for Version:');
    
    const taskNameMatch = stdout.match(/\[Task Info\] Task Name: (.*)/);
    const taskName = taskNameMatch ? taskNameMatch[1].trim() : 'Elite Pipeline';
    
    const textMatch = stdout.match(/\[Task Info\] Input Text: "([\s\S]*?)"/);
    const inputText = textMatch ? textMatch[1].trim() : 'No input text';

    const globalModelMatch = stdout.match(/\[Task Info\] Global Model: (.*)/);
    const globalModel = globalModelMatch ? globalModelMatch[1].trim() : 'Unknown Model';

    for (let i = 1; i < parts.length; i++) {
        const block = parts[i];
        const verMatch = block.match(/\[(v\d+)\]/);
        const version = verMatch ? verMatch[1] : 'v?';
        const promptMatch = block.match(/\| Prompt: (.*)/);
        const promptContent = promptMatch ? promptMatch[1].trim() : 'Missing prompt';
        
        const outMatch = block.match(/> Raw Output: \[\[([\s\S]*?)\]\]/);
        const outputText = outMatch ? outMatch[1].trim() : 'No output captured';
        
        let scores = { manualScore: 0, keywordScore: 0, lengthScore: 0, totalScore: 0 };
        const scoresMatch = block.match(/> Derived Scores:\s*(\{.*?\})/);
        if (scoresMatch) {
            try { scores = JSON.parse(scoresMatch[1]); } catch(e) { }
        }

        let meta = { latency: '0', tokens: '0', cost: '0.00', model: globalModel };
        const metaMatch = block.match(/> Elite Metadata:\s*(\{.*?\})/);
        if (metaMatch) {
            try { meta = JSON.parse(metaMatch[1]); } catch(e) {}
        }

        executions.push({ version, promptContent, outputText, scores, meta });
    }
    
    const bestMatch = stdout.match(/🏆 Best Version found:\s*(v\d+)\s*\(Average Score:\s*([\d.]+)/);
    const bestVer = bestMatch ? bestMatch[1] : null;
    
    return { taskName, inputText, globalModel, executions, bestVer };
}
