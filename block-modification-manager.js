class BlockModificationManager {
  constructor(scene, gridBlocks, selectionManager) {
    this.scene = scene;
    this.gridBlocks = gridBlocks;
    this.selection = selectionManager;
  }

  updateBlockType(block, newType) {
    if (!block) return;

    const key = block.userData.key;
    const [x, y, z] = key.split(',').map(Number);
    let color = '';
    
    if (Array.isArray(block.material) && block.material.length > 0) {
      color = block.material[0].color.getHexString();
    } else if (block.material && block.material.color) {
      color = block.material.color.getHexString();
    } else {
      color = 'ffffff'; 
    }
    
    let textureMaps = [];
    if (Array.isArray(block.material)) {
      textureMaps = block.material.map(mat => mat?.map || null);
    } else if (block.material && block.material.map) {
      textureMaps = [block.material.map];
    }
    
    const orientation = block.userData.orientation || 'north';
    const previousType = block.userData.blockType;

    window.placedBlocks.removeBlock(key);

    const newBlock = window.placedBlocks.addBlock(
        new THREE.Vector3(x, y, z),
        newType
    );

    if (Array.isArray(newBlock.material)) {
      newBlock.material.forEach(mat => {
        if (mat) mat.color.set('#' + color);
      });
    } else if (newBlock.material) {
      newBlock.material.color.set('#' + color);
    }
    
    if (textureMaps.length > 0 && textureMaps.some(map => map !== null)) {
      const textureMap = textureMaps.find(map => map !== null);
      
      if (textureMap) {
        if (!Array.isArray(newBlock.material) && newType !== previousType) {
          const baseMaterial = newBlock.material.clone();
          const materialCount = newType === 'stair' ? 12 : 6;
          newBlock.material = Array(materialCount).fill().map(() => {
            const mat = baseMaterial.clone();
            mat.map = textureMap;
            mat.color.set('#' + color); 
            mat.needsUpdate = true;
            return mat;
          });
        } else if (Array.isArray(newBlock.material)) {
          newBlock.material.forEach(mat => {
            if (mat) {
              mat.map = textureMap;
              mat.color.set('#' + color); 
              mat.needsUpdate = true;
            }
          });
        } else {
          newBlock.material.map = textureMap;
          newBlock.material.color.set('#' + color); 
          newBlock.material.needsUpdate = true;
        }
      }
    }
    
    newBlock.userData.orientation = orientation;
    newBlock.userData.blockType = newType;

    let rotation = 0;
    switch (orientation) {
        case 'east': rotation = Math.PI / 2; break;
        case 'south': rotation = Math.PI; break;
        case 'west': rotation = -Math.PI / 2; break;
    }
    newBlock.rotation.y = rotation;

    const heightAdjustment = (newType === 'full') ? 0.5 : 
                            (newType === 'half') ? 0.25 : 
                            (newType === 'stair') ? 0.0 : 0.25;
    newBlock.position.y = y + heightAdjustment;

    window.debugInfo.lastAction = `Changed block type from ${previousType} to ${newType} at ${key}`;
    window.actionHistory.addAction(window.debugInfo.lastAction, {
        type: 'changeBlockType',
        key: key,
        previousType: previousType,
        newType: newType,
        position: { x, y, z }
    });
    window.debugTools.updateDebugInfo();

    window.gridBlocks[key] = newBlock;
    this.selection.selectBlock(newBlock);

    return newBlock;
  }

  updateBlockOrientation(block, newOrientation) {
    if (!block) return;

    const previousOrientation = block.userData.orientation;
    block.userData.orientation = newOrientation;

    let rotation = 0;
    switch (newOrientation) {
      case 'east': rotation = Math.PI / 2; break;
      case 'south': rotation = Math.PI; break;
      case 'west': rotation = -Math.PI / 2; break;
    }

    block.rotation.y = rotation;

    if (block.userData.outline) {
      block.userData.outline.rotation.y = rotation;
    }

    window.debugInfo.lastAction = `Changed block orientation from ${previousOrientation} to ${newOrientation}`;
    window.actionHistory.addAction(window.debugInfo.lastAction, {
      type: 'changeBlockOrientation',
      key: block.userData.key,
      previousOrientation: previousOrientation,
      newOrientation: newOrientation
    });
    window.debugTools.updateDebugInfo();

    window.blockTools.updateBlocksList();
  }

  updateBlockColor(block, newColor) {
    if (!block) return;
    
    const previousColor = Array.isArray(block.material) ? 
      block.material[0].color.getHexString() : 
      block.material.color.getHexString();
    
    if (Array.isArray(block.material)) {
      block.material.forEach(mat => {
        if (mat) mat.color.set(newColor);
      });
    } else if (block.material) {
      block.material.color.set(newColor);
    }
    
    return previousColor;
  }
}

window.BlockModificationManager = BlockModificationManager;