# Open Charms 🎀✨

> **Decorate your web browser with adorable hanging companions, smooth swinging physics, and customizable charms!**  
> An independent, 100% open-source Chrome Extension inspired by the concept of Screen Charms. Built with pure vanilla JavaScript, Chrome Extension Manifest V3, and isolated Shadow DOM.

---

## 🌟 Overview

**Open Charms** brings personality and joy to your browsing experience. A cute charm dangles from the top of your browser window, connected by a stylish chain or ribbon. It swings with realistic pendulum physics as you scroll, reacts to mouse dragging with natural inertia, breathes with an ambient breeze, and plays gentle chimes when tapped.

---

## 🐾 Included Original Charms

All characters are 100% original, handcrafted vector SVG illustrations with scalable crispness and layered depth:

| Charm | Name | Description | Key Accessories |
| :---: | :---: | :--- | :--- |
| 🐱 | **Luna** | Lucky Calico Cat | Red braided collar, dangling golden bell, calico patches |
| 🐸 | **Ribbit** | Pond Prince Frog | Royal gold crown, rosy blush cheeks, dangling webbed feet |
| 🐰 | **Mochi** | Fluffy Starry Bunny | Floppy ears, anime starry eyes, mini garden carrot |
| ⭐ | **Twinkle** | Cosmic Star | Soft rounded star, warm aura, dangling crystal teardrops |
| 👻 | **Spook** | Cozy Little Ghost | Lavender phantom silhouette, pleated hem, starlight candy |
| 🐻 | **Boba Bear** | Sweet Milk Tea Bear | Teddy bear muzzle, iced boba milk tea with tapioca pearls |
| ✈️ | **Aero** | Sky Cadet Airplane | Aviator goggles, spinning propeller, wing star decals, cloud treat |

---

## ✨ Core Features

### 1. 🪢 Realistic Pendulum, Interlocking Chain & Wavy Physics
- **Proper Interlocking Chains:** Golden and silver chains feature authentic interlocking metallic links with tangent angle rotation following cubic Bezier curves and hollow center cutouts.
- **Dynamic Wavy Motion:** Strings and chains bend and ripple with real-time transverse wave dynamics (cubic Bezier splines) as they swing or get dragged.
- **Calm, Damped Scroll Reaction:** Smooth page scrolling exerts natural, organic sway without harsh or violent flinging.
- **Smooth Inertia & Damping:** Accurately simulates gravity, air resistance, and angular acceleration.
- **Drag & Fling:** Grab any charm with your mouse, stretch it with spring elasticity, and release it with dynamic tangential velocity transfer.
- **Horizontal Repositioning:** Drag the charm or grab the top ceiling mount pin to slide your companion across the width of your screen. Position persists across reloads!
- **Ambient Harmonic Breeze:** Gentle subtle sway when idle makes the character feel alive.

### 2. 🛡️ Isolated Shadow DOM Architecture
- Renders inside an isolated `#open-charms-host` with an internal **Shadow DOM**.
- **Zero Style Pollution:** Webpage CSS cannot break charm visuals, and charm styles never leak into webpages.
- **Non-Blocking UX:** Uses `pointer-events: none` on the container and `pointer-events: auto` exclusively on the charm hitbox. Text selection, form inputs, buttons, and scrolling on the webpage remain 100% unaffected.

### 3. 🎨 Modern Dark / Glassmorphic Popup UI
- **Master Switch:** Instantly enable or pause charms across all open tabs.
- **Visual Charm Grid:** 3-column card selector with live SVG previews and active badges.
- **Fine-Tuned Sliders:**
  - **Charm Size:** Scale from subtle companion (45px) to prominent buddy (140px).
  - **String Length:** Adjust hanging height from 60px to 260px.
  - **Swing Motion:** Adjust physics intensity from gentle calm (0.3x) to wild swing (2.0x).
  - **Chain Wavy Motion:** Adjust string fluidity from taut/straight (0.0x) to fluid ripple (2.0x).
  - **Opacity:** Adjust transparency from 30% to 100%.
- **String Styles:** Choose between Golden Chain, Silver Chain, Pastel Ribbon, Rainbow Thread, and Midnight Cord.
- **Synthesized Bell Chimes:** Optional gentle pentatonic music-box chimes on tap using the Web Audio API (zero audio files needed).
- **Accessibility:** Respects OS `prefers-reduced-motion` settings automatically or via manual toggle.
- **Live Tab Status:** Displays an active indicator on standard web pages or an informative sleep badge on restricted browser pages (`chrome://`, webstore).

### 4. 🔒 Privacy & Safety by Design
- **Manifest V3:** Built to the latest Chrome extension standards.
- **Minimum Permissions:** Only requests `storage` and `activeTab`.
- **Zero External Calls:** 100% locally bundled assets. No analytics, tracking scripts, cookies, or external requests.
- **Restricted Pages Handled Gracefully:** Content scripts are strictly scoped to `http://*/*` and `https://*/*`.

