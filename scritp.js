// State Definitions
let states = [];
let startState = "";
let acceptStates = [];
let transitions = []; // Array of { from: 'q0', symbol: 'a', to: 'q1' }
let cy = null; // Cytoscape instance

// DOM Elements
const statesInput = document.getElementById('states-input');
const startStateInput = document.getElementById('start-state-input');
const acceptStatesInput = document.getElementById('accept-states-input');
const saveDesignBtn = document.getElementById('save-design-btn');
const designStatus = document.getElementById('design-status');

const transFrom = document.getElementById('trans-from');
const transSymbol = document.getElementById('trans-symbol');
const transTo = document.getElementById('trans-to');
const addTransBtn = document.getElementById('add-trans-btn');
const transitionBody = document.getElementById('transition-body');

const modeSelect = document.getElementById('automata-mode');
const inputStringEl = document.getElementById('input-string');
const simulateBtn = document.getElementById('simulate-btn');
const resetSimBtn = document.getElementById('reset-sim-btn');
const loadExampleBtn = document.getElementById('load-example-btn');
const exampleSelect = document.getElementById('example-select');
const epsilonBtn = document.getElementById('epsilon-btn');
const convertNfaDfaBtn = document.getElementById('convert-nfa-dfa-btn');
const minimizeDfaBtn = document.getElementById('minimize-dfa-btn');

const traceContainer = document.getElementById('trace-container');
const finalResult = document.getElementById('final-result');

// Regex panel elements
const regexInput = document.getElementById('regex-input');
const regexToNfaBtn = document.getElementById('regex-to-nfa-btn');
const regexToDfaBtn = document.getElementById('regex-to-dfa-btn');
const regexStatus = document.getElementById('regex-status');

// Initialize
function init() {
    saveDesignBtn.addEventListener('click', saveDesign);
    addTransBtn.addEventListener('click', addTransition);
    simulateBtn.addEventListener('click', runSimulation);
    resetSimBtn.addEventListener('click', resetSimulation);
    loadExampleBtn.addEventListener('click', loadExample);
    convertNfaDfaBtn.addEventListener('click', convertNfaToDfa);
    minimizeDfaBtn.addEventListener('click', minimizeDFA);

    // Epsilon button: insert ε into the symbol field
    epsilonBtn.addEventListener('click', () => {
        transSymbol.value = 'ε';
        transSymbol.focus();
    });

    // Show/hide epsilon button based on mode
    modeSelect.addEventListener('change', toggleEpsilonButton);
    toggleEpsilonButton(); // set initial state

    // Regex → Automata buttons
    regexToNfaBtn.addEventListener('click', () => handleRegexConvert('NFA'));
    regexToDfaBtn.addEventListener('click', () => handleRegexConvert('DFA'));

    updateGraph();
}

function toggleEpsilonButton() {
    const isNFA = modeSelect.value === 'NFA';
    const isDFA = modeSelect.value === 'DFA';
    epsilonBtn.style.display = isNFA ? 'inline-block' : 'none';
    convertNfaDfaBtn.style.display = isNFA ? 'inline-block' : 'none';
    minimizeDfaBtn.style.display = isDFA ? 'inline-block' : 'none';
}

function updateGraph() {
    const elements = [];

    // Nodes
    states.forEach(s => {
        let classes = [];
        if (s === startState) classes.push('start');
        if (acceptStates.includes(s)) classes.push('accept');

        elements.push({
            data: { id: s },
            classes: classes.join(' ')
        });
    });

    // Edges
    transitions.forEach((t, i) => {
        elements.push({
            data: { id: 'e' + i, source: t.from, target: t.to, label: t.symbol }
        });
    });

    if (cy) {
        cy.destroy();
    }

    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#6C63FF',
                    'label': 'data(id)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '14px',
                    'font-weight': 'bold',
                    'width': '44px',
                    'height': '44px',
                    'border-width': '2px',
                    'border-color': 'rgba(255,255,255,0.15)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': 'rgba(167,139,250,0.5)',
                    'target-arrow-color': 'rgba(167,139,250,0.7)',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '12px',
                    'color': '#e8e6f0',
                    'text-background-opacity': 0.85,
                    'text-background-color': '#1e1b4b',
                    'text-background-padding': '3px',
                    'control-point-step-size': 40
                }
            },
            {
                selector: 'node.accept',
                style: {
                    'border-width': '5px',
                    'border-color': '#00BFA6',
                    'border-style': 'double'
                }
            },
            {
                selector: 'node.start',
                style: {
                    'border-width': '3px',
                    'border-color': '#F59E0B'
                }
            },
            {
                selector: 'node.active',
                style: {
                    'background-color': '#FF6F91',
                    'color': '#fff',
                    'transition-property': 'background-color, color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge.active-edge',
                style: {
                    'line-color': '#FF6F91',
                    'target-arrow-color': '#FF6F91',
                    'width': 4,
                    'transition-property': 'line-color, target-arrow-color, width',
                    'transition-duration': '0.3s'
                }
            }
        ],
        layout: {
            name: 'cose',
            padding: 30,
            animate: true
        }
    });
}

