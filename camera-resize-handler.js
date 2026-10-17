class CameraResizeHandler {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    this._onResize = () => this.onResize();
    window.addEventListener('resize', this._onResize);
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
window.CameraResizeHandler = CameraResizeHandler;

