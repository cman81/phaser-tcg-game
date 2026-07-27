# PHASER TCG PLAYMAT COMPANION ROADMAP
# Context: Drupal Developer background (Tactile Sandbox / Companion Architecture)

## CURRENT PROGRESS
- Completed: System environments, decoupled file layouts, atlas texture maps, secure UUID shuffles.
- Completed: Phase 1 (Tutorial 1, 2, & 2.5 - Decoupled Component Architecture, Custom Layout Grids, Hand Spacing layout math engines).
- Completed: Tutorial 2.6 (Drag-and-Drop Card Snapping, Input Listeners, and Target Bound Matching).
- Completed: Tutorial 3 (The Informational State Machine & Soft Warning Guards).
- Completed: Tutorial 4 (Tactile Table Counters & Token Overlays).
- Completed: Structural Architecture Refactor (Extracted business logic into a dedicated `TableManager` service module, reducing interaction listeners to a lean routing controller).
- Completed: Tutorial 5 (Surface Physics Tweens & Polish - Uniform linear glide paths from the physical deck stack, elastic horizontal rejection shakes, anti-spam token pulses, and drag-distance threshold interaction guards).
- Completed: Tutorial 6 (UI Systems - Built a full-screen, translucent Phaser 4 modal layout container to render dynamic grids of remaining backend database card indices. Implemented open-ended, mid-turn card lookup lookups, extracted centralized `generateUUID()` helper utilities to maximize code reuse, and engineered blind-shuffling workflows to obscure card placement sequences).
- Completed: Tutorial 7 Base (Real-Time Playmat Synchronicity - Constructed a local decoupled loopback `MockNetworkManager` service. Implemented an asymmetrical battlefield canvas split in `Playmat.js` with left-aligned opponent resource piles. Refactored `GameHud` to encapsulate an encapsulated numerical tracker for hidden card counts, and wired a latency-delayed glide animation triggered on the alphanumeric `[O]` key).
- Completed: Polymorphic Modal Refactor (Polished `DeckBrowser.js` into an atomic sub-rendered data viewer, enabling independent multi-pile lookups across raw `deck` and custom `discardPile` arrays).
- Completed: Self-Documenting UI Overlays (Upgraded `Playmat.js` zone label textures to prominently display active hotkey shortcuts, e.g., "Deck [B]", "Discard [V]", and "Opp. Discard [P]", providing rapid user navigation cues).
- Completed: Opponent State Deserialization (Extended `MockNetworkManager.js` with an automated `simulateOpponentDiscard` routine triggered via `[I]`, tracking asymmetric discards into a separate `oppDiscardPile` array inspectable at runtime via the `[P]` key).
- Completed: Input Router Semantic Clean Pass (Refactored `setupKeyboardCounterListeners` into a fully integrated `setupKeyboardInteractionController` routing module to resolve code-smell and match its structural role).
- Completed: High-Resolution Aspect Overhaul & Animation Guards (Re-engineered system metrics to support realistic 267 x 370 vertical card geometry sitting at a compact 0.18 table scale. Programmed mouse-stillness debouncers and animation lock guards inside `Card.js` to enable crisp 1.0 inspection zooming that auto-collapses cleanly on motion updates, paired with an overridden `destroy()` method to completely block post-destruction tween and timer lifecycle crashes).
- Completed: UI Scrollable Grid Layer Sandbox (Refactored `DeckBrowser.js` into a sandwich container architecture isolating a static `hudContent` tier from a scrollable `scrollContent` view layer. Added full geometry clipping masks, custom scrollbar thumb tracking, and mouse wheel input hooks to cleanly navigate extensive 60-card deck matrices).
- Completed: Chess Clock State Engine & Plunger Pass (Replaced rigid five-step constraints with a simplified macro system mapping `SETUP`, `MY_TURN`, and `OPPONENT_TURN` states triggered by a tactile, clock-style button listener).
- Completed: Automated Opponent Scripting Service (Encapsulated an automated sequence into `MockNetworkManager.js` that draws 7 cards and plays an active character on setup completion, and handles draw, bench deployment, and stacked energy attachments on regular turns).
- Completed: Tactile Move Recovery Engine (Engineered a positional history array stack inside `TableManager.js` that records state snapshots before drop mutations, allowing players to wind back sandbox misplays instantly via a global `[Z]` hotkey loop).
- Completed: Energy Stacking & Multi-Scenario Undo Fixes (Refactored attachment logic to snap energy cards relative to absolute host anchors rather than unstable fluid coordinates. Patched a critical desync bug by keeping drop zone occupancy flags locked during energy rollbacks, completely fixing consecutive attachment undos).
- Completed: Authoritative 3rd-Entity WebSocket Integration & State Rehydration (Migrated deck management and draw logic to an authoritative Node.js/Socket.io backend server. Engineered an asymmetric data privilege scheme dividing high-privilege draw details from masked low-privilege hidden indicators. Constructed a persistent session rehydration cache using client `sessionStorage` and backend memory grids to perfectly restore hands, boards, and opponent parameters across full browser refreshes).

## THE ROADMAP PLAN

### Next Objective:
- **Tutorial 8: TCG Structural Sandbox Mechanics (Prize Card Vectors & Status Anchors)**
  * Construct a 6-slot face-down **Prize Card zone grid architecture** inside `Playmat.js` alongside a player-driven dealer utility loop.
  * Implement face-down target flight tweens to deal initial prizes from the deck stack array cleanly during setup.
  * Wire pointer down select events on benched prize locations to smoothly glide chosen items right back into hand layout rows.
  * Introduce **Contextual Right-Click Status Rotations** on deployed character pieces to cycle angle properties (`90°` / `180°`) indicating status effects like Asleep or Confused.

### Upcoming Milestones:
- **Tutorial 9: Advanced Table Manipulations & Dynamic Stacking**
  * Implement an unconstrained **Active-to-Bench Position Swap system** that handles moving character cards along with all their attached energy arrays simultaneously.
  * Engineer **Evolutionary Stacking mechanisms** to cleanly drop Stage 1/2 entities flat on top ofBasic frames while inheriting existing damage metrics.
  * Update the authoritative server cache parameters to store card rotation arrays and multi-level stack heights for seamless rehydration.

- **Tutorial 10: Multi-Entity Global History Tracking**
  * Expand the snapshot recording engine inside `TableManager.js` to preserve damage adjustment values and status mutations.
  * Wire the universal `[Z]` hotkey to walk backward through counter alterations alongside structural card moves.
  * Build a floating text layout dashboard component to visually indicate the depth of remaining actions in the undo stack history pipeline.

- **Tutorial 11: Real-Time Omniscient Spectator Routing**
  * Spin up a dedicated high-privilege **Spectator Room connection channel** on the Node.js server.
  * Configure an unmasked data relay pipeline that strips asymmetric data-hiding filters for spectator streams.
  * Design a sidelines camera dashboard overlay in Phaser to display both players' private hands, hidden deck orders, and prize stacks for streaming utility.

## RESOURCES
- https://opengameart.org/content/playing-cards-pack
- https://www.leshylabs.com/apps/sstool/
