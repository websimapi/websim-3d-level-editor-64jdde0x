class BlockUIManager {
  constructor(gridBlocks, selectionManager) {
    this.gridBlocks = gridBlocks;
    this.selection = selectionManager;
    this.initEventListeners();
  }
  
  initEventListeners() {
    document.getElementById('block-type').addEventListener('change', (e) => {
      const selectedBlock = this.selection.getSelectedBlock();
      if (selectedBlock) {
        window.blockModificationManager.updateBlockType(selectedBlock, e.target.value);
      }
    });

    document.getElementById('block-orientation').addEventListener('change', (e) => {
      const selectedBlock = this.selection.getSelectedBlock();
      if (selectedBlock) {
        window.blockModificationManager.updateBlockOrientation(selectedBlock, e.target.value);
      }
    });

    document.getElementById('block-type-half').addEventListener('click', () => this.applyTypeFromIcon('half'));
    document.getElementById('block-type-full').addEventListener('click', () => this.applyTypeFromIcon('full'));
    document.getElementById('block-type-stair').addEventListener('click', () => this.applyTypeFromIcon('stair'));
    document.getElementById('orient-north').addEventListener('click', () => this.applyOrientationFromIcon('north'));
    document.getElementById('orient-east').addEventListener('click', () => this.applyOrientationFromIcon('east'));
    document.getElementById('orient-south').addEventListener('click', () => this.applyOrientationFromIcon('south'));
    document.getElementById('orient-west').addEventListener('click', () => this.applyOrientationFromIcon('west'));
  }

  applyTypeFromIcon(type) {
    const sel = document.getElementById('block-type');
    sel.value = type;
    sel.dispatchEvent(new Event('change'));
    this.syncTypeButtons(type);
  }

  applyOrientationFromIcon(orientation) {
    const sel = document.getElementById('block-orientation');
    sel.value = orientation;
    sel.dispatchEvent(new Event('change'));
    this.syncOrientationButtons(orientation);
  }

  syncTypeButtons(type) {
    ['half','full','stair'].forEach(t=>{
      const btn = document.getElementById(`block-type-${t}`);
      if (btn) { btn.classList.toggle('active', t===type); btn.setAttribute('aria-pressed', t===type); }
    });
  }

  syncOrientationButtons(orientation) {
    const map = {north:'orient-north', east:'orient-east', south:'orient-south', west:'orient-west'};
    Object.entries(map).forEach(([k,id])=>{
      const btn = document.getElementById(id);
      if (btn) { btn.classList.toggle('active', k===orientation); btn.setAttribute('aria-pressed', k===orientation); }
    });
  }

  updateBlocksList() {
    const blocksList = document.getElementById('placed-blocks-list');
    const scrollTop = blocksList.scrollTop;
    blocksList.innerHTML = '';
    const selectedBlocks = this.selection.getSelectedBlocks();

    Object.entries(this.gridBlocks).forEach(([key, block]) => {
      const blockItem = document.createElement('div');
      blockItem.className = 'block-item';
      
      if (selectedBlocks.includes(block)) {
        blockItem.classList.add('selected-block');
      }

      const [x, y, z] = key.split(',').map(Number);
      blockItem.textContent = `${block.userData.blockType || 'half'} Block at (${x}, ${y}, ${z}) facing ${block.userData.orientation || 'north'}`;
      
      blockItem.addEventListener('click', (e) => {
        this.selection.selectBlocks([block], e.ctrlKey || e.metaKey, e.shiftKey);
      });

      blocksList.appendChild(blockItem);
    });

    blocksList.scrollTop = scrollTop;
  }
  
  updateBlockUI(block) {
    if (!block) return;
    if (Array.isArray(block.material) && block.material.length > 0) {
      if (block.material[0] && block.material[0].color) {
        document.getElementById('block-color').value = '#' + block.material[0].color.getHexString();
      }
    } else if (block.material && block.material.color) {
      document.getElementById('block-color').value = '#' + block.material.color.getHexString();
    }
    document.getElementById('block-orientation').value = block.userData.orientation || 'north';
    document.getElementById('block-type').value = block.userData.blockType || 'half';
    this.syncTypeButtons(document.getElementById('block-type').value);
    this.syncOrientationButtons(document.getElementById('block-orientation').value);
  }
}

window.BlockUIManager = BlockUIManager;