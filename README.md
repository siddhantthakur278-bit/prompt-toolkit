# 🛰️ Prompt Engineering Toolkit

A simple but powerful tool for managing and optimizing your AI prompts. This toolkit helps you move from trial-and-error to a systematic way of developing prompts.

---

## ✨ Features

### 1. Prompt Manager
*   **Version Control**: Save different versions of your prompts and track how they change.
*   **AI Optimizer**: Use AI to automatically create better versions of your initial prompt.

### 2. Testing Laboratory
*   **Compare Outputs**: Run multiple prompt versions side-by-side with the same input.
*   **Scoring**: Automatically score responses based on keywords, length, and your own quality grades.
*   **Metrics**: Track how long each prompt takes to run and estimated costs.

### 3. Template Library
*   **Save the Best**: Keep your top-performing prompts in a central library.
*   **Ready for Production**: Copy useable code snippets (Python/Node.js) to plug your prompts directly into your own applications.

### 4. Workflow Pulse
*   **Automation**: Visualize your prompt development process and see a list of recent activities.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js (React)
*   **Backend**: Node.js / Express
*   **Database**: MongoDB (with local JSON file fallback)
*   **AI Engine**: Groq API (using Llama 3 models)

---

## 🚀 How to Get Started

### 1. Prerequisites
You will need a **Groq API Key**. You can get one for free at [console.groq.com](https://console.groq.com).

### 2. Setup
1.  **Clone the project** to your computer.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment**: Create a `.env` file in the root folder and add your key:
    ```env
    GROQ_API_KEY=your_api_key_here
    MONGODB_URI=mongodb://localhost:27017/prompttoolkit (Optional)
    ```

### 3. Run the App
Start the development server:
```bash
npm run dev
```
Open your browser and go to [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

*   `/app`: The Next.js website and API routes.
*   `/data`: Local storage for prompts and results (used if MongoDB is not connected).
*   `/lib`: Core logic for AI optimization and database connections.
*   `app.js`: A command-line tool to run prompt tests.
*   `server.js`: An alternative Express-based server.

---

*This project was created to make prompt engineering more structured and efficient.*
