# Day 2: The Gating Crisis — Can You Act as a Sparse MoE Router Without Dropping Tokens? 🧠⚡

Mixture of Experts (MoE) models (like Mixtral 8x7B, DeepSeek-V3, and GPT-4) achieve state-of-the-art performance by only activating a fraction of their neural network for each token. But this efficiency relies on a critical component: the **Gating Network (or Router)**. 

If the router makes incorrect dispatches or overloads specific experts, the system suffers from **perplexity collapse**, **capacity drops**, or **hallucinatory spikes**.

For **Day 2 of our interactive system series**, we built an educational simulator where **YOU** are the gating router. Your job is to dispatch incoming multimodal tokens to specialized Feed-Forward Networks (FFNs) under strict hardware and cognitive constraints.

---

## 🎮 How to Play

{% cta https://llms-are-demented-90043718455.us-central1.run.app/gating-crisis/ %} 🎮 CLICK HERE TO PLAY "THE GATING CRISIS" {% endcta %}

---

## 📟 The Challenge

You are presented with a conveyor belt of falling tokens (`[T] Text`, `[M] Math`, `[V] Vision`, `[A] Audio`, and `[C] Code`). You must route them to the most suitable experts. Since modern MoE models use **Top-2 Routing**, you must select **two experts** for every token before it reaches the eviction threshold.

### ⚙️ Simulator Controls:
* **Hotkey Routing:** Use keys `1` to `8` (or `1` to `4` in simplified mode) to select FFN experts.
* **Active Routing Zone:** Tokens can only be routed while they fall between the **yellow dashed line (Routing Gateway Active)** and the **red dashed line (Gating Threshold)**. Pressing keys while a token is too high up does nothing!
* **Active Expert Count:** Toggle between **4-Expert (Simplified)** and **8-Expert (Enterprise)** network architectures. The recommended keys dynamically rewrite on the fly!
* **Runway Customization:** Adjust the **Routing Runway Size** slider to slide the yellow activation line up or down. A longer runway gives you more time to think, while a shorter runway mimics low-context edge hardware.
* **Token Movement Speed & Spawn Rate:** Adjust descent velocity and spawn intervals independently. Fast rates at slow speeds let you balance throughput, but beware of conveyor congestion!

---

## ⚠️ System Congestion & Diagnostics

Keep an eye on your live metrics panel at the top of the dashboard:
* **Routing Latency:** Measures your cognitive latency (in milliseconds) from the moment a token crosses the yellow active line to the moment you finalize its Top-2 routing.
* **Capacity Drops:** If you route too many tokens to the same expert (e.g. sending every token to the Generalist), its queue will exceed the **Expert Capacity Limit**. Overloaded queues will drop tokens, leading to system failure.
* **Routing Perplexity:** Keeps track of your routing accuracy. Routing a math token to a linguistics expert degrades output coherence.

---

### 🕶️ Hard Mode: Mask Routing Hints
If you want an advanced challenge, flip the **MASK ROUTING HINTS** switch. This hides the key recommendation badges on the tokens and suppresses the pulsing outlines on the expert cards. You must rely entirely on your understanding of which experts accept which token modalities!

---

## 🛠️ Built with Antigravity
This game was built using pure vanilla HTML5, CSS3 (featuring retro CRT scanlines and cyberpunk neons), and the Web Audio API for generating vintage synthesizer sounds directly in your browser. 

*No servers were harmed in the making of this gating router.*

Let us know what configuration presets you managed to balance! Can you maintain 100% accuracy on the **Edge Toaster** preset? Post your scorecard in the comments below! 🚀
