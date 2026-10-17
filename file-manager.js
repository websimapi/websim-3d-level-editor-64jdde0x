class FileManager {
  constructor() {
    // Initialize specialized components
    this.levelSerializer = new LevelSerializer();
    this.assetSerializer = new AssetSerializer();
    this.levelImporter = new LevelImporter();
    
    this.initFileInputs();
  }

  initFileInputs() {
    // Set up file input handlers
    document.getElementById('import-input').addEventListener('change', 
      (e) => this.handleImport(e));
    document.getElementById('export-json').addEventListener('click', 
      () => this.showExportUI());
    document.getElementById('import-json').addEventListener('click', 
      () => document.getElementById('import-input').click());
  }

  showExportUI() {
    if (document.querySelector('.export-settings-ui')) {
        return;
    }

    const ui = document.createElement('div');
    ui.className = 'export-settings-ui';

    ui.innerHTML = `
        <h3>Export Settings</h3>
        <div class="setting-item">
            <label>
                <input type="checkbox" id="include-action-history" checked>
                Include Action History
            </label>
        </div>
        <div class="setting-item">
            <label>
                <input type="checkbox" id="full-export">
                Full Export (Download as .zip with all assets)
            </label>
        </div>
        <div class="button-container">
            <button id="export-confirm-btn" class="tool-button">Export</button>
            <button id="export-cancel-btn" class="tool-button">Cancel</button>
        </div>
    `;

    document.body.appendChild(ui);

    const confirmBtn = ui.querySelector('#export-confirm-btn');
    const cancelBtn = ui.querySelector('#export-cancel-btn');
    
    confirmBtn.onclick = () => {
        const includeActionHistory = ui.querySelector('#include-action-history').checked;
        const fullExport = ui.querySelector('#full-export').checked;
        this.exportLevel({ includeActionHistory, fullExport });
        document.body.removeChild(ui);
    };

    cancelBtn.onclick = () => {
        document.body.removeChild(ui);
    };
  }

  async exportLevel(settings = { includeActionHistory: true, fullExport: false }) {
    try {
        const blocks = this.levelSerializer.serializeBlocks();
        const assets = Array.isArray(window.placedAssets?.getPlacedAssets()) ? 
            this.assetSerializer.serializeAssets() : [];
        const assetLibrary = Array.isArray(window.modelManager?.getLoadedModels()) ? 
            this.levelSerializer.serializeAssetLibrary() : [];
        const ground = this.levelSerializer.serializeGround();
        const background = this.levelSerializer.serializeBackground();
        const worldSettings = this.levelSerializer.serializeWorldSettings();
        const textureLibrary = this.levelSerializer.extractTextureURLsFromData(blocks, assets);

        const levelData = {
            blocks,
            assets,
            assetLibrary,
            ground,
            background,
            worldSettings,
            textures: textureLibrary,
        };
        
        let actionHistory = [];
        if (settings.includeActionHistory) {
            actionHistory = window.actionHistory?.getHistory() || [];
            levelData.actionHistory = actionHistory;
        }

        // Remove any image data from serialized objects to prevent base64 data
        const safeJson = JSON.stringify(levelData, (key, value) => {
            // Skip image properties that might contain base64 data
            if (key === 'images' || key === 'image') {
                return undefined;
            }
            return value;
        }, 2);

        if (settings.fullExport) {
            await this.createFullExportZip(safeJson, levelData);
        } else {
            // Regular JSON export
            const blob = new Blob([safeJson], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'level.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        if (window.debugInfo) {
            window.debugInfo.lastAction = 
                `Exported Level${settings.fullExport ? ' (Full Export)' : ''} - Blocks: ${blocks.length}, ` +
                `Assets: ${assets.length}, ` +
                `Asset Library: ${assetLibrary.length}, ` +
                `Ground Cells: ${ground.cells.length}, ` +
                `Background: ${background ? 'Yes' : 'No'}, ` +
                `World Size: ${worldSettings.width}×${worldSettings.height}, ` +
                `Textures: ${textureLibrary.length}, ` +
                `Action History Items: ${settings.includeActionHistory ? actionHistory.length : 'Excluded'}`;
                
            if (window.debugTools) {
                window.debugTools.updateDebugInfo();
            }
        }
    } catch (error) {
        console.error('Error exporting level:', error);
        alert('Error exporting level. Check console for details.');
    }
  }

  async createFullExportZip(jsonContent, levelData) {
    const zip = new JSZip();
    
    // Add the JSON file to the zip
    zip.file('level.json', jsonContent);
    
    // Create asset folders
    const assetsFolder = zip.folder('assets');
    const texturesFolder = assetsFolder.folder('textures');
    const backgroundsFolder = texturesFolder.folder('backgrounds');
    const modelsFolder = assetsFolder.folder('models');
    
    // Collect all unique asset URLs
    const assetUrls = new Set();
    const textureUrls = new Set();
    const backgroundUrls = new Set();
    const modelUrls = new Set();
    
    // Collect texture URLs (excluding background textures)
    if (levelData.textures) {
        levelData.textures.forEach(texture => {
            if (texture.url) {
                textureUrls.add(texture.url);
            }
        });
    }
    
    // Collect background URLs separately
    if (levelData.background && levelData.background.textureUrl) {
        backgroundUrls.add(levelData.background.textureUrl);
    }
    
    // Collect model URLs
    if (levelData.assetLibrary) {
        levelData.assetLibrary.forEach(asset => {
            if (asset.url) {
                modelUrls.add(asset.url);
            }
        });
    }
    
    // Also check placed assets for additional models
    if (levelData.assets) {
        levelData.assets.forEach(asset => {
            if (asset.url) {
                modelUrls.add(asset.url);
            }
        });
    }
    
    // Show progress indicator
    this.showExportProgress();
    
    try {
        // Download and add texture files
        let processed = 0;
        const totalFiles = textureUrls.size + backgroundUrls.size + modelUrls.size;
        
        for (const url of textureUrls) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const filename = this.getFilenameFromUrl(url);
                texturesFolder.file(filename, blob);
                processed++;
                this.updateExportProgress((processed / totalFiles) * 50);
            } catch (error) {
                console.warn('Failed to download texture:', url, error);
            }
        }
        
        // Download and add background files
        for (const url of backgroundUrls) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const filename = this.getFilenameFromUrl(url);
                backgroundsFolder.file(filename, blob);
                processed++;
                this.updateExportProgress((processed / totalFiles) * 50);
            } catch (error) {
                console.warn('Failed to download background:', url, error);
            }
        }
        
        // Download and add model files
        for (const url of modelUrls) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const filename = this.getFilenameFromUrl(url);
                modelsFolder.file(filename, blob);
                processed++;
                this.updateExportProgress((processed / totalFiles) * 50);
            } catch (error) {
                console.warn('Failed to download model:', url, error);
            }
        }
        
        // Generate and download the zip
        this.updateExportProgress(75);
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        });
        
        this.updateExportProgress(100);
        
        // Download the zip file
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'level-full-export.zip';
        a.click();
        URL.revokeObjectURL(url);
        
    } finally {
        this.hideExportProgress();
    }
  }

  getFilenameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        let filename = urlObj.pathname.split('/').pop();
        
        // If no filename or extension, generate one
        if (!filename || !filename.includes('.')) {
            const extension = this.guessExtensionFromUrl(url);
            filename = `asset_${Date.now()}.${extension}`;
        }
        
        return filename;
    } catch (error) {
        // Fallback for invalid URLs
        return `asset_${Date.now()}.bin`;
    }
  }

  guessExtensionFromUrl(url) {
    const lowerUrl = url.toLowerCase();
    
    // Check for common image extensions
    if (lowerUrl.includes('png') || lowerUrl.includes('image/png')) return 'png';
    if (lowerUrl.includes('jpg') || lowerUrl.includes('jpeg') || lowerUrl.includes('image/jpeg')) return 'jpg';
    if (lowerUrl.includes('gif') || lowerUrl.includes('image/gif')) return 'gif';
    if (lowerUrl.includes('webp') || lowerUrl.includes('image/webp')) return 'webp';
    if (lowerUrl.includes('hdr')) return 'hdr';
    if (lowerUrl.includes('exr')) return 'exr';
    
    // Check for 3D model extensions
    if (lowerUrl.includes('gltf') || lowerUrl.includes('model/gltf')) return 'gltf';
    if (lowerUrl.includes('glb') || lowerUrl.includes('model/gltf-binary')) return 'glb';
    
    // Default fallback
    return 'bin';
  }

  showExportProgress() {
    const indicator = document.createElement('div');
    indicator.id = 'export-progress-indicator';
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
        <div style="margin-bottom: 10px;">Creating Full Export...</div>
        <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
          <div id="export-progress" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  updateExportProgress(percent) {
    const progress = document.getElementById('export-progress');
    if (progress) {
      progress.style.width = `${percent}%`;
    }
  }

  hideExportProgress() {
    const indicator = document.getElementById('export-progress-indicator');
    if (indicator) {
      document.body.removeChild(indicator);
    }
  }

  async handleImport(event) {
    if (event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const levelData = JSON.parse(e.target.result);
        this.levelImporter.importLevel(levelData);
      } catch (error) {
        console.error('Error importing level:', error);
        window.debugInfo.lastAction = `Error importing level: ${error.message}`;
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  // Delegate methods to maintain compatibility
  serializeBlocks() {
    return this.levelSerializer.serializeBlocks();
  }

  serializeAssets() {
    return this.assetSerializer.serializeAssets();
  }

  extractTextureURLsFromData(blocks, assets) {
    return this.levelSerializer.extractTextureURLsFromData(blocks, assets);
  }

  importLevel(levelData) {
    return this.levelImporter.importLevel(levelData);
  }
}

// Assign FileManager to the window object
window.FileManager = FileManager;