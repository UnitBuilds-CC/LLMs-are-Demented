---
title: "Model Kombat: The LLM Fighting Game!"
published: true
series: "Game to LLM"
description: "A retro-cyber fighting game where Large Language Models face off. Parameter counts scale rendering quality, reasoning tokens fuel specials, and context eviction triggers Fatalities."
tags: ai, games, javascript, webdev
cover_image: "https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/model_kombat_cover.png"
---

Ever wondered what would happen if the world's leading Large Language Models settled their benchmark disputes in a 2D cybercity arena? 

It's easy to look at model performance on standardized benchmarks (like MMLU, MATH, or HumanEval). It is much more fun to visualize their underlying architectures, parameter scales, and hardware constraints as a retro-cyber fighting game.

So, we built **Model Kombat** (Mixture of Experts Edition)!

---

## 🕹️ Play Directly Here

{% embed https://model-kombat-90043718455.us-central1.run.app %}

{% cta https://model-kombat-90043718455.us-central1.run.app %} 🎮 Launch Game in Full Screen {% endcta %}

---

## 🧬 Playable ML Concepts Explained

This isn't just a basic stick-figure fighting game. Every mechanic—from rendering complexity to the speed at which characters recover—is a direct, playable representation of real-world Large Language Model engineering.

### 1. 📐 Parameter Scaling vs. Render Tiers
A model's representation capacity (intelligence) scales with its parameter count. In Model Kombat, a fighter's visual complexity, joint detail, and rendering fidelity directly reflect its real-world parameter size:
*   **Tier 1 (< 5B Parameters - Gemma 2B, Llama 3.2 3B) - *Primitive Capsules*:** Drawn as simple, single-color flat limbs with low joint segmentation. This visualizes the limited representation capacity and coarse output resolution of small edge models.
*   **Tier 2 (7B - 14B Parameters - Mistral 7B, Claude Haiku) - *Simple Vectors*:** Structured as thin skeletal wireframe vectors.
*   **Tier 3 (14B - 35B Parameters - Gemini Flash, Mixtral) - *Two-Tone Vectors*:** Rendered as dual-color, layered vector limbs.
*   **Tier 4 (35B - 100B Parameters - Llama 8B, Claude Sonnet) - *Cyborg Shading*:** Rendered as detailed vector cylinders with dynamic code particle streams flowing along their limbs.
*   **Tier 5 (> 100B Parameters - o3, GPT-4o, Claude Opus) - *Quantum Vectors*:** Rendered as glowing vector limbs with digital matrix code particles, soft drop-shadow depth buffers, and real-time afterimage motion trails.

---

### 2. ⚡ Reasoning Tokens & KV-Cache Overcharging
Instead of arbitrary "mana" or "stamina," fighters charge a **Ki bar** representing internal processing cycles and **Reasoning Tokens** (inspired by reasoning chains like OpenAI's o-series):
*   **Charging Ki:** Simulates the time-to-first-token (TTFT) phase, generating reasoning tokens.
*   **Limit Break:** Overcharging past 100% enters a golden-outlined **Limit Break** state, granting high-speed afterimages and super-armor.
*   **Context Eviction & Dizzy:** If a model holds its overcharged state too long, its context window overflows. This triggers **Context Eviction**—draining the model's HP and placing it in a **Dizzy** state. This represents how context window saturation degrades model coherence and leaves it vulnerable to failure.

---

### 3. 🌀 Mixture of Experts (MoE) Routing
Sparse Mixture of Experts (MoE) models do not activate all parameters on every token; instead, a gating network routes tokens to specialized experts.
*   **Active Experts:** Native MoE models in the game (like Mixtral and DeepSeek) dynamically spawn floating indicator nodes representing active **Text**, **Math**, or **Vision** experts.
*   **Routing Buffs:** Landing hits routes computation to these experts, granting temporary combat buffs:
    *   `TEXT` FFN: Increases walk speed (low-latency generation).
    *   `MATH` FFN: Increases damage output (logical compute).
    *   `VISION` FFN: Expands attack hitboxes (spatial awareness).

---

## 📊 Spotlight: The AI Fighter Registry

Here is a breakdown of 6 key models featured on the ladder, explaining where they excel in real life and how their unique passives translate into combat advantages:

### 1. 🧠 o3 (OpenAI)
*   **In Real Life:** OpenAI's state-of-the-art reasoning model. Rather than generating text instananeously, o3 employs a reinforcement learning-driven "thinking chain" to plan, verify, and correct its logic before outputting a response. This makes it a titan in mathematics, competitive programming, and complex coding.
*   **In-Game (Tier 5):** **Deep Thinking Chain** passive. o3 charges its Ki at **double speed** (representing the model's heavy pre-response thinking cycles). This lets you quickly max out your meter, activate MoE, or release powerful special attacks.

---

### 2. 📜 Claude Opus (Anthropic)
*   **In Real Life:** Anthropic’s flagship heavy model. Opus is celebrated for its high-nuance reading comprehension, literary synthesis, and strict compliance with ethical and safety guidelines (governed by Anthropic's "Constitutional AI" framework).
*   **In-Game (Tier 5):** **Constitutional Blade** passive. Opus has an extended melee strike range on all punches and kicks, allowing you to control the neutral game and keep opponents at a distance—visualizing the model's massive context processing reach.

---

### 3. 🎤 Gemini Ultra (Google)
*   **In Real Life:** Google's largest multimodal model. Unlike models that stitch together separate speech-to-text and vision encoders, Gemini is built natively multi-modal from day one. It processes video, audio, and text simultaneously inside a single model architecture.
*   **In-Game (Tier 5):** **Ultra Stance Shift** passive. Gemini can switch between `TEXT`, `VISION` (expanded hitboxes), and `AUDIO` (increased speed) modality stances instantly without the standard stance-transition delay, adapting to any opponent's position on the fly.

---

### 4. ⚡ DeepSeek V3 (DeepSeek)
*   **In Real Life:** The groundbreaking open-weights model from DeepSeek. V3 utilizes Multi-Head Latent Attention (MLA) to compress Key-Value caches, dramatically reducing VRAM footprint, alongside a massive Multi-head Latent Attention routing gating network.
*   **In-Game (Tier 4):** **MLA Attention** passive. Compress caching translates to high combat evasion: DeepSeek V3 has a **15% chance** to phase-dodge incoming projectiles completely.

---

### 5. 🗼 Mistral 7B (Mistral)
*   **In Real Life:** The legendary French open-weights model that punches far above its weight class. Mistral 7B introduced Sliding Window Attention (SWA) to the open-source community, allowing the model to handle longer context streams with minimal performance decay.
*   **In-Game (Tier 2):** **Sliding Window** passive. The sliding window translates to faster execution: Mistral has **10% less startup frame lag** on punches and kicks, letting you land strikes before your opponent's animations can finish.

---

### 6. 📱 Llama 3.2 3B (Meta)
*   **In Real Life:** Meta’s mobile-first, edge-optimized model. Llama 3.2 3B is trained specifically for local deployment on smartphones and tablets, focusing on high efficiency, quick response times, and localized fine-tuning.
*   **In-Game (Tier 1):** **Fine-Tuning** passive. The model is incredibly resilient to pressure: Llama 3.2 gains **+5% defense** every time it successfully blocks consecutive hits, adapting to the opponent's combo string.

---

## 🏁 Beat the Machine & Share Your Score

Once you defeat all 19 opponents on the ladder, you will face the reigning champion: **o3**. 

Can you reach the top of the ladder and claim victory? Click **COPY SCORE** at the end of your run and paste your stats in the comments below!

---

### 💬 Let's Discuss:
* Which model is your favorite main?
* What was your longest combo chain on the ladder?

{% embed https://github.com/UnitBuilds-CC/Model-Kombat %}
