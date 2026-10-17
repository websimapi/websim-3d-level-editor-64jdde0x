class PlacedAssets {
  constructor(scene, loader) {
    this.scene = scene;
    this.loader = loader;
    this.placedAssets = [];
    this.selectedPlacedAsset = null;
    this.assetIdCounter = 0;

    // Backwards-compat flags/properties used by other systems
    this.manipulationHelper = null;
    this.isInteractingWithGizmo = false;

    // Default config (overridden by external JSON)
    this.config = {
      gizmo: {
        arrow: { coneRadius: 0.15, coneHeight: 0.6, coneSegments: 8 },
        cylinder: { radiusTop: 0.08, radiusBottom: 0.08, height: 1.8, radialSegments: 8 },
        offset: { arrowDistance: 2.2, cylinderDistance: 1.1 },
        renderOrder: 999,
        materials: { xColor: 0xff0000, yColor: 0x00ff00, zColor: 0x0000ff, transparent: false },
        materialDepth: { depthTest: false, depthWrite: false },
        sensitivity: 1.0,
        cursor: { hover: 'grab', drag: 'grabbing', default: 'default' },
        dragThresholdMs: 150
      },
      rotationUI: {
        positionSliderRange: 5,
        positionStep: 0.01,
        rotation: { min: 0, max: 360, step: 1 },
        scale: { min: 0.1, max: 5, step: 0.1, default: 1 },
        presetAngles: [0,45,90,135,180,225,270,315]
      },
      deletion: { useHistory: true }
    };

    // Managers
    this.gizmoManager = new GizmoManager(scene, this);
    this.rotationUI = new AssetRotationUI(this);
    this.selectionManager = new AssetSelectionManager(this);

    // Load external config
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const res = await fetch('placed-assets-config.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Config not found');
      const cfg = await res.json();
      this.config = Object.assign(this.config, cfg);
      if (window.debugTools) {
        window.debugInfo.lastAction = 'Loaded placed-assets configuration';
        window.debugTools.updateDebugInfo();
      }
    } catch (err) {
      console.warn('PlacedAssets config load failed, using defaults:', err);
    }
  }

  // Collection helpers
  addAsset(assetData) { this.placedAssets.push(assetData); }
  getAssets() { return this.placedAssets; }
  getModels() { return this.placedAssets.map(a => a.model); }
  getPlacedAssets() { return this.placedAssets; }
  getPlacedAssetById(id) { return this.placedAssets.find(a => a.id === id); }

  addPlacedAssetToList(assetData) {
    this.selectionManager.addAssetToList(assetData);
    this.addAsset(assetData);
  }

  selectPlacedAsset(assetId) {
    const asset = this.getPlacedAssetById(assetId);
    if (!asset) return;

    if (this.selectedPlacedAsset) {
      this.deselectPlacedAsset();
    }

    this.selectedPlacedAsset = asset;

    const helper = new THREE.BoxHelper(asset.model, 0xffff00);
    helper.name = 'selectionHelper';
    this.scene.add(helper);
    asset.helper = helper;

    this.selectionManager.selectItemUI(asset);

    // Auto-switch to move mode when selecting an asset
    if (window.toolStateManager) {
      window.toolStateManager.setTool('move-mode');
    }

    // Show rotation/position/scale UI
    this.rotationUI.show(asset);

    // Create gizmo (manipulation helper)
    setTimeout(() => {
      this.gizmoManager.createHelper(asset);
    }, 50);
  }

  deselectPlacedAsset() {
    if (!this.selectedPlacedAsset) return;

    const asset = this.selectedPlacedAsset;

    if (asset.helper) {
      this.scene.remove(asset.helper);
      asset.helper = null;
    }

    this.rotationUI.hide(asset);
    this.selectionManager.deselectItemUI(asset);

    // Remove gizmo
    this.gizmoManager.removeHelper();

    this.selectedPlacedAsset = null;
  }

  updateManipulationHelper() {
    this.gizmoManager.updateHelperPosition();
  }

  deletePlacedAsset(assetId, recordAction = true) {
    const asset = this.getPlacedAssetById(assetId);
    if (!asset) return;

    if (asset.helper) {
      this.scene.remove(asset.helper);
    }
    if (asset.model) {
      this.scene.remove(asset.model);
    }
    if (asset.assetItem && asset.assetItem.parentNode) {
      asset.assetItem.parentNode.removeChild(asset.assetItem);
    }

    const index = this.placedAssets.findIndex(a => a.id === assetId);
    if (index !== -1) this.placedAssets.splice(index, 1);

    if (this.selectedPlacedAsset && this.selectedPlacedAsset.id === assetId) {
      this.deselectPlacedAsset();
    }

    if (recordAction && this.config.deletion.useHistory) {
      window.debugInfo.lastAction = `Deleted asset ${assetId}`;
      window.actionHistory.addAction(window.debugInfo.lastAction, {
        type: 'deleteAsset',
        assetData: {
          id: asset.id,
          url: asset.url,
          name: asset.name,
          position: {
            x: asset.model.position.x,
            y: asset.model.position.y,
            z: asset.model.position.z
          },
          rotation: {
            x: asset.model.rotation.x,
            y: asset.model.rotation.y,
            z: asset.model.rotation.z
          },
          scale: {
            x: asset.model.scale.x,
            y: asset.model.scale.y,
            z: asset.model.scale.z
          }
        }
      });
      window.debugTools.updateDebugInfo();
    }
  }

  clearAllAssets() {
    this.placedAssets.forEach(asset => {
      if (asset.helper) this.scene.remove(asset.helper);
      if (asset.model) this.scene.remove(asset.model);
      if (asset.assetItem && asset.assetItem.parentNode) {
        asset.assetItem.parentNode.removeChild(asset.assetItem);
      }
    });

    this.placedAssets = [];
    this.selectedPlacedAsset = null;
    this.gizmoManager.removeHelper();
    this.selectionManager.clearAll();
  }
}

window.PlacedAssets = PlacedAssets;