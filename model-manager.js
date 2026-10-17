class ModelManager {
    constructor(scene, loader) {
        this.scene = scene;
        this.loader = loader;
        this.loadedModels = [];
        this.selectedModel = null;
        this.modelPreview = null;

        this.initFileHandler();
    }

    initFileHandler() {
        const modelInput = document.getElementById('model-input');
        if (modelInput) {
            modelInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        window.debugInfo.lastAction = `Starting upload of model: ${file.name}`;
                        window.debugTools.updateDebugInfo();
                        const url = await websim.upload(file);
                        window.debugInfo.lastAction = `Model uploaded successfully: ${file.name}`;
                        window.debugTools.updateDebugInfo();
                        this.loadModelFromURL(url, file.name);
                        event.target.value = '';
                    } catch (error) {
                        console.error('Error uploading model:', error);
                        window.debugInfo.lastAction = `Error uploading model: ${error.message}`;
                        window.debugTools.updateDebugInfo();
                    }
                }
            });
        }
    }

    loadModelFromURL(url, name, defaultRotation = { x: 0, y: 0, z: 0 }) {
        if (this.loadedModels.some(model => model.url === url)) {
            window.debugInfo.lastAction = `Model ${name} already loaded`;
            window.debugTools.updateDebugInfo();
            return;
        }

        window.debugInfo.lastAction = `Loading model from URL: ${url}`;
        window.debugTools.updateDebugInfo();

        this.loader.load(url, gltf => {
            const model = gltf.scene;

            const bbox = new THREE.Box3().setFromObject(model);
            model.userData.yOffset = bbox.min.y;

            model.userData.url = url;
            model.userData.name = name;

            model.rotation.set(
                defaultRotation.x || 0,
                defaultRotation.y || 0,
                defaultRotation.z || 0
            );

            // Enable shadows for all meshes in the model
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const assetItem = this.createAssetItem(model, url, name);
            document.getElementById('asset-list').appendChild(assetItem);

            this.loadedModels.push({
                model: model,
                preview: assetItem.querySelector('.asset-preview'),
                url: url,
                name: name
            });

            window.debugInfo.lastAction = `Successfully loaded model: ${name}`;
            if (window.actionHistory) {
                window.actionHistory.addAction(`Added model ${name} to asset library`);
            }
            window.debugTools.updateDebugInfo();

        }, undefined, error => {
            console.error('Error loading model:', error);
            window.debugInfo.lastAction = `Error loading model: ${error.message}`;
            window.debugTools.updateDebugInfo();
        });
    }

    createAssetItem(model, url, name) {
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';

        const defaultRotationControls = document.createElement('div');
        defaultRotationControls.className = 'default-rotation-controls';

        const rotationLabel = document.createElement('div');
        rotationLabel.className = 'rotation-label';
        rotationLabel.textContent = 'Default Rotation';
        defaultRotationControls.appendChild(rotationLabel);

        const useButton = document.createElement('button');
        useButton.className = 'use-asset-btn';
        useButton.textContent = 'Use';
        useButton.onclick = (e) => {
            e.stopPropagation();

            this.selectedModel = model.clone();
            this.selectedModel.userData = { ...model.userData };

            this.selectedModel.rotation.copy(model.rotation);

            window.selectedModel = this.selectedModel;

            if (window.toolStateManager) {
                window.toolStateManager.activateAssetPlacement(this.selectedModel);
            }

            if (window.debugInfo) {
                window.debugInfo.lastAction = `Selected asset for placement: ${name}`;
                if (window.debugTools) {
                    window.debugTools.updateDebugInfo();
                }
            }
        };

        ['X', 'Y', 'Z'].forEach(axis => {
            const axisControl = document.createElement('div');
            axisControl.className = 'rotation-axis';

            const label = document.createElement('span');
            label.textContent = axis;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '360';
            slider.value = model.rotation[axis.toLowerCase()] * 180 / Math.PI % 360;

            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.min = '0';
            numberInput.max = '360';
            numberInput.value = slider.value;
            numberInput.step = '1';

            const updateRotation = () => {
                const radians = numberInput.value * Math.PI / 180;
                model.rotation[axis.toLowerCase()] = radians;

                if (window.modelPreview && window.modelPreview.visible) {
                    window.modelPreview.rotation[axis.toLowerCase()] = radians;
                }

                if (window.selectedModel && window.selectedModel.userData.url === model.userData.url) {
                    window.selectedModel.rotation[axis.toLowerCase()] = radians;
                }
            };

            slider.addEventListener('input', e => {
                numberInput.value = e.target.value;
                updateRotation();
            });

            numberInput.addEventListener('input', e => {
                slider.value = e.target.value;
                updateRotation();
            });

            numberInput.addEventListener('change', () => {
                const loadedModel = this.loadedModels.find(m => m.url === model.userData.url);
                if (loadedModel) {
                    loadedModel.model.rotation[axis.toLowerCase()] = model.rotation[axis.toLowerCase()];
                }
            });

            axisControl.appendChild(label);
            axisControl.appendChild(slider);
            axisControl.appendChild(numberInput);
            defaultRotationControls.appendChild(axisControl);
        });

        assetItem.innerHTML = `
          <div class="asset-controls">
            <div class="asset-name">${name}</div>
          </div>
        `;

        const controlsDiv = assetItem.querySelector('.asset-controls');
        controlsDiv.appendChild(useButton);

        assetItem.appendChild(defaultRotationControls);

        assetItem.addEventListener('click', () => {
            window.debugInfo.lastAction = `Inspecting asset: ${name}`;
            if (window.debugTools) {
                window.debugTools.updateDebugInfo();
            }
        });

        return assetItem;
    }

    clearModelLibrary() {
        const assetList = document.getElementById('asset-list');
        if (assetList) {
            assetList.innerHTML = '';
        }

        this.loadedModels = [];

        if (this.modelPreview) {
            this.scene.remove(this.modelPreview);
            this.modelPreview = null;
        }

        if (window.modelPreview) {
             this.scene.remove(window.modelPreview);
             window.modelPreview = null;
        }

        this.selectedModel = null;
        window.selectedModel = null;
    }

    getLoadedModels() {
        return this.loadedModels;
    }
}

window.ModelManager = ModelManager;