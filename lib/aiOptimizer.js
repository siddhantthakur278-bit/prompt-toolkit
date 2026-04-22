import executionEngine from '../executionEngine.js';

export async function generateImprovedVariants(initialPrompt) {
    const systemPrompt = `You are a Prompt Engineering Expert. Given a user's initial prompt, generate TWO distinct, improved, and highly structured versions of it. 
    Version 1: Focus on Chain-of-Thought reasoning.
    Version 2: Focus on professional, concise framing.
    
    Return your response as a JSON object with a key "variants" containing an array of two strings. 
    Example: { "variants": ["...", "..."] }`;

    try {
        const responseText = await executionEngine.runPrompt(systemPrompt, `Initial Prompt: ${initialPrompt}`);
        
        // Clean the response text in case the model added markdown blocks
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const json = JSON.parse(cleanText);
        const variants = json.variants || (Array.isArray(json) ? json : []);
        
        if (variants.length > 0) {
            return variants.slice(0, 2);
        }
        return [];
    } catch (e) {
        console.error("AI Variant Gen Error:", e);
        return [];
    }
}
