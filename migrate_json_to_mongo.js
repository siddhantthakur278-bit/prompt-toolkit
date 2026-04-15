import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Models (Re-defined for the script since it's a standalone node process)
const PromptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  versions: [{
    version: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Prompt = mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);

const MONGODB_URI = 'mongodb://localhost:27017/prompttoolkit';
const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

async function migrate() {
    console.log("🚀 Starting Neural Data Migration (JSON -> MongoDB)...");
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB.");

        if (!fs.existsSync(PROMPTS_DIR)) {
            console.log("❌ No legacy prompt files found in data/prompts.");
            return;
        }

        const files = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.json'));
        console.log(`📂 Found ${files.length} legacy clusters.`);

        for (const file of files) {
            try {
                const filePath = path.join(PROMPTS_DIR, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);

                // Handle both single prompt files and the bulk prompts.json
                const clusters = Array.isArray(data) ? data : [data];

                for (const cluster of clusters) {
                    if (!cluster.id) continue;
                    
                    const existing = await Prompt.findOne({ id: cluster.id });
                    if (!existing) {
                        console.log(`   ➡️  Migrating: ${cluster.title || cluster.id}`);
                        await Prompt.create({
                            id: cluster.id,
                            title: cluster.title || "Untitled Legacy",
                            category: "Legacy Migrated",
                            versions: cluster.versions || []
                        });
                    } else {
                        console.log(`   ⏭️  Skipping (exists): ${cluster.id}`);
                    }
                }
            } catch (err) {
                console.error(`   ❌ Failed to migrate ${file}: ${err.message}`);
            }
        }

        console.log("🎉 Migration complete! Your clusters are now in the Cerebral Database.");
    } catch (e) {
        console.error("❌ Critical Migration Failure:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