function saveDesign() {
    const sVal = statesInput.value.trim();
    if (sVal) {
        states = sVal.split(',').map(s => s.trim()).filter(s => s);
    } else {
        states = [];
    }

    startState = startStateInput.value.trim();

    const aVal = acceptStatesInput.value.trim();
    if (aVal) {
        acceptStates = aVal.split(',').map(s => s.trim()).filter(s => s);
    } else {
        acceptStates = [];
    }

    if (states.length === 0 || !startState) {
        designStatus.textContent = "Error: Please provide states and a start state.";
        designStatus.style.color = "var(--danger)";
        updateGraph();
        return;
    }

    designStatus.textContent = `Design saved! States: ${states.length}, Start: ${startState}, Accept: ${acceptStates.length}`;
    designStatus.style.color = "var(--primary)";
    updateGraph();
}

function addTransition() {
    const from = transFrom.value.trim();
    const symbol = transSymbol.value.trim();
    const to = transTo.value.trim();

    if (!from || !symbol || !to) {
        showToast('Please fill all transition fields.', 'error');
        return;
    }

    if (!states.includes(from)) {
        showToast(`State '${from}' not in states list — added anyway.`, 'info');
    }

    const trans = { from, symbol, to };
    transitions.push(trans);

    renderTransitions();

    transFrom.value = '';
    transSymbol.value = '';
    transTo.value = '';
    transFrom.focus();
}

