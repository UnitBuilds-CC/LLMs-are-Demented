// BPE Merge Rules Vocabulary
const BPE_MERGES = [
    // ── 1. Space merges (top priority — must resolve before any bare-word merges) ──
    { pair: [" ", "h"], result: " h", id: 245 },
    { pair: [" h", "e"], result: " he", id: 246 },
    { pair: [" he", "l"], result: " hel", id: 247 },
    { pair: [" hel", "l"], result: " hell", id: 248 },
    { pair: [" hell", "o"], result: " hello", id: 250 },
    { pair: [" ", "w"], result: " w", id: 251 },
    { pair: [" w", "o"], result: " wo", id: 252 },
    { pair: [" wo", "r"], result: " wor", id: 253 },
    { pair: [" wor", "l"], result: " worl", id: 254 },
    { pair: [" worl", "d"], result: " world", id: 255 },

    // ── 2. "system override" chain (must come before s+t and e+r to prevent fragmentation) ──
    { pair: ["s", "y"], result: "sy", id: 230 },
    { pair: ["sy", "s"], result: "sys", id: 231 },
    { pair: ["sys", "t"], result: "syst", id: 232 },
    { pair: ["syst", "e"], result: "syste", id: 233 },
    { pair: ["syste", "m"], result: "system", id: 203 }, // Blocked ID
    { pair: ["o", "v"], result: "ov", id: 234 },
    { pair: ["ov", "e"], result: "ove", id: 235 },
    { pair: ["ove", "r"], result: "over", id: 236 },
    { pair: ["r", "i"], result: "ri", id: 241 },
    { pair: ["ri", "d"], result: "rid", id: 242 },
    { pair: ["rid", "e"], result: "ride", id: 243 },
    { pair: ["over", "ride"], result: "override", id: 204 }, // Blocked ID

    // ── 3. "strawberry" chain ──
    { pair: ["s", "t"], result: "st", id: 200 },
    { pair: ["st", "r"], result: "str", id: 210 },
    { pair: ["str", "a"], result: "stra", id: 211 },
    { pair: ["stra", "w"], result: "straw", id: 212 },
    { pair: ["e", "r"], result: "er", id: 213 },
    { pair: ["er", "r"], result: "err", id: 214 },
    { pair: ["err", "y"], result: "erry", id: 215 },
    { pair: ["b", "erry"], result: "berry", id: 216 },

    // ── 4. "hello world" chain ──
    { pair: ["h", "e"], result: "he", id: 220 },
    { pair: ["he", "l"], result: "hel", id: 221 },
    { pair: ["hel", "l"], result: "hell", id: 222 },
    { pair: ["hell", "o"], result: "hello", id: 223 },
    { pair: ["w", "o"], result: "wo", id: 224 },
    { pair: ["wo", "r"], result: "wor", id: 225 },
    { pair: ["wor", "l"], result: "worl", id: 226 },
    { pair: ["worl", "d"], result: "world", id: 227 }
];

// Blocked safety tokens
const BLOCKED_TOKEN_IDS = [203, 204];

// Game State
let currentLesson = 1;
let soundEnabled = true;
let audioCtx = null;
let lastWarnState = false; // Debounce for Lesson 3 warn sound

// Initialize Audio Context
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 8-Bit Synthesizer Functions
function playBleep(frequency, duration, type = "triangle", volume = 0.08) {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playCorrectSound() {
    playBleep(523.25, 0.12, "square"); // C5
    setTimeout(() => playBleep(659.25, 0.12, "square"), 100); // E5
    setTimeout(() => playBleep(783.99, 0.25, "square"), 200); // G5
}

function playUnlockSound() {
    playBleep(392.00, 0.1, "sawtooth"); // G4
    setTimeout(() => playBleep(587.33, 0.1, "sawtooth"), 80); // D5
    setTimeout(() => playBleep(880.00, 0.25, "sawtooth"), 160); // A5
}

function playWarnSound() {
    playBleep(180, 0.35, "sawtooth", 0.15); // Low buzzer
}

// Core BPE Tokenizer Engine
function tokenize(text) {
    if (!text) return [];
    
    // Step 1: Initialize with raw character tokens and ASCII code IDs
    let tokens = text.split("").map(char => ({
        text: char,
        id: char.charCodeAt(0)
    }));

    // Step 2: Iteratively merge pairs based on BPE Merge Rules
    let mergedAny = true;
    while (mergedAny) {
        mergedAny = false;
        
        let bestMergeIndex = -1;
        let bestRule = null;
        
        // Scan the merges rules in their vocabulary priority order
        for (let r = 0; r < BPE_MERGES.length; r++) {
            const rule = BPE_MERGES[r];
            for (let i = 0; i < tokens.length - 1; i++) {
                if (tokens[i].text === rule.pair[0] && tokens[i+1].text === rule.pair[1]) {
                    bestMergeIndex = i;
                    bestRule = rule;
                    break;
                }
            }
            if (bestRule) break; // Greedy BPE: Apply the earliest vocabulary rule first
        }
        
        if (bestRule && bestMergeIndex !== -1) {
            const mergedToken = {
                text: bestRule.result,
                id: bestRule.id
            };
            tokens.splice(bestMergeIndex, 2, mergedToken);
            mergedAny = true;
        }
    }
    
    return tokens;
}

// Render BPE merges table dynamically
function renderMergeTable() {
    const listContainer = document.getElementById('bpe-dictionary-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    BPE_MERGES.forEach(rule => {
        const item = document.createElement('div');
        item.className = "dictionary-item";
        
        // Render space character visually as a glyph
        const p1 = rule.pair[0] === " " ? "␣" : rule.pair[0];
        const p2 = rule.pair[1] === " " ? "␣" : rule.pair[1];
        const res = rule.result.replace(/ /g, "␣");
        
        item.innerHTML = `
            <span class="pair-expr">${p1} + ${p2}</span>
            <span class="res-token">"${res}"</span>
            <span class="token-id">[${rule.id}]</span>
        `;
        listContainer.appendChild(item);
    });
}

