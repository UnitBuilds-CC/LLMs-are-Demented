// LLMs are Demented: The Crossword
// Game Engine & Simulation Controller

// Crossword definitions & relative offsets
const WORDS = [
    { num: 1, text: "WEIGHTS", r: 0, c: 1, dir: "V", clue: "The learned numerical parameters inside neural network layers." },
    { num: 2, text: "TOKEN", r: 1, c: 8, dir: "V", clue: "The fundamental unit of text processed by a transformer." },
    { num: 3, text: "MODEL", r: 2, c: 3, dir: "V", clue: "A trained system of weights and biases representing patterns in data." },
    { num: 4, text: "EPOCH", r: 2, c: 6, dir: "H", clue: "One complete pass through the entire training dataset." },
    { num: 5, text: "BIAS", r: 4, c: 6, dir: "V", clue: "The additive parameter offset applied in dense layers alongside weights." },
    { num: 6, text: "ATTENTION", r: 5, c: 0, dir: "H", clue: "The core transformer mechanism that dynamically weights the relationships between input tokens." },
    { num: 7, text: "LOSS", r: 7, c: 4, dir: "H", clue: "The error metric minimized during training." },
    { num: 7, text: "LAYER", r: 7, c: 4, dir: "V", clue: "A repeating block of neural network computations (like attention or MLP)." },
    { num: 8, text: "PROMPT", r: 11, c: 3, dir: "H", clue: "The input instructions or query fed into an LLM to steer its generation." }
];

// Grid dimensions
const ROWS = 12;
const COLS = 11;

// Lookalike translation map for low-temperature mutations (semantic drift)
const DRIFT_MAP = {
    'A': '4', 'B': '8', 'C': '(', 'D': '0', 'E': '3', 
    'G': '9', 'H': '#', 'I': '1', 'K': 'X', 'L': '7', 
    'M': 'N', 'N': 'M', 'O': '0', 'P': '9', 'R': '2', 
    'S': '5', 'T': '7', 'W': 'VV', 'Y': 'v'
};

// Chaos characters for high-temperature mutations (pure entropy)
const CHAOS_CHARS = ['%', '$', '@', '#', '*', '&', '?', '!', '🤖', '💥', '🧠', '🌀', '⚡', '💻', '🔮', '💾'];

// Game State
let grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
let contextQueue = []; // Queue of {r, c} edits
let activeRow = -1;
let activeCol = -1;
let typingDirection = "H"; // "H" = Horizontal, "V" = Vertical
let gameStartTime = null;
let firstKeystrokeTime = null;
let ttft = 0;
let logBaseTime = Date.now();

// Hyperparameters (bound to sliders)
let contextWindowLimit = 32;
let cacheRetentionTime = 45; // in seconds
let temperature = 0.7;

// Stats Counters
let keystrokesCount = 0;
let evictionsCount = 0;
let mutationsCount = 0;
let currentAccuracy = 0;
let totalCrosswordCells = 0;

// Quadrant Timers state (1-indexed)
let quadrantTimers = [null, 45, 45, 45, 45];

// Timer Interval ID
let gameLoopInterval = null;
let inferenceAutoTriggered = false;
let pasteDetected = false;

// Initialize Audio Context (lazily instantiated on interaction)
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Retro Sound Synthesizer
function playSynthSound(freq, type, duration, volume) {
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
    } catch (e) {
        // Autoplay restrictions
    }
}

function playClickSound() {
    playSynthSound(700, 'sine', 0.05, 0.03);
}

function playWarningSound() {
    playSynthSound(280, 'triangle', 0.2, 0.08);
}

function playEvictionSound() {
    playSynthSound(120, 'sawtooth', 0.5, 0.12);
}

function playSuccessChime() {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + idx * 0.08 + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    } catch (e) {}
}

function playTeleprinterSound() {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const clicks = 3 + Math.floor(Math.random() * 3); // 3-5 rapid teleprinter ticks
        for (let i = 0; i < clicks; i++) {
            const clickTime = now + i * 0.03;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 300, clickTime);
            gain.gain.setValueAtTime(0.015, clickTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, clickTime + 0.015);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(clickTime);
            osc.stop(clickTime + 0.015);
        }
    } catch(e) {}
}

// Helper to determine cell's quadrant
function getQuadrant(r, c) {
    if (r <= 5 && c <= 5) return 1;
    if (r <= 5 && c >= 6) return 2;
    if (r >= 6 && c <= 5) return 3;
    return 4; // r >= 6 && c >= 6
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
    line.innerHTML = `<span style="color: #64748b; font-family: var(--font-mono); font-size: 0.85em; margin-right: 0.4rem;">${getTerminalTimestamp()}</span>${message}`;
    
    history.appendChild(line);
    
    // Prune history to keep terminal fast
    while (history.children.length > 50) {
        history.removeChild(history.firstChild);
    }
    
    history.scrollTop = history.scrollHeight;
    
    playTeleprinterSound();
}

