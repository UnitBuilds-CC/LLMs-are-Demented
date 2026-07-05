// SYS_05 // TOKEN_FACTORY - Inference Pipeline Tycoon Game Engine

// --- Audio Synthesizer Engine (Web Audio API) ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(freq, duration, type = 'sine', vol = 0.1) {
    if (!soundEnabled) return;
    initAudio();
    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context blocked or failed to initialize", e);
    }
}

function playBleep(freq, dur = 0.1, type = "sine", vol = 0.05) {
    playSound(freq, dur, type, vol);
}

function playOomSound() {
    playBleep(150, 0.4, 'sawtooth', 0.15);
    setTimeout(() => playBleep(80, 0.5, 'sawtooth', 0.2), 100);
}

function playVictorySound() {
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
    notes.forEach((freq, idx) => {
        setTimeout(() => playBleep(freq, 0.25, 'triangle', 0.08), idx * 120);
    });
}

// --- Game Configurations & Level Data ---
const GRID_COLS = 12;
const GRID_ROWS = 8;
const TILE_SIZE = 50;

const levels = {
    1: {
        id: 1,
        title: "LEVEL 01 // PREFILL & DECODE",
        desc: "Build a standard autoregressive transformer pipeline. Route raw user queries from the Queue into a Prefill Engine, then link the output activations to a Decode Engine to generate token streams.",
        targetTps: 30.0,
        maxVram: 4096,
        unlocked: ["conduit", "source", "prefill", "decode", "sink"],
        spawnRate: 40, // Spawns request every 40 frames (~0.66s)
        promptSize: 32 // Average tokens per prompt
    },
    2: {
        id: 2,
        title: "LEVEL 02 // KV-CACHE PAGED MEMORY",
        desc: "Large prompt sequences are arriving. Running them directly will trigger CUDA Out-of-Memory (OOM) faults. Connect virtual KV-Cache Page Allocators (vLLM style) adjacent to prefill/decode engines to compress VRAM allocations.",
        targetTps: 60.0,
        maxVram: 3072,
        unlocked: ["conduit", "source", "prefill", "decode", "vllm", "sink"],
        spawnRate: 45, // Spawns request every 45 frames per source
        promptSize: 96
    },
    3: {
        id: 3,
        title: "LEVEL 03 // SPECULATIVE SPEEDUP",
        desc: "High volume pipeline. Basic autoregressive generation is too slow to hit the 95 TPS client target. Integrate a cheap Speculative Drafter and a Validation Gate to validate 3 tokens in parallel per step.",
        targetTps: 95.0,
        maxVram: 5120,
        unlocked: ["conduit", "source", "prefill", "decode", "vllm", "drafter", "validator", "sink"],
        spawnRate: 50, // Spawns request every 50 frames per source
        promptSize: 64
    }
};

const TOOLBOX_METADATA = {
    "conduit": {
        name: "Wire Conduit",
        type: "conduit",
        desc: "Connects pipeline engines and routes token data packets. Left-click placed wires to rotate direction.",
        cost: "N/A",
        vram: "0 MB",
        iconColor: "#9ca3af"
    },
    "source": {
        name: "Input Queue",
        type: "source",
        desc: "Receives user request prompts. Periodically outputs prompt data chunks.",
        cost: "VRAM: 0 MB",
        vram: "0 MB",
        iconColor: "#00ff66"
    },
    "prefill": {
        name: "Prefill Core",
        type: "prefill",
        desc: "Processes prompt inputs and computes initial Attention matrix. High initial VRAM cost.",
        cost: "VRAM: 128 MB/act",
        vram: "128 MB per active query",
        iconColor: "#ff007f"
    },
    "decode": {
        name: "Decode Core",
        type: "decode",
        desc: "Autoregressively predicts next tokens one-by-one. Memory-bound layer requiring active KV-Cache blocks.",
        cost: "VRAM: 32 MB/token",
        vram: "32 MB per generated token",
        iconColor: "#00f0ff"
    },
    "vllm": {
        name: "Page Allocator",
        type: "vllm",
        desc: "vLLM-style virtual paged memory manager. Reduces VRAM usage of adjacent engines by 40%.",
        cost: "Reduces adjacent VRAM by 40%",
        vram: "0 MB",
        iconColor: "#ffcc00"
    },
    "drafter": {
        name: "Draft model",
        type: "drafter",
        desc: "Fast, small speculative drafting model. Generates 3 draft tokens in parallel before verification.",
        cost: "VRAM: 16 MB/token",
        vram: "16 MB per draft token",
        iconColor: "#aa00ff"
    },
    "validator": {
        name: "Validation Gate",
        type: "validator",
        desc: "Verifies drafted tokens in parallel. Accepted sequences proceed; rejections are flushed.",
        cost: "Validates 3 draft tokens in 1 step",
        vram: "0 MB",
        iconColor: "#ff3366"
    },
    "sink": {
        name: "Output Port",
        type: "sink",
        desc: "Receives finalized sequences and delivers them to the client. Measures overall TPS.",
        cost: "N/A",
        vram: "0 MB",
        iconColor: "#00f0ff"
    }
};