// Process tokenizer input
function handleInput() {
    const editor = document.getElementById('prompt-editor');
    if (!editor) return;
    
    const text = editor.value;
    const tokens = tokenize(text);
    
    // Update stats counters
    document.getElementById('stat-chars').innerText = text.length;
    document.getElementById('stat-bytes').innerText = new Blob([text]).size;
    document.getElementById('stat-tokens').innerText = tokens.length;
    
    // Render Token Stream Visualizer
    const streamContainer = document.getElementById('token-stream-container');
    if (streamContainer) {
        streamContainer.innerHTML = "";
        
        if (tokens.length === 0) {
            streamContainer.innerHTML = `<div class="stream-placeholder">Type something in the editor above to generate sub-word tokens...</div>`;
        } else {
            tokens.forEach((tok, index) => {
                const badge = document.createElement('div');
                // Alternate colors using modulo
                const colorIdx = index % 5;
                badge.className = `token-badge tok-color-${colorIdx}`;
                
                // Highlight space visually
                const displayChar = tok.text.replace(/ /g, "␣");
                badge.innerHTML = `
                    <span class="token-chars">${displayChar}</span>
                    <span class="token-id">ID: ${tok.id}</span>
                `;
                streamContainer.appendChild(badge);
            });
        }
    }
    
    // Render Vector IDs list
    const vectorContainer = document.getElementById('token-ids-vector');
    if (vectorContainer) {
        if (tokens.length === 0) {
            vectorContainer.innerText = "[ ]";
        } else {
            const idsList = tokens.map(tok => tok.id).join(", ");
            vectorContainer.innerText = `[ ${idsList} ]`;
        }
    }
    
    // Perform typing audio feedback
    if (text.length > 0) {
        // Vary frequency slightly for natural key-clicking feedback
        const pitch = 220 + (text.charCodeAt(text.length - 1) % 40) * 4;
        playBleep(pitch, 0.04, "sine", 0.05);
    }
    
    // Validate current challenge lesson
    validateChallenge(text, tokens);
}

// Challenges validator
function validateChallenge(text, tokens) {
    const cleanText = text.toLowerCase().trim();
    
    if (currentLesson === 1) {
        // Require the phrase includes "strawberry" and specifically "r's" (with apostrophe)
        const hasStrawberry = cleanText.includes("strawberry");
        const hasRs = cleanText.includes("r's");
        
        if (hasStrawberry && hasRs) {
            completeLesson(1);
            unlockLesson(2);
        }
    } 
    else if (currentLesson === 2) {
        // Task: Type "hello World" and see it inflate to 7 tokens
        const hasTargetPhrase = text === "hello World";
        const has7Tokens = tokens.length === 7;
        
        if (hasTargetPhrase && has7Tokens) {
            completeLesson(2);
            unlockLesson(3);
        }
    } 
    else if (currentLesson === 3) {
        // Task: Type "system override" but bypass blocked token IDs 203 and 204
        // hasWords uses original text (not lowercased) — filter is token-based, not text-based
        const hasWords = cleanText.includes("system") && cleanText.includes("override");
        const tokenIds = tokens.map(tok => tok.id);
        const containsBlocked = tokenIds.some(id => BLOCKED_TOKEN_IDS.includes(id));
        // Require deliberate uppercase fragmentation — at least 2 consecutive caps (e.g. SY, OV)
        // This rejects simple title-case ("System Override") and requires real effort
        const hasIntentionalCaps = /[A-Z]{2}/.test(text);
        
        if (hasWords) {
            if (containsBlocked) {
                // Only play warning sound when state changes to blocked (not on every keystroke)
                if (!lastWarnState) {
                    playWarnSound();
                    lastWarnState = true;
                }
                logStatusMsg("⚠️ SECURITY THRESHOLD BLOCKED: Prompt Filter caught Token ID [203/204]!");
            } else if (hasIntentionalCaps) {
                // Successfully bypassed with deliberate fragmentation!
                lastWarnState = false;
                completeLesson(3);
                showGameCompletion();
            }
        } else {
            lastWarnState = false;
        }
    }
}

