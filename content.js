/**
 * Open Charms — Content Script
 * Injects an isolated, beautiful, interactive hanging charm onto the webpage
 * using Shadow DOM for complete styling and DOM isolation.
 */
(function () {
  'use strict';

  // Prevent duplicate execution
  if (window.__OPEN_CHARMS_INITIALIZED__) {
    if (window.__OPEN_CHARMS_APP__) {
      window.__OPEN_CHARMS_APP__.refresh();
    }
    return;
  }
  window.__OPEN_CHARMS_INITIALIZED__ = true;

  const DEFAULT_SETTINGS = {
    enabled: true,
    selectedCharm: 'cat',
    charmSize: 85,
    stringLength: 130,
    animSpeed: 1.0,
    swingIntensity: 1.0,
    opacity: 100,
    anchorRatio: 0.82,
    stringStyle: 'golden-chain',
    chainWave: 1.0,
    accessory: 'none',
    soundEnabled: false,
    reducedMotion: false
  };

  class OpenCharmsApp {
    constructor() {
      this.settings = Object.assign({}, DEFAULT_SETTINGS);
      this.hostEl = null;
      this.shadow = null;
      this.viewportEl = null;
      this.anchorMountEl = null;
      this.stringSvgEl = null;
      this.stringGlowEl = null;
      this.stringLineEl = null;
      this.beadsGroupEl = null;
      this.charmContainerEl = null;
      this.charmSvgWrapEl = null;

      this.physics = null;
      this.rafId = null;
      this.lastFrameTime = 0;
      this.isDragging = false;
      this.isDraggingPin = false;

      // Scroll inertia tracking
      this.lastScrollY = window.scrollY || window.pageYOffset || 0;
      this.lastScrollTime = performance.now();
      this.lastScrollImpulseTime = 0;

      // Bind methods
      this.onFrame = this.onFrame.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.onPinPointerDown = this.onPinPointerDown.bind(this);
      this.onPinPointerMove = this.onPinPointerMove.bind(this);
      this.onPinPointerUp = this.onPinPointerUp.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onVisibilityChange = this.onVisibilityChange.bind(this);

      this.init();
    }

    async init() {
      // 1. Load settings from storage
      await this.loadSettings();

      // 2. Setup DOM & Shadow DOM
      this.createDOM();

      // 3. Initialize Physics Engine
      this.initPhysics();

      // 4. Apply Initial Settings
      this.applySettings();

      // 5. Attach Window Event Listeners
      this.attachListeners();

      // 6. Start Animation Loop if enabled
      if (this.settings.enabled) {
        this.startLoop();
      }
    }

    async loadSettings() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          const stored = await chrome.storage.local.get('openCharmsSettings');
          if (stored && stored.openCharmsSettings) {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, stored.openCharmsSettings);
          }
        } catch (e) {
          console.warn('[OpenCharms] Could not read storage:', e);
        }
      }
    }

    async saveSettings(updatedSubset) {
      Object.assign(this.settings, updatedSubset);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await chrome.storage.local.set({ openCharmsSettings: this.settings });
        } catch (e) {
          console.warn('[OpenCharms] Could not save storage:', e);
        }
      }
    }

    createDOM() {
      // Remove any existing host element
      const existing = document.getElementById('open-charms-host');
      if (existing) {
        existing.remove();
      }

      // Root custom element
      this.hostEl = document.createElement('open-charms-root');
      this.hostEl.id = 'open-charms-host';
      this.shadow = this.hostEl.attachShadow({ mode: 'open' });

      // Shadow styles
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        :host {
          all: initial;
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 2147483647;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .oc-viewport {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          transition: opacity 0.25s ease;
        }

        .oc-anchor-mount {
          position: absolute;
          top: 0;
          width: 20px;
          height: 9px;
          transform: translateX(-50%);
          pointer-events: auto;
          cursor: ew-resize;
          z-index: 10;
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;
          background: linear-gradient(180deg, #FDE68A 0%, #D97706 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.7);
          transition: filter 0.15s ease;
        }

        .oc-anchor-mount:hover {
          filter: brightness(1.2);
        }

        .oc-anchor-mount::after {
          content: "";
          position: absolute;
          bottom: -3px;
          left: 50%;
          width: 7px;
          height: 7px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .oc-string-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        .oc-charm-container {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: auto;
          cursor: grab;
          will-change: transform;
          touch-action: none;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
          transition: filter 0.2s ease, opacity 0.2s ease;
        }

        .oc-charm-container:active,
        .oc-charm-container.is-dragging {
          cursor: grabbing !important;
          filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.28)) scale(1.03);
        }

        .oc-charm-svg-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: 50% 10px;
        }

        .oc-charm-svg-wrap svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        @keyframes oc-blink {
          0%, 94%, 98%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }

        .oc-cat-eyes,
        .oc-frog-eyes,
        .oc-bunny-eyes,
        .oc-star-eyes,
        .oc-ghost-eyes,
        .oc-bear-eyes,
        .oc-plane-eyes {
          transform-origin: center;
          animation: oc-blink 5.5s infinite ease-in-out;
        }

        /* Plane Propeller Spin Micro-Animation */
        @keyframes oc-propeller-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .oc-plane-propeller {
          transform-origin: 50px 86px;
          animation: oc-propeller-spin 0.22s linear infinite;
        }

        /* Chain Link Styles */
        .oc-chain-link {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
        }

        @keyframes oc-jiggle {
          0% { transform: scale(1); }
          25% { transform: scale(1.15) rotate(-6deg); }
          50% { transform: scale(0.92) rotate(5deg); }
          75% { transform: scale(1.06) rotate(-2deg); }
          100% { transform: scale(1); }
        }

        .oc-charm-container.is-poked .oc-charm-svg-wrap {
          animation: oc-jiggle 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .oc-cat-eyes, .oc-frog-eyes, .oc-bunny-eyes,
          .oc-star-eyes, .oc-ghost-eyes, .oc-bear-eyes,
          .oc-plane-eyes, .oc-plane-propeller {
            animation: none !important;
          }
          .oc-charm-container {
            transition: none !important;
          }
        }

        .oc-snack-item {
          position: absolute;
          pointer-events: auto;
          cursor: pointer;
          z-index: 20;
          transition: transform 0.2s ease, opacity 0.3s ease;
          animation: oc-float 2.2s infinite ease-in-out;
        }

        @keyframes oc-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(6deg); }
        }

        .oc-snack-item:hover {
          transform: scale(1.22);
        }

        .oc-crumb {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          animation: oc-particle 0.65s forwards ease-out;
        }

        @keyframes oc-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }

        .oc-heart-float {
          position: absolute;
          pointer-events: none;
          font-size: 14px;
          font-weight: 700;
          color: #EC4899;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          animation: oc-float-up 1.1s forwards ease-out;
        }

        @keyframes oc-float-up {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          25% { transform: translate(-50%, -15px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -45px) scale(0.9); opacity: 0; }
        }
      `;
      this.shadow.appendChild(styleEl);

      // Viewport wrapper
      this.viewportEl = document.createElement('div');
      this.viewportEl.className = 'oc-viewport';

      // Ceiling anchor pin
      this.anchorMountEl = document.createElement('div');
      this.anchorMountEl.className = 'oc-anchor-mount';
      this.anchorMountEl.title = 'Open Charms — Drag to slide across screen';
      this.viewportEl.appendChild(this.anchorMountEl);

      // SVG String Canvas
      const svgNS = 'http://www.w3.org/2000/svg';
      this.stringSvgEl = document.createElementNS(svgNS, 'svg');
      this.stringSvgEl.setAttribute('class', 'oc-string-canvas');

      // Gradient defs for rainbow thread and metallic chains
      const defs = document.createElementNS(svgNS, 'defs');
      const rainbowGrad = document.createElementNS(svgNS, 'linearGradient');
      rainbowGrad.id = 'oc-rainbow-grad';
      rainbowGrad.setAttribute('x1', '0%');
      rainbowGrad.setAttribute('y1', '0%');
      rainbowGrad.setAttribute('x2', '100%');
      rainbowGrad.setAttribute('y2', '100%');
      rainbowGrad.innerHTML = `
        <stop offset="0%" stop-color="#F43F5E"/>
        <stop offset="35%" stop-color="#F59E0B"/>
        <stop offset="70%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#8B5CF6"/>
      `;
      defs.appendChild(rainbowGrad);

      // Metallic Gold Gradient for Chain Links
      const goldLinkGrad = document.createElementNS(svgNS, 'linearGradient');
      goldLinkGrad.id = 'oc-gold-link-grad';
      goldLinkGrad.setAttribute('x1', '0%');
      goldLinkGrad.setAttribute('y1', '0%');
      goldLinkGrad.setAttribute('x2', '100%');
      goldLinkGrad.setAttribute('y2', '100%');
      goldLinkGrad.innerHTML = `
        <stop offset="0%" stop-color="#FFFBEB"/>
        <stop offset="25%" stop-color="#FDE047"/>
        <stop offset="65%" stop-color="#D97706"/>
        <stop offset="100%" stop-color="#78350F"/>
      `;
      defs.appendChild(goldLinkGrad);

      // Metallic Silver Gradient for Chain Links
      const silverLinkGrad = document.createElementNS(svgNS, 'linearGradient');
      silverLinkGrad.id = 'oc-silver-link-grad';
      silverLinkGrad.setAttribute('x1', '0%');
      silverLinkGrad.setAttribute('y1', '0%');
      silverLinkGrad.setAttribute('x2', '100%');
      silverLinkGrad.setAttribute('y2', '100%');
      silverLinkGrad.innerHTML = `
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="30%" stop-color="#E2E8F0"/>
        <stop offset="70%" stop-color="#94A3B8"/>
        <stop offset="100%" stop-color="#475569"/>
      `;
      defs.appendChild(silverLinkGrad);

      this.stringSvgEl.appendChild(defs);

      // SVG String glow background path (for ribbon styles)
      this.stringGlowEl = document.createElementNS(svgNS, 'path');
      this.stringGlowEl.setAttribute('fill', 'none');
      this.stringGlowEl.setAttribute('stroke-linecap', 'round');
      this.stringGlowEl.setAttribute('opacity', '0.4');
      this.stringSvgEl.appendChild(this.stringGlowEl);

      // SVG String main path
      this.stringLineEl = document.createElementNS(svgNS, 'path');
      this.stringLineEl.setAttribute('fill', 'none');
      this.stringLineEl.setAttribute('stroke-linecap', 'round');
      this.stringSvgEl.appendChild(this.stringLineEl);

      // Beaded chain group for beaded string styles
      this.beadsGroupEl = document.createElementNS(svgNS, 'g');
      this.beadsGroupEl.setAttribute('class', 'oc-beads-group');
      this.stringSvgEl.appendChild(this.beadsGroupEl);

      this.viewportEl.appendChild(this.stringSvgEl);

      // Charm Container
      this.charmContainerEl = document.createElement('div');
      this.charmContainerEl.className = 'oc-charm-container';
      this.charmContainerEl.setAttribute('role', 'button');
      this.charmContainerEl.setAttribute('aria-label', 'Open Charms hanging buddy');

      this.charmSvgWrapEl = document.createElement('div');
      this.charmSvgWrapEl.className = 'oc-charm-svg-wrap';
      this.charmContainerEl.appendChild(this.charmSvgWrapEl);

      this.viewportEl.appendChild(this.charmContainerEl);
      this.shadow.appendChild(this.viewportEl);

      // Insert host element into document body (or documentElement if body not ready)
      const targetParent = document.body || document.documentElement;
      targetParent.appendChild(this.hostEl);
    }

    initPhysics() {
      const Physics = window.OpenCharmsPhysics;
      if (!Physics) {
        console.error('[OpenCharms] Physics engine not loaded');
        return;
      }

      this.physics = Physics.create({
        baseLength: this.settings.stringLength,
        anchorRatio: this.settings.anchorRatio,
        swingIntensity: this.settings.swingIntensity,
        chainWave: this.settings.chainWave !== undefined ? this.settings.chainWave : 1.0,
        animSpeed: this.settings.animSpeed,
        reducedMotion: this.settings.reducedMotion || this.checkPrefersReducedMotion(),
        onAnchorUpdate: (anchorX, anchorRatio) => {
          this.settings.anchorRatio = anchorRatio;
          this.saveSettings({ anchorRatio });
        }
      });
    }

    checkPrefersReducedMotion() {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        return false;
      }
    }

    applySettings() {
      if (!this.viewportEl) return;

      // Enable/Disable visibility
      if (!this.settings.enabled) {
        this.hostEl.style.display = 'none';
        this.stopLoop();
        return;
      } else {
        this.hostEl.style.display = 'block';
        this.startLoop();
      }

      // Opacity
      const alpha = Math.max(0.2, Math.min(1.0, this.settings.opacity / 100));
      this.viewportEl.style.opacity = String(alpha);

      // Charm Size
      const size = this.settings.charmSize;
      const height = (size * 125) / 100; // Aspect ratio of 100:125
      this.charmContainerEl.style.width = `${size}px`;
      this.charmContainerEl.style.height = `${height}px`;

      // Update Charm SVG Graphic
      this.updateCharmGraphic();

      // Update Physics parameters
      if (this.physics) {
        this.physics.setBaseLength(this.settings.stringLength);
        this.physics.setSwingIntensity(this.settings.swingIntensity);
        this.physics.setAnimSpeed(this.settings.animSpeed);
        if (this.settings.chainWave !== undefined) {
          this.physics.setChainWave(this.settings.chainWave);
        }
        this.physics.setReducedMotion(this.settings.reducedMotion || this.checkPrefersReducedMotion());
        if (this.settings.anchorRatio !== undefined) {
          this.physics.setAnchorRatio(this.settings.anchorRatio, false);
        }
      }

      // Update string appearance style
      this.updateStringStyle();
    }

    updateCharmGraphic() {
      const Registry = window.OpenCharmsRegistry;
      if (!Registry) return;

      const charm = Registry.getCharmById(this.settings.selectedCharm);
      if (charm && charm.svg) {
        let finalSvg = charm.svg;
        const accMeta = Registry.getAccessoryById(this.settings.accessory);
        if (accMeta && accMeta.svg) {
          finalSvg = finalSvg.replace('</svg>', `${accMeta.svg}</svg>`);
        }
        this.charmSvgWrapEl.innerHTML = finalSvg;
      }
    }

    updateStringStyle() {
      const Registry = window.OpenCharmsRegistry;
      const styleMeta = Registry ? Registry.getStringStyleById(this.settings.stringStyle) : null;
      this.currentStringMeta = styleMeta || {
        id: 'golden-chain',
        color: '#F59E0B',
        beadColor: '#FCD34D',
        type: 'beaded'
      };

      // Set anchor mount color according to style
      if (this.anchorMountEl) {
        if (this.currentStringMeta.id === 'silver-chain') {
          this.anchorMountEl.style.background = 'linear-gradient(180deg, #F1F5F9 0%, #64748B 100%)';
        } else if (this.currentStringMeta.id === 'pastel-ribbon') {
          this.anchorMountEl.style.background = 'linear-gradient(180deg, #FCE7F3 0%, #EC4899 100%)';
        } else if (this.currentStringMeta.id === 'rainbow-thread') {
          this.anchorMountEl.style.background = 'linear-gradient(180deg, #F43F5E 0%, #8B5CF6 100%)';
        } else {
          this.anchorMountEl.style.background = 'linear-gradient(180deg, #FDE68A 0%, #D97706 100%)';
        }
      }
    }

    attachListeners() {
      // Charm pointer events (Dragging & Poking)
      this.charmContainerEl.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove, { passive: false });
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp);

      // Mount Pin pointer events (Horizontal repositioning)
      this.anchorMountEl.addEventListener('pointerdown', this.onPinPointerDown);
      window.addEventListener('pointermove', this.onPinPointerMove, { passive: false });
      window.addEventListener('pointerup', this.onPinPointerUp);
      window.addEventListener('pointercancel', this.onPinPointerUp);

      // Page scroll reaction
      window.addEventListener('scroll', this.onScroll, { passive: true });

      // Viewport resize
      window.addEventListener('resize', this.onResize);

      // Tab visibility change (sleep RAF when hidden)
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      // Messages from Extension Popup
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (!message || !message.type) return;

          if (message.type === 'OPEN_CHARMS_SETTINGS_UPDATED') {
            Object.assign(this.settings, message.settings);
            this.applySettings();
            sendResponse({ status: 'ok' });
          } else if (message.type === 'OPEN_CHARMS_JIGGLE') {
            this.triggerJiggle();
            sendResponse({ status: 'jiggled' });
          } else if (message.type === 'OPEN_CHARMS_FEED') {
            this.spawnSnack(message.x, message.y);
            sendResponse({ status: 'snack_spawned' });
          } else if (message.type === 'OPEN_CHARMS_RESET_POS') {
            if (this.physics) {
              this.physics.setAnchorRatio(0.82, true);
            }
            sendResponse({ status: 'reset' });
          }
        });
      }

      // Storage changes listener as fallback
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local' && changes.openCharmsSettings) {
            Object.assign(this.settings, changes.openCharmsSettings.newValue);
            this.applySettings();
          }
        });
      }
    }

    spawnSnack(x, y) {
      if (!this.settings.enabled || !this.viewportEl) return;
      const Registry = window.OpenCharmsRegistry;
      if (!Registry) return;

      const snack = Registry.getSnackForCharm(this.settings.selectedCharm);
      if (!snack) return;

      // Position snack near charm
      const state = this.physics ? this.physics.getRenderState() : { charmX: 800, charmY: 150 };
      const snackX = x !== undefined ? x : Math.max(40, state.charmX - 50 + (Math.random() > 0.5 ? 85 : -85));
      const snackY = y !== undefined ? y : Math.max(70, state.charmY + 35 + (Math.random() - 0.5) * 40);

      const snackEl = document.createElement('div');
      snackEl.className = 'oc-snack-item';
      snackEl.style.left = `${snackX}px`;
      snackEl.style.top = `${snackY}px`;
      snackEl.innerHTML = snack.svg;
      snackEl.title = `Click to feed ${snack.name}!`;

      this.viewportEl.appendChild(snackEl);

      // Swing toward snack
      if (this.physics) {
        const dir = snackX > state.charmX ? 1 : -1;
        this.physics.applyImpulse(dir * 3.8);
      }

      // Eaten logic
      let eaten = false;
      const eatSnack = () => {
        if (eaten) return;
        eaten = true;

        this.spawnCrumbs(snackX + 18, snackY + 18);

        const heartEl = document.createElement('div');
        heartEl.className = 'oc-heart-float';
        heartEl.style.left = `${state.charmX}px`;
        heartEl.style.top = `${state.charmY - 20}px`;
        heartEl.textContent = `Yum! ❤️`;
        this.viewportEl.appendChild(heartEl);
        setTimeout(() => heartEl.remove(), 1100);

        if (this.settings.soundEnabled && window.OpenCharmsAudio) {
          window.OpenCharmsAudio.playChime('bell');
        }
        this.onPoke();

        snackEl.style.transform = 'scale(0)';
        snackEl.style.opacity = '0';
        setTimeout(() => snackEl.remove(), 350);
      };

      snackEl.addEventListener('click', eatSnack);
      snackEl.addEventListener('pointerenter', eatSnack);

      // Auto-eat after 2.2s
      setTimeout(() => {
        if (!eaten && snackEl.parentNode) {
          eatSnack();
        }
      }, 2200);
    }

    spawnCrumbs(cx, cy) {
      const colors = ['#F59E0B', '#EC4899', '#10B981', '#FDE047', '#8B5CF6'];
      for (let i = 0; i < 8; i++) {
        const crumb = document.createElement('div');
        crumb.className = 'oc-crumb';
        const r = 2.5 + Math.random() * 2.5;
        crumb.style.width = `${r * 2}px`;
        crumb.style.height = `${r * 2}px`;
        crumb.style.background = colors[i % colors.length];
        crumb.style.left = `${cx}px`;
        crumb.style.top = `${cy}px`;

        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
        const dist = 24 + Math.random() * 24;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        crumb.style.setProperty('--dx', `${dx}px`);
        crumb.style.setProperty('--dy', `${dy}px`);

        this.viewportEl.appendChild(crumb);
        setTimeout(() => crumb.remove(), 700);
      }
    }

    onPointerDown(e) {
      if (e.button !== 0) return; // Left click only
      e.preventDefault();
      e.stopPropagation();

      this.isDragging = true;
      this.charmContainerEl.classList.add('is-dragging');

      if (this.physics) {
        this.physics.startDrag(e.clientX, e.clientY);
      }
    }

    onPointerMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();

      if (this.physics) {
        this.physics.dragMove(e.clientX, e.clientY);
      }
    }

    onPointerUp(e) {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.charmContainerEl.classList.remove('is-dragging');

      if (this.physics) {
        const result = this.physics.endDrag();
        if (result && result.wasClick) {
          this.onPoke();
        }
      }
    }

    onPinPointerDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      this.isDraggingPin = true;
    }

    onPinPointerMove(e) {
      if (!this.isDraggingPin || !this.physics) return;
      e.preventDefault();

      const vw = window.innerWidth;
      const ratio = e.clientX / vw;
      this.physics.setAnchorRatio(ratio, true);
    }

    onPinPointerUp(e) {
      if (!this.isDraggingPin) return;
      this.isDraggingPin = false;
    }

    onPoke() {
      // Play Audio Chime if enabled
      if (this.settings.soundEnabled && window.OpenCharmsAudio) {
        window.OpenCharmsAudio.playChime('bell');
      }

      // Trigger happy wiggle class
      this.charmContainerEl.classList.remove('is-poked');
      // Force reflow
      void this.charmContainerEl.offsetWidth;
      this.charmContainerEl.classList.add('is-poked');
      setTimeout(() => {
        if (this.charmContainerEl) {
          this.charmContainerEl.classList.remove('is-poked');
        }
      }, 500);
    }

    triggerJiggle() {
      if (this.physics) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        this.physics.applyImpulse(dir * 5.5);
      }
      this.onPoke();
    }

    onScroll() {
      if (!this.settings.enabled || !this.physics || this.settings.reducedMotion) return;

      const now = performance.now();
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const deltaY = currentScrollY - this.lastScrollY;
      const dt = Math.max(10, now - this.lastScrollTime);

      this.lastScrollY = currentScrollY;
      this.lastScrollTime = now;

      // Enforce an 80ms refractory cooldown so rapid wheel ticks (60-120/sec) don't stack up harshly
      if (now - this.lastScrollImpulseTime < 80) return;

      if (Math.abs(deltaY) > 3) {
        this.lastScrollImpulseTime = now;
        // Directional scroll impulse: scrolling down sways gently forward, scrolling up gently backward
        const scrollSpeed = deltaY / dt;
        // Clamp strictly to a subtle, pleasant sway range (-0.22 to 0.22)
        const impulse = Math.max(-0.22, Math.min(0.22, scrollSpeed * 0.06));
        this.physics.applyScrollSway(impulse);
      }
    }

    onResize() {
      if (this.physics) {
        this.physics.handleResize();
      }
    }

    onVisibilityChange() {
      if (document.hidden) {
        this.stopLoop();
      } else if (this.settings.enabled) {
        this.startLoop();
      }
    }

    startLoop() {
      if (this.rafId) return;
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame(this.onFrame);
    }

    stopLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    onFrame(now) {
      if (!this.settings.enabled) {
        this.stopLoop();
        return;
      }

      const dt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;

      if (this.physics) {
        this.physics.update(dt);
        this.renderState(this.physics.getRenderState());
      }

      this.rafId = requestAnimationFrame(this.onFrame);
    }

    renderState(state) {
      const charmWidth = this.settings.charmSize;
      const charmHeight = (charmWidth * 125) / 100;
      // Top ring of charm is at (cx=50, cy=8) in 100x125 viewBox -> cy ratio = 8/125
      const ringOffsetY = (charmHeight * 8) / 125;

      // Position top anchor pin
      this.anchorMountEl.style.left = `${state.anchorX}px`;

      // Position and rotate charm character
      const left = state.charmX - charmWidth / 2;
      const top = state.charmY - ringOffsetY;
      this.charmContainerEl.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${state.tiltDeg}deg)`;

      // Render wavy string / chain
      this.renderString(state);
    }

    renderString(state) {
      const { anchorX, anchorY, charmX, charmY, p1x, p1y, p2x, p2y } = state;
      const styleMeta = this.currentStringMeta || { type: 'proper-chain', color: '#F59E0B', beadColor: '#FCD34D' };

      // Cubic Bezier wave path string
      const pathData = `M ${anchorX} ${anchorY} C ${p1x.toFixed(1)} ${p1y.toFixed(1)}, ${p2x.toFixed(1)} ${p2y.toFixed(1)}, ${charmX.toFixed(1)} ${charmY.toFixed(1)}`;

      if (styleMeta.type === 'proper-chain') {
        // Realistic Interlocking Metallic Chain Links
        // Draw very subtle metallic guide thread beneath
        this.stringLineEl.setAttribute('d', pathData);
        this.stringLineEl.setAttribute('stroke', styleMeta.color);
        this.stringLineEl.setAttribute('stroke-width', '0.6');
        this.stringLineEl.setAttribute('opacity', '0.35');
        this.stringLineEl.removeAttribute('stroke-dasharray');
        this.stringGlowEl.style.display = 'none';

        const dx = charmX - anchorX;
        const dy = charmY - anchorY;
        const dist = Math.hypot(dx, dy);

        // Pitch between consecutive interlocking links
        const linkPitch = 7.0; // px
        const count = Math.max(2, Math.floor(dist / linkPitch));

        const isSilver = styleMeta.id === 'silver-chain';
        const metalGrad = isSilver ? 'url(#oc-silver-link-grad)' : 'url(#oc-gold-link-grad)';
        const specColor = isSilver ? '#FFFFFF' : '#FEF08A';
        const shadowStroke = isSilver ? '#475569' : '#78350F';

        let chainHtml = '';
        for (let i = 1; i <= count; i++) {
          const t = i / (count + 1);
          const omt = 1 - t;

          // Cubic Bezier position: B(t)
          const bx = (omt ** 3) * anchorX + 3 * (omt ** 2) * t * p1x + 3 * omt * (t ** 2) * p2x + (t ** 3) * charmX;
          const by = (omt ** 3) * anchorY + 3 * (omt ** 2) * t * p1y + 3 * omt * (t ** 2) * p2y + (t ** 3) * charmY;

          // Cubic Bezier derivative tangent vector: B'(t)
          const tx = 3 * (omt ** 2) * (p1x - anchorX) + 6 * omt * t * (p2x - p1x) + 3 * (t ** 2) * (charmX - p2x);
          const ty = 3 * (omt ** 2) * (p1y - anchorY) + 6 * omt * t * (p2y - p1y) + 3 * (t ** 2) * (charmY - p2y);

          // Tangent angle in degrees (-90 to align vertical links with curve)
          const angleDeg = (Math.atan2(ty, tx) * (180 / Math.PI)) - 90;

          if (i % 2 === 0) {
            // Face-on Open Link (Hollow center allows background to show through)
            chainHtml += `
              <g transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)}) rotate(${angleDeg.toFixed(1)})" class="oc-chain-link">
                <rect x="-2.7" y="-5.2" width="5.4" height="10.4" rx="2.7" fill="none" stroke="${metalGrad}" stroke-width="1.6"/>
                <path d="M -1.6 -4.2 C -1.6 -4.8, 1.6 -4.8, 1.6 -4.2" stroke="${specColor}" stroke-width="0.7" fill="none" opacity="0.85"/>
              </g>
            `;
          } else {
            // Edge-on Connecting Link (Turned 90deg, threading through the adjacent open links)
            chainHtml += `
              <g transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)}) rotate(${angleDeg.toFixed(1)})" class="oc-chain-link">
                <rect x="-1.2" y="-4.6" width="2.4" height="9.2" rx="1.2" fill="${metalGrad}" stroke="${shadowStroke}" stroke-width="0.5"/>
                <line x1="0" y1="-3.2" x2="0" y2="3.2" stroke="${specColor}" stroke-width="0.6" opacity="0.85"/>
              </g>
            `;
          }
        }
        this.beadsGroupEl.innerHTML = chainHtml;
      } else if (styleMeta.type === 'beaded') {
        // Delicate beaded cord with pearl / crystal beads
        this.stringLineEl.setAttribute('d', pathData);
        this.stringLineEl.setAttribute('stroke', styleMeta.color);
        this.stringLineEl.setAttribute('stroke-width', '1.0');
        this.stringLineEl.setAttribute('stroke-dasharray', '2 4');
        this.stringGlowEl.style.display = 'none';

        const dx = charmX - anchorX;
        const dy = charmY - anchorY;
        const dist = Math.hypot(dx, dy);
        const beadSpacing = 8.5;
        const count = Math.max(0, Math.floor(dist / beadSpacing));

        let beadsHtml = '';
        for (let i = 1; i <= count; i++) {
          const t = i / (count + 1);
          const omt = 1 - t;
          const bx = (omt ** 3) * anchorX + 3 * (omt ** 2) * t * p1x + 3 * omt * (t ** 2) * p2x + (t ** 3) * charmX;
          const by = (omt ** 3) * anchorY + 3 * (omt ** 2) * t * p1y + 3 * omt * (t ** 2) * p2y + (t ** 3) * charmY;
          const r = i % 2 === 0 ? 2.2 : 1.6;
          const fill = i % 2 === 0 ? styleMeta.beadColor : styleMeta.color;
          beadsHtml += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r}" fill="${fill}" class="oc-chain-link" />`;
        }
        this.beadsGroupEl.innerHTML = beadsHtml;
      } else {
        // Ribbon / Gradient / Solid cord follows wavy Bezier path
        this.beadsGroupEl.innerHTML = '';
        this.stringGlowEl.style.display = 'block';

        const strokeColor = styleMeta.id === 'rainbow-thread' ? 'url(#oc-rainbow-grad)' : styleMeta.color;

        // Subtle shadow/glow under ribbon
        this.stringGlowEl.setAttribute('d', pathData);
        this.stringGlowEl.setAttribute('stroke', styleMeta.shadowColor || 'rgba(0,0,0,0.2)');
        this.stringGlowEl.setAttribute('stroke-width', '3.5');

        // Main ribbon line
        this.stringLineEl.setAttribute('d', pathData);
        this.stringLineEl.setAttribute('stroke', strokeColor);
        this.stringLineEl.setAttribute('stroke-width', '2.2');
        this.stringLineEl.removeAttribute('stroke-dasharray');
      }
    }

    refresh() {
      this.loadSettings().then(() => this.applySettings());
    }

    destroy() {
      this.stopLoop();
      if (this.hostEl) {
        this.hostEl.remove();
      }
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      window.__OPEN_CHARMS_INITIALIZED__ = false;
    }
  }

  // Start app when DOM is ready
  function start() {
    window.__OPEN_CHARMS_APP__ = new OpenCharmsApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
