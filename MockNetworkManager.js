/**
 * MockNetworkManager Service
 * Simulates network message loops and opponent table interactions locally.
 */
class MockNetworkManager {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;
        this.clientId = generateUUID();

        // --- NEW: OPPONENT FIELD GEOMETRY STATE MIRRORS ---
        this.opponentActiveCard = null;
        this.opponentBenchSlots = [null, null, null, null, null];
        
        console.log(`[MOCK-NET] Initializing loopback sandbox. Assigned Session ID: ${this.clientId}`);
    }

    /**
     * Intercepts local structural changes and echoes a delayed response to simulate an opponent.
     * @param {string} actionType - String key mapping to the event.
     * @param {Object} payload - Spatial coordinates or value metrics.
     */
    broadcastState(actionType, payload) {
        console.log(`[MOCK-NET] Outbound payload packet buffered: ${actionType}`);

        // Simulate network latency (400ms delay) before routing an interactive opponent response
        this.scene.time.delayedCall(400, () => {
            this.routeIncomingMockMessage(actionType, payload);
        });
    }

    /**
     * Decodes the mock network data packages and drives local game object transformations.
     */
    routeIncomingMockMessage(action, data) {
        switch (action) {
            case 'CARD_MOVED':
                // Echo the action: log it locally to confirm the data contract matches perfectly
                console.log(`[MOCK-NET] Inbound Synchronized Card Move received for UUID: ${data.uuid}`);
                break;

            case 'COUNTER_CHANGED':
                if (hud) hud.flashWarning(`Opponent synchronized card damage to: ${data.amount}`);
                break;

            case 'BLIND_SHUFFLE_EXECUTED':
                if (hud) hud.flashWarning("⚠️ Action Sync: Opponent has blindly shuffled their deck pile.");
                break;
        }
    }

    /**
     * Sandbox Testing Utility: Simulates the opponent drawing an private item.
     * Enhanced: Glides a card container into thin air before incrementing text counts.
     */
    simulateOpponentPlay() {
        if (hud) hud.flashWarning("Opponent draws a private card into their hand...");

        // 1. Mock entity data tracking block
        const mockData = { id: 777, uuid: generateUUID(), name: "Hidden", atlasKey: "back", type: "character" };

        // 2. Instantiate a temporary, fully-masked card back container exactly at Player B's Deck Pile slot (124, 300)
        const flightCard = new Card(this.scene, 124, 300, mockData, false);
        flightCard.setDepth(4000); // Bring high above layout frames during transit

        // 3. Glide the card up toward the top edge, fading it out into the text indicator dashboard
        this.scene.tweens.add({
            targets: flightCard,
            x: 150,
            y: 100,
            alpha: 0,
            scale: 0.2,
            duration: 450,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Completely purge the visual piece from GPU memory cache map registries
                flightCard.destroy();

                // Increment the numerical state counter tracking layer cleanly
                adjustOpponentHandCount(1);
            }
        });
    }

    /**
     * Sandbox Testing Utility: Simulates the opponent playing a card into the scrap heap.
     * Fixed: Sets baseline 0.18 board scale so the card doesn't appear huge during transit.
     */
    simulateOpponentDiscard() {
        if (opponentHandCount === 0) {
            if (hud) hud.flashWarning("Opponent has no cards in hand left to discard!");
            return;
        }

        if (hud) hud.flashWarning("Opponent discarding a card from their hand...");

        adjustOpponentHandCount(-1);

        const mockDiscardedData = {
            id: 666,
            uuid: generateUUID(),
            name: "Opponent Scrap",
            atlasKey: "heart2", 
            type: "character"
        };

        // 1. Instantiate the temporary masked container at their hand origin area
        const discardCard = new Card(this.scene, 150, 100, mockDiscardedData, false);
        discardCard.setDepth(4000);
        
        // --- FIXED: FORCE COMPACT BOARD SCALE footprint IMMEDIATELY ---
        discardCard.setScale(0.18); 

        // 2. Glide the item across the board directly into the upper-left Opp. Discard zone (124, 180)
        this.scene.tweens.add({
            targets: discardCard,
            x: 124,
            y: 180,
            duration: 500,
            ease: 'Cubic.easeOut',
            onStart: () => {
                // Flip face-up mid-flight since discards are public knowledge
                discardCard.revealCard();
                
                // FIXED: Re-force the compact 0.18 scale so revealCard() doesn't inflate it to 1.0!
                discardCard.setScale(0.18);
                discardCard.setAlpha(0.8);
            },
            onComplete: () => {
                oppDiscardPile.push(mockDiscardedData);
                discardCard.setAlpha(0.5);
                
                if (hud) hud.flashWarning(`Opponent Discard Total: ${oppDiscardPile.length} cards`);
            }
        });
    }

    /**
     * Drives a staggered sequence of automated tabletop actions simulating the opponent's turn.
     * Executes setup sequences (drawing 7 cards, playing an active character) or standard 
     * turn actions (drawing 1 card, playing bench cards, and attaching random energies).
     * Each step incorporates active state validation guards to cleanly support manual interception.
     */
    runOpponentSandboxTurn() {
        if (hud) hud.flashWarning("Opponent Turn: Activating play script...");

        // ACTION 1: Top-deck draw 1 card for their turn immediately
        this.scene.time.delayedCall(800, () => {
            if (currentPhase !== SandboxStates.OPPONENT_TURN) return;

            if (hud) hud.flashWarning("Opponent Turn: Drawing 1 card...");
            adjustOpponentHandCount(1);

            // ACTION 2: Drop 1 card onto their bench row if space is open
            this.scene.time.delayedCall(1200, () => {
                if (currentPhase !== SandboxStates.OPPONENT_TURN) return;

                const openBenchIndex = this.opponentBenchSlots.findIndex(slot => slot === null);
                const shouldPlayBench = Math.random() > 0.4;

                if (shouldPlayBench && openBenchIndex !== -1) {
                    this.deployOpponentBenchCard(openBenchIndex);
                }

                // ACTION 3: Attach an energy overlay onto their existing cards
                this.scene.time.delayedCall(1200, () => {
                    if (currentPhase !== SandboxStates.OPPONENT_TURN) return;

                    this.attachRandomOpponentEnergy();

                    // ACTION 4: Conclude actions and pass the clock back to you
                    this.scene.time.delayedCall(1200, () => {
                        if (currentPhase !== SandboxStates.OPPONENT_TURN) return;

                        if (hud) hud.flashWarning("Opponent finishes actions. Clock returned to you!");
                        switchPhase(this.scene, SandboxStates.MY_TURN);
                    });
                });
            });
        });
    }

    /**
     * Instantiates a hidden opponent character card at their deck origin and glides it smoothly 
     * into the upper active combat slot before flipping the frame face-up.
     * Mutates the internal opponent tracking metrics and coordinates spatial rendering scales.
     * 
     * @returns {void}
     */
    deployOpponentActiveCard() {
        if (hud) hud.flashWarning("Opponent slides a character into their Active Slot.");
        adjustOpponentHandCount(-1);

        const mockData = { id: 801, uuid: generateUUID(), name: "Opp. Active", atlasKey: "chandelure", type: "character" };
        
        // Glide from Opponent Deck Pile (124, 300) to Opponent Active Slot (512, 260)
        this.opponentActiveCard = new Card(this.scene, 124, 300, mockData, false);
        this.opponentActiveCard.setDepth(4000);

        this.scene.tweens.add({
            targets: this.opponentActiveCard,
            x: 512,
            y: 260,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.opponentActiveCard.setDepth(10);
                this.opponentActiveCard.revealCard(); // Flip face up publicly
                this.opponentActiveCard.setScale(0.18);
            }
        });
    }

    /**
     * Instantiates a benched character card and animates it from the opponent's deck slot coordinates 
     * straight into the next available open benched layout geometry position.
     * Stores the game object reference into the active tracking arrays for later overlay attachments.
     * 
     * @param {number} slotIndex - The index of the targeted bench position slot (0-4).
     * @returns {void}
     */
    deployOpponentBenchCard(slotIndex) {
        if (hud) hud.flashWarning(`Opponent drops a card onto Bench Slot ${slotIndex + 1}.`);
        adjustOpponentHandCount(-1);

        const mockData = { id: 850 + slotIndex, uuid: generateUUID(), name: `Opp. Bench ${slotIndex + 1}`, atlasKey: "pikachu", type: "character" };
        
        // Calculate coordinate positions relative to Playmat's bench row configuration metrics
        const spacing = 90;
        const targetX = (512 - (2 * spacing)) + (slotIndex * spacing);
        const targetY = 180; // Opponent bench row grid baseline

        const benchCard = new Card(this.scene, 124, 300, mockData, false);
        benchCard.setDepth(4000);
        this.opponentBenchSlots[slotIndex] = benchCard;

        this.scene.tweens.add({
            targets: benchCard,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                benchCard.setDepth(10);
                benchCard.revealCard();
                benchCard.setScale(0.18);
            }
        });
    }

    /**
     * Evaluates valid active and benched character hosts currently deployed on the opponent's side, 
     * selects a target at random, and glides a face-up fire/water energy overlay card underneath it.
     * Leverages structured stack index tracking to preserve exact uniform vertical and horizontal staggers.
     * 
     * @returns {void}
     */
    attachRandomOpponentEnergy() {
        // Evaluate valid character target hosts alive on their side
        let validTargets = [];
        if (this.opponentActiveCard) validTargets.push(this.opponentActiveCard);
        this.opponentBenchSlots.forEach(card => { if (card !== null) validTargets.push(card); });

        if (validTargets.length === 0) return;

        // Select a card completely at random
        const randomHost = Phaser.Utils.Array.GetRandom(validTargets);
        adjustOpponentHandCount(-1);
        if (hud) hud.flashWarning(`Opponent attaches Energy to ${randomHost.cardData.name}.`);

        const energyData = { id: 999, uuid: generateUUID(), name: "Energy", atlasKey: Math.random() > 0.5 ? "fire" : "water", type: "energy" };
        const visualEnergy = new Card(this.scene, 124, 300, energyData, true); // Energy spawns face-up
        visualEnergy.setScale(0.18);
        visualEnergy.setDepth(3900);

        randomHost.attachedEnergy.push(visualEnergy);
        const stackCount = randomHost.attachedEnergy.length;
        
        // Stack attachments dynamically utilizing TableManager's exact stagger metrics
        const targetX = randomHost.x + (stackCount * 10);
        const targetY = randomHost.y - (stackCount * 15);

        this.scene.tweens.add({
            targets: visualEnergy,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.children.sendToBack(visualEnergy);
                this.scene.children.bringToTop(randomHost);
            }
        });
    }

    /**
     * Executes the opponent's initial game setup actions.
     * Draws 7 cards and slides an active character into play before passing control back to you.
     */
    executeOpponentSetupSequence() {
        if (hud) hud.flashWarning("Opponent Setup: Drawing 7 starting cards...");
        adjustOpponentHandCount(7);
        
        // Pause 1 second for tactical pacing, then slide their active card out
        this.scene.time.delayedCall(1000, () => {
            if (hud) hud.flashWarning("Opponent deploying active character...");
            adjustOpponentHandCount(-1);

            const mockData = { id: 801, uuid: generateUUID(), name: "Opp. Active", atlasKey: "chandelure", type: "character" };
            
            // Glide from Opponent Deck Pile (124, 300) to Opponent Active Slot (512, 260)
            this.opponentActiveCard = new Card(this.scene, 124, 300, mockData, false);
            this.opponentActiveCard.setDepth(4000);

            this.scene.tweens.add({
                targets: this.opponentActiveCard,
                x: 512,
                y: 260,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.opponentActiveCard.setDepth(10);
                    this.opponentActiveCard.revealCard(); // Flip face up publicly
                    this.opponentActiveCard.setScale(0.18);
                    
                    // Setup finished! Pass the chess clock directly over to your first turn
                    switchPhase(this.scene, SandboxStates.MY_TURN);
                }
            });
        });
    }
}
