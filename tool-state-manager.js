class ToolStateManager {
  constructor() {
    this.currentTool = 'place-block';
    this.previousTool = 'place-block'; // Track previous tool for auto-drag mode
    this.isDragging = false;
    this.isManualDragMode = false;
    this.lastDragEndTime = 0; // Track when drag ended to prevent immediate actions
    this.dragEndDebounceMs = 250; // Increased debounce period in milliseconds
    this.dragStartTime = 0; // Track when drag started
    this.dragThresholdMs = 150; // Minimum drag duration before switching to drag mode
    this.dragSwitchTimeout = null; // Timeout for delayed drag mode switch
    this.toolStates = {
      'place-block': { active: true, fillMode: false },
      'place-asset': { active: false },
      'color-dropper': { active: false },
      'select-tool': { active: false },
      'drag-mode': { active: false },
      'move-mode': { active: false },
      'rotation-mode': { active: false },
      'remove-block': { active: false }
    };
    
    this.fillPreviewOutline = null;
    this.initToolbarControls();
    this.initToolButtons();
  }

  initToolbarControls() {
    document.getElementById('fill-mode').addEventListener('change', (e) => {
      this.toolStates['place-block'].fillMode = e.target.checked;
      const fillControls = document.getElementById('fill-controls');
      fillControls.style.display = e.target.checked ? 'block' : 'none';
      
      // Cleanup outline when disabling
      if (!e.target.checked && this.fillPreviewOutline) {
        this.fillPreviewOutline.visible = false;
      }
      
      this.updateFillPreviewDisplay();
    });

    // Add fill preview section to fill controls
    const fillControls = document.getElementById('fill-controls');
    if (fillControls && !document.querySelector('.fill-preview')) {
      const fillPreview = document.createElement('div');
      fillPreview.className = 'fill-preview';
      fillPreview.innerHTML = `
        <div class="preview-dimensions">Fill Area: 1 × 1 × 1</div>
        <div class="position-preview">Starting at: (0, 0, 0)</div>
      `;
      fillControls.appendChild(fillPreview);
    }

    ['fill-width', 'fill-height', 'fill-depth'].forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1) e.target.value = 1;
        if (value > 32) e.target.value = 32;
        
        // Update fill preview display
        this.updateFillPreviewDisplay();
      });
    });
  }

  updateFillPreviewDisplay() {
    const previewDimensions = document.querySelector('.preview-dimensions');
    if (previewDimensions) {
      const dims = this.getFillDimensions();
      previewDimensions.textContent = `Fill Area: ${dims.width} × ${dims.height} × ${dims.depth}`;
      
      // Calculate total blocks
      const totalBlocks = dims.width * dims.height * dims.depth;
      const warning = totalBlocks > 1000 ? ' (Warning: Large area!)' : '';
      previewDimensions.textContent += ` (${totalBlocks} blocks${warning})`;
    }
  }

  updateFillPreview(gridPos, baseY, blockType) {
    if (!window.rendererManager) return;
    
    const scene = window.rendererManager.getScene();
    
    // Remove previous outline if it exists
    if (this.fillPreviewOutline) {
      scene.remove(this.fillPreviewOutline);
      this.fillPreviewOutline = null;
    }
    
    if (!this.isFillMode()) return;
    
    // Create a wireframe box to show the fill area
    const dims = this.getFillDimensions();
    
    // Always use full block height for fill outline regardless of block type
    // This ensures consistent height calculation in fill mode
    const height = dims.height;
    
    const geometry = new THREE.BoxGeometry(dims.width, height, dims.depth);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    
    this.fillPreviewOutline = new THREE.Mesh(geometry, wireframeMaterial);
    
    // Position the outline with the correct offset
    // Position at the center of the fill area
    this.fillPreviewOutline.position.set(
      gridPos.x + dims.width / 2,
      baseY + height / 2,
      gridPos.z + dims.depth / 2
    );
    
    // Apply same rotation as the block preview
    const orientation = document.getElementById('block-orientation').value;
    let rotation = 0;
    switch (orientation) {
      case 'east':
        rotation = Math.PI / 2;
        break;
      case 'south':
        rotation = Math.PI;
        break;
      case 'west':
        rotation = -Math.PI / 2;
        break;
    }
    this.fillPreviewOutline.rotation.y = rotation;
    
    scene.add(this.fillPreviewOutline);
    
    // Update the position preview
    const positionPreview = document.querySelector('.position-preview');
    if (positionPreview) {
      positionPreview.textContent = `Starting at: (${gridPos.x}, ${baseY}, ${gridPos.z})`;
    }
  }

  initToolButtons() {
    Object.keys(this.toolStates).forEach(toolId => {
      const button = document.getElementById(toolId);
      if (button) {
        button.addEventListener('click', () => {
          this.setTool(toolId);
        });
        
        if (this.toolStates[toolId].active) {
          button.classList.add('active');
        }
      }
    });
  }

  setTool(toolId) {
    // Track if user manually selected drag mode
    if (toolId === 'drag-mode') {
      this.isManualDragMode = true;
    } else {
      this.isManualDragMode = false;
    }

    // Store previous tool for auto-drag mode
    if (toolId !== 'drag-mode' && this.currentTool !== 'drag-mode') {
      this.previousTool = this.currentTool;
    }

    Object.keys(this.toolStates).forEach(id => {
      this.toolStates[id].active = false;
      const button = document.getElementById(id);
      if (button) {
        button.classList.remove('active');
      }
    });

    this.currentTool = toolId;
    this.toolStates[toolId].active = true;
    const button = document.getElementById(toolId);
    if (button) {
      button.classList.add('active');
    }

    // Add debug logging
    console.log(`Tool changed to: ${toolId}`);
    if (window.debugInfo) {
      window.debugInfo.lastAction = `Switched to tool: ${toolId}`;
      if (window.debugTools) {
        window.debugTools.updateDebugInfo();
      }
    }

    this.handleToolChange(toolId);
  }

  // Auto-switch to drag mode when dragging starts
  startDragMode() {
    if (this.isDragging || this.currentTool === 'drag-mode') return;
    
    // Don't auto-switch to drag mode when we're in move mode with a selected asset
    if (this.currentTool === 'move-mode' && window.placedAssets && window.placedAssets.selectedPlacedAsset) {
      return;
    }
    
    // Don't auto-switch to drag mode when interacting with gizmos
    if (window.placedAssets && window.placedAssets.isInteractingWithGizmo) {
      return;
    }
    
    // On mobile, don't auto-switch to drag mode for regular touches (only camera rotation control should trigger this)
    if (this.isMobileDevice()) {
      return;
    }
    
    this.dragStartTime = Date.now();
    
    // Clear any existing timeout
    if (this.dragSwitchTimeout) {
      clearTimeout(this.dragSwitchTimeout);
    }
    
    // Only switch to drag mode after a delay to avoid sensitivity issues
    this.dragSwitchTimeout = setTimeout(() => {
      if (!this.isDragging && this.currentTool !== 'drag-mode') {
        this.isDragging = true;
        this.previousTool = this.currentTool;
        this.setToolInternal('drag-mode');
      }
    }, this.dragThresholdMs);
  }

  // Auto-switch back to previous mode when dragging ends
  endDragMode() {
    // Clear the timeout if drag ended before threshold
    if (this.dragSwitchTimeout) {
      clearTimeout(this.dragSwitchTimeout);
      this.dragSwitchTimeout = null;
    }
    
    if (!this.isDragging || this.isManualDragMode) return;
    
    // Don't auto-switch back from move mode when we have a selected asset
    if (this.currentTool === 'move-mode' && window.placedAssets && window.placedAssets.selectedPlacedAsset) {
      return;
    }
    
    // Don't auto-switch back when interacting with gizmos
    if (window.placedAssets && window.placedAssets.isInteractingWithGizmo) {
      return;
    }
    
    // On mobile, don't auto-switch back (since we shouldn't have auto-switched in the first place)
    if (this.isMobileDevice()) {
      return;
    }
    
    const dragDuration = Date.now() - this.dragStartTime;
    
    // Only consider it a real drag if it lasted longer than threshold
    if (dragDuration >= this.dragThresholdMs) {
      this.isDragging = false;
      this.lastDragEndTime = Date.now(); // Record when drag ended
      this.setToolInternal(this.previousTool);
    } else {
      // Short interaction, don't treat as drag
      this.isDragging = false;
      this.lastDragEndTime = 0; // Don't block actions for short interactions
    }
  }

  // Internal method to set tool without affecting manual drag mode state
  setToolInternal(toolId) {
    Object.keys(this.toolStates).forEach(id => {
      this.toolStates[id].active = false;
      const button = document.getElementById(id);
      if (button) {
        button.classList.remove('active');
      }
    });

    this.currentTool = toolId;
    this.toolStates[toolId].active = true;
    const button = document.getElementById(toolId);
    if (button) {
      button.classList.add('active');
    }

    this.handleToolChange(toolId);
  }

  handleToolChange(toolId) {
    // First check if we need to clean up any existing preview
    if (window.modelPreview && window.rendererManager) {
      window.rendererManager.getScene().remove(window.modelPreview);
      window.modelPreview = null;
    }

    if (window.placementPreview) {
      window.placementPreview.visible = false;
    }

    window.currentMode = toolId;

    switch(toolId) {
      case 'place-block':
        window.selectedModel = null;
        if (window.placementPreview) {
          window.placementPreview.visible = true;
        }
        break;

      case 'place-asset':
        if (window.selectedModel) {
          // Create new preview model
          window.modelPreview = window.selectedModel.clone();
          if (window.modelPreview) {
            window.modelPreview.traverse(child => {
              if (child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.5;
              }
            });
            window.modelPreview.rotation.copy(window.selectedModel.rotation);
            if (window.rendererManager) {
              window.rendererManager.getScene().add(window.modelPreview);
              window.modelPreview.visible = true;
            }
          }
        }
        if (window.placementPreview) {
          window.placementPreview.visible = false;
        }
        break;

      case 'move-mode':
        // Hide all previews in asset manipulation modes
        window.selectedModel = null;
        if (window.modelPreview && window.rendererManager) {
          window.rendererManager.getScene().remove(window.modelPreview);
          window.modelPreview = null;
        }
        if (window.placementPreview) {
          window.placementPreview.visible = false;
        }
        // Clear block selections when switching to asset manipulation modes
        if (window.blockTools && window.blockTools.getSelectedBlock()) {
          window.blockTools.selectBlock(null);
        }
        console.log('Move mode activated');
        break;
        
      case 'rotation-mode':
        // Hide all previews in asset manipulation modes
        window.selectedModel = null;
        if (window.modelPreview && window.rendererManager) {
          window.rendererManager.getScene().remove(window.modelPreview);
          window.modelPreview = null;
        }
        if (window.placementPreview) {
          window.placementPreview.visible = false;
        }
        // Clear block selections when switching to asset manipulation modes
        if (window.blockTools && window.blockTools.getSelectedBlock()) {
          window.blockTools.selectBlock(null);
        }
        console.log('Rotation mode activated');
        break;

      case 'drag-mode':
        // Hide all previews in drag mode
        window.selectedModel = null;
        if (window.modelPreview && window.rendererManager) {
          window.rendererManager.getScene().remove(window.modelPreview);
          window.modelPreview = null;
        }
        if (window.placementPreview) {
          window.placementPreview.visible = false;
        }
        break;

      default:
        window.selectedModel = null;
        if (window.modelPreview && window.rendererManager) {
          window.rendererManager.getScene().remove(window.modelPreview);
          window.modelPreview = null;
        }
        break;
    }

    if (toolId !== 'select-tool' && toolId !== 'move-mode' && toolId !== 'rotation-mode') {
      if (window.blockTools && window.blockTools.getSelectedBlock()) {
        window.blockTools.selectBlock(null);
      }
      if (window.placedAssets && window.placedAssets.selectedPlacedAsset) {
        window.placedAssets.deselectPlacedAsset();
      }
    }

    // Clear fill preview outline when switching tools
    if (toolId !== 'place-block' && this.fillPreviewOutline) {
      this.fillPreviewOutline.visible = false;
    }
  }

  // Check if actions should be blocked due to recent drag
  shouldBlockActions() {
    // On mobile, don't block actions from drag detection (only rotation control should cause blocking)
    if (this.isMobileDevice()) {
      console.log('ToolStateManager.shouldBlockActions - Mobile device, not blocking actions');
      return false;
    }
    
    const timeSinceLastDrag = Date.now() - this.lastDragEndTime;
    const shouldBlock = timeSinceLastDrag < this.dragEndDebounceMs;
    
    if (shouldBlock) {
      console.log('ToolStateManager.shouldBlockActions - Blocking actions due to recent drag', {
        timeSinceLastDrag,
        debounceMs: this.dragEndDebounceMs
      });
    }
    
    return shouldBlock;
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  getCurrentTool() {
    return this.currentTool;
  }

  isToolActive(toolId) {
    return this.toolStates[toolId].active;
  }

  isFillMode() {
    return this.toolStates['place-block'].fillMode;
  }

  getFillDimensions() {
    return {
      width: parseInt(document.getElementById('fill-width').value) || 1,
      height: parseInt(document.getElementById('fill-height').value) || 1,
      depth: parseInt(document.getElementById('fill-depth').value) || 1
    };
  }

  activateAssetPlacement(model) {
    window.selectedModel = model;
    this.setTool('place-asset');
  }
}

window.ToolStateManager = ToolStateManager;