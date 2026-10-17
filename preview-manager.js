class PreviewManager {
  constructor(scene) {
    this.scene = scene;
    this.placementPreview = null;
    this.modelPreview = null;
    this.initPreviews();
  }

  initPreviews() {
    // Create block placement preview
    const previewGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const previewMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      wireframe: false
    });
    
    this.placementPreview = new THREE.Mesh(previewGeometry, previewMaterial);
    this.placementPreview.visible = false;
    this.scene.add(this.placementPreview);
  }

  updateBlockPreview(position, blockType = 'half', color = 0x00ff00, rotation = 0) {
    if (!this.placementPreview) return;
    
    // Show block preview in block placement mode, remove block mode, and color dropper mode
    if (window.currentMode === 'place-block' || window.currentMode === 'remove-block' || window.currentMode === 'color-dropper') {
      this.placementPreview.visible = true;
      this.placementPreview.position.copy(position);
      this.placementPreview.material.color.setHex(color);
      this.placementPreview.rotation.y = rotation;
      
      // Update geometry based on block type
      let geometry;
      switch (blockType) {
        case 'full':
          geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
          break;
        case 'stair':
          // Use the actual stair geometry for preview
          if (window.placedBlocks && typeof window.placedBlocks.createStairGeometry === 'function') {
            geometry = window.placedBlocks.createStairGeometry();
          } else {
            // Create a simplified stair geometry
            const stairGeo = new THREE.BoxGeometry(1, 0.5, 1);
            const topStepGeo = new THREE.BoxGeometry(0.5, 0.5, 1);
            topStepGeo.translate(-0.25, 0.25, 0);
            
            // Merge geometries if available
            if (THREE.BufferGeometryUtils) {
              geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([stairGeo, topStepGeo]);
            } else {
              geometry = stairGeo; // Fallback to simple geometry
            }
          }
          break;
        default:
          geometry = new THREE.BoxGeometry(1.02, 0.52, 1.02);
      }

      if (this.placementPreview.geometry !== geometry) {
        this.placementPreview.geometry.dispose();
        this.placementPreview.geometry = geometry;
      }
      
      // Make sure material is properly configured
      this.placementPreview.material.transparent = true;
      this.placementPreview.material.opacity = 0.5;
      this.placementPreview.material.wireframe = false;
    } else {
      this.placementPreview.visible = false;
    }
  }

  updateModelPreview(model, position) {
    if (this.modelPreview) {
      this.scene.remove(this.modelPreview);
    }

    if (model && window.currentMode === 'place-asset') {
      this.modelPreview = model.clone();
      
      // Apply all rotations from the original model
      this.modelPreview.rotation.x = model.rotation.x;
      this.modelPreview.rotation.y = model.rotation.y; 
      this.modelPreview.rotation.z = model.rotation.z;

      this.modelPreview.traverse(child => {
        if (child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5;
        }
      });

      this.modelPreview.position.copy(position);
      this.scene.add(this.modelPreview);
    }
  }

  hideAllPreviews() {
    if (this.placementPreview) {
      this.placementPreview.visible = false;
    }
    if (this.modelPreview) {
      this.modelPreview.visible = false;
    }
  }
}

window.PreviewManager = PreviewManager;