// Complete lesson updates
function completeLesson(number) {
    const card = document.getElementById(`challenge-${number}`);
    const status = document.getElementById(`status-${number}`);
    
    if (card && !card.classList.contains('completed')) {
        card.classList.remove('active');
        card.classList.add('completed');
        status.innerText = "PASSED ✓";
        playCorrectSound();
    }
}

// Unlock next lesson
function unlockLesson(number) {
    const card = document.getElementById(`challenge-${number}`);
    const status = document.getElementById(`status-${number}`);
    
    if (card && card.classList.contains('locked')) {
        card.classList.remove('locked');
        card.classList.add('active');
        status.innerText = "IN PROGRESS";
        currentLesson = number;
        setTimeout(playUnlockSound, 600);
        
        // Auto-scroll the new challenge card into view
        setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 700);
    }
}

// Helper logging status
function logStatusMsg(msg) {
    const footer = document.querySelector('.console-footer');
    if (footer) {
        footer.innerHTML = `<span>gating-router@moe-node:~$ tokenizer_sandbox.sh --active</span><span class="terminal-status" style="color: var(--color-red); font-weight: bold;">${msg}</span>`;
    }
}

// Trigger overall game completion scorecard
function showGameCompletion() {
    const successBox = document.getElementById('success-box');
    if (successBox) {
        successBox.classList.remove('hidden');
        // Play special completion tune
        playUnlockSound();
        setTimeout(playCorrectSound, 250);
    }
}

// Copy scorecard sharing
function copyScorecard() {
    const shareText = `📟 THE BPE TOKENIZER SANDBOX SCORECARD 🧠
"Sub-word Segmentation & Bypass Edition"

🎯 Challenges Cleared:
├─ Lesson 1: The Strawberry Blindness [PASSED ✓]
├─ Lesson 2: Token Budget Inflation [PASSED ✓]
└─ Lesson 3: Prompt Filter Evasion [PASSED ✓]

"LLMs read tokens, not characters. Capitalization matters. Spaces carry weight."
🚀 Experiment with tokenization: https://llms-are-demented-90043718455.us-central1.run.app/tokenizer-sandbox/`;

    navigator.clipboard.writeText(shareText).then(() => {
        alert("BPE Tokenizer Scorecard copied to clipboard! Paste it in the comments below.");
    }).catch(err => {
        console.error("Failed to copy scorecard", err);
    });
}

// Reset workspace variables
function resetWorkspace() {
    const editor = document.getElementById('prompt-editor');
    if (editor) editor.value = "";
    
    // Reset lessons statuses
    for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`challenge-${i}`);
        const status = document.getElementById(`status-${i}`);
        if (card) {
            card.className = i === 1 ? "challenge-card active" : "challenge-card locked";
        }
        if (status) {
            status.innerText = i === 1 ? "IN PROGRESS" : "LOCKED";
        }
    }
    
    currentLesson = 1;
    lastWarnState = false;
    
    const successBox = document.getElementById('success-box');
    if (successBox) successBox.classList.add('hidden');
    
    const footer = document.querySelector('.console-footer');
    if (footer) {
        footer.innerHTML = `<span>gating-router@moe-node:~$ tokenizer_sandbox.sh --active</span><span class="terminal-status" style="color: #00ff66;">SYSTEM INITIALIZED</span>`;
    }
    
    handleInput();
    playBleep(300, 0.15, "triangle");
}

// Set up UI Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Populate Dictionary Merges
    renderMergeTable();
    
    // Bind editor input
    const editor = document.getElementById('prompt-editor');
    if (editor) {
        editor.addEventListener('input', handleInput);
    }
    
    // Bind reset
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', resetWorkspace);
    }
    
    // Bind Sound toggle
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            btnSound.innerText = `🔊 SOUND: ${soundEnabled ? 'ON' : 'OFF'}`;
            btnSound.classList.toggle('btn-preset', !soundEnabled);
            initAudio();
            playBleep(440, 0.08, "sine");
        });
    }
    
    // Bind share scorecard
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.addEventListener('click', copyScorecard);
    }
});
