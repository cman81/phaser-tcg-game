# Phaser 4 TCG Playmat Companion Sandbox (Client)

A decoupled, event-driven tabletop engine prototype built with Phaser 4. This client architecture is designed with a **Tactile Sandbox / Companion Architecture** mindset—separating frontend layout container view layers from authoritative, stateful backend services to enable an open, unconstrained tabletop sandbox environment.

This project functions as a frontend rendering engine that pairs via WebSockets with an isolated, authoritative Node.js/Socket.io backend repository.

---

## Architecture Overview

The system mirrors a decoupled theme/module design layer pattern common in robust web frameworks, where an independent backend server handles private entity data tracking, while standalone client classes manage custom rendering pipelines and input routing.

### Module Map
*   **`index.html`**: Entrypoint DOM root loading local static Socket.io client drivers, framework scripts, and mounting the modular component execution pipeline.
*   **`game.js`**: Central client core routing layer initializing layout engines, managing macro sandbox states, and housing global keyboard controllers.
*   **`Card.js`**: Custom interactive view container (`Phaser.GameObjects.Container`) managing mouse-stillness hover debouncers, spam-protected scale-pulse health badges, and high-resolution 1.0 focus zooming with strict lifecycle animation guards.
*   **`Playmat.js`**: High-resolution geometry rendering pipeline mapping out physical drop target slot zones across active, bench, deck, and discard matrices down to a compact 0.18 table scale footprint.
*   **`TableManager.js`**: Central client business logic hub orchestrating successful drop target snapping, absolute host-anchored energy attachments, and managing a deep snapshot history array stack (`moveHistory`) to undo misplayed tactile positions.
*   **`GameHud.js`**: Heads-up dashboard directing chess-clock style state plunging button controllers, active text parameters, and color-pulsing hidden resource trackers.
*   **`DeckBrowser.js`**: Translucent full-screen sandwich UI container isolating structural HUD titles from scrollable, grid-masked collections to review polymorphic card data arrays.
*   **`MockNetworkManager.js`**: Frontend network client routing layer that establishes the live bidirectional connection stream to the external game server and manages asymmetric data parsing.

---

## Installation & Running

1. Clone or download this client repository directory into your environment.
2. Ensure you have your texture map assets placed inside:
   ```text
   assets/pkmn.png
   assets/pkmn.json
   ```
3. Since framework dependencies are managed locally to ensure container stability, download the required scripts into your folder structure:
   * Fetch the Phaser 4 library file via curl, e.g.:
     ```bash
     curl -L --create-dirs -o vendor/phaserjs/phaser.min.js https://github.com/phaserjs/phaser/releases/download/v4.2.1/phaser.min.js
     ```
   * Fetch the client Socket.io driver via curl, e.g.:
     ```bash
     curl -L --create-dirs -o vendor/socketio/socket.io.min.js https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.min.js
     ```

4. Boot your client-side local development web server inside the root directory:
   ```bash
   python -m http.server 8000
   ```
5. Ensure your standalone backend server project is running and active on your environment (default port `3000`).
   * `cd tcg-sandbox-server`
   * `node server.js`
6. Point your browser to `http://localhost:8000`.
---

## System Mechanics & Features

### 1. Chess-Clock Macro State Engine
The workflow completely bypasses rigid phase rules, tracking a physical clock-plunger state configuration system (`SandboxStates`):
```text
SETUP => MY_TURN <=> OPPONENT_TURN
```
The GameHud end button serves as a tactile state-plunger. Clicking it transitions the layout cleanly, while entering `OPPONENT_TURN` fires automated multi-stage card-glide simulation loops inside `MockNetworkManager.js` (drawing 1 card, playing random benched characters, and stacking energy attachments). Clicking the button during the opponent's window activates an override interception mechanism to instantly pause AI loops.

### 2. Authoritative 3rd-Entity WebSocket & Rehydration Architecture
*   **Asymmetric Data Privilege**: The isolated Node.js server maintains absolute truth over private variables. When a card is drawn, the server updates the drawing player with a high-privilege payload revealing identity, while broadcasting a low-privilege hidden metadata packet to the opponent to obscure card traits.
*   **Persistent State Rehydration**: Client tabs initialize with a persistent `sessionStorage` token. Upon a page refresh, the server intercepts the handshake, identifies the existing room state cache, and instantly re-transmits a complete structural data dump to dynamically redraw hand collections, active field positions, damage tokens, and hidden opponent metrics.

### 3. Tween-Assisted Hand Spacing Equation Layout Engine
Hand scaling updates card transforms using a centered horizontal calculation matrix:

\[startX = 512 - $\frac{(\text{Hand Length} - 1) \times \text{Card Spacing}}{2}$\]

When server-approved cards are drawn, the layout manager appends them to the hand pool, registers explicit draggable properties, and triggers `Phaser.Tweens` to smoothly translate containers into an evenly distributed row across a 250ms curve.

### 4. Advanced Sandbox Stacking, Snapping & Reverse History Undos
*   **Tactile Snap & Input Release**: Successful table placements drop their active drag flags temporarily to clear pointer pools before re-enabling interactivity, snapping precise pixel coordinates to target slots.
*   **Absolute Anchor Stacking**: Energy modules map their coordinates and stagger indices directly to the parent character's absolute anchor point rather than current drag positions. The server ensures strict visual sorting indices (`setDepth`) to overlay components hierarchically without depth confusion.
*   **Universal Move Recovery Engine**: Pressing the alpha-numeric **`[Z]`** hotkey invokes `TableManager.undoLastMove()`. The system pops the latest snapshot out of `this.moveHistory`, rolls back backend array filters, unbinds slot occupancy maps with special guard constraints to prevent energy re-attachment overlap failures, and triggers a reverse visual glide tween to wind back misplayed physical positions.

### 5. Multi-Input Counter Pipelines
*   **Left-Click Mouse Inputs**: Clicking a card container increases damage by `+10`. If a user moves an item too fast, a 5-pixel click-drag crossfire threshold guard blocks accidental damage modification triggers.
*   **Hover-Targeted Hotkey Decrements**: Pressing `[-]` or `[NUMPAD_MINUS]` maps the vector underneath the mouse pointer (`isHovered`) across active fields and hand indices to cleanly deduct `-10` damage units, completely collapsing the overlay once fully healed.