// Game Setup
function setupGame() {
    gameStartTime = null;
    firstKeystrokeTime = null;
    ttft = 0;
    logBaseTime = Date.now();
    inferenceAutoTriggered = false;
    pasteDetected = false;
    
    // If the welcome modal is not active/open (e.g. during a hard reset), start the clock immediately
    const welcomeModal = document.getElementById('modal-howto');
    if (welcomeModal && !welcomeModal.classList.contains('active')) {
        gameStartTime = Date.now();
    }
    
    contextQueue = [];
    keystrokesCount = 0;
    evictionsCount = 0;
    mutationsCount = 0;
    currentAccuracy = 0;
    totalCrosswordCells = 0;
    
    // Read slider defaults
    contextWindowLimit = parseInt(document.getElementById('slider-context').value);
    cacheRetentionTime = parseInt(document.getElementById('slider-cache').value);
    temperature = parseFloat(document.getElementById('slider-temp').value);
    
    quadrantTimers = [null, cacheRetentionTime, cacheRetentionTime, cacheRetentionTime, cacheRetentionTime];
    
    // Clean and rebuild state grid
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    
    WORDS.forEach(word => {
        const len = word.text.length;
        for (let i = 0; i < len; i++) {
            const currR = word.dir === "H" ? word.r : word.r + i;
            const currC = word.dir === "H" ? word.c + i : word.c;
            const letter = word.text[i];
            
            if (!grid[currR][currC]) {
                grid[currR][currC] = {
                    r: currR,
                    c: currC,
                    correctLetter: letter,
                    currentValue: "",
                    isMutated: false,
                    originalMutationLetter: "",
                    number: null,
                    words: []
                };
                totalCrosswordCells++;
            }
            grid[currR][currC].words.push(word);
            
            if (i === 0) {
                grid[currR][currC].number = word.num;
            }
        }
    });

    renderBoard();
    renderClues();
    updateStats();
    
    // Clear terminal history and print initialization logs
    const history = document.getElementById('log-history');
    if (history) history.innerHTML = "";
    
    logToTerminal("Forem liquid embed interface initialized.", "system");
    logToTerminal(`Hyperparameters: CW=${contextWindowLimit}, CacheTime=${cacheRetentionTime}s, Temp=${temperature.toFixed(1)}`, "system");
    logToTerminal("Awaiting developer neural inputs...", "info");
    
    // Focus first crossword cell (Row 0, Col 1 - WEIGHTS)
    selectCell(0, 1);
    
    // Reset and start main loop
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameTickLoop, 1000);
}

// Render the 12x11 board cells in DOM
function renderBoard() {
    const board = document.getElementById('crossword-board');
    if (!board) return;
    board.innerHTML = "";
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellState = grid[r][c];
            const cellEl = document.createElement('div');
            
            if (!cellState) {
                cellEl.className = "cell empty";
            } else {
                cellEl.className = "cell letter-box";
                cellEl.id = `cell-${r}-${c}`;
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;
                
                // Add clue starting number
                if (cellState.number) {
                    const numEl = document.createElement('span');
                    numEl.className = "cell-number";
                    numEl.innerText = cellState.number;
                    cellEl.appendChild(numEl);
                }
                
                // Add letter span
                const letterEl = document.createElement('span');
                letterEl.className = "cell-letter";
                letterEl.innerText = cellState.currentValue;
                cellEl.appendChild(letterEl);
                
                // Click handler
                cellEl.addEventListener('click', () => {
                    initAudio();
                    if (activeRow === r && activeCol === c) {
                        // Clicked same cell: toggle direction
                        typingDirection = typingDirection === "H" ? "V" : "H";
                    }
                    selectCell(r, c);
                });
            }
            
            board.appendChild(cellEl);
        }
    }
}

// Render clue lists in DOM
function renderClues() {
    const acrossContainer = document.getElementById('clues-across');
    const downContainer = document.getElementById('clues-down');
    
    if (acrossContainer) acrossContainer.innerHTML = "";
    if (downContainer) downContainer.innerHTML = "";
    
    WORDS.forEach((word, index) => {
        const item = document.createElement('div');
        item.className = "clue-item";
        item.id = `clue-${word.dir}-${word.num}`;
        item.dataset.index = index;
        item.innerHTML = `<span class="clue-num">${word.num}</span><span class="clue-text">${word.clue} <span style="opacity: 0.6; font-size: 0.9em;">(${word.text.length})</span></span>`;
        
        item.addEventListener('click', () => {
            initAudio();
            selectClue(word);
        });
        
        if (word.dir === "H") {
            acrossContainer.appendChild(item);
        } else {
            downContainer.appendChild(item);
        }
    });
}

// Select a clue and focus its start cell
function selectClue(word) {
    typingDirection = word.dir;
    selectCell(word.r, word.c);
}

// Set active cell coordinates
function selectCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || !grid[r][c]) return;
    
    // Remove old active
    const oldActive = document.querySelector('.cell.letter-box.active');
    if (oldActive) oldActive.classList.remove('active');
    
    activeRow = r;
    activeCol = c;
    
    const newActive = document.getElementById(`cell-${r}-${c}`);
    if (newActive) newActive.classList.add('active');
    
    updateHighlightedClue();
}

