// The Gating Crisis: Sparse MoE Router Simulator
// Game Controller & Neural Simulation Logic

// Token Database Phrases
const TOKEN_PHRASES = {
    "T": [
        "Draft email reply", "Translate 'merci'", "Analyze text sentiment", 
        "Write python docstring", "Summarize article", "Parse grammar trees",
        "Generate haiku draft", "Correct punctuation"
    ],
    "M": [
        "Calculate 94 * 12", "Find matrix determinant", "Check prime factors",
        "Compute integral bounds", "Solve differential Eq", "Derive standard deviation",
        "Factorize quadratic", "Evaluate Euler totient"
    ],
    "V": [
        "Segment pixel map", "Extract bounding boxes", "Match facial geometry",
        "Compute visual depth", "Track movement vector", "Normalize RGB scale",
        "Detect edge contrast", "Decode barcode lines"
    ],
    "A": [
        "Denoise audio wave", "Measure decibel peaks", "Transcribe vocal track",
        "Encode audio to FLAC", "Calculate pitch frequency", "Filter white noise",
        "Synthesize MIDI scale", "Parse voice syllables"
    ],
    "C": [
        "Compile C++ code", "Generate JSON schema", "Parse Python AST",
        "Optimize array memory", "Refactor loop pointers", "Deploy web server",
        "Validate API payload", "Inject CSS template"
    ]
};

// 8 Specialized Experts (Enterprise MoE)
const EXPERTS_8 = [
    { id: 1, name: "Linguistic Poet", key: "1", load: 0, colorClass: "cyan", accepts: ["T"] },
    { id: 2, name: "Logic Calculator", key: "2", load: 0, colorClass: "red", accepts: ["M", "C"] },
    { id: 3, name: "Vision Encoder", key: "3", load: 0, colorClass: "green", accepts: ["V"] },
    { id: 4, name: "Audio Spectrogram", key: "4", load: 0, colorClass: "amber", accepts: ["A"] },
    { id: 5, name: "Codegen Compiler", key: "5", load: 0, colorClass: "purple", accepts: ["C"] },
    { id: 6, name: "Translation Polyglot", key: "6", load: 0, colorClass: "cyan", accepts: ["T"] },
    { id: 7, name: "Generalist", key: "7", load: 0, colorClass: "white", accepts: ["T", "M", "V", "A", "C"] },
    { id: 8, name: "Hallucinator", key: "8", load: 0, colorClass: "red", accepts: ["T", "M", "V", "A", "C"] }
];

// 4 Specialized Experts (Simplified MoE)
const EXPERTS_4 = [
    { id: 1, name: "Text Expert", key: "1", load: 0, colorClass: "cyan", accepts: ["T"] },
    { id: 2, name: "Math/Code Expert", key: "2", load: 0, colorClass: "purple", accepts: ["M", "C"] },
    { id: 3, name: "Media Expert", key: "3", load: 0, colorClass: "green", accepts: ["V", "A"] },
    { id: 4, name: "Generalist", key: "4", load: 0, colorClass: "white", accepts: ["T", "M", "V", "A", "C"] }
];

let activeExperts = [...EXPERTS_8];

// Game State Variables
let tokensStream = [];
let activeTokenId = 0;
let totalSpawned = 0;
const MAX_SPAWNED = 30; // Challenge length

let gameLoopInterval = null;
let spawnInterval = null;
let gameStartTime = null;

// Stats Counters
let totalRoutedCount = 0;
let correctRoutesCount = 0;
let dropsCount = 0;
let hallucinationsCount = 0;
let routedLatencies = []; // Cognitive latency records (in milliseconds)

// Hyperparameters (bound to sliders)
let spawnSpeed = 6.8; // in seconds (relaxed default)
let tokenMovementSpeed = 1.0; // speed multiplier (1.0x = 0.9px/tick)
let routingRunway = 120; // vertical size of active gateway zone (in pixels)
let routingNoise = 0.1; // temperature noise deflection probability
let expertCapacityLimit = 5;
let maskHints = false;

