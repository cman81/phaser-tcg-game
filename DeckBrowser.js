/**
 * DeckBrowser UI Component (Polymorphic Viewer Array Extension)
 * Renders a full-screen grid display for any passed card data collection layer.
 */
class DeckBrowser {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.container = this.scene.add.container(0, 0).setDepth(5000).setVisible(false);
        this.browserCards = [];
        
        // Polymorphic tracking properties
        this.activeTargetArray = null;
        this.isDraftableMode = true;
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

        // 2. Clear Previous Memory Canvas Allocations
        this.container.setVisible(true);
        this.container.removeAll(true); 
        this.browserCards = [];

        // 3. Delegate Visual Drawing Passes to Dedicated Sub-Methods
        this.drawModalBackdrop();
        this.drawModalHeader(titleText, canDraft);
        this.appendCloseWidget();
        this.appendShuffleWidget(canDraft);

        // 4. Trigger Dynamic Card Positioning Layout Grid Engine
        this.renderTargetGrid();
    }

    /**
     * Generates the full-screen translucent slate background overlay.
     */
    drawModalBackdrop() {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f172a, 0.94); 
        bg.fillRect(0, 0, 1024, 768);
        this.container.add(bg);
    }

    /**
     * Generates both Title and Instruction text tracking headers.
     */
    drawModalHeader(titleText, canDraft) {
        const headerText = this.scene.add.text(512, 40, `${titleText} (${this.activeTargetArray.length} Cards)`, {
            fontSize: '22px', color: '#f8fafc', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(headerText);

        const controlPrompt = canDraft 
            ? 'Left-click a card to draft it directly into your hand. Click the red [X] to exit.'
            : 'Reviewing public knowledge scrap pile indices. Click the red [X] to exit.';
            
        const subheaderText = this.scene.add.text(512, 70, controlPrompt, {
            fontSize: '12px', color: '#94a3b8'
        }).setOrigin(0.5);
        this.container.add(subheaderText);
    }

    /**
     * Instantiates the red functional escape widget close button.
     */
    appendCloseWidget() {
        const closeBtn = this.scene.add.text(950, 40, '[ X ]', {
            fontSize: '18px', color: '#ef4444', fontStyle: 'bold', backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', () => this.close());
        this.container.add(closeBtn);
    }

    /**
     * Conditionally appends the emerald randomizer layout button only during deck searches.
     */
    appendShuffleWidget(canDraft) {
        if (!canDraft) return;

        const shuffleBtn = this.scene.add.text(820, 40, '🔄 Shuffle Deck', {
            fontSize: '14px', color: '#34d399', fontStyle: 'bold', backgroundColor: '#1e293b', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive();
        
        shuffleBtn.on('pointerdown', () => {
            this.close();
            shuffleDeck();
            if (hud) hud.flashWarning("Deck securely re-shuffled blindly face-down.");
            if (networkManager) networkManager.broadcastState('BLIND_SHUFFLE_EXECUTED', {});
        });
        this.container.add(shuffleBtn);
    }


    renderTargetGrid() {
        const startX = 140;
        const startY = 160;
        const columns = 8;
        const spacingX = 105;
        const spacingY = 110;

        this.activeTargetArray.forEach((cardData, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const gridX = startX + (col * spacingX);
            const gridY = startY + (row * spacingY);

            // Pass true for isOwnCard so discard items display face-up for review
            const browserCard = new Card(this.scene, gridX, gridY, cardData, true);
            this.scene.input.setDraggable(browserCard, false);
            browserCard.removeAllListeners('pointerdown');

            // Routing click stream hooks based on our open context mode
            if (this.isDraftableMode) {
                browserCard.on('pointerdown', () => {
                    this.draftCardFromBrowser(cardData);
                });
            }

            this.container.add(browserCard);
            this.browserCards.push(browserCard);
        });
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
        this.container.setVisible(false);
        this.container.removeAll(true); 
        this.browserCards = [];
    }
}
