---
title: "Model Kombat: The LLM Fighting Game!"
published: true
description: "A retro-cyber fighting game where AI language models do battle. Parameter counts scale rendering quality, reasoning tokens fuel specials, and context eviction triggers Fatalities!"
tags: ai, games, javascript, webdev
cover_image: "https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/model_kombat_cover.png"
---

Ever wondered what would happen if the world's leading Large Language Models settled their benchmark disputes in a 2D cybercity arena? 

We built **Model Kombat** (Mixture of Experts Edition) to find out!

---

## 🕹️ Play Directly Here

{% embed https://model-kombat-90043718455.us-central1.run.app %}

{% cta https://model-kombat-90043718455.us-central1.run.app %} 🎮 Launch Game in Full Screen {% endcta %}

---

## ⚙️ How the Game Works

Model Kombat is a retro-cyber fighting game where 20 real-world AI language models face off in a progressive tournament ladder. But instead of typical martial arts, their mechanics are defined by actual machine learning concepts:

### 1. 📐 Mechanical Sympathy: The 5 Render Tiers
A model's graphical complexity and rendering fidelity directly reflect its size and parameter count:
*   **Tier 1 (Gemma 2B, Llama 3.2 3B) - *Primitive Shapes*:** Low-detail flat limb segments.
*   **Tier 2 (Mistral 7B, Claude Haiku) - *Simple Vectors*:** Vector outlines.
*   **Tier 3 (Gemini Flash, Mixtral 8x7B) - *Two-Tone Vectors*:** Layered dual-color vectors.
*   **Tier 4 (Llama 8B, Claude Sonnet) - *Cyborg Shading*:** Highly shaded vector cylinders with dynamic code streams.
*   **Tier 5 (o3, GPT-4o, Claude Opus, Gemini Ultra) - *Quantum Vectors*:** Glowing vector limbs, digital matrix code particles, and high-performance afterimage motion trails.

### 2. ⚡ The Ki System: Reasoning Tokens & KV-Cache Overcharging
Instead of arbitrary energy, charging your Ki generates **Reasoning/KV-Cache Tokens**:
*   **Overcharging:** If you charge past 100%, you enter a golden-outlined **Limit Break** state, granting high-speed afterimages and super-armor.
*   **Context Eviction:** Hold the overcharge too long and your context window evicts, draining your HP and leaving you completely **Dizzy** (susceptible to Fatalities).

### 3. 🧠 Mixture of Experts (MoE) & Modality Shifts
*   **MoE Transformation:** Native MoE models (like Mixtral and DeepSeek) can spend Ki to route computations to specialized **Text**, **Math**, or **Vision** experts, gaining massive stat buffs.
*   **Modality Stance Shifts:** Google models (Gemini/Gemma) can shift between `TEXT`, `VISION`, and `AUDIO` modality stances mid-fight, altering their speeds, hitboxes, and projectile properties.

### 4. 🤼 Judo Suplex Grabs & Combos
We implemented an intuitive grappling system:
*   **Suplex Arc:** Grabs swing the opponent in a head-first 180-degree overhead suplex arc, slamming them behind the attacker into a knockdown frame.
*   **Spam Prevention:** Button mashing is penalized. Normals can only cancel into other attacks if they *connect* (no empty air cancels), and whiffing carries a heavy 18-frame recovery cooldown penalty.

---

## 💀 Cinematic Fatalities

If you decrease your opponent's HP to 0 while they are dizzy, you can trigger a model-specific cinematic Fatality:
*   **Google:** *Context Eviction Vortex* — Summons a swirling binary code cyclone and multi-colored laser columns to vaporize the victim.
*   **OpenAI:** *Policy Censorship Override* — Drops a giant red `[ POLICY VIOLATION: REDACTED ]` bar while alignment hexagons crush the target.
*   **Anthropic:** *Constitutional Erasure Blade* — Sweeps a golden crescent constitutional rules shockwave across the arena.
*   **Meta:** *Llama Parameter Stampede* — A stampede of wireframe llamas charges across the screen in offset waves.
*   **Mistral:** *Sliding Window Decimation* — Swirls 8 orange cyclones to shred the victim in a wind tunnel.
*   **DeepSeek:** *Multi-Token Deletion* — Wraps a double-helix math node chain around the victim while math symbols rain from the sky.

---

## 🛠️ Tech Stack & Local Setup

The game is built with:
*   **Frontend:** Vanilla HTML5, CSS3, Canvas 2D, and Web Audio API (no external framework dependencies).
*   **Server:** Nginx lightweight Docker container running on Google Cloud Run.

### Clone the Repository:
```bash
git clone https://github.com/UnitBuilds-CC/Model-Kombat.git
cd Model-Kombat
```

### Run Locally:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

---

### 💬 Let's Discuss:
* Which model is your favorite main?
* Can you reach the top of the ladder and defeat the champion?
* Copy your scorecard and paste it in the comments below! 

{% embed https://github.com/UnitBuilds-CC/Model-Kombat %}
