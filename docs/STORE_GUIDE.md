# Chrome Web Store Submission & Preparation Guide

This document prepares **Open Charms** for publication on the Google Chrome Web Store in compliance with Manifest V3 policies.

---

## 1. Store Listing Metadata

| Field | Content |
| :--- | :--- |
| **Extension Title** | Open Charms — Cute Hanging Screen Charms |
| **Short Summary (132 chars max)** | Decorate web pages with adorable hanging companions, playful physics, and customizable swinging charms. |
| **Category** | Fun / Lifestyle / Productivity |
| **Language** | English |
| **Price** | Free (Open-Source) |

---

## 2. Store Description (Markdown / Formatted)

```text
✨ Decorate your browser with adorable swinging charms and kawaii companions!

Open Charms is an independent, 100% open-source Chrome extension that hangs cute animated characters from the ceiling of your browser window. Every charm responds naturally to your movements with realistic pendulum physics, inertia, damping, and an ambient natural breeze!

🐾 MEET THE CHARMS:
• Luna — The lucky calico cat with a jingling golden bell
• Ribbit — The cheerful pond prince frog with a tiny crown
• Mochi — The marshmallow fluffy bunny holding a fresh carrot
• Twinkle — The warm cosmic star with dangling crystal tears
• Spook — The friendly lavender ghost holding starlight candy
• Boba Bear — The sweet teddy bear sipping cold iced milk tea

💫 CORE FEATURES:
• Realistic Pendulum Physics: Pull, drag, and fling your charms with realistic inertia.
• Reposition Anywhere: Slide your charm horizontally across the top of your screen.
• Non-Intrusive Isolation: Built using Shadow DOM so it never interferes with links, text selection, or scrolling.
• Page Scroll Reactive: Scrolling kicks the pendulum with inertia.
• Highly Customizable: Tweak size (45px–140px), string length, swing intensity, and opacity.
• Variety of Strings: Golden chain, silver chain, pastel ribbon, rainbow thread, or midnight cord.
• Gentle Chime Sounds: Optional Web Audio pentatonic chime notes when poked.
• Accessibility Ready: Honors system "prefers-reduced-motion" settings automatically.
• Privacy Respecting: Zero remote code, zero tracking, zero personal data collection.

Open Charms is open-source under the MIT License.
Contribute and view the code at: https://github.com/open-charms/open-charms
```

---

## 3. Permissions Justification (For Chrome Reviewers)

| Permission | Technical Need | Reviewer Explanation |
| :--- | :--- | :--- |
| `storage` | Save user settings locally | Used exclusively via `chrome.storage.local` to remember user preferences (selected charm, size, string length, opacity, anchor position). No data ever leaves the local device. |
| `activeTab` | Synchronize settings in real time | Used when the user opens the extension popup to check tab URL restriction status and send updated physics/size settings to the active tab without page reloads. |

> **Single Purpose Compliance:**
> Open Charms has a single, well-defined purpose: to render interactive decorative hanging charms on ordinary web pages for visual delight and entertainment.

---

## 4. Privacy Practices & Data Disclosures

Under the Chrome Web Store Developer Agreement:
- **No data collection:** Open Charms does NOT collect, transmit, or sell user data, personal info, authentication credentials, or browsing history.
- **No remote code:** All JavaScript, CSS, and SVG vector assets are strictly bundled locally in the extension package (no `eval`, no external CDNs, no remote fetches).
- **Restricted Pages:** Content scripts are strictly scoped to `http://*/*` and `https://*/*`. Browser internal pages (`chrome://`, `edge://`, Web Store) are automatically excluded.

---

## 5. Required Graphic Assets

| Asset Type | Dimension | Description |
| :--- | :--- | :--- |
| **Small Tile Icon** | 128 x 128 px | Provided in `icons/icon128.png` |
| **Screenshot 1** | 1280 x 800 px | Hero view: Charm hanging on a typical web page while scrolling. |
| **Screenshot 2** | 1280 x 800 px | Extension popup open showing charm selection grid and sliders. |
| **Screenshot 3** | 1280 x 800 px | Physics demonstration showing drag-and-release swinging inertia. |
| **Small Promo Tile** | 440 x 280 px | Optional banner tile for search results. |
| **Marquee Promo Tile**| 1400 x 560 px | Optional featured marquee artwork. |

---

## 6. How to Package the Distributable ZIP

To build the submission ZIP archive on Windows (via PowerShell):

```powershell
# Navigate to the project root
cd "C:\Users\ayush sharma\projects\project and portfoliyo work\Extensions_mini_game"

# Create a clean release zip
Compress-Archive -Path `
  manifest.json, `
  popup.html, popup.css, popup.js, `
  content.js, content.css, `
  charms, `
  engine, `
  icons, `
  README.md, LICENSE `
  -DestinationPath "open-charms-v1.0.0.zip" -Force
```

Upload `open-charms-v1.0.0.zip` directly to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