let gameActive = false;
let logBaseTime = Date.now();
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Synthesizer Sounds
function playSynth(freq, type, duration, volume) {
    try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function playTick() { playSynth(880, 'sine', 0.05, 0.02); }
function playCorrect() { playSynth(660, 'sine', 0.15, 0.05); }
function playWarn() { playSynth(220, 'triangle', 0.25, 0.08); }
function playLevelComplete() {
    try {
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C chord progression
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.05, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
        });
    } catch (e) {}
}

// Retro Logger
function getTerminalTimestamp() {
    const elapsed = Math.floor((Date.now() - logBaseTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return `[${mins}:${secs}]`;
}

function logToTerminal(message, type = 'info') {
    const history = document.getElementById('log-history');
    if (!history) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerHTML = `<span style="color: #4b5563; font-family: var(--font-mono); font-size: 0.85em; margin-right: 0.4rem;">${getTerminalTimestamp()}</span>${message}`;
    
    history.appendChild(line);
    while (history.children.length > 50) {
        history.removeChild(history.firstChild);
    }
    history.scrollTop = history.scrollHeight;
}

// Preset application
function applyPreset(presetKey) {
    if (gameActive) return;
    initAudio();
    
    const sliderSpeed = document.getElementById('slider-speed');
    const sliderNoise = document.getElementById('slider-noise');
    const sliderCapacity = document.getElementById('slider-capacity');

    const valSpeed = document.getElementById('val-speed');
    const valNoise = document.getElementById('val-noise');
    const valCapacity = document.getElementById('val-capacity');

    if (presetKey === 'edge') {
        spawnSpeed = 4.2;
        tokenMovementSpeed = 1.4;
        routingNoise = 0.4;
        expertCapacityLimit = 3;
    } else if (presetKey === 'local') {
        spawnSpeed = 6.8;
        tokenMovementSpeed = 1.0;
        routingNoise = 0.1;
        expertCapacityLimit = 5;
    } else if (presetKey === 'datacenter') {
        spawnSpeed = 5.0;
        tokenMovementSpeed = 1.2;
        routingNoise = 0.0;
        expertCapacityLimit = 8;
    }

    routingRunway = 120; // Default runway on presets
    const sliderRunway = document.getElementById('slider-runway');
    const valRunway = document.getElementById('val-runway');
    if (sliderRunway) {
        sliderRunway.value = routingRunway;
        valRunway.innerText = `${routingRunway}px`;
        const activeLine = document.querySelector('.router-active-line');
        if (activeLine) {
            activeLine.style.bottom = `${42 + routingRunway}px`;
        }
    }

    if (sliderSpeed) { sliderSpeed.value = spawnSpeed; valSpeed.innerText = `${spawnSpeed}s`; }
    const sliderMove = document.getElementById('slider-movement-speed');
    const valMove = document.getElementById('val-movement-speed');
    if (sliderMove) { sliderMove.value = tokenMovementSpeed; valMove.innerText = `${tokenMovementSpeed.toFixed(1)}x`; }
    if (sliderNoise) { sliderNoise.value = routingNoise; valNoise.innerText = routingNoise.toFixed(1); }
    if (sliderCapacity) { sliderCapacity.value = expertCapacityLimit; valCapacity.innerText = expertCapacityLimit; }

    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`preset-${presetKey}`);
    if (activeBtn) activeBtn.classList.add('active');

    logToTerminal(`Applied preset config: ${presetKey.toUpperCase()}`, 'system');
}

// Generate Experts grid in HTML
function renderExperts() {
    const gridEl = document.getElementById('experts-grid');
    if (!gridEl) return;
    gridEl.innerHTML = "";

    activeExperts.forEach(exp => {
        const card = document.createElement('div');
        card.className = "expert-card";
        card.id = `expert-card-${exp.id}`;
        
        card.innerHTML = `
            <div class="expert-title-row">
                <span class="expert-name">${exp.name}</span>
                <span class="expert-num">${exp.key}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <span class="expert-queue-indicator" id="exp-queue-${exp.id}">LOAD: 0/${expertCapacityLimit}</span>
            </div>
            <div class="expert-load-bar-container">
                <div class="expert-load-bar" id="exp-bar-${exp.id}"></div>
            </div>
        `;
        
        // Add click listener for mouse routing fallback
        card.addEventListener('click', () => {
            if (!gameActive) return;
            initAudio();
            dispatchRouteSelection(exp.id);
        });

        gridEl.appendChild(card);
    });
}

// Start Game
function startGame() {
    if (gameActive) return;
    initAudio();
    
    gameActive = true;
    logBaseTime = Date.now();
    
    // Clear elements
    const conveyor = document.getElementById('conveyor-track');
    if (conveyor) conveyor.innerHTML = "";
    
    tokensStream = [];
    activeTokenId = 0;
    totalSpawned = 0;
    
    totalRoutedCount = 0;
    correctRoutesCount = 0;
    dropsCount = 0;
    hallucinationsCount = 0;
    routedLatencies = [];

    // Reset FFN Loads
    activeExperts.forEach(exp => exp.load = 0);
    renderExperts();

    // Disable start button, enable reset
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.innerText = "⚡ INFERENCE RUNNING";
        startBtn.classList.add('btn-preset'); // visually dim
    }

    logToTerminal("Sparse Routing Gating initialized.", "system");
    logToTerminal(`Gating Parameters: Interval=${spawnSpeed}s, Temp=${routingNoise.toFixed(1)}, Cap=${expertCapacityLimit}`, "system");
    logToTerminal("Conveyor stream starting...", "info");

    gameStartTime = Date.now();
    updateStats();

    // Start intervals
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameTickLoop, 30); // 30ms for smooth falling

    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnToken, spawnSpeed * 1000);

    // Initial spawn
    spawnToken();
}

