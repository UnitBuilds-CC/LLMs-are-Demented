# 🏭 Inference Pipeline Tycoon: Token Factory Simulator

An educational retro-cyberpunk factory tycoon simulator that turns GPU memory allocation, prompt pre-computation, KV-cache paging, and speculative decoding into interactive, visual layout puzzles.

👉 **[Play the Live Demo here!](https://llms-are-demented-166926259124.us-central1.run.app/token-factory/)**

---

## 🎮 The Concept

In **Inference Pipeline Tycoon**, you play as a performance infrastructure architect. You are given an active simulation grid, an input queue of user queries, and an output delivery sink. Your goal is to place components, configure routing directions, and balance speed against memory limits to satisfy client Throughput (TPS) quotas.

### Playable Modular Components:
* 🌐 **Wire Conduits:** Route data packets across the grid.
* ⚡ **Prefill Engines:** Process prompt tokens in parallel and initialize key-value attention matrices.
* 🔋 **Decode Engines:** Run autoregressive generation to output next-tokens sequentially.
* 💾 **Page Allocators (vLLM):** Allocate virtual paging tables to compress KV-cache memory and prevent CUDA Out-of-Memory crashes.
* 🚀 **Speculative Drafters:** Deploy lightweight draft models to generate speculative token chains.
* ⚖️ **Validation Gates:** Verify drafted token chains in parallel, executing speculative rollbacks on mismatch.

---

## 🧠 What It Teaches

* **Prefill vs. Decode Phases:** Teaches players how the highly parallel prefill phase (TTFT) contrasts with the memory-bandwidth-bound decode phase.
* **KV-Cache Memory & Fragmentation:** Simulates how dynamic prompt lengths cause memory fragmentation in graphics cards, demonstrating how paged memory virtual allocation (like vLLM) solves this.
* **Speculative Decoding:** Demonstrates the speed advantages of speculative token validation and the cost of rollback iterations when speculative drafts mismatch the target model's output.

---

## 🛠️ Tech Stack & Engineering Highlights

* **Frontend:** Vanilla HTML5 Canvas for real-time particle rendering and custom CSS grid styling.
* **Audio Synthesis:** Real-time Web Audio API bleeps and click synthesis (no external asset dependencies).
* **Decoupled Physics Engine:** Implements a Fixed Timestep Accumulator loop (60 updates/sec) to ensure simulation metrics (TPS) are completely accurate to real wall-clock time, even on lagging rendering frames.
* **No Dependencies:** Light, pure vanilla ES6 Javascript.

---

## 🚀 How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/UnitBuilds-CC/TOKEN-FACTORY.git
   cd TOKEN-FACTORY
   ```

2. Run a local web server (e.g., using python, node, or Live Server):
   ```bash
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` in your web browser.
