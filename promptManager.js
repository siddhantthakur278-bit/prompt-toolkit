import path from "path";
import fs from "fs";
import { readData, writeData } from "./utils.js";
import connectDB from "./lib/db.js";
import Prompt from "./models/Prompt.js";

const PROMPTS_DIR = path.join(process.cwd(), "data", "prompts");

class PromptManager {
  constructor() {
    if (!fs.existsSync(PROMPTS_DIR)) {
      fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    }
  }

  async createPrompt(id, title, initialContent) {
    console.log(`[PromptManager] Creating prompt: ${title} (${id})`);
    const data = {
      id,
      title,
      versions: [
        {
          version: "v1",
          content: initialContent,
          createdAt: new Date(),
        },
      ],
    };

    try {
      await connectDB();
      const prompt = new Prompt(data);
      await prompt.save();
      console.log(`[PromptManager] Saved to DB: ${title}`);
    } catch (e) {
      console.error(
        `[PromptManager] DB Save Failed, falling back to JSON: ${e.message}`,
      );
      const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
      writeData(promptFile, data);
    }
    return data;
  }

  async addVersion(id, content) {
    let data = await this.getPrompt(id);
    if (!data) throw new Error("Prompt not found");

    const newVersion = `v${data.versions.length + 1}`;
    data.versions.push({
      version: newVersion,
      content,
      createdAt: new Date(),
    });

    try {
      await connectDB();
      await Prompt.findOneAndUpdate({ id }, { versions: data.versions });
    } catch (e) {
      const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
      writeData(promptFile, data);
    }
    return data;
  }

  async getPrompt(id) {
    try {
      await connectDB();
      const prompt = await Prompt.findOne({ id });
      if (prompt) return prompt;
    } catch (e) {}

    const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
    if (!fs.existsSync(promptFile)) return null;
    return readData(promptFile);
  }

  async listPrompts() {
    try {
      await connectDB();
      const prompts = await Prompt.find({}).sort({ updatedAt: -1 }).lean();
      return prompts.map((p) => ({
        id: p.id,
        title: p.title,
        versionCount: (p.versions || []).length,
      }));
    } catch (e) {
      if (!fs.existsSync(PROMPTS_DIR)) return [];
      const files = fs
        .readdirSync(PROMPTS_DIR)
        .filter((f) => f.endsWith(".json") && f !== "prompts.json");
      const list = files.map((f) => {
        const filePath = path.join(PROMPTS_DIR, f);
        const data = readData(filePath);
        const stats = fs.statSync(filePath);
        return {
          id: data.id,
          title: data.title,
          versionCount: (data.versions || []).length,
          mtime: stats.mtime,
        };
      });
      return list.sort((a, b) => b.mtime - a.mtime);
    }
  }

  async rollbackVersion(id, targetVersion) {
    let data = await this.getPrompt(id);
    if (!data) return null;

    const versionIndex = data.versions.findIndex(
      (v) => v.version === targetVersion,
    );
    if (versionIndex === -1) return null;

    data.versions = data.versions.slice(0, versionIndex + 1);

    try {
      await connectDB();
      await Prompt.findOneAndUpdate({ id }, { versions: data.versions });
    } catch (e) {
      const promptFile = path.join(PROMPTS_DIR, `${id}.json`);
      writeData(promptFile, data);
    }
    return data;
  }
}

const instance = new PromptManager();
export default instance;
