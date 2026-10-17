class BlockGeometryManager {
  static createGeometry(blockType) {
    switch (blockType) {
      case 'full':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'stair':
        return BlockGeometryManager.createStairGeometry();
      default:
        return new THREE.BoxGeometry(1, 0.5, 1);
    }
  }

  static createStairGeometry() {
    // Prefer the more complete stair geometry if provided by PlacedBlocks
    if (window.placedBlocks && typeof window.placedBlocks.createStairGeometry === 'function') {
      return window.placedBlocks.createStairGeometry();
    }
    // Fallback to simplified two-box merge
    const stairGeo = new THREE.BoxGeometry(1, 0.5, 1);
    const topStepGeo = new THREE.BoxGeometry(0.5, 0.5, 1);
    topStepGeo.translate(-0.25, 0.25, 0);
    return BufferGeometryUtils.mergeBufferGeometries([stairGeo, topStepGeo]);
  }
}

window.BlockGeometryManager = BlockGeometryManager;