// Highlight the clue corresponding to the active cell and typing direction
function updateHighlightedClue() {
    // Clear current highlighted clues
    document.querySelectorAll('.clue-item.active').forEach(el => el.classList.remove('active'));
    
    const cellState = grid[activeRow][activeCol];
    if (!cellState) return;
    
    // Find matching word
    let activeWord = cellState.words.find(w => w.dir === typingDirection);
    if (!activeWord && cellState.words.length > 0) {
        // Fallback to other direction if current doesn't match
        activeWord = cellState.words[0];
        typingDirection = activeWord.dir;
    }
    
    if (activeWord) {
        const clueEl = document.getElementById(`clue-${activeWord.dir}-${activeWord.num}`);
        if (clueEl) {
            clueEl.classList.add('active');
            clueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Main 1-second interval loop (Quadrant decays, Out-of-Context decays & Spontaneous Mutations)
function gameTickLoop() {
    // 1. Decimate quadrant timers if they are active
    for (let q = 1; q <= 4; q++) {
        const hasLetters = checkQuadrantLetters(q);
        const sectorEl = document.getElementById(`quadrant-${q}`);
        const labelEl = sectorEl ? sectorEl.querySelector('.quadrant-timer-indicator') : null;
        
        if (hasLetters) {
            quadrantTimers[q]--;
            
            if (quadrantTimers[q] <= 0) {
                // Eviction!
                evictQuadrant(q);
            } else {
                // Update UI text
                if (labelEl) labelEl.innerText = `Q${q} CACHE: ${quadrantTimers[q]}s`;
                
                // Update Warning Classes
                if (sectorEl) {
                    if (quadrantTimers[q] <= 3) {
                        sectorEl.className = "quadrant-sector danger";
                    } else if (quadrantTimers[q] <= 6) {
                        sectorEl.className = "quadrant-sector warning";
                    } else {
                        sectorEl.className = "quadrant-sector";
                    }
                }
            }
        } else {
            // Idle quadrant
            quadrantTimers[q] = cacheRetentionTime;
            if (labelEl) labelEl.innerText = `Q${q} CACHE: IDLE`;
            if (sectorEl) sectorEl.className = "quadrant-sector";
        }
    }
    
    // 2. Out-of-Context cell decays (fading memory)
    const inContextSet = new Set(contextQueue.map(item => `${item.r},${item.c}`));
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (cell && cell.currentValue !== "" && !cell.isMutated && !inContextSet.has(`${r},${c}`)) {
                // Out-of-context decay probability per second (scales with temperature)
                const decayProb = 0.02 * temperature; 
                if (Math.random() < decayProb) {
                    mutateCell(r, c);
                }
            }
        }
    }
    
    // 3. Spontaneous mutations at high temperature (T >= 1.3)
    if (temperature >= 1.3) {
        const mutationChance = (temperature - 1.2) * 0.12; // E.g., at 1.5 it's 3.6% chance per second
        if (Math.random() < mutationChance) {
            spontaneousMutation();
        }
    }
    
    updateStats();
}

// Check if a quadrant contains any user-entered values
function checkQuadrantLetters(q) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (getQuadrant(r, c) === q && grid[r][c] && grid[r][c].currentValue !== "") {
                return true;
            }
        }
    }
    return false;
}

// Perform KV-cache eviction on a quadrant
function evictQuadrant(q) {
    logToTerminal(`[ALERT] KV-Cache Eviction! Quadrant ${q} context expired.`, "error");
    playEvictionSound();
    
    // Wipe quadrant letters
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (getQuadrant(r, c) === q && grid[r][c]) {
                const cell = grid[r][c];
                if (cell.currentValue !== "") {
                    cell.currentValue = "";
                    cell.isMutated = false;
                    cell.originalMutationLetter = "";
                    
                    // Remove from context queue
                    contextQueue = contextQueue.filter(item => !(item.r === r && item.c === c));
                    
                    // Update cell DOM
                    const cellEl = document.getElementById(`cell-${r}-${c}`);
                    if (cellEl) {
                        cellEl.classList.remove('mutated');
                        const letterSpan = cellEl.querySelector('.cell-letter');
                        if (letterSpan) letterSpan.innerText = "";
                    }
                }
            }
        }
    }
    
    // Flash quadrant overlay red
    const sectorEl = document.getElementById(`quadrant-${q}`);
    if (sectorEl) {
        sectorEl.className = "quadrant-sector evicting";
        setTimeout(() => {
            sectorEl.className = "quadrant-sector";
        }, 500);
    }
    
    quadrantTimers[q] = cacheRetentionTime;
    evictionsCount++;
    updateStats();
}

// Spontaneous Hallucination
function spontaneousMutation() {
    // Find candidate cells: non-empty, filled, and not already mutated
    let candidates = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (cell && cell.currentValue !== "" && !cell.isMutated) {
                candidates.push(cell);
            }
        }
    }
    
    if (candidates.length === 0) return;
    
    const targetCell = candidates[Math.floor(Math.random() * candidates.length)];
    mutateCell(targetCell.r, targetCell.c, true);
}

