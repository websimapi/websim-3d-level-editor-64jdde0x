class AssetSelectionManager {
  constructor(placedAssets) {
    this.placedAssets = placedAssets;
    this.listEl = document.getElementById('placed-assets-list');
  }

  addAssetToList(assetData) {
    const item = document.createElement('div');
    item.className = 'asset-item';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-asset-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = e => {
      e.stopPropagation();
      this.placedAssets.deletePlacedAsset(assetData.id, true);
    };

    const typeSelect = document.createElement('select');
    typeSelect.className = 'asset-type-select';
    ['scene object', 'player', 'npc', 'texture'].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      typeSelect.appendChild(option);
    });
    typeSelect.value = assetData.type || 'scene object';
    typeSelect.addEventListener('change', e => {
      const newType = e.target.value;
      const oldType = assetData.type || 'scene object';
      assetData.type = newType;
      window.debugInfo.lastAction = `Changed asset ${assetData.id} type from ${oldType} to ${newType}`;
      window.actionHistory.addAction(window.debugInfo.lastAction, {
        type: 'changeAssetType',
        assetId: assetData.id,
        previousType: oldType,
        newType: newType
      });
      window.debugTools.updateDebugInfo();
    });

    item.innerHTML = `<div class="asset-name">${assetData.name} (ID: ${assetData.id})</div>`;
    item.appendChild(typeSelect);
    item.appendChild(deleteBtn);
    this.listEl.appendChild(item);

    item.querySelector('.asset-name').addEventListener('click', () => {
      this.placedAssets.selectPlacedAsset(assetData.id);
    });

    assetData.assetItem = item;
    assetData.typeSelect = typeSelect;

    // Ensure shadows are enabled for the model
    if (assetData.model) {
      assetData.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => { mat.shadowSide = THREE.DoubleSide; });
            } else {
              child.material.shadowSide = THREE.DoubleSide;
            }
          }
        }
      });
    }
  }

  selectItemUI(asset) {
    if (!asset?.assetItem) return;
    asset.assetItem.classList.add('selected-asset');
  }

  deselectItemUI(asset) {
    if (!asset?.assetItem) return;
    asset.assetItem.classList.remove('selected-asset');
  }

  clearAll() {
    this.listEl.innerHTML = '';
  }
}

window.AssetSelectionManager = AssetSelectionManager;

