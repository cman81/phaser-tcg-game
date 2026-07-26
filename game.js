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

// Create a machine-name directory of your valid states
const TurnPhases = {
    OPPONENT_TURN: 'OPPONENT_TURN', // Input locked while waiting
    DRAW_PHASE:     'DRAW_PHASE',     // Automatic top-decking stage
    MAIN_PHASE:     'MAIN_PHASE',     // Strategic drop action window
    ATTACK_PHASE:   'ATTACK_PHASE',   // Action processing calculation window
    END_PHASE:      'END_PHASE'       // State scrubbing and reset stage
};

// Establish your default global pointer variable
let currentPhase = TurnPhases.DRAW_PHASE;

// Global Array States (Backend Logic Trackers)
let deck = [];
let hand = [];
let discardPile = [];
let oppDiscardPile = []; // --- NEW: PLAYER B's DISCARD DATA LAYER ---


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
    this.load.atlas('card_atlas', 'assets/cards.png', 'assets/cards.json');
}

/** @this Phaser.Scene */
function create() {
    // 1. Initialize Board Layout & Input Target Drop Regions
    playmat = new Playmat(this);
    tableManager = new TableManager(this);
    deckBrowser = new DeckBrowser(this);
    networkManager = new MockNetworkManager(this);

    setupTableInteractionListeners(this);
    setupDeckInteractionListeners(this);
    setupKeyboardInteractionController(this);

    // 2. Initialize Core Database Array Pools
    generateDeck();
    shuffleDeck();

    // 3. Initialize Head-Up UI Interface Components
    hud = new GameHud(this);

    // 4. Launch Game Turn State Sequences
    switchPhase(this, TurnPhases.DRAW_PHASE);
}

/** @this Phaser.Scene */
function update() {
    // Left completely blank
}

/**
 * Manages the Finite State Machine (FSM) transitions for the turn phase engine.
 * 
 * This central controller acts as a validation guard and state wrapper. It updates
 * global variables, manipulates HUD text labels, toggles UI interactivity controls
 * (such as revealing or hiding the End Turn button), and automates timed phase transitions
 * (like forcing a draw delay or simulating opponent AI wait loops).
 *
 * @param {Phaser.Scene} scene - The active scene context driving the runtime process and timing events.
 * @param {string} newPhase - The target state machine identifier being entered (must be a valid value from TurnPhases).
 * @returns {void}
 * 
 * @see TurnPhases
 */
function switchPhase(scene, newPhase) {
    currentPhase = newPhase;
    console.log(`Phase Changed To: ${currentPhase}`);

    // Safe check: If HUD has finished instantiating, notify it to update text layers
    if (hud) {
        hud.updatePhaseDisplay(currentPhase);
    }

    switch (currentPhase) {
        case TurnPhases.DRAW_PHASE:
            // 1. Give visual confirmation that a player's turn has begun
            // scene.phaseText.setColor('#48bb78'); // Green tint for active turn
            
            // 2. Automate a 1-second delay pause before pushing the user into the Main action phase
            scene.time.delayedCall(1000, () => {
                switchPhase(scene, TurnPhases.MAIN_PHASE);
            });
            break;

        case TurnPhases.MAIN_PHASE:
            // Reveal operational buttons on screen
            if (hud) hud.endTurnButton.setVisible(true);
            break;

        case TurnPhases.ATTACK_PHASE:
            // Instantly hide system controls while calculations resolve
            if (hud) hud.endTurnButton.setVisible(false);
            break;

        case TurnPhases.OPPONENT_TURN:
            if (hud) hud.endTurnButton.setVisible(false);
            // scene.phaseText.setColor('#e53e3e'); // Red tint for waiting window
            
            // Simulate an opponent AI taking its turn by waiting 2.5 seconds, then cycle back
            scene.time.delayedCall(2500, () => {
                switchPhase(scene, TurnPhases.DRAW_PHASE);
            });
            break;
    }
}

// ============================================================================
// LOGIC TRACKERS & MATH LAYOUT OPERATION MODULES
// ============================================================================

/**
 * Populates the global deck array by cycling through your unique prototyping card models.
 * 
 * This function handles the core data generation loop for our 60-card deck structure.
 * It reads from a localized prototyping configuration matrix, builds a standardized 
 * data payload mapping to texture frames, and leverages a secure fallback routine to 
 * assign a unique UUID identifier to each card entity container.
 *
 * @returns {void}
 */
