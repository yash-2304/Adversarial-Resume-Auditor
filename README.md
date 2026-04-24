# Adversarial Resume Auditor

An AI-powered system that analyzes resumes against job descriptions, identifies where automated hiring systems fail, and provides actionable strategies to improve ATS outcomes.

---

## 🚀 Overview

Most resume tools tell you what’s missing.

This tool goes further.

It simulates multiple AI screening systems (like ATS and LLM-based evaluators), highlights where they misinterpret your resume, and shows you exactly how to fix it.

---

## 💡 Key Idea

Hiring today is heavily influenced by automated systems.

This project answers:

- Where will AI misjudge you?
- Why does that happen?
- How can you fix it?
- What impact will the fix have?

---

## ✨ Features

- **Dual AI Evaluation**
  - Compares GPT-style analysis vs ATS-style scoring

- **AI Blind Spot Detection**
  - Identifies areas where your resume may be undervalued

- **Disagreement Insights**
  - Highlights conflicting decisions between AI systems

- **Adversarial Insights Engine**
  - Breaks down each issue into:
    - Risk
    - AI Behavior
    - Fix to Beat AI
    - Outcome

- **Human Context Addendum**
  - Generates explanation to override AI misinterpretation

- **PDF Resume Upload**
  - Extracts and analyzes resume content directly

---

## 🧠 How It Works

1. Upload or paste your resume
2. Paste job description
3. System runs:
   - GPT-style evaluation
   - ATS-style evaluation
4. Compares results
5. Generates:
   - Score comparison
   - Blind spots
   - Adversarial strategies

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **AI:** OpenAI API
- **PDF Parsing:** pdf.js

---

## 📊 Output Example

Each insight is structured as:
Risk:
Freelance experience undervalued

AI Behavior:
ATS prioritizes structured job titles

Fix to Beat AI:
Rename role to “Software Engineer (Contract)”

Outcome:
Improves keyword match and avoids auto-rejection

---

## ⚠️ Why This Project is Different

Most tools:
- optimize resumes

This tool:
- exposes how AI systems behave
- teaches users how to work around them

---

## 📦 Setup

```bash
git clone https://github.com/yash-2304/Adversarial-Resume-Auditor.git
cd adversarial-resume-auditor
npm install
npm run dev
```

🔑 Environment Variables

Create .env.local:
OPENAI_API_KEY=your_api_key_here

🌐 Future Improvements

* Export report as PDF
* Shareable results link
* Resume version comparison
* Save analysis history

👨‍💻 Author

Yash Prajapati
GitHub: https://github.com/yash-2304


⸻

📜 License

MIT
