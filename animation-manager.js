class AnimationManager {
  constructor(renderer, camera, cameraManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.cameraManager = cameraManager;
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.cameraManager) {
      this.cameraManager.update();
    }
    
    if (window.selectedPlacedAsset && window.selectedPlacedAsset.helper) {
      window.selectedPlacedAsset.helper.update();
    }
    
    if (this.renderer && window.rendererManager) {
      this.renderer.render(window.rendererManager.getScene(), this.camera);
    }
  }
}

window.AnimationManager = AnimationManager;