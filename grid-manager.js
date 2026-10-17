class GridManager {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 32;
    this.gridWidth = 32;
    this.gridHeight = 32;
    this.groundCells = window.groundCells;
    this.defaultGroundMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 10 });
    this.gridHelper = null;
    this.init();
    this.initWorldSizeControls();
  }

  init() {
    this.createGroundCells();
    this.createGridHelper();
  }

  createGroundCells() {
    // Clear existing ground cells
    Object.values(this.groundCells).forEach(cell => {
      this.scene.remove(cell);
    });
    this.groundCells = {};
    window.groundCells = {};

    // Create ground cells based on current grid size
    const groundGeometry = new THREE.PlaneGeometry(1, 1);
    
    // Calculate proper bounds for both even and odd grid sizes
    const startX = -Math.floor(this.gridWidth / 2);
    const endX = Math.ceil(this.gridWidth / 2);
    const startZ = -Math.floor(this.gridHeight / 2);
    const endZ = Math.ceil(this.gridHeight / 2);
    
    for (let i = startX; i < endX; i++) {
      for (let j = startZ; j < endZ; j++) {
        const groundCell = new THREE.Mesh(groundGeometry, this.defaultGroundMaterial);
        groundCell.rotation.x = -Math.PI / 2;
        groundCell.position.set(i + 0.5, 0, j + 0.5);
        groundCell.userData.isGroundCell = true;
        
        // Configure ground shadow properties to prevent artifacts
        groundCell.receiveShadow = true;
        groundCell.castShadow = false; // Ground shouldn't cast shadows
        
        // Adjust material shadow properties
        this.defaultGroundMaterial.shadowSide = THREE.DoubleSide;
        
        const key = `${i},${j}`;
        groundCell.userData.key = key;
        this.scene.add(groundCell);
        this.groundCells[key] = groundCell;
        window.groundCells[key] = groundCell;
      }
    }
  }

  createGridHelper() {
    // Remove existing grid helper
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
    }

    // Create new grid helper with current size
    const maxSize = Math.max(this.gridWidth, this.gridHeight);
    this.gridHelper = new THREE.GridHelper(maxSize, maxSize);
    
    // For odd-sized grids, offset the grid helper to align with ground cell boundaries
    // This ensures grid lines align with cell boundaries rather than cell centers
    const offsetX = (this.gridWidth % 2 === 1) ? 0.5 : 0;
    const offsetZ = (this.gridHeight % 2 === 1) ? 0.5 : 0;
    
    this.gridHelper.position.set(offsetX, 0.01, offsetZ);
    this.scene.add(this.gridHelper);
  }

  initWorldSizeControls() {
    const widthInput = document.getElementById('world-width');
    const heightInput = document.getElementById('world-height');
    const sizeDisplay = document.getElementById('world-size-display');
    const warningElement = document.getElementById('world-size-warning');
    const applyButton = document.getElementById('apply-world-size');

    const updateSizeDisplay = () => {
      const width = parseInt(widthInput.value) || 32;
      const height = parseInt(heightInput.value) || 32;
      const totalCells = width * height;
      
      sizeDisplay.textContent = `Current: ${width} × ${height} (${totalCells.toLocaleString()} cells)`;
      
      // Show warning for large worlds
      if (width > 256 || height > 256 || totalCells > 65536) {
        warningElement.style.display = 'block';
      } else {
        warningElement.style.display = 'none';
      }
    };

    widthInput.addEventListener('input', updateSizeDisplay);
    heightInput.addEventListener('input', updateSizeDisplay);

    applyButton.addEventListener('click', () => {
      const newWidth = parseInt(widthInput.value) || 32;
      const newHeight = parseInt(heightInput.value) || 32;
      
      // Validate bounds
      if (newWidth < 1 || newWidth > 1024 || newHeight < 1 || newHeight > 1024) {
        alert('World size must be between 1 and 1024 for both dimensions.');
        return;
      }

      // Show confirmation for large worlds
      if (newWidth > 512 || newHeight > 512 || (newWidth * newHeight) > 262144) {
        if (!confirm('Large worlds may cause performance issues and stability problems. Are you sure you want to continue?')) {
          return;
        }
      }

      this.setWorldSize(newWidth, newHeight);
    });

    // Initialize display
    updateSizeDisplay();
  }

  setWorldSize(width, height) {
    const previousWidth = this.gridWidth;
    const previousHeight = this.gridHeight;
    
    this.gridWidth = width;
    this.gridHeight = height;
    this.gridSize = Math.max(width, height); // Keep gridSize for compatibility
    
    // Update UI inputs
    document.getElementById('world-width').value = width;
    document.getElementById('world-height').value = height;
    
    // Recreate ground cells and grid helper
    this.createGroundCells();
    this.createGridHelper();
    
    // Clear any blocks that are outside the new world bounds
    this.clearBlocksOutsideBounds();
    
    // Update placed blocks list
    if (window.placedBlocks) {
      window.placedBlocks.updateBlocksList();
    }
    
    // Record action for undo/redo
    if (window.actionHistory) {
      window.actionHistory.addAction(`Changed world size from ${previousWidth}×${previousHeight} to ${width}×${height}`, {
        type: 'changeWorldSize',
        previousWidth: previousWidth,
        previousHeight: previousHeight,
        newWidth: width,
        newHeight: height
      });
    }
    
    window.debugInfo.lastAction = `World size changed to ${width}×${height}`;
    window.debugTools.updateDebugInfo();
  }

  clearBlocksOutsideBounds() {
    const halfWidth = Math.floor(this.gridWidth / 2);
    const halfHeight = Math.floor(this.gridHeight / 2);
    
    const blocksToRemove = [];
    
    Object.keys(window.gridBlocks).forEach(key => {
      const [x, y, z] = key.split(',').map(Number);
      
      // Check if block is outside new bounds
      if (x < -halfWidth || x >= halfWidth || z < -halfHeight || z >= halfHeight) {
        blocksToRemove.push(key);
      }
    });
    
    // Remove blocks outside bounds
    blocksToRemove.forEach(key => {
      if (window.placedBlocks) {
        window.placedBlocks.removeBlock(key);
      }
    });
    
    if (blocksToRemove.length > 0) {
      console.log(`Removed ${blocksToRemove.length} blocks outside new world bounds`);
    }
  }

  getWorldSize() {
    return {
      width: this.gridWidth,
      height: this.gridHeight
    };
  }

  getGridPosition(point) {
    return {
      x: Math.floor(point.x),
      z: Math.floor(point.z)
    };
  }

  getHighestBlockAt(x, z) {
    let maxY = 0;
    
    // Check blocks
    for (let key in window.gridBlocks) {
      const [bx, by, bz] = key.split(',').map(Number);
      if (Math.floor(bx) === Math.floor(x) && Math.floor(bz) === Math.floor(z)) {
        // Add proper height based on block type
        const block = window.gridBlocks[key];
        const blockHeight = block.userData.blockType === 'full' ? 1 : 
                           block.userData.blockType === 'half' ? 0.5 : 
                           block.userData.blockType === 'stair' ? 0.5 : 0.5;
        maxY = Math.max(maxY, by + blockHeight);
      }
    }

    // Check placed assets
    if (window.placedAssets) {
      const assets = window.placedAssets.getPlacedAssets();
      assets.forEach(asset => {
        const pos = asset.model.position;
        if (Math.floor(pos.x - 0.5) === Math.floor(x) && 
            Math.floor(pos.z - 0.5) === Math.floor(z)) {
          maxY = Math.max(maxY, pos.y - 0.25);
        }
      });
    }

    return maxY;
  }

  getGroundCells() {
    return Object.values(this.groundCells);
  }

  getGroundCell(x, z) {
      return this.groundCells[`${x},${z}`];
  }

  setDefaultTexture(textureUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.defaultGroundMaterial.map = texture;
        this.defaultGroundMaterial.color.set(0xffffff); // Use texture color
        this.defaultGroundMaterial.needsUpdate = true;
        this.defaultGroundMaterial.userData = { url: textureUrl };
    });
  }
  
  getDefaultGroundTextureUrl() {
      return this.defaultGroundMaterial.userData?.url || null;
  }

  calculatePlacementPosition(intersect, blockType) {
    let targetGridPos;

    if (intersect.object.userData.isGroundCell) {
        const gridPos = this.getGridPosition(intersect.point);
        const highestY = this.getHighestBlockAt(gridPos.x, gridPos.z);
        targetGridPos = new THREE.Vector3(gridPos.x, highestY, gridPos.z);
    } else {
        const hitBlock = intersect.object;
        const normal = intersect.face.normal.clone().transformDirection(hitBlock.matrixWorld).round();
        const hitBlockKeyPos = new THREE.Vector3(...hitBlock.userData.key.split(',').map(Number));
        const hitBlockHeight = hitBlock.userData.blockType === 'full' ? 1.0 : 0.5;

        if (normal.y === 1) { // Placing on top
            targetGridPos = new THREE.Vector3(hitBlockKeyPos.x, hitBlockKeyPos.y + hitBlockHeight, hitBlockKeyPos.z);
        } else if (normal.y === -1) { // Placing on bottom
            const newBlockHeight = blockType === 'full' ? 1.0 : 0.5;
            targetGridPos = new THREE.Vector3(hitBlockKeyPos.x, hitBlockKeyPos.y - newBlockHeight, hitBlockKeyPos.z);
        } else { // Placing on a side
            targetGridPos = hitBlockKeyPos.clone().add(normal);
            const yGridStep = 0.5;
            targetGridPos.y = Math.round(intersect.point.y / yGridStep) * yGridStep;
        }
    }
    
    // Check for collision and find a valid final position
    const isFullBlock = blockType === 'full';
    const checkCollision = (pos) => {
        const key1 = `${pos.x},${pos.y},${pos.z}`;
        if (isFullBlock) {
            const key2 = `${pos.x},${pos.y + 0.5},${pos.z}`;
            return window.gridBlocks[key1] || window.gridBlocks[key2];
        }
        return window.gridBlocks[key1];
    };

    let finalGridPos = targetGridPos.clone();
    // If the initial target position is occupied, try moving it up.
    // This handles the "auto-snap" behavior.
    if (checkCollision(finalGridPos)) {
        finalGridPos.y += 0.5;
        // If it's still colliding, there's no valid simple snap, so we can't place here.
        if (checkCollision(finalGridPos)) {
            return null; // Invalid placement
        }
    }
    
    return finalGridPos;
  }
}

window.GridManager = GridManager;