// Mutate a letter in a cell due to context overflow or noise
function mutateCell(r, c, spontaneous = false) {
    const cell = grid[r][c];
    if (!cell || cell.currentValue === "" || cell.isMutated) return;
    
    cell.isMutated = true;
    cell.originalMutationLetter = cell.currentValue;
    
    let mutatedChar = "";
    if (temperature > 1.0) {
        // High temp: random symbol
        mutatedChar = CHAOS_CHARS[Math.floor(Math.random() * CHAOS_CHARS.length)];
    } else {
        // Low temp: lookalike replacement
        const correct = cell.correctLetter;
        mutatedChar = DRIFT_MAP[correct] || CHAOS_CHARS[Math.floor(Math.random() * CHAOS_CHARS.length)];
    }
    
    cell.currentValue = mutatedChar;
    
    // Update DOM
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    if (cellEl) {
        cellEl.classList.add('mutated');
        const letterSpan = cellEl.querySelector('.cell-letter');
        if (letterSpan) letterSpan.innerText = mutatedChar;
    }
    
    if (spontaneous) {
        logToTerminal(`[ALERT] Spontaneous Hallucination! Noise mutated cell (R${r}, C${c}) to '${mutatedChar}'.`, "warn");
    } else {
        logToTerminal(`[WARN] Context overflow! Oldest cell (R${r}, C${c}) evicted and mutated to '${mutatedChar}'.`, "warn");
    }
    
    mutationsCount++;
    playWarningSound();
    updateStats();
}

// Handle letter entries
function handleInput(char) {
    if (activeRow === -1 || activeCol === -1) return;
    
    const cell = grid[activeRow][activeCol];
    if (!cell) return;
    
    const upperChar = char.toUpperCase();
    
    // Set TTFT on first keystroke
    if (firstKeystrokeTime === null && gameStartTime !== null) {
        firstKeystrokeTime = Date.now();
        ttft = (firstKeystrokeTime - gameStartTime) / 1000;
        logToTerminal(`First token generated. TTFT: ${ttft.toFixed(2)}s.`, "system");
    }
    
    // Register keystroke
    keystrokesCount++;
    playClickSound();
    
    // Set cell value
    cell.currentValue = upperChar;
    
    // Reset quadrant timer
    const q = getQuadrant(activeRow, activeCol);
    quadrantTimers[q] = cacheRetentionTime;
    
    // If it was mutated, clean mutation flags
    if (cell.isMutated) {
        cell.isMutated = false;
        cell.originalMutationLetter = "";
        const cellEl = document.getElementById(`cell-${activeRow}-${activeCol}`);
        if (cellEl) cellEl.classList.remove('mutated');
        logToTerminal(`[INFO] Re-aligned cell (R${activeRow}, C${activeCol}) with new input.`, "info");
    }
    
    // Manage context window sliding queue
    // Remove if already in queue to push to end (MRU)
    contextQueue = contextQueue.filter(item => !(item.r === activeRow && item.c === activeCol));
    contextQueue.push({ r: activeRow, c: activeCol });
    
    // Update letter inside grid in DOM
    const cellEl = document.getElementById(`cell-${activeRow}-${activeCol}`);
    if (cellEl) {
        const letterSpan = cellEl.querySelector('.cell-letter');
        if (letterSpan) letterSpan.innerText = upperChar;
    }
    
    // If queue exceeds window, pop oldest to fall out of context
    if (contextQueue.length > contextWindowLimit) {
        contextQueue.shift();
    }
    
    updateStats();
    
    // Check if we just filled the last letter of the current word
    const cellState = grid[activeRow][activeCol];
    if (cellState) {
        const activeWord = cellState.words.find(w => w.dir === typingDirection);
        if (activeWord) {
            const lastR = activeWord.dir === "H" ? activeWord.r : activeWord.r + activeWord.text.length - 1;
            const lastC = activeWord.dir === "H" ? activeWord.c + activeWord.text.length - 1 : activeWord.c;
            
            if (activeRow === lastR && activeCol === lastC) {
                const currIdx = WORDS.indexOf(activeWord);
                const nextIdx = (currIdx + 1) % WORDS.length;
                setTimeout(() => {
                    // Check if modal-share is not open (so we don't disrupt the final popup)
                    const shareModal = document.getElementById('modal-share');
                    if (shareModal && !shareModal.classList.contains('active')) {
                        selectClue(WORDS[nextIdx]);
                        logToTerminal(`Word completed. Auto-advancing to clue: ${WORDS[nextIdx].num} ${WORDS[nextIdx].dir === 'H' ? 'Across' : 'Down'}.`, "info");
                    }
                }, 150);
                return;
            }
        }
    }
    
    // Advance selection forward
    advanceFocus(1);
}

// Advance focus in current typing direction
function advanceFocus(delta) {
    if (activeRow === -1 || activeCol === -1) return;
    
    let r = activeRow;
    let c = activeCol;
    
    for (let steps = 1; steps < 12; steps++) {
        if (typingDirection === "H") {
            c += delta;
        } else {
            r += delta;
        }
        
        // Out of bounds
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
        
        // Found valid letter box
        if (grid[r][c]) {
            selectCell(r, c);
            return;
        }
    }
}

