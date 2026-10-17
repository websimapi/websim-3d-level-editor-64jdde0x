class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.ambientLight = null;
    this.directionalLight = null;
    this.setupLighting();
    this.initControls();
  }

  setupLighting() {
    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Add directional light with shadows
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // Position light more overhead and slightly to the side for natural-looking shadows
    this.directionalLight.position.set(20, 40, 20);
    this.directionalLight.castShadow = true;
    
    // Configure shadow properties with improved bias to prevent self-shadowing
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    // Use more conservative initial bounds for better shadow precision
    this.directionalLight.shadow.camera.left = -25;
    this.directionalLight.shadow.camera.right = 25;
    this.directionalLight.shadow.camera.top = 25;
    this.directionalLight.shadow.camera.bottom = -25;
    
    // Use more aggressive bias values to prevent self-shadowing artifacts
    this.directionalLight.shadow.bias = -0.001;
    this.directionalLight.shadow.normalBias = 0.05;
    
    // Reduce shadow radius to minimize blurring artifacts
    this.directionalLight.shadow.radius = 2;
    
    // Reduce blur samples to prevent over-blurring
    this.directionalLight.shadow.blurSamples = 8;
    
    this.scene.add(this.directionalLight);
    
    // Add a helper to visualize the light's direction
    // const lightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
    // this.scene.add(lightHelper);
  }

  initControls() {
    // Ambient light intensity
    const ambientSlider = document.getElementById('ambient-intensity');
    const ambientValue = document.getElementById('ambient-value');
    ambientSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.ambientLight.intensity = value;
      ambientValue.textContent = value.toFixed(1);
    });

    // Directional light intensity
    const directionalSlider = document.getElementById('directional-intensity');
    const directionalValue = document.getElementById('directional-value');
    directionalSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.directionalLight.intensity = value;
      directionalValue.textContent = value.toFixed(1);
    });

    // Shadow quality
    const shadowQuality = document.getElementById('shadow-quality');
    shadowQuality.addEventListener('change', (e) => {
      const size = parseInt(e.target.value);
      this.directionalLight.shadow.mapSize.width = size;
      this.directionalLight.shadow.mapSize.height = size;
      this.directionalLight.shadow.map?.dispose();
      this.directionalLight.shadow.map = null;
      
      // Update bias values when quality changes
      this.updateShadowBias();
    });

    // Shadow distance
    const shadowDistance = document.getElementById('shadow-distance');
    const shadowDistanceValue = document.getElementById('shadow-distance-value');
    shadowDistance.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      
      // Ensure minimum shadow bounds for low distances and scale properly
      const shadowBounds = Math.max(25, value * 1.2);
      
      this.directionalLight.shadow.camera.left = -shadowBounds;
      this.directionalLight.shadow.camera.right = shadowBounds;
      this.directionalLight.shadow.camera.top = shadowBounds;
      this.directionalLight.shadow.camera.bottom = -shadowBounds;
      
      // Set near and far planes with better bounds for small distances
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = Math.max(80, value * 2.5);
      
      this.directionalLight.shadow.camera.updateProjectionMatrix();
      shadowDistanceValue.textContent = value.toString();
      
      // Update bias values when distance changes
      this.updateShadowBias();
    });

    // Enable/disable shadows
    const enableShadows = document.getElementById('enable-shadows');
    enableShadows.addEventListener('change', (e) => {
      const renderer = window.rendererManager.getRenderer();
      renderer.shadowMap.enabled = e.target.checked;
      this.directionalLight.castShadow = e.target.checked;
      
      // Update all objects shadow settings
      this.scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = e.target.checked;
          obj.receiveShadow = e.target.checked;
        }
      });
    });

    // Light position controls
    const lightX = document.getElementById('light-x');
    const lightY = document.getElementById('light-y');
    const lightZ = document.getElementById('light-z');
    const lightXValue = document.getElementById('light-x-value');
    const lightYValue = document.getElementById('light-y-value');
    const lightZValue = document.getElementById('light-z-value');

    // Update default values to match new light position
    lightX.value = 20;
    lightY.value = 40;
    lightZ.value = 20;
    lightXValue.textContent = '20';
    lightYValue.textContent = '40';
    lightZValue.textContent = '20';

    lightX.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.directionalLight.position.x = value;
      lightXValue.textContent = value.toString();
    });

    lightY.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.directionalLight.position.y = value;
      lightYValue.textContent = value.toString();
    });

    lightZ.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.directionalLight.position.z = value;
      lightZValue.textContent = value.toString();
    });
  }

  updateShadowBias() {
    const shadowDistance = parseInt(document.getElementById('shadow-distance').value);
    const shadowQuality = parseInt(document.getElementById('shadow-quality').value);
    
    // A simpler, more robust bias calculation
    // Base bias is constant to prevent most acne on flat surfaces
    const baseBias = -0.0005; 
    
    // Normal bias scales with the size of a texel in the shadow map.
    // Larger shadow distance = larger area covered = larger texels = need more bias.
    // Lower shadow quality = smaller map = larger texels = need more bias.
    const shadowCam = this.directionalLight.shadow.camera;
    const frustumWidth = shadowCam.right - shadowCam.left;
    const texelSize = frustumWidth / shadowQuality;
    
    // A factor of 2.5 seems to work well empirically for normal bias.
    const normalBias = texelSize * 2.5;

    this.directionalLight.shadow.bias = baseBias;
    this.directionalLight.shadow.normalBias = normalBias;
    
    // Adjust shadow radius based on quality to reduce artifacts
    if (shadowQuality <= 512) {
      this.directionalLight.shadow.radius = 1; // Sharper for low quality
      this.directionalLight.shadow.blurSamples = 2;
    } else if (shadowQuality <= 1024) {
      this.directionalLight.shadow.radius = 2;
      this.directionalLight.shadow.blurSamples = 6;
    } else {
      this.directionalLight.shadow.radius = 3;
      this.directionalLight.shadow.blurSamples = 8;
    }
  }

  updateShadowsForObject(object) {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
    
    // Recursively update children
    object.children.forEach(child => {
      this.updateShadowsForObject(child);
    });
  }

  getDirectionalLight() {
    return this.directionalLight;
  }

  getAmbientLight() {
    return this.ambientLight;
  }
}

window.LightingManager = LightingManager;