class LevelSerializer {
  constructor() {
    // This class handles serialization of level data
  }

  serializeWorldSettings() {
    if (!window.gridManager) {
      return { width: 32, height: 32 };
    }
    
    const worldSize = window.gridManager.getWorldSize();
    return {
      width: worldSize.width,
      height: worldSize.height
    };
  }

  serializeBlocks() {
    if (!window.gridBlocks) {
        console.warn('No gridBlocks object found');
        return [];
    }

    return Object.entries(window.gridBlocks).reduce((acc, [key, block]) => {
        if (!block) {
            console.warn(`Invalid block found for key ${key}`);
            return acc;
        }

        try {
            const [x, y, z] = key.split(',').map(Number);
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.warn(`Invalid coordinates in key ${key}`);
                return acc;
            }

            const blockData = {
                x, y, z,
                type: block.userData?.blockType || 'half',
                orientation: block.userData?.orientation || 'north'
            };

            // Handle both single material and material array cases
            if (Array.isArray(block.material)) {
                // Simplify materials to just color and textureUrl without raw image data
                blockData.materials = block.material.map(mat => ({
                    color: mat?.color?.getHexString() || 'ffffff',
                    textureUrl: mat?.map?.userData?.url || null
                }));
                // Set color property for compatibility
                blockData.color = block.material[0]?.color?.getHexString() || 'ffffff';
            } else if (block.material) {
                blockData.color = block.material.color?.getHexString() || 'ffffff';
                if (block.material.map?.userData?.url) {
                    blockData.textureUrl = block.material.map.userData.url;
                }
            }

            // Remove any reference to image data
            delete blockData.image;
            delete blockData.images;

            acc.push(blockData);
            return acc;
        } catch (error) {
            console.warn(`Error serializing block at ${key}:`, error);
            return acc;
        }
    }, []);
  }

  serializeGround() {
      const groundData = {
          defaultTextureUrl: window.gridManager.getDefaultGroundTextureUrl(),
          cells: []
      };

      const defaultMaterial = window.gridManager.defaultGroundMaterial;
      Object.values(window.groundCells).forEach(cell => {
          if (cell.material !== defaultMaterial) {
              groundData.cells.push({
                  key: cell.userData.key,
                  textureUrl: cell.material.map?.userData?.url || null
              });
          }
      });
      return groundData;
  }

  serializeAssetLibrary() {
    if (!window.modelManager?.getLoadedModels()) {
        return [];
    }

    return window.modelManager.getLoadedModels().reduce((acc, model) => {
        try {
            if (!model) return acc;

            acc.push({
                url: model.url || '',
                name: model.name || 'Unnamed Model',
                defaultRotation: model.model ? {
                    x: model.model.rotation.x || 0,
                    y: model.model.rotation.y || 0,
                    z: model.model.rotation.z || 0
                } : { x: 0, y: 0, z: 0 }
            });
            return acc;
        } catch (error) {
            console.warn('Error serializing asset library item:', error);
            return acc;
        }
    }, []);
  }

  serializeBackground() {
    if (!window.backgroundManager) {
        return null;
    }

    const backgroundData = window.backgroundManager.getBackgroundData();
    if (!backgroundData) {
        return null;
    }

    return {
        textureUrl: backgroundData.textureUrl,
        name: backgroundData.name
    };
  }

  extractTextureURLsFromData(blocks, assets) {
    const textureUrls = new Set();
    
    // Extract texture URLs from blocks
    blocks.forEach(block => {
      if (block.textureUrl) {
        textureUrls.add(block.textureUrl);
      }
      
      if (block.materials && Array.isArray(block.materials)) {
        block.materials.forEach(material => {
          if (material.textureUrl) {
            textureUrls.add(material.textureUrl);
          }
        });
      }
    });
    
    // Extract texture URLs from assets
    assets.forEach(asset => {
      if (asset.textureUrls && Array.isArray(asset.textureUrls)) {
        asset.textureUrls.forEach(url => textureUrls.add(url));
      }
    });
    
    // Note: Background textures are handled separately in full export to avoid duplication
    
    // Convert set to array of texture objects
    return Array.from(textureUrls).map(url => ({
      url: url,
      name: url.split('/').pop() || 'texture'
    }));
  }
}

window.LevelSerializer = LevelSerializer;