function generateDeck() {
    deck = []; // Clear array state completely before population pass

    const cardPrototypes = [
        { name: "AH", atlasKey: "heartA", type: "character" },
        { name: "2H", atlasKey: "heart2", type: "character" },
        { name: "3H", atlasKey: "heart3", type: "character" },
        { name: "4H", atlasKey: "heart4", type: "energy" }, // Designated Energy Piece
        { name: "5H", atlasKey: "heart5", type: "energy" }   // Designated Energy Piece
    ];
    
    for (let i = 1; i <= 60; i++) {
        const prototypeIndex = (i - 1) % cardPrototypes.length;
        const currentProto = cardPrototypes[prototypeIndex];

        // Push fully unified individual card data tracking payload
        deck.push({ 
            id: i, 
            uuid: generateUUID(), 
            name: currentProto.name, 
            atlasKey: currentProto.atlasKey,
            type: currentProto.type
        });
    }
}

/**
 * Shuffles the global deck data array by re-assigning fresh UUID tokens
 * and sorting them alphabetically. Bypasses static array lockups.
 */
function shuffleDeck() {
    // 1. Loop through every remaining card item and assign a brand new random UUID token via shared helper
    deck.forEach(card => {
        card.uuid = generateUUID();
    });

    // 2. Standard alphanumeric array comparison sort using the freshly assigned string keys
    deck.sort((cardA, cardB) => {
        if (cardA.uuid < cardB.uuid) return -1;
        if (cardA.uuid > cardB.uuid) return 1;
        return 0;
    });
    
    console.log(`[ENGINE] Fresh UUID tokens mapped. 60-Card Database Stack successfully scrambled. Cards: ${deck.length}`);
}


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
    if (deck.length === 0) return;

    const cardData = deck.pop();

    // Spawn the card high up off-screen (Y: -100) so it glides down smoothly
    const visualCard = new Card(scene, 900, 300, cardData);

    // Push into our tracker list array
    hand.push(visualCard);

    // Recalculate horizontal layout positioning metrics
    updateHandLayout(scene);
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
    const cardSpacing = 75; // Pixel gap between card centers
    
    // Calculates a centered horizontal starting point based on total cards in hand
    const startX = 512 - (((hand.length - 1) * cardSpacing) / 2);

    hand.forEach((card, index) => {
        const targetX = startX + (index * cardSpacing);

        // Animate the component to its calculated spot with elastic spacing glide mechanics
        scene.tweens.add({
            targets: card,
            x: targetX,
            y: HAND_Y,
            scale: 1, // Reset downscale caps if sliding from messy decks
            duration: 350,
            ease: 'Cubic.easeOut', // Smooth deceleration curve
            onStart: () => {
                card.setDepth(100 + index); // Maintain strict stack sorting
            }
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

        if (!dropped || hand.includes(gameObject)) {
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
        // Safety Guard: Stop if the array deck pool is completely empty
        if (deck.length === 0) {
            if (hud) hud.flashWarning("Your deck is empty.");
            return;
        }

        // DELEGATE BUSINESS LOGIC: Reuse the uniform dealer pipeline
        dealCard(scene);

        // Update the text layers on your HUD safely
        if (hud) {
            hud.deckCountText.setText(`Deck: ${deck.length} cards`);
        }
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
    scene.input.keyboard.on('keydown-B', () => {
        deckBrowser.open(deck, "Deck Contents", true); // Pass target array, title, and draftable flag
    });

    // --- NEW: DISCARD PILE BROWSER TOGGLE ROUTE ---
    scene.input.keyboard.on('keydown-V', () => {
        deckBrowser.open(discardPile, "Your Discard Pile", false); // Discard views are review-only (no drafting yet)
    });

    // --- ADD MOCK OPPONENT PLACEMENT ROUTE ---
    const handleOpponentDraw = () => {
        console.log("Opponent draw hotkey triggered. Spawning an automated network ghost card play...");
        if (networkManager) {
            networkManager.simulateOpponentPlay();
        }
    };

    // Bind alphabetical 'O' to fire your mock engine handler cleanly
    scene.input.keyboard.on('keydown-O', handleOpponentDraw);

    // --- NEW: INSPECT OPPONENT DISCARD TOGGLE ROUTE ---
    scene.input.keyboard.on('keydown-P', () => {
        deckBrowser.open(oppDiscardPile, "Opponent Discard Pile", false); // Public knowledge, review-only
    });

    // --- NEW: TRIGGER MOCK OPPONENT DISCARD ANIMATION ---
    scene.input.keyboard.on('keydown-I', () => {
        console.log("Hotkey I pressed. Simulating opponent discarding a card from hand...");
        if (networkManager) {
            networkManager.simulateOpponentDiscard();
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