// --- Game State Globals ---
let activeLevel = levels[1];
let currentLevelIndex = 1;
let grid = [];
let packets = [];
let particles = [];
let selectedTool = "conduit";
let running = false;
let isPaused = false;
let simulationSpeed = 1;

let tps = 0;
let ttft = 0;
let vramUsage = 0;
let maxVramLimit = 4096;
let speculativeAcceptance = 0;

let totalTokensDelivered = 0;
let totalRequestsProcessed = 0;
let totalLatencyAccumulated = 0;
let deliveryTicks = [];

let speculativeDraftedCount = 0;
let speculativeAcceptedCount = 0;

let gameTime = 0;
let spawnTimer = 0;

let dragStart = null;
let activeHoverCell = null;

// --- Node Component Classes ---
class ComponentNode {
    constructor(type, row, col, direction = 0) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.direction = direction; // 0 = Right, 1 = Down, 2 = Left, 3 = Up
        this.cooldown = 0;
        this.activeRequests = []; // Track request objects being computed
        this.inputBuffer = []; // Queued data packets
        this.isPaged = false; // Is this engine boosted by a Page Allocator?
    }

    rotate() {
        if (this.type === "conduit" || this.type === "source" || this.type === "sink") {
            this.direction = (this.direction + 1) % 4;
            playBleep(600, 0.05, "sine", 0.03);
            return true;
        }
        return false;
    }
}

class TokenPacket {
    constructor(x, y, type, targetRow, targetCol, data) {
        this.x = x;
        this.y = y;
        this.type = type; // "prompt", "activation", "token", "draft", "validation_fail"
        this.targetRow = targetRow;
        this.targetCol = targetCol;
        this.data = data || {};
        this.speed = 3;
        this.color = this.assignColor();
    }

    assignColor() {
        switch (this.type) {
            case "prompt": return "#00ff66";
            case "activation": return "#ff007f";
            case "token": return "#00f0ff";
            case "draft": return "#aa00ff";
            case "validation_fail": return "#ff3366";
            default: return "#ffffff";
        }
    }
}

class Particle {
    constructor(x, y, color, size, vx, vy, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
}

// --- Grid Map Initialization & Toolbox setup ---
function initGrid() {
    grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        const row = [];
        for (let c = 0; c < GRID_COLS; c++) {
            row.push(null);
        }
        grid.push(row);
    }
    packets = [];
    particles = [];
}

function loadLevel(lvlId) {
    currentLevelIndex = lvlId;
    activeLevel = levels[lvlId];
    maxVramLimit = activeLevel.maxVram;
    
    // Reset simulation metrics
    running = false;
    document.getElementById('btn-simulate').classList.remove('hidden');
    document.getElementById('btn-stop').classList.add('hidden');
    document.getElementById('txt-sim-state').innerText = "STATUS: CONFIGURING";
    document.getElementById('txt-sim-state').className = "simulation-state";

    tps = 0;
    ttft = 0;
    vramUsage = 0;
    speculativeAcceptance = 0;
    totalTokensDelivered = 0;
    totalRequestsProcessed = 0;
    totalLatencyAccumulated = 0;
    deliveryTicks = [];
    speculativeDraftedCount = 0;
    speculativeAcceptedCount = 0;
    gameTime = 0;
    spawnTimer = 0;

    initGrid();
    setupToolbox();
    updateTelemetryUI();

    // Set Level Details HUD text
    document.getElementById('lbl-level-title').innerText = activeLevel.title;
    document.getElementById('txt-level-desc').innerText = activeLevel.desc;
    document.getElementById('lbl-target-tps').innerText = activeLevel.targetTps.toFixed(1);
    document.getElementById('lbl-max-vram').innerText = activeLevel.maxVram + " MB";
    const tpsTargetHUD = document.getElementById('txt-tps-target');
    if (tpsTargetHUD) {
        tpsTargetHUD.innerText = `Target: ${activeLevel.targetTps.toFixed(1)} TPS`;
    }

    // Setup initial spawn queue and output ports based on level design
    if (lvlId === 1) {
        // Level 1: Source at (0,3), Output at (11,3)
        grid[3][0] = new ComponentNode("source", 3, 0, 0); // Spawner faces Right
        grid[3][11] = new ComponentNode("sink", 3, 11);
    } else if (lvlId === 2) {
        // Level 2: Double inputs for higher memory load
        grid[2][0] = new ComponentNode("source", 2, 0, 0);
        grid[5][0] = new ComponentNode("source", 5, 0, 0);
        grid[3][11] = new ComponentNode("sink", 3, 11);
        grid[4][11] = new ComponentNode("sink", 4, 11);
    } else if (lvlId === 3) {
        // Level 3: Multiple inputs, wide channels
        grid[1][0] = new ComponentNode("source", 1, 0, 0);
        grid[3][0] = new ComponentNode("source", 3, 0, 0);
        grid[6][0] = new ComponentNode("source", 6, 0, 0);
        grid[2][11] = new ComponentNode("sink", 2, 11);
        grid[5][11] = new ComponentNode("sink", 5, 11);
    }

    renderGrid();
}

