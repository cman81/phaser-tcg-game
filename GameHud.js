/**
 * GameHud
 * Directs text trackers, interactive button widgets, and phase status readouts.
 */
class GameHud {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;

        // 1. Deck Tracker Node setup
        this.deckCountText = this.scene.add.text(50, 50, `Deck: ${deck.length} cards`, { fontSize: '16px', color: '#fff' });

        // 2. Draw Trigger Button setup
        this.drawButton = this.scene.add.text(850, 50, 'Draw 7 Cards', { 
            fontSize: '14px', fill: '#0f0', backgroundColor: '#1a202c', padding: 8 
        }).setInteractive();
        
        this.setupDrawButtonListener();

        // 3. Phase Text State Tracking Header setup
        this.phaseText = this.scene.add.text(512, 40, `Phase: ${currentPhase}`, {
            fontSize: '20px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 4. End Turn Button control node setup
        this.endTurnButton = this.scene.add.text(900, 575, 'End Turn', {
            fontSize: '14px', fill: '#fff', backgroundColor: '#e53e3e', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive();

        this.setupEndTurnButtonListener();

        // --- SANDBOX OVERRIDE WARNING BANNER ---
        // Create an invisible, semi-transparent text banner to flash rule prompts
        this.warningText = this.scene.add.text(512, 80, '', {
            fontSize: '12px',
            fill: '#fc8181', // Soft coral warning red
            backgroundColor: '#2d3748',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setAlpha(0).setDepth(2000);

        // --- TUTORIAL 7: OPPONENT PRIVATE HAND TEXT INDICATOR ---
        // Rendered cleanly near the top-left margin beneath your own deck count tracker
        this.opponentHandText = this.scene.add.text(50, 100, 'Opponent Hand: 0 cards', {
            fontSize: '16px',
            color: '#718096', // Balanced slate gray theme
            fontStyle: 'bold'
        });

    }

    /**
     * Hooks up drawing triggers to invoke dynamic hand spacing dealing mechanics.
     */
    setupDrawButtonListener() {
        this.drawButton.on('pointerdown', () => {
            for (let i = 0; i < 7; i++) {
                dealCard(this.scene);
            }
            this.deckCountText.setText(`Deck: ${deck.length} cards`);
            this.drawButton.destroy(); 
        });
    }

    /**
     * Hooks up the End Turn interface element to update the central state machine.
     */
    setupEndTurnButtonListener() {
        this.endTurnButton.on('pointerdown', () => {
            if (currentPhase === SandboxStates.SETUP) {
                // Clicked 'Finish Setup'
                switchPhase(this.scene, SandboxStates.MY_TURN);
            } 
            else if (currentPhase === SandboxStates.MY_TURN) {
                // Clicked 'End Turn' -> Pass clock to Opponent
                switchPhase(this.scene, SandboxStates.OPPONENT_TURN);
            } 
            else if (currentPhase === SandboxStates.OPPONENT_TURN) {
                // Clicked 'Intercept Turn' -> Sandbox Override feature
                this.flashWarning("Manual Interception: Stopping opponent execution.");
                switchPhase(this.scene, SandboxStates.MY_TURN);
            }
        });
    }

    /**
     * Updates the text readout indicator to mirror current active state.
     * @param {string} phaseName - Target phase string key name.
     */
    updatePhaseDisplay(phaseName) {
        if (this.phaseText) {
            this.phaseText.setText(`Phase: ${phaseName}`);
        }
    }

    /**
     * Temporarily flashes a subtle rule reminder banner on screen.
     * @param {string} message - The custom rule prompt to show the players.
     */
    flashWarning(message) {
        if (!this.warningText) return;

        // Set text payload and stop any previous running fade-outs
        this.warningText.setText(`⚠️ Note: ${message} (Overridden)`);
        this.scene.tweens.killTweensOf(this.warningText);

        // Snap to visible, hold for 2.5 seconds, then fade out smoothly
        this.warningText.setAlpha(1);
        this.scene.time.delayedCall(2500, () => {
            this.scene.tweens.add({
                targets: this.warningText,
                alpha: 0,
                duration: 500,
                ease: 'Linear'
            });
        });
    }

    /**
     * Refreshes the opponent hand text readout tracking frame with clean color pulses.
     * @param {number} count - The current integer count value to display.
     */
    updateOpponentHandDisplay(count) {
        if (!this.opponentHandText) return;

        this.opponentHandText.setText(`Opponent Hand: ${count} cards`);
        
        // Add a quick visual heartbeat color pulse to indicate a change occurred
        this.opponentHandText.setColor('#4cbd97'); // Flash emerald green
        this.scene.time.delayedCall(300, () => {
            this.opponentHandText.setColor('#718096'); // Snap back to base slate
        });
    }

}
