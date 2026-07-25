# Phaser 4 TCG Playmat Companion Sandbox

A decoupled, event-driven tabletop engine prototype built with Phaser 4. This architecture is designed with a **Tactile Sandbox / Companion Architecture** mindset-separating frontend layout container view layers from structural state-machine engines.

---

## Architecture Overview

The system mirrors a decoupled theme/module design layer pattern common in robust web frameworks, where backend arrays handle entity data tracking while standalone classes manage custom rendering pipelines.

### Module Map
*   **`index.html`**: Entrypoint DOM root setting up clean CSS canvas centering and mounting your local layout execution script pipeline stack.
*   **`game.js`**: Central application core engine bootstrap handling assets, state arrays, keyboard hooks, and canvas drag-drop logic.
*   **`Card.js`**: Custom interactive view container (`Phaser.GameObjects.Container`) rendering component artwork, titles, attached modules, and dynamic visual damage overlays.
*   **`Playmat.js`**: Geometry rendering pipeline mapping out physical drop target coordinates across active, bench, deck, and discard layout matrices.
*   **`GameHud.js`**: Heads-up overlay directing turn phase banners, operational text trackers, and soft warning notifications.

---

## Installation & Running

1. Clone or download this source code repository directory into your environment.
2. Ensure you have your texture map assets placed inside:
   ```text
   assets/cards.png
   assets/cards.json
   ```
3. Since the `vendor/` directory is ignored in this repository, you must download the framework locally before running the project. 

Run the following command in your terminal to create the directory and fetch Phaser 4:

```bash
curl -L --create-dirs -o vendor/phaserjs/phaser.min.js https://github.com/phaserjs/phaser/releases/download/v4.2.1/phaser.min.js
```
4. Boot a local development web server inside the root directory:
   ```bash
   # Option A: Python 3
   python -m http.server 8000
   
   # Option B: NodeJS Global NPM Server
   npx serve .
   ```
5. Point your browser engine to `http://localhost:8000`.

---

## System Mechanics & Features

### 1. Decoupled State Engine (FSM)
The workflow loops across a strict finite state machine directory (`TurnPhases`):
```javascript
OPPONENT_TURN => DRAW_PHASE => MAIN_PHASE => ATTACK_PHASE => END_PHASE
```
Transitions seamlessly handle control visibility blocks and trigger automated AI pacing wait delays. Mid-drag interaction phases are checked continuously via frame debounce states (`hasWarnedDrag`).

### 2. UUID Data Generation & Shuffle Engines
*   **60-Card Core Deck**: Generates exactly 60 cards by looping through unique prototyping definitions using modulo arithmetic (`(i - 1) % cardPrototypes.length`). Pieces are dynamically flagged as either standard `character` types or structural `energy` items.
*   **Secure Layout Indexing**: Leverages native browser cryptographic routines (`crypto.randomUUID()`) with a bulletproof, RFC4122-compliant fallback math string generator to attach a secure ID string to every single object.
*   **Alphanumeric Sorting Shuffle**: Breaks up pattern repetition by sorting the entire array stack explicitly against alphabetical UUID value comparisons, bypassing standard linear randomizing pitfalls.

### 3. Tween-Assisted Hand Spacing Equation Layout Engine
Hand scaling updates card transforms using a centered horizontal calculation matrix:

\[startX = 512 - $\frac{(\text{Hand Length} - 1) \times \text{Card Spacing}}{2}$\]

When cards are drawn directly from the deck boundaries, they append directly to your tracking arrays. The layout manager then registers individual `Phaser.Tweens` for every container in the player's hand array, fluidly translating them into an evenly distributed row across a 250ms `Power2` easing curve rather than using hard coordinate snapping.

### 4. Advanced Sandbox Stacking & Routing Pipelines
*   **Multi-Card Delta Dragging**: When moving a host character card across the table, any attached energy modules read structural positional delta offsets (&Delta; X, &Delta; Y) and slide along with the parent canvas container seamlessly.
*   **Energy Card Attachment Intercepts**: Dropping an `energy` type item onto an occupied slot triggers a tactical intercept routine. The module calculates placement stacking offsets (staggered 15px UP and 10px RIGHT per item) and overrides rendering layers (`sendToBack`) to sit safely behind the character frame while filtering itself from hand arrays.
*   **Discard Pile Scrubbing**: Moving an item to a `discard` target zone automatically releases prior zone tracking states, snaps layout transforms, strip-filters active hand array pools, and locks the card's input interactivity.

### 5. Multi-Input Counter Pipelines
*   **Left-Click Mouse Inputs**: Clicking an individual card container triggers an absolute increment of `+10` damage, instantly displaying a dark warning backer token overlay panel.
*   **Hover-Targeted Hotkey Decrements**: Striking the standard keyboard minus key `[-]` or numeric keypad `[NUMPAD_MINUS]` sweeps through active hand arrays and board nodes to pinpoint the specific card underneath the cursor (`isHovered`), cleanly deducting `-10` damage and hiding the overlay if fully healed.
