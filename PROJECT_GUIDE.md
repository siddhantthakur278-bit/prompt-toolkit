# 🚀 Prompt Engineering Toolkit: Project Guide

The **Prompt Engineering Toolkit (Elite Edition)** is a structured platform designed for teams and individual engineers to manage the entire lifecycle of AI prompt development. It transitions prompt engineering from a trial-and-error process into a systematic, version-controlled discipline.

---

## 🏗️ Core Architecture

The system is built on a modular "Node + JSON" architecture, ensuring data portability and simplicity for internal experimentation.

### 1. Prompt Manager & Version Control
- **Logic**: Every prompt is treated as a "Cluster."
- **Versioning**: Each edit generates a new version (v1, v2, v3...), preserving the full history of iterations.
- **Rollback**: A critical safety feature that allows the system to revert to a specific historical state, pruning subsequent versions to maintain a clean linear history.

### 2. Test Suite Manager
- **Logic**: Allows users to group specific inputs and evaluation rules.
- **Criteria**: Defines success parameters like "Keywords Presence," "Length Constraints," and "Manual Quality Thresholds."

### 3. Execution Engine (Nexus)
- **Logic**: A bridge that executes prompt variants against dynamic inputs.
- **Metrics**: Captures real-time metadata including **Latency**, **Estimated Tokens**, and **Cost**.
- **Simulated Intelligence**: Uses a keyword-based logic engine to simulate different AI response patterns based on the chosen model (GPT-4o, Claude, etc.).

### 4. Comparison & Template Library
- **Scoring**: Uses a multi-dimensional scoring algorithm (Total 15 points) to rank variants.
- **Templates**: Allows "Promoting" the best-performing version of a prompt to a global library for production reuse.

---

## 🔄 Step-by-Step Workflow

Follow these steps to optimize your prompts using the toolkit:

### **Step 1: Initialize a Prompt**
Navigate to the **Prompts Manager** and create a new prompt. This creates `v1` and initializes a dedicated JSON file in `/data/prompts/`.

### **Step 2: Iterate & version**
Edit your prompt using the editor. Every time you save, the system creates a new version (`v2`, `v3`...). You can view the history at any time to see how the prompt has evolved.

### **Step 3: Define Test Suites**
Switch to the **Test Suites** tab. Create a suite that reflects your target use cases (e.g., "Summarization Benchmarks"). Add specific inputs and success criteria.

### **Step 4: Execute Optimization Pipeline**
Go to the **Execution Engine**. 
1. Select your **Prompt**.
2. Select the **Version** you want to test.
3. Choose the **Intelligence Model** (simulates different model behaviors).
4. Run the pipeline.

### **Step 5: Evaluate & Score**
The system will generate an **Evaluation Report**. It calculates scores based on:
- **Keyword Match**: Did the response include required terms?
- **Length Compliance**: Is the response within the target character count?
- **Manual Grade**: Your own assessment of quality.

### **Step 6: Promote to Template**
Identify the version with the highest **Total Efficiency**. Click **"Save to Lib"** in the version history. The prompt text is now stored in the **Template Library**, ready for integration into your actual application.

---

## 📂 Data Storage Structure

The system uses a flat-file JSON structure for maximum transparency:

- `/data/prompts/`: One JSON file per prompt containing all version history.
- `/data/test_suites/`: Metadata and test cases for benchmarks.
- `/data/templates/`: Highly optimized, finalized prompt versions.
- `/data/results/`: Historical execution logs and metrics.

---

*This project is optimized for **Team FourMinds** internal experimentation and prompt systematication.*
