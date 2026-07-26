# PHASER TCG PLAYMAT COMPANION ROADMAP
# Context: Drupal Developer background (Tactile Sandbox / Companion Architecture)

## CURRENT PROGRESS
- Completed: System environments, decoupled file layouts, atlas texture maps, secure UUID shuffles.
- Completed: Phase 1 (Tutorial 1, 2, & 2.5 - Decoupled Component Architecture, Custom Layout Grids, Hand Spacing layout math engines).
- Completed: Tutorial 2.6 (Drag-and-Drop Card Snapping, Input Listeners, and Target Bound Matching).
- Completed: Tutorial 3 (The Informational State Machine & Soft Warning Guards).
- Completed: Tutorial 4 (Tactile Table Counters & Token Overlays).
- Completed: Structural Architecture Refactor (Extracted core business logic from `game.js` into a dedicated `TableManager` service module, reducing interaction listeners to a lean routing controller).
- Completed: Tutorial 5 (Surface Physics Tweens & Polish - Uniform linear glide paths from the physical deck stack, elastic horizontal rejection shakes, anti-spam token pulses, and drag-distance threshold interaction guards).
- Completed: Tutorial 6 Base (Full-screen Phaser 4 translucent backdrop overlay container rendering dynamic grids of remaining backend database card indices).

## THE ROADMAP PLAN

### Next Objective:
- **Tutorial 6 Polish: Private Knowledge & Search Filters**
  * *Open-Ended Lookups*: Removed strict turn-phase restrictions on the Deck Browser modal, allowing players to peek and resolve private knowledge abilities (like Shaymin's "Send Flowers" energy search) smoothly during opponent execution frames.
  * *Type Filters*: Add conditional filters to the overlay (e.g., highlighting *only* cards reporting `type === 'energy'`) to quickly resolve target searches.
  * *Tabletop Shuffle*: Hook up a button within the overlay to re-execute our Fisher-Yates shuffle routine after closing a manual search.

### Remaining Objectives:
- **Tutorial 7: Real-Time Playmat Synchronicity via WebSockets**

## RESOURCES
- https://opengameart.org/content/playing-cards-pack
- https://www.leshylabs.com/apps/sstool/
