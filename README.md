# ⚔️ ZOX – The Warrior AI

> *"I'm not here to impress you. I'm here to make you stronger."*

**ZOX** is a brutally honest, Roronoa Zoro-inspired AI chat interface powered by [Groq](https://console.groq.com). No fluff. No corporate tone. Just raw, direct intelligence that calls out your laziness and actually helps you grow.

**Live Demo →** [roronoazoro112.github.io/ZOX](https://roronoazoro112.github.io/ZOX) *(if hosted on GitHub Pages)*

---

## 🔥 What is ZOX?

ZOX is a **fully client-side AI chatbot** that runs in your browser with no backend required. It connects directly to the Groq API using your own key — fast, free, and private.

**ZOX is not a standard assistant.**
- Brutally honest and direct
- Calls out procrastination and laziness
- Redirects you to the best AI tool for the job (not just itself)
- Adapts to your skill level over time via persistent memory
- Fully customizable personality via the **Forge Zox** panel

---

## ✨ Features

| Feature | Description |
|---|---|
| ⚡ **Groq-Powered** | Uses `llama-3.3-70b-versatile` via Groq API — blazing fast inference |
| 🧠 **Persistent Memory** | Learns your name, skill level, projects, and goals. Remembers across sessions. |
| ⚔️ **Forge Zox (Fine-Tune)** | Adjust tone (Savage → Mentor), specialty mode, roast mode, and custom rules |
| 📜 **Chat History** | Past sessions saved locally in the browser (no server needed) |
| 🎨 **Animated UI** | Particle canvas background, slash animations, dark warrior aesthetic |
| 📱 **Responsive** | Works on desktop and mobile with collapsible sidebar |
| 🔒 **Fully Local** | Your API key and memory stay in `localStorage` — nothing leaves your browser |

---

## 🚀 Getting Started

### 1. Get a Free Groq API Key
1. Go to → [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card)
3. Create an API key — it starts with `gsk_`

### 2. Run ZOX

**Option A — Open directly (easiest):**
```
Just open index.html in your browser.
```

**Option B — Serve locally (recommended for dev):**
```bash
# Using Python
python3 -m http.server 8080
# Then open: http://localhost:8080
```

```bash
# Using Node.js
npx serve .
# Then open the URL shown in your terminal
```

### 3. Add Your API Key
- Open the sidebar (☰ top-left)
- Paste your `gsk_...` key in the **Groq API Key** field
- Hit the checkmark ✓ to save

That's it. Start talking.

---

## 🛠️ Forge Zox (Customization)

Click **"Forge Zox"** in the sidebar to customize:

| Setting | Options |
|---|---|
| **Tone** | Slider from *Savage* (Zoro at his worst) → *Balanced* → *Mentor* |
| **Specialty** | All-Round / Coding / Learning / Content / Business / Research |
| **Roast Mode** | Calls out laziness hard when enabled |
| **Tool Suggestions** | Suggests better AI tools when one exists for your task |
| **Short Responses** | Forces concise replies — no long lectures |
| **Your Rules** | Free-text field — e.g. *"Always reply in Hindi. Focus on ML. Never suggest paid tools."* |

Settings are saved to `localStorage` and persist across sessions.

---

## 🧠 Memory System

ZOX learns about you silently in the background using a lightweight memory extraction model (`llama-3.1-8b-instant`).

Every **3 exchanges**, it extracts and updates:
- Your **name**
- **Skill level** (beginner / intermediate / advanced)
- **Languages & tech stack**
- **Current projects** you're building
- **Your goals**
- **Topics discussed**

This profile is injected into Zox's system prompt so he always knows who he's talking to.

> **To clear memory:** Click **"Clear Memory"** in the sidebar (appears once Zox knows you).

---

## 📁 Project Structure

```
ZOX/
├── index.html        # App shell, layout, modals
├── app.js            # All logic: API calls, memory, UI, fine-tuning
├── style.css         # Full dark-mode warrior design system
├── zox_avatar.png    # Zox avatar image
└── .nojekyll         # Required for GitHub Pages deployment
```

---

## 🌐 Deploy to GitHub Pages

1. Push the repo to GitHub
2. Go to your repo → **Settings → Pages**
3. Set source to **Deploy from a branch → `main` → `/` (root)**
4. Done — your ZOX instance is live at `https://<username>.github.io/<repo>`

> The `.nojekyll` file is already included to prevent GitHub from ignoring files starting with `_`.

---

## ⚙️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript — zero dependencies, zero build step
- **AI Model:** `llama-3.3-70b-versatile` via [Groq API](https://groq.com)
- **Memory Extraction:** `llama-3.1-8b-instant` (fast, cheap background calls)
- **Storage:** `localStorage` (fully client-side)
- **Fonts:** Rajdhani, JetBrains Mono, Cinzel (Google Fonts)

---

## 🔑 API Key Security

Your Groq API key is **stored only in your browser's `localStorage`**. It is:
- Never sent to any server except Groq's official API endpoint
- Never logged or tracked
- Cleared when you clear browser data

> ⚠️ If you're deploying ZOX publicly and sharing the URL, **each user must enter their own Groq key.** Do NOT hardcode your key into the source.

---

## 🧩 Starter Prompts

ZOX ships with 4 quick-start cards on the welcome screen:

- ⚔️ **Learn to Code** — "How do I learn to code from scratch?"
- 🏗️ **Build a Web App** — "I need to build a web app but don't know where to start."
- 🔱 **Best AI Tools** — "What AI tools should I use as a student creator?"
- 🔥 **Stop Procrastinating** — "I keep procrastinating. How do I actually start building?"

---

## 📜 License

MIT — do whatever you want with it. Just don't make Zox soft.

---

<div align="center">
  <strong>Built by Vedant · Powered by Groq · Inspired by Roronoa Zoro</strong><br/>
  <em>"You will never be able to cut me. That's what it means to lose to me."</em>
</div>
