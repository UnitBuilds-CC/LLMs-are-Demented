---
title: "LLMs are Demented: The Crossword (Mechanical Sympathy Edition)"
published: true
description: "Crossword puzzles are easy. But what if you had to solve one while running inside the hardware constraints of a Large Language Model?"
tags: showdev, games, webdev, ai
cover_image: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80 # Feel free to update or replace this cover image!
---

Ever gotten frustrated at ChatGPT, Claude, or Gemini for forgetting something you said ten messages ago? Or laughed at a completely bizarre hallucination where it replaced a normal word with a random emoji? 

It’s easy to yell at the chat client. It's much harder to maintain **Mechanical Sympathy** for the massive, spinning plates of hardware constraints running under the hood.

So, we built an interactive game to teach you how LLMs actually work (and fail): 

# 🧩 LLMs Are Demented: The Crossword

{% embed https://llms-are-demented-90043718455.us-central1.run.app/ %}

---

## ⚙️ How the Game Works

This is a standard, technical 9-word crossword puzzle. To win, you must retrieve the definitions of core machine learning concepts (like `WEIGHTS`, `TOKEN`, `ATTENTION`, and `EPOCH`) and type them in.

But as you play, you are running directly inside the actual architectural constraints of a Large Language Model:

### 1. 💾 The Context Window ($C_{\text{tokens}}$)
The model only tracks your last `N` cell edits. If you type more letters than your context size, the oldest letters you entered fall out of context and start **organically decaying**. They will slowly flicker and mutate into visually similar characters (or pure noise) as the model loses track of them.

### 2. ⏰ KV-Cache Expirations ($\tau$)
The board is split into 4 distinct quadrants (Q1-Q4). If you leave a quadrant untouched for too long, its cache expires—**and that entire section of the board is instantly wiped blank**! You must hop between quadrants to keep their caches active.

### 3. 🔥 Temperature ($T$)
Controls the chaos of mutations:
- **Low Temp ($T \le 0.8$):** Drifts predictably (e.g. `E` becomes `3`, `A` becomes `4`).
- **High Temp ($T \ge 1.3$):** Explodes into pure symbolic entropy (emojis, percent signs, and system glyphs).

---

## 🛠️ Choose Your Hardware Preset

Before you click **INITIATE RUN**, select your inference endpoint difficulty:

*   **🏢 Enterprise API (Easy):** Large context window ($C=64$), 90-second cache, very low temperature. Very forgiving.
*   **💻 Local Llama (Medium):** Quantized 7B model running on a laptop ($C=32$), 45-second cache, standard temperature ($0.7$). You'll need to move fast to avoid decay.
*   **🍞 Smart Toaster (Hard):** Edge inference on a kitchen appliance ($C=16$), 15-second cache, high temperature ($1.4$). Complete hardware chaos.

*Tip: If you need a cheatsheet, click the `🧠 VIEW WEIGHTS` button to dump the answers database. But be warned: the database query locks keyboard inputs, forcing you to close the weights, switch contexts, and recall the answers from memory!*

---

## 🏁 Beat the Machine & Share Your Score

Once you fill in the last box, the system triggers `RUN INFERENCE` automatically to lock your scorecard. 

Can you beat the local CPU (15 TPS) or a Cloud API (150 TPS)? Click **COPY SCORE** at the end of your run and paste your stats in the comments below! 

*(And if you're thinking of copy-pasting the answers from the weights dump in one shot... well, the compiler has a prompt injection pipeline scanner. Try it at your own risk! 😉)*

---

*Play the game above, check out the source code on GitHub at [UnitBuilds-CC/LLMs-are-Demented](https://github.com/UnitBuilds-CC/LLMs-are-Demented), and let us know your high score!*
