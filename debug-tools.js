class DebugTools {
  constructor() {
    this.debugInfo = {
      mousePosition: { x: 0, y: 0 },
      normalizedMouse: { x: 0, y: 0 },
      raycastHit: null, 
      gridPosition: null,
      cameraPosition: null,
      lastAction: null
    };
    
    this.initDebugConsole();
  }

  initDebugConsole() {
    const debugConsole = document.getElementById('debug-console');
    window.addEventListener('keydown', event => {
      if (event.key === '`') {
        debugConsole.classList.toggle('visible');
      }
    });
  }

  updateDebugInfo() {
    const content = document.getElementById('debug-content');
    if (!content) return;
    
    content.innerHTML = `Mouse Position (screen): ${this.debugInfo.mousePosition.x}, ${this.debugInfo.mousePosition.y}
Normalized Mouse: ${this.debugInfo.normalizedMouse.x.toFixed(3)}, ${this.debugInfo.normalizedMouse.y.toFixed(3)}
Camera Position: ${JSON.stringify(this.debugInfo.cameraPosition)}
Raycast Hit: ${this.debugInfo.raycastHit ? 'Yes' : 'No'}
${this.debugInfo.raycastHit ? `Hit Position: ${JSON.stringify(this.debugInfo.raycastHit)}` : ''}
Grid Position: ${JSON.stringify(this.debugInfo.gridPosition)}
Last Action: ${this.debugInfo.lastAction || 'None'}
Active Blocks: ${Object.keys(window.gridBlocks || {}).length}
Active Assets: ${window.placedAssets?.getPlacedAssets()?.length || 0}
Block Positions: ${JSON.stringify(Object.keys(window.gridBlocks || {}), null, 2)}`;
  }

  setMousePosition(x, y) {
    this.debugInfo.mousePosition = { x, y };
  }

  setNormalizedMouse(x, y) {
    this.debugInfo.normalizedMouse = { x, y };
  }

  setCameraPosition(x, y, z) {
    this.debugInfo.cameraPosition = { x, y, z };
  }

  setRaycastHit(hit) {
    this.debugInfo.raycastHit = hit;
  }

  setGridPosition(pos) {
    this.debugInfo.gridPosition = pos;
  }

  setLastAction(action) {
    this.debugInfo.lastAction = action;
    if (window.actionHistory) {
      window.actionHistory.addAction(action);
    }
  }
}

window.DebugTools = DebugTools;