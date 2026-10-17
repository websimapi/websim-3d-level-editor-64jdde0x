class RaycastManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  updateMouse(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    
    if (window.debugTools) {
      window.debugTools.setMousePosition(
        clientX - rect.left,
        clientY - rect.top
      );
    }

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    if (window.debugTools) {
      window.debugTools.setNormalizedMouse(this.mouse.x, this.mouse.y);
      window.debugTools.setCameraPosition(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z
      );
    }
  }

  onMouseMove(event) {
    this.updateMouse(event.clientX, event.clientY);
    this.updateRaycasting();
  }

  updateRaycasting() {
    if (!window.gridManager || !window.debugTools) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersectObjects = [
      ...window.gridManager.getGroundCells(),
      ...Object.values(window.gridBlocks || {})
    ];

    const intersects = this.raycaster.intersectObjects(intersectObjects, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      window.debugTools.setRaycastHit({
        point: {
          x: intersect.point.x.toFixed(2),
          y: intersect.point.y.toFixed(2),
          z: intersect.point.z.toFixed(2)
        }
      });

      const gridPos = window.gridManager.getGridPosition(intersect.point);
      window.debugTools.setGridPosition(gridPos);

      this.updatePreview(gridPos, intersect);
    } else {
      window.debugTools.setRaycastHit(null);
      window.debugTools.setGridPosition(null);
      this.hidePreview();
    }

    window.debugTools.updateDebugInfo();
  }

  updatePreview(gridPos, intersect) {
    if (!window.previewManager) return;

    // Check if mobile preview is disabled
    const mobilePreviewEnabled = document.getElementById('mobile-show-preview')?.checked !== false;
    if (!mobilePreviewEnabled && this.isMobileDevice()) {
      window.previewManager.hideAllPreviews();
      return;
    }

    const isAssetPlacement = window.toolStateManager.isToolActive('place-asset');
    const isBlockPlacement = window.toolStateManager.isToolActive('place-block');
    const isColorDropper = window.toolStateManager.isToolActive('color-dropper');
    const isRemoveBlock = window.toolStateManager.isToolActive('remove-block');

    if (isAssetPlacement && window.selectedModel) {
        if (!window.previewManager.modelPreview) {
            // Create preview through the manager
            window.previewManager.modelPreview = window.selectedModel.clone();
            window.previewManager.modelPreview.traverse(child => {
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });
            // Ensure preview has the same rotation as the selected model
            window.previewManager.modelPreview.rotation.copy(window.selectedModel.rotation);
            this.scene.add(window.previewManager.modelPreview);
        }

        const yOffset = window.selectedModel.userData.yOffset || 0;
        let placePos;
        if (intersect.object.userData.isGroundCell) {
            placePos = new THREE.Vector3(
                Math.floor(gridPos.x) + 0.5,
                window.gridManager.getHighestBlockAt(gridPos.x, gridPos.z) + 0.5 - yOffset,
                Math.floor(gridPos.z) + 0.5
            );
        } else {
            const normal = intersect.face.normal.clone().transformDirection(intersect.object.matrixWorld).round();
            placePos = intersect.object.position.clone().add(normal.multiplyScalar(0.6));
            placePos.y -= yOffset;
        }
        window.previewManager.updateModelPreview(window.selectedModel, placePos);
        window.previewManager.placementPreview.visible = false;
        return;
    }

    if (window.previewManager.modelPreview) {
        window.previewManager.hideAllPreviews();
    }
    
    if (isBlockPlacement) {
        const blockType = document.getElementById('block-type').value;
        const finalGridPos = window.gridManager.calculatePlacementPosition(intersect, blockType);

        if (finalGridPos) {
            const blockYOffset = blockType === 'full' ? 0.5 : (blockType === 'half' ? 0.25 : (blockType === 'stair' ? 0.0 : 0.25));
            const previewPosition = new THREE.Vector3(finalGridPos.x + 0.5, finalGridPos.y + blockYOffset, finalGridPos.z + 0.5);
            
            const orientation = document.getElementById('block-orientation').value;
            let rotation = 0;
            switch (orientation) {
                case 'east': rotation = Math.PI / 2; break;
                case 'south': rotation = Math.PI; break;
                case 'west': rotation = -Math.PI / 2; break;
            }

            window.previewManager.updateBlockPreview(previewPosition, blockType, 0x00ff00, rotation);

            if (window.toolStateManager.isFillMode()) {
                const baseY = previewPosition.y - (blockType === 'full' ? 0.5 : (blockType === 'half' ? 0.25 : 0.0));
                window.toolStateManager.updateFillPreview({ x: Math.floor(previewPosition.x), z: Math.floor(previewPosition.z) }, baseY, blockType);
            } else if (window.toolStateManager.fillPreviewOutline) {
                window.toolStateManager.fillPreviewOutline.visible = false;
            }
        } else {
            // No valid position found, hide preview
            window.previewManager.hideAllPreviews();
        }

    } else if (isColorDropper || isRemoveBlock) {
        const hoveredBlock = this.findExactBlockAtPoint(intersect.point);
        if (hoveredBlock) {
            const color = isColorDropper ? 0x00ff00 : 0xff0000;
            window.previewManager.updateBlockPreview(hoveredBlock.position, hoveredBlock.userData.blockType, color, hoveredBlock.rotation.y);
        } else {
            window.previewManager.hideAllPreviews();
        }
    } else {
        window.previewManager.hideAllPreviews();
    }
  }

  findExactBlockAtPoint(point) {
    // Create a small sphere at the clicked point for precise detection
    const radius = 0.2;
    
    // Check all blocks to find any that intersect with our detection sphere
    const blocks = Object.values(window.gridBlocks).filter(obj => obj.userData && obj.userData.blockType);
    
    // Sort blocks by distance to click point for more accurate selection
    const sortedBlocks = blocks.map(block => {
      const distance = point.distanceTo(block.position);
      return { block, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    // Return the closest block if any are close enough
    if (sortedBlocks.length > 0 && sortedBlocks[0].distance < 1.0) {
      return sortedBlocks[0].block;
    }
    
    // If no block found with sphere test, use raycasting in multiple directions
    const localRaycaster = new THREE.Raycaster();
    const directions = [
      new THREE.Vector3(0, -1, 0),  // down
      new THREE.Vector3(0, 1, 0),   // up
      new THREE.Vector3(1, 0, 0),   // right
      new THREE.Vector3(-1, 0, 0),  // left
      new THREE.Vector3(0, 0, 1),   // forward
      new THREE.Vector3(0, 0, -1)   // backward
    ];
    
    for (const dir of directions) {
      localRaycaster.set(point, dir);
      const intersects = localRaycaster.intersectObjects(blocks, false);
      if (intersects.length > 0 && intersects[0].distance < 0.8) {
        return intersects[0].object;
      }
    }
    
    return null;
  }

  updatePreviewGeometry(blockType) {
    if (!window.previewManager || !window.previewManager.placementPreview) return;
    const placementPreview = window.previewManager.placementPreview;
    
    // Create the correct geometry based on block type
    let geometry;
    switch (blockType) {
      case 'full':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'stair':
        // Use the stair geometry from placed-blocks for consistency
        if (window.placedBlocks && typeof window.placedBlocks.createStairGeometry === 'function') {
          geometry = window.placedBlocks.createStairGeometry();
        } else {
          // Create a simplified stair geometry
          const stairGeo = new THREE.BoxGeometry(1, 0.5, 1);
          const topStepGeo = new THREE.BoxGeometry(0.5, 0.5, 1);
          topStepGeo.translate(-0.25, 0.25, 0);
          
          // Merge geometries
          geometry = BufferGeometryUtils.mergeBufferGeometries([stairGeo, topStepGeo]);
        }
        break;
      default: // half block
        geometry = new THREE.BoxGeometry(1, 0.5, 1);
    }
    
    // Don't replace geometry if it's already the same type
    if (placementPreview.geometry.type !== geometry.type || 
        (blockType === 'full' && placementPreview.geometry.parameters?.height !== 1) ||
        (blockType === 'half' && placementPreview.geometry.parameters?.height !== 0.5)) {
      placementPreview.geometry.dispose();
      placementPreview.geometry = geometry;
    }
    
    // Update material to be transparent green
    if (placementPreview.material.transparent !== true || 
        placementPreview.material.wireframe === true) {
      placementPreview.material.transparent = true;
      placementPreview.material.opacity = 0.5;
      placementPreview.material.wireframe = false;
    }
  }

  hidePreview() {
    if (window.previewManager) {
      window.previewManager.hideAllPreviews();
    }
  }

  getRaycaster() {
    return this.raycaster;
  }

  getMouse() {
    return this.mouse;
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }
}

window.RaycastManager = RaycastManager;