function setupToolbox() {
    const container = document.getElementById('toolbox-container');
    container.innerHTML = "";

    Object.keys(TOOLBOX_METADATA).forEach(key => {
        const meta = TOOLBOX_METADATA[key];
        const isUnlocked = activeLevel.unlocked.includes(key);
        
        // Exclude system anchors (source/sink) from toolbox placing inventory
        if (key === "source" || key === "sink") return;

        const card = document.createElement('div');
        card.className = `toolbox-card ${isUnlocked ? '' : 'locked'} ${selectedTool === key ? 'active' : ''}`;
        card.dataset.tool = key;
        
        // Custom color glyph for retro icon
        card.innerHTML = `
            <div class="tool-icon" style="background: ${meta.iconColor}; border-radius: 4px; box-shadow: 0 0 8px ${meta.iconColor}55;"></div>
            <div class="tool-name">${meta.name}</div>
        `;

        if (isUnlocked) {
            card.onclick = () => {
                selectedTool = key;
                document.querySelectorAll('.toolbox-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                playBleep(800, 0.05, "sine", 0.04);
                updateDescriptionPanel(key);
            };
        }
        container.appendChild(card);
    });

    // Default describe conduit
    updateDescriptionPanel(selectedTool);
}

function updateDescriptionPanel(key) {
    const meta = TOOLBOX_METADATA[key];
    document.getElementById('info-name').innerText = meta.name;
    document.getElementById('info-type').innerText = meta.type.toUpperCase();
    document.getElementById('info-desc').innerText = meta.desc;

    // Fill stats rows
    const statsContainer = document.getElementById('info-stats');
    statsContainer.innerHTML = `
        <div class="stat-row">
            <span>VRAM ALLOCATION:</span>
            <span>${meta.vram}</span>
        </div>
        <div class="stat-row">
            <span>UPGRADE PARAMETER:</span>
            <span class="text-cyan">${meta.cost}</span>
        </div>
    `;
}

// --- Game Logic update loops ---
function startSimulation() {
    initAudio();
    running = true;
    
    // Cleanly reset runtime counters on each new run
    gameTime = 0;
    spawnTimer = 0;
    totalTokensDelivered = 0;
    totalRequestsProcessed = 0;
    totalLatencyAccumulated = 0;
    deliveryTicks = [];
    speculativeDraftedCount = 0;
    speculativeAcceptedCount = 0;
    tps = 0;
    ttft = 0;
    speculativeAcceptance = 0;

    const btnSimulate = document.getElementById('btn-simulate');
    if (btnSimulate) btnSimulate.classList.add('hidden');
    const btnStop = document.getElementById('btn-stop');
    if (btnStop) btnStop.classList.remove('hidden');
    const simState = document.getElementById('txt-sim-state');
    if (simState) {
        simState.innerText = "STATUS: RUNNING";
        simState.className = "simulation-state text-green";
    }
    
    // Clear dynamic runtime particles
    packets = [];
    particles = [];
    
    // Clear queues of nodes
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const node = grid[r][c];
            if (node) {
                node.inputBuffer = [];
                node.activeRequests = [];
                node.cooldown = 0;
            }
        }
    }
    
    playBleep(523.25, 0.15, 'triangle', 0.08); // Start bleep
}

function stopSimulation() {
    running = false;
    document.getElementById('btn-simulate').classList.remove('hidden');
    document.getElementById('btn-stop').classList.add('hidden');
    document.getElementById('txt-sim-state').innerText = "STATUS: CONFIGURING";
    document.getElementById('txt-sim-state').className = "simulation-state";
    
    tps = 0;
    vramUsage = 0;
    updateTelemetryUI();
    
    playBleep(392, 0.12, 'triangle', 0.05);
}

function triggerOomCrash() {
    running = false;
    playOomSound();
    document.getElementById('oom-overlay').classList.remove('hidden');
}

function triggerVictory() {
    running = false;
    playVictorySound();
    
    // Update victory stats
    document.getElementById('vic-tps').innerText = tps.toFixed(1) + " TPS";
    document.getElementById('vic-ttft').innerText = Math.round(ttft) + " MS";
    document.getElementById('vic-vram').innerText = Math.round(vramUsage) + " MB";
    
    // Unlock next level card
    if (currentLevelIndex < 3) {
        const nextCard = document.getElementById(`card-lvl-${currentLevelIndex + 1}`);
        if (nextCard) nextCard.classList.remove('locked');
    }
    
    document.getElementById('victory-overlay').classList.remove('hidden');
}

