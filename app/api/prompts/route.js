import { NextResponse } from "next/server";
import promptManager from "@/promptManager";
import { classifyPrompt } from "@/lib/classifier";
import { generateImprovedVariants } from "@/lib/aiOptimizer";

export async function GET() {
  try {
    const list = await promptManager.listPrompts();
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content, autoOptimize } = await request.json();
    const category = await classifyPrompt(content);
    const id = "p-" + Date.now();

    await promptManager.createPrompt(id, title, content);

    if (autoOptimize) {
      try {
        const variants = await generateImprovedVariants(content);
        for (const v of variants) {
          await promptManager.addVersion(id, v);
        }
      } catch (optErr) {
        console.error(
          "Auto-Optimization failed but prompt was created:",
          optErr,
        );
      }
    }

    const updatedData = await promptManager.getPrompt(id);
    if (!updatedData) {
      throw new Error("Failed to retrieve created prompt");
    }
    // Ensure we return a plain object
    const responseData = updatedData.toObject
      ? updatedData.toObject()
      : updatedData;

    return NextResponse.json({ ...responseData, category });
  } catch (e) {
    console.error("API POST Prompts Error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
