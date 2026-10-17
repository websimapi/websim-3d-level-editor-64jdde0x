class BlockColorManager {
  constructor() {
    this.initColorControls();
  }

  initColorControls() {
    document.getElementById('block-color').addEventListener('input', (e) => {
      const selectedBlock = this.getSelectedBlock();
      if (selectedBlock) {
        this.showColorSelectionUI(e, selectedBlock);
      }
    });
  }

  showColorSelectionUI(event, selectedBlock) {
    // Create or show color selection UI if it doesn't exist
    if (!document.getElementById('color-selection-ui')) {
      const colorUI = document.createElement('div');
      colorUI.id = 'color-selection-ui';
      colorUI.style.position = 'absolute';
      colorUI.style.background = '#444';
      colorUI.style.padding = '10px';
      colorUI.style.borderRadius = '4px';
      colorUI.style.zIndex = '1000';
      
      const colorInput = document.getElementById('block-color');
      const rect = colorInput.getBoundingClientRect();
      colorUI.style.top = `${rect.bottom + 5}px`;
      colorUI.style.left = `${rect.left}px`;
      
      const previewBlock = document.createElement('div');
      previewBlock.id = 'color-preview';
      previewBlock.style.width = '100%';
      previewBlock.style.height = '30px';
      previewBlock.style.marginBottom = '10px';
      previewBlock.style.borderRadius = '4px';
      previewBlock.style.background = event.target.value;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '5px';
      
      const submitButton = document.createElement('button');
      
      // Get all selected blocks for multi-select support
      const selectedBlocks = window.blockTools?.getSelectedBlocks() || [];
      const allSelectedBlocks = selectedBlocks.length > 0 ? selectedBlocks : [selectedBlock];
      
      submitButton.textContent = allSelectedBlocks.length > 1 ? `Apply to ${allSelectedBlocks.length} blocks` : 'Apply';
      submitButton.className = 'tool-button';
      submitButton.onclick = () => {
        // Collect all block data for batch operation
        const batchData = [];
        
        // Apply color to all selected blocks
        allSelectedBlocks.forEach(block => {
          if (!block) return;
          
          let previousColor = '';
          
          if (Array.isArray(block.material)) {
            previousColor = block.material[0].color.getHexString();
            // Apply to all materials in the array
            block.material.forEach(mat => {
              if (mat) mat.color.set(event.target.value);
            });
          } else if (block.material) {
            previousColor = block.material.color.getHexString();
            block.material.color.set(event.target.value);
          }
          
          // Add this block's data to the batch
          batchData.push({
            blockKey: block.userData.key,
            previousColor: previousColor,
            newColor: event.target.value.replace('#', ''),
            block: block
          });
        });
        
        // Create single batch action instead of individual actions
        const actionDescription = allSelectedBlocks.length > 1 ? 
          `Changed color for ${allSelectedBlocks.length} blocks to ${event.target.value}` :
          `Changed block color to ${event.target.value}`;
        
        window.actionHistory.addAction(actionDescription, {
          type: 'changeBlockColorBatch',
          batchData: batchData
        });
        
        window.debugInfo.lastAction = actionDescription;
        window.debugTools.updateDebugInfo();
        
        document.body.removeChild(colorUI);
      };
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.className = 'tool-button';
      cancelButton.onclick = () => {
        if (Array.isArray(selectedBlock.material)) {
          event.target.value = '#' + selectedBlock.material[0].color.getHexString();
        } else if (selectedBlock.material) {
          event.target.value = '#' + selectedBlock.material.color.getHexString();
        }
        document.body.removeChild(colorUI);
      };
      
      buttonContainer.appendChild(submitButton);
      buttonContainer.appendChild(cancelButton);
      
      colorUI.appendChild(previewBlock);
      colorUI.appendChild(buttonContainer);
      document.body.appendChild(colorUI);
      
      // Update preview color as user changes the color input
      event.target.addEventListener('input', (colorEvent) => {
        if (document.getElementById('color-preview')) {
          document.getElementById('color-preview').style.background = colorEvent.target.value;
        }
      });
      
      // Remove UI if clicking outside
      document.addEventListener('click', (clickEvent) => {
        if (!colorUI.contains(clickEvent.target) && 
            clickEvent.target !== event.target && 
            document.getElementById('color-selection-ui')) {
          if (Array.isArray(selectedBlock.material)) {
            event.target.value = '#' + selectedBlock.material[0].color.getHexString();
          } else if (selectedBlock.material) {
            event.target.value = '#' + selectedBlock.material.color.getHexString();
          }
          document.body.removeChild(colorUI);
        }
      });
    } else {
      // Update existing preview
      document.getElementById('color-preview').style.background = event.target.value;
    }
  }

  getSelectedBlock() {
    return window.blockTools?.getSelectedBlock() || window.selectedBlock || null;
  }
}

window.BlockColorManager = BlockColorManager;