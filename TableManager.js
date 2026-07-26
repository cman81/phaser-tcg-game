/**
 * TableManager Service
 * Encapsulates core business logic, validation rules, and state mutations for table operations.
 */
class TableManager {
    constructor(scene) {
        this.scene = scene;
        this.moveHistory = [];
    }

    /**
     * Updates positions for dragging cards and group-drags stacked attachments.
     */
    processCardDrag(gameObject, dragX, dragY) {
        if (gameObject.hoverTimer) {
            gameObject.hoverTimer.remove();
        }
        if (gameObject.isZoomed) {
            gameObject.executeZoomOut();
        }

        if (currentPhase !== SandboxStates.MY_TURN && !gameObject.getData('hasWarnedDrag')) {
            if (hud) hud.flashWarning("Manipulating cards outside of your active turn window.");
            gameObject.setData('hasWarnedDrag', true);
        }

        const deltaX = dragX - gameObject.x;
        const deltaY = dragY - gameObject.y;

        gameObject.x = dragX;
        gameObject.y = dragY;

        if (gameObject.attachedEnergy && gameObject.attachedEnergy.length > 0) {
            gameObject.attachedEnergy.forEach(energyCard => {
                energyCard.x += deltaX;
                energyCard.y += deltaY;
            });
        }
    }

    /**
     * Scrubs references, pushes data payloads to tracking arrays, and locks down assets.
     */
    discardCard(gameObject, dropZone) {
        this.recordMoveSnapshot(gameObject);

        const previousZone = gameObject.getData('currentZone');
        if (previousZone) previousZone.setData('isOccupied', false);

        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;
        gameObject.setData('currentZone', null);
        gameObject.setData('isDeployed', true);
        
        if (gameObject.input) gameObject.input.enabled = false;
        gameObject.setAlpha(0.5); 

        discardPile.push(gameObject.cardData);
        if (hand.includes(gameObject)) {
            hand = hand.filter(card => card !== gameObject);
            updateHandLayout(this.scene);
        }

        this.scene.time.delayedCall(50, () => {
            if (gameObject && gameObject.input) gameObject.input.enabled = true;
        });

        if (hud) hud.flashWarning(`Card added to Discard Pile. Total: ${discardPile.length}`);
    }

    /**
     * Validates, routes, and hooks cards to active or bench zones.
     */
    playCardToSlot(gameObject, dropZone) {
        if (currentPhase !== SandboxStates.MY_TURN) {
            if (hud) hud.flashWarning("Card deployed outside your turn window.");
        }

        if (dropZone.getData('isOccupied') === true) {
            if (gameObject.cardType === "energy") {
                this.playCardToAttachment(gameObject, dropZone);
                return;
            }
            if (hud) hud.flashWarning("This slot is already holding a card.");

            gameObject.disableInteractive(); 
            const startX = gameObject.x;

            this.scene.tweens.add({
                targets: gameObject,
                x: startX + 12,
                duration: 40,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    gameObject.setInteractive();
                    updateHandLayout(this.scene);
                }
            });
            return; 
        }

        this.recordMoveSnapshot(gameObject);

        const previousZone = gameObject.getData('currentZone');
        if (previousZone) previousZone.setData('isOccupied', false);

        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;
        dropZone.setData('isOccupied', true);
        gameObject.setData('currentZone', dropZone);
        gameObject.setData('isDeployed', true);

        if (gameObject.input) gameObject.input.enabled = false;

        if (hand.includes(gameObject)) {
            hand = hand.filter(card => card !== gameObject);
            updateHandLayout(this.scene);
        }

