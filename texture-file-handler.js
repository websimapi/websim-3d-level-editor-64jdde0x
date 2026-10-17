class TextureFileHandler {
    constructor() {
        this.loadedTextures = [];
        this.initFileHandler();
        this.initRemoveTextureHandler();
        this.initGroundTextureHandlers();
    }

    initFileHandler() {
        const textureInput = document.getElementById('texture-input');
        if (textureInput) {
            textureInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        window.debugInfo.lastAction = `Starting upload of texture: ${file.name}`;
                        window.debugTools.updateDebugInfo();
                        
                        const url = await websim.upload(file);
                        this.addTextureToLibrary(url, file.name);
                        
                        window.debugInfo.lastAction = `Texture uploaded successfully: ${file.name}`;
                        window.debugTools.updateDebugInfo();
                        
                        event.target.value = '';
                    } catch (error) {
                        console.error('Error uploading texture:', error);
                        window.debugInfo.lastAction = `Error uploading texture: ${error.message}`;
                        window.debugTools.updateDebugInfo();
                    }
                }
            });

            const loadTextureBtn = document.getElementById('load-texture');
            if (loadTextureBtn) {
                loadTextureBtn.addEventListener('click', () => {
                    textureInput.click();
                });
            }
        }
    }

    initRemoveTextureHandler() {
        const removeTextureBtn = document.getElementById('remove-texture');
        if (removeTextureBtn) {
            removeTextureBtn.addEventListener('click', () => {
                this.removeTextureFromSelectedBlock();
            });
        }
    }

    initGroundTextureHandlers() {
        document.getElementById('remove-ground-texture').addEventListener('click', () => {
            const selectedGroundCells = window.blockSelectionManager?.getSelectedGroundCells() || [];
            if (selectedGroundCells.length === 0) {
                alert('Please select ground cells to remove custom textures from.');
                return;
            }

            const cellsToRevert = selectedGroundCells.filter(cell => cell.material !== window.gridManager.defaultGroundMaterial);
            if (cellsToRevert.length === 0) {
                alert('None of the selected cells have a custom texture.');
                return;
            }

            const batchData = [];
            cellsToRevert.forEach(cell => {
                batchData.push({
                    cellKey: cell.userData.key,
                    previousTextureUrl: cell.material.map?.userData?.url || null
                });
                cell.material = window.gridManager.defaultGroundMaterial;
            });

            const actionDescription = `Removed custom texture from ${cellsToRevert.length} ground cells`;
            window.actionHistory.addAction(actionDescription, {
                type: 'removeGroundTextureBatch',
                batchData: batchData
            });
        });
    }

    removeTextureFromSelectedBlock() {
        // Get all selected blocks for multi-select support
        const selectedBlocks = window.blockTools?.getSelectedBlocks() || [];
        const singleSelectedBlock = window.blockTools?.getSelectedBlock() || window.selectedBlock;
        const allSelectedBlocks = selectedBlocks.length > 0 ? selectedBlocks : (singleSelectedBlock ? [singleSelectedBlock] : []);
        
        if (allSelectedBlocks.length === 0) {
            alert('Please select a block first');
            return;
        }

        // Check if any blocks have textures applied
        const blocksWithTextures = allSelectedBlocks.filter(block => {
            if (Array.isArray(block.material)) {
                return block.material.some(mat => mat?.map);
            } else if (block.material) {
                return !!block.material.map;
            }
            return false;
        });

        if (blocksWithTextures.length === 0) {
            const message = allSelectedBlocks.length > 1 ? 
                'None of the selected blocks have textures to remove' : 
                'Selected block has no texture to remove';
            alert(message);
            return;
        }

        // Collect all block data for batch operation
        const batchData = [];

        // Remove textures from all blocks that have them
        blocksWithTextures.forEach(block => {
            let previousMaterials = [];
            
            if (Array.isArray(block.material)) {
                previousMaterials = block.material.map(mat => ({
                    map: mat?.map,
                    color: mat?.color?.getHexString() || 'ffffff'
                }));
                
                block.material.forEach(mat => {
                    if (mat) {
                        mat.map = null;
                        mat.needsUpdate = true;
                    }
                });
            } else if (block.material) {
                previousMaterials = [{
                    map: block.material.map,
                    color: block.material.color?.getHexString() || 'ffffff'
                }];
                
                block.material.map = null;
                block.material.needsUpdate = true;
            }

            // Add this block's data to the batch
            batchData.push({
                blockKey: block.userData.key,
                previousMaterials: previousMaterials,
                blockType: block.userData.blockType
            });
        });

        // Create single batch action instead of individual actions
        const actionDescription = blocksWithTextures.length > 1 ? 
            `Removed texture from ${blocksWithTextures.length} blocks` :
            `Removed texture from ${blocksWithTextures[0].userData.blockType} block`;
        
        window.actionHistory.addAction(actionDescription, {
            type: 'removeTextureBatch',
            batchData: batchData
        });

        // Update debug info
        window.debugInfo.lastAction = actionDescription;
        window.debugTools.updateDebugInfo();
    }
    
    clearTextureLibrary() {
        const texturesList = document.getElementById('textures-list');
        if (texturesList) {
            texturesList.innerHTML = '';
        }
        this.loadedTextures = [];
    }

    getLoadedTextures() {
        return this.loadedTextures;
    }

    addTextureToLibrary(url, name) {
        if (!this.loadedTextures.some(texture => texture.url === url)) {
            this.loadedTextures.push({
                url: url,
                name: name
            });

            const texturesList = document.getElementById('textures-list');
            if (texturesList) {
                const textureItem = document.createElement('div');
                textureItem.className = 'texture-item';
                
                const preview = document.createElement('div');
                preview.className = 'texture-preview';
                preview.style.backgroundImage = `url(${url})`;
                
                const controls = document.createElement('div');
                controls.className = 'texture-controls';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                
                const applyButton = document.createElement('button');
                applyButton.className = 'apply-texture-btn';
                applyButton.textContent = 'Apply';
                applyButton.onclick = () => {
                    if (window.textureApplicationUI) {
                        window.textureApplicationUI.showTextureApplicationUI(url);
                    }
                };
                
                controls.appendChild(nameSpan);
                controls.appendChild(applyButton);
                
                textureItem.appendChild(preview);
                textureItem.appendChild(controls);
                texturesList.appendChild(textureItem);
            }
        }
    }
}

window.TextureFileHandler = TextureFileHandler;