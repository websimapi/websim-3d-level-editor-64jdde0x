class BlockOutlineManager {
  static createOutline(block) {
    const type = block.userData.blockType;
    let outlineGeo;
    switch (type) {
      case 'full':
        outlineGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        break;
      case 'stair':
        outlineGeo = BlockOutlineManager.createStairOutlineGeometry();
        break;
      default:
        outlineGeo = new THREE.BoxGeometry(1.02, 0.52, 1.02);
    }
    const edges = new THREE.EdgesGeometry(outlineGeo);
    const mat = new THREE.LineBasicMaterial({
      color: 0x0088ff,
      linewidth: 2,
      depthTest: false,
      transparent: true,
      opacity: 0.8
    });
    const outline = new THREE.LineSegments(edges, mat);
    outline.position.copy(block.position);
    outline.rotation.copy(block.rotation);
    return outline;
  }

  static createStairOutlineGeometry() {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Bottom step
      -0.51, -0.01, 0.51,   0.51, -0.01, 0.51,   0.51, 0.26, 0.51,  -0.51, 0.26, 0.51,
      -0.51, -0.01, -0.51,  0.51, -0.01, -0.51,  0.51, 0.26, -0.51, -0.51, 0.26, -0.51,
      -0.51, 0.26, 0.51,    0.0, 0.26, 0.51,     0.0, 0.51, 0.51,   -0.51, 0.51, 0.51,
      -0.51, 0.26, -0.51,   0.0, 0.26, -0.51,    0.0, 0.51, -0.51,  -0.51, 0.51, -0.51,
      -0.51, 0.51, -0.51,   -0.51, 0.51, 0.51,   0.0, 0.51, 0.51,   0.0, 0.51, -0.51,
      0.0, 0.26, -0.51,     0.0, 0.26, 0.51,     0.51, 0.26, 0.51,  0.51, 0.26, -0.51
    ]);
    const indices = new Uint16Array([
      0,1, 1,2, 2,3, 3,0,      // front
      4,5, 5,6, 6,7, 7,4,      // back
      0,4, 1,5, 2,6, 3,7,      // connect front/back
      8,9, 9,10, 10,11, 11,8,  // top front
      12,13, 13,14, 14,15, 15,12, // top back
      8,12, 9,13, 10,14, 11,15,   // connect top
      16,17, 17,18, 18,19, 19,16, // top face
      20,21, 21,22, 22,23, 23,20  // middle
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    return geometry;
  }
}

window.BlockOutlineManager = BlockOutlineManager;