function updateSimulation() {
    if (!running) return;

    // Run loops depending on simulation speeds (1x, 2x, 4x)
    for (let loop = 0; loop < simulationSpeed; loop++) {
        gameTime++;

        // 1. Spawning prompt input queries from Queue Source nodes
        spawnTimer++;
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const node = grid[r][c];
                if (node && node.type === "source") {
                    node.cooldown--;
                    if (node.cooldown <= 0) {
                        node.cooldown = activeLevel.spawnRate;
                        
                        // Output a prompt request packet along its facing direction
                        const targetCell = getNextCell(r, c, node.direction);
                        if (targetCell) {
                            packets.push(new TokenPacket(
                                (c + 0.5) * TILE_SIZE, 
                                (r + 0.5) * TILE_SIZE, 
                                "prompt", 
                                targetCell.r, 
                                targetCell.c, 
                                { promptTokens: activeLevel.promptSize, remainingDecode: activeLevel.promptSize }
                            ));
                            playBleep(600, 0.03, "sine", 0.02);
                        }
                    }
                }
            }
        }

        // 2. Check adjacent virtual Page Allocators (vllm) for all Prefill/Decode engines
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const node = grid[r][c];
                if (node && (node.type === "prefill" || node.type === "decode")) {
                    // Check neighbors for a page allocator
                    let hasPager = false;
                    const neighbors = getNeighbors(r, c);
                    neighbors.forEach(n => {
                        const neighborNode = grid[n.r][n.c];
                        if (neighborNode && neighborNode.type === "vllm") {
                            hasPager = true;
                        }
                    });
                    node.isPaged = hasPager;
                }
            }
        }

        // 3. Process data packets movement along conduits
        for (let i = packets.length - 1; i >= 0; i--) {
            const p = packets[i];
            const targetX = (p.targetCol + 0.5) * TILE_SIZE;
            const targetY = (p.targetRow + 0.5) * TILE_SIZE;
            
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = Math.hypot(dx, dy);

            if (dist < p.speed) {
                p.x = targetX;
                p.y = targetY;
                
                // Packet reached target cell! Load into target component node's input buffer
                const targetNode = grid[p.targetRow][p.targetCol];
                if (targetNode) {
                    targetNode.inputBuffer.push(p);
                    packets.splice(i, 1);
                } else {
                    // Discard packets flying into empty space
                    packets.splice(i, 1);
                }
            } else {
                // Move packet forward
                p.x += (dx / dist) * p.speed;
                p.y += (dy / dist) * p.speed;
            }
        }

        // 4. Update inference engines state machine
        vramUsage = 0;
        let activeDecodeEngines = 0;

        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const node = grid[r][c];
                if (!node) continue;

                // A. Prefill Engine Processing
                if (node.type === "prefill") {
                    // Check if new packets are ready in inputBuffer
                    if (node.inputBuffer.length > 0 && node.activeRequests.length < 4) {
                        const packet = node.inputBuffer.shift();
                        if (packet.type === "prompt") {
                            node.activeRequests.push({
                                tokensLeft: packet.data.promptTokens,
                                originalSize: packet.data.promptTokens,
                                startTick: gameTime
                            });
                        }
                    }

                    // Process active requests
                    for (let idx = node.activeRequests.length - 1; idx >= 0; idx--) {
                        const req = node.activeRequests[idx];
                        
                        // Prefill processing: consume 4 tokens per tick
                        req.tokensLeft -= 4;
                        
                        // Calculate VRAM footprint
                        const baseCost = 128; // 128 MB per active prefill query
                        const pageFactor = node.isPaged ? 0.6 : 1.0;
                        vramUsage += baseCost * pageFactor;

                        if (req.tokensLeft <= 0) {
                            // Prefill complete! Send activation block downstream (all directions or facing? Conduits handle it)
                            const neighbors = getAdjacentConduits(r, c);
                            if (neighbors.length > 0) {
                                // Route activation to nearest conduit
                                const dest = neighbors[Math.floor(Math.random() * neighbors.length)];
                                packets.push(new TokenPacket(
                                    (c + 0.5) * TILE_SIZE, 
                                    (r + 0.5) * TILE_SIZE, 
                                    "activation", 
                                    dest.r, 
                                    dest.c, 
                                    { promptSize: req.originalSize, startTick: req.startTick }
                                ));
                                playBleep(800, 0.05, "triangle", 0.04);
                            }
                            node.activeRequests.splice(idx, 1);
                        }
                    }
                }

                // B. Decode Engine Processing
                else if (node.type === "decode") {
                    // Check if new activations are in buffer
                    if (node.inputBuffer.length > 0 && node.activeRequests.length < 8) {
                        const packet = node.inputBuffer.shift();
                        if (packet.type === "activation") {
                            node.activeRequests.push({
                                tokensToGen: Math.floor(15 + Math.random() * 25), // Generate 15-40 tokens
                                generated: 0,
                                startTick: packet.data.startTick
                            });
                            
                            // Measure Time to First Token (TTFT)
                            const latency = gameTime - packet.data.startTick;
                            totalLatencyAccumulated += latency;
                            totalRequestsProcessed++;
                            ttft = totalLatencyAccumulated / totalRequestsProcessed * 10; // Scaled to MS
                        }
                    }

                    // Autoregressive generation
                    node.cooldown--;
                    if (node.cooldown <= 0 && node.activeRequests.length > 0) {
                        // Base decode delay: generate a token every 2 frames
                        node.cooldown = 2; 
                        
                        // Check if speculative drafter is adjacent to boost speed!
                        let speculativeDrafter = null;
                        const neighbors = getNeighbors(r, c);
                        neighbors.forEach(n => {
                            const neighborNode = grid[n.r][n.c];
                            if (neighborNode && neighborNode.type === "drafter") {
                                speculativeDrafter = neighborNode;
                            }
                        });

                        const req = node.activeRequests[0];
                        const conduits = getAdjacentConduits(r, c);

                        if (conduits.length > 0 && req) {
                            const dest = conduits[Math.floor(Math.random() * conduits.length)];
                            
                            if (speculativeDrafter) {
                                // Speculative Decoding Mode: Draft 3 tokens in parallel!
                                speculativeDraftedCount += 3;
                                packets.push(new TokenPacket(
                                    (c + 0.5) * TILE_SIZE, 
                                    (r + 0.5) * TILE_SIZE, 
                                    "draft", 
                                    dest.r, 
                                    dest.c, 
                                    { startTick: req.startTick, count: 3, srcRow: r, srcCol: c }
                                ));
                                req.generated += 3;
                                playBleep(900, 0.03, "sine", 0.05);
                            } else {
                                // Standard Autoregressive Mode: 1 token generated
                                packets.push(new TokenPacket(
                                    (c + 0.5) * TILE_SIZE, 
                                    (r + 0.5) * TILE_SIZE, 
                                    "token", 
                                    dest.r, 
                                    dest.c, 
                                    { startTick: req.startTick }
                                ));
                                req.generated++;
                                playBleep(700, 0.03, "sine", 0.03);
                            }

                            if (req.generated >= req.tokensToGen) {
                                node.activeRequests.shift(); // Finished sequence!
                            }
                        }
                    }

                    // Calculate VRAM footprint for decoding
                    if (node.activeRequests.length > 0) {
                        activeDecodeEngines++;
                        const baseCost = 64 * node.activeRequests.length;
                        const pageFactor = node.isPaged ? 0.60 : 1.0;
                        vramUsage += baseCost * pageFactor;
                    }
                }

                // C. Speculative Drafter Core
                else if (node.type === "drafter") {
                    // Small footprint model adds minor constant overhead
                    vramUsage += node.isPaged ? 120 : 200;
                }

                // D. Validation Gate Processing
                else if (node.type === "validator") {
                    if (node.inputBuffer.length > 0) {
                        const packet = node.inputBuffer.shift();
                        if (packet.type === "draft") {
                            const conduits = getAdjacentConduits(r, c);
                            if (conduits.length > 0) {
                                // Speculative acceptance probability check for telemetry feedback
                                const acceptanceRate = activeLevel.id === 1 ? 0.90 : (activeLevel.id === 2 ? 0.75 : 0.80);
                                let simulatedAccepted = 0;
                                for (let t = 0; t < packet.data.count; t++) {
                                    if (Math.random() < acceptanceRate) {
                                        simulatedAccepted++;
                                    } else {
                                        break; // Telemetry reflects first mismatch halt
                                    }
                                }
                                speculativeAcceptedCount += simulatedAccepted;
                                speculativeAcceptance = (speculativeAcceptedCount / speculativeDraftedCount) * 100;

                                // Functionally forward all drafted tokens to prevent queue race conditions
                                let acceptedCount = packet.data.count;

                                // Send accepted tokens forward
                                for (let a = 0; a < acceptedCount; a++) {
                                    const dest = conduits[Math.floor(Math.random() * conduits.length)];
                                    packets.push(new TokenPacket(
                                        (c + 0.5) * TILE_SIZE, 
                                        (r + 0.5) * TILE_SIZE, 
                                        "token", 
                                        dest.r, 
                                        dest.c, 
                                        { startTick: packet.data.startTick }
                                    ));
                                }

                                // Send rollback signal particles if rejection occurred
                                if (acceptedCount < packet.data.count) {
                                    const rejectedCount = packet.data.count - acceptedCount;
                                    // Rollback the Decode Core progress
                                    if (packet.data.srcRow !== undefined && packet.data.srcCol !== undefined) {
                                        const srcNode = grid[packet.data.srcRow][packet.data.srcCol];
                                        if (srcNode && srcNode.type === "decode" && srcNode.activeRequests.length > 0) {
                                            srcNode.activeRequests[0].generated -= rejectedCount;
                                            if (srcNode.activeRequests[0].generated < 0) {
                                                srcNode.activeRequests[0].generated = 0;
                                            }
                                        }
                                    }
                                    // Spawn validation fail warning particles
                                    for (let k = 0; k < 6; k++) {
                                        particles.push(new Particle(
                                            (c + 0.5) * TILE_SIZE, 
                                            (r + 0.5) * TILE_SIZE, 
                                            "#ff3366", 
                                            3, 
                                            (Math.random() - 0.5) * 4, 
                                            (Math.random() - 0.5) * 4, 
                                            15
                                        ));
                                    }
                                    playBleep(300, 0.1, "sawtooth", 0.04);
                                }
                            }
                        } else {
                            // Forward standard tokens straight through
                            const conduits = getAdjacentConduits(r, c);
                            if (conduits.length > 0) {
                                const dest = conduits[Math.floor(Math.random() * conduits.length)];
                                packet.targetRow = dest.r;
                                packet.targetCol = dest.c;
                                packet.x = (c + 0.5) * TILE_SIZE;
                                packet.y = (r + 0.5) * TILE_SIZE;
                                packets.push(packet);
                            }
                        }
                    }
                }

                // E. Wire Conduits forwarding
                else if (node.type === "conduit") {
                    if (node.inputBuffer.length > 0) {
                        const packet = node.inputBuffer.shift();
                        
                        // Move packet along wire facing direction
                        const next = getNextCell(r, c, node.direction);
                        if (next) {
                            packet.targetRow = next.r;
                            packet.targetCol = next.c;
                            packet.x = (c + 0.5) * TILE_SIZE;
                            packet.y = (r + 0.5) * TILE_SIZE;
                            packets.push(packet);
                        }
                    }
                }

                // F. Deliver tokens to Output Port Sink
                else if (node.type === "sink") {
                    if (node.inputBuffer.length > 0) {
                        const packet = node.inputBuffer.shift();
                        if (packet.type === "token") {
                            totalTokensDelivered++;
                            deliveryTicks.push(performance.now());
                            playBleep(1000, 0.02, "sine", 0.03); // Pop click
                            
                            // Spawn successful delivery tiny particles
                            for (let p = 0; p < 3; p++) {
                                particles.push(new Particle(
                                    (c + 0.5) * TILE_SIZE, 
                                    (r + 0.5) * TILE_SIZE, 
                                    "#00f0ff", 
                                    1.5, 
                                    (Math.random() - 0.5) * 3, 
                                    (Math.random() - 0.5) * 3, 
                                    12
                                ));
                            }
                        }
                    }
                }
            }
        }

        // Calculate rolling throughput (TPS) over last 5 seconds (5000ms real time)
        const now = performance.now();
        while (deliveryTicks.length > 0 && deliveryTicks[0] < now - 5000) {
            deliveryTicks.shift();
        }
        tps = deliveryTicks.length / 5;
        
        // 5. Check for VRAM CUDA OOM Limits
        if (vramUsage > maxVramLimit) {
            triggerOomCrash();
            return;
        }

        // 6. Check for victory conditions (TPS target sustained)
        if (gameTime > 600 && tps >= activeLevel.targetTps) {
            triggerVictory();
            return;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    }

    updateTelemetryUI();
}

