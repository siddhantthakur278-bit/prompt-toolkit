class ScoringSystem {
    /**
     * Calculates the score based on criteria and a manual score.
     */
    calculateScore(output, criteria, manualScore = 3) {
        let keywordScore = 0;
        let lengthScore = 0;
        const text = output.toLowerCase();
        
        // 1. Keyword testing
        if (criteria.keywords && criteria.keywords.length > 0) {
            const matches = criteria.keywords.filter(kw => text.includes(kw.toLowerCase()));
            keywordScore = matches.length / criteria.keywords.length; 
        } else {
            keywordScore = 1; 
        }
        
        // 2. Length testing (0 or 1)
        const len = output.length;
        const min = criteria.min_length || 0;
        const max = criteria.max_length || Infinity;
        
        if (len >= min && len <= max) {
            lengthScore = 1;
        }
        
        // 3. Total score calculation
        // Components: Manual(5 max) + Keyword(5 max) + Length(5 max) = 15 points
        const computedKeywordScore = keywordScore * 5;
        const computedLengthScore = lengthScore * 5;
        const totalScore = manualScore + computedKeywordScore + computedLengthScore;
        
        return {
            manualScore,
            keywordScore: computedKeywordScore,
            lengthScore: computedLengthScore,
            totalScore: parseFloat(totalScore.toFixed(2))
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
