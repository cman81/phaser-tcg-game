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

## THE ROADMAP PLAN

### Next Objective:
- **Tutorial 6: UI Systems (Deck Browsing & Card Inspection Modals)**
  * Build a full-screen, semi-transparent modal overlay layer to render layout slots for remaining items in the deck database.
  * Add a scrollable grid viewer allowing players to inspect remaining deck resources during sandbox play.
  * Create a right-click tool context filter to pull discarded components out of the scrap heap back into active arrays.

### Remaining Objectives:
- **Tutorial 7: Real-Time Playmat Synchronicity via WebSockets**

## RESOURCES
- https://opengameart.org/content/playing-cards-pack
- https://www.leshylabs.com/apps/sstool/