---

## 🚀 Quick Start: Installation in Google Chrome (Windows 11)

Follow these simple steps to run Open Charms locally on Windows 11:

### Step 1: Open Chrome Extensions
1. Launch **Google Chrome**.
2. Type `chrome://extensions` in the address bar and press **Enter**.

### Step 2: Enable Developer Mode
1. In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### Step 3: Load the Unpacked Extension
1. Click the **Load unpacked** button in the top-left menu.
2. In the folder picker window, select this project folder:
   ```text
   C:\Users\ayush sharma\projects\project and portfoliyo work\Extensions_mini_game
   ```
3. Click **Select Folder**.

### Step 4: Pin and Enjoy!
1. Click the puzzle icon (🧩) in the Chrome toolbar.
2. Click the pin icon next to **Open Charms — Cute Hanging Screen Charms**.
3. Open any website (e.g. `https://en.wikipedia.org` or `https://github.com`) or test locally using our built-in test suite!

---

## 🧪 Interactive Standalone Test Suite

You can also test the entire physics engine, dragging interactions, audio chimes, and popup preview **without installing the extension**:

1. Open `test/test-page.html` in Google Chrome (or run `python -m http.server 8080` and visit `http://localhost:8080/test/test-page.html`).
2. Use the interactive controls to test:
   - Dragging, releasing, and poking the charm.
   - Page scroll inertia on the tall test page.
   - Instant companion switching and string styling.
   - The embedded extension popup preview simulator.

---

## 📁 Project Architecture

```text
Extensions_mini_game/
├── manifest.json              # Chrome Extension Manifest V3
├── popup.html                 # Extension popup structure
├── popup.css                  # Dark glassmorphic modern UI styles
├── popup.js                   # Popup controller & chrome.storage synchronization
├── content.js                 # Content script injecting isolated Shadow DOM charm
├── content.css                # Shadow DOM styles & micro-animations
├── engine/
│   ├── physics.js             # Damped pendulum physics, inertia, and elastic dragging
│   └── audio.js               # Web Audio API pentatonic bell chime generator
├── charms/
│   ├── charms.js              # Central charm registry & metadata
│   └── assets/                # Standalone handcrafted vector SVGs
│       ├── cat.svg            # Luna the Lucky Cat
│       ├── frog.svg           # Ribbit the Pond Prince
│       ├── bunny.svg          # Mochi the Fluffy Bunny
│       ├── star.svg           # Twinkle the Cosmic Star
│       ├── ghost.svg          # Spook the Cozy Ghost
│       └── boba.svg           # Boba Bear with milk tea cup
├── icons/
│   ├── generate_icons.py      # Pillow script to render crisp extension icons
│   ├── icon16.png             # 16x16 toolbar icon
│   ├── icon32.png             # 32x32 browser icon
│   ├── icon48.png             # 48x48 extensions manager icon
│   └── icon128.png            # 128x128 Chrome Web Store icon
├── test/
│   └── test-page.html         # Interactive standalone test harness & demo
├── docs/
│   ├── STORE_GUIDE.md         # Chrome Web Store submission & packaging guide
│   └── CONTRIBUTING.md        # Guide to creating new community charms
├── README.md                  # Complete project documentation
├── LICENSE                    # MIT License
└── .gitignore                 # Clean Git ignore file
```

---

## 🛠️ Adding New Charms

Open Charms is designed so anyone can contribute new characters:

1. Create a `100x125` vector SVG with the top loop ring at `cx=50, cy=8`.
2. Save it in `charms/assets/your-character.svg`.
3. Register it in `charms/charms.js` via `CHARM_LIST` or `OpenCharmsRegistry.registerCharm()`.
4. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full instructions and examples.

---

## 📦 Building for Chrome Web Store

See [docs/STORE_GUIDE.md](docs/STORE_GUIDE.md) for full submission metadata, permission justifications, privacy declarations, and the PowerShell script to generate the distributable `.zip` bundle.

---

## 🗺️ Product Roadmap & Upgradation Plan

Explore our multi-phase development roadmap in **[docs/UPGRADE_ROADMAP.md](docs/UPGRADE_ROADMAP.md)**:
- Modular Charm Wardrobe & Accessories (hats, scarves, glasses)
- Interactive "Feed Your Buddy" snack-drop minigame
- Multi-Charm Party Mode (hang multiple charms simultaneously)
- In-browser Community Creator Studio & custom SVG pack installer
- Environmental weather effects (rain trickles, sakura petals, night glow)

---

## 📄 License

Open Charms is licensed under the **[MIT License](LICENSE)**. Free and open source for everyone!
