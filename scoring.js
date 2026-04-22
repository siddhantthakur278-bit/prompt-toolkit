class Scoring {
    calculateScore(output, criteria, manualScore = 3) {
        let keywordScore = 0;
        if (criteria.keywords && criteria.keywords.length > 0) {
            const matches = criteria.keywords.filter(k => 
                output.toLowerCase().includes(k.toLowerCase())
            );
            keywordScore = (matches.length / criteria.keywords.length) * 5;
        }

        let lengthScore = 0;
        const len = output.length;
        if (len >= criteria.min_length && len <= criteria.max_length) {
            lengthScore = 5;
        } else if (len > 0) {
            lengthScore = 2;
        }

        return {
            keywordScore: parseFloat(keywordScore.toFixed(2)),
            lengthScore: lengthScore,
            manualScore: manualScore,
            totalScore: parseFloat((keywordScore + lengthScore + manualScore).toFixed(2))
        };
    }

    compareVersions(results) {
        const aggregated = results.reduce((acc, curr) => {
            if (!acc[curr.promptVersion]) {
                acc[curr.promptVersion] = { version: curr.promptVersion, total: 0, count: 0 };
            }
            acc[curr.promptVersion].total += curr.scores.totalScore;
            acc[curr.promptVersion].count += 1;
            return acc;
        }, {});

        const summaries = Object.values(aggregated).map(s => ({
            version: s.version,
            averageScore: s.total / s.count
        }));

        summaries.sort((a, b) => b.averageScore - a.averageScore);
        const best = summaries[0] || { version: 'v1', averageScore: 0 };
        return {
            version: best.version || 'v1',
            averageScore: best.averageScore
        };
    }
}

const instance = new Scoring();
export default instance;
