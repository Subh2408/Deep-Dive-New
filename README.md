# Deep Dive

A philosophical icebreaker. Ten questions, four tiers of AI depth, one forest.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.example .env
# then edit .env and paste your key

# 3. Run dev server (Vite + Express together)
npm run dev
```

App runs at http://localhost:5173  
API server runs at http://localhost:3001

## Structure

```
server/         Express API proxy (keeps key off client)
src/
  data/         anchors, themes, leaf texts
  hooks/        useForest (canvas), useAI (question generation)
  components/
    screens/    Intro, Clearing, Fork, Send, Convergence, Explorer
    ui/         DepthDots, LeafFall, NodePanel
  store.js      Zustand global state
  api.js        fetch wrapper → /api/generate
  App.jsx       screen router
```

## How it works

- Questions 1–5 are hardcoded anchors per theme
- Questions 6–10 are AI-generated with four depth tiers
- The convergence question reads the full 10-answer path
- Share generates a context paragraph via a second AI call
- The explorer is a pan/zoom 2D canvas — drag, pinch, scroll wheel