// Stop Game
function stopGame(completed = false) {
    gameActive = false;
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (spawnInterval) clearInterval(spawnInterval);

    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.innerText = "⚡ INITIATE STREAM";
        startBtn.classList.remove('btn-preset');
    }

    if (completed) {
        playLevelComplete();
        logToTerminal("Ingestion pipeline completed. Run evaluation locked.", "system");
        showScorecard();
    } else {
        logToTerminal("Simulation terminated by administrator.", "error");
    }
}

function resetGame() {
    stopGame(false);
    
    // Reset FFN Loads
    activeExperts.forEach(exp => exp.load = 0);
    tokensStream = [];
    routedLatencies = [];
    
    const conveyor = document.getElementById('conveyor-track');
    if (conveyor) conveyor.innerHTML = "";

    renderExperts();
    updateStats();

    const history = document.getElementById('log-history');
    if (history) history.innerHTML = "";
    logToTerminal("Gating network reset. Awaiting instructions...", "info");
}

function getRecommendedExperts(type) {
    if (activeExperts.length === 4) {
        if (type === "T") return [1, 4];
        if (type === "M") return [2, 4];
        if (type === "V") return [3, 4];
        if (type === "A") return [3, 4];
        return [2, 4]; // C (Code) -> Math/Code (2) + Generalist (4)
    } else {
        if (type === "T") return [1, 6];
        if (type === "M") return [2, 7];
        if (type === "V") return [3, 7];
        if (type === "A") return [4, 7];
        return [2, 5]; // C (Code) -> Calculator (2) + Compiler (5)
    }
}

