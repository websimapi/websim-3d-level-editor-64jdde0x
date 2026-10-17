class InteractionClickHandler {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
  }

  onMouseClick(event) {
    if (event.isMobileTouch) {
      console.log('InteractionManager.onMouseClick - Mobile touch detected', {
        toolStateExists: !!window.toolStateManager,
        shouldBlockActions: window.toolStateManager?.shouldBlockActions(),
        currentTool: window.toolStateManager?.getCurrentTool(),
        isPlaceBlockActive: window.toolStateManager?.isToolActive('place-block'),
        hasRaycastManager: !!this.manager.raycastManager,
        mousePosition: this.manager.raycastManager?.mouse
      });
    }
    if (window.toolStateManager && window.toolStateManager.shouldBlockActions() && !event.isMobileTouch) {
      console.log('InteractionManager.onMouseClick - Actions blocked');
      return;
    }
    if (event.isMobileTouch && window.toolStateManager?.isToolActive('place-block')) {
      console.log('InteractionManager.onMouseClick - Taking mobile block placement path');
      this.handleMobileBlockPlacement(event);
      return;
    }
    if (window.toolStateManager && window.toolStateManager.isToolActive('move-mode')) {
      if (!this.manager.isOverSelectedAssetOrGizmo(event)) {
        if (window.placedAssets && window.placedAssets.selectedPlacedAsset) {
          window.placedAssets.deselectPlacedAsset();
        }
        window.toolStateManager.setTool('select-tool');
        return;
      }
    }
    if (window.placedAssets && window.placedAssets.isInteractingWithGizmo) return;

    if (document.getElementById('color-dropper').classList.contains('active')) {
      this.manager.raycastManager.raycaster.setFromCamera(this.manager.raycastManager.mouse, this.manager.camera);
      const intersects = this.manager.raycastManager.raycaster.intersectObjects(Object.values(window.gridBlocks), true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        for (const key in window.gridBlocks) {
          if (window.gridBlocks[key] === intersect.object) {
            const blockColor = window.gridBlocks[key].material.color.getHexString();
            document.getElementById('block-color').value = '#' + blockColor;
            break;
          }
        }
      }
      return;
    }

    this.manager.raycastManager.raycaster.setFromCamera(this.manager.raycastManager.mouse, this.manager.camera);
    const placedAssetModels = window.placedAssets.getModels();
    const intersects = this.manager.raycastManager.raycaster.intersectObjects([
      ...Object.values(window.gridBlocks),
      ...window.gridManager.getGroundCells(),
      ...placedAssetModels
    ], true);

    let clickedBlock = null, clickedAsset = null, clickedGroundCell = null;
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const clickedObject = intersect.object;
      if (clickedObject.userData.isGroundCell) clickedGroundCell = clickedObject;
      else {
        const blockKey = Object.keys(window.gridBlocks).find(key => window.gridBlocks[key] === clickedObject);
        if (blockKey) clickedBlock = window.gridBlocks[blockKey];
        else {
          const asset = window.placedAssets.getAssets().find(a => {
            let found = false; a.model.traverse(child => { if (child === clickedObject) found = true; }); return found;
          });
          if (asset) clickedAsset = asset;
        }
      }
    }

    if (document.getElementById('select-tool').classList.contains('active')) {
      const isCtrlClick = event.ctrlKey || event.metaKey;
      const isShiftClick = event.shiftKey;
      if (clickedBlock) window.blockTools.selectBlocks([clickedBlock], isCtrlClick, isShiftClick);
      else if (clickedGroundCell) window.blockSelectionManager.selectGroundCells([clickedGroundCell], isCtrlClick, isShiftClick);
      else if (clickedAsset) {
        window.blockTools.clearAllSelections();
        window.placedAssets.selectPlacedAsset(clickedAsset.id);
      } else {
        if (!isCtrlClick && !isShiftClick) {
          window.blockTools.clearAllSelections();
          if (window.placedAssets.selectedPlacedAsset) window.placedAssets.deselectPlacedAsset();
        }
      }
      return;
    }

    this.manager.raycastManager.raycaster.setFromCamera(this.manager.raycastManager.mouse, this.manager.camera);
    const placeIntersects = this.manager.raycastManager.raycaster.intersectObjects([
      ...window.gridManager.getGroundCells(), ...Object.values(window.gridBlocks)
    ], true);

    if (placeIntersects.length > 0) {
      const intersect = placeIntersects[0];
      const blockType = document.getElementById('block-type').value;

      let finalPosition = window.gridManager.calculatePlacementPosition(intersect, blockType);
      if (!finalPosition) { window.debugTools.updateDebugInfo(); return; }

      if (window.currentMode === 'place-asset' || document.getElementById('place-asset').classList.contains('active')) {
        if (window.selectedModel) {
          const clone = window.selectedModel.clone();
          clone.rotation.copy(window.selectedModel.rotation);

          const yOffset = window.selectedModel.userData.yOffset || 0;
          clone.position.set(
            Math.floor(finalPosition.x) + 0.5, 
            finalPosition.y + 0.5 - yOffset, 
            Math.floor(finalPosition.z) + 0.5
          );
          clone.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.scene.add(clone);
          const assetId = Date.now();
          const assetData = {
            id: assetId,
            model: clone,
            position: clone.position.clone(),
            url: window.selectedModel.userData.url,
            name: window.selectedModel.userData.name,
            type: 'scene object'
          };
          window.placedAssets.addPlacedAssetToList(assetData);
          window.debugInfo.lastAction = `Placed model at ${clone.position.toArray()}`;
          window.actionHistory.addAction(window.debugInfo.lastAction, {
            type: 'placeAsset',
            assetData: {
              id: assetId,
              url: assetData.url,
              name: assetData.name,
              position: {
                x: clone.position.x,
                y: clone.position.y,
                z: clone.position.z
              },
              rotation: {
                x: clone.rotation.x,
                y: clone.rotation.y,
                z: clone.rotation.z
              },
              scale: {
                x: clone.scale.x,
                y: clone.scale.y,
                z: clone.scale.z
              }
            }
          });
        }
      } else if (document.getElementById('place-block').classList.contains('active')) {
        const finalKey = `${finalPosition.x},${finalPosition.y},${finalPosition.z}`;
        if (window.toolStateManager.isFillMode()) {
          const dims = window.toolStateManager.getFillDimensions();
          const orientation = document.getElementById('block-orientation').value;
          const color = document.getElementById('block-color').value;
          for (let x = 0; x < dims.width; x++) {
            for (let y = 0; y < dims.height; y++) {
              for (let z = 0; z < dims.depth; z++) {
                const posX = finalPosition.x + x;
                const posY = finalPosition.y + y;
                const posZ = finalPosition.z + z;
                const fillKey = `${posX},${posY},${posZ}`;
                if (!window.gridBlocks[fillKey]) {
                  const block = window.placedBlocks.addBlock(
                    new THREE.Vector3(posX, posY, posZ),
                    blockType
                  );
                  if (block) {
                    if (Array.isArray(block.material)) {
                      block.material.forEach(mat => {
                        if (mat) mat.color.set(color);
                      });
                    } else if (block.material) {
                      block.material.color.set(color);
                    }
                    block.userData.orientation = orientation;
                    let rotation = 0; switch (orientation) { case 'east': rotation = Math.PI/2; break; case 'south': rotation = Math.PI; break; case 'west': rotation = -Math.PI/2; break; }
                    block.rotation.y = rotation;
                    window.gridBlocks[fillKey] = block;
                  }
                }
              }
            }
          }
          window.placedBlocks.updateBlocksList();
          window.debugInfo.lastAction = `Placed ${dims.width}x${dims.height}x${dims.depth} ${blockType} blocks at ${finalKey}`;
          window.actionHistory.addAction(window.debugInfo.lastAction, {
            type: 'placeFill',
            startKey: finalKey,
            dimensions: dims,
            blockType,
            color: document.getElementById('block-color').value,
            orientation: document.getElementById('block-orientation').value
          });
        } else {
          if (!window.gridBlocks[finalKey]) {
            const block = window.placedBlocks.addBlock(
              finalPosition,
              blockType
            );
            window.gridBlocks[finalKey] = block;
            window.placedBlocks.updateBlocksList();
            window.debugInfo.lastAction = `Placed ${blockType} block at ${finalKey}`;
            window.actionHistory.addAction(window.debugInfo.lastAction, {
              type: 'placeBlock',
              key: finalKey,
              position: {
                x: finalPosition.x,
                y: finalPosition.y,
                z: finalPosition.z
              },
              blockType
            });
          }
        }
      } else if (document.getElementById('remove-block').classList.contains('active')) {
        const foundBlock = this.manager.findBlockAtPoint(intersect.point);
        if (foundBlock) {
          const blockKey = foundBlock.userData.key;
          const blockData = this.manager.captureBlockStateForHistory(foundBlock);
          window.placedBlocks.removeBlock(blockKey);
          window.debugInfo.lastAction = `Removed block at ${blockKey}`;
          window.actionHistory.addAction(window.debugInfo.lastAction, {
            type: 'removeBlock',
            key: blockKey,
            position: {
              x: parseInt(blockKey.split(',')[0]),
              y: parseInt(blockKey.split(',')[1]),
              z: parseInt(blockKey.split(',')[2])
            },
            blockData: blockData
          });
        }
      }
      window.debugTools.updateDebugInfo();
    }

    if (event.isMobileTouch && this.manager.mobile.isMobileDevice()) {
      if (navigator.vibrate && document.getElementById('mobile-vibrate')?.checked) {
        navigator.vibrate(100);
      }
      this.manager.mobile.showMobileFeedback(event);
    }
  }

  handleMobileBlockPlacement(event) {
    console.log('InteractionManager.handleMobileBlockPlacement - Starting mobile placement', {
      hasRaycastManager: !!this.manager.raycastManager,
      hasGridManager: !!window.gridManager,
      mousePosition: this.manager.raycastManager?.mouse,
      cameraPosition: this.manager.camera?.position
    });

    this.manager.raycastManager.raycaster.setFromCamera(this.manager.raycastManager.mouse, this.manager.camera);
    const placeIntersects = this.manager.raycastManager.raycaster.intersectObjects([
      ...window.gridManager.getGroundCells(), ...Object.values(window.gridBlocks)
    ], true);

    console.log('InteractionManager.handleMobileBlockPlacement - Raycast results', {
      intersectCount: placeIntersects.length,
      firstIntersect: placeIntersects[0] ? {
        point: placeIntersects[0].point,
        objectType: placeIntersects[0].object.userData.isGroundCell ? 'ground' : 'block'
      } : null
    });

    if (placeIntersects.length === 0) return;

    const intersect = placeIntersects[0];
    const blockType = document.getElementById('block-type').value;

    let finalPosition = window.gridManager.calculatePlacementPosition(intersect, blockType);

    console.log('InteractionManager.handleMobileBlockPlacement - Placement calculation', {
      blockType,
      calculatedPosition: finalPosition,
      hasPlacedBlocks: !!window.placedBlocks
    });

    if (!finalPosition) return;

    const finalKey = `${finalPosition.x},${finalPosition.y},${finalPosition.z}`;

    if (window.toolStateManager.isFillMode()) {
      const dims = window.toolStateManager.getFillDimensions();
      const orientation = document.getElementById('block-orientation').value;
      const color = document.getElementById('block-color').value;
      for (let x = 0; x < dims.width; x++) {
        for (let y = 0; y < dims.height; y++) {
          for (let z = 0; z < dims.depth; z++) {
            const posX = finalPosition.x + x;
            const posY = finalPosition.y + y;
            const posZ = finalPosition.z + z;
            const fillKey = `${posX},${posY},${posZ}`;
            if (!window.gridBlocks[fillKey]) {
              const block = window.placedBlocks.addBlock(new THREE.Vector3(posX, posY, posZ), blockType);
              if (block) {
                if (Array.isArray(block.material)) {
                  block.material.forEach(m => m && m.color.set(color));
                } else if (block.material) {
                  block.material.color.set(color);
                }
                block.userData.orientation = orientation;
                let rotation = 0; switch (orientation) { case 'east': rotation = Math.PI/2; break; case 'south': rotation = Math.PI; break; case 'west': rotation = -Math.PI/2; break; }
                block.rotation.y = rotation;
                window.gridBlocks[fillKey] = block;
              }
            }
          }
        }
      }
      window.placedBlocks.updateBlocksList();
      window.debugInfo.lastAction = `Mobile placed ${dims.width}x${dims.height}x${dims.depth} ${blockType} blocks at ${finalKey}`;
      window.actionHistory.addAction(window.debugInfo.lastAction, {
        type: 'placeFill',
        startKey: finalKey, dimensions: dims, blockType,
        color: document.getElementById('block-color').value,
        orientation: document.getElementById('block-orientation').value
      });
    } else {
      if (!window.gridBlocks[finalKey]) {
        console.log('InteractionManager.handleMobileBlockPlacement - Attempting to place block', { finalKey, finalPosition, blockType });
        const block = window.placedBlocks.addBlock(finalPosition, blockType);
        if (block) {
          window.gridBlocks[finalKey] = block;
          window.placedBlocks.updateBlocksList();
          window.debugInfo.lastAction = `Mobile placed ${blockType} block at ${finalKey}`;
          window.actionHistory.addAction(window.debugInfo.lastAction, {
            type: 'placeBlock',
            key: finalKey, position: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z }, blockType
          });
          console.log('InteractionManager.handleMobileBlockPlacement - Block placed successfully', { blockKey: finalKey, block: !!block });
        } else {
          console.log('InteractionManager.handleMobileBlockPlacement - Failed to create block');
        }
      } else {
        console.log('InteractionManager.handleMobileBlockPlacement - Position already occupied', { finalKey, existingBlock: !!window.gridBlocks[finalKey] });
      }
    }

    if (navigator.vibrate && document.getElementById('mobile-vibrate')?.checked) {
      navigator.vibrate(100);
    }
    this.manager.mobile.showMobileFeedback(event);
    window.debugTools.updateDebugInfo();
  }
}
window.InteractionClickHandler = InteractionClickHandler;