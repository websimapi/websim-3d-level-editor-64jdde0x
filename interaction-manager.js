class InteractionManager {
  constructor(scene, camera, raycastManager) {
    this.scene = scene;
    this.camera = camera;
    this.raycastManager = raycastManager;
    this.mobile = new InteractionMobileUtils();
    this.clickHandler = new InteractionClickHandler(this);
    this.moveMode = new InteractionMoveMode(this);
    this.setupEventListeners();

    // New: tracking state for outside click/drag while in move-mode
    this._outsideDown = false;
    this._downPos = { x: 0, y: 0 };
    this._movedBeyondThreshold = false;
    this._dragThresholdPx = 6; // default; overridden by config
    this.loadConfig();
  }

  setupEventListeners() {
    const dom = this.raycastManager.renderer.domElement;
    dom.addEventListener('click', (e) => this.onMouseClick(e));
    dom.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
    dom.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    dom.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
  }

  onCanvasMouseDown(e) { this.moveMode.onCanvasMouseDown(e); }
  onCanvasMouseMove(e) { this.moveMode.onCanvasMouseMove(e); }
  onCanvasMouseUp(e) { this.moveMode.onCanvasMouseUp(e); }
  onMouseClick(e) { this.clickHandler.onMouseClick(e); }

  // Determine if the pointer is over the selected asset's geometry or gizmo
  isOverSelectedAssetOrGizmo(event) {
    return window.InteractionUtils.isOverSelectedAssetOrGizmo(event, this.camera, this.raycastManager);
  }

  isMobileDevice() { return this.mobile.isMobileDevice(); }
  isTouchOnRotationControl(e) { return this.mobile.isTouchOnRotationControl(e); }
  showMobileFeedback(e) { return this.mobile.showMobileFeedback(e); }
  findBlockAtPoint(point) { return window.InteractionUtils.findBlockAtPoint(point); }
  captureBlockStateForHistory(block) { return window.InteractionUtils.captureBlockStateForHistory(block); }

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
}

window.InteractionManager = InteractionManager;