class AssetHistoryCommands {
  static undo(action) {
    const d = action.data;
    switch (d.type) {
      case 'placeAsset':
        if (d.assetData && d.assetData.id) {
          if (window.placedAssets.selectedPlacedAsset &&
              window.placedAssets.selectedPlacedAsset.id===d.assetData.id) {
            window.placedAssets.deselectPlacedAsset();
          }
          window.placedAssets.deletePlacedAsset(d.assetData.id, false);
        }
        break;

      case 'deleteAsset':
        if (d.assetData && window.loader) {
          window.loader.load(d.assetData.url, gltf => {
            const model = gltf.scene;
            model.position.set(
              d.assetData.position.x, d.assetData.position.y, d.assetData.position.z
            );
            model.rotation.set(
              d.assetData.rotation.x||0, d.assetData.rotation.y||0, d.assetData.rotation.z||0
            );
            model.scale.set(
              d.assetData.scale.x||1, d.assetData.scale.y||1, d.assetData.scale.z||1
            );
            model.userData.url=d.assetData.url;
            model.userData.name=d.assetData.name;
            window.rendererManager.getScene().add(model);
            const asset = {
              id:d.assetData.id,
              model:model,
              position:model.position.clone(),
              url:d.assetData.url,
              name:d.assetData.name
            };
            window.placedAssets.addPlacedAssetToList(asset);
          });
        }
        break;

      case 'moveAsset':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            a.model.position.copy(d.previousPosition);
            if(a.helper) a.helper.update();
            window.placedAssets.updateManipulationHelper();
          }
        }
        break;

      case 'rotateAsset':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            a.model.rotation.y = d.previousRotation;
            if(a.helper) a.helper.update();
          }
        }
        break;

      case 'rotateAssetAxis':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            a.model.rotation[d.axis] = d.previousRotation;
            if(a.helper) a.helper.update();
          }
        }
        break;

      case 'changeAssetType':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            a.type = d.previousType;
            if(a.typeSelect) a.typeSelect.value = d.previousType;
          }
        }
        break;

      case 'scaleAsset':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            if(d.axis==='All') {
              a.model.scale.set(d.previousScale.x,d.previousScale.y,d.previousScale.z);
            } else {
              a.model.scale[d.axis.toLowerCase()] = d.previousScale;
            }
            if(a.helper) a.helper.update();
          }
        }
        break;

      case 'applyAssetTexture':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            d.previousMaterials.forEach(prev=>{
              prev.object.material.map = prev.texture;
              if(!prev.texture) prev.object.material.color.set('#'+prev.color);
              prev.object.material.needsUpdate=true;
            });
          }
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
      case 'placeAsset':
        if(d.assetData){
          window.loader.load(d.assetData.url, gltf=>{
            const model = gltf.scene;
            model.position.set(d.assetData.position.x, d.assetData.position.y, d.assetData.position.z);
            model.rotation.set(d.assetData.rotation.x||0,d.assetData.rotation.y||0,d.assetData.rotation.z||0);
            model.scale.set(d.assetData.scale.x||1,d.assetData.scale.y||1,d.assetData.scale.z||1);
            model.userData.url=d.assetData.url;
            model.userData.name=d.assetData.name;
            window.rendererManager.getScene().add(model);
            const asset = {
              id:d.assetData.id,
              model:model,
              position:model.position.clone(),
              url:d.assetData.url,
              name:d.assetData.name
            };
            window.placedAssets.addPlacedAssetToList(asset);
          });
        }
        break;

      case 'deleteAsset':
        if(window.placedAssets) {
          window.placedAssets.deletePlacedAsset(d.assetData.id, false);
        }
        break;

      case 'moveAsset':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a) {
            a.model.position.copy(d.newPosition);
            if(a.helper) a.helper.update();
            window.placedAssets.updateManipulationHelper();
          }
        }
        break;

      case 'changeAssetType':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a){
            a.type = d.newType;
            if(a.typeSelect) a.typeSelect.value = d.newType;
          }
        }
        break;

      case 'rotateAssetAxis':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a){
            a.model.rotation[d.axis] = d.newRotation;
            if(a.helper) a.helper.update();
          }
        }
        break;

      case 'scaleAsset':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a){
            if(d.axis==='All'){
              a.model.scale.set(d.newScale,d.newScale,d.newScale);
            } else {
              a.model.scale[d.axis.toLowerCase()] = d.newScale;
            }
            if(a.helper) a.helper.update();
          }
        }
        break;

      case 'applyAssetTexture':
        {
          const a = window.placedAssets.getPlacedAssetById(d.assetId);
          if(a){
            const loader = new THREE.TextureLoader();
            loader.load(d.textureUrl, tex=>{
              a.model.traverse(child=>{
                if(child.material){
                  child.material.map = tex;
                  child.material.needsUpdate = true;
                }
              });
            });
          }
        }
        break;

      default:
        return false; // Not handled by this command handler
    }
    return true; // Handled successfully
  }
}

window.AssetHistoryCommands = AssetHistoryCommands;