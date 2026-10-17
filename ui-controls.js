class UIControls {
  constructor(scene) {
    this.scene = scene;
    
    // Initialize all UI components
    this.toolbarManager = new ToolbarManager();
    this.draggableSections = new DraggableSections();
    this.menuStateManager = new MenuStateManager();
    this.blockColorManager = new BlockColorManager();
    this.toolButtonManager = new ToolButtonManager(scene);
    
    // Initialize mobile controls
    this.initMobileControls();
    
    // Make menuStateManager globally available for other components
    window.menuStateManager = this.menuStateManager;
  }

  initMobileControls() {
    // Mobile tap-to-place toggle
    const tapToPlaceToggle = document.getElementById('mobile-tap-to-place');
    if (tapToPlaceToggle) {
      tapToPlaceToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        if (window.debugInfo) {
          window.debugInfo.lastAction = `Mobile tap-to-place ${isEnabled ? 'enabled' : 'disabled'}`;
          if (window.debugTools) {
            window.debugTools.updateDebugInfo();
          }
        }
      });
    }

    // Mobile preview toggle
    const previewToggle = document.getElementById('mobile-show-preview');
    if (previewToggle) {
      previewToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        if (!isEnabled && window.previewManager) {
          window.previewManager.hideAllPreviews();
        }
        if (window.debugInfo) {
          window.debugInfo.lastAction = `Mobile preview ${isEnabled ? 'enabled' : 'disabled'}`;
          if (window.debugTools) {
            window.debugTools.updateDebugInfo();
          }
        }
      });
    }

    // Mobile vibration toggle
    const vibrateToggle = document.getElementById('mobile-vibrate');
    if (vibrateToggle) {
      vibrateToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        // Test vibration when enabled
        if (isEnabled && navigator.vibrate) {
          navigator.vibrate(100);
        }
        if (window.debugInfo) {
          window.debugInfo.lastAction = `Mobile vibration ${isEnabled ? 'enabled' : 'disabled'}`;
          if (window.debugTools) {
            window.debugTools.updateDebugInfo();
          }
        }
      });
    }

    // Mobile place blocks button
    const placeButton = document.getElementById('mobile-place-blocks');
    if (placeButton) {
      placeButton.addEventListener('click', () => {
        if (window.raycastManager && typeof window.raycastManager.placeMobileBlocks === 'function') {
          window.raycastManager.placeMobileBlocks();
        }
      });
    }
  }

  getSelectedBlock() {
    return window.blockTools?.getSelectedBlock() || window.selectedBlock || null;
  }
}

window.UIControls = UIControls;