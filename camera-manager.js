class CameraManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.camera = null;
    this.controls = null;
    this.isMobileRotating = false;
    this.rotationControl = null;
    this.init();
    this.setupEventListeners();
    window.cameraManager = this;
  }

  init() {
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 32, 32);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Only initialize controls on desktop - mobile uses custom rotation control
    if (!this.isMobileDevice()) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.desktopController = new CameraDesktopControls(this.camera, this.renderer, this.controls);
      this.desktopController.setupDragModeDetection();
    } else {
      // On mobile, create a minimal controls-like object for compatibility
      this.controls = { 
        enabled: false, 
        update: () => {}, 
        addEventListener: () => {}, 
        getAzimuthalAngle: () => 0, 
        getPolarAngle: () => Math.PI / 2, 
        target: new THREE.Vector3(0, 0, 0) 
      };
      this.mobileController = new CameraMobileControls(this.camera, this.controls, this.renderer);
      this.mobileController.attach();
    }
  }

  isMobileDevice() {
    return window.CameraUtils ? window.CameraUtils.isMobileDevice() : (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  setupMobileRotationControl() {
    if (!this.mobileController) {
      this.mobileController = new CameraMobileControls(this.camera, this.controls, this.renderer);
    }
    this.mobileController.attach();
  }

  setupDragModeDetection() {
    if (this.desktopController) this.desktopController.setupDragModeDetection();
  }

  isMouseOverGizmo() {
    return this.desktopController ? this.desktopController.isMouseOverGizmo() : false;
  }

  setupEventListeners() {
    this.resizeHandler = new CameraResizeHandler(this.camera, this.renderer);
  }

  onWindowResize() {
    if (this.resizeHandler) this.resizeHandler.onResize();
  }

  update() {
    if (!this.isMobileDevice()) {
      // Desktop behavior - disable controls when in manipulation mode
      const inManipulationMode = window.toolStateManager?.isToolActive('move-mode')
                              || window.toolStateManager?.isToolActive('rotation-mode');
      this.controls.enabled = !inManipulationMode || !window.placedAssets?.selectedPlacedAsset;
      this.controls.update();
    }
    // Mobile camera updates are handled directly in setupMobileRotationControl
  }

  getCamera() {
    return this.camera;
  }

  getControls() {
    return this.controls;
  }
}

window.CameraManager = CameraManager;