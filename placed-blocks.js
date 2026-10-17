class PlacedBlocks {
  constructor(scene) {
    this.scene = scene;
    this.gridBlocks = window.gridBlocks; 
    this.selectedBlock = null;
    this.initialBlockColor = null;
  }

  addBlock(position, blockType = document.getElementById('block-type').value) {
    let geometry;
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

    switch (blockType) {
      case 'full':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'stair':
        geometry = this.createStairGeometry();
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 0.5, 1);
    }

    // Create appropriate material based on block type
    let material;
    const blockColor = document.getElementById('block-color').value;
    
    if (blockType === 'stair') {
      // Stair blocks need 12 materials for the different faces
      material = Array(12).fill().map(() => {
        const mat = new THREE.MeshPhongMaterial({ color: blockColor });
        // Configure material for better shadow handling
        mat.shadowSide = THREE.DoubleSide;
        return mat;
      });
    } else {
      // Regular blocks can use a single material
      material = new THREE.MeshPhongMaterial({ 
        color: blockColor,
        shadowSide: THREE.DoubleSide
      });
    }

    const block = new THREE.Mesh(geometry, material);
    block.userData.initialColor = Array.isArray(material) ? 
      material[0].color.getHexString() : material.color.getHexString();
    block.userData.blockType = blockType;
    block.userData.orientation = orientation;

    // Enable shadows for better WebGPU/WebGL rendering with geometry-specific settings
    block.castShadow = true;
    block.receiveShadow = true;
    
    // Configure shadow properties based on block type for more accurate shadows
    if (Array.isArray(material)) {
      material.forEach(mat => {
        mat.shadowSide = THREE.DoubleSide;
        // Adjust material properties for half-blocks to cast accurate shadows
        if (blockType === 'half') {
          mat.alphaTest = 0.001;
        }
      });
    } else {
      material.shadowSide = THREE.DoubleSide;
      // Adjust material properties for half-blocks to cast accurate shadows
      if (blockType === 'half') {
        material.alphaTest = 0.001;
      }
    }

    // Adjust position based on block type
    const adjustedX = position.x + 0.5;
    // Handle non-integer y values from side placement
    const blockBaseY = Math.round(position.y * 2) / 2;
    const adjustedY = blockBaseY + (blockType === 'full' ? 0.5 : 
                                blockType === 'half' ? 0.25 : 
                                blockType === 'stair' ? 0.0 : 0.25);
    const adjustedZ = position.z + 0.5;

    block.position.set(adjustedX, adjustedY, adjustedZ);
    block.rotation.y = rotation;
    const key = `${position.x},${position.y},${position.z}`;
    block.userData.key = key;
    
    this.scene.add(block);
    this.gridBlocks[key] = block; 
    window.gridBlocks[key] = block; 
  
    if (!this.selectedBlock) {
      this.selectBlock(block);
    }

    return block;
  }

  clearAllBlocks() {
    Object.values(this.gridBlocks).forEach(block => {
      if (block.userData.outline) {
        this.scene.remove(block.userData.outline);
      }
      this.scene.remove(block);
    });
    
    for (let key in this.gridBlocks) {
      delete this.gridBlocks[key];
    }
    
    this.selectedBlock = null;
    this.updateBlocksList();
  }

  createStairGeometry() {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Bottom step
      // Front face (0)
      -0.5, 0.0, 0.5,    0.5, 0.0, 0.5,    0.5, 0.25, 0.5,   -0.5, 0.25, 0.5,
      // Back face (1)
      -0.5, 0.0, -0.5,   0.5, 0.0, -0.5,   0.5, 0.25, -0.5,  -0.5, 0.25, -0.5,
      // Left face (2)
      -0.5, 0.0, -0.5,  -0.5, 0.0, 0.5,   -0.5, 0.25, 0.5,  -0.5, 0.25, -0.5,
      // Right face (3)
      0.5, 0.0, -0.5,    0.5, 0.0, 0.5,    0.5, 0.25, 0.5,   0.5, 0.25, -0.5,
      // Top face (4)
      -0.5, 0.25, -0.5,  -0.5, 0.25, 0.5,   0.5, 0.25, 0.5,   0.5, 0.25, -0.5,
      // Bottom face (5)
      -0.5, 0.0, -0.5,   -0.5, 0.0, 0.5,    0.5, 0.0, 0.5,    0.5, 0.0, -0.5,

      // Top step
      // Front face (6)
      -0.5, 0.25, 0.5,   0.0, 0.25, 0.5,    0.0, 0.5, 0.5,    -0.5, 0.5, 0.5,
      // Back face (7)
      -0.5, 0.25, -0.5,  0.0, 0.25, -0.5,   0.0, 0.5, -0.5,   -0.5, 0.5, -0.5,
      // Left face (8)
      -0.5, 0.25, -0.5,  -0.5, 0.25, 0.5,   -0.5, 0.5, 0.5,   -0.5, 0.5, -0.5,
      // Right face (9)
      0.0, 0.25, -0.5,   0.0, 0.25, 0.5,    0.0, 0.5, 0.5,    0.0, 0.5, -0.5,
      // Top face (10)
      -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5,    0.0, 0.5, 0.5,    0.0, 0.5, -0.5,
      // Remaining right face of bottom step (11)
      0.0, 0.25, -0.5,   0.0, 0.25, 0.5,    0.5, 0.25, 0.5,   0.5, 0.25, -0.5
    ]);

    const indices = new Uint16Array([
      // Bottom step
      0, 1, 2,    0, 2, 3,    // Front (0)
      5, 4, 7,    5, 7, 6,    // Back (1)
      8, 9, 10,   8, 10, 11,  // Left (2)
      13, 12, 15, 13, 15, 14, // Right (3)
      16, 17, 18, 16, 18, 19, // Top (4)
      20, 22, 21, 20, 23, 22, // Bottom (5)

      // Top step
      24, 25, 26, 24, 26, 27, // Front (6)
      29, 28, 31, 29, 31, 30, // Back (7)
      32, 33, 34, 32, 34, 35, // Left (8)
      37, 36, 39, 37, 39, 38, // Right (9)
      40, 41, 42, 40, 42, 43, // Top (10)
      45, 44, 47, 45, 47, 46  // Remaining right face (11)
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    // Add UV coordinates for proper texture mapping
    const uvs = new Float32Array([
      // Bottom step
      0, 0, 1, 0, 1, 0.5, 0, 0.5, // Front
      0, 0, 1, 0, 1, 0.5, 0, 0.5, // Back
      0, 0, 1, 0, 1, 0.5, 0, 0.5, // Left
      0, 0, 1, 0, 1, 0.5, 0, 0.5, // Right
      0, 0, 1, 0, 1, 1, 0, 1,     // Top
      0, 0, 1, 0, 1, 1, 0, 1,     // Bottom
      
      // Top step
      0, 0, 0.5, 0, 0.5, 0.5, 0, 0.5, // Front
      0, 0, 0.5, 0, 0.5, 0.5, 0, 0.5, // Back
      0, 0, 0.5, 0, 0.5, 0.5, 0, 0.5, // Left
      0, 0, 0.5, 0, 0.5, 0.5, 0, 0.5, // Right
      0, 0, 1, 0, 1, 0.5, 0, 0.5,     // Top
      0, 0, 1, 0, 1, 1, 0, 1         // Remaining right
    ]);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // Store material groups for each face to enable separate materials
    geometry.clearGroups();
    for (let i = 0; i < 12; i++) {
      geometry.addGroup(i * 6, 6, i); // Each face has 2 triangles = 6 vertices
    }
    
    return geometry;
  }

  removeBlock(key) {
    if (this.gridBlocks[key]) {
      const block = this.gridBlocks[key];
      if (block.userData.outline) {
        this.scene.remove(block.userData.outline);
      }
      this.scene.remove(block);
      
      if (this.selectedBlock && this.selectedBlock.userData.key === key) {
        this.selectBlock(null);
      }
      
      delete this.gridBlocks[key];
      delete window.gridBlocks[key]; 
      
      this.updateBlocksList();
    }
  }

  selectBlock(block) {
    if (this.selectedBlock === block) return;
    
    if (this.selectedBlock) {
        this.removeBlockOutline(this.selectedBlock);
    }
    
    this.selectedBlock = block;
    
    if (this.selectedBlock && document.getElementById('select-tool').classList.contains('active')) {
        // Handle material color properly for both single and multi-material blocks
        if (Array.isArray(this.selectedBlock.material)) {
            document.getElementById('block-color').value = '#' + this.selectedBlock.material[0].color.getHexString();
        } else if (this.selectedBlock.material && this.selectedBlock.material.color) {
            document.getElementById('block-color').value = '#' + this.selectedBlock.material.color.getHexString();
        }
        document.getElementById('block-orientation').value = this.selectedBlock.userData.orientation || 'north';
        document.getElementById('block-type').value = this.selectedBlock.userData.blockType || 'half';
        this.addBlockOutline(this.selectedBlock);
    }
    
    this.updateBlocksList();
  }

  addBlockOutline(block) {
    if (block.userData.outline) {
      this.removeBlockOutline(block);
    }

    let geometry;
    switch (block.userData.blockType) {
      case 'full':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'stair':
        geometry = this.createStairGeometry();
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 0.5, 1);
    }

    const edges = new THREE.EdgesGeometry(geometry);
    const outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 })
    );

    outline.position.copy(block.position);
    outline.rotation.copy(block.rotation);
    outline.scale.set(1.02, 1.02, 1.02);
    
    this.scene.add(outline);
    block.userData.outline = outline;
  }

  removeBlockOutline(block) {
    if (block.userData.outline) {
      this.scene.remove(block.userData.outline);
      block.userData.outline = null;
    }
  }

  updateBlocksList() {
    if (this.selectedBlock) {
      this.initialBlockColor = null;
    }

    const blocksList = document.getElementById('placed-blocks-list');
    const scrollTop = blocksList.scrollTop;
    blocksList.innerHTML = '';

    Object.entries(this.gridBlocks).forEach(([key, block]) => {
      const blockItem = document.createElement('div');
      blockItem.className = 'block-item';
      
      if (this.selectedBlock && this.selectedBlock.userData.key === key) {
        blockItem.classList.add('selected-block');
      }

      const [x, y, z] = key.split(',').map(Number);
      blockItem.textContent = `${block.userData.blockType || 'half'} Block at (${x}, ${y}, ${z}) facing ${block.userData.orientation || 'north'}`;
      
      blockItem.addEventListener('click', () => {
        this.selectBlock(block);
      });

      blocksList.appendChild(blockItem);
    });

    blocksList.scrollTop = scrollTop;
  }

  getSelectedBlock() {
    return this.selectedBlock;
  }

  setSelectedBlock(block) {
    this.selectBlock(block);
  }

  getGridBlocks() {
    return this.gridBlocks;
  }
}

window.PlacedBlocks = PlacedBlocks;