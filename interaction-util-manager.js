class InteractionUtils {
  static isOverSelectedAssetOrGizmo(event, camera, raycastManager) {
    if (!window.placedAssets || !window.placedAssets.selectedPlacedAsset) return false;
    const rect = raycastManager.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    if (window.placedAssets.manipulationHelper) {
      const gizmoHits = rc.intersectObjects(window.placedAssets.manipulationHelper.children, true);
      if (gizmoHits.length > 0) return true;
    }
    const model = window.placedAssets.selectedPlacedAsset.model;
    const modelHits = rc.intersectObject(model, true);
    return modelHits.length > 0;
  }

  static findBlockAtPoint(point) {
    const blocks = Object.values(window.gridBlocks).filter(obj => obj.userData && obj.userData.blockType);
    const sortedBlocks = blocks.map(block => ({ block, distance: point.distanceTo(block.position) }))
                               .sort((a, b) => a.distance - b.distance);
    if (sortedBlocks.length > 0 && sortedBlocks[0].distance < 1.5) return sortedBlocks[0].block;
    const localRaycaster = new THREE.Raycaster();
    const directions = [
      new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 0, 0),  new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),  new THREE.Vector3(0, 0, -1)
    ];
    for (const dir of directions) {
      localRaycaster.set(point, dir);
      const intersects = localRaycaster.intersectObjects(blocks, false);
      if (intersects.length > 0 && intersects[0].distance < 0.8) return intersects[0].object;
    }
    return null;
  }

  static captureBlockStateForHistory(block) {
    const blockData = {
      type: block.userData.blockType || 'half',
      orientation: block.userData.orientation || 'north',
      key: block.userData.key
    };
    if (Array.isArray(block.material)) {
      blockData.materials = block.material.map(mat => {
        const matData = { color: mat?.color?.getHexString() || 'ffffff' };
        if (mat?.map?.userData?.url) matData.textureUrl = mat.map.userData.url;
        return matData;
      });
      blockData.color = block.material[0]?.color?.getHexString() || 'ffffff';
    } else if (block.material) {
      blockData.color = block.material.color?.getHexString() || 'ffffff';
      if (block.material.map?.userData?.url) blockData.textureUrl = block.material.map.userData.url;
    }
    return blockData;
  }
}
window.InteractionUtils = InteractionUtils;