// Initialize global variables
window.room = new WebsimSocket();
window.scene = null;
window.camera = null;
window.renderer = null;
window.controls = null;
window.raycaster = new THREE.Raycaster();
window.mouse = new THREE.Vector2();
window.gridBlocks = {};
window.groundCells = {};
window.placementPreview = null;
window.groundPlane = null;
window.selectedModel = null;
window.modelPreview = null;
window.selectedBlock = null;
window.initialBlockColor = null;
window.loader = new THREE.GLTFLoader();
window.debugInfo = {
  mousePosition: { x: 0, y: 0 },
  normalizedMouse: { x: 0, y: 0 },
  raycastHit: null,
  gridPosition: null,
  cameraPosition: null,
  lastAction: null
};
window.currentMode = 'place-block'; 

async function main() {
  // Initialize managers (renderer manager now supports async initialization)
  window.rendererManager = new RendererManager();
  
  // Wait for renderer to be fully initialized (important for WebGPU)
  await window.rendererManager.init();
  
  window.gridManager = new GridManager(rendererManager.getScene());
  window.mobileRaycastHandler = new MobileRaycastHandler(rendererManager.raycastManager);
  window.debugTools = new DebugTools();
  window.inputHandler = new InputHandler();
  window.fileManager = new FileManager();
  window.toolStateManager = new ToolStateManager();
  window.uiControls = new UIControls(rendererManager.getScene());
  window.actionHistory = new ActionHistory();
  window.websocketHandler = new WebsocketHandler(rendererManager.getScene());
  window.previewManager = new PreviewManager(rendererManager.getScene());
  window.blockTools = new BlockTools(rendererManager.getScene(), gridBlocks);
  window.placedBlocks = new PlacedBlocks(rendererManager.getScene());
  window.placedAssets = new PlacedAssets(rendererManager.getScene(), loader);
  window.modelManager = new ModelManager(rendererManager.getScene(), loader);
  window.textureManager = new TextureManager();
  window.backgroundManager = new BackgroundManager(rendererManager.getScene());
  window.chatSystem = new ChatSystem();

  document.getElementById('generate-texture').addEventListener('click', () => {
    window.textureManager.generateTextureFromPrompt();
  });

  // Start animation loop
  rendererManager.animate();
}

// Wait for DOM to be ready before initializing managers
document.addEventListener('DOMContentLoaded', main);