// Handle Backspace deletion
function handleBackspace() {
    if (activeRow === -1 || activeCol === -1) return;
    
    const cell = grid[activeRow][activeCol];
    if (!cell) return;
    
    playClickSound();
    
    if (cell.currentValue !== "") {
        // Clear current cell
        cell.currentValue = "";
        cell.isMutated = false;
        cell.originalMutationLetter = "";
        
        contextQueue = contextQueue.filter(item => !(item.r === activeRow && item.c === activeCol));
        
        const cellEl = document.getElementById(`cell-${activeRow}-${activeCol}`);
        if (cellEl) {
            cellEl.classList.remove('mutated');
            const letterSpan = cellEl.querySelector('.cell-letter');
            if (letterSpan) letterSpan.innerText = "";
        }
        
        logToTerminal(`[INFO] Cleared cell (R${activeRow}, C${activeCol}).`, "info");
    } else {
        // Current cell already empty, back up and clear previous cell
        advanceFocus(-1);
        
        const prevCell = grid[activeRow][activeCol];
        if (prevCell && prevCell.currentValue !== "") {
            prevCell.currentValue = "";
            prevCell.isMutated = false;
            prevCell.originalMutationLetter = "";
            
            contextQueue = contextQueue.filter(item => !(item.r === activeRow && item.c === activeCol));
            
            const cellEl = document.getElementById(`cell-${activeRow}-${activeCol}`);
            if (cellEl) {
                cellEl.classList.remove('mutated');
                const letterSpan = cellEl.querySelector('.cell-letter');
                if (letterSpan) letterSpan.innerText = "";
            }
            logToTerminal(`[INFO] Cleared cell (R${activeRow}, C${activeCol}).`, "info");
        }
    }
    
    updateStats();
}

// Move active cell via arrow keys
function moveActiveCell(dr, dc) {
    let r = activeRow;
    let c = activeCol;
    
    while (true) {
        r += dr;
        c += dc;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return; // out of bounds
        
        if (grid[r][c]) {
            selectCell(r, c);
            return;
        }
    }
}

// Update stats board indicators
function updateStats() {
    // 1. Calculate accuracy based on correct inputs
    let correctCount = 0;
    let filledCount = 0;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (cell) {
                if (cell.currentValue !== "") filledCount++;
                if (cell.currentValue === cell.correctLetter) {
                    correctCount++;
                }
            }
        }
    }
    
    currentAccuracy = totalCrosswordCells > 0 ? Math.round((correctCount / totalCrosswordCells) * 100) : 0;
    
    // Update DOM Metrics
    const accEl = document.getElementById('metric-accuracy');
    const keystrokesEl = document.getElementById('metric-keystrokes');
    const evictionsEl = document.getElementById('metric-evictions');
    const mutationsEl = document.getElementById('metric-mutations');
    
    if (accEl) accEl.innerText = `${currentAccuracy}%`;
    if (keystrokesEl) keystrokesEl.innerText = keystrokesCount;
    
    if (evictionsEl) {
        evictionsEl.innerText = evictionsCount;
        evictionsEl.className = evictionsCount > 0 ? "stat-value highlight-red" : "stat-value";
    }
    
    if (mutationsEl) {
        mutationsEl.innerText = mutationsCount;
        mutationsEl.className = mutationsCount > 0 ? "stat-value highlight-amber" : "stat-value";
    }
    
    // Check if each clue is solved to cross it out
    WORDS.forEach(word => {
        const clueEl = document.getElementById(`clue-${word.dir}-${word.num}`);
        if (clueEl) {
            let wordSolved = true;
            for (let i = 0; i < word.text.length; i++) {
                const currR = word.dir === "H" ? word.r : word.r + i;
                const currC = word.dir === "H" ? word.c + i : word.c;
                if (grid[currR][currC].currentValue !== word.text[i]) {
                    wordSolved = false;
                    break;
                }
            }
            if (wordSolved) {
                clueEl.classList.add('solved');
            } else {
                clueEl.classList.remove('solved');
            }
        }
    });

    // Update out-of-context cell classes
    updateContextVis();

    // Auto-trigger inference if all cells are filled
    if (filledCount === totalCrosswordCells) {
        if (!inferenceAutoTriggered) {
            inferenceAutoTriggered = true;
            const shareModal = document.getElementById('modal-share');
            if (shareModal && !shareModal.classList.contains('active')) {
                setTimeout(() => {
                    runInference();
                }, 100);
            }
        }
    } else {
        inferenceAutoTriggered = false;
    }
}

// Visual indicator of which cells are active in context vs fading out
function updateContextVis() {
    const inContextSet = new Set(contextQueue.map(item => `${item.r},${item.c}`));
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = grid[r][c];
            if (cell) {
                const cellEl = document.getElementById(`cell-${r}-${c}`);
                if (cellEl) {
                    if (cell.currentValue === "") {
                        cellEl.classList.remove('out-of-context');
                    } else {
                        const inContext = inContextSet.has(`${r},${c}`);
                        if (inContext) {
                            cellEl.classList.remove('out-of-context');
                        } else {
                            cellEl.classList.add('out-of-context');
                        }
                    }
                }
            }
        }
    }
}

// Check count of fully correct words
function countCorrectWords() {
    let correctWords = 0;
    WORDS.forEach(word => {
        let isCorrect = true;
        for (let i = 0; i < word.text.length; i++) {
            const currR = word.dir === "H" ? word.r : word.r + i;
            const currC = word.dir === "H" ? word.c + i : word.c;
            if (grid[currR][currC].currentValue !== word.text[i]) {
                isCorrect = false;
                break;
            }
        }
        if (isCorrect) correctWords++;
    });
    return correctWords;
}

// Reset Game fully
function resetGame() {
    if (confirm("Reset current neural weights? All input letters will be zeroed.")) {
        initAudio();
        setupGame();
    }
}

