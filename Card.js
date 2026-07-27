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
    constructor(scene, x, y, cardData, isOwnCard = true) {
        super(scene, x, y);
        
        // 1. Initialize State Tracking Metrics
        this.cardData = cardData;
        this.cardType = cardData.type || "character";
        this.damageCounters = 0;
        this.isHovered = false;
        this.attachedEnergy = [];
        this.isOwnCard = isOwnCard;

        // --- NEW: HOVER INSPECTION METRICS ---
        this.hoverTimer = null;
        this.isZoomed = false;
        this.originalDepth = 0;
        this.isAnimatingZoom = false; // <-- NEW: ANIMATION LOCK GUARD

        // 2. Build Component Visual Layers
        this.buildArtworkLayer(scene);
        this.buildTitleLayer(scene);
        this.buildCounterLayer(scene);

        // 3. Configure Input Physics & Interaction Pipelines
        this.initializeInputEngine(scene);

        // STASH INITIAL SCALE: Capture whether this card sits at 0.18 on the table or 0.4 in a modal
        this.baselineScale = this.scaleX; 

        // 4. Push Instance into Active Rendering Hierarchy
        scene.add.existing(this);
    }

    /**
     * Phaser Lifecycle Destroy Override.
     * Cleans up lingering clock timers and kills active tweens to prevent post-destruction crashes.
     */
    destroy(fromScene) {
        // 1. Clear and remove any ticking 0.7-second hover clock delays instantly
        if (this.hoverTimer) {
            this.hoverTimer.remove();
            this.hoverTimer = null;
        }

        // 2. FIXED: Kill any running scale animations immediately before the scene reference is unlinked
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
        }
        
        // Pass control back to Phaser's base container destroy logic
        super.destroy(fromScene);
    }

    /**
     * Instantiates and attaches the core background frame image asset.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildArtworkLayer(scene) {
        // OWNERSHIP CHECK: If the card belongs to an opponent, force the frame to show the generic back texture
        const frameKey = this.isOwnCard ? this.cardData.atlasKey : 'back';
        
        // Arguments: (x, y, 'AtlasNicknameKey', 'SpecificStringFrameKey')
        this.art = scene.add.image(0, 0, 'card_atlas', this.cardData.atlasKey);
        this.add(this.art);
    }

    /**
     * Instantiates and centers the slate-colored title node beneath the card frame.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildTitleLayer(scene) {
        // Positioned near the bottom boundary of the 370px tall frame (Y: 160)
        this.nameText = scene.add.text(0, 160, this.cardData.name, { 
            fontSize: '24px', // Increased font size since it renders inside a large container
            color: '#e2e8f0', 
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 220, useAdvancedWrap: true } 
        });

        this.nameText.setOrigin(0.5);
        this.add(this.nameText);

        if (!this.isOwnCard) {
            this.nameText.setVisible(false);
        }
    }

    /**
     * Public utility to flip the card face-up dynamically when deployed onto public table zones.
     */
    revealCard() {
        this.isOwnCard = true;
        this.art.setFrame(this.cardData.atlasKey);
        this.nameText.setVisible(true);
    }

    /**
     * Instantiates the hidden floating counter badge outside the left edge, flush with the top border.
     * @param {Phaser.Scene} scene - Active scene context.
     */
    buildCounterLayer(scene) {
        // Placed near the top-left boundary corner of your large container geometry
        this.counterText = scene.add.text(-110, -165, '', {
            fontSize: '32px', // Larger display font for high-res visibility
            color: '#fc8181', 
            fontStyle: 'bold',
            backgroundColor: '#1a202c', 
            padding: { x: 12, y: 8 }
        });

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
        // Set local container bounds to match the high-resolution source texture size
        this.setSize(267, 370);

        // Map pixel-accurate hit area parameters to the high-res container geometry
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 267, 370), Phaser.Geom.Rectangle.Contains);

        // Map baseline scale down to 0.18 to protect vertical margins
        this.setScale(0.18);

        // Event 1: Mouse enters card boundaries
        this.on('pointerover', () => {
            this.isHovered = true;
            
            // FIXED: Removed scene.input.isOver so the execution pass can proceed
            if (this.isZoomed || this.isAnimatingZoom) return;

            if (this.hoverTimer) this.hoverTimer.remove();
            this.hoverTimer = scene.time.delayedCall(300, () => {
                this.executeZoomIn();
            });
        });

        // Event 2: Mouse moves while remaining inside the card boundaries
        this.on('pointermove', () => {
            // FIX: If we are actively scaling up, ignore this micro-movement to prevent loop freeze
            if (this.isAnimatingZoom) return;

            if (this.isZoomed) {
                this.executeZoomOut();
            } else {
                if (this.hoverTimer) {
                    this.hoverTimer.remove();
                    this.hoverTimer = scene.time.delayedCall(300, () => {
                        this.executeZoomIn();
                    });
                }
            }
        });

        // Event 3: Mouse completely exits card boundaries
        this.on('pointerout', () => {
            this.isHovered = false;
            if (this.hoverTimer) this.hoverTimer.remove();
            this.executeZoomOut();
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
     * Magnifies the card container scale and forces it to clear lower rendering depths.
     */
    executeZoomIn() {
        if (!this.isOwnCard || this.isAnimatingZoom) return;
        
        this.isZoomed = true;
        this.isAnimatingZoom = true; // Lock input handling down
        this.originalDepth = this.depth;
        this.setDepth(9000);

        this.scene.tweens.add({
            targets: this,
            scaleX: 1.0, 
            scaleY: 1.0,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Release the lock only after the scale transform completes cleanly
                this.scene.time.delayedCall(50, () => {
                    this.isAnimatingZoom = false;
                });
            }
        });
    }

    /**
     * Smoothly restores baseline container properties.
     */
    executeZoomOut() {
        if (!this.isZoomed || this.isAnimatingZoom) return;
        this.isZoomed = false;
        this.isAnimatingZoom = true; 

        this.scene.tweens.add({
            targets: this,
            scaleX: this.baselineScale, // FIXED: Fallback dynamically to its native container scale
            scaleY: this.baselineScale, // FIXED: Fallback dynamically to its native container scale
            duration: 100,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.setDepth(this.originalDepth);
                this.isAnimatingZoom = false; 
            }
        });
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
            networkManager.broadcastDamageMutation(this.cardData.uuid, this.damageCounters);
        } else {
            this.counterText.setVisible(false); // Hide completely if card is perfectly healthy
        }
    }
}
