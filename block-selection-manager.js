class BlockSelectionManager {
  constructor(scene, gridBlocks) {
    this.scene = scene;
    this.gridBlocks = gridBlocks;
    this.selectedBlock = null;
    this.selectedBlocks = [];
    this.rangeSelectionStart = null;
    this.selectedGroundCells = [];
    this.rangeSelectionStartGroundCell = null;
  }

  selectBlock(block) {
    if (this.selectedBlock === block && this.selectedBlocks.length === 1) return;
    
    this.clearAllSelections();
    
    this.selectedBlock = block;
    
    if (this.selectedBlock && document.getElementById('select-tool').classList.contains('active')) {
      this.selectedBlocks = [this.selectedBlock];
      this.rangeSelectionStart = this.selectedBlock;
      window.blockTools.updateBlockUI(this.selectedBlock);
      this.addBlockOutline(this.selectedBlock);
    }
    
    window.blockTools.updateBlocksList();
  }

  selectBlocks(blocks, isCtrlClick = false, isShiftClick = false) {
    const targetBlock = blocks.length > 0 ? blocks[0] : null;

    if (!isCtrlClick && !isShiftClick) {
      this.clearGroundCellSelections();
    }

    if (!targetBlock) {
      if (!isCtrlClick && !isShiftClick) {
        this.clearBlockSelections();
      }
      return;
    }

    if (isShiftClick && this.rangeSelectionStart) {
      const rangeBlocks = this.getBlocksInRange(this.rangeSelectionStart, targetBlock);
      
      if (!isCtrlClick) {
        this.clearAllSelections();
      }
      
      rangeBlocks.forEach(block => {
        if (!this.selectedBlocks.includes(block)) {
          this.selectedBlocks.push(block);
          this.addBlockOutline(block);
        }
      });
      
      this.selectedBlock = targetBlock;
      window.blockTools.updateBlockUI(targetBlock);

    } else if (isCtrlClick) {
      if (this.selectedBlocks.includes(targetBlock)) {
        this.deselectBlock(targetBlock);
      } else {
        this.selectedBlocks.push(targetBlock);
        this.addBlockOutline(targetBlock);
        this.selectedBlock = targetBlock;
        this.rangeSelectionStart = targetBlock;
        window.blockTools.updateBlockUI(targetBlock);
      }
    } else {
      this.selectBlock(targetBlock);
    }
    
    window.blockTools.updateBlocksList();
  }

  getBlocksInRange(startBlock, endBlock) {
    const startKey = startBlock.userData.key;
    const endKey = endBlock.userData.key;
    
    const [startX, startY, startZ] = startKey.split(',').map(Number);
    const [endX, endY, endZ] = endKey.split(',').map(Number);
    
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    const minZ = Math.min(startZ, endZ);
    const maxZ = Math.max(startZ, endZ);
    
    const rangeBlocks = [];
    
    const existingYCoords = new Set();
    Object.keys(this.gridBlocks).forEach(key => {
      const [x, y, z] = key.split(',').map(Number);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ) {
        existingYCoords.add(y);
      }
    });
    
    if (existingYCoords.size === 0) {
      for (let y = minY; y <= maxY; y++) {
        existingYCoords.add(y);
      }
    }
    
    for (let x = minX; x <= maxX; x++) {
      for (const y of existingYCoords) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;
          if (this.gridBlocks[key]) {
            rangeBlocks.push(this.gridBlocks[key]);
          }
        }
      }
    }
    
    return rangeBlocks;
  }

  selectGroundCells(cells, isCtrlClick = false, isShiftClick = false) {
    const targetCell = cells.length > 0 ? cells[0] : null;

    if(!isCtrlClick && !isShiftClick) {
        this.clearBlockSelections();
    }

    if (!targetCell) {
        if (!isCtrlClick && !isShiftClick) {
            this.clearGroundCellSelections();
        }
        return;
    }

    if (isShiftClick && this.rangeSelectionStartGroundCell) {
        const rangeCells = this.getGroundCellsInRange(this.rangeSelectionStartGroundCell, targetCell);
        
        if (!isCtrlClick) {
            this.clearGroundCellSelections();
        }
        
        rangeCells.forEach(cell => {
            if (!this.selectedGroundCells.includes(cell)) {
                this.selectedGroundCells.push(cell);
                this.addGroundCellOutline(cell);
            }
        });

    } else if (isCtrlClick) {
        if (this.selectedGroundCells.includes(targetCell)) {
            const index = this.selectedGroundCells.indexOf(targetCell);
            if (index > -1) {
                this.selectedGroundCells.splice(index, 1);
                this.removeGroundCellOutline(targetCell);
            }
        } else {
            this.selectedGroundCells.push(targetCell);
            this.addGroundCellOutline(targetCell);
            this.rangeSelectionStartGroundCell = targetCell;
        }
    } else {
        this.clearGroundCellSelections();
        this.selectedGroundCells = [targetCell];
        this.addGroundCellOutline(targetCell);
        this.rangeSelectionStartGroundCell = targetCell;
    }
    this.updateGroundSelectionUI();
  }

  getGroundCellsInRange(startCell, endCell) {
    const startKey = startCell.userData.key;
    const endKey = endCell.userData.key;

    const [startX, startZ] = startKey.split(',').map(Number);
    const [endX, endZ] = endKey.split(',').map(Number);

    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minZ = Math.min(startZ, endZ);
    const maxZ = Math.max(startZ, endZ);

    const rangeCells = [];
    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
            const key = `${x},${z}`;
            if (window.groundCells[key]) {
                rangeCells.push(window.groundCells[key]);
            }
        }
    }
    return rangeCells;
  }

  deselectBlock(block) {
    const index = this.selectedBlocks.indexOf(block);
    if (index > -1) {
      this.selectedBlocks.splice(index, 1);
      this.removeBlockOutline(block);
      
      if (this.selectedBlock === block) {
        this.selectedBlock = this.selectedBlocks.length > 0 ? this.selectedBlocks[this.selectedBlocks.length - 1] : null;
        if (this.selectedBlock) {
          window.blockTools.updateBlockUI(this.selectedBlock);
        }
      }

      if (this.rangeSelectionStart === block) {
        this.rangeSelectionStart = this.selectedBlocks.length > 0 ? this.selectedBlocks[0] : null;
      }
    }
  }

  clearBlockSelections() {
    this.selectedBlocks.forEach(block => {
        this.removeBlockOutline(block);
    });
    this.selectedBlocks = [];
    this.selectedBlock = null;
    this.rangeSelectionStart = null;
    this.updateBlockUI(null);
  }
  
  clearGroundCellSelections() {
    this.selectedGroundCells.forEach(cell => {
        this.removeGroundCellOutline(cell);
    });
    this.selectedGroundCells = [];
    this.rangeSelectionStartGroundCell = null;
    this.updateGroundSelectionUI();
  }

  clearAllSelections() {
    this.clearBlockSelections();
    this.clearGroundCellSelections();
  }
  
  addBlockOutline(block) {
    if (block.userData.outline) {
      this.removeBlockOutline(block);
    }
    const outline = BlockOutlineManager.createOutline(block);
    this.scene.add(outline);
    block.userData.outline = outline;
  }

  removeBlockOutline(block) {
    if (block.userData.outline) {
      this.scene.remove(block.userData.outline);
      block.userData.outline = null;
    }
  }

  addGroundCellOutline(cell) {
    if (cell.userData.outline) {
        this.removeGroundCellOutline(cell);
    }
    const outlineGeo = new THREE.PlaneGeometry(1, 1);
    const edges = new THREE.EdgesGeometry(outlineGeo);
    const mat = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2,
        depthTest: false,
        transparent: true,
        opacity: 0.9
    });
    const outline = new THREE.LineSegments(edges, mat);
    outline.position.copy(cell.position);
    outline.rotation.copy(cell.rotation);
    outline.position.y += 0.015; // Lift slightly to avoid z-fighting with grid helper
    this.scene.add(outline);
    cell.userData.outline = outline;
  }

  removeGroundCellOutline(cell) {
    if (cell.userData.outline) {
        this.scene.remove(cell.userData.outline);
        cell.userData.outline = null;
    }
  }

  getSelectedBlock() {
    return this.selectedBlock;
  }

  getSelectedBlocks() {
    return this.selectedBlocks;
  }

  getSelectedGroundCells() {
    return this.selectedGroundCells;
  }
  
  isBlockSelected(block) {
    return this.selectedBlocks.includes(block);
  }

  isGroundCellSelected(cell) {
    return this.selectedGroundCells.includes(cell);
  }

  updateGroundSelectionUI() {
    const infoEl = document.getElementById('ground-selection-info');
    if (infoEl) {
        const count = this.selectedGroundCells.length;
        if (count === 0) {
            infoEl.textContent = 'No ground cells selected.';
        } else if (count === 1) {
            const key = this.selectedGroundCells[0].userData.key;
            infoEl.textContent = `1 ground cell selected at (${key}).`;
        } else {
            infoEl.textContent = `${count} ground cells selected.`;
        }
    }
  }

  updateBlockUI(block) {
      if (!block) {
          // You might want to clear or reset the UI when no block is selected
          // For now, it just returns to avoid errors.
          return;
      }
      if (Array.isArray(block.material) && block.material.length > 0) {
          if (block.material[0] && block.material[0].color) {
              document.getElementById('block-color').value = '#' + block.material[0].color.getHexString();
          }
      } else if (block.material && block.material.color) {
          document.getElementById('block-color').value = '#' + block.material.color.getHexString();
      }
      document.getElementById('block-orientation').value = block.userData.orientation || 'north';
      document.getElementById('block-type').value = block.userData.blockType || 'half';
  }
}

window.BlockSelectionManager = BlockSelectionManager;