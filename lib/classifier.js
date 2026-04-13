import executionEngine from '../executionEngine';

export async function classifyPrompt(content) {
    const systemPrompt = `You are an AI Prompt Classifier. Categorize the given prompt into exactly one of these categories: Marketing, Coding, Creative Writing, Technical Documentation, General, Data Analysis. Respond with ONLY the category name.`;
    try {
        const category = await executionEngine.runPrompt(systemPrompt, content);
        return category.trim();
    } catch (e) {
        return "General";
    }
}
