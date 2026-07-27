/**
 * MockNetworkManager / Live WebSocket Sync Controller
 * Refactored: Interfaces with an external node socket server to handle real-time asymmetric synchronization.
 */
class MockNetworkManager {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;
        this.roomCode = "sandbox_room_1"; // Default matchmaking session token
        this.playerSlot = null; // Assigned dynamically by the server ('PLAYER_A' or 'PLAYER_B')

        // --- FIXED: SECURE CROSS-REFRESH SESSION ID TRACKER ---
        // Generates once; persists cleanly even if the page reloads
        if (!sessionStorage.getItem('tcg_session_id')) {
            sessionStorage.setItem('tcg_session_id', generateUUID());
        }
        this.sessionId = sessionStorage.getItem('tcg_session_id');
        console.log(`[NETWORK-SOCKET] Connecting with persistent ID: ${this.sessionId}`);
        
        // 1. Establish the authentic bidirectional socket connection stream
        // In local development, pointing to port 3000 matching our server blueprint
        this.socket = io("http://localhost:3000");        

        // 2. Initialize and bind our inbound streaming network event loops
        this.initializeNetworkEventInterceptors();
    }

    /**
     * Maps inbound WebSocket messages directly to Phaser visual and state transformations.
     */
    initializeNetworkEventInterceptors() {
        // Event A: Server validates room entry and assigns slot identities
        this.socket.on('SESSION_ASSIGNED', (data) => {
            this.playerSlot = data.playerSlot;
            console.log(`[NETWORK-SOCKET] Successfully joined session. Slot identity: ${this.playerSlot}`);
            
            if (hud) {
                hud.flashWarning(`Connected as ${this.playerSlot === 'PLAYER_A' ? 'Player A' : 'Player B'}. Room setup ready.`);
                hud.deckCountText.setText(`Deck: ${data.deckCount} cards`);
            }
        });

        // Event B: Server signals that both players have registered in the session room channel
        this.socket.on('GAME_READY', () => {
            if (hud) hud.flashWarning("Opponent connected! Both players ready on grid.");
            switchPhase(this.scene, SandboxStates.SETUP);
        });

        // Event C: Asymmetric Draw - High-Privilege Payload response matching your local draw intent
        this.socket.on('YOUR_DRAW_RESULT', (data) => {
            const visualCard = new Card(this.scene, 900, 300, data.cardData, true);
            
            // --- FIXED: EXPLICITLY RE-ASSERT DRAGGABLE REGISTRIES FOR SERVER ASSETS ---
            this.scene.input.setDraggable(visualCard);
            
            hand.push(visualCard);
            updateHandLayout(this.scene);

            if (hud) hud.deckCountText.setText(`Deck: ${data.remainingDeckCount} cards`);
        });

        // Event D: Asymmetric Draw - Low-Privilege Payload notifying that opponent top-decked an item
        this.socket.on('OPPONENT_DRAW_OCCURRED', (data) => {
            if (hud) {
                hud.flashWarning("Opponent draws a private card into their hand...");
                hud.opponentHandText.setText(`Opponent Hand: ${opponentHandCount + 1} cards`);
            }
            adjustOpponentHandCount(1);
        });

        // Event E: Spatial Move Relay - Intercepts opponent placements and mirrors them on screen
        this.socket.on('OPPONENT_MOVE_OCCURRED', (data) => {
            console.log(`[NETWORK-SOCKET] Inbound Move Sync received for asset instance UUID: ${data.uuid}`);
            
            // Search the scene hierarchy to see if we already generated a container for this asset
            const allSceneCards = this.scene.children.list.filter(obj => obj instanceof Card);
            let oppCard = allSceneCards.find(card => card.cardData.uuid === data.uuid);

            // If it's the first time they played it, spawn a fresh container at their deck position
            if (!oppCard) {
                oppCard = new Card(this.scene, 124, 300, data.cardData, false);
                oppCard.setScale(0.18);
            }

            // --- INVERT COORDINATES MATRIX FOR FLIPPED VIEW ---
            // What is bottom-right for them must render as top-left for you to preserve spatial alignment
            const invertedX = 1024 - data.coordinates.x;
            const invertedY = 768 - data.coordinates.y;

            oppCard.setDepth(4000); // Bring high above layout frames during transit

            // If the opponent moves the card face-up onto public table slots, reveal its identity
            if (data.isPublicZone) {
                oppCard.revealCard();
                oppCard.setScale(0.18);
            }

            this.scene.tweens.add({
                targets: oppCard,
                x: invertedX,
                y: invertedY,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    oppCard.setDepth(10);
                    // Decrement their abstract hidden hand count parameter if they deployed it out of hand
                    if (data.cameFromHand) {
                        adjustOpponentHandCount(-1);
                    }
                }
            });
        });

        // Event F: Token Modifier Relay - Syncs damage changes on card entities instantly
        this.socket.on('OPPONENT_DAMAGE_MUTATED', (data) => {
            const allSceneCards = this.scene.children.list.filter(obj => obj instanceof Card);
            const targetCard = allSceneCards.find(card => card.cardData.uuid === data.uuid);
            
            if (targetCard) {
                // Adjust counter overlay values on screen matching their exact delta adjustments
                const currentDamage = targetCard.damageCounters;
                const adjustmentDelta = data.newDamageValue - currentDamage;
                targetCard.adjustDamageCounters(adjustmentDelta);
            }
        });

        // Event G: Error notification handler
        this.socket.on('ERROR', (errorMessage) => {
            if (hud) hud.flashWarning(`⚠️ Server Error: ${errorMessage}`);
        });

        // Event H: Snapshot State Rehydration Layer Handler
        this.socket.on('STATE_REHYDRATION', (data) => {
            this.playerSlot = data.playerSlot;
            console.log(`[REHYDRATE] Booting snapshot data maps for slot: ${this.playerSlot}`);
            
            if (hud) {
                hud.flashWarning("Session rehydrated from secure server state!");
                hud.deckCountText.setText(`Deck: ${data.deckCount} cards`);
                
                // --- FIXED: RESTORE HIDDEN OPPONENT METRICS IMMEDIATELY ---
                opponentHandCount = data.oppHandCount;
                hud.opponentHandText.setText(`Opponent Hand: ${opponentHandCount} cards`);
            }
            
            // 1. Re-render your hand from the server cache row
            data.myBoard.hand.forEach(cardData => {
                const visualCard = new Card(this.scene, 512, 660, cardData, true);
                this.scene.input.setDraggable(visualCard);
                hand.push(visualCard);
            });
            updateHandLayout(this.scene);
    
            // 2. Re-render any deployed cards resting on the field mats
            data.myBoard.field.forEach(moveData => {
                const card = new Card(this.scene, moveData.coordinates.x, moveData.coordinates.y, moveData.cardData, true);
                this.scene.input.setDraggable(card);
                card.setData('isDeployed', true);
                // Re-apply matching damage levels if they adjusted tokens previously
                if (moveData.damage) card.adjustDamageCounters(moveData.damage);
            });
    
            // 3. Re-render Opponent's layout using inverted spatial coordinates
            data.oppBoard.field.forEach(oppMove => {
                const invertedX = 1024 - oppMove.coordinates.x;
                const invertedY = 768 - oppMove.coordinates.y;
                const oppCard = new Card(this.scene, invertedX, invertedY, oppMove.cardData, oppMove.isPublicZone);
                oppCard.setScale(0.18);
            });
            
            switchPhase(this.scene, SandboxStates.MY_TURN);
        });

        // Event I: Secure Inventory Query Response for local Deck Browser modules
        this.socket.on('DECK_CONTENT_RESULT', (data) => {
            console.log(`[NETWORK-SOCKET] Received server deck cache node. Card count: ${data.deckList.length}`);
            
            // Open the view modal container passing your live server data array payload cleanly
            if (deckBrowser) {
                deckBrowser.open(data.deckList, "Deck Contents", true);
            }
        });

        // Event J: Server Shuffle Confirmation Broadcast Interceptor
        this.socket.on('SERVER_SHUFFLE_CONFIRMED', (data) => {
            const isMe = (data.actor === this.playerSlot);
            console.log(`[NETWORK-SOCKET] Global deck shuffle logged by server for actor slot: ${data.actor}`);
            
            if (hud) {
                // Flash rule notification alerts cleanly matching who triggered the shuffle pass
                if (isMe) {
                    hud.flashWarning("Your deck was securely re-shuffled blindly face-down.");
                    hud.deckCountText.setText(`Deck: ${data.remainingCount} cards`);
                } else {
                    hud.flashWarning("Opponent is shuffling their deck pile blindly face-down...");
                }
            }
        });
    }

    /**
     * Dispatcher: Requests the authoritative server to initialize our room metrics.
     */
    requestServerSessionInit() {
        // Pass your persistent cross-refresh key up the wire
        this.socket.emit('JOIN_ROOM', { 
            roomCode: this.roomCode, 
            sessionId: this.sessionId 
        });
    }

    /**
     * Dispatcher: Requests the authoritative server to securely pop and distribute a card.
     */
    requestCardDraw() {
        this.socket.emit('REQUEST_DRAW', this.roomCode);
    }

    /**
     * Dispatcher: Transmits local tabletop drag coordinates out to the relay network.
     * 
     * @param {string} uuid - Unique entity token of the moving card.
     * @param {Object} cardData - Raw properties configuration structure.
     * @param {number} x - Horizontal placement pixel.
     * @param {number} y - Vertical placement pixel.
     * @param {boolean} isPublicZone - Set true if dropped onto slot layouts vs hidden zones.
     * @param {boolean} cameFromHand - Set true if this action removes the element from hand row array tracker.
     */
    broadcastCardMove(uuid, cardData, x, y, isPublicZone, cameFromHand) {
        this.socket.emit('BROADCAST_MOVE', this.roomCode, {
            uuid: uuid,
            cardData: cardData,
            coordinates: { x: x, y: y },
            isPublicZone: isPublicZone,
            cameFromHand: cameFromHand
        });
    }

    /**
     * Dispatcher: Transmits numeric token modifications out to the relay network.
     */
    broadcastDamageMutation(uuid, newDamageValue) {
        this.socket.emit('BROADCAST_DAMAGE', this.roomCode, {
            uuid: uuid,
            newDamageValue: newDamageValue
        });
    }

    /**
     * Dispatcher: Requests the authoritative server to transmit our current private deck array contents.
     */
    requestDeckContent() {
        this.socket.emit('REQUEST_DECK_CONTENT', this.roomCode);
    }

    /**
     * Dispatcher: Requests the authoritative server to shuffle our private backend deck list.
     */
    requestDeckShuffle() {
        this.socket.emit('REQUEST_DECK_SHUFFLE', this.roomCode);
    }

}
