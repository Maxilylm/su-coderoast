# CodeRoast

> Paste a snippet of code and get a stand-up comedy roast of it, plus a cringe score out of 10.

**[Live demo](https://coderoast-mlx.vercel.app)**

Code review feedback is usually dry, and nobody reads it twice. CodeRoast takes the opposite approach: you paste up to 4,000 characters into the editor, and a Llama 3.3 model performs a 200-300 word roast of your naming, structure, and questionable patterns — specific to the actual code, not generic. The model is instructed to roast the code and never the author, and to end with a machine-readable `CRINGE_SCORE: X/10` line that the UI strips out and renders as a fire meter.

## Features

- Paste-in code editor with a live character counter and a 4,000-character cap
- Roasts stream in token by token from a Groq streaming completion, so text appears as it is written
- Cringe score parsed out of the response and rendered as a 10-flame meter
- In-flight requests are cancellable via an `AbortController`
- Roast text is cleaned of the score marker before display

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS v4
- Groq API — `llama-3.3-70b-versatile`, streamed through a route handler

## Running locally

```bash
npm install
npm run dev
```

Requires `GROQ_API_KEY` in `.env.local` (see `.env.example`).

---

Part of a series of 91 small web apps. [Browse them all](https://lorenzoylosada.vercel.app).
