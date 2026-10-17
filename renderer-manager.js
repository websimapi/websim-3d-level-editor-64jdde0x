class RendererManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.cameraManager = null;
    this.lightingManager = null;
    this.raycastManager = null;
    this.interactionManager = null;
    this.animationManager = null;
    this.isWebGPU = false;
  }

  async init() {
    // Check for WebGPU support
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          // WebGPU is supported, use WebGPURenderer
          this.renderer = new THREE.WebGPURenderer({ antialias: true });
          this.isWebGPU = true;
          console.log('Using WebGPU renderer for enhanced performance');
          
          // Initialize WebGPU renderer
          await this.renderer.init();
        } else {
          // Fallback to WebGL
          this.initWebGLRenderer();
        }
      } catch (error) {
        console.warn('WebGPU initialization failed, falling back to WebGL:', error);
        this.initWebGLRenderer();
      }
    } else {
      // WebGPU not supported, use WebGL
      this.initWebGLRenderer();
    }

    // Set common renderer properties
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isWebGPU ? THREE.PCFSoftShadowMap : THREE.PCFSoftShadowMap;
    
    // Add renderer to DOM
    document.getElementById('grid-container').appendChild(this.renderer.domElement);
    
    // Initialize managers after renderer is fully set up
    this.initializeManagers();
  }

  initWebGLRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.isWebGPU = false;
    console.log('Using WebGL renderer');
  }

  initializeManagers() {
    // Initialize camera manager
    this.cameraManager = new CameraManager(this.renderer);
    
    // Initialize lighting manager
    this.lightingManager = new LightingManager(this.scene);
    
    // Make lighting manager globally accessible
    window.lightingManager = this.lightingManager;
    
    // Initialize raycast manager
    this.raycastManager = new RaycastManager(this.scene, this.cameraManager.getCamera(), this.renderer);
    
    // Initialize interaction manager
    this.interactionManager = new InteractionManager(this.scene, this.cameraManager.getCamera(), this.raycastManager);
    
    // Initialize animation manager
    this.animationManager = new AnimationManager(this.renderer, this.cameraManager.getCamera(), this.cameraManager);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.cameraManager.getCamera();
  }

  getRenderer() {
    return this.renderer;
  }

  getRaycaster() {
    return this.raycastManager.getRaycaster();
  }

  animate() {
    if (this.animationManager) {
      // Animation manager handles its own loop, so we don't need to do anything here
      // This method exists for compatibility with the init.js call
    }
  }
}

window.RendererManager = RendererManager;