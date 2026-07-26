/**
 * Handles the configuration, physical sandbox zones, and structural mechanics of the board table.
 */
class Playmat {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;
        this.cardW = 267;
        this.cardH = 370;
        
        // --- FIXED COMPACT FOOTPRINT Engine (0.18 Scale) ---
        this.displayW = this.cardW * 0.18; // 48.06px
        this.displayH = this.cardH * 0.18; // 66.6px
        
        this.activeZone = null;
        this.benchZones = [];
        this.deckZone = null;
        this.discardZone = null;

        this.drawVisualOutlines();
        this.initializeDropZones();
    }

    /**
     * Entrypoint layout router. Coordinates visual sandbox guide rendering loops.
     * Refactored into highly modular, decoupled single-responsibility sub-renderers.
     */
    drawVisualOutlines() {
        const graphics = this.scene.add.graphics();

        this.drawPlayerHandTray(graphics);
        this.drawActiveCombatSpot(graphics);
        this.drawPlayerBenchRow(graphics);
        this.drawOpponentBenchRow(graphics);
        this.drawPlayerPiles(graphics);
        this.drawOpponentPiles(graphics);
    }
    
    /**
     * Renders a shared utility helper helper to draw a 3-tier depth stack with a frame boundary.
     * Bypasses heavy code duplication across Player A and Player B layout blocks.
     */
    drawStaggeredDeckStack(graphics, x, y, labelText, labelColor) {
        const stackOffset = 2;

        for (let i = 2; i >= 0; i--) {
            const offsetX = x - (i * stackOffset);
            const offsetY = y - (i * stackOffset);
            
            const backSprite = this.scene.add.image(offsetX, offsetY, 'card_atlas', 'back');
            
            // Map down to the scaled 66.75 x 92.5 layout boundary box
            backSprite.setDisplaySize(this.displayW, this.displayH); 
            if (i > 0) backSprite.setTint(0xcccccc);
        }

        // Draw boundary rectangle using display sizes
        graphics.strokeRect(x - (this.displayW / 2), y - (this.displayH / 2), this.displayW, this.displayH);
        this.scene.add.text(x, y - (this.displayH / 2) - 15, labelText, { fontSize: '12px', color: labelColor }).setOrigin(0.5);
    }

    /**
     * Renders a standalone outline frame boundary with an optimized centered label tag.
     */
    drawSingleSlotOutline(graphics, x, y, labelText, labelColor, fontSize = '10px') {
        graphics.strokeRect(x - (this.displayW / 2), y - (this.displayH / 2), this.displayW, this.displayH);
        this.scene.add.text(x, y - (this.displayH / 2) - 15, labelText, { fontSize: fontSize, color: labelColor }).setOrigin(0.5);
    }

    /**
     * Instantiates the visually dark tray asset panel designed to frame player hand cards.
     */
    drawPlayerHandTray(graphics) {
        graphics.fillStyle(0x1a202c, 0.4); 
        graphics.lineStyle(1, 0xffffff, 0.1); 

        const trayW = 760;
        const trayH = 100;
        const trayX = 512 - (trayW / 2); 
        const trayY = 660 - (trayH / 2); 

        graphics.fillRoundedRect(trayX, trayY, trayW, trayH, 8);
        graphics.strokeRoundedRect(trayX, trayY, trayW, trayH, 8);
        
        this.scene.add.text(trayX + 15, trayY + 8, 'Player Hand', { 
            fontSize: '10px', 
            color: '#4a5568', 
            fontStyle: 'bold' 
        });
    }

    /**
     * Instantiates vertically stacked compact combat spots dead center on the table.
     * Fixed: Shifted from raw 267x370 sizes down to displayW and displayH bounds.
     */
    drawActiveCombatSpot(graphics) {
        graphics.lineStyle(2, 0xffffff, 0.2);
        const centerX = 512;
        
        // Player A's active lane slot coordinates (FIXED BOUNDS)
        const playerActiveY = 360; 
        graphics.strokeRect(centerX - (this.displayW / 2), playerActiveY - (this.displayH / 2), this.displayW, this.displayH);
        this.scene.add.text(centerX + (this.displayW / 2) + 15, playerActiveY, 'Your Active', { fontSize: '10px', color: '#a0aec0' }).setOrigin(0, 0.5);

        // Player B's active lane slot coordinates (FIXED BOUNDS)
        const oppActiveY = 260; 
        graphics.strokeRect(centerX - (this.displayW / 2), oppActiveY - (this.displayH / 2), this.displayW, this.displayH);
        this.scene.add.text(centerX + (this.displayW / 2) + 15, oppActiveY, 'Opp. Active', { fontSize: '10px', color: '#718096' }).setOrigin(0, 0.5);
    }

    /**
     * Instantiates the side-by-side active row designed for Player A's sub-benched items.
     */
    drawPlayerBenchRow(graphics) {
        const benchY = 460;
        const spacing = 90;
        const startX = 512 - (2 * spacing);

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i * spacing);
            this.drawSingleSlotOutline(graphics, slotX, benchY, `Bench ${i + 1}`, '#718096');
        }
    }

    /**
     * Instantiates the mirrored layout matrix designed for Player B's sub-benched items.
     */
    drawOpponentBenchRow(graphics) {
        const oppBenchY = 180; 
        const spacing = 90;
        const startX = 512 - (2 * spacing);

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i * spacing);
            this.drawSingleSlotOutline(graphics, slotX, oppBenchY, `Opp. Bench ${i + 1}`, '#4a5568');
        }
    }

    /**
     * Instantiates resource allocation stacks along the right edge for local tracking actions.
     */
    drawPlayerPiles(graphics) {
        const deckX = 900;
        const deckY = 300;
        const discardY = 460;

        // Draw Player A dynamic depth pile asset
        this.drawStaggeredDeckStack(graphics, deckX, deckY, 'Deck [B]', '#a0aec0');

        // Draw Player A static discard stack outline frame 
        this.drawSingleSlotOutline(graphics, deckX, discardY, 'Discard [V]', '#a0aec0', '12px');
    }

    /**
     * Instantiates resource allocation stacks along the left edge for network syncing tracking actions.
     * Updated: Swapped vertical positions to keep the table layout perfectly balanced.
     */
    drawOpponentPiles(graphics) {
        const oppDeckX = 124;    
        const oppDeckY = 300;    // Flipped to center lane (300) to mirror Player A's Deck placement
        const oppDiscardY = 180; // Flipped to upper lane (180) to mirror Player A's Discard row style

        // Draw Player B dynamic depth pile asset via cleanly reused helper utility 
        this.drawStaggeredDeckStack(graphics, oppDeckX, oppDeckY, 'Opp. Deck', '#718096');

        // Draw Player B static discard stack outline frame via cleanly reused helper utility
        this.drawSingleSlotOutline(graphics, oppDeckX, oppDiscardY, 'Opp. Discard [P]', '#718096', '12px');
    }    

    /**
     * Instantiates physical engine Drop Zones onto the board mapping grid coordinates.
     */
    initializeDropZones() {
        // Player A Active Drop Target
        this.playerActiveZone = this.scene.add.zone(512, 360, this.displayW, this.displayH).setRectangleDropZone(this.displayW, this.displayH);
        this.playerActiveZone.setData('zoneType', 'playerActive');
        this.playerActiveZone.setData('isOccupied', false);

        // Build 5 underlying bench zones drop targets mapping coordinates matrix
        const benchY = 460;
        const spacing = 90;
        const startX = 512 - (2 * spacing);

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i * spacing);
            const bZone = this.scene.add.zone(slotX, benchY, this.displayW, this.displayH).setRectangleDropZone(this.displayW, this.displayH);
            
            bZone.setData('zoneType', 'bench');
            bZone.setData('isOccupied', false);
            this.benchZones.push(bZone);
        }

        // --- NEW SANDBOX MECHANICS: DECK & DISCARD PHYSICAL ZONES ---
        const deckX = 900;
        const deckY = 300;
        const discardY = 460;

        // Physical Deck Zone (Configured to listen for clicks to draw cards manually)
        this.deckZone = this.scene.add.zone(deckX, deckY, this.displayW, this.displayH).setRectangleDropZone(this.displayW, this.displayH);
        this.deckZone.setData('zoneType', 'deck');
        this.deckZone.setInteractive(); // Enables the zone geometry to fire pointerdown events

        // --- VISUAL POLISH HOOK ---
        // Push the invisible hit box to a high layer depth so it sits cleanly on top of the visual card back stack images
        this.deckZone.setDepth(100); 

        // Physical Discard Zone (Accepts dropped cards from the table or hand)
        this.discardZone = this.scene.add.zone(deckX, discardY, this.displayW, this.displayH).setRectangleDropZone(this.displayW, this.displayH);
        this.discardZone.setData('zoneType', 'discard');
    }
}
