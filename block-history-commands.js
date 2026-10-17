class BlockHistoryCommands {
  static undo(action) {
    const d = action.data;
    switch (d.type) {
      case 'placeBlock':
        window.placedBlocks.removeBlock(d.key);
        break;

      case 'removeBlock':
        if (d.blockData) {
          const pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z);
          const block = window.placedBlocks.addBlock(pos, d.blockData.type);
          const key = d.key;
          window.gridBlocks[key] = block;
          // restore orientation
          if (d.blockData.orientation) {
            block.userData.orientation = d.blockData.orientation;
            let rot = 0;
            switch (d.blockData.orientation) {
              case 'east': rot = Math.PI/2; break;
              case 'south': rot = Math.PI; break;
              case 'west': rot = -Math.PI/2; break;
            }
            block.rotation.y = rot;
          }
          // restore color
          if (d.blockData.color) {
            if (Array.isArray(block.material)) {
              block.material.forEach(mat => { if(mat) mat.color.set('#'+d.blockData.color); });
            } else {
              block.material.color.set('#'+d.blockData.color);
            }
          }
          // restore texture(s)
          if (d.blockData.textureUrl) {
            const loader = new THREE.TextureLoader();
            loader.load(d.blockData.textureUrl, tex => {
              tex.userData = { url: d.blockData.textureUrl };
              if (Array.isArray(block.material)) {
                block.material.forEach(mat => { mat.map = tex; mat.needsUpdate=true; });
              } else {
                block.material.map = tex; block.material.needsUpdate = true;
              }
            });
          }
          if (d.blockData.materials) {
            // apply each material
            if (!Array.isArray(block.material)) {
              const base = block.material.clone();
              block.material = Array(d.blockData.materials.length).fill().map(()=>base.clone());
            }
            d.blockData.materials.forEach((md,i)=>{
              if (block.material[i]) {
                if (md.color) block.material[i].color.set('#'+md.color);
                if (md.textureUrl) {
                  const loader = new THREE.TextureLoader();
                  loader.load(md.textureUrl, tex => {
                    tex.userData={url:md.textureUrl};
                    block.material[i].map=tex; block.material[i].needsUpdate=true;
                  });
                }
              }
            });
          }
        } else {
          window.placedBlocks.addBlock(
            new THREE.Vector3(d.position.x, d.position.y, d.position.z),
            d.blockType || 'half'
          );
        }
        break;

      case 'changeBlockColor':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if (blk) {
            if (Array.isArray(blk.material)) {
              blk.material.forEach(mat=>mat.color.set('#'+d.previousColor));
            } else {
              blk.material.color.set('#'+d.previousColor);
            }
            
            // Update UI if this block is currently selected
            if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
              document.getElementById('block-color').value='#'+d.previousColor;
            }
          }
        }
        break;

      case 'changeBlockColorBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if (blk) {
              if (Array.isArray(blk.material)) {
                blk.material.forEach(mat=>mat.color.set('#'+blockData.previousColor));
              } else {
                blk.material.color.set('#'+blockData.previousColor);
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                document.getElementById('block-color').value='#'+blockData.previousColor;
              }
            }
          });
        }
        break;

      case 'changeBlockOrientation':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if (blk) {
            blk.userData.orientation = d.previousOrientation;
            let rot = 0;
            switch (d.previousOrientation) {
              case 'east': rot = Math.PI/2; break;
              case 'south': rot = Math.PI; break;
              case 'west': rot = -Math.PI/2; break;
            }
            blk.rotation.y = rot;
            if (window.selectedBlock===blk) {
              document.getElementById('block-orientation').value=d.previousOrientation;
            }
          }
        }
        break;

      case 'changeBlockType':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if(blk) {
            window.blockTools.updateBlockType(blk, d.previousType);
          }
        }
        break;

      case 'placeFill':
        {
          const [sx,sy,sz] = d.startKey.split(',').map(n=>parseInt(n));
          for(let x=0;x<d.dimensions.width;x++){
            for(let y=0;y<d.dimensions.height;y++){
              for(let z=0;z<d.dimensions.depth;z++){
                const key = `${sx+x},${sy+y},${sz+z}`;
                window.placedBlocks.removeBlock(key);
              }
            }
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
      case 'placeBlock':
        {
          const block = window.placedBlocks.addBlock(
            new THREE.Vector3(d.position.x, d.position.y, d.position.z),
            d.blockType
          );
          window.placedBlocks.getGridBlocks()[d.key] = block;
        }
        break;

      case 'removeBlock':
        window.placedBlocks.removeBlock(d.key);
        break;

      case 'changeBlockColor':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if(blk){
            if(Array.isArray(blk.material)) {
              blk.material.forEach(mat=>mat.color.set('#'+d.newColor));
            } else {
              blk.material.color.set('#'+d.newColor);
            }
            
            // Update UI if this block is currently selected
            if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
              document.getElementById('block-color').value='#'+d.newColor;
            }
          }
        }
        break;

      case 'changeBlockColorBatch':
        {
          d.batchData.forEach(blockData => {
            const blk = window.placedBlocks.getGridBlocks()[blockData.blockKey];
            if(blk){
              if(Array.isArray(blk.material)) {
                blk.material.forEach(mat=>mat.color.set('#'+blockData.newColor));
              } else {
                blk.material.color.set('#'+blockData.newColor);
              }
              
              // Update UI if this block is currently selected
              if (window.blockTools && window.blockTools.isBlockSelected && window.blockTools.isBlockSelected(blk)) {
                document.getElementById('block-color').value='#'+blockData.newColor;
              }
            }
          });
        }
        break;

      case 'changeBlockOrientation':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if(blk){
            blk.userData.orientation = d.newOrientation;
            let rot = 0;
            switch(d.newOrientation){
              case 'east': rot = Math.PI/2; break;
              case 'south': rot = Math.PI; break;
              case 'west': rot = -Math.PI/2; break;
            }
            blk.rotation.y = rot;
            if(window.selectedBlock===blk){
              document.getElementById('block-orientation').value=d.newOrientation;
            }
          }
        }
        break;

      case 'changeBlockType':
        {
          const blk = window.placedBlocks.getGridBlocks()[d.key];
          if(blk){
            window.blockTools.updateBlockType(blk, d.newType);
          }
        }
        break;

      case 'placeFill':
        {
          const [sx,sy,sz] = d.startKey.split(',').map(n=>parseInt(n));
          for(let x=0;x<d.dimensions.width;x++){
            for(let y=0;y<d.dimensions.height;y++){
              for(let z=0;z<d.dimensions.depth;z++){
                const posX=sx+x, posY=sy+y, posZ=sz+z;
                const key=`${posX},${posY},${posZ}`;
                if(!window.gridBlocks[key]){
                  const block = window.placedBlocks.addBlock(
                    new THREE.Vector3(posX,posY,posZ),
                    d.blockType
                  );
                  if(block){
                    if(Array.isArray(block.material)){
                      block.material.forEach(mat=>mat.color.set(d.color));
                    } else {
                      block.material.color.set(d.color);
                    }
                    block.userData.orientation = d.orientation;
                    let rot=0;
                    switch(d.orientation){
                      case 'east': rot=Math.PI/2; break;
                      case 'south': rot=Math.PI; break;
                      case 'west': rot=-Math.PI/2; break;
                    }
                    block.rotation.y = rot;
                    window.gridBlocks[key]=block;
                  }
                }
              }
            }
          }
          window.placedBlocks.updateBlocksList();
        }
        break;

      default:
        return false; // Not handled by this command handler
    }
    return true; // Handled successfully
  }
}

window.BlockHistoryCommands = BlockHistoryCommands;