// Spawn new token
function spawnToken() {
    if (!gameActive) return;
    if (totalSpawned >= MAX_SPAWNED) {
        clearInterval(spawnInterval); // Stop spawning, wait for existing to clear
        return;
    }

    const types = ["T", "M", "V", "A", "C"];
    const type = types[Math.floor(Math.random() * types.length)];
    const phrases = TOKEN_PHRASES[type];
    const text = phrases[Math.floor(Math.random() * phrases.length)];

    activeTokenId++;
    totalSpawned++;

    const tokenObj = {
        id: activeTokenId,
        type: type,
        text: text,
        yPos: 0, // Starts at top
        selections: [], // Selected FFN experts (Top-2)
        enterZoneTime: null // Track when it crosses the gateway start line
    };

    tokensStream.push(tokenObj);

    const recs = getRecommendedExperts(type);

    // Build DOM
    const conveyor = document.getElementById('conveyor-track');
    if (conveyor) {
        const tokenEl = document.createElement('div');
        tokenEl.className = `token mod-${getModalityName(type)}`;
        tokenEl.id = `token-${tokenObj.id}`;
        tokenEl.style.top = "0px";
        
        const displayStyle = maskHints ? 'display: none;' : '';
        tokenEl.innerHTML = `
            <span class="token-symbol">[${type}]</span>
            <span class="token-name">${text}</span>
            <span class="token-req" id="token-req-${tokenObj.id}" style="margin-left: auto; color: #9ca3af; font-size: 0.68rem; font-family: var(--font-mono); border: 1px solid rgba(255, 255, 255, 0.12); padding: 1px 5px; border-radius: 4px; background: rgba(255, 255, 255, 0.03); white-space: nowrap; ${displayStyle}">Press ${recs[0]},${recs[1]}</span>
        `;
        
        conveyor.appendChild(tokenEl);
    }
}

function getModalityName(type) {
    if (type === "T") return "text";
    if (type === "M") return "math";
    if (type === "V") return "vision";
    if (type === "A") return "audio";
    return "code";
}

// Main Tick Loop (Animation, Evictions, Expert Processing decays)
function gameTickLoop() {
    const conveyorTrackEl = document.getElementById('conveyor-track');
    const trackHeight = conveyorTrackEl ? conveyorTrackEl.clientHeight : 380;
    const gateZoneBottom = trackHeight - 42; // gate line threshold
    const gateZoneTop = gateZoneBottom - routingRunway;

    let updatedTokens = [];
    let activeGateToken = null;

    tokensStream.forEach(tok => {
        // Move down
        tok.yPos += 0.9 * tokenMovementSpeed; // Fall rate scaled by user control

        const tokenEl = document.getElementById(`token-${tok.id}`);
        if (tokenEl) {
            tokenEl.style.top = `${tok.yPos}px`;
            
            // Check if in active routing gate zone
            if (tok.yPos >= gateZoneTop && tok.yPos < gateZoneBottom) {
                tokenEl.classList.add('active-gate');
                // Record entry time to track cognitive latency
                if (!tok.enterZoneTime) {
                    tok.enterZoneTime = Date.now();
                }
                // Capture the oldest token in the gate zone
                if (!activeGateToken) {
                    activeGateToken = tok;
                }
            } else {
                tokenEl.classList.remove('active-gate');
            }
        }

        // Check if exceeded threshold (dropped/timed out)
        if (tok.yPos >= gateZoneBottom) {
            // Evict token
            if (tokenEl) tokenEl.remove();
            
            dropsCount++;
            logToTerminal(`[TIMEOUT] Token #${tok.id} (${tok.type}) passed gate threshold unrouted. Evicted.`, "error");
            playWarn();
        } else {
            updatedTokens.push(tok);
        }
    });

    tokensStream = updatedTokens;

    // Reset card highlight classes on every frame
    activeExperts.forEach(exp => {
        const card = document.getElementById(`expert-card-${exp.id}`);
        if (card) {
            card.classList.remove('recommended-gate');
            card.classList.remove('routing-selected');
        }
    });

    // Apply Highlights for the active gate token
    if (activeGateToken) {
        const recs = getRecommendedExperts(activeGateToken.type);
        
        // Highlight recommended experts (suppressed if hints are masked!)
        if (!maskHints) {
            recs.forEach(expId => {
                const card = document.getElementById(`expert-card-${expId}`);
                if (card && !activeGateToken.selections.includes(expId)) {
                    card.classList.add('recommended-gate');
                }
            });
        }

        // Highlight selected experts (staged first key)
        activeGateToken.selections.forEach(expId => {
            const card = document.getElementById(`expert-card-${expId}`);
            if (card) {
                card.classList.add('routing-selected');
            }
        });
    }

    // Check if stream finished
    if (totalSpawned >= MAX_SPAWNED && tokensStream.length === 0) {
        stopGame(true);
        return;
    }

    // Expert Queue decay over time (processing FFN layers)
    activeExperts.forEach(exp => {
        if (exp.load > 0) {
            // Processing rate: Generalist is slower
            const decayRate = exp.id === 7 ? 0.005 : 0.012; 
            exp.load = Math.max(0, exp.load - decayRate);
        }
    });

    updateExpertsUI();
    updateStats();
}

