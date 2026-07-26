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

}