        this.scene.time.delayedCall(50, () => {
            if (gameObject && gameObject.input) gameObject.input.enabled = true;
        });
    }

    /**
     * Intermediary router for attachments to capture snapshots prior to execution.
     */
    playCardToAttachment(gameObject, dropZone) {
        this.recordMoveSnapshot(gameObject);
        this.attachEnergyToHost(gameObject, dropZone);
    }

    /**
     * Implements stacking layout logic to tuck energy attachments underneath character hosts.
     */
    attachEnergyToHost(gameObject, dropZone) {
        const boardCards = this.scene.children.list.filter(obj => obj instanceof Card);
        const hostCard = boardCards.find(card => card.x === dropZone.x && card.y === dropZone.y && card !== gameObject);

        if (hostCard) {
            if (!hostCard.attachedEnergy.includes(gameObject)) {
                hostCard.attachedEnergy.push(gameObject);
            }

            const attachmentIndex = hostCard.attachedEnergy.length;
            
            gameObject.x = hostCard.x + (attachmentIndex * 12); 
            gameObject.y = hostCard.y - (attachmentIndex * 15);

            gameObject.setData('isDeployed', true);
            gameObject.setData('currentZone', dropZone);

            if (gameObject.input) gameObject.input.enabled = false;

            hostCard.setDepth(20);
            
            hostCard.attachedEnergy.forEach((energy, idx) => {
                energy.setDepth(19 - idx); 
            });

            if (hand.includes(gameObject)) {
                hand = hand.filter(card => card !== gameObject);
                updateHandLayout(this.scene);
            }
            
            this.scene.time.delayedCall(50, () => {
                if (gameObject && gameObject.input) gameObject.input.enabled = true;
            });

            if (hud) hud.flashWarning("Energy attached to character slot.");
        }
    }

    /**
     * Captures an instantaneous snapshot payload of a card's layout geometries.
     */
    recordMoveSnapshot(card) {
        const snapshot = {
            cardInstance: card,
            x: card.x,
            y: card.y,
            depth: card.depth,
            isDraggable: (card.input && card.input.enabled),
            alpha: card.alpha,
            attachedEnergy: [...card.attachedEnergy],
            previousHandIndex: hand.indexOf(card),
            previousZone: card.getData('currentZone')
        };
        
        this.moveHistory.push(snapshot);
        console.log(`[SANDBOX HISTORY] Captured snapshot state. History Depth: ${this.moveHistory.length}`);
    }

    /**
     * Pops the most recent movement snapshot out of the history stack, reverses array 
     * tracking mutations, and smoothly glides components back to original coordinates.
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) {
            if (hud) hud.flashWarning("No recent tabletop moves recorded to undo!");
            return;
        }

        const latest = this.moveHistory.pop();
        const card = latest.cardInstance;

        if (hud) hud.flashWarning(`Undoing movement for: ${card.cardData.name}`);

        if (discardPile.includes(card.cardData)) {
            discardPile = discardPile.filter(data => data.uuid !== card.cardData.uuid);
        }

        const currentZone = card.getData('currentZone');
        if (currentZone && card.cardType !== "energy") {
            currentZone.setData('isOccupied', false);
        }

        const boardCards = this.scene.children.list.filter(obj => obj instanceof Card);
        boardCards.forEach(host => {
            if (host.attachedEnergy.includes(card)) {
                host.attachedEnergy = host.attachedEnergy.filter(e => e !== card);
                
                host.attachedEnergy.forEach((energy, idx) => {
                    energy.setDepth(19 - idx);
                });
            }
        });

        if (latest.previousHandIndex !== -1 && !hand.includes(card)) {
            hand.push(card);
        }

        card.setData('currentZone', latest.previousZone);
        card.setData('isDeployed', latest.previousHandIndex === -1);
        
        if (latest.previousZone && card.cardType !== "energy") {
            latest.previousZone.setData('isOccupied', true);
        }

        if (card.input) {
            card.input.enabled = latest.isDraggable;
        }
        
        card.setDepth(4500); 
        card.setAlpha(latest.alpha);

        card.scene.tweens.add({
            targets: card,
            x: latest.x,
            y: latest.y,
            duration: 350,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                card.setDepth(latest.depth || 1);
                
                if (latest.previousHandIndex !== -1) {
                    updateHandLayout(card.scene);
                }
            }
        });
    }
}