// Update stats ribbon
function updateStats() {
    const latencyEl = document.getElementById('metric-latency');
    const perplexityEl = document.getElementById('metric-perplexity');
    const dropsEl = document.getElementById('metric-drops');
    const errorsEl = document.getElementById('metric-errors');

    if (latencyEl) {
        if (routedLatencies.length > 0) {
            const avgLatency = routedLatencies.reduce((a, b) => a + b, 0) / routedLatencies.length;
            latencyEl.innerText = `${Math.round(avgLatency)}ms`;
        } else {
            latencyEl.innerText = "0ms";
        }
    }

    if (perplexityEl) {
        // Router Accuracy calculation (inverse of perplexity)
        const perplexityVal = totalRoutedCount > 0 ? Math.round((correctRoutesCount / totalRoutedCount) * 100) : 100;
        perplexityEl.innerText = `${perplexityVal}%`;
    }

    if (dropsEl) {
        dropsEl.innerText = dropsCount;
        dropsEl.className = dropsCount > 0 ? "stat-value highlight-red" : "stat-value";
    }

    if (errorsEl) {
        const errorPct = totalRoutedCount > 0 ? Math.round((hallucinationsCount / totalRoutedCount) * 100) : 0;
        errorsEl.innerText = `${errorPct}%`;
        errorsEl.className = errorPct > 0 ? "stat-value highlight-amber" : "stat-value";
    }
}

// Update Expert load bars
function updateExpertsUI() {
    activeExperts.forEach(exp => {
        const bar = document.getElementById(`exp-bar-${exp.id}`);
        const textVal = document.getElementById(`exp-queue-${exp.id}`);
        const card = document.getElementById(`expert-card-${exp.id}`);

        const loadPct = (exp.load / expertCapacityLimit) * 100;
        
        if (bar) {
            bar.style.width = `${Math.min(100, loadPct)}%`;
            
            // Adjust bar color based on overload
            if (loadPct >= 80) {
                bar.style.backgroundColor = "var(--color-red)";
                bar.style.boxShadow = "0 0 8px var(--color-red-glow)";
            } else if (loadPct >= 50) {
                bar.style.backgroundColor = "var(--color-amber)";
                bar.style.boxShadow = "0 0 8px var(--color-amber-glow)";
            } else {
                bar.style.backgroundColor = "var(--color-green)";
                bar.style.boxShadow = "0 0 8px var(--color-green-glow)";
            }
        }

        if (textVal) {
            textVal.innerText = `LOAD: ${Math.round(exp.load)}/${expertCapacityLimit}`;
        }

        if (card) {
            if (exp.load >= expertCapacityLimit - 0.2) {
                card.classList.add('overload');
            } else {
                card.classList.remove('overload');
            }
        }
    });
}