// Verify Board & Trigger End modal
function runInference() {
    initAudio();
    updateStats();
    
    const correctWords = countCorrectWords();
    const totalWords = WORDS.length;
    
    const isPerfect = currentAccuracy === 100;
    
    // Status text
    const statusMsg = document.getElementById('share-status-message');
    if (statusMsg) {
        if (isPerfect) {
            statusMsg.innerHTML = `<span style="color: var(--color-green); font-weight: bold;">🎉 SUCCESS: 100% Accuracy achieved!</span> The model generated fully coherent outputs without collapsing into gibberish.`;
            playSuccessChime();
        } else {
            statusMsg.innerHTML = `<span style="color: var(--color-red); font-weight: bold;">⚠️ LOSS COLLAPSE: Accuracy is ${currentAccuracy}%</span>. The model suffers from semantic drift and token eviction. Redo hyperparameter tuning!`;
            playWarningSound();
        }
    }
    
    // Calculate speed comparison
    const now = Date.now();
    const generationTime = firstKeystrokeTime ? (now - firstKeystrokeTime) / 1000 : 0;
    const playerTPS = (generationTime > 0 && keystrokesCount > 1) ? ((keystrokesCount - 1) / generationTime) : 0;
    
    let localComparison = "";
    if (playerTPS > 0) {
        if (playerTPS <= 15.0) {
            localComparison = `${(15.0 / playerTPS).toFixed(1)}x faster`;
        } else {
            localComparison = `${(playerTPS / 15.0).toFixed(1)}x slower`;
        }
    } else {
        localComparison = "10000+x faster";
    }

    let cloudComparison = "";
    if (playerTPS > 0) {
        if (playerTPS <= 150.0) {
            cloudComparison = `${(150.0 / playerTPS).toFixed(1)}x faster`;
        } else {
            cloudComparison = `${(playerTPS / 150.0).toFixed(1)}x slower`;
        }
    } else {
        cloudComparison = "100000+x faster";
    }

    // Generate share text
    const cwTag = contextWindowLimit <= 12 ? "Tiny!" : (contextWindowLimit <= 20 ? "Mid" : "Large");
    const tempTag = temperature > 1.2 ? "Pure Chaos" : (temperature > 0.8 ? "Standard" : "Low Temp");
    
    const shareText = `🧩 LLMs ARE DEMENTED: THE CROSSWORD 🧠
"Mechanical Sympathy Edition"

⚙️ My Config:
├─ Context Window: ${contextWindowLimit} tokens (${cwTag})
├─ Cache Retention: ${cacheRetentionTime} seconds
└─ Temperature: ${temperature.toFixed(1)} (${tempTag})

📊 Performance Summary:
├─ Words Correctly Verified: ${correctWords}/${totalWords}
├─ Total Keystrokes Input: ${keystrokesCount}
├─ KV-Cache Evictions Suffered: ${evictionsCount}
├─ Hallucinatory Mutations: ${mutationsCount}
├─ Time to First Token (TTFT): ${ttft.toFixed(2)}s
└─ Generation Speed (TPS): ${playerTPS.toFixed(2)} tokens/sec

⚡ Inference Throughput Comparison (TPS):
├─ Your Speed: ${playerTPS.toFixed(2)} tokens/sec
├─ Local 7B (CPU): 15.00 tokens/sec (${localComparison})
└─ Cloud API: 150.00 tokens/sec (${cloudComparison})

"I will never yell at my chat client again."
🚀 Play the Simulation Here: [Your Dev.to Post URL]`;

    const previewBox = document.getElementById('share-preview');
    if (previewBox) {
        previewBox.innerText = shareText;
    }
    
    // Open modal
    const shareModal = document.getElementById('modal-share');
    if (shareModal) shareModal.classList.add('active');
    
    logToTerminal(`⚡ Inference executed. Accuracy: ${currentAccuracy}%. Correct Words: ${correctWords}/${totalWords}.`, isPerfect ? 'system' : 'warn');
}

// Copy Score to Clipboard
function copyScoreClipboard() {
    const previewBox = document.getElementById('share-preview');
    if (!previewBox) return;
    
    let textToCopy = previewBox.innerText;
    if (pasteDetected) {
        textToCopy = textToCopy.replace(
            '"I will never yell at my chat client again."',
            '🚨 Pipeline: Prompt Injecting Detected (Creative!)\n\n"I will never yell at my chat client again."'
        );
    }
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert("Inference report copied to clipboard! Paste it on DEV.to!");
            logToTerminal("[INFO] Report successfully exported to system clipboard.", "system");
        })
        .catch(err => {
            console.error("Failed to copy", err);
            logToTerminal("[ERROR] Clipboard access denied. Copy manually from the CRT box.", "error");
        });
}

// Close Modals
function openHowToModal() {
    initAudio();
    const modal = document.getElementById('modal-howto');
    if (modal) modal.classList.add('active');
}

function closeHowToModal() {
    const modal = document.getElementById('modal-howto');
    if (modal) modal.classList.remove('active');
    if (firstKeystrokeTime === null) {
        gameStartTime = Date.now();
        logToTerminal("Model execution clock started. Awaiting prompt completion...", "system");
    }
}

function closeShareModal() {
    const modal = document.getElementById('modal-share');
    if (modal) modal.classList.remove('active');
}

