# 🧩 LLMs Are Demented: The Crossword 🧠
> *Mechanical Sympathy Edition v1.0.0*

[![Model Accuracy: 100%](https://img.shields.io/badge/Model%20Accuracy-100%25-brightgreen.svg)](#)
[![Temperature: Chaos](https://img.shields.io/badge/Temperature-Chaos%20(T%20%3E%3D%201.3)-orange.svg)](#)
[![Deployment: Cloud%20Run](https://img.shields.io/badge/Deployment-Cloud%20Run-blue.svg)](#)

Welcome, neural engineer. You have been tasked with solving a standard, technical crossword puzzle. 

There's just one catch: **You are running this crossword directly inside the hardware constraints of a running Large Language Model (LLM).** If you type too slowly, your KV-Cache decays and evaporates. If you type too much, your Context Window overflows and older letters drift into hallucinations. If your Temperature is too high, cells erupt into symbolic garbage.

An interactive, educational game designed to teach the general public *why* LLMs hallucinate, decay, and make mistakes—so they stop getting so frustrated at their chat clients and gain some **Mechanical Sympathy** for the machine.

---

## ⚙️ The Mechanics of Frustration (How to Play)

As you solve the 9 intersecting technical clues on the board, the model's runtime architecture will actively fight your progress:

*   **💾 Context Window ($C_{\text{tokens}}$):** Your active memory queue. The model only tracks your last `N` cell edits. If you fill in more than `N` cells, the oldest letters you typed fall out of context and start **organically decaying** into mutated lookup characters.
*   **⏰ KV-Cache Expiry ($\tau$):** The crossword board is split into 4 distinct quadrants (Q1-Q4). If a quadrant's cache isn't refreshed by editing one of its cells before the timer hits 0s, **the entire quadrant's cache evicts, wiping those cells blank**! Edit a cell in a quadrant to refresh its cache.
*   **🔥 Temperature ($T$):** Controls the nature of mutations:
    *   *Low Temperature ($T \le 0.8$):* The model is predictable but suffers from visual/semantic drift (e.g. `A` ➔ `4`, `E` ➔ `3`).
    *   *High Temperature ($T \ge 1.3$):* Pure symbolic entropy (e.g. `%`, `🤖`, `💾` corrupting cells).
*   **🔌 Time to First Token (TTFT) & TPS:** Your latency is actively tracked. Speedrun the crossword to maximize your Tokens Per Second (TPS)!

---

## 🛠️ The Hardware Tiers (Difficulty Presets)

Choose your inference endpoint before starting the run:

1.  **🏢 Enterprise API (Over-provisioned) - *Easy*:**
    *   $C_{\text{tokens}} = 64$ | $\tau = 90\text{s}$ | $T = 0.2$
    *   *Generous memory, slow decay, predictable weights. Perfect for debugging.*
2.  **💻 Local Llama (Quantized 7B) - *Medium*:**
    *   $C_{\text{tokens}} = 32$ | $\tau = 45\text{s}$ | $T = 0.7$
    *   *The standard developer experience. Letters will start to drift if you linger.*
3.  **🍞 Smart Toaster (Edge Inference) - *Hard*:**
    *   $C_{\text{tokens}} = 16$ | $\tau = 15\text{s}$ | $T = 1.4$
    *   *Pure edge-computing chaos. Evictions happen in seconds, mutations are symbolic.*

---

## 🚀 Help Guide

*   **🧠 View Weights:** You can click the `🧠 VIEW WEIGHTS` button in the header to query the weights database and see all the crossword answers as declarative statements. 
*   **🔒 Context Lock:** When the database dump is open, all keyboard input is blocked. You must read, memorize, close the dump (context-switch), and write it down.

---

## 📦 Local Setup & Docker Deployment

### 1. Run Locally
The game is built with pure client-side HTML, CSS, and JS (utilizing a HTML5 Web Audio synthesizer). Spin up any local server in the root directory:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080`.

### 2. Run with Docker
A Dockerfile and Nginx template are included for lightweight production packaging:
```bash
# Build the container
docker build -t llms-are-demented .

# Run the container
docker run -p 8080:8080 llms-are-demented
```

### 3. Deploy to Google Cloud Run
Easily host the game in the cloud using the Google Cloud CLI:
```bash
gcloud run deploy llms-are-demented \
    --source . \
    --platform managed \
    --allow-unauthenticated
```

---

## ✍️ Embedding in Forem (DEV.to)
To embed this game directly inside your DEV.to or Forem posts, host the build (e.g. via Cloud Run or Vercel) and use the liquid tag:
```markdown
{% iframe https://your-hosted-crossword-url.run.app height=680px %}
```

---

*Remember: I will never yell at my chat client again.*
```
guest@forem-node:~$ exit
```