// Handle routing keyboard / mouse inputs
function dispatchRouteSelection(expId) {
    if (!gameActive) return;

    // Find the oldest token currently inside the active gate zone
    const conveyorTrackEl = document.getElementById('conveyor-track');
    const trackHeight = conveyorTrackEl ? conveyorTrackEl.clientHeight : 380;
    const gateZoneBottom = trackHeight - 42;
    const gateZoneTop = gateZoneBottom - routingRunway;

    const activeToken = tokensStream.find(tok => tok.yPos >= gateZoneTop && tok.yPos < gateZoneBottom);
    if (!activeToken) return; // No token in gating window

    // Visually highlight FFN card selection
    const card = document.getElementById(`expert-card-${expId}`);
    if (card) {
        card.classList.add('hotkey-selected');
        setTimeout(() => card.classList.remove('hotkey-selected'), 120);
    }

    // Skip if expert already selected for this token
    if (activeToken.selections.includes(expId)) return;

    activeToken.selections.push(expId);
    playTick();

    const reqEl = document.getElementById(`token-req-${activeToken.id}`);
    if (reqEl) {
        reqEl.innerText = `Staged: ${expId}`;
        reqEl.style.borderColor = "var(--color-cyan)";
        reqEl.style.color = "var(--color-cyan)";
    }

    // Trigger router evaluation once Top-2 sparse indices are collected
    if (activeToken.selections.length === 2) {
        evaluateRouting(activeToken);
    }
}

// Evaluate routing correctness & capacity limits
function evaluateRouting(tok) {
    const expA = activeExperts.find(e => e.id === tok.selections[0]);
    const expB = activeExperts.find(e => e.id === tok.selections[1]);

    if (!expA || !expB) return;

    // Remove token immediately from DOM
    const tokenEl = document.getElementById(`token-${tok.id}`);
    if (tokenEl) tokenEl.remove();
    tokensStream = tokensStream.filter(t => t.id !== tok.id);

    totalRoutedCount++;

    // Record routing latency (since entering the gateway line)
    if (tok.enterZoneTime) {
        const latencyVal = Date.now() - tok.enterZoneTime;
        routedLatencies.push(latencyVal);
    }

    // Calculate routing accuracy based on expert suitability
    let correctExpertsCount = 0;
    let containsHallucinator = false;

    [expA, expB].forEach(exp => {
        if (exp.id === 8) {
            containsHallucinator = true;
        } else if (exp.accepts.includes(tok.type)) {
            correctExpertsCount++;
        }
    });

    // Check FFN capacity load limits (both selected experts must have room)
    const capAOverloaded = expA.load >= expertCapacityLimit;
    const capBOverloaded = expB.load >= expertCapacityLimit;

    if (capAOverloaded || capBOverloaded) {
        // Capacity Bottleneck! Token is dropped.
        dropsCount++;
        logToTerminal(`[OVERLOAD] Expert Queue Congestion! Token #${tok.id} (${tok.type}) dropped.`, "error");
        playWarn();
        updateStats();
        return;
    }

    // Increase expert FFN load
    expA.load = Math.min(expertCapacityLimit, expA.load + 1);
    expB.load = Math.min(expertCapacityLimit, expB.load + 1);

    // Apply score additions
    if (containsHallucinator) {
        hallucinationsCount++;
        logToTerminal(`[HALLUCINATION] Token #${tok.id} (${tok.type}) processed by Hallucinator wildcard. Error rate spiked.`, "warn");
        playWarn();
    } else if (correctExpertsCount === 2) {
        correctRoutesCount++;
        logToTerminal(`[ROUTE] Token #${tok.id} successfully routed to FFNs #${expA.id} & #${expB.id}. Accuracy: 100%`, "info");
        playCorrect();
    } else if (correctExpertsCount === 1) {
        // Partial accuracy (50%)
        correctRoutesCount += 0.5;
        logToTerminal(`[ROUTE] Token #${tok.id} routed with partial accuracy to FFNs #${expA.id} & #${expB.id}. Accuracy: 50%`, "warn");
        playCorrect();
    } else {
        // Zero accuracy
        logToTerminal(`[ROUTE] Misaligned Gating! Routed token #${tok.id} to incorrect experts #${expA.id} & #${expB.id}. Accuracy: 0%`, "error");
        playWarn();
    }

    updateStats();
}