function openWeightsModal() {
    initAudio();
    const modal = document.getElementById('modal-weights');
    if (modal) modal.classList.add('active');
    logToTerminal("Model weights queried. Displaying cheatsheet...", "system");
}

function closeWeightsModal() {
    const modal = document.getElementById('modal-weights');
    if (modal) modal.classList.remove('active');
}

// Global Keyboard Handler
document.addEventListener('keydown', (e) => {
    // Block inputs if any modal is active (e.g. cheatsheet, instructions, share modal)
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length > 0) return;

    const key = e.key;

    // Intercept Ctrl+V or Cmd+V for paste support on non-editable grid divs
    if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'v') {
        e.preventDefault();
        navigator.clipboard.readText()
            .then(text => {
                handlePasteText(text);
            })
            .catch(err => {
                console.error("Failed to read clipboard text", err);
                logToTerminal("Clipboard access denied. Ensure page has focus, is run over HTTPS/localhost, and clipboard permission is allowed.", "error");
            });
        return;
    }

    if (activeRow === -1 || activeCol === -1) return;
    
    // Check if user is typing in a slider or another input
    if (e.target.tagName === 'INPUT') return;
    
    // Backspace
    if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
    }
    // A-Z letters
    else if (key.length === 1 && key.match(/[a-z]/i)) {
        e.preventDefault();
        handleInput(key);
    }
    // Tabbing
    else if (key === "Tab") {
        e.preventDefault();
        const cellState = grid[activeRow][activeCol];
        if (cellState) {
            let activeWord = cellState.words.find(w => w.dir === typingDirection);
            if (!activeWord && cellState.words.length > 0) {
                activeWord = cellState.words[0];
            }
            if (activeWord) {
                let currIdx = WORDS.indexOf(activeWord);
                let nextIdx = e.shiftKey ? 
                    (currIdx - 1 + WORDS.length) % WORDS.length : 
                    (currIdx + 1) % WORDS.length;
                selectClue(WORDS[nextIdx]);
                logToTerminal(`Focused clue: ${WORDS[nextIdx].num} ${WORDS[nextIdx].dir === 'H' ? 'Across' : 'Down'}.`, "info");
            }
        }
    }
    // Spacebar toggles direction
    else if (key === " ") {
        e.preventDefault();
        typingDirection = typingDirection === "H" ? "V" : "H";
        updateHighlightedClue();
        playClickSound();
    }
    // Navigation arrows
    else if (key === "ArrowUp") {
        e.preventDefault();
        moveActiveCell(-1, 0);
    } else if (key === "ArrowDown") {
        e.preventDefault();
        moveActiveCell(1, 0);
    } else if (key === "ArrowLeft") {
        e.preventDefault();
        moveActiveCell(0, -1);
    } else if (key === "ArrowRight") {
        e.preventDefault();
        moveActiveCell(0, 1);
    }
});

// Paste Intrusion / Bypass Vector Listener
document.addEventListener('paste', (e) => {
    // Block paste if any modal is active
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length > 0) return;

    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    const text = clipboardData.getData('text');
    handlePasteText(text);
});

// Shared Helper to process and chunk pasted crossword tokens
function handlePasteText(text) {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length > 0) return;

    if (activeRow === -1 || activeCol === -1) return;

    // Set TTFT on first input (paste injection)
    if (firstKeystrokeTime === null && gameStartTime !== null) {
        firstKeystrokeTime = Date.now();
        ttft = (firstKeystrokeTime - gameStartTime) / 1000;
        logToTerminal(`First token generated. TTFT: ${ttft.toFixed(2)}s.`, "system");
    }

    pasteDetected = true;
    
    const pastedText = text.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!pastedText) return;
    
    // Find active word
    const cellState = grid[activeRow][activeCol];
    if (!cellState) return;
    
    let activeWord = cellState.words.find(w => w.dir === typingDirection);
    if (!activeWord && cellState.words.length > 0) {
        activeWord = cellState.words[0];
    }
    if (!activeWord) return;
    
    // Start index in the WORDS array
    const startIndex = WORDS.indexOf(activeWord);
    
    let textPointer = 0;
    let wordsInjected = 0;
    let lettersCount = 0;
    
    for (let wIdx = startIndex; wIdx < WORDS.length && textPointer < pastedText.length; wIdx++) {
        const word = WORDS[wIdx];
        // How many letters do we need to extract for this word?
        const wordLen = word.text.length;
        const wordSub = pastedText.substring(textPointer, textPointer + wordLen);
        if (wordSub.length === 0) break;
        
        // Populate this word cell by cell
        for (let i = 0; i < wordSub.length; i++) {
            const char = wordSub[i];
            const currR = word.dir === "H" ? word.r : word.r + i;
            const currC = word.dir === "H" ? word.c + i : word.c;
            
            const cell = grid[currR][currC];
            if (cell) {
                keystrokesCount++;
                
                cell.currentValue = char;
                cell.isMutated = false;
                cell.originalMutationLetter = "";
                
                const cellEl = document.getElementById(`cell-${currR}-${currC}`);
                if (cellEl) {
                    cellEl.classList.remove('mutated');
                    const letterSpan = cellEl.querySelector('.cell-letter');
                    if (letterSpan) letterSpan.innerText = char;
                }
                
                // Manage context window
                contextQueue = contextQueue.filter(item => !(item.r === currR && item.c === currC));
                contextQueue.push({ r: currR, c: currC });
                if (contextQueue.length > contextWindowLimit) {
                    contextQueue.shift();
                }
                
                // Reset quadrant timer
                const q = getQuadrant(currR, currC);
                quadrantTimers[q] = cacheRetentionTime;
                
                lettersCount++;
            }
        }
        
        textPointer += wordSub.length;
        wordsInjected++;
    }
    
    playClickSound();
    updateStats();
    
    // Focus the start cell of the next word if available, or stay
    const nextIdx = startIndex + wordsInjected;
    if (nextIdx < WORDS.length) {
        selectClue(WORDS[nextIdx]);
    } else {
        // If we filled everything, select the last cell of the last word
        const lastWord = WORDS[WORDS.length - 1];
        selectCell(lastWord.r, lastWord.c);
    }
    
    logToTerminal(`Prompt injection: Injected ${lettersCount} tokens across ${wordsInjected} words.`, "warn");
}

