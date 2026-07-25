/**
 * Custom container representing a visual card item in the hand or on the board.
 */
class Card extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     * @param {number} x - Initial horizontal coordinate position.
     * @param {number} y - Initial vertical coordinate position.
     * @param {Object} cardData - The underlying data model object configuration values.
     */
    constructor(scene, x, y, cardData) {
        super(scene, x, y);
        
        // 1. Initialize State Tracking Metrics
        this.cardData = cardData;
        this.cardType = cardData.type || "character";
        this.damageCounters = 0;
        this.isHovered = false;
        this.attachedEnergy = [];

        // 2. Build Component Visual Layers
        this.buildArtworkLayer(scene);
        this.buildTitleLayer(scene);
        this.buildCounterLayer(scene);

        // 3. Configure Input Physics & Interaction Pipelines
        this.initializeInputEngine(scene);

        // 4. Push Instance into Active Rendering Hierarchy
        scene.add.existing(this);
    }

    /**
     * Instantiates and attaches the core background frame image asset.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildArtworkLayer(scene) {
        // Arguments: (x, y, 'AtlasNicknameKey', 'SpecificStringFrameKey')
        this.art = scene.add.image(0, 0, 'card_atlas', this.cardData.atlasKey);
        this.add(this.art);
    }

    /**
     * Instantiates and centers the slate-colored title node beneath the card frame.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildTitleLayer(scene) {
        this.nameText = scene.add.text(0, 42, this.cardData.name, { 
            fontSize: '10px', 
            color: '#e2e8f0', // Crisp off-white slate text
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 80, useAdvancedWrap: true } 
        });

        this.nameText.setOrigin(0.5);
        this.add(this.nameText);
    }

    /**
     * Instantiates the hidden floating counter badge outside the left edge, flush with the top border.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildCounterLayer(scene) {
        // Positioned at X: -45 to clear the left edge, and Y: -32.5 to match the top boundary perfectly
        this.counterText = scene.add.text(-45, -32.5, '', {
            fontSize: '12px',
            color: '#fc8181', // Coral warning red text
            fontStyle: 'bold',
            backgroundColor: '#1a202c', // Solid dark backing panel
            padding: { x: 5, y: 3 }
        });

        // Anchor the text origin to its own horizontal center (0.5) and top vertical line (0)
        // This keeps it perfectly level with the card top even as the text height expands
        this.counterText.setOrigin(0.5, 0);
        this.counterText.setVisible(false);
        this.add(this.counterText);
    }

    /**
     * Maps coordinate dimensions, registers hit areas, and handles mouse/hotkey streams.
     * @param {Phaser.Scene} scene - Active scene context.
     */
        /**
     * Maps coordinate dimensions, registers hit areas, and handles mouse streams.
     * Enhanced with Tutorial 5 Drag-Threshold Guards to prevent click-drag crossfire.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    initializeInputEngine(scene) {
        // Define bounding hit-area dimensions matching the 65x65 pixel frame asset size
        this.setSize(65, 65);

        // Map pixel-accurate hit area parameters to the container geometry
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 65, 65), Phaser.Geom.Rectangle.Contains);

        // Register hover state changes
        this.on('pointerover', () => {
            this.isHovered = true;
        });

        this.on('pointerout', () => {
            this.isHovered = false;
        });

        // Click handler with Drag Threshold Guard
        this.on('pointerup', (pointer) => {
            // Calculate total pixel distance moved between down-click and up-release
            const moveDistance = Phaser.Math.Distance.Between(
                pointer.downX, pointer.downY, 
                pointer.upX, pointer.upY
            );

            // If the user dragged the card further than 5 pixels, abort damage adjustments
            if (moveDistance > 5) return; 

            // Otherwise, process as a clean click action
            this.adjustDamageCounters(10);
        });

        // Register this specific wrapper object to be fully draggable by the input pipeline
        scene.input.setDraggable(this);
    }

     /**
     * Public utility to mutate damage metrics and adjust visual token layers.
     * @param {number} amount - The integer value change (+10 or -10).
     */
     adjustDamageCounters(amount) {
        this.damageCounters += amount;

        // Clamp the lower floor barrier value to 0 so damage cannot go negative
        if (this.damageCounters < 0) {
            this.damageCounters = 0;
        }

        // Update the floating token overlay layer dynamically
        if (this.damageCounters > 0) {
            this.counterText.setText(`${this.damageCounters}`);
            this.counterText.setVisible(true);

            // --- CLICK-SPAM PROTECTION GUARD ---
            // Stop any active pulse animations on this specific object immediately
            this.scene.tweens.killTweensOf(this.counterText);
            // Instantly force scales back down to normal before executing the next pulse
            this.counterText.setScale(1);

            // Tutorial 5: Trigger a quick responsive scale pulse heartbeat
            this.scene.tweens.add({
                targets: this.counterText,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 80,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        } else {
            this.counterText.setVisible(false); // Hide completely if card is perfectly healthy
        }
    }
}
