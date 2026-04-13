# 🚀 Prompt Engineering Toolkit (Elite Core v3.5)

A professional, team-oriented platform for the "FourMinds" team to iterate, benchmark, and optimize AI prompts using the **Groq Hyper-speed Engine**.

## 💎 Elite Features
- **Neural Cluster Management**: Create and track multiple versions of instructions.
- **AI-Powered Classification**: Automatically categorizes prompts using Llama 3.3 70B.
- **Benchmark Pipeline**: Real-time side-by-side comparison of prompt versions.
- **Performance Matrix**: Native tracking of Latency (ms), Token Usage, and Cost.
- **Golden Library**: Persistent storage for your highest-scoring production prompts.

## 🛠️ How to Use (Understandable Flow)

### 1. Design Your Prompts
Go to the **Prompts Manager**. Create a new "Cluster" (e.g., *Customer Support Agent*). Write your initial instructions. Every time you edit and save, a new **Version** is created automatically.

### 2. Run Benchmarks
Go to **Execution Engine**. Select your Cluster and either test all versions or a specific one. Provide a real-world input (e.g., a customer question) and hit **Execute**.

### 3. Analyze Results
The system will run your prompts through **Groq** and score them on:
- **Keywords**: Presence of essential concepts.
- **Structure**: Alignment with target length/format.
- **Quality**: A comprehensive AI-driven assessment.

### 4. Golden Library
The highest-scoring version (the **Champion**) is recommended for production. You can view your history of winners in the **Template Library**.

## 🚀 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB (Persistent Storage)
- **Inference**: Groq API (Lama 3.3 70B & 3.1 8B)
- **Design**: Premium Glassmorphic Dark Core

## ⚡ Quick Start
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)