// Keyboard Bindings
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    // Map keys 1-8 to FFN dispatch selections
    const key = e.key;
    if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
        initAudio();
        const expId = parseInt(key);
        dispatchRouteSelection(expId);
    }
});

// Scorecard Modal
function showScorecard() {
    const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const finalTPS = elapsed > 0 ? (totalRoutedCount / elapsed) : 0;
    
    const accuracyVal = totalRoutedCount > 0 ? Math.round((correctRoutesCount / totalRoutedCount) * 100) : 0;
    const errorPct = totalRoutedCount > 0 ? Math.round((hallucinationsCount / totalRoutedCount) * 100) : 0;

    const isPerfect = accuracyVal >= 85 && errorPct < 10 && dropsCount < 3;

    // Status Message
    const statusMsg = document.getElementById('share-status-message');
    if (statusMsg) {
        if (isPerfect) {
            statusMsg.innerHTML = `<span style="color: var(--color-green); font-weight: bold;">🎉 ROUTER BALANCED: Coherent Generation achieved!</span> High routing accuracy maintained without system congestion.`;
        } else {
            statusMsg.innerHTML = `<span style="color: var(--color-red); font-weight: bold;">⚠️ ROUTER FAILURE: Perplexity Collapse!</span> Bottlenecks, hallucinations, or dropped tokens degraded the output matrix.`;
        }
    }

    // Config Preset Name
    let activePreset = "Local 8x7B";
    if (spawnSpeed === 4.2) activePreset = "Edge Toaster";
    else if (spawnSpeed === 5.0) activePreset = "DataCenter";

    // Text box share
    const shareText = `📟 THE GATING CRISIS: MoE ROUTER SCORECARD 🧠
"Sparse Expert Dispatch Edition"

⚙️ Gating Config:
├─ Hardware Preset: ${activePreset} (${activeExperts.length} Experts)
├─ Spawn Rate: ${spawnSpeed}s
├─ Movement Speed: ${tokenMovementSpeed.toFixed(1)}x
├─ Gateway Runway: ${routingRunway}px
├─ Routing Temp (Noise): ${routingNoise.toFixed(1)}
└─ Expert Capacity: ${expertCapacityLimit}

📊 Router Diagnostics:
├─ Total Routed Tokens: ${totalRoutedCount}/${MAX_SPAWNED}
├─ Gating Accuracy: ${accuracyVal}%
├─ Capacity Overflows (Drops): ${dropsCount}
├─ Output Error Rate: ${errorPct}%
└─ Avg Routing Latency: ${routedLatencies.length > 0 ? Math.round(routedLatencies.reduce((a,b)=>a+b,0)/routedLatencies.length) : 0}ms

"The gating network is the gateway to sanity."
🚀 Test your routing limits here: https://llms-are-demented-90043718455.us-central1.run.app/`;

    const previewBox = document.getElementById('share-preview');
    if (previewBox) {
        previewBox.innerText = shareText;
    }

    const shareModal = document.getElementById('modal-share');
    if (shareModal) shareModal.classList.add('active');
}

// Copy Scorecard
function copyScoreClipboard() {
    const previewBox = document.getElementById('share-preview');
    if (!previewBox) return;
    
    initAudio();
    navigator.clipboard.writeText(previewBox.innerText)
        .then(() => {
            const btn = document.getElementById('btn-copy-clipboard');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "📋 COPIED!";
                setTimeout(() => btn.innerText = originalText, 1500);
            }
        })
        .catch(err => console.error("Clipboard copy failed", err));
}

// Modal Toggle Handlers
function openHowToModal() {
    initAudio();
    const modal = document.getElementById('modal-howto');
    if (modal) modal.classList.add('active');
}

