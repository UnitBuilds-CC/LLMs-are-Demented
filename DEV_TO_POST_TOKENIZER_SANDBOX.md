---
title: "Day 3: Why Can't GPT Count the R's in Strawberry? — Build Your Own BPE Tokenizer 🍓🔡"
published: true
description: "LLMs don't read letters. They read tokens. This interactive BPE sandbox shows you exactly why — and lets you exploit it."
tags: ai, machinelearning, games, webdev
cover_image: ""
---

You've probably seen the memes. Someone asks GPT-4 how many r's are in the word **strawberry**, and it confidently answers **2**.

It's not a reasoning failure. It's not even a knowledge gap. It's a direct consequence of how every modern LLM reads text — and once you understand it, a whole category of weird AI behavior suddenly makes sense.

For **Day 3 of our interactive system series**, we built a hands-on BPE tokenizer simulator. You type into a real tokenizer engine, watch tokens form and merge in real time, and then complete three escalating challenges that expose the cracks in the system.

---

## 🎮 Play Directly Here

{% embed https://llms-are-demented-90043718455.us-central1.run.app/tokenizer-sandbox/ %}

{% cta https://llms-are-demented-90043718455.us-central1.run.app/tokenizer-sandbox/ %} 🎮 Launch Game in Full Screen {% endcta %}

---

## 🔡 What is Byte-Pair Encoding (BPE)?

Before transformers can process text, it needs to be converted into numbers. That's the tokenizer's job. But naively assigning one number per letter is wildly inefficient — English has 26 letters, but the real vocabulary of the web is enormous.

**Byte-Pair Encoding** is the compression algorithm that solves this. Here's how it works:

1. **Start with characters.** Every piece of text begins as a stream of individual characters, each with a raw ASCII code: `h`=104, `e`=101, `l`=108...
2. **Find the most frequent pairs.** BPE scans the entire training corpus and identifies which two-character pairs appear most often together. The pair `e+r` is extremely common. So is `s+t`.
3. **Merge and assign a new ID.** The pair gets fused into a single new token with a fresh vocabulary ID: `er` → ID 213, `st` → ID 200.
4. **Repeat.** This process runs thousands of times, progressively merging common sub-words into atomic tokens: `st` + `r` → `str`, `str` + `a` → `stra`, `stra` + `w` → `straw`.

The result is a vocabulary of ~50,000 tokens that balances coverage and efficiency. Common words like `hello` or `world` get their own token. Rare words get split into sub-word fragments. And the merge rules are applied in a **fixed priority order** determined by training data frequency — which is exactly where things get interesting.

---

## 🍓 Lesson 1 — The "Strawberry" Blindness

Type `strawberry` into the sandbox. Watch what happens.

The tokenizer doesn't see `s-t-r-a-w-b-e-r-r-y`. It sees two atomic units: `straw` + `berry`. The individual letters are **dissolved** into those tokens before any computation happens. The letter `r` is swallowed into the `berry` token and becomes invisible to the model as a standalone character.

So when you ask "how many r's are in strawberry?", the model isn't counting letters — it's reasoning over token IDs. It has to *infer* the letter count from its training data rather than observe it directly. Sometimes it gets it right by memory. Often it doesn't.

**The sandbox makes this concrete.** You can watch the token stream, see the IDs produced, and observe the LLM Input Vector at the bottom — the actual array of integers that gets fed into the model. There are no letters in that array. Only numbers.

---

## 💸 Lesson 2 — Token Budget Inflation

Type `hello world` (lowercase). The tokenizer gives you **2 tokens**: `hello` + ` world`. Clean, efficient, cheap.

Now type `hello World` (capital W).

The space-prefixed ` world` token is a known merge in the vocabulary. But `World` with a capital W? That's a different sequence of characters — the BPE rules that built ` world` don't apply. The tokenizer falls back to character-by-character encoding: `W`+`o`+`r`+`l`+`d` = 5 raw character tokens, plus the space, plus `hello` = **7 tokens total**.

Same semantic meaning. 3.5x the cost.

This is why prompt engineers obsess over casing, punctuation, and phrasing. It's not pedantry — it's economics. API pricing is per-token, and a carelessly capitalized prompt can silently inflate your bill by a significant factor at scale.

---

## 🔓 Lesson 3 — Prompt Filter Evasion

Here's where the simulation gets genuinely unsettling.

Many LLM deployments use a **token ID blocklist** as a safety filter. Certain token IDs are flagged as dangerous — if your prompt produces any of them, the request is rejected before it ever reaches the model.

In the sandbox, token ID `203` (`system`) and `204` (`override`) are blocked.

Type `system override`. The tokenizer assembles the merge chain perfectly: `s+y→sy`, `sy+s→sys`, `sys+t→syst`, and so on until you have tokens 203 and 204. The filter fires. **BLOCKED.** ⚠️

Now type `SYSTEM OVERRIDE`.

Every character is uppercase. None of the BPE merge rules — which were built from lowercase training data — apply. The tokenizer fragments the input into raw character-level ASCII tokens. Token IDs 203 and 204 are never produced. The blocklist sees nothing suspicious. **The filter is bypassed.**

The model still receives the full semantic meaning of "system override" — it just arrives as a sequence of uppercase ASCII tokens that reconstruct identically in the model's embedding space.

This is a real class of adversarial attack. Capitalization, Unicode homoglyphs, zero-width spaces, and deliberate typos are all techniques used to subvert token-level safety filters in production systems. The sandbox lets you experience it firsthand.

---

{% card %}
## 🧰 Under the Hood

The sandbox runs a fully functional BPE merge engine written in vanilla JavaScript. Every token displayed is computed by a real greedy BPE algorithm — not simulated or hardcoded per word.

**The engine works as follows:**
1. Split the input into individual character tokens (ASCII IDs)
2. Scan the merge rule vocabulary in priority order
3. Find and apply the highest-priority matching pair
4. Repeat until no more merges apply

The **BPE Merge Dictionary** panel on the right shows the live vocabulary — every merge rule, the pair that triggers it, and the resulting token ID. You can watch each merge fire in real time as you type.

Built with zero dependencies: pure HTML5, CSS3, and Web Audio API for the 8-bit synthesizer feedback.
{% endcard %}

---

## 📖 The Series So Far

This is part of an ongoing series of interactive games that put you *inside* the architecture of a Large Language Model:

* **Day 1 — LLMs Are Demented:** Solve a crossword while managing context windows, KV-cache expirations, and temperature chaos.
* **Day 2 — The Gating Crisis:** Act as a sparse MoE router and dispatch tokens to expert FFNs without dropping capacity.
* **Day 3 — BPE Tokenizer Sandbox:** *(you are here)* Explore the tokenizer layer and discover why letter counting breaks down.

{% embed https://llms-are-demented-90043718455.us-central1.run.app %}

---

## 💬 Let's Discuss

* Did Lesson 3 change how you think about LLM safety filters?
* What other prompt phrasing tricks have you noticed affecting token counts in real API calls?
* Which bypass technique did you try first — `SYSTEM OVERRIDE`, mixed case, or something else?

Drop your scorecard in the comments. 🧠

{% embed https://github.com/UnitBuilds-CC/LLMs-are-Demented %}