function renderTransitions() {
    transitionBody.innerHTML = '';
    transitions.forEach((t, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.from}</td>
            <td>${t.symbol}</td>
            <td>${t.to}</td>
            <td><button class="btn danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="removeTransition(${index})">Delete</button></td>
        `;
        transitionBody.appendChild(tr);
    });
    updateGraph();
}

window.removeTransition = function (index) {
    transitions.splice(index, 1);
    renderTransitions();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const graphPanel = document.getElementById('graph-panel');
const outputPanel = document.getElementById('output-panel');
let simulationAborted = false;

function enterFullscreen(panel) {
    // Add close button if not already present
    if (!panel.querySelector('.close-fullscreen-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Exit fullscreen';
        closeBtn.addEventListener('click', () => {
            simulationAborted = true;
            exitFullscreen(panel);
        });
        panel.style.position = 'relative';
        panel.appendChild(closeBtn);
    }
    panel.classList.add('panel-fullscreen');
    // For cy graph, resize after going fullscreen
    if (cy && panel === graphPanel) {
        setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 50);
    }
}

function exitFullscreen(panel) {
    panel.classList.remove('panel-fullscreen');
    const closeBtn = panel.querySelector('.close-fullscreen-btn');
    if (closeBtn) closeBtn.remove();
    // Restore cy size
    if (cy && panel === graphPanel) {
        setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 50);
    }
}

async function runSimulation() {
    if (states.length === 0 || !startState) {
        showToast('Please set the automata design first.', 'error');
        return;
    }

    const mode = modeSelect.value;
    const inputStr = inputStringEl.value.trim();
    simulationAborted = false;

    // Reset Trace UI
    traceContainer.innerHTML = '';
    finalResult.className = 'final-result hidden';

    // Disable buttons during simulation
    simulateBtn.disabled = true;
    simulateBtn.textContent = 'Simulating...';

    // ── Phase 1: Expand graph panel & smooth-scroll to it ──
    graphPanel.classList.add('sim-active-panel');
    const cyEl = document.getElementById('cy');
    cyEl.style.height = '520px';
    if (cy) { setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 80); }

    // Smooth scroll to graph so it's fully visible
    await smoothScrollTo(graphPanel, 600);
    await sleep(200);

    // ── Phase 2: Run the state-machine animation on the graph ──
    if (mode === 'DFA') {
        await simulateDFA(inputStr);
    } else {
        await simulateNFA(inputStr);
    }

    if (simulationAborted) {
        cleanupSimPanels(cyEl);
        return;
    }

    // Brief pause so user can see the final graph state
    await sleep(800);

    // Remove graph highlight
    graphPanel.classList.remove('sim-active-panel');
    cyEl.style.height = '450px';
    if (cy) { setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 80); }

    // ── Phase 3: Scroll to output trace panel & reveal steps ──
    outputPanel.classList.add('sim-active-panel');
    await smoothScrollTo(outputPanel, 600);
    await sleep(300);

    await revealTraceSteps();

    // Keep output highlighted for a moment, then calm down
    await sleep(600);
    outputPanel.classList.remove('sim-active-panel');

    simulateBtn.disabled = false;
    simulateBtn.textContent = 'Simulate';
}

/** Cleanup helper if simulation is aborted mid-way */
function cleanupSimPanels(cyEl) {
    graphPanel.classList.remove('sim-active-panel');
    outputPanel.classList.remove('sim-active-panel');
    cyEl.style.height = '450px';
    if (cy) { setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 80); }
    simulateBtn.disabled = false;
    simulateBtn.textContent = 'Simulate';
}

/**
 * Smooth-scroll an element into view and return a promise that
 * resolves after the scroll animation completes.
 */
function smoothScrollTo(el, durationMs = 600) {
    return new Promise(resolve => {
        const targetY = el.getBoundingClientRect().top + window.pageYOffset - 20;
        const startY = window.pageYOffset;
        const diff = targetY - startY;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / durationMs, 1);
            // ease-in-out quad
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            window.scrollTo(0, startY + diff * ease);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

async function revealTraceSteps() {
    const steps = traceContainer.querySelectorAll('.trace-step');
    for (let i = 0; i < steps.length; i++) {
        if (simulationAborted) return;
        steps[i].classList.remove('step-hidden');
        steps[i].classList.add('step-reveal');
        // Keep the trace container scrolled to the newest step
        traceContainer.scrollTop = traceContainer.scrollHeight;
        // Also keep the page scrolled so the output panel stays in view
        outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await sleep(400);
    }
    // Show the final result with a pop-in
    finalResult.classList.remove('hidden');
    finalResult.style.animation = 'fadeIn 0.5s ease-in';
    // Scroll to make sure the result banner is visible
    finalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addTraceStep(stepText) {
    const div = document.createElement('div');
    div.className = 'trace-step step-hidden';
    div.innerHTML = stepText;
    traceContainer.appendChild(div);
}

function showResult(isAccepted) {
    // Prepare result but keep it hidden until trace reveal
    finalResult.classList.remove('accepted', 'rejected');
    finalResult.classList.add('hidden');
    if (isAccepted) {
        finalResult.innerHTML = "Simulation Finished: <br/> <span>String ACCEPTED</span>";
        finalResult.classList.add('accepted');
    } else {
        finalResult.innerHTML = "Simulation Finished: <br/> <span>String REJECTED</span>";
        finalResult.classList.add('rejected');
    }
}

async function simulateDFA(inputStr) {
    if (cy) cy.elements().removeClass('active').removeClass('active-edge');

    let currentState = startState;
    addTraceStep(`[INITIAL] Start at State: <span class="current-states">${currentState}</span>`);
    if (cy) cy.$('#' + CSS.escape(currentState)).addClass('active');

    await sleep(800);

    let rejectedEarly = false;

    for (let i = 0; i < inputStr.length; i++) {
        const symbol = inputStr[i];

        if (cy) cy.elements().removeClass('active-edge');

        // Find transition
        const transIndex = transitions.findIndex(trans => trans.from === currentState && trans.symbol === symbol);
        const t = transitions[transIndex];

        if (!t) {
            addTraceStep(`Read <span class="symbol">'${symbol}'</span>: No valid transition from <span class="current-states">${currentState}</span>. Moving to Dead State.`);
            if (cy) cy.elements().removeClass('active');
            currentState = "DEAD";
            rejectedEarly = true;
            break;
        }

        currentState = t.to;
        addTraceStep(`Read <span class="symbol">'${symbol}'</span>: Transitioned to <span class="current-states">${currentState}</span>`);

        if (cy) {
            cy.elements().removeClass('active');
            cy.$('#e' + transIndex).addClass('active-edge');
            cy.$('#' + CSS.escape(currentState)).addClass('active');
        }
        await sleep(800);
    }

    if (cy) cy.elements().removeClass('active-edge');

    if (rejectedEarly) {
        showResult(false);
    } else {
        const isAccepted = acceptStates.includes(currentState);
        showResult(isAccepted);
    }
}

function getEpsilonClosure(stateSet) {
    const stack = [...stateSet];
    const closure = new Set(stateSet);

    while (stack.length > 0) {
        const current = stack.pop();
        // find epsilon transitions (symbol is empty string, 'e', or 'ε')
        const epsTransitions = transitions.filter(t => t.from === current && (t.symbol === '' || t.symbol.toLowerCase() === 'e' || t.symbol === 'ε'));

        for (const t of epsTransitions) {
            if (!closure.has(t.to)) {
                closure.add(t.to);
                stack.push(t.to);
            }
        }
    }
    return closure;
}

function highlightNFAStates(stateSet) {
    if (!cy) return;
    cy.elements().removeClass('active');
    stateSet.forEach(s => cy.$('#' + CSS.escape(s)).addClass('active'));
}

async function simulateNFA(inputStr) {
    if (cy) cy.elements().removeClass('active').removeClass('active-edge');

    let currentStates = new Set([startState]);

    // Initial epsilon closure
    let initialClosure = getEpsilonClosure(currentStates);
    if (initialClosure.size > currentStates.size) {
        addTraceStep(`[INITIAL] Start at State: <span class="current-states">${startState}</span>`);
        highlightNFAStates(currentStates);
        await sleep(800);

        currentStates = initialClosure;
        addTraceStep(`[ε-CLOSURE] Current States expanded to: <span class="current-states">{ ${Array.from(currentStates).join(', ')} }</span>`);
        highlightNFAStates(currentStates);
    } else {
        addTraceStep(`[INITIAL] Start at States: <span class="current-states">{ ${Array.from(currentStates).join(', ')} }</span>`);
        highlightNFAStates(currentStates);
    }

    await sleep(800);

    for (let i = 0; i < inputStr.length; i++) {
        const symbol = inputStr[i];
        let nextStates = new Set();
        let activeEdgeIndexes = [];

        for (const state of currentStates) {
            // Find all indices of matching transitions
            transitions.forEach((t, index) => {
                if (t.from === state && t.symbol === symbol) {
                    nextStates.add(t.to);
                    activeEdgeIndexes.push(index);
                }
            });
        }

        let closureNextStates = getEpsilonClosure(nextStates);

        if (closureNextStates.size === 0) {
            addTraceStep(`Read <span class="symbol">'${symbol}'</span>: No valid transitions. State set is Empty.`);
            if (cy) cy.elements().removeClass('active').removeClass('active-edge');
            currentStates = new Set();
            break;
        }

        currentStates = closureNextStates;
        addTraceStep(`Read <span class="symbol">'${symbol}'</span>: Current States are <span class="current-states">{ ${Array.from(currentStates).join(', ')} }</span>`);

        if (cy) {
            cy.elements().removeClass('active').removeClass('active-edge');
            activeEdgeIndexes.forEach(idx => cy.$('#e' + idx).addClass('active-edge'));
            highlightNFAStates(currentStates);
        }

        await sleep(800);
    }

    if (cy) cy.elements().removeClass('active-edge');

    // Check if any current state is an accept state
    const isAccepted = Array.from(currentStates).some(state => acceptStates.includes(state));
    showResult(isAccepted);
}

function resetSimulation() {
    traceContainer.innerHTML = '<p class="placeholder-text">Run simulation to see step-by-step trace here.</p>';
    finalResult.className = 'final-result hidden';
    simulationAborted = true;
    // Remove any active simulation highlights
    graphPanel.classList.remove('sim-active-panel');
    outputPanel.classList.remove('sim-active-panel');
    const cyEl = document.getElementById('cy');
    if (cyEl) cyEl.style.height = '450px';
    if (cy) {
        cy.elements().removeClass('active');
        cy.elements().removeClass('active-edge');
        setTimeout(() => { cy.resize(); cy.fit(null, 30); }, 80);
    }
}

function loadExample() {
    const ex = exampleSelect.value;

    if (ex === 'dfa1') {
        statesInput.value = "q0, q1, q2";
        startStateInput.value = "q0";
        acceptStatesInput.value = "q2";
        saveDesign();

        transitions = [
            { from: 'q0', symbol: 'a', to: 'q1' },
            { from: 'q0', symbol: 'b', to: 'q0' },
            { from: 'q1', symbol: 'a', to: 'q1' },
            { from: 'q1', symbol: 'b', to: 'q2' },
            { from: 'q2', symbol: 'a', to: 'q2' },
            { from: 'q2', symbol: 'b', to: 'q2' }
        ];
        renderTransitions();

        modeSelect.value = "DFA";
        inputStringEl.value = "ababa";
    } else if (ex === 'nfa1') {
        statesInput.value = "q0, q1, q2";
        startStateInput.value = "q0";
        acceptStatesInput.value = "q2";
        saveDesign();

        transitions = [
            { from: 'q0', symbol: '0', to: 'q0' },
            { from: 'q0', symbol: '1', to: 'q0' },
            { from: 'q0', symbol: '0', to: 'q1' },
            { from: 'q1', symbol: '1', to: 'q2' }
        ];
        renderTransitions();

        modeSelect.value = "NFA";
        inputStringEl.value = "1001";
    }

    resetSimulation();
}

// ── NFA → DFA Conversion (Subset Construction) ──
function convertNfaToDfa() {
    if (states.length === 0 || !startState) {
        showToast('Please set the automata design first.', 'error');
        return;
    }

    // 1. Collect the input alphabet (exclude epsilon symbols)
    const alphabet = [...new Set(
        transitions
            .map(t => t.symbol)
            .filter(s => s !== '' && s !== 'ε' && s.toLowerCase() !== 'e')
    )];

    // 2. Helper: convert a Set to a sorted, deterministic key
    const setKey = s => [...s].sort().join(',');
    const keyToLabel = key => key ? '{' + key + '}' : '∅';

    // 3. Build the DFA via subset construction
    const startClosure = getEpsilonClosure(new Set([startState]));
    const startKey = setKey(startClosure);

    const dfaTransitions = [];   // { from, symbol, to }
    const dfaStateMap = new Map(); // key → label
    const queue = [startClosure];
    let labelIndex = 0;

    dfaStateMap.set(startKey, 'D' + labelIndex++);

    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = setKey(current);
        const currentLabel = dfaStateMap.get(currentKey);

        for (const sym of alphabet) {
            // Move: for every state in current, find states reachable on sym
            let moveSet = new Set();
            for (const state of current) {
                transitions.forEach(t => {
                    if (t.from === state && t.symbol === sym) {
                        moveSet.add(t.to);
                    }
                });
            }

            // Epsilon closure of the move set
            const closure = getEpsilonClosure(moveSet);
            if (closure.size === 0) continue; // dead state – skip

            const closureKey = setKey(closure);

            if (!dfaStateMap.has(closureKey)) {
                dfaStateMap.set(closureKey, 'D' + labelIndex++);
                queue.push(closure);
            }

            dfaTransitions.push({
                from: currentLabel,
                symbol: sym,
                to: dfaStateMap.get(closureKey)
            });
        }
    }

    // 4. Determine new accept states
    const newAcceptStates = [];
    for (const [key, label] of dfaStateMap) {
        const memberStates = key.split(',');
        if (memberStates.some(s => acceptStates.includes(s))) {
            newAcceptStates.push(label);
        }
    }

    const newStates = [...dfaStateMap.values()];
    const newStart = dfaStateMap.get(startKey);

    // 5. Apply the converted DFA to the UI
    states = newStates;
    startState = newStart;
    acceptStates = newAcceptStates;
    transitions = dfaTransitions;

    statesInput.value = states.join(', ');
    startStateInput.value = startState;
    acceptStatesInput.value = acceptStates.join(', ');

    modeSelect.value = 'DFA';
    toggleEpsilonButton();

    renderTransitions();
    saveDesign();

    // Show mapping info in a non-intrusive way
    let mappingLines = [];
    for (const [key, label] of dfaStateMap) {
        mappingLines.push(`${label} = { ${key} }`);
    }
    designStatus.textContent = `✅ Converted! ${newStates.length} DFA states created.`;
    designStatus.style.color = 'var(--primary)';

    // Show mapping in the trace container
    traceContainer.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'trace-step';
    header.innerHTML = '<strong>NFA → DFA State Mapping:</strong>';
    traceContainer.appendChild(header);
    for (const line of mappingLines) {
        const div = document.createElement('div');
        div.className = 'trace-step';
        div.innerHTML = `<span class="current-states">${line}</span>`;
        traceContainer.appendChild(div);
    }
    finalResult.className = 'final-result hidden';
}


// ═══════════════════════════════════════════════════════════════════════════
//  REGEX → NFA / DFA  (Thompson's Construction + Subset Construction)
// ═══════════════════════════════════════════════════════════════════════════

/*
 * Supported regex syntax:
 *   Literals:   a-z, A-Z, 0-9
 *   Union:      a|b
 *   Kleene star: a*
 *   Plus:       a+     (= aa*)
 *   Optional:   a?     (= a|ε)
 *   Grouping:   (ab|c)*
 *   Implicit concatenation:  ab  means  a·b
 *   Dot:        .      (matches any single character – expanded to union of
 *                       all alphabet symbols found in the regex)
 */

// ── 1. Tokenizer ────────────────────────────────────────────────────────────

const TOKEN = {
    CHAR: 'CHAR',
    UNION: 'UNION',    // |
    STAR: 'STAR',     // *
    PLUS: 'PLUS',     // +
    QMARK: 'QMARK',   // ?
    LPAREN: 'LPAREN',  // (
    RPAREN: 'RPAREN',  // )
    CONCAT: 'CONCAT',  // implicit
};

function tokenize(regex) {
    const tokens = [];
    for (let i = 0; i < regex.length; i++) {
        const c = regex[i];
        switch (c) {
            case '(': tokens.push({ type: TOKEN.LPAREN }); break;
            case ')': tokens.push({ type: TOKEN.RPAREN }); break;
            case '|': tokens.push({ type: TOKEN.UNION }); break;
            case '*': tokens.push({ type: TOKEN.STAR }); break;
            case '+': tokens.push({ type: TOKEN.PLUS }); break;
            case '?': tokens.push({ type: TOKEN.QMARK }); break;
            case '\\':
                // Escape next character
                i++;
                if (i < regex.length) {
                    tokens.push({ type: TOKEN.CHAR, value: regex[i] });
                }
                break;
            default:
                // Accept any alphanumeric character, dot, or other literals
                tokens.push({ type: TOKEN.CHAR, value: c });
                break;
        }
    }
    return tokens;
}

/**
 * Insert explicit CONCAT tokens where concatenation is implied.
 * Concatenation is implied between:
 *   CHAR CHAR,  CHAR LPAREN,  RPAREN CHAR,  RPAREN LPAREN,
 *   STAR/PLUS/QMARK CHAR,  STAR/PLUS/QMARK LPAREN
 */
function insertConcatTokens(tokens) {
    const result = [];
    for (let i = 0; i < tokens.length; i++) {
        result.push(tokens[i]);
        if (i + 1 < tokens.length) {
            const left = tokens[i].type;
            const right = tokens[i + 1].type;
            const leftConcatable = (left === TOKEN.CHAR || left === TOKEN.RPAREN ||
                left === TOKEN.STAR || left === TOKEN.PLUS || left === TOKEN.QMARK);
            const rightConcatable = (right === TOKEN.CHAR || right === TOKEN.LPAREN);
            if (leftConcatable && rightConcatable) {
                result.push({ type: TOKEN.CONCAT });
            }
        }
    }
    return result;
}

// ── 2. Parser  (Recursive Descent → AST) ────────────────────────────────

/*
 * Grammar (lowest → highest precedence):
 *   expr     → term ('|' term)*
 *   term     → factor (CONCAT factor)*
 *   factor   → atom ('*' | '+' | '?')*
 *   atom     → CHAR | '(' expr ')'
 */

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }

    consume(type) {
        const t = this.peek();
        if (!t || t.type !== type) throw new Error(`Expected ${type} but got ${t ? t.type : 'EOF'}`);
        this.pos++;
        return t;
    }

    parse() {
        const ast = this.expr();
        if (this.pos < this.tokens.length) {
            throw new Error('Unexpected token: ' + this.tokens[this.pos].type);
        }
        return ast;
    }

    expr() {
        let node = this.term();
        while (this.peek() && this.peek().type === TOKEN.UNION) {
            this.consume(TOKEN.UNION);
            const right = this.term();
            node = { type: 'UNION', left: node, right };
        }
        return node;
    }

    term() {
        let node = this.factor();
        while (this.peek() && this.peek().type === TOKEN.CONCAT) {
            this.consume(TOKEN.CONCAT);
            const right = this.factor();
            node = { type: 'CONCAT', left: node, right };
        }
        return node;
    }

    factor() {
        let node = this.atom();
        while (this.peek() &&
            (this.peek().type === TOKEN.STAR || this.peek().type === TOKEN.PLUS || this.peek().type === TOKEN.QMARK)) {
            const op = this.peek().type;
            this.pos++;
            if (op === TOKEN.STAR) {
                node = { type: 'STAR', child: node };
            } else if (op === TOKEN.PLUS) {
                // a+ = a · a*
                node = { type: 'CONCAT', left: node, right: { type: 'STAR', child: JSON.parse(JSON.stringify(node)) } };
            } else if (op === TOKEN.QMARK) {
                // a? = a | ε
                node = { type: 'UNION', left: node, right: { type: 'EPSILON' } };
            }
        }
        return node;
    }

    atom() {
        const t = this.peek();
        if (!t) throw new Error('Unexpected end of expression');
        if (t.type === TOKEN.CHAR) {
            this.pos++;
            return { type: 'CHAR', value: t.value };
        }
        if (t.type === TOKEN.LPAREN) {
            this.consume(TOKEN.LPAREN);
            const node = this.expr();
            this.consume(TOKEN.RPAREN);
            return node;
        }
        throw new Error('Unexpected token: ' + t.type);
    }
}

// ── 3. Thompson's Construction  (AST → ε-NFA) ──────────────────────────

let _nfaStateCounter = 0;

function newNFAState() {
    return 'S' + _nfaStateCounter++;
}

/**
 * Each NFA fragment has:
 *   { start, accept, transitions: [{from, symbol, to}], states: [string] }
 */
function thompsonBuild(ast) {
    switch (ast.type) {
        case 'CHAR': {
            const s = newNFAState();
            const a = newNFAState();
            return {
                start: s,
                accept: a,
                transitions: [{ from: s, symbol: ast.value, to: a }],
                states: [s, a]
            };
        }
        case 'EPSILON': {
            const s = newNFAState();
            const a = newNFAState();
            return {
                start: s,
                accept: a,
                transitions: [{ from: s, symbol: 'ε', to: a }],
                states: [s, a]
            };
        }
        case 'CONCAT': {
            const left = thompsonBuild(ast.left);
            const right = thompsonBuild(ast.right);
            // Merge left.accept with right.start via ε-transition
            return {
                start: left.start,
                accept: right.accept,
                transitions: [
                    ...left.transitions,
                    ...right.transitions,
                    { from: left.accept, symbol: 'ε', to: right.start }
                ],
                states: [...left.states, ...right.states]
            };
        }
        case 'UNION': {
            const left = thompsonBuild(ast.left);
            const right = thompsonBuild(ast.right);
            const s = newNFAState();
            const a = newNFAState();
            return {
                start: s,
                accept: a,
                transitions: [
                    ...left.transitions,
                    ...right.transitions,
                    { from: s, symbol: 'ε', to: left.start },
                    { from: s, symbol: 'ε', to: right.start },
                    { from: left.accept, symbol: 'ε', to: a },
                    { from: right.accept, symbol: 'ε', to: a }
                ],
                states: [s, a, ...left.states, ...right.states]
            };
        }
        case 'STAR': {
            const child = thompsonBuild(ast.child);
            const s = newNFAState();
            const a = newNFAState();
            return {
                start: s,
                accept: a,
                transitions: [
                    ...child.transitions,
                    { from: s, symbol: 'ε', to: child.start },
                    { from: s, symbol: 'ε', to: a },
                    { from: child.accept, symbol: 'ε', to: child.start },
                    { from: child.accept, symbol: 'ε', to: a }
                ],
                states: [s, a, ...child.states]
            };
        }
        default:
            throw new Error('Unknown AST node type: ' + ast.type);
    }
}

/**
 * Main: parse regex string → NFA (states, transitions, start, accept)
 */
function regexToNFA(regexStr) {
    _nfaStateCounter = 0;

    // Validate
    if (!regexStr || regexStr.trim() === '') throw new Error('Empty regex');

    const raw = tokenize(regexStr.trim());
    const tokens = insertConcatTokens(raw);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const nfa = thompsonBuild(ast);

    return {
        states: [...new Set(nfa.states)],
        start: nfa.start,
        accept: [nfa.accept],
        transitions: nfa.transitions
    };
}

// ── 4. Subset Construction  (ε-NFA → DFA) ──────────────────────────────

/**
 * getEpsilonClosureFor — like getEpsilonClosure but works on an
 * arbitrary transition array (not the global one).
 */
function getEpsilonClosureFor(stateSet, trans) {
    const stack = [...stateSet];
    const closure = new Set(stateSet);

    while (stack.length > 0) {
        const current = stack.pop();
        const eps = trans.filter(t => t.from === current && (t.symbol === '' || t.symbol === 'ε'));
        for (const t of eps) {
            if (!closure.has(t.to)) {
                closure.add(t.to);
                stack.push(t.to);
            }
        }
    }
    return closure;
}

function nfaToDFA(nfa) {
    const alphabet = [...new Set(
        nfa.transitions
            .map(t => t.symbol)
            .filter(s => s !== '' && s !== 'ε')
    )];

    const setKey = s => [...s].sort().join(',');

    const startClosure = getEpsilonClosureFor(new Set([nfa.start]), nfa.transitions);
    const startKey = setKey(startClosure);

    const dfaTransitions = [];
    const dfaStateMap = new Map();
    const queue = [startClosure];
    let labelIdx = 0;

    dfaStateMap.set(startKey, 'D' + labelIdx++);

    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = setKey(current);
        const currentLabel = dfaStateMap.get(currentKey);

        for (const sym of alphabet) {
            let moveSet = new Set();
            for (const state of current) {
                nfa.transitions.forEach(t => {
                    if (t.from === state && t.symbol === sym) moveSet.add(t.to);
                });
            }

            const closure = getEpsilonClosureFor(moveSet, nfa.transitions);
            if (closure.size === 0) continue;

            const closureKey = setKey(closure);
            if (!dfaStateMap.has(closureKey)) {
                dfaStateMap.set(closureKey, 'D' + labelIdx++);
                queue.push(closure);
            }

            dfaTransitions.push({
                from: currentLabel,
                symbol: sym,
                to: dfaStateMap.get(closureKey)
            });
        }
    }

    const dfaAccept = [];
    for (const [key, label] of dfaStateMap) {
        const members = key.split(',');
        if (members.some(s => nfa.accept.includes(s))) {
            dfaAccept.push(label);
        }
    }

    return {
        states: [...dfaStateMap.values()],
        start: dfaStateMap.get(startKey),
        accept: dfaAccept,
        transitions: dfaTransitions,
        mapping: dfaStateMap   // for display
    };
}

// ── 5. Wire Regex buttons ───────────────────────────────────────────────

function handleRegexConvert(target) {
    const regexStr = regexInput.value.trim();
    if (!regexStr) {
        regexStatus.textContent = '⚠ Please enter a regular expression.';
        regexStatus.style.color = 'var(--danger)';
        return;
    }

    try {
        const nfa = regexToNFA(regexStr);

        if (target === 'NFA') {
            // Apply NFA directly
            states = nfa.states;
            startState = nfa.start;
            acceptStates = nfa.accept;
            transitions = nfa.transitions;

            modeSelect.value = 'NFA';
            toggleEpsilonButton();

            statesInput.value = states.join(', ');
            startStateInput.value = startState;
            acceptStatesInput.value = acceptStates.join(', ');

            renderTransitions();
            saveDesign();

            regexStatus.innerHTML = `✅ NFA built — <strong>${states.length}</strong> states, <strong>${transitions.length}</strong> transitions`;
            regexStatus.style.color = 'var(--primary)';

            // Show info in trace
            traceContainer.innerHTML = '';
            const hdr = document.createElement('div');
            hdr.className = 'trace-step';
            hdr.innerHTML = `<strong>Regex → ε-NFA</strong>  for  <code>${escapeHtml(regexStr)}</code>`;
            traceContainer.appendChild(hdr);

            const info = document.createElement('div');
            info.className = 'trace-step';
            info.innerHTML = `States: <span class="current-states">${states.join(', ')}</span><br>` +
                `Start: <span class="current-states">${startState}</span><br>` +
                `Accept: <span class="current-states">${acceptStates.join(', ')}</span>`;
            traceContainer.appendChild(info);
            finalResult.className = 'final-result hidden';

        } else {
            // target === 'DFA' — convert NFA → DFA
            const dfa = nfaToDFA(nfa);

            states = dfa.states;
            startState = dfa.start;
            acceptStates = dfa.accept;
            transitions = dfa.transitions;

            modeSelect.value = 'DFA';
            toggleEpsilonButton();

            statesInput.value = states.join(', ');
            startStateInput.value = startState;
            acceptStatesInput.value = acceptStates.join(', ');

            renderTransitions();
            saveDesign();

            regexStatus.innerHTML = `✅ DFA built — <strong>${states.length}</strong> states, <strong>${transitions.length}</strong> transitions`;
            regexStatus.style.color = 'var(--primary)';

            // Show mapping in trace
            traceContainer.innerHTML = '';
            const hdr = document.createElement('div');
            hdr.className = 'trace-step';
            hdr.innerHTML = `<strong>Regex → DFA</strong>  for  <code>${escapeHtml(regexStr)}</code>`;
            traceContainer.appendChild(hdr);

            for (const [key, label] of dfa.mapping) {
                const div = document.createElement('div');
                div.className = 'trace-step';
                div.innerHTML = `<span class="current-states">${label}</span> = { ${key} }`;
                traceContainer.appendChild(div);
            }
            finalResult.className = 'final-result hidden';
        }

    } catch (err) {
        regexStatus.textContent = '❌ Error: ' + err.message;
        regexStatus.style.color = 'var(--danger)';
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════════════════════
//  DFA MINIMIZATION  (Hopcroft's Partition Refinement)
// ═══════════════════════════════════════════════════════════════════════════

function minimizeDFA() {
    if (states.length === 0 || !startState) {
        showToast('Please set the automata design first.', 'error');
        return;
    }
    if (modeSelect.value !== 'DFA') {
        showToast('Please switch to DFA mode first.', 'error');
        return;
    }

    // 1. Collect the input alphabet
    const alphabet = [...new Set(transitions.map(t => t.symbol))];

    // 2. Build a quick transition lookup:  transMap[state][symbol] = targetState
    const transMap = {};
    for (const s of states) {
        transMap[s] = {};
    }
    for (const t of transitions) {
        transMap[t.from][t.symbol] = t.to;
    }

    // 3. Remove unreachable states from the start state
    const reachable = new Set();
    const rQueue = [startState];
    reachable.add(startState);
    while (rQueue.length > 0) {
        const cur = rQueue.shift();
        for (const sym of alphabet) {
            const dest = transMap[cur] && transMap[cur][sym];
            if (dest && !reachable.has(dest)) {
                reachable.add(dest);
                rQueue.push(dest);
            }
        }
    }

    const liveStates = states.filter(s => reachable.has(s));
    const liveAccept = acceptStates.filter(s => reachable.has(s));
    const liveNonAccept = liveStates.filter(s => !liveAccept.includes(s));

    if (liveStates.length === 0) {
        showToast('No reachable states found!', 'error');
        return;
    }

    // 4. Initial partition: { accept states } and { non-accept states }
    let partitions = [];
    if (liveAccept.length > 0) partitions.push(new Set(liveAccept));
    if (liveNonAccept.length > 0) partitions.push(new Set(liveNonAccept));

    // Helper: find which partition a state belongs to
    function getPartitionIndex(state) {
        for (let i = 0; i < partitions.length; i++) {
            if (partitions[i].has(state)) return i;
        }
        return -1;
    }

    // 5. Refine partitions until stable
    let changed = true;
    while (changed) {
        changed = false;
        const newPartitions = [];

        for (const group of partitions) {
            if (group.size <= 1) {
                newPartitions.push(group);
                continue;
            }

            // Try to split this group
            const statesArr = [...group];
            const representative = statesArr[0];
            const same = new Set([representative]);
            const diff = new Set();

            for (let i = 1; i < statesArr.length; i++) {
                const s = statesArr[i];
                let equivalent = true;

                for (const sym of alphabet) {
                    const repDest = transMap[representative] && transMap[representative][sym];
                    const sDest = transMap[s] && transMap[s][sym];

                    // Both undefined (dead) → same partition (-1)
                    const repPartIdx = repDest ? getPartitionIndex(repDest) : -1;
                    const sPartIdx = sDest ? getPartitionIndex(sDest) : -1;

                    if (repPartIdx !== sPartIdx) {
                        equivalent = false;
                        break;
                    }
                }

                if (equivalent) {
                    same.add(s);
                } else {
                    diff.add(s);
                }
            }

            newPartitions.push(same);
            if (diff.size > 0) {
                // Further split diff among themselves
                const diffArr = [...diff];
                const subGroups = [new Set([diffArr[0]])];
                for (let i = 1; i < diffArr.length; i++) {
                    let placed = false;
                    for (const sg of subGroups) {
                        const rep = [...sg][0];
                        let eq = true;
                        for (const sym of alphabet) {
                            const repDest = transMap[rep] && transMap[rep][sym];
                            const sDest = transMap[diffArr[i]] && transMap[diffArr[i]][sym];
                            const rp = repDest ? getPartitionIndex(repDest) : -1;
                            const sp = sDest ? getPartitionIndex(sDest) : -1;
                            if (rp !== sp) { eq = false; break; }
                        }
                        if (eq) { sg.add(diffArr[i]); placed = true; break; }
                    }
                    if (!placed) subGroups.push(new Set([diffArr[i]]));
                }
                for (const sg of subGroups) newPartitions.push(sg);
                changed = true;
            }
        }

        partitions = newPartitions;
    }

    // 6. Build the minimized DFA
    // Label each partition
    const partLabels = new Map();
    partitions.forEach((group, idx) => {
        partLabels.set(idx, 'M' + idx);
    });

    const minTransitions = [];
    const minStates = [];
    const minAccept = [];
    let minStart = '';

    for (let i = 0; i < partitions.length; i++) {
        const label = partLabels.get(i);
        minStates.push(label);

        const group = partitions[i];
        const rep = [...group][0];

        // Is this partition the start?
        if (group.has(startState)) minStart = label;

        // Is this partition accepting?
        if ([...group].some(s => liveAccept.includes(s))) minAccept.push(label);

        // Build transitions from this partition
        for (const sym of alphabet) {
            const dest = transMap[rep] && transMap[rep][sym];
            if (dest) {
                const destPartIdx = getPartitionIndex(dest);
                if (destPartIdx >= 0) {
                    minTransitions.push({
                        from: label,
                        symbol: sym,
                        to: partLabels.get(destPartIdx)
                    });
                }
            }
        }
    }

    // 7. Apply to UI
    const oldCount = states.length;
    states = minStates;
    startState = minStart;
    acceptStates = minAccept;
    transitions = minTransitions;

    statesInput.value = states.join(', ');
    startStateInput.value = startState;
    acceptStatesInput.value = acceptStates.join(', ');

    modeSelect.value = 'DFA';
    toggleEpsilonButton();
    renderTransitions();
    saveDesign();

    // 8. Show partition mapping in the trace container
    designStatus.textContent = `✅ Minimized! ${oldCount} → ${minStates.length} states.`;
    designStatus.style.color = 'var(--secondary)';

    traceContainer.innerHTML = '';
    const hdr = document.createElement('div');
    hdr.className = 'trace-step';
    hdr.innerHTML = `<strong>DFA Minimization — Partition Mapping:</strong>`;
    traceContainer.appendChild(hdr);

    partitions.forEach((group, idx) => {
        const div = document.createElement('div');
        div.className = 'trace-step';
        const members = [...group].join(', ');
        div.innerHTML = `<span class="current-states">${partLabels.get(idx)}</span> = { ${members} }`;
        traceContainer.appendChild(div);
    });

    const summary = document.createElement('div');
    summary.className = 'trace-step';
    summary.innerHTML = `<em>Reduced from <strong>${oldCount}</strong> to <strong>${minStates.length}</strong> states.</em>`;
    traceContainer.appendChild(summary);
    finalResult.className = 'final-result hidden';
}

// Start
init();
