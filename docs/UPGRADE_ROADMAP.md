# Open Charms — Comprehensive Upgradation Plan & Product Roadmap 🚀

This roadmap outlines the strategic, feature, and architectural evolution of **Open Charms**, taking it from an animated decorative companion into an open-source browser pet ecosystem.

---

## 🗺️ Roadmap Overview

```
Phase 1: Physics & Sensorial Polish  ──▶  Phase 2: Charm Wardrobe & Accessories
                 │                                        │
                 ▼                                        ▼
Phase 3: Interactive Pets & Minigames──▶  Phase 4: Multi-Charm Party Mode
                 │                                        │
                 ▼                                        ▼
Phase 5: Community Creator Studio   ──▶  Phase 6: Web Store Launch & Ecosystem
```

---

## 💎 Phase 1: Physics & Sensorial Polish *(Completed & In-Progress)*

### 1.1 Dynamic Wavy Chain Motion *(✅ Done!)*
- **Cubic Bezier Spline Dynamics:** The string/chain no longer behaves as a rigid straight stick. It dynamically bows, ripples, and undulates with transverse traveling waves driven by pendulum acceleration and mouse drag.
- **Bead-on-Curve Interpolation:** Every bead on golden and silver chains follows the undulating Bezier path with uniform arc-length sampling.
- **Customizable Wave Slider:** Users can tune wave intensity from `0.0x (Taut/Straight)` to `2.0x (Hyper Fluid)`.

### 1.2 Ambient Environmental Effects
- **Nighttime Glow Mode:** Automatically dims charm brightness and gives the string/charm an ethereal neon bioluminescent glow when browsing after sunset.
- **Dynamic Weather Particles:**
  - 🌸 **Spring:** Tiny drifting sakura blossom petals floating past the hanging charm.
  - 🌧️ **Rainy Day:** Water droplets that occasionally trickle down the string and bounce off the charm.
  - ❄️ **Winter:** Soft snowflakes that gently collect on the charm's head before melting.

---

## 👒 Phase 2: Charm Wardrobe & Accessories System

### 2.1 Modular Headwear & Trinkets
Allow users to equip mix-and-match accessories onto any charm without altering base SVG files:
- **Headwear:** Witch hat, party cone, golden crown, flower sprout, winter beanie, chef hat.
- **Eyewear:** Tiny round nerd glasses, cool sunglasses, star glasses.
- **Neckwear:** Bowties, cozy winter scarves, lucky coin necklaces.

### 2.2 Secondary Dangling Companions
Hang tiny micro-charms from the bottom of the main character:
- Luna clutches a dangling mini gold koi fish.
- Spook hangs a mini jack-o'-lantern lantern.
- Boba Bear dangles a swinging mini tapioca pearl charm.

---

## 🎮 Phase 3: Interactive Pets, Minigames & Productivity

### 3.1 "Feed Your Buddy" Snack Drop
- Click a "Feed" button in the popup or right-click context menu to spawn a floating treat (fish for cat, fly/lily for frog, carrot for bunny, star for ghost, milk tea for bear).
- The charm stretches and lunges toward the cursor to "catch" and eat the snack, accompanied by a happy particle crunch effect!

### 3.2 Friendship & Happiness Meter
- **Mood System:** Charms have subtle emotional states (Happy, Sleepy, Playful, Cozy).
- Interacting (poking, feeding, gentle swings) fills a cute heart meter.
- High friendship unlocks special rare idle animations (e.g. Luna taking a catnap curled on a cloud, Spook briefly turning invisible).

### 3.3 Pomodoro & Study Companion Mode
- Turn your charm into a soothing productivity companion.
- Set a 25-minute focus timer. During focus sessions, the charm sits peacefully in "Study Mode" with tiny glasses and a pencil.
- When focus time ends, the charm rings its bell chime and does a celebration backflip!

---

## 🎈 Phase 4: Multi-Charm Party Mode

### 4.1 Multiple Hanging Charms
- Allow users to hang 2, 3, or up to 5 charms simultaneously along the top edge of the browser.
- Independent anchors with draggable spacing.

### 4.2 Inter-Charm Physics & Interactions
- Soft collision detection between neighboring charms: if they swing into each other, they gently bump and transfer momentum with soft bell clinks.
- Connected bunting/garland option: string fairy lights or bunting flags between two charms.

---

## 🎨 Phase 5: Community Creator Studio & Theme Hub

### 5.1 In-Browser SVG Importer & Studio
- Direct drag-and-drop importer in the popup for custom SVG files.
- Visual anchor-ring calibrator: drag a marker over your custom SVG to designate where the hanging ring connects.
- Live preview before saving into local storage.

### 5.2 Community Charm Packs
- JSON-based Charm Pack distribution format:
  ```json
  {
    "packName": "Retro Pixel Pals",
    "version": "1.0",
    "author": "Community Creator",
    "charms": [ ... ]
  }
  ```
- 1-click import from GitHub repositories or community forums.

---

## 🎵 Phase 6: Expanded Audio Timbre Library

Expand the built-in Web Audio API synthesizer with multiple switchable sound fonts:
1. **Crystal Bell:** Pure sine chime with harmonic overtone (current default).
2. **Music Box:** Soft celesta-like sweet plucks.
3. **8-Bit Retro:** Classic Game Boy / arcade chirp notes.
4. **Water Droplet:** Organic, gentle "bloop" sounds.
5. **Mute / Quiet Mode:** 100% silent for libraries and quiet workspaces.

---

## 🌐 Phase 7: Web Store Publication & Cross-Browser Reach

| Milestone | Target | Description |
| :--- | :--- | :--- |
| **M1: Chrome Web Store** | v1.1 | Official public listing on the Google Chrome Web Store. |
| **M2: Edge Add-ons** | v1.1 | Release in Microsoft Edge Add-ons store with seamless Windows 11 integration. |
| **M3: Firefox Add-ons (AMO)** | v1.2 | Port with WebExtensions polyfill for Firefox browser support. |
| **M4: GitHub Showcase & Docs** | Continuous | Live interactive GitHub Pages demo, contributor badges, and SVG template repository. |

---

## 📊 Suggested Implementation Priorities

1. **Immediate Next Step:** Phase 2 (Modular Headwear & Hats) — highest visual delight with simple SVG overlay positioning.
2. **Follow-up:** Phase 3.1 ("Feed Your Buddy" snack drop minigame) — adds high-engagement interactive play.
3. **Ecosystem:** Phase 5.1 (Custom SVG Importer) — unlocks infinite community creativity.
