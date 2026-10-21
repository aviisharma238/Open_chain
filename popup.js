/**
 * Open Charms — Extension Popup Controller
 * Manages user preferences, previews, real-time tab synchronization,
 * and status messaging.
 */
(function () {
  'use strict';

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

  let currentSettings = Object.assign({}, DEFAULT_SETTINGS);
  let activeTabId = null;

  // DOM Elements
  const masterToggle = document.getElementById('masterToggle');
  const tabStatusBanner = document.getElementById('tabStatusBanner');
  const tabStatusText = document.getElementById('tabStatusText');
  const charmGrid = document.getElementById('charmGrid');
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeVal = document.getElementById('sizeVal');
  const lengthSlider = document.getElementById('lengthSlider');
  const lengthVal = document.getElementById('lengthVal');
  const swingSlider = document.getElementById('swingSlider');
  const swingVal = document.getElementById('swingVal');
  const waveSlider = document.getElementById('waveSlider');
  const waveVal = document.getElementById('waveVal');
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityVal = document.getElementById('opacityVal');
  const stringStyleSelect = document.getElementById('stringStyleSelect');
  const accessorySelect = document.getElementById('accessorySelect');
  const soundToggle = document.getElementById('soundToggle');
  const motionToggle = document.getElementById('motionToggle');
  const feedBtn = document.getElementById('feedBtn');
  const jiggleBtn = document.getElementById('jiggleBtn');
  const resetPosBtn = document.getElementById('resetPosBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');

  async function init() {
    buildCharmGrid();
    await checkActiveTab();
    await loadSettings();
    attachListeners();
  }

  function buildCharmGrid() {
    charmGrid.innerHTML = '';
    const registry = window.OpenCharmsRegistry;
    if (!registry) return;

    const charms = registry.getAllCharms();
    charms.forEach((charm) => {
      const card = document.createElement('div');
      card.className = `charm-card ${charm.id === currentSettings.selectedCharm ? 'selected' : ''}`;
      card.dataset.charmId = charm.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.title = `${charm.name} — ${charm.desc}`;

      card.innerHTML = `
        <div class="charm-preview-wrap">
          ${charm.svg}
        </div>
        <span class="charm-name">${charm.name}</span>
        <span class="charm-tagline">${charm.title}</span>
        <div class="charm-check-badge">&#10003;</div>
      `;

      card.addEventListener('click', () => selectCharm(charm.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCharm(charm.id);
        }
      });

      charmGrid.appendChild(card);
    });
  }

  async function checkActiveTab() {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        activeTabId = tabs[0].id;
        const url = tabs[0].url || '';

        // Check if tab is restricted
        const isRestricted = (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('edge://') ||
          url.startsWith('about:') ||
          url.includes('chrome.google.com/webstore') ||
          url.includes('chromewebstore.google.com')
        );

        if (isRestricted) {
          tabStatusBanner.className = 'status-banner restricted';
          tabStatusText.textContent = 'Charms sleep on browser system pages';
        } else if (!currentSettings.enabled) {
          tabStatusBanner.className = 'status-banner disabled';
          tabStatusText.textContent = 'Charms currently paused';
        } else {
          tabStatusBanner.className = 'status-banner active';
          tabStatusText.textContent = 'Active on this page';
        }
      }
    } catch (e) {
      console.warn('[OpenCharms] Could not inspect active tab:', e);
    }
  }

  async function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const data = await chrome.storage.local.get('openCharmsSettings');
        if (data && data.openCharmsSettings) {
          currentSettings = Object.assign({}, DEFAULT_SETTINGS, data.openCharmsSettings);
        }
      } catch (e) {
        console.warn('[OpenCharms] Failed to read storage:', e);
      }
    }

    applySettingsToUI();
  }

  function applySettingsToUI() {
    masterToggle.checked = !!currentSettings.enabled;

    sizeSlider.value = currentSettings.charmSize;
    sizeVal.textContent = `${currentSettings.charmSize}px`;

    lengthSlider.value = currentSettings.stringLength;
    lengthVal.textContent = `${currentSettings.stringLength}px`;

    swingSlider.value = currentSettings.swingIntensity;
    swingVal.textContent = `${Number(currentSettings.swingIntensity).toFixed(1)}x`;

    const waveSetting = currentSettings.chainWave !== undefined ? currentSettings.chainWave : 1.0;
    waveSlider.value = waveSetting;
    waveVal.textContent = `${Number(waveSetting).toFixed(1)}x`;

    opacitySlider.value = currentSettings.opacity;
    opacityVal.textContent = `${currentSettings.opacity}%`;

    stringStyleSelect.value = currentSettings.stringStyle || 'golden-chain';
    accessorySelect.value = currentSettings.accessory || 'none';
    soundToggle.checked = !!currentSettings.soundEnabled;
    motionToggle.checked = !!currentSettings.reducedMotion;

    // Highlight selected card
    const cards = charmGrid.querySelectorAll('.charm-card');
    cards.forEach((card) => {
      if (card.dataset.charmId === currentSettings.selectedCharm) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    updateBannerState();
  }

  function updateBannerState() {
    if (tabStatusBanner.classList.contains('restricted')) return;

    if (!currentSettings.enabled) {
      tabStatusBanner.className = 'status-banner disabled';
      tabStatusText.textContent = 'Charms currently paused';
    } else {
      tabStatusBanner.className = 'status-banner active';
      tabStatusText.textContent = 'Active on this page';
    }
  }

  async function saveAndSync(updates) {
    Object.assign(currentSettings, updates);
    updateBannerState();

    // 1. Save in storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ openCharmsSettings: currentSettings });
      } catch (e) {
        console.warn('[OpenCharms] Storage write error:', e);
      }
    }

    // 2. Broadcast to active tab
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        chrome.tabs.sendMessage(activeTabId, {
          type: 'OPEN_CHARMS_SETTINGS_UPDATED',
          settings: currentSettings
        }, () => {
          // Ignore connection errors if tab doesn't have content script
          if (chrome.runtime.lastError) {
            // expected on restricted pages
          }
        });
      } catch (e) {
        // Tab closed or unavailable
      }
    }
  }

  function selectCharm(charmId) {
    if (currentSettings.selectedCharm === charmId) return;

    const cards = charmGrid.querySelectorAll('.charm-card');
    cards.forEach((c) => {
      c.classList.toggle('selected', c.dataset.charmId === charmId);
    });

    // Play subtle preview chime if sound enabled
    if (currentSettings.soundEnabled && window.OpenCharmsAudio) {
      window.OpenCharmsAudio.playChime('bell');
    }

    saveAndSync({ selectedCharm: charmId });
  }

  function attachListeners() {
    // Master Toggle
    masterToggle.addEventListener('change', (e) => {
      saveAndSync({ enabled: e.target.checked });
    });

    // Size Slider
    sizeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      sizeVal.textContent = `${val}px`;
      saveAndSync({ charmSize: val });
    });

    // Length Slider
    lengthSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      lengthVal.textContent = `${val}px`;
      saveAndSync({ stringLength: val });
    });

    // Swing Slider
    swingSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      swingVal.textContent = `${val.toFixed(1)}x`;
      saveAndSync({ swingIntensity: val });
    });

    // Chain Wave Slider
    waveSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      waveVal.textContent = `${val.toFixed(1)}x`;
      saveAndSync({ chainWave: val });
    });

    // Opacity Slider
    opacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      opacityVal.textContent = `${val}%`;
      saveAndSync({ opacity: val });
    });

    // String Style Select
    stringStyleSelect.addEventListener('change', (e) => {
      saveAndSync({ stringStyle: e.target.value });
    });

    // Accessory Select
    accessorySelect.addEventListener('change', (e) => {
      saveAndSync({ accessory: e.target.value });
    });

    // Sound Toggle
    soundToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      if (enabled && window.OpenCharmsAudio) {
        window.OpenCharmsAudio.playChime('bell');
      }
      saveAndSync({ soundEnabled: enabled });
    });

    // Reduced Motion Toggle
    motionToggle.addEventListener('change', (e) => {
      saveAndSync({ reducedMotion: e.target.checked });
    });

    // Feed Button
    feedBtn.addEventListener('click', () => {
      if (currentSettings.soundEnabled && window.OpenCharmsAudio) {
        window.OpenCharmsAudio.playChime('bell');
      }

      if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.sendMessage(activeTabId, { type: 'OPEN_CHARMS_FEED' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
    });

    // Jiggle Button
    jiggleBtn.addEventListener('click', () => {
      if (currentSettings.soundEnabled && window.OpenCharmsAudio) {
        window.OpenCharmsAudio.playChime('bell');
      }

      if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.sendMessage(activeTabId, { type: 'OPEN_CHARMS_JIGGLE' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
    });

    // Reset Position Button
    resetPosBtn.addEventListener('click', () => {
      saveAndSync({ anchorRatio: 0.82 });
      if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.sendMessage(activeTabId, { type: 'OPEN_CHARMS_RESET_POS' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
    });

    // Reset All Settings
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Reset all Open Charms settings to their default values?')) {
        currentSettings = Object.assign({}, DEFAULT_SETTINGS);
        applySettingsToUI();
        saveAndSync(currentSettings);
      }
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
