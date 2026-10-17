class CameraDesktopControls {
  constructor(camera, renderer, controls) {
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
  }

  setupDragModeDetection() {
    if (!this.controls) return;
    this.controls.addEventListener('start', () => {
      if (window.toolStateManager?.isToolActive('move-mode') && window.placedAssets?.selectedPlacedAsset) return;
      if (window.placedAssets?.isInteractingWithGizmo) return;
      if (this.isMouseOverGizmo()) {
        this.controls.enabled = false;
        if (window.placedAssets) window.placedAssets.isInteractingWithGizmo = true;
        return;
      }
      window.toolStateManager?.startDragMode();
    });

    this.controls.addEventListener('end', () => {
      if (window.toolStateManager?.isToolActive('move-mode') && window.placedAssets?.selectedPlacedAsset) return;
      if (window.placedAssets?.isInteractingWithGizmo) return;
      window.toolStateManager?.endDragMode();
    });
  }

  isMouseOverGizmo() {
    if (!window.placedAssets?.selectedPlacedAsset || !window.placedAssets.manipulationHelper) return false;
    if (!window.toolStateManager?.isToolActive('move-mode')) return false;
    if (!window.raycastManager) return false;
    const mouse = window.raycastManager.getMouse();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(window.placedAssets.manipulationHelper.children, true);
    return intersects.length > 0;
  }
}
window.CameraDesktopControls = CameraDesktopControls;