function updateTelemetryUI() {
    document.getElementById('txt-tps').innerText = tps.toFixed(1) + " TPS";
    
    // VRAM progression fill
    const vramPct = Math.min(100, (vramUsage / maxVramLimit) * 100);
    document.getElementById('vram-fill').style.width = vramPct + "%";
    document.getElementById('txt-vram-usage').innerText = `${Math.round(vramUsage)} MB / ${maxVramLimit} MB`;
    document.getElementById('txt-vram-pct').innerText = Math.round(vramPct) + "%";
    
    // Style memory color as warning indicator
    if (vramPct >= 85) {
        document.getElementById('vram-fill').style.background = "var(--red)";
        document.getElementById('txt-vram-pct').className = "text-red font-bold";
    } else if (vramPct >= 60) {
        document.getElementById('vram-fill').style.background = "var(--yellow)";
        document.getElementById('txt-vram-pct').className = "text-yellow font-bold";
    } else {
        document.getElementById('vram-fill').style.background = "linear-gradient(90deg, var(--cyan), var(--magenta))";
        document.getElementById('txt-vram-pct').className = "text-cyan";
    }

    document.getElementById('txt-ttft').innerText = ttft > 0 ? Math.round(ttft) + " MS" : "0 MS";
    document.getElementById('txt-acceptance').innerText = speculativeDraftedCount > 0 ? Math.round(speculativeAcceptance) + " %" : "-- %";
}

