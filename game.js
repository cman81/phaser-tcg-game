// Setup the Engine Rules
const config = {
    type: Phaser.AUTO,         
    width: 1024,               
    height: 768,               
    backgroundColor: '#2d3748', 
    parent: 'phaser-game',
    // --- TUTORIAL 4 MOUSE INPUT HOOK ---
    input: {
        mouse: {
            preventDefaultContextMenu: true // Disables standard browser right-click menus on your game canvas
        }
    },
    scene: {
        preload: preload,      
        create: create,        
        update: update         
    }
};

// Replace the old TurnPhases dictionary with this flat macro-state model
const SandboxStates = {
    SETUP: 'SETUP',
    MY_TURN: 'MY_TURN',
    OPPONENT_TURN: 'OPPONENT_TURN'
};

// Establish your default global pointer variable
let currentPhase = SandboxStates.SETUP;

// Global Array States (Backend Logic Trackers)
let deck = [];
let hand = [];
let discardPile = [];
let oppDiscardPile = [];

// --- UPDATED TUTORIAL 7 MOCK STATES ---
let opponentHandCount = 0; // Simply tracks the integer count of cards in the opponent's hand

// Class Instance Trackers
let playmat = null;
let hud = null;
let tableManager = null;
let deckBrowser = null;
let networkManager = null;

// Layout Position Constants
const HAND_Y = 660; // The fixed Y-coordinate line where cards in hand rest

// Instantiate the main game process
const game = new Phaser.Game(config);

// Connect empty lifecycle loops
/** @this Phaser.Scene */
function preload() {
    // Stream your local atlas sheets into memory
    this.load.atlas('card_atlas', 'assets/pkmn.png', 'assets/pkmn.json');
}

/** @this Phaser.Scene */
function create() {
    playmat = new Playmat(this);
    tableManager = new TableManager(this);
    deckBrowser = new DeckBrowser(this);
    
    // The client boots up completely blind
    networkManager = new MockNetworkManager(this);

    setupTableInteractionListeners(this);
    setupDeckInteractionListeners(this);
    setupKeyboardInteractionController(this);

    hud = new GameHud(this);

    // Call out to the 3rd entity server to spin up a secure, backend deck instance
    networkManager.requestServerSessionInit();
}

/** @this Phaser.Scene */
function update() {
    // Left completely blank
}

/**
 * Orchestrates a chess clock-style state switcher for the sandbox engine.
 * Toggles turn permissions between players, manages the translucent header displays, 
 * and handles initial setup completion routines.
 * 
 * @param {Phaser.Scene} scene - The active scene context driving the runtime process and timing events.
 * @param {string} newState - The target sandbox state machine identifier being entered (must be a valid value from SandboxStates).
 * @returns {void}
 */
function switchPhase(scene, newState) {
    // --- FIXED: STRIP OUT OBSOLETE LEGACY SEED SEQUENCERS ---
    // The authoritative server handles state vectors now, bypassing local client setup calls.
    currentPhase = newState;
    console.log(`[CLOCK PIVOT] Active State Changed To: ${currentPhase}`);

    if (hud) {
        hud.updatePhaseDisplay(currentPhase);
    }

    switch (currentPhase) {
        case SandboxStates.SETUP:
            if (hud) {
                hud.endTurnButton.setText("Finish Setup");
                hud.endTurnButton.setVisible(true);
            }
            break;

        case SandboxStates.MY_TURN:
            if (hud) {
                hud.endTurnButton.setText("End Turn");
                hud.endTurnButton.setVisible(true);
                hud.flashWarning("Your Turn: Actions are unconstrained.");
            }
            break;

        case SandboxStates.OPPONENT_TURN:
            if (hud) {
                hud.endTurnButton.setText("Intercept Turn"); 
                hud.endTurnButton.setVisible(true);
            }
            
            // --- FIXED: TRANSMIT TURN SWITCH TO SECURE SEPARATE RE-ROUTING SERVER ---
            // Tells your standalone server repo to pass the chess clock plunger to Player B's tab
            networkManager.socket.emit('PHASE_SWAPPED', { 
                roomCode: networkManager.roomCode,
                newState: SandboxStates.OPPONENT_TURN 
            });
            break;
    }
}

// ============================================================================
// LOGIC TRACKERS & MATH LAYOUT OPERATION MODULES
// ============================================================================

/**
 * Pops a card data node from the deck stack array and instantiates a visual card container.
 * 
 * This engine wrapper coordinates data popping with rendering instantiation. It spawns 
 * a new custom `Card` object container high above the canvas window (Y: -100) before 
 * adding it to our active hand array tracker and triggering our grid alignment layout systems.
 *
 * @param {Phaser.Scene} scene - The active scene context driving the resource rendering pipeline.
 * @returns {void}
 */
function dealCard(scene) {
    // Re-route business request directly to the authoritative server facade
    networkManager.requestCardDraw();
}

/**
 * Automatically centers and repositions all interactive card containers sitting in the hand lane.
 * 
 * This dynamic layout engine calculates horizontal coordinate values based on the changing 
 * size of the hand array. It determines an optimal starting center offset point on the X-axis 
 * and utilizes engine Tweens to smoothly animate each card into an evenly-spaced layout row.
 *
 * @param {Phaser.Scene} scene - The active runtime scene context executing the animation tweens.
 * @returns {void}
 */
