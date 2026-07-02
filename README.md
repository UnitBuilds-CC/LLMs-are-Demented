# 📟 The Gating Crisis: Sparse MoE Router Simulator 🧠⚡
> *Part of the UnitBuilds CC Playgrounds Suite*

[![Architecture: Sparse MoE](https://img.shields.io/badge/Architecture-Sparse%20MoE%20(Top--2)-brightgreen.svg)](#)
[![Deployment: Cloud%20Run](https://img.shields.io/badge/Deployment-Cloud%20Run-blue.svg)](#)

Welcome, neural engineer. You have been put in charge of the **Gating Network (Router)** for a running Mixture of Experts (MoE) Large Language Model.

Your task is to route incoming multi-modal token streams (`[T] Text`, `[M] Math`, `[V] Vision`, `[A] Audio`, and `[C] Code`) to specialized Feed-Forward Network (FFN) experts in real-time. Since this is a **Top-2 Routing** network, you must dispatch every token to exactly **two experts** before it reaches the eviction threshold.

If you route tokens incorrectly, the model's output quality degrades into **perplexity collapse**. If you overload any individual expert beyond its queue limit, the system experiences **Capacity Drops** (loss of data).

---

## 🕹️ Game Mechanics (How to Play)

*   **⌨️ Hotkey Routing:** Use numbers `1` to `8` (or `1` to `4` in simplified mode) to select FFN experts.
*   **🟡 Active Routing Runway:** You can only route a token while it falls between the **yellow dashed line (Routing Gateway Active)** and the **red dashed line (Gating Threshold)**. Keys pressed outside this zone will not register.
*   **⚙️ Adjustable Runway Size:** Drag the slider to adjust the height of the active zone. Shorter runways mimic resource-constrained edge hardware, giving you less time to process inputs.
*   **🚀 Separated Pacing Controls:** Configure the **Token Spawn Interval** and **Token Movement Speed** independently to test high-density throughput without causing visual overlapping.
*   **🕶️ Mask Routing Hints (Hard Mode):** Toggle the hint switch to hide the recommended key badges on tokens and suppress the glowing outlines on FFN cards, forcing you to route based entirely on expert specialization knowledge.
*   **📊 Cognitive Latency Diagnostics:** The traditional throughput metric is replaced with **Routing Latency** (in milliseconds), measuring your average cognitive dispatch speed after a token crosses the active line.

---

## 🛠️ Hardware Tiers (Difficulty Presets)

Choose your gating hardware configuration before starting the run:

1.  **🏢 DataCenter (FP8 Over-provisioned) - *Easy*:**
    *   *Spawn Interval:* `5.0s` | *Movement Speed:* `1.2x` | *Noise (Temp):* `0.0` | *Expert Capacity:* `8`
    *   *Clean signals, zero deflections, and wide queues. Great for training.*
2.  **💻 Local 8x7B (Quantized) - *Medium*:**
    *   *Spawn Interval:* `6.8s` | *Movement Speed:* `1.0x` | *Noise (Temp):* `0.1` | *Expert Capacity:* `5`
    *   *Standard development setup. Slight routing temperature noise may deflect inputs.*
3.  **🍞 Edge Toaster (Low-power ASIC) - *Hard*:**
    *   *Spawn Interval:* `4.2s` | *Movement Speed:* `1.4x` | *Noise (Temp):* `0.4` | *Expert Capacity:* `3`
    *   *High noise, tiny queues, and fast descent speeds. Extreme load balancing required.*

---

## 📂 Repository Structure

This repository serves as a multi-game portal:
*   `/` (Root): A retro-dashboard terminal landing page linking to the available playgrounds.
*   `gating-crisis/`: The Mixture of Experts router simulator.
*   `crossword/`: **LLMs Are Demented** — A technical crossword puzzle simulator where you battle KV-Cache decay, Context Window overflows, and Temperature-based token mutations.

---

## 📦 Local Setup & Deployment

### 1. Run Locally
The suite is built with pure client-side HTML, CSS, and JS (utilizing browser-synthesized 8-bit audio). Spin up any local server in the root directory:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080`.

### 2. Run with Docker
A Dockerfile and Nginx template are included for lightweight production packaging:
```bash
# Build the container
docker build -t gating-crisis-portal .

# Run the container
docker run -p 8080:8080 gating-crisis-portal
```

### 3. Deploy to Google Cloud Run
Easily host the playground in the cloud using the Google Cloud CLI:
```bash
gcloud run deploy gating-crisis-portal \
    --source . \
    --platform managed \
    --allow-unauthenticated \
    --project=llms-demented-crossword-77
```

---

*Remember: The gating network is the gateway to sanity.*
```
gating-router@moe-node:~$ exit
```