// --- Navigation Helpers ---
function getNeighbors(row, col) {
    const list = [];
    if (row > 0) list.push({ r: row - 1, c: col });
    if (row < GRID_ROWS - 1) list.push({ r: row + 1, c: col });
    if (col > 0) list.push({ r: row, c: col - 1 });
    if (col < GRID_COLS - 1) list.push({ r: row, c: col + 1 });
    return list;
}

function getAdjacentConduits(row, col) {
    const list = [];
    const neighbors = getNeighbors(row, col);
    neighbors.forEach(n => {
        const node = grid[n.r][n.c];
        if (node && (node.type === "conduit" || node.type === "sink" || node.type === "validator" || node.type === "decode")) {
            list.push({ r: n.r, c: n.c });
        }
    });
    return list;
}

function getNextCell(row, col, dir) {
    // 0 = Right, 1 = Down, 2 = Left, 3 = Up
    if (dir === 0 && col < GRID_COLS - 1) return { r: row, c: col + 1 };
    if (dir === 1 && row < GRID_ROWS - 1) return { r: row + 1, c: col };
    if (dir === 2 && col > 0) return { r: row, c: col - 1 };
    if (dir === 3 && row > 0) return { r: row - 1, c: col };
    return null;
}

// --- Canvas Drawing & Grid Renderers ---
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');

