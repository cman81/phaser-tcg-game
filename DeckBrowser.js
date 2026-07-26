/**
 * DeckBrowser UI Component
 * Renders a full-screen, scrollable modal overlay displaying the remaining contents of the deck.
 */
class DeckBrowser {
    /**
     * @param {Phaser.Scene} scene - The active scene context instance.
     */
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;

        // Container to hold all overlay graphics and temporary card items
        this.container = this.scene.add.container(0, 0).setDepth(5000).setVisible(false);
        
        // Track visual cards currently instantiated inside the browser window
        this.browserCards = [];
    }

    /**
     * Toggles the browser modal layout visibility on or off.
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Halts standard gameplay input streams, darkens the viewport, and renders the deck array.
     */
    open() {
        if (deck.length === 0) {
            if (hud) hud.flashWarning("Your deck is empty! Nothing to browse.");
            return;
        }

        this.isOpen = true;
        this.container.setVisible(true);
        this.container.removeAll(true); // Clear out old drawing cycles safely
        this.browserCards = [];

        // 1. Build Full-Screen Backdrop Overlay (Canvas dims: 1024x768)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f172a, 0.92); // Deep dark slate blue, 92% opacity
        bg.fillRect(0, 0, 1024, 768);
        this.container.add(bg);

        // 2. Add Title Text Tracker Frame Header
        const headerText = this.scene.add.text(512, 40, `Deck Contents (${deck.length} Cards Remaining)`, {
            fontSize: '22px', color: '#f8fafc', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(headerText);

        const subheaderText = this.scene.add.text(512, 70, 'Left-click a card to draft it directly into your hand. Click the red [X] to exit.', {
            fontSize: '12px', color: '#94a3b8'
        }).setOrigin(0.5);
        this.container.add(subheaderText);

        // 3. Add Close Button Interactive Icon Widget
        const closeBtn = this.scene.add.text(950, 40, '[ X ]', {
            fontSize: '18px', color: '#ef4444', fontStyle: 'bold', backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', () => this.close());
        this.container.add(closeBtn);

        // 4. Render Grid Matrix of Remaining Assets
        this.renderDeckGrid();
    }

    /**
     * Loops through the data tracking array and draws stationary cards in a scrollable format.
     */
    renderDeckGrid() {
        const startX = 140;
        const startY = 160;
        const columns = 8;
        const spacingX = 105;
        const spacingY = 110;

        deck.forEach((cardData, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const gridX = startX + (col * spacingX);
            const gridY = startY + (row * spacingY);

            // Instantiate a special browser-restricted copy of the card
            // We use the raw Card component but alter its interaction hooks locally
            const browserCard = new Card(this.scene, gridX, gridY, cardData);
            
            // Override standard table interactions: no dragging or counter modification inside browser
            this.scene.input.setDraggable(browserCard, false);
            browserCard.removeAllListeners('pointerdown');

            // Set custom visual selection listener logic
            browserCard.on('pointerdown', () => {
                this.draftCardFromBrowser(cardData, browserCard);
            });

            this.container.add(browserCard);
            this.browserCards.push(browserCard);
        });
    }

    /**
     * Extracts a targeted data item directly from the deck mid-array and moves it safely into the hand array pool.
     */
    draftCardFromBrowser(cardData, visualBrowserCard) {
        // 1. Remove targeted entity data array payload out of global deck pile
        deck = deck.filter(c => c.uuid !== cardData.uuid);

        // 2. Use our centralized dealer wrapper to securely append it to our hand layer tracking arrays
        const targetHandCard = new Card(this.scene, visualBrowserCard.x, visualBrowserCard.y, cardData);
        hand.push(targetHandCard);
        updateHandLayout(this.scene);

        if (hud) {
            hud.deckCountText.setText(`Deck: ${deck.length} cards`);
            hud.flashWarning(`Drafted ${cardData.name} into your hand.`);
        }

        // 3. Close the browser view layer immediately to display the hand layout animation
        this.close();
    }

    /**
     * Resets interaction tracking states and clears the modal completely from memory maps.
     */
    close() {
        this.isOpen = false;
        this.container.setVisible(false);
        this.container.removeAll(true); // Purge all temporary card allocations cleanly
        this.browserCards = [];
    }
}
