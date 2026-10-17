class LevelImporter {
  constructor() {
    // This class handles importing level data
    this.textureCache = new Map();
    this.loadingPromises = new Map();
  }

  async importLevel(levelData) {
    // Show loading indicator
    this.showLoadingIndicator();
    
    try {
      // Clear existing content
      window.placedBlocks.clearAllBlocks();
      window.placedAssets.clearAllAssets();
      window.modelManager.clearModelLibrary();
      window.textureManager.clearTextureLibrary();

      // Clear asset library UI
      document.getElementById('asset-list').innerHTML = '';
      document.getElementById('textures-list').innerHTML = '';
      
      // Remove any model previews from the scene
      if (window.modelPreview) {
        window.rendererManager.getScene().remove(window.modelPreview);
        window.modelPreview = null;
      }
      
      // Clear selected model
      window.selectedModel = null;
      
      // Reset any active tool selection
      if (window.toolStateManager) {
        window.toolStateManager.setTool('place-block');
      }

      // Import world settings first
      await this.importWorldSettings(levelData.worldSettings);

      // Pre-load all textures in parallel for better performance
      await this.preloadAllTextures(levelData);

      // Import assets library first (in parallel)
      await this.importAssetLibrary(levelData.assetLibrary);

      // Import ground textures and background
      await Promise.all([
        this.importGround(levelData.ground),
        this.importBackground(levelData.background)
      ]);
      
      // Import blocks and assets in parallel
      await Promise.all([
        this.importBlocks(levelData.blocks),
        this.importAssets(levelData.assets)
      ]);
      
      // Import action history
      if (levelData.actionHistory) {
        window.actionHistory.setHistory(levelData.actionHistory);
      }
      
      // Update UI elements once at the end
      window.placedBlocks.updateBlocksList();
      if (window.debugTools) {
        window.debugInfo.lastAction = `Imported level - Blocks: ${levelData.blocks?.length || 0}, Assets: ${levelData.assets?.length || 0}`;
        window.debugTools.updateDebugInfo();
      }
    } finally {
      this.hideLoadingIndicator();
    }
  }

  async importWorldSettings(worldSettings) {
    if (!worldSettings) return;
    
    const width = worldSettings.width || 32;
    const height = worldSettings.height || 32;
    
    // Validate bounds
    if (width >= 1 && width <= 1024 && height >= 1 && height <= 1024) {
      if (window.gridManager) {
        window.gridManager.setWorldSize(width, height);
      }
      
      this.updateLoadingProgress(5); // 5% of total progress
    } else {
      console.warn('Invalid world settings:', worldSettings);
    }
  }

  showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'import-loading-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;
    indicator.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 10px;">Importing Level...</div>
        <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
          <div id="loading-progress" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  hideLoadingIndicator() {
    const indicator = document.getElementById('import-loading-indicator');
    if (indicator) {
      document.body.removeChild(indicator);
    }
  }

  updateLoadingProgress(percent) {
    const progress = document.getElementById('loading-progress');
    if (progress) {
      progress.style.width = `${percent}%`;
    }
  }

  async preloadAllTextures(levelData) {
    const textureUrls = new Set();
    
    // Collect all texture URLs from blocks
    if (levelData.blocks) {
      levelData.blocks.forEach(block => {
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
    }

    // Collect texture URLs from assets
    if (levelData.assets) {
      levelData.assets.forEach(asset => {
        if (asset.textureUrls && Array.isArray(asset.textureUrls)) {
          asset.textureUrls.forEach(url => textureUrls.add(url));
        }
      });
    }

    // Collect texture URLs from ground
    if (levelData.ground && levelData.ground.cells) {
      levelData.ground.cells.forEach(cell => {
        if (cell.textureUrl) {
          textureUrls.add(cell.textureUrl);
        }
      });
    }

    // Collect texture URLs from background
    if (levelData.background && levelData.background.textureUrl) {
      textureUrls.add(levelData.background.textureUrl);
    }

    // Load all textures in parallel
    const textureLoader = new THREE.TextureLoader();
    const texturePromises = Array.from(textureUrls).map(url => {
      return new Promise((resolve, reject) => {
        textureLoader.load(url, 
          (texture) => {
            texture.userData = { url };
            this.textureCache.set(url, texture);
            resolve(texture);
          },
          undefined,
          (error) => {
            console.warn(`Failed to load texture: ${url}`, error);
            resolve(null); // Don't reject, just continue
          }
        );
      });
    });

    await Promise.all(texturePromises);
    
    // Add loaded textures to texture library
    textureUrls.forEach(url => {
      const textureName = url.split('/').pop() || 'imported-texture';
      window.textureManager.addTextureToLibrary(url, textureName);
    });
  }

  async importAssetLibrary(assetLibrary) {
    if (!assetLibrary || assetLibrary.length === 0) return;
    
    // Load all assets in parallel
    const assetPromises = assetLibrary.map(asset => {
      return new Promise((resolve) => {
        try {
          window.modelManager.loadModelFromURL(asset.url, asset.name, asset.defaultRotation);
          resolve();
        } catch (error) {
          console.warn(`Failed to load asset: ${asset.name}`, error);
          resolve(); // Don't reject, just continue
        }
      });
    });

    await Promise.all(assetPromises);
  }

  async importBlocks(blocks) {
    if (!blocks || blocks.length === 0) return;
    
    // Process blocks in batches to avoid blocking the UI
    const batchSize = 50;
    const totalBlocks = blocks.length;
    
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      
      // Process batch synchronously to maintain order
      batch.forEach(block => {
        const key = `${block.x},${block.y},${block.z}`;
        const position = new THREE.Vector3(block.x, block.y, block.z);
        const newBlock = window.placedBlocks.addBlock(position, block.type || 'half');
        
        if (newBlock) {
          window.gridBlocks[key] = newBlock;

          // Set orientation first
          if (block.orientation) {
            newBlock.userData.orientation = block.orientation;
            let rotation = 0;
            switch (block.orientation) {
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
            newBlock.rotation.y = rotation;
          }

          // Apply colors immediately
          if (block.color) {
            if (Array.isArray(newBlock.material)) {
              newBlock.material.forEach(mat => {
                mat.color.set('#' + block.color);
              });
            } else {
              newBlock.material.color.set('#' + block.color);
            }
          }

          // Apply textures from cache
          this.applyTexturesFromCache(newBlock, block);
          
          // Ensure block has its key in userData
          newBlock.userData.key = key;
        }
      });
      
      // Update progress
      this.updateLoadingProgress(((i + batchSize) / totalBlocks) * 40); // 40% of total progress
      
      // Allow UI to update
      if (i + batchSize < blocks.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  applyTexturesFromCache(newBlock, block) {
    // Handle materials
    if (block.materials && block.materials.length > 0) {
      // For stair blocks or multi-material blocks
      if (block.type === 'stair' || (Array.isArray(newBlock.material) && block.materials.length > 1)) {
        // Ensure we have enough materials for all faces
        const materialCount = block.type === 'stair' ? 12 : 6;
        
        // Convert to materials array if not already
        if (!Array.isArray(newBlock.material)) {
          const baseMaterial = newBlock.material.clone();
          newBlock.material = Array(materialCount).fill(null).map(() => baseMaterial.clone());
        }

        // Apply materials to each face
        block.materials.forEach((matData, index) => {
          if (index < newBlock.material.length) {
            const material = newBlock.material[index];
            if (matData.color) {
              material.color.set('#' + matData.color);
            }
            if (matData.textureUrl && this.textureCache.has(matData.textureUrl)) {
              const texture = this.textureCache.get(matData.textureUrl);
              if (texture) {
                material.map = texture;
                material.needsUpdate = true;
              }
            }
          }
        });
      } else {
        // Convert standard block to use material array for face-specific textures
        if (!Array.isArray(newBlock.material) && block.materials.some(mat => mat.textureUrl)) {
          const baseMaterial = newBlock.material.clone();
          newBlock.material = Array(6).fill(null).map(() => baseMaterial.clone());
          
          // Apply specific textures to each face
          block.materials.forEach((matData, index) => {
            if (index < newBlock.material.length) {
              if (matData.color) {
                newBlock.material[index].color.set('#' + matData.color);
              }
              if (matData.textureUrl && this.textureCache.has(matData.textureUrl)) {
                const texture = this.textureCache.get(matData.textureUrl);
                if (texture) {
                  newBlock.material[index].map = texture;
                  newBlock.material[index].needsUpdate = true;
                }
              }
            }
          });
        } else if (block.materials[0].color) {
          // Single material case but with material data in array format
          newBlock.material.color.set('#' + block.materials[0].color);
          
          if (block.materials[0].textureUrl && this.textureCache.has(block.materials[0].textureUrl)) {
            const texture = this.textureCache.get(block.materials[0].textureUrl);
            if (texture) {
              newBlock.material.map = texture;
              newBlock.material.needsUpdate = true;
            }
          }
        }
      }
    } else if (block.textureUrl && this.textureCache.has(block.textureUrl)) {
      // Legacy single texture URL format
      const texture = this.textureCache.get(block.textureUrl);
      if (texture) {
        if (Array.isArray(newBlock.material)) {
          newBlock.material.forEach(mat => {
            mat.map = texture;
            mat.needsUpdate = true;
          });
        } else {
          newBlock.material.map = texture;
          newBlock.material.needsUpdate = true;
        }
      }
    }
  }

  async importAssets(assets) {
    if (!assets || assets.length === 0) return;
    
    const loader = new THREE.GLTFLoader();
    const totalAssets = assets.length;
    
    // Load all assets in parallel
    const assetPromises = assets.map((assetData, index) => {
      return new Promise((resolve) => {
        if (!assetData || !assetData.url) {
          console.warn('Invalid asset data:', assetData);
          resolve();
          return;
        }

        loader.load(assetData.url, 
          // Success callback
          (gltf) => {
            try {
              if (!gltf || !gltf.scene) {
                console.warn('Invalid GLTF data for asset:', assetData);
                resolve();
                return;
              }

              const model = gltf.scene;
              model.position.set(
                assetData.position.x || 0, 
                assetData.position.y || 0, 
                assetData.position.z || 0
              );
              model.rotation.set(
                assetData.rotation.x || 0, 
                assetData.rotation.y || 0, 
                assetData.rotation.z || 0
              );
              model.scale.set(
                assetData.scale.x || 1, 
                assetData.scale.y || 1, 
                assetData.scale.z || 1
              );
              model.userData.url = assetData.url;
              model.userData.name = assetData.name;
              
              // Enable shadows for imported models
              model.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              
              window.rendererManager.getScene().add(model);
              
              const asset = {
                id: assetData.id,
                model: model,
                position: model.position.clone(),
                url: assetData.url,
                name: assetData.name,
                type: assetData.type || 'scene object'
              };
              
              window.placedAssets.addPlacedAssetToList(asset);
              
              // Update progress
              this.updateLoadingProgress(40 + ((index + 1) / totalAssets) * 40); // 40-80% of total progress
              
              resolve();
            } catch (error) {
              console.error('Error processing asset:', assetData.url, error);
              resolve();
            }
          },
          // Progress callback
          undefined,
          // Error callback
          (error) => {
            console.error('Error loading asset:', assetData.url, error);
            resolve();
          }
        );
      });
    });

    await Promise.all(assetPromises);
  }

  async importGround(groundData) {
    if (!groundData) return;

    if (groundData.defaultTextureUrl) {
        window.gridManager.setDefaultTexture(groundData.defaultTextureUrl);
    }

    if (groundData.cells && Array.isArray(groundData.cells)) {
        groundData.cells.forEach(cellData => {
            const cell = window.groundCells[cellData.key];
            if (cell && cellData.textureUrl && this.textureCache.has(cellData.textureUrl)) {
                const texture = this.textureCache.get(cellData.textureUrl);
                if (texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    
                    if (cell.material === window.gridManager.defaultGroundMaterial) {
                        cell.material = cell.material.clone();
                    }
                    cell.material.map = texture;
                    cell.material.color.set(0xffffff);
                    cell.material.needsUpdate = true;
                }
            }
        });
    }
    
    this.updateLoadingProgress(90); // 90% of total progress
  }

  async importBackground(backgroundData) {
    if (!backgroundData || !backgroundData.textureUrl) {
        return;
    }

    try {
        // Use the background manager to set the background
        if (window.backgroundManager) {
            window.backgroundManager.setBackground(backgroundData.textureUrl, backgroundData.name);
        }
    } catch (error) {
        console.warn('Error importing background:', error);
    }
  }

  extractTextureURLsFromBlocks(blocks) {
    if (!blocks || !Array.isArray(blocks)) return;
    
    const textureUrls = new Set();
    
    // Extract texture URLs from blocks
    blocks.forEach(block => {
      // Check for single texture URL
      if (block.textureUrl) {
        textureUrls.add(block.textureUrl);
      }
      
      // Check for multiple materials with textures
      if (block.materials && Array.isArray(block.materials)) {
        block.materials.forEach(material => {
          if (material.textureUrl) {
            textureUrls.add(material.textureUrl);
          }
        });
      }
    });
    
    // Add unique texture URLs to the asset library
    textureUrls.forEach(url => {
      const textureName = url.split('/').pop() || 'imported-texture';
      window.textureManager.addTextureToLibrary(url, textureName);
    });
  }
}

window.LevelImporter = LevelImporter;