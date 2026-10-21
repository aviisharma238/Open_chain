# Contributing to Open Charms

We welcome contributions from designers, illustrators, and developers to make Open Charms even more delightful!

---

## Adding a New Community Charm

Open Charms is designed to be easily extensible. You do not need complex build tools to add a new charm.

### Step 1: Create Your SVG Artwork
1. Create a clean vector file in `charms/assets/your-charm-name.svg`.
2. Use standard `viewBox="0 0 100 125"`.
3. Include the top hanging loop ring at `(cx=50, cy=8)` with `r=6` to ensure the suspension string connects cleanly.
4. Keep the art playful, kawaii, and expressive with gentle highlights and soft drop shadows.

### Step 2: Register in `charms/charms.js`
Add your charm to the `CHARM_LIST` array:

```javascript
{
  id: 'dino',
  name: 'Rexy',
  title: 'Baby Dino',
  accent: '#10B981',
  bg: '#D1FAE5',
  desc: 'A tiny green dinosaur chewing on a leafy fern.',
  svg: `<svg viewBox="0 0 100 125" ...>...</svg>`
}
```

Or register it dynamically at runtime:

```javascript
window.OpenCharmsRegistry.registerCharm({
  id: 'custom-id',
  name: 'Custom Charm',
  title: 'Special Edition',
  svg: `<svg ...>...</svg>`
});
```

---

## Adding a New String Style

In `charms/charms.js`, add a new entry to `STRING_STYLES`:

```javascript
{
  id: 'starlight-glow',
  name: 'Starlight Glow',
  color: '#38BDF8',
  beadColor: '#BAE6FD',
  shadowColor: 'rgba(56, 189, 248, 0.4)',
  type: 'beaded' // or 'solid' / 'gradient'
}
```

---

## Development & Local Testing
1. Clone the repository.
2. Open `test/test-page.html` in Google Chrome to test without installing.
3. Or load the directory as an unpacked extension via `chrome://extensions`.
4. Run `node -c <file>.js` to check for syntax errors before opening a pull request.
5. Ensure your code follows pure JavaScript standards (no build steps required).
