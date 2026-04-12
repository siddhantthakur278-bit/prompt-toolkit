class ScoringSystem {
    /**
     * Calculates the score based on criteria and a manual score.
     */
    calculateScore(output, criteria, manualScore = 3) {
        let keywordScore = 0;
        let lengthScore = 0;
        const text = output.toLowerCase();
        
        // 1. Keyword testing: "example", "applications", "definition"
        const targetKeywords = ["example", "applications", "definition"];
        const matches = targetKeywords.filter(kw => text.includes(kw));
        keywordScore = (matches.length / targetKeywords.length) * 5; 
        
        // 2. Length testing: short output -> low, long output -> high
        // Let's say < 150 chars is low, > 400 chars is high
        const len = output.length;
        if (len < 150) {
            lengthScore = 1.5;
        } else if (len < 300) {
            lengthScore = 3.5;
        } else {
            lengthScore = 5;
        }
        
        // 3. Total score calculation
        // Components: Manual(5 max) + Keyword(5 max) + Length(5 max) = 15 points
        const totalScore = manualScore + keywordScore + lengthScore;
        
        return {
            manualScore,
            keywordScore: parseFloat(keywordScore.toFixed(2)),
            lengthScore: parseFloat(lengthScore.toFixed(2)),
            totalScore: parseFloat(totalScore.toFixed(2)),
            keywordMatches: matches
        };
    }
    
    /**
     * Compares different prompt versions based on overall total score and returns the best.
     */
    compareVersions(results) {
        const versionsMap = {};
        
        for (const result of results) {
            if (!versionsMap[result.promptVersion]) {
                versionsMap[result.promptVersion] = { total: 0, count: 0 };
            }
            versionsMap[result.promptVersion].total += result.scores.totalScore;
            versionsMap[result.promptVersion].count += 1;
        }
        
        let bestVersion = null;
        let maxAvgScore = -1;
        
        for (const [version, data] of Object.entries(versionsMap)) {
            const average = data.total / data.count;
            if (average > maxAvgScore) {
                maxAvgScore = average;
                bestVersion = version;
            }
        }
        
        return { bestVersion, averageScore: maxAvgScore };
    }
}

module.exports = new ScoringSystem();