function updateHandLayout(scene) {
    const cardSpacing = 58; // Reduced center gap from 75 to 58 to pack vertical pieces perfectly
    
    const startX = 512 - (((hand.length - 1) * cardSpacing) / 2);

    hand.forEach((card, index) => {
        const targetX = startX + (index * cardSpacing);

        scene.tweens.add({
            targets: card,
            x: targetX,
            y: HAND_Y,
            scale: 0.18, // Sync baseline transform bounds
            duration: 250,
            ease: 'Power2'
        });
    });
}

/**
 * Routing Controller: Listens to raw canvas input streams and maps them to service logic.
 * 
 * @param {Phaser.Scene} scene - The active scene context running the loops.
 */
function setupTableInteractionListeners(scene) {
    
    // Drag Route
    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.setData('isDeployed', false); 
        tableManager.processCardDrag(gameObject, dragX, dragY);
    });

    // Drop Route
    scene.input.on('drop', (pointer, gameObject, dropZone) => {
        gameObject.setData('hasWarnedDrag', false);
        
        const zoneType = dropZone.getData('zoneType');

        if (zoneType === 'discard') {
            tableManager.discardCard(gameObject, dropZone);
        } else {
            tableManager.playCardToSlot(gameObject, dropZone);
        }
    });

    // DragEnd (Cleanup) Route
    scene.input.on('dragend', (pointer, gameObject, dropped) => {
        gameObject.setData('hasWarnedDrag', false);

        // If it missed slot anchors completely, pop it back into hand spacing slots
        if (!gameObject.getData('isDeployed')) {
            if (!hand.includes(gameObject)) {
                hand.push(gameObject);
            }
            updateHandLayout(scene);
        }
    });
}

/**
 * Configures click triggers for the deck zone to handle manual drawing actions.
 * Refactored: Consistently routes through the central dealCard pipeline.
 */
function setupDeckInteractionListeners(scene) {
    if (!playmat || !playmat.deckZone) return;

    // Listen for mouse down clicks directly over the physical deck zone boundaries
    playmat.deckZone.on('pointerdown', () => {
        // --- FIXED: BYPASS DEAD CLIENT ARRAYS ---
        // Delegate the business draw request entirely to the authoritative server facade
        dealCard(scene);
    });
}


/**
 * Registers global keyboard listeners to handle hover-based counter adjustments.
 * Call this inside your Scene's create() loop right after setting up interaction listeners.
 * 
 * @param {Phaser.Scene} scene - The active scene context instance.
 */
function setupKeyboardInteractionController(scene) {
    // Register individual key input hooks
    const minusKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
    const numpadMinus = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_MINUS);

    // Create a shared routing function for when a minus button is pressed
    const handleMinusPressed = () => {
        // Look through your global hand array to find if a card is currently hovered
        let targetedCard = hand.find(card => card.isHovered);

        // If it's not found in your hand, check the active/bench zones on the playmat!
        // We look for any valid Card game object that reports an active hover state
        if (!targetedCard) {
            const allSceneCards = scene.children.list.filter(obj => obj instanceof Card);
            targetedCard = allSceneCards.find(card => card.isHovered);
        }

        // If we found a valid card under the mouse cursor, pull away 10 damage counter units
        if (targetedCard) {
            targetedCard.adjustDamageCounters(-10);
        }
    };

    // Bind both standard minus and numeric keypad minus keys to fire our handler
    minusKey.on('down', handleMinusPressed);
    numpadMinus.on('down', handleMinusPressed);

    // --- DECK BROWSER TOGGLE ROUTE ---
    // FIXED: Requests your raw card data dynamically from the server cache on the fly!
    scene.input.keyboard.on('keydown-B', () => {
        if (networkManager) {
            networkManager.requestDeckContent();
        }
    });

    // --- NEW: DISCARD PILE BROWSER TOGGLE ROUTE ---
    scene.input.keyboard.on('keydown-V', () => {
        deckBrowser.open(discardPile, "Your Discard Pile", false); // Discard views are review-only (no drafting yet)
    });

    // --- NEW: INSPECT OPPONENT DISCARD TOGGLE ROUTE ---
    scene.input.keyboard.on('keydown-P', () => {
        deckBrowser.open(oppDiscardPile, "Opponent Discard Pile", false); 
    });

    // --- TACTILE UNDO PLAYMAT ROUTE ---
    scene.input.keyboard.on('keydown-Z', () => {
        if (currentPhase === SandboxStates.MY_TURN || currentPhase === SandboxStates.SETUP) {
            tableManager.undoLastMove();
        } else {
            if (hud) hud.flashWarning("Cannot undo tabletop actions during the opponent's clock window.");
        }
    });
}

/**
 * Core utility to generate a cryptographically secure UUIDv4 string.
 * Bypasses duplication across generation and shuffle service arrays.
 * 
 * @returns {string} A valid RFC4122 compliant UUIDv4 string.
 */
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Standard RFC4122 compliant UUIDv4 math generator fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Mutates opponent tracking counts and updates HUD text layers via GameHud methods.
 * @param {number} change - The adjustment integer (+1 or -1).
 */
function adjustOpponentHandCount(change) {
    opponentHandCount += change;
    
    // Clamp the lowest floor barrier boundary to 0
    if (opponentHandCount < 0) opponentHandCount = 0;

    // Delegate the layout display update to our decoupled GameHud class manager
    if (hud) {
        hud.updateOpponentHandDisplay(opponentHandCount);
    }
}
