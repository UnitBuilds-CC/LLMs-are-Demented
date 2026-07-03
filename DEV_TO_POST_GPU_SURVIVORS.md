---
title: "GPU Survivors: Can You Survive a 1T Parameter Inference Run?"
published: true
series: "Game to LLM"
description: "Survive endless waves of OOD data, prompt injections, and adversarial token splits inside a GPU Core while scaling your model architecture to 1T parameters."
tags: ai, games, machinelearning, discuss
cover_image: "https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/your-cover-image-placeholder.jpeg"
---

Ever wondered what a GPU goes through during a massive language model inference run? While you type a query and wait for tokens, the silicon under the hood is holding together a fragile house of cards: balancing context window limits, scheduling activations, managing weights, and evading malicious adversarial attacks.

To teach you how LLMs behave (and fall apart) under load, we built an interactive game:

## ⚡ GPU Survivors: Latent Space Hell

{% embed https://llms-are-demented-90043718455.us-central1.run.app/gpu-survivors/ %}

{% cta https://llms-are-demented-90043718455.us-central1.run.app/gpu-survivors/ %} Play in Fullscreen Mode (if the embed sizing is tight) {% endcta %}

---

## 🛠️ Choose Your Hardware Preset

Before initiating your run, choose your difficulty configuration (each represented by a unique retro pixel chip sprite and custom parameters):

*   **🏢 Enterprise API (Easy):** Spawns with 6 Core Integrity Lives, fast speed (`2.8`), boosted damage, and a wide collection window. You get `+25%` XP gains and start with both the Attention Beam and the Softmax Aura active.
*   **💻 Consumer GPU (Medium):** Spawns with 5 Core Lives, normal speed (`2.5`), standard damage, and standard `100%` XP gains. Starts with the Attention Beam active.
*   **🍞 Smart Toaster (Hard):** Edge inference on a kitchen appliance. Spawns with only 4 Core Lives, slow speed (`2.1`), reduced damage, and a `-20%` XP penalty. Starts with a single Attention head active.

---

## 🧬 Playable ML Concepts Explained

This isn't just a clone of Vampire Survivors—every upgrade, weapon, and enemy is a literal simulation of real machine learning architectures:

### 1. 🎯 Cosine Similarity (Piercing Vector Arrows)
Fires piercing cyan arrows in a fan. In machine learning, cosine similarity measures how aligned two vectors are:
$$\text{Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
*   **Mechanical Synergy:** If the player is moving in the exact horizontal direction of the arrow fire, damage is boosted by **+60%** (aligned high similarity vectors!). If you run backward while firing, similarity drops and deal standard damage.

### 🧬 Weight Decay & Dropout (Hitbox Shrinking & Evasion)
*   **L2 Regularization (Weight Decay):** In deep learning, L2 regularization penalizes large weights to keep the model simple. In the game, upgrading weight decay shrinks your physical core hitbox by **-12%** per level, making it easier to slip between inputs.
*   **Node Dropout:** Randomly zeroes out neural nodes to prevent overfitting. Upgrading Dropout gives your GPU core a flat **+8%** chance per level to completely ignore/evade incoming hits.

### 🌊 The Adversarial Split (Jailbreaks)
*   When you attack a high-health **Jailbreak** enemy (a golden lock), destroying it causes it to break apart into **3 extremely fast Adversarial Tokens** that seek out your core. You must deploy regularization to keep them from overwhelming your cache!

### ⚖️ The Horizontal Data Bias (Skewing Forces)
*   The **Data Bias** enemy (neon green arrows) doesn't just attack you—it projects a localized force field. When you step inside its radius, your coordinates are horizontally dragged and skewed in the direction the arrow points, forcing you to fight against skewed inputs.

---

## 💀 The 15-Minute Thermal Runaway (Endgame)

At exactly **15:00**, all standard enemies are swept away, and the unkillable red boss **Hardware Degradation** arrives. You cannot harm it. 

To win and achieve the Easter Egg ending:
1. Navigate the arena and collect **3 Cloud Compute Vouchers** (golden tokens).
2. Grab them before the boss depletes your core integrity.
3. If successful, the screen fills with a rain of gold tokens, and you unlock your score:
   `💀 "Death comes for us all, I paid him off."`

---

### 💬 Let's Discuss:
* What was your longest survival time on Smart Toaster difficulty?
* What architectural combination (e.g., Quantization speed boosts + Cosine Similarity) did you find most effective?

{% embed https://github.com/UnitBuilds-CC/GPU-SURVIVORS %}
