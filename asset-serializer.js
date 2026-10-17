class AssetSerializer {
  constructor() {
    // This class handles serialization of asset data
  }

  serializeAssets() {
    if (!window.placedAssets?.getPlacedAssets()) {
        return [];
    }

    return window.placedAssets.getPlacedAssets().reduce((acc, asset) => {
        try {
            if (!asset || !asset.model) {
                console.warn('Invalid asset found');
                return acc;
            }

            const assetData = {
                id: asset.id || Date.now(),
                url: asset.url || asset.model.userData?.url,
                name: asset.name || asset.model.userData?.name || 'Unnamed Asset',
                type: asset.type || 'scene object',
                position: {
                    x: asset.model.position.x || 0,
                    y: asset.model.position.y || 0,
                    z: asset.model.position.z || 0
                },
                rotation: {
                    x: asset.model.rotation.x || 0,
                    y: asset.model.rotation.y || 0,
                    z: asset.model.rotation.z || 0
                },
                scale: {
                    x: asset.model.scale.x || 1,
                    y: asset.model.scale.y || 1,
                    z: asset.model.scale.z || 1
                }
            };

            // Handle textures if they exist
            const appliedTextures = [];
            asset.model.traverse(child => {
                if (child.material?.map?.userData?.url) {
                    appliedTextures.push(child.material.map.userData.url);
                }
            });

            if (appliedTextures.length > 0) {
                assetData.textureUrls = appliedTextures;
            }

            // Remove any image data properties to prevent base64 serialization
            delete assetData.image;
            delete assetData.images;

            acc.push(assetData);
            return acc;
        } catch (error) {
            console.warn('Error serializing asset:', error);
            return acc;
        }
    }, []);
  }
}

window.AssetSerializer = AssetSerializer;