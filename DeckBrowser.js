/**
 * DeckBrowser UI Component (Polymorphic Viewer Array Extension)
 * Renders a full-screen grid display for any passed card data collection layer.
 */
class DeckBrowser {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        
        // Parent container (Houses static UI layers, backgrounds, and masks)
        this.container = this.scene.add.container(0, 0).setDepth(5000).setVisible(false);
        
        // 2. NEW: Separated Structural Layers to isolate HUD from Cards
        this.hudContent = this.scene.add.container(0, 0);
        this.scrollContent = this.scene.add.container(0, 0);
        
        this.container.add(this.hudContent);
        this.container.add(this.scrollContent);
    
        this.browserCards = [];
        this.activeTargetArray = null;
        this.isDraftableMode = true;
    
        // NEW: Scroll Tracking State Metrics
        this.currentScrollY = 0;
        this.minScrollY = 0; // Top boundary wall
        this.maxScrollY = 0; // Dynamic bottom boundary box limit
        this.scrollbarGraphic = null;

        // --- FIXED: CREATE AND BIND THE VIEWPORT MASK EXACTLY ONCE AT STARTUP ---
        const maskShape = this.scene.make.graphics({ x: 0, y: 0 }, false);
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(40, 130, 944, 600); // Bounds our grid view corridor beautifully

