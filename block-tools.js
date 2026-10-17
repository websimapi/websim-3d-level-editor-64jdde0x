class BlockTools {
  constructor(scene, gridBlocks) {
    this.scene = scene;
    this.gridBlocks = gridBlocks;
    
    // Initialize specialized managers
    this.selection = new BlockSelectionManager(scene, gridBlocks);
    this.modification = new BlockModificationManager(scene, gridBlocks, this.selection);
    this.ui = new BlockUIManager(gridBlocks, this.selection);

    // Make managers available globally for convenience if needed, but prefer access through blockTools
    window.blockSelectionManager = this.selection;
    window.blockModificationManager = this.modification;
  }

  // --- Delegated Methods for Selection ---
  
  selectBlock(block) {
    this.selection.selectBlock(block);
  }

  selectBlocks(blocks, isCtrlClick = false, isShiftClick = false) {
    this.selection.selectBlocks(blocks, isCtrlClick, isShiftClick);
  }

  clearAllSelections() {
    this.selection.clearAllSelections();
  }

  getSelectedBlock() {
    return this.selection.getSelectedBlock();
  }

  getSelectedBlocks() {
    return this.selection.getSelectedBlocks();
  }
  
  isBlockSelected(block) {
    return this.selection.isBlockSelected(block);
  }

  // --- Delegated Methods for Modification ---

  updateBlockType(block, newType) {
    this.modification.updateBlockType(block, newType);
  }

  updateBlockOrientation(block, newOrientation) {
    this.modification.updateBlockOrientation(block, newOrientation);
  }

  updateBlockColor(block, newColor) {
    return this.modification.updateBlockColor(block, newColor);
  }
  
  // --- Delegated Methods for UI ---

  updateBlocksList() {
    this.ui.updateBlocksList();
  }
  
  updateBlockUI(block) {
    this.ui.updateBlockUI(block);
  }
}

window.BlockTools = BlockTools;