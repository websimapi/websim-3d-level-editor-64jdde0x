class GroundTextureHistoryCommands {
  static undo(action) {
    const d = action.data;
    switch (d.type) {
      case 'applyGroundTextureBatch':
        {
            d.batchData.forEach(cellData => {
                const [x, z] = cellData.cellKey.split(',').map(Number);
                const cell = window.gridManager.getGroundCell(x, z);
                if (cell) {
                    if (cellData.wasDefault) {
                        // Revert to using the shared default material
                        cell.material = window.gridManager.defaultGroundMaterial;
                    } else if (cellData.previousTextureUrl) {
                        // Restore previous custom texture
                        const loader = new THREE.TextureLoader();
                        loader.load(cellData.previousTextureUrl, tex => {
                            tex.userData = { url: cellData.previousTextureUrl };
                            cell.material.map = tex;
                            cell.material.color.set(0xffffff);
                            cell.material.needsUpdate = true;
                        });
                    } else {
                        // It was custom but had no texture, so remove map
                        cell.material.map = null;
                        cell.material.color.set(0x555555); // revert to default color
                        cell.material.needsUpdate = true;
                    }
                }
            });
        }
        break;

      case 'removeGroundTextureBatch':
        {
          d.batchData.forEach(cellData => {
            const [x, z] = cellData.cellKey.split(',').map(Number);
            const cell = window.gridManager.getGroundCell(x, z);
            if (cell && cellData.previousTextureUrl) {
                const loader = new THREE.TextureLoader();
                loader.load(cellData.previousTextureUrl, tex => {
                    tex.userData = { url: cellData.previousTextureUrl };
                    if (cell.material === window.gridManager.defaultGroundMaterial) {
                        cell.material = cell.material.clone();
                    }
                    cell.material.map = tex;
                    cell.material.color.set(0xffffff);
                    cell.material.needsUpdate = true;
                });
            }
          });
        }
        break;
      
      default:
        return false; // Not handled by this command handler
    }
    return true; // Handled successfully
  }

  static redo(action) {
    const d = action.data;
    switch (d.type) {
      case 'applyGroundTextureBatch':
        {
            const loader = new THREE.TextureLoader();
            loader.load(d.textureUrl, tex => {
                tex.userData = { url: d.textureUrl };
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;

                d.batchData.forEach(cellData => {
                    const [x, z] = cellData.cellKey.split(',').map(Number);
                    const cell = window.gridManager.getGroundCell(x, z);
                    if (cell) {
                        if (cell.material === window.gridManager.defaultGroundMaterial) {
                            cell.material = cell.material.clone();
                        }
                        cell.material.map = tex;
                        cell.material.color.set(0xffffff);
                        cell.material.needsUpdate = true;
                    }
                });
            });
        }
        break;

      case 'removeGroundTextureBatch':
        {
          d.batchData.forEach(cellData => {
            const [x, z] = cellData.cellKey.split(',').map(Number);
            const cell = window.gridManager.getGroundCell(x, z);
            if(cell) {
              cell.material = window.gridManager.defaultGroundMaterial;
            }
          });
        }
        break;
      
      default:
        return false; // Not handled by this command handler
    }
    return true; // Handled successfully
  }
}

window.GroundTextureHistoryCommands = GroundTextureHistoryCommands;