        const viewportMask = maskShape.createGeometryMask();
        this.scrollContent.setMask(viewportMask);
    }
    

    toggle(targetArray, titleText, canDraft) {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(targetArray, titleText, canDraft);
        }
    }

    /**
     * Darkens the screen viewport and routes layout drawing pipelines.
     * Refactored into highly modular single-responsibility sub-renderers.
     * @param {Array} targetArray - The deck or discard pile data array to read from.
     * @param {string} titleText - The custom header label text string.
     * @param {boolean} canDraft - If true, cards can be selected and added back to hand.
     */
    open(targetArray, titleText, canDraft = true) {
        if (!targetArray || targetArray.length === 0) {
            if (hud) hud.flashWarning("That pile is completely empty!");
            return;
        }

        // 1. Establish Lifecycle State References
        this.isOpen = true;
        this.activeTargetArray = targetArray;
        this.isDraftableMode = canDraft;
        
        // Reset scrolling offsets
        this.currentScrollY = 0;
        this.scrollContent.y = 0;

        // 2. FIXED SAFEHOUSE CLEAR: Flush elements from BOTH tiers safely
        this.container.setVisible(true);
        this.scrollContent.removeAll(true); // Wipes cards out of GPU cache maps
        this.hudContent.removeAll(true);    // Wipes older text/buttons completely
        this.browserCards = [];

        // 3. Draw Background & Control Layers (Pushed into hudContent, not parent)
        this.drawModalBackdrop();
        this.drawModalHeader(titleText, canDraft);
        this.appendCloseWidget();
        this.appendShuffleWidget(canDraft);

        // 4. Trigger Dynamic Card Positioning Layout Grid Engine 
        this.renderTargetGrid();

        // 5. Apply Interaction Streams and Scrollbars
        this.initializeScrollInputs();
        this.updateScrollbarVisuals();
        
        // Pull your scroll container clean to the front of background assets
        this.container.bringToTop(this.scrollContent);
    }


    /**
     * Generates the full-screen translucent slate background overlay.
     */
    drawModalBackdrop() {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f172a, 0.94); 
        bg.fillRect(0, 0, 1024, 768);
        this.hudContent.add(bg); // <-- UPDATED TARGET
    }

    /**
     * Generates both Title and Instruction text tracking headers.
     */
    drawModalHeader(titleText, canDraft) {
        const headerText = this.scene.add.text(512, 40, `${titleText} (${this.activeTargetArray.length} Cards)`, {
            fontSize: '22px', color: '#f8fafc', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.hudContent.add(headerText); // <-- UPDATED TARGET

        const controlPrompt = canDraft 
            ? 'Left-click a card to draft it directly into your hand. Click the red [X] to exit.'
            : 'Reviewing public knowledge scrap pile indices. Click the red [X] to exit.';
            
        const subheaderText = this.scene.add.text(512, 70, controlPrompt, {
            fontSize: '12px', color: '#94a3b8'
        }).setOrigin(0.5);
        this.hudContent.add(subheaderText); // <-- UPDATED TARGET
    }

    /**
     * Instantiates the red functional escape widget close button.
     */
    appendCloseWidget() {
        const closeBtn = this.scene.add.text(950, 40, '[ X ]', {
            fontSize: '18px', color: '#ef4444', fontStyle: 'bold', backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', () => this.close());
        this.hudContent.add(closeBtn); // <-- UPDATED TARGET
    }

    /**
     * Conditionally appends the emerald randomizer layout button only during deck searches.
     * Refactored: Routes the shuffle request directly up to the authoritative game server.
     */
    appendShuffleWidget(canDraft) {
        if (!canDraft) return;

        const shuffleBtn = this.scene.add.text(820, 40, '🔄 Shuffle Deck', {
            fontSize: '14px', color: '#34d399', fontStyle: 'bold', backgroundColor: '#1e293b', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive();
        
        shuffleBtn.on('pointerdown', () => {
            this.close(); // Instantly collapse the browser overlay matrix
            
            // Dispatch a secure network request up to our separate backend service repo
            if (networkManager) {
                networkManager.requestDeckShuffle();
            }
        });
        this.hudContent.add(shuffleBtn);
    }


    renderTargetGrid() {
        const startX = 140;
        const startY = 160;
        const columns = 6; // Reduced column count from 8 to 6 to handle wider text layout gaps
        const spacingX = 150; // Expanded horizontal space
        const spacingY = 200; // Expanded vertical space to accommodate the 370px height aspect ratio

        this.activeTargetArray.forEach((cardData, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const gridX = startX + (col * spacingX);
            const gridY = startY + (row * spacingY);

            const browserCard = new Card(this.scene, gridX, gridY, cardData, true);
            
            // Explicitly force browser modal cards to sit flat at 0.4 scale for clean grid spacing
            browserCard.setScale(0.4);
            browserCard.baselineScale = 0.4; // Explicit override pass to be bulletproof
            this.scene.input.setDraggable(browserCard, false);
            browserCard.removeAllListeners('pointerdown');

            if (this.isDraftableMode) {
                browserCard.on('pointerdown', () => {
                    this.draftCardFromBrowser(cardData);
                });
            }

            this.scrollContent.add(browserCard); // Nest inside scroll tier, not parent
            this.browserCards.push(browserCard);
        });

        // Directly after the forEach loop ends, calculate dynamic heights:
        const totalRows = Math.ceil(this.activeTargetArray.length / columns);
        const totalGridHeight = startY + (totalRows * spacingY);
        const viewportHeight = 600; // Visible window space length

        // Sliding content UP requires negative translation tracking parameters
        this.maxScrollY = totalGridHeight > viewportHeight ? -(totalGridHeight - viewportHeight - 40) : 0;
    }


    draftCardFromBrowser(cardData) {
        // Strip out of the specific array currently loaded into the browser context (the deck)
        deck = deck.filter(c => c.uuid !== cardData.uuid);

        const targetHandCard = new Card(this.scene, 512, -100, cardData, true);
        hand.push(targetHandCard);
        updateHandLayout(this.scene);

        if (hud) {
            hud.deckCountText.setText(`Deck: ${deck.length} cards`);
            hud.flashWarning(`Drafted ${cardData.name} into your hand.`);
        }
        this.close();
    }

    close() {
        this.isOpen = false;
        this.activeTargetArray = null;
        this.scene.input.off('wheel'); 
        this.container.setVisible(false);
        this.scrollContent.removeAll(true);
        this.hudContent.removeAll(true); // <-- ENSURE THIS LINE IS HERE
        this.browserCards = [];
    }


    /**
     * Binds mouse wheel interaction hooks to translate scrollContent container coordinates.
     */
    initializeScrollInputs() {
        this.scene.input.off('wheel'); // Clear lingering scene event listeners

        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (!this.isOpen) return;

            // INSPECTION INTERCEPT: Collapse zoom clocks immediately if a player scrolls
            this.browserCards.forEach(card => {
                if (card.hoverTimer) card.hoverTimer.remove();
                if (card.isZoomed) card.executeZoomOut();
            });

            // Translate using a standard scroll modifier speed factor
            this.currentScrollY -= deltaY * 0.5;

            // Clamp offsets inside mathematical computing limits
            if (this.currentScrollY > this.minScrollY) this.currentScrollY = this.minScrollY;
            if (this.currentScrollY < this.maxScrollY) this.currentScrollY = this.maxScrollY;

            this.scrollContent.y = this.currentScrollY;
            this.updateScrollbarVisuals();
        });
    }

    /**
     * Dynamically draws a vertical scrollbar bar matching current position percentiles.
     */
    updateScrollbarVisuals() {
        if (this.scrollbarGraphic) this.scrollbarGraphic.destroy();
        if (this.maxScrollY === 0) return;

        this.scrollbarGraphic = this.scene.add.graphics().setDepth(6000);
        this.container.add(this.scrollbarGraphic);

        const trackX = 970;
        const trackY = 140;
        const trackHeight = 580;
        const barWidth = 6;

        this.scrollbarGraphic.fillStyle(0x1e293b, 0.5);
        this.scrollbarGraphic.fillRoundedRect(trackX, trackY, barWidth, trackHeight, 3);

        const scrollPercent = this.currentScrollY / this.maxScrollY;
        const barHeight = Math.max(40, (600 / -this.maxScrollY) * trackHeight);
        const availableTrackSpace = trackHeight - barHeight;
        const barY = trackY + (scrollPercent * availableTrackSpace);

        this.scrollbarGraphic.fillStyle(0x475569, 0.9); 
        this.scrollbarGraphic.fillRoundedRect(trackX, barY, barWidth, barHeight, 3);
    }

}
