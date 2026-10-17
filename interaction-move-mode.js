class InteractionMoveMode {
  constructor(manager) {
    this.manager = manager;
    this._outsideDown = false;
    this._downPos = { x: 0, y: 0 };
    this._movedBeyondThreshold = false;
    this._dragThresholdPx = 6;
    this.mobile = manager.mobile;
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const res = await fetch('interaction-config.json', { cache: 'no-cache' });
      if (res.ok) {
        const cfg = await res.json();
        if (typeof cfg.dragThresholdPx === 'number') this._dragThresholdPx = cfg.dragThresholdPx;
      }
    } catch (e) {
      console.warn('interaction-config load failed, using defaults', e);
    }
  }

  onCanvasMouseDown(event) {
    if (!window.toolStateManager || !window.toolStateManager.isToolActive('move-mode')) return;
    if (this.mobile.isMobileDevice() && !this.mobile.isTouchOnRotationControl(event)) return;
    if (!this.manager.isOverSelectedAssetOrGizmo(event)) {
      this._outsideDown = true; this._movedBeyondThreshold = false;
      this._downPos.x = event.clientX; this._downPos.y = event.clientY;
    } else {
      this._outsideDown = false; this._movedBeyondThreshold = false;
    }
  }

  onCanvasMouseMove(event) {
    if (!this._outsideDown) return;
    if (this.mobile.isMobileDevice() && !this.mobile.isTouchOnRotationControl(event)) return;
    const dx = event.clientX - this._downPos.x, dy = event.clientY - this._downPos.y;
    if (!this._movedBeyondThreshold && Math.hypot(dx, dy) > this._dragThresholdPx) {
      this._movedBeyondThreshold = true;
      if (window.toolStateManager) window.toolStateManager.setTool('drag-mode');
      this._outsideDown = false;
    }
  }

  onCanvasMouseUp(event) {
    if (!window.toolStateManager || !window.toolStateManager.isToolActive('move-mode')) {
      this._outsideDown = false; this._movedBeyondThreshold = false; return;
    }
    if (this.mobile.isMobileDevice() && !this.mobile.isTouchOnRotationControl(event)) {
      this._outsideDown = false; this._movedBeyondThreshold = false; return;
    }
    if (this._outsideDown && !this._movedBeyondThreshold) {
      if (window.placedAssets && window.placedAssets.selectedPlacedAsset) window.placedAssets.deselectPlacedAsset();
      window.toolStateManager.setTool('select-tool');
    }
    this._outsideDown = false; this._movedBeyondThreshold = false;
  }
}
window.InteractionMoveMode = InteractionMoveMode;

