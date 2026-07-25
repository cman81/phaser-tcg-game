/**
 * TableManager Service
 * Encapsulates core business logic, validation rules, and state mutations for table operations.
 */
class TableManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Updates positions for dragging cards and group-drags stacked attachments.
     */
    processCardDrag(gameObject, dragX, dragY) {
        if (currentPhase !== TurnPhases.MAIN_PHASE && !gameObject.getData('hasWarnedDrag')) {
            if (hud) hud.flashWarning("Manipulating cards outside of your active Main Phase.");
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
     * Scrubs references and locks down assets dropped flat on the discard pile.
     */
    discardCard(gameObject, dropZone) {
        const previousZone = gameObject.getData('currentZone');
        if (previousZone) {
            previousZone.setData('isOccupied', false);
        }

        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;
        gameObject.setData('currentZone', null);
        
        this.scene.input.setDraggable(gameObject, false);

        if (hand.includes(gameObject)) {
            hand = hand.filter(card => card !== gameObject);
            updateHandLayout(this.scene);
        }
    }

    /**
     * Validates, routes, and hooks cards to active or bench zones.
     */
    playCardToSlot(gameObject, dropZone) {
        if (currentPhase !== TurnPhases.MAIN_PHASE) {
            if (hud) hud.flashWarning("Card deployed outside your Main Phase.");
        }

        // Collision Check & Attachment Override Logic
        if (dropZone.getData('isOccupied') === true) {
            if (gameObject.cardType === "energy") {
                this.attachEnergyToHost(gameObject, dropZone);
                return;
            }
            if (hud) hud.flashWarning("This slot is already holding a card.");

            // Tutorial 5: Trigger physical horizontal rejection shake
            gameObject.disableInteractive(); // Lock input during animation
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
                    // Cleanly fallback to hand array positioning guidelines
                    updateHandLayout(this.scene);
                }
            });
            
            return; 
        }

        // Standard Placement Success
        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;
        dropZone.setData('isOccupied', true);
        this.scene.input.setDraggable(gameObject, false);

        hand = hand.filter(card => card !== gameObject);
        updateHandLayout(this.scene);
    }

    /**
     * Implements stacking layout logic to tuck energy attachments underneath character hosts.
     */
    attachEnergyToHost(gameObject, dropZone) {
        const boardCards = this.scene.children.list.filter(obj => obj instanceof Card);
        const hostCard = boardCards.find(card => card.x === dropZone.x && card.y === dropZone.y && card !== gameObject);

        if (hostCard) {
            hostCard.attachedEnergy.push(gameObject);

            const verticalStagger = 15;
            const horizontalStagger = 10;
            const attachmentIndex = hostCard.attachedEnergy.length;
            
            gameObject.x = hostCard.x + (attachmentIndex * horizontalStagger);
            gameObject.y = hostCard.y - (attachmentIndex * verticalStagger);

            this.scene.children.sendToBack(gameObject);
            this.scene.children.bringToTop(hostCard); 

            this.scene.input.setDraggable(gameObject, false);

            if (hand.includes(gameObject)) {
                hand = hand.filter(card => card !== gameObject);
                updateHandLayout(this.scene);
            }
            
            if (hud) hud.flashWarning("Energy attached to character slot.");
        }
    }
}
