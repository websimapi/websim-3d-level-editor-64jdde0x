class MobileRaycastHandler {
  constructor(raycastManager) {
    this.raycastManager = raycastManager;
    this.renderer = raycastManager.renderer;
    this.camera = raycastManager.camera;
    this.scene = raycastManager.scene;

    // Mobile touch selection tracking
    this.touchStartPos = { x: 0, y: 0 };
    this.touchCurrentPos = { x: 0, y: 0 };
    this.touchStartTime = 0;
    this.isDragSelecting = false;
    this.dragThreshold = 10; // pixels
    this.selectedRegion = null;

    // Mobile long tap deletion tracking
    this.isLongTapping = false;
    this.longTapStartTime = 0;
    this.longTapThreshold = 800; // 800ms to start long tap
    this.longTapTimer = null;
    this.deletionInterval = null;
    this.deletionSpeed = 300; // Delete a block every 300ms
    this.longTapMovementThreshold = 15; // pixels - cancel long tap if moved too far
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false, capture: true });
    this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false, capture: true });
    this.renderer.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false, capture: true });
  }

  onTouchStart(event) {
    if (this.isTouchOnRotationControl(event.touches[0])) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStartPos.x = touch.clientX;
      this.touchStartPos.y = touch.clientY;
      this.touchStartTime = Date.now();
      this.isDragSelecting = false;
      this.longTapStartTime = Date.now();
      this.isLongTapping = false;
      
      this.longTapTimer = setTimeout(() => {
        this.startLongTapDeletion();
      }, this.longTapThreshold);
      
      this.raycastManager.updateMouse(touch.clientX, touch.clientY);
    }
  }

  onTouchMove(event) {
    if (this.isTouchOnRotationControl(event.touches[0])) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchCurrentPos.x = touch.clientX;
      this.touchCurrentPos.y = touch.clientY;
      
      const deltaX = Math.abs(this.touchCurrentPos.x - this.touchStartPos.x);
      const deltaY = Math.abs(this.touchCurrentPos.y - this.touchStartPos.y);
      const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (moveDistance > this.longTapMovementThreshold) {
        this.cancelLongTap();
      }
      
      if (moveDistance > this.dragThreshold && !this.isDragSelecting && !this.isLongTapping) {
        this.isDragSelecting = true;
      }
      
      this.raycastManager.updateMouse(touch.clientX, touch.clientY);
      this.raycastManager.updateRaycasting();
    }
  }

  onTouchEnd(event) {
    this.cancelLongTap();

    if (this.isTouchOnRotationControl(event.changedTouches[0])) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.raycastManager.updateMouse(touch.clientX, touch.clientY);
      
      const touchDuration = Date.now() - this.touchStartTime;
      const tapToPlaceEnabled = document.getElementById('mobile-tap-to-place')?.checked !== false;
      const vibrateEnabled = document.getElementById('mobile-vibrate')?.checked === true;
      
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      if (this.isDragSelecting) {
        this.isDragSelecting = false;
      } else if (tapToPlaceEnabled && touchDuration < 500 && window.toolStateManager?.isToolActive('place-block') && !this.wasLongTapping) {
        this.placeMobileBlock();
      }
    }
    
    this.wasLongTapping = this.isLongTapping;
    this.isLongTapping = false;
  }
  
  startLongTapDeletion() {
    this.isLongTapping = true;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    this.deletionInterval = setInterval(() => {
      this.deleteBlockAtCurrentPosition();
    }, this.deletionSpeed);
    
    this.deleteBlockAtCurrentPosition();
  }

  deleteBlockAtCurrentPosition() {
    if (!window.gridBlocks || !this.isLongTapping) return;

    this.raycastManager.raycaster.setFromCamera(this.raycastManager.mouse, this.camera);
    const intersects = this.raycastManager.raycaster.intersectObjects(Object.values(window.gridBlocks), true);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const foundBlock = this.raycastManager.findExactBlockAtPoint(intersect.point);
      
      if (foundBlock) {
        const blockKey = foundBlock.userData.key;
        const blockData = window.InteractionUtils.captureBlockStateForHistory(foundBlock);
        
        window.placedBlocks.removeBlock(blockKey);
        
        window.actionHistory.addAction(`Mobile long tap deleted block at ${blockKey}`, {
          type: 'removeBlock', key: blockKey,
          position: { x: parseInt(blockKey.split(',')[0]), y: parseInt(blockKey.split(',')[1]), z: parseInt(blockKey.split(',')[2]) },
          blockData: blockData
        });
        
        window.debugInfo.lastAction = `Mobile long tap deleted block at ${blockKey}`;
        window.debugTools.updateDebugInfo();
        
        if (navigator.vibrate) navigator.vibrate(30);
        this.showMobileBlockDeletedFeedback();
      }
    }
  }

  cancelLongTap() {
    if (this.longTapTimer) clearTimeout(this.longTapTimer);
    if (this.deletionInterval) clearInterval(this.deletionInterval);
    this.longTapTimer = null;
    this.deletionInterval = null;
    if (this.isLongTapping) this.isLongTapping = false;
  }

  showMobileBlockDeletedFeedback() {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(255, 100, 100, 0.8); color: white; padding: 8px 16px;
      border-radius: 4px; font-size: 14px; z-index: 10000; pointer-events: none;
    `;
    feedback.textContent = 'Block Deleted!';
    document.body.appendChild(feedback);
    setTimeout(() => { if (feedback.parentNode) document.body.removeChild(feedback); }, 800);
  }

  placeMobileBlock() {
    if (!window.gridManager || !window.placedBlocks) return;
    
    this.raycastManager.raycaster.setFromCamera(this.raycastManager.mouse, this.camera);
    const intersects = this.raycastManager.raycaster.intersectObjects([
        ...window.gridManager.getGroundCells(), ...Object.values(window.gridBlocks || {})
    ], true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const blockType = document.getElementById('block-type')?.value || 'half';
      const finalPosition = window.gridManager.calculatePlacementPosition(intersect, blockType);

      if (!finalPosition) return;
      const finalKey = `${finalPosition.x},${finalPosition.y},${finalPosition.z}`;
      if (window.gridBlocks[finalKey]) return;

      const block = window.placedBlocks.addBlock(finalPosition, blockType);
      if (block) {
        window.gridBlocks[finalKey] = block;
        window.placedBlocks.updateBlocksList();
        
        window.actionHistory.addAction(`Mobile placed ${blockType} block at ${finalKey}`, {
          type: 'placeBlock', key: finalKey,
          position: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z },
          blockType
        });
        
        window.debugInfo.lastAction = `Mobile placed ${blockType} block at ${finalKey}`;
        window.debugTools.updateDebugInfo();
        
        this.showMobileBlockPlacedFeedback();
      }
    }
  }

  showMobileBlockPlacedFeedback() {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0, 255, 0, 0.8); color: white; padding: 8px 16px;
      border-radius: 4px; font-size: 14px; z-index: 10000; pointer-events: none;
    `;
    feedback.textContent = 'Block Placed!';
    document.body.appendChild(feedback);
    setTimeout(() => { if (feedback.parentNode) document.body.removeChild(feedback); }, 1000);
  }

  isTouchOnRotationControl(touch) {
    const rotationControl = document.getElementById('mobile-rotation-control');
    if (!rotationControl) return false;
    const rect = rotationControl.getBoundingClientRect();
    return touch.clientX >= rect.left && touch.clientX <= rect.right && 
           touch.clientY >= rect.top && touch.clientY <= rect.bottom;
  }
}

window.MobileRaycastHandler = MobileRaycastHandler;