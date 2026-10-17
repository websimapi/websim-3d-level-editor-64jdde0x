class TextureApplicationUI {
    constructor() {
        // This class handles the UI for applying textures to blocks and assets
    }

    showTextureApplicationUI(textureUrl) {
        const ui = document.createElement('div');
        ui.className = 'texture-application-ui';

        const selectedBlocks = window.blockTools?.getSelectedBlocks() || [];
        const selectedBlock = selectedBlocks.length > 0 ? selectedBlocks[0] : (window.blockTools?.getSelectedBlock() || window.selectedBlock);
        const selectedGroundCells = window.blockSelectionManager?.getSelectedGroundCells() || [];
        
        if (selectedBlocks.length === 0 && selectedBlock && selectedGroundCells.length === 0) {
            selectedBlocks.push(selectedBlock);
        }

        if (selectedGroundCells.length > 0) {
            const title = `Apply Texture to ${selectedGroundCells.length} Ground Cells`;
            ui.innerHTML = `
                <h3>${title}</h3>
                <p>Applying texture to the selected ground area.</p>
                <div class="texture-application-buttons">
                    <button class="apply-btn">Apply</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;
            ui.querySelector('.apply-btn').addEventListener('click', () => {
                this.applyTextureToSelection(textureUrl, ['all']); // faces param is not used but required
                document.body.removeChild(ui);
            });
        } else if (selectedBlocks.length > 0) {
            const isStair = selectedBlock?.userData?.blockType === 'stair';
            const isMultiSelect = selectedBlocks.length > 1;

            const faceOptions = isStair ? [
                { value: 'all', label: 'All Faces' },
                { value: '0', label: 'Bottom Step Front' },
                { value: '1', label: 'Bottom Step Back' },
                { value: '2', label: 'Bottom Step Left' },
                { value: '3', label: 'Bottom Step Right' },
                { value: '4', label: 'Bottom Step Top' },
                { value: '5', label: 'Bottom Step Bottom' },
                { value: '6', label: 'Top Step Front' },
                { value: '7', label: 'Top Step Back' },
                { value: '8', label: 'Top Step Left' },
                { value: '9', label: 'Top Step Right' },
                { value: '10', label: 'Top Step Top' },
                { value: '11', label: 'Bottom Step Right Extension' }
            ] : [
                { value: 'all', label: 'All Faces' },
                { value: 'front', label: 'Front Face' },
                { value: 'back', label: 'Back Face' },
                { value: 'left', label: 'Left Face' },
                { value: 'right', label: 'Right Face' },
                { value: 'top', label: 'Top Face' },
                { value: 'bottom', label: 'Bottom Face' }
            ];

            const title = isMultiSelect ? `Apply Texture to ${selectedBlocks.length} Blocks` : 'Apply Texture';

            ui.innerHTML = `
                <h3>${title}</h3>
                <div class="face-selection">
                    ${faceOptions.map(face => `
                        <label><input type="checkbox" value="${face.value}"> ${face.label}</label>
                    `).join('')}
                </div>
                <div class="texture-application-buttons">
                    <button class="apply-btn">Apply</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;

            const allFacesCheckbox = ui.querySelector('input[value="all"]');
            const otherCheckboxes = Array.from(ui.querySelectorAll('input:not([value="all"])'));

            allFacesCheckbox.addEventListener('change', () => {
                otherCheckboxes.forEach(cb => {
                    cb.checked = false;
                    cb.disabled = allFacesCheckbox.checked;
                });
            });

            otherCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    if (cb.checked) {
                        allFacesCheckbox.checked = false;
                    }
                    const allIndividualSelected = otherCheckboxes.every(checkbox => checkbox.checked);
                    if (allIndividualSelected) {
                        allFacesCheckbox.checked = true;
                        otherCheckboxes.forEach(checkbox => checkbox.checked = false);
                    }
                });
            });

            allFacesCheckbox.checked = true;
            otherCheckboxes.forEach(cb => {
                cb.disabled = true;
                cb.checked = false;
            });

            ui.querySelector('.apply-btn').addEventListener('click', () => {
                const selectedFaces = Array.from(ui.querySelectorAll('input:checked')).map(cb => cb.value);
                if (selectedFaces.length > 0) {
                    this.applyTextureToSelection(textureUrl, selectedFaces, selectedBlocks);
                }
                document.body.removeChild(ui);
            });
        } else {
            alert("Please select blocks or ground cells to apply a texture.");
            return;
        }

        ui.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(ui);
        });

        document.body.appendChild(ui);
    }

    applyTextureToGround(textureUrl, groundCells) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(textureUrl, texture => {
            texture.userData = { url: textureUrl };
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            const batchData = [];

            groundCells.forEach(cell => {
                const previousMaterial = cell.material;
                let previousTextureUrl = null;
                if (previousMaterial.map) {
                    previousTextureUrl = previousMaterial.map.userData?.url;
                }

                batchData.push({
                    cellKey: cell.userData.key,
                    previousTextureUrl: previousTextureUrl,
                    wasDefault: cell.material === window.gridManager.defaultGroundMaterial,
                });

                // If the cell is using the default material, clone it first
                if (cell.material === window.gridManager.defaultGroundMaterial) {
                    cell.material = cell.material.clone();
                }

                cell.material.map = texture;
                cell.material.color.set(0xffffff);
                cell.material.needsUpdate = true;
            });

            const actionDescription = `Applied texture to ${groundCells.length} ground cells`;
            window.actionHistory.addAction(actionDescription, {
                type: 'applyGroundTextureBatch',
                textureUrl: textureUrl,
                batchData: batchData
            });

            window.debugInfo.lastAction = actionDescription;
            window.debugTools.updateDebugInfo();
        });
    }

    applyTextureToSelection(textureUrl, faces, selectedBlocks = []) {
        const selectedGroundCells = window.blockSelectionManager?.getSelectedGroundCells() || [];

        if (selectedGroundCells.length > 0) {
            this.applyTextureToGround(textureUrl, selectedGroundCells);
            return;
        }

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(textureUrl, texture => {
            texture.userData = { url: textureUrl };

            // If no blocks provided, use the current selection
            if (selectedBlocks.length === 0) {
                const currentBlock = window.blockTools?.getSelectedBlock() || window.selectedBlock;
                if (currentBlock) {
                    selectedBlocks = [currentBlock];
                }
            }

            // Collect all block data for batch operation
            const batchData = [];

            // Apply texture to all selected blocks
            selectedBlocks.forEach(block => {
                if (!block) return;
                
                const isStair = block.userData.blockType === 'stair';
                
                let previousMaterials = [];
                if (Array.isArray(block.material)) {
                    previousMaterials = block.material.map(m => ({
                        map: m.map,
                        color: m.color.getHexString()
                    }));
                } else {
                    previousMaterials = [{
                        map: block.material.map,
                        color: block.material.color.getHexString()
                    }];
                }

                if (isStair) {
                    if (!Array.isArray(block.material) || block.material.length < 12) {
                        const baseMaterial = Array.isArray(block.material) ? block.material[0] : block.material;
                        block.material = Array(12).fill().map(() => baseMaterial.clone());
                    }
                    
                    if (faces.includes('all')) {
                        block.material.forEach(material => {
                            material.map = texture;
                            material.needsUpdate = true;
                        });
                    } else {
                        faces.forEach(face => {
                            const faceIndex = parseInt(face);
                            if (!isNaN(faceIndex) && faceIndex >= 0 && faceIndex < block.material.length) {
                                block.material[faceIndex].map = texture;
                                block.material[faceIndex].needsUpdate = true;
                            }
                        });
                    }
                } else {
                    const regularFaceIndices = {
                        'right': 0, 'left': 1, 'top': 2, 'bottom': 3, 'front': 4, 'back': 5
                    };
                    
                    if (!Array.isArray(block.material)) {
                        const baseMaterial = block.material.clone();
                        block.material = Array(6).fill().map(() => baseMaterial.clone());
                    }

                    if (faces.includes('all')) {
                        block.material.forEach(material => {
                            material.map = texture;
                            material.needsUpdate = true;
                        });
                    } else {
                        faces.forEach(face => {
                            if (regularFaceIndices.hasOwnProperty(face)) {
                                const index = regularFaceIndices[face];
                                block.material[index].map = texture;
                                block.material[index].needsUpdate = true;
                            }
                        });
                    }
                }

                // Add this block's data to the batch
                batchData.push({
                    blockKey: block.userData.key,
                    faces: faces,
                    textureUrl: textureUrl,
                    previousMaterials: previousMaterials,
                    blockType: block.userData.blockType
                });
            });

            // Create single batch action instead of individual actions
            const actionDescription = selectedBlocks.length > 1 ? 
                `Applied texture to ${selectedBlocks.length} blocks faces: ${faces.join(', ')}` :
                `Applied texture to ${selectedBlocks[0].userData.blockType} block faces: ${faces.join(', ')}`;
            
            window.actionHistory.addAction(actionDescription, {
                type: 'applyTextureBatch',
                batchData: batchData
            });

            window.debugInfo.lastAction = actionDescription;
            window.debugTools.updateDebugInfo();
        });
    }
}

window.TextureApplicationUI = TextureApplicationUI;