// Hardware Presets for Game Difficulty
const PRESETS = {
    enterprise: { context: 64, cache: 90, temp: 0.2, label: "Enterprise API (Over-provisioned)" },
    local: { context: 32, cache: 45, temp: 0.7, label: "Local Llama (Quantized 7B)" },
    toaster: { context: 16, cache: 15, temp: 1.4, label: "Smart Toaster (Edge Inference)" }
};

function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    
    // Update variables
    contextWindowLimit = preset.context;
    cacheRetentionTime = preset.cache;
    temperature = preset.temp;
    
    // Sync slider values in DOM
    const sliderContext = document.getElementById('slider-context');
    const sliderCache = document.getElementById('slider-cache');
    const sliderTemp = document.getElementById('slider-temp');
    
    if (sliderContext) sliderContext.value = preset.context;
    if (sliderCache) sliderCache.value = preset.cache;
    if (sliderTemp) sliderTemp.value = preset.temp;
    
    // Sync slider label texts in DOM
    const valContext = document.getElementById('val-context');
    const valCache = document.getElementById('val-cache');
    const valTemp = document.getElementById('val-temp');
    
    if (valContext) valContext.innerText = preset.context;
    if (valCache) valCache.innerText = `${preset.cache}s`;
    if (valTemp) valTemp.innerText = preset.temp.toFixed(1);
    
    // Log preset application
    logToTerminal(`Applied preset config: ${preset.label}.`, "system");
    logToTerminal(`CW=${preset.context}, Cache=${preset.cache}s, Temp=${preset.temp.toFixed(1)}`, "system");
    
    playClickSound();
    
    // Update active timers limits
    for (let q = 1; q <= 4; q++) {
        quadrantTimers[q] = Math.min(quadrantTimers[q], cacheRetentionTime);
    }
    
    // Check if we need to immediately mutate items due to context window shrinking
    while (contextQueue.length > contextWindowLimit) {
        const oldest = contextQueue.shift();
        mutateCell(oldest.r, oldest.c);
    }
    
    // Update visual active states on preset buttons
    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`preset-${presetKey}`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Function to clear active preset state if user manually adjusts sliders
function clearActivePresets() {
    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
}

// Setup slider listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial game setup
    setupGame();
    
    // Open intro modal
    setTimeout(() => {
        openHowToModal();
    }, 500);
    
    // 2. Slider bindings
    const sliderContext = document.getElementById('slider-context');
    const valContext = document.getElementById('val-context');
    sliderContext.addEventListener('input', () => {
        contextWindowLimit = parseInt(sliderContext.value);
        valContext.innerText = contextWindowLimit;
        clearActivePresets();
    });
    sliderContext.addEventListener('change', () => {
        logToTerminal(`Context Window adjusted to ${contextWindowLimit} tokens.`, "system");
        playClickSound();
        
        // Mutate immediately if context overflowed
        while (contextQueue.length > contextWindowLimit) {
            const oldest = contextQueue.shift();
            mutateCell(oldest.r, oldest.c);
        }
    });

    const sliderCache = document.getElementById('slider-cache');
    const valCache = document.getElementById('val-cache');
    sliderCache.addEventListener('input', () => {
        cacheRetentionTime = parseInt(sliderCache.value);
        valCache.innerText = `${cacheRetentionTime}s`;
        clearActivePresets();
    });
    sliderCache.addEventListener('change', () => {
        logToTerminal(`Cache Retention adjusted to ${cacheRetentionTime}s.`, "system");
        playClickSound();
        
        // Clamp timers to new limit if needed
        for (let q = 1; q <= 4; q++) {
            quadrantTimers[q] = Math.min(quadrantTimers[q], cacheRetentionTime);
        }
    });

    const sliderTemp = document.getElementById('slider-temp');
    const valTemp = document.getElementById('val-temp');
    sliderTemp.addEventListener('input', () => {
        temperature = parseFloat(sliderTemp.value);
        valTemp.innerText = temperature.toFixed(1);
        clearActivePresets();
    });
    sliderTemp.addEventListener('change', () => {
        logToTerminal(`Model Temperature adjusted to ${temperature.toFixed(1)}.`, "system");
        playClickSound();
    });
});
