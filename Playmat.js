/**
 * Handles the configuration, physical sandbox zones, and structural mechanics of the board table.
 */
class Playmat {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;
        this.cardW = 65;
        this.cardH = 65;
        
        this.activeZone = null;
        this.benchZones = [];
        this.deckZone = null;
        this.discardZone = null;

        this.drawVisualOutlines();
        this.initializeDropZones();
    }

    /**
     * Draws static guideline outlines and text labels for table sandbox zones.
     */
    drawVisualOutlines() {
        const graphics = this.scene.add.graphics();

        // --- NEW SANDBOX MECHANICS: VISUAL HAND PANEL TRAY ---
        // Create a dedicated dark panel backing area specifically for holding player cards
        graphics.fillStyle(0x1a202c, 0.4); // Dark charcoal fill, 40% opacity
        graphics.lineStyle(1, 0xffffff, 0.1); // Subtly thin, soft white trim line

        // Draw a rounded rectangle tray spanning the bottom width of the screen
        // Arguments: (x, y, width, height, cornerRadius)
        const trayW = 760;
        const trayH = 100;
        const trayX = 512 - (trayW / 2); // Center horizontally on your 1024 width canvas
        const trayY = 660 - (trayH / 2); // Center vertically around your HAND_Y coordinate (660)

        graphics.fillRoundedRect(trayX, trayY, trayW, trayH, 8);
        graphics.strokeRoundedRect(trayX, trayY, trayW, trayH, 8);
        
        // Add a subtle title label tucked into the upper-left of the hand container grid area
        this.scene.add.text(trayX + 15, trayY + 8, 'Player Hand', { 
            fontSize: '10px', 
            color: '#4a5568', 
            fontStyle: 'bold' 
        });

        // --- ZONE 1: THE ACTIVE SPOT (Center Board) ---
        graphics.lineStyle(2, 0xffffff, 0.2); // Thin, semi-transparent white lines
        const activeX = 512;
        const activeY = 320;
        graphics.strokeRect(activeX - (this.cardW / 2), activeY - (this.cardH / 2), this.cardW, this.cardH);
        this.scene.add.text(activeX, activeY - 50, 'Active', { fontSize: '12px', color: '#a0aec0' }).setOrigin(0.5);

        // --- ZONE 2: THE BENCH (5 Side-by-Side Slots below Active Spot) ---
        const benchY = 460;
        const spacing = 90;
        const startX = 512 - (2 * spacing);

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i * spacing);
            graphics.strokeRect(slotX - (this.cardW / 2), benchY - (this.cardH / 2), this.cardW, this.cardH);
            this.scene.add.text(slotX, benchY - 50, `Bench ${i + 1}`, { fontSize: '10px', color: '#718096' }).setOrigin(0.5);
        }

        // --- ZONE 3: DECK & DISCARD PILES (Right Side of the Board) ---
        const deckX = 900;
        const deckY = 300;
        const discardY = 460;

        // Visual Polish: Render a staggered 3-tier card back stack to represent depth
        // We offset each card back by 2 pixels up and to the left to simulate a physical pile
        const stackOffset = 2;
        for (let i = 2; i >= 0; i--) {
            const offsetX = deckX - (i * stackOffset);
            const offsetY = deckY - (i * stackOffset);
            
            // Arguments: (x, y, 'atlasKey', 'frameKey')
            const backSprite = this.scene.add.image(offsetX, offsetY, 'card_atlas', 'back');
            
            // Match the standard 65x65 pixel bounds you defined
            backSprite.setDisplaySize(this.cardW, this.cardH ? this.cardH : 65); 
            
            // Give the lower layers a slight shadow effect by tinting them down a bit
            if (i > 0) {
                backSprite.setTint(0xcccccc);
            }
        }

        // Draw Deck slot guide frame & label
        graphics.strokeRect(deckX - (this.cardW / 2), deckY - (this.cardH / 2), this.cardW, this.cardH);
        this.scene.add.text(deckX, deckY - 50, 'Deck', { fontSize: '12px', color: '#a0aec0' }).setOrigin(0.5);

        // Draw Discard slot guide frame & label
        graphics.strokeRect(deckX - (this.cardW / 2), discardY - (this.cardH / 2), this.cardW, this.cardH);
        this.scene.add.text(deckX, discardY - 50, 'Discard', { fontSize: '12px', color: '#a0aec0' }).setOrigin(0.5);
    }

    /**
     * Instantiates physical engine Drop Zones onto the board mapping grid coordinates.
     */
    initializeDropZones() {
        // Build central active zone drop target mapping bounds
        this.activeZone = this.scene.add.zone(512, 320, this.cardW, this.cardH).setRectangleDropZone(this.cardW, this.cardH);
        this.activeZone.setData('zoneType', 'active');
        this.activeZone.setData('isOccupied', false);

        // Build 5 underlying bench zones drop targets mapping coordinates matrix
        const benchY = 460;
        const spacing = 90;
        const startX = 512 - (2 * spacing);

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i * spacing);
            const bZone = this.scene.add.zone(slotX, benchY, this.cardW, this.cardH).setRectangleDropZone(this.cardW, this.cardH);
            
            bZone.setData('zoneType', 'bench');
            bZone.setData('isOccupied', false);
            this.benchZones.push(bZone);
        }

        // --- NEW SANDBOX MECHANICS: DECK & DISCARD PHYSICAL ZONES ---
        const deckX = 900;
        const deckY = 300;
        const discardY = 460;

        // Physical Deck Zone (Configured to listen for clicks to draw cards manually)
        this.deckZone = this.scene.add.zone(deckX, deckY, this.cardW, this.cardH).setRectangleDropZone(this.cardW, this.cardH);
        this.deckZone.setData('zoneType', 'deck');
        this.deckZone.setInteractive(); // Enables the zone geometry to fire pointerdown events

        // --- VISUAL POLISH HOOK ---
        // Push the invisible hit box to a high layer depth so it sits cleanly on top of the visual card back stack images
        this.deckZone.setDepth(100); 

        // Physical Discard Zone (Accepts dropped cards from the table or hand)
        this.discardZone = this.scene.add.zone(deckX, discardY, this.cardW, this.cardH).setRectangleDropZone(this.cardW, this.cardH);
        this.discardZone.setData('zoneType', 'discard');
    }
}