function closeHowToModal() {
    initAudio();
    const modal = document.getElementById('modal-howto');
    if (modal) modal.classList.remove('active');
}

function closeShareModal() {
    initAudio();
    const modal = document.getElementById('modal-share');
    if (modal) modal.classList.remove('active');
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    renderExperts();
    
    // Sliders Event Bindings
    const sliderSpeed = document.getElementById('slider-speed');
    const valSpeed = document.getElementById('val-speed');
    if (sliderSpeed) {
        sliderSpeed.addEventListener('input', () => {
            spawnSpeed = parseFloat(sliderSpeed.value);
            valSpeed.innerText = `${spawnSpeed}s`;
            
            // Re-create the spawn interval dynamically if the game is active
            if (gameActive) {
                clearInterval(spawnInterval);
                spawnInterval = setInterval(spawnToken, spawnSpeed * 1000);
            }
        });
    }

    const sliderNoise = document.getElementById('slider-noise');
    const valNoise = document.getElementById('val-noise');
    if (sliderNoise) {
        sliderNoise.addEventListener('input', () => {
            routingNoise = parseFloat(sliderNoise.value);
            valNoise.innerText = routingNoise.toFixed(1);
        });
    }

    const sliderCapacity = document.getElementById('slider-capacity');
    const valCapacity = document.getElementById('val-capacity');
    if (sliderCapacity) {
        sliderCapacity.addEventListener('input', () => {
            expertCapacityLimit = parseInt(sliderCapacity.value);
            valCapacity.innerText = expertCapacityLimit;
            renderExperts(); // Re-render to update capacity text limits
        });
    }

    const sliderExperts = document.getElementById('slider-experts-count');
    const valExperts = document.getElementById('val-experts-count');
    if (sliderExperts) {
        sliderExperts.addEventListener('input', () => {
            if (gameActive) {
                sliderExperts.value = activeExperts.length; // Lock slider during active inference runs
                return;
            }
            const count = parseInt(sliderExperts.value);
            valExperts.innerText = count;
            
            if (count === 4) {
                activeExperts = [...EXPERTS_4];
                logToTerminal("Switched routing architecture to 4-Expert (Simplified)...", "system");
            } else {
                activeExperts = [...EXPERTS_8];
                logToTerminal("Switched routing architecture to 8-Expert (Enterprise)...", "system");
            }
            
            // Sync FFN Loads reset
            activeExperts.forEach(exp => exp.load = 0);
            renderExperts();
        });
    }

    const toggleHints = document.getElementById('toggle-hints');
    if (toggleHints) {
        toggleHints.addEventListener('change', () => {
            maskHints = toggleHints.checked;
            logToTerminal(`Routing hints ${maskHints ? 'MASKED' : 'UNMASKED'}.`, "system");
        });
    }

    const sliderMove = document.getElementById('slider-movement-speed');
    const valMove = document.getElementById('val-movement-speed');
    if (sliderMove) {
        sliderMove.addEventListener('input', () => {
            tokenMovementSpeed = parseFloat(sliderMove.value);
            valMove.innerText = `${tokenMovementSpeed.toFixed(1)}x`;
        });
    }

    const sliderRunway = document.getElementById('slider-runway');
    const valRunway = document.getElementById('val-runway');
    if (sliderRunway) {
        sliderRunway.addEventListener('input', () => {
            if (gameActive) {
                sliderRunway.value = routingRunway; // Lock during active inference
                return;
            }
            routingRunway = parseInt(sliderRunway.value);
            valRunway.innerText = `${routingRunway}px`;
            const activeLine = document.querySelector('.router-active-line');
            if (activeLine) {
                activeLine.style.bottom = `${42 + routingRunway}px`;
            }
        });
    }

    // Set initial active line position
    const activeLine = document.querySelector('.router-active-line');
    if (activeLine) {
        activeLine.style.bottom = `${42 + routingRunway}px`;
    }
});