function handleResize() {
    const container = canvas.parentElement;
    canvas.width = GRID_COLS * TILE_SIZE;
    canvas.height = GRID_ROWS * TILE_SIZE;
    renderGrid();
}

function renderGrid() {
    if (!grid || grid.length === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw grid background cells
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (!grid[r]) continue;
            const rx = c * TILE_SIZE;
            const ry = r * TILE_SIZE;

            ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.strokeRect(rx, ry, TILE_SIZE, TILE_SIZE);

            // Highlight hover cell
            if (activeHoverCell && activeHoverCell.r === r && activeHoverCell.c === c) {
                ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
                ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 2. Draw placed Components
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const node = grid[r][c];
            if (!node) continue;

            const rx = c * TILE_SIZE;
            const ry = r * TILE_SIZE;
            const meta = TOOLBOX_METADATA[node.type];

            ctx.save();
            ctx.shadowBlur = 5;
            ctx.shadowColor = meta.iconColor;
            ctx.fillStyle = "rgba(10, 20, 40, 0.7)";
            ctx.strokeStyle = meta.iconColor;
            ctx.lineWidth = 1.5;
            
            // Draw node background box
            ctx.beginPath();
            ctx.roundRect(rx + 4, ry + 4, TILE_SIZE - 8, TILE_SIZE - 8, 6);
            ctx.fill();
            ctx.stroke();
            
            // Draw paging glow frame if boosted by Page Allocator
            if (node.isPaged) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#ffcc00";
                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 2.0;
                ctx.strokeRect(rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }

            // Draw component graphics
            ctx.translate(rx + TILE_SIZE/2, ry + TILE_SIZE/2);
            
            // Draw facing directions for wires and sources
            if (node.type === "conduit" || node.type === "source") {
                const angle = node.direction * Math.PI / 2; // 0, 90, 180, 270 deg
                ctx.rotate(angle);
                
                // Draw direction arrow
                ctx.fillStyle = meta.iconColor;
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.lineTo(2, -6);
                ctx.lineTo(2, 6);
                ctx.closePath();
                ctx.fill();
                
                // Draw wire line
                ctx.strokeStyle = meta.iconColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-16, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            } else {
                // Procedural component labels
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 9px var(--font-mono)";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                let text = node.type.toUpperCase().substring(0, 4);
                if (node.type === "vllm") text = "vLLM";
                ctx.fillText(text, 0, 0);
            }

            ctx.restore();
        }
    }

    // 3. Draw active data packets
    packets.forEach(p => {
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === "activation" ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 4. Draw dynamic particles
    particles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.restore();
    });
}

// --- Grid Cell Placement Triggers ---
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const col = Math.floor(mx / TILE_SIZE);
    const row = Math.floor(my / TILE_SIZE);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        activeHoverCell = { r: row, c: col };
        renderGrid();
        
        // Update details panel on hover
        const node = grid[row][col];
        if (node) {
            updateDescriptionPanel(node.type);
        }
    }
});

canvas.addEventListener('mouseleave', () => {
    activeHoverCell = null;
    renderGrid();
});

canvas.addEventListener('click', e => {
    if (e.button !== 0) return; // Left-click only
    if (!activeHoverCell) return;
    
    const { r, c } = activeHoverCell;
    const existing = grid[r][c];

    if (existing) {
        // Rotate conduit / direction components on click
        const rotated = existing.rotate();
        if (rotated) renderGrid();
    } else {
        // Place new node component
        if (selectedTool) {
            grid[r][c] = new ComponentNode(selectedTool, r, c, 0);
            playBleep(500, 0.08, "triangle", 0.06);
            renderGrid();
        }
    }
});

