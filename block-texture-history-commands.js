class BlockTextureHistoryCommands {
  static undo(action) {
    const d = action.data;
    switch (d.type) {
      case 'applyTexture':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.blockKey];
          if (blk && d.previousMaterials) {
            // If the original material was not an array, restore it
            if (d.previousMaterials.length === 1 && !Array.isArray(blk.material)) {
              const prevMat = d.previousMaterials[0];
              blk.material.map = prevMat.map || null;
              blk.material.color.set('#' + prevMat.color);
            } else {
              // Restore materials from the array
              d.previousMaterials.forEach((prevMat, index) => {
                if (blk.material[index]) {
                  blk.material[index].map = prevMat.map || null;
                  blk.material[index].color.set('#' + prevMat.color);
                  blk.material[index].needsUpdate = true;
                }
              });
              // If the number of materials changed, we might need to recreate the material array
              if (blk.material.length !== d.previousMaterials.length) {
                 const newMaterials = d.previousMaterials.map(pm => {
                     const newMat = new THREE.MeshPhongMaterial();
                     newMat.map = pm.map || null;
                     newMat.color.set('#' + pm.color);
                     return newMat;
                 });
                 // If original was single, convert back to single
                 if (d.previousMaterials.length === 1) {
                    blk.material = newMaterials[0];
                 } else {
                    blk.material = newMaterials;
                 }
              }
            }
            
            if (Array.isArray(blk.material)) {
                blk.material.forEach(m => m.needsUpdate = true);
            } else {
                blk.material.needsUpdate = true;
            }
            
            // Update UI if this block is currently selected
            if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
              window.blockTools.updateBlockUI(blk);
            }
          }
        }
        break;

      case 'applyTextureBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if (blk && blockData.previousMaterials) {
              // If the original material was not an array, restore it
              if (blockData.previousMaterials.length === 1 && !Array.isArray(blk.material)) {
                const prevMat = blockData.previousMaterials[0];
                blk.material.map = prevMat.map || null;
                blk.material.color.set('#' + prevMat.color);
              } else {
                // Restore materials from the array
                blockData.previousMaterials.forEach((prevMat, index) => {
                  if (blk.material[index]) {
                    blk.material[index].map = prevMat.map || null;
                    blk.material[index].color.set('#' + prevMat.color);
                    blk.material[index].needsUpdate = true;
                  }
                });
                // If the number of materials changed, we might need to recreate the material array
                if (blk.material.length !== blockData.previousMaterials.length) {
                   const newMaterials = blockData.previousMaterials.map(pm => {
                       const newMat = new THREE.MeshPhongMaterial();
                       newMat.map = pm.map || null;
                       newMat.color.set('#' + pm.color);
                       return newMat;
                   });
                   // If original was single, convert back to single
                   if (blockData.previousMaterials.length === 1) {
                      blk.material = newMaterials[0];
                   } else {
                      blk.material = newMaterials;
                   }
                }
              }
              
              if (Array.isArray(blk.material)) {
                  blk.material.forEach(m => m.needsUpdate = true);
              } else {
                  blk.material.needsUpdate = true;
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                window.blockTools.updateBlockUI(blk);
              }
            }
          });
        }
        break;

      case 'removeTexture':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.blockKey];
          if (blk && d.previousMaterials) {
            if (Array.isArray(blk.material)) {
              d.previousMaterials.forEach((prevMat, index) => {
                if (blk.material[index]) {
                  if (prevMat.map) {
                    blk.material[index].map = prevMat.map;
                  }
                  blk.material[index].color.set('#' + prevMat.color);
                  blk.material[index].needsUpdate = true;
                }
              });
            } else if (blk.material && d.previousMaterials[0]) {
              if (d.previousMaterials[0].map) {
                blk.material.map = d.previousMaterials[0].map;
              }
              blk.material.color.set('#' + d.previousMaterials[0].color);
              blk.material.needsUpdate = true;
            }
            
            // Update UI if this block is currently selected
            if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
              window.blockTools.updateBlockUI(blk);
            }
          }
        }
        break;

      case 'removeTextureBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if (blk && blockData.previousMaterials) {
              if (Array.isArray(blk.material)) {
                blockData.previousMaterials.forEach((prevMat, index) => {
                  if (blk.material[index]) {
                    if (prevMat.map) {
                      blk.material[index].map = prevMat.map;
                    }
                    blk.material[index].color.set('#' + prevMat.color);
                    blk.material[index].needsUpdate = true;
                  }
                });
              } else if (blk.material && blockData.previousMaterials[0]) {
                if (blockData.previousMaterials[0].map) {
                  blk.material.map = blockData.previousMaterials[0].map;
                }
                blk.material.color.set('#' + blockData.previousMaterials[0].color);
                blk.material.needsUpdate = true;
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                window.blockTools.updateBlockUI(blk);
              }
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
      case 'applyTexture':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.blockKey];
          if(blk){
            const loader = new THREE.TextureLoader();
            loader.load(d.textureUrl, tex=>{
              if (Array.isArray(blk.material)) {
                // Apply to specific faces if specified
                if (d.faces && d.faces.length > 0) {
                  const isStair = d.blockType === 'stair';
                  if (isStair) {
                    if (d.faces.includes('all')) {
                      blk.material.forEach(material => {
                        material.map = tex;
                        material.needsUpdate = true;
                      });
                    } else {
                      d.faces.forEach(face => {
                        const faceIndex = parseInt(face);
                        if (!isNaN(faceIndex) && faceIndex >= 0 && faceIndex < blk.material.length) {
                          blk.material[faceIndex].map = tex;
                          blk.material[faceIndex].needsUpdate = true;
                        }
                      });
                    }
                  } else {
                    const regularFaceIndices = {
                      'right': 0, 'left': 1, 'top': 2, 'bottom': 3, 'front': 4, 'back': 5
                    };
                    
                    if (d.faces.includes('all')) {
                      blk.material.forEach(material => {
                        material.map = tex;
                        material.needsUpdate = true;
                      });
                    } else {
                      d.faces.forEach(face => {
                        if (regularFaceIndices.hasOwnProperty(face)) {
                          const index = regularFaceIndices[face];
                          blk.material[index].map = tex;
                          blk.material[index].needsUpdate = true;
                        }
                      });
                    }
                  }
                } else {
                  // Apply to all materials if no specific faces
                  blk.material.forEach(material => {
                    material.map = tex;
                    material.needsUpdate = true;
                  });
                }
              } else {
                blk.material.map = tex;
                blk.material.needsUpdate = true;
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                window.blockTools.updateBlockUI(blk);
              }
            });
          }
        }
        break;

      case 'applyTextureBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if(blk){
              const loader = new THREE.TextureLoader();
              loader.load(blockData.textureUrl, tex=>{
                if (Array.isArray(blk.material)) {
                  // Apply to specific faces if specified
                  if (blockData.faces && blockData.faces.length > 0) {
                    const isStair = blockData.blockType === 'stair';
                    if (isStair) {
                      if (blockData.faces.includes('all')) {
                        blk.material.forEach(material => {
                          material.map = tex;
                          material.needsUpdate = true;
                        });
                      } else {
                        blockData.faces.forEach(face => {
                          const faceIndex = parseInt(face);
                          if (!isNaN(faceIndex) && faceIndex >= 0 && faceIndex < blk.material.length) {
                            blk.material[faceIndex].map = tex;
                            blk.material[faceIndex].needsUpdate = true;
                          }
                        });
                      }
                    } else {
                      const regularFaceIndices = {
                        'right': 0, 'left': 1, 'top': 2, 'bottom': 3, 'front': 4, 'back': 5
                      };
                      
                      if (blockData.faces.includes('all')) {
                        blk.material.forEach(material => {
                          material.map = tex;
                          material.needsUpdate = true;
                        });
                      } else {
                        blockData.faces.forEach(face => {
                          if (regularFaceIndices.hasOwnProperty(face)) {
                            const index = regularFaceIndices[face];
                            blk.material[index].map = tex;
                            blk.material[index].needsUpdate = true;
                          }
                        });
                      }
                    }
                  } else {
                    // Apply to all materials if no specific faces
                    blk.material.forEach(material => {
                      material.map = tex;
                      material.needsUpdate = true;
                    });
                  }
                } else {
                  blk.material.map = tex;
                  blk.material.needsUpdate = true;
                }
                
                // Update UI if this block is currently selected
                if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                  window.blockTools.updateBlockUI(blk);
                }
              });
            }
          });
        }
        break;
      
      case 'removeTexture':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.blockKey];
          if (blk) {
            if (Array.isArray(blk.material)) {
              blk.material.forEach(mat => {
                if (mat) {
                  mat.map = null;
                  mat.needsUpdate = true;
                }
              });
            } else if (blk.material) {
              blk.material.map = null;
              blk.material.needsUpdate = true;
            }
            
            // Update UI if this block is currently selected
            if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
              window.blockTools.updateBlockUI(blk);
            }
          }
        }
        break;

      case 'removeTextureBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if (blk) {
              if (Array.isArray(blk.material)) {
                blk.material.forEach(mat => {
                  if (mat) {
                    mat.map = null;
                    mat.needsUpdate = true;
                  }
                });
              } else if (blk.material) {
                blk.material.map = null;
                blk.material.needsUpdate = true;
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                window.blockTools.updateBlockUI(blk);
              }
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

window.BlockTextureHistoryCommands = BlockTextureHistoryCommands;