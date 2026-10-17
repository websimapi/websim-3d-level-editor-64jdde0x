class BackgroundManager {
  constructor(scene) {
    this.scene = scene;
    this.backgroundSphere = null;
    this.currentBackgroundTexture = null;
    this.previousBackgroundData = null; // Store previous background for undo/redo
    this.originalToneMappingSettings = null; // Store original tone mapping settings
    
    // Initialize specialized loaders for HDR and EXR formats
    this.rgbeLoader = new THREE.RGBELoader();
    this.exrLoader = new THREE.EXRLoader();
    this.textureLoader = new THREE.TextureLoader();
    
    // Store original renderer tone mapping settings
    this.storeOriginalToneMappingSettings();
    
    this.initEventListeners();
  }

  storeOriginalToneMappingSettings() {
    const renderer = window.rendererManager?.getRenderer();
    if (renderer) {
      this.originalToneMappingSettings = {
        toneMapping: renderer.toneMapping,
        toneMappingExposure: renderer.toneMappingExposure
      };
    }
  }

  initEventListeners() {
    // Upload background button
    document.getElementById('upload-background').addEventListener('click', () => {
      document.getElementById('background-input').click();
    });

    // Remove background button
    document.getElementById('remove-background').addEventListener('click', () => {
      this.removeBackground();
    });

    // File input change
    document.getElementById('background-input').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          window.debugInfo.lastAction = `Starting upload of background: ${file.name}`;
          window.debugTools.updateDebugInfo();
          
          const url = await websim.upload(file);
          this.setBackground(url, file.name);
          
          window.debugInfo.lastAction = `Background uploaded successfully: ${file.name}`;
          window.debugTools.updateDebugInfo();
          
          event.target.value = '';
        } catch (error) {
          console.error('Error uploading background:', error);
          window.debugInfo.lastAction = `Error uploading background: ${error.message}`;
          window.debugTools.updateDebugInfo();
        }
      }
    });
  }

  setBackground(textureUrl, name, recordAction = true) {
    // Store previous background data for undo functionality
    if (recordAction) {
      this.previousBackgroundData = this.getBackgroundData();
    }
    
    // Remove existing background
    this.removeBackground(false); // Don't record action for internal removal

    // Determine file type and use appropriate loader
    const fileExtension = name.toLowerCase().split('.').pop();
    let loader;
    
    switch (fileExtension) {
      case 'hdr':
        loader = this.rgbeLoader;
        break;
      case 'exr':
        loader = this.exrLoader;
        break;
      default:
        loader = this.textureLoader;
    }

    // Load the texture with appropriate loader
    loader.load(textureUrl, (texture) => {
      this.currentBackgroundTexture = texture;
      
      // Store the URL and name in texture userData for later retrieval
      texture.userData = { url: textureUrl, name: name };
      
      // Configure texture for 360 background use
      if (fileExtension === 'hdr' || fileExtension === 'exr') {
        // HDR/EXR textures need specific configuration
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Don't change global tone mapping - handle HDR/EXR within the material
        // This prevents existing blocks from changing color
      } else {
        // Standard texture configuration
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      
      // Create a large sphere geometry
      const sphereGeometry = new THREE.SphereGeometry(500, 32, 32);
      
      // Create material with the background texture
      const sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide // Render the inside of the sphere
      });

      // Create the background sphere
      this.backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      // Position the sphere at the origin
      this.backgroundSphere.position.set(0, 0, 0);
      
      // Add to scene
      this.scene.add(this.backgroundSphere);
      
      // Update UI
      this.updateBackgroundInfo(`Background: ${name} (${fileExtension.toUpperCase()})`);
      
      // Record action with previous background data only if not called from history commands
      if (recordAction) {
        window.debugInfo.lastAction = `Set background to ${name}`;
        window.actionHistory.addAction(window.debugInfo.lastAction, {
          type: 'setBackground',
          textureUrl: textureUrl,
          name: name,
          previousBackgroundData: this.previousBackgroundData
        });
        window.debugTools.updateDebugInfo();
      }
    }, undefined, (error) => {
      console.error('Error loading background texture:', error);
      if (recordAction) {
        window.debugInfo.lastAction = `Error loading background texture: ${error.message}`;
        window.debugTools.updateDebugInfo();
      }
    });
  }

  removeBackground(recordAction = true) {
    let removedBackgroundData = null;
    
    if (this.backgroundSphere) {
      // Store the background data before removing for undo functionality
      if (recordAction) {
        removedBackgroundData = this.getBackgroundData();
      }
      
      this.scene.remove(this.backgroundSphere);
      
      // Dispose of geometry and material
      this.backgroundSphere.geometry.dispose();
      this.backgroundSphere.material.dispose();
      
      // Dispose of texture
      if (this.currentBackgroundTexture) {
        this.currentBackgroundTexture.dispose();
        this.currentBackgroundTexture = null;
      }
      
      this.backgroundSphere = null;
      
      // No need to restore tone mapping since we're not changing it globally anymore
      
      // Update UI
      this.updateBackgroundInfo('No background set');
      
      // Record action with removed background data only if not called from history commands
      if (recordAction) {
        window.debugInfo.lastAction = 'Removed background';
        window.actionHistory.addAction(window.debugInfo.lastAction, {
          type: 'removeBackground',
          removedBackgroundData: removedBackgroundData
        });
        window.debugTools.updateDebugInfo();
      }
    }
  }

  updateBackgroundInfo(text) {
    const infoElement = document.getElementById('current-background-info');
    if (infoElement) {
      infoElement.textContent = text;
    }
  }

  getBackgroundData() {
    if (this.backgroundSphere && this.currentBackgroundTexture) {
      return {
        textureUrl: this.currentBackgroundTexture.userData?.url || null,
        name: this.currentBackgroundTexture.userData?.name || 'Background'
      };
    }
    return null;
  }

  // Method to restore background from saved data
  restoreBackground(backgroundData, recordAction = false) {
    if (backgroundData && backgroundData.textureUrl) {
      this.setBackground(backgroundData.textureUrl, backgroundData.name, recordAction);
    }
  }
}

window.BackgroundManager = BackgroundManager;