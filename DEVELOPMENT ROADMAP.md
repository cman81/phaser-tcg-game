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

## THE ROADMAP PLAN

### Next Objective:
- **Tutorial 6.5: Direct Table Interactions**
  * Hook up interactive mouse-click area triggers right on the physical `Playmat.js` deck/discard slot geometries to open overlay browsers instead of relying exclusively on keyboard hotkeys.
  * Implement recovery mechanics allowing players to actively pull chosen components out of the public discard viewing grid straight back into hand tracking logic vectors.

## RESOURCES
- https://opengameart.org/content/playing-cards-pack
- https://www.leshylabs.com/apps/sstool/