// Right click to delete placed nodes
canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (!activeHoverCell) return;
    const { r, c } = activeHoverCell;
    const existing = grid[r][c];
    
    // Prevent deleting queue/sink anchors
    if (existing && existing.type !== "source" && existing.type !== "sink") {
        grid[r][c] = null;
        playBleep(300, 0.1, "sine", 0.06);
        renderGrid();
    }
});

// --- UI Button Click Bindings ---
document.getElementById('btn-simulate').onclick = startSimulation;
document.getElementById('btn-stop').onclick = stopSimulation;

document.getElementById('btn-sound').onclick = () => {
    soundEnabled = !soundEnabled;
    document.getElementById('btn-sound').innerText = `🔊 AUDIO: ${soundEnabled ? 'ON' : 'OFF'}`;
    playBleep(440, 0.05, "sine", 0.05);
};

// Simulation Speed Controls
const speeds = [1, 2, 4];
speeds.forEach((spd, idx) => {
    const btn = document.getElementById(`btn-speed-${spd}`);
    if (btn) {
        btn.onclick = () => {
            simulationSpeed = spd;
            document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
            const activeBtn = document.getElementById(`btn-speed-${spd}`);
            if (activeBtn) activeBtn.classList.add('active');
            playBleep(500 + idx * 100, 0.05, "sine", 0.04);
        };
    }
});

// Reallocate retry click handler
const btnOomRetry = document.getElementById('btn-oom-retry');
if (btnOomRetry) {
    btnOomRetry.onclick = () => {
        const oomOverlay = document.getElementById('oom-overlay');
        if (oomOverlay) oomOverlay.classList.add('hidden');
        loadLevel(currentLevelIndex);
    };
}

// Victory Navigation Buttons
const btnNextLvl = document.getElementById('btn-next-level');
if (btnNextLvl) {
    btnNextLvl.onclick = () => {
        const vicOverlay = document.getElementById('victory-overlay');
        if (vicOverlay) vicOverlay.classList.add('hidden');
        if (currentLevelIndex < 3) {
            loadLevel(currentLevelIndex + 1);
        } else {
            // Return to selection
            const lvlSelect = document.getElementById('level-select-overlay');
            if (lvlSelect) lvlSelect.classList.remove('hidden');
        }
    };
}

const btnReplay = document.getElementById('btn-replay');
if (btnReplay) {
    btnReplay.onclick = () => {
        const vicOverlay = document.getElementById('victory-overlay');
        if (vicOverlay) vicOverlay.classList.add('hidden');
        loadLevel(currentLevelIndex);
    };
}

const btnPortal = document.getElementById('btn-portal');
if (btnPortal) {
    btnPortal.onclick = () => {
        window.location.href = "../";
    };
}

// Level Select Card triggers
const lvlCards = [1, 2, 3];
lvlCards.forEach(lvl => {
    const card = document.getElementById(`card-lvl-${lvl}`);
    if (card) {
        card.onclick = () => {
            const lvlSelect = document.getElementById('level-select-overlay');
            if (lvlSelect) lvlSelect.classList.add('hidden');
            loadLevel(lvl);
        };
    }
});

// Architecture Guide Modal triggers
const btnGuide = document.getElementById('btn-guide');
if (btnGuide) {
    btnGuide.onclick = () => {
        const guideOverlay = document.getElementById('guide-overlay');
        if (guideOverlay) {
            guideOverlay.classList.remove('hidden');
            // Auto open the current level tab
            const tabId = currentLevelIndex === 1 ? 'tab-lvl1' : (currentLevelIndex === 2 ? 'tab-lvl2' : 'tab-lvl3');
            switchTab(tabId);
            playBleep(800, 0.05, "sine", 0.05);
        }
    };
}

const btnCloseGuide = document.getElementById('btn-close-guide');
if (btnCloseGuide) {
    btnCloseGuide.onclick = () => {
        const guideOverlay = document.getElementById('guide-overlay');
        if (guideOverlay) {
            guideOverlay.classList.add('hidden');
            playBleep(600, 0.05, "sine", 0.05);
        }
    };
}

// Tab Switching logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        switchTab(btn.dataset.tab);
        playBleep(700, 0.04, "sine", 0.03);
    };
});

// --- Main Engine Simulation Loop ---
let lastTimestamp = 0;
function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    
    // Simulation updates
    updateSimulation();
    renderGrid();
    
    requestAnimationFrame(gameLoop);
}

// Start Setup on load
window.addEventListener('load', () => {
    initGrid();
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Open level select terminal overlay on page load
    document.getElementById('level-select-overlay').classList.remove('hidden');
    
    requestAnimationFrame(gameLoop);
});
