class BlockMaterialManager {
  static createMaterial(blockType, colorHex) {
    if (blockType === 'stair') {
      // Stair blocks get 12 face materials
      return Array(12)
        .fill()
        .map(() => new THREE.MeshPhongMaterial({ color: colorHex }));
    }
    // Full and half blocks use a single material
    return new THREE.MeshPhongMaterial({ color: colorHex });
  }
}

window.BlockMaterialManager = BlockMaterialManager;