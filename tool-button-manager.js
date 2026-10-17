class ToolButtonManager {
  constructor(scene) {
    this.scene = scene;
    this.initToolButtons();
    this.initCheatsheet();
  }

  initToolButtons() {
    document.querySelectorAll('.tool-button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.id !== 'undo-action' && button.id !== 'redo-action') {
          document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
          button.classList.add('active');
          
          if (button.id !== 'place-block') {
            window.selectedModel = null;
            if (window.modelPreview) {
              this.scene.remove(window.modelPreview);
              window.modelPreview = null;
            }
          }

          if (!button.id.includes('select-tool')) {
            if (window.selectedBlock) {
              window.blockTools.selectBlock(null);
            }
            if (window.selectedPlacedAsset) {
              window.placedAssets.deselectPlacedAsset();
            }
          }
        }
      });
    });
  }

  initCheatsheet() {
    const cheatsheetBtn = document.getElementById('cheatsheet-btn');
    if (cheatsheetBtn) {
      cheatsheetBtn.addEventListener('click', () => {
        this.showCheatsheet();
      });
    }
  }

  showCheatsheet() {
    // Remove existing cheatsheet if it exists
    const existingCheatsheet = document.getElementById('cheatsheet-modal');
    if (existingCheatsheet) {
      document.body.removeChild(existingCheatsheet);
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'cheatsheet-modal';
    modal.className = 'cheatsheet-modal';
    
    modal.innerHTML = `
      <div class="cheatsheet-content">
        <div class="cheatsheet-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="cheatsheet-close">&times;</button>
        </div>
        <div class="cheatsheet-body">
          <div class="shortcut-section">
            <h4>Tools</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">P</span>
              <span class="shortcut-desc">Place Block</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">R</span>
              <span class="shortcut-desc">Remove Block</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">S</span>
              <span class="shortcut-desc">Select Tool</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">C</span>
              <span class="shortcut-desc">Color Dropper</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">D</span>
              <span class="shortcut-desc">Drag Mode</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">M</span>
              <span class="shortcut-desc">Move Mode</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">G</span>
              <span class="shortcut-desc">Rotation Mode</span>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>File Operations</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + S</span>
              <span class="shortcut-desc">Export Level</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + O</span>
              <span class="shortcut-desc">Import Level</span>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>Edit Actions</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Z</span>
              <span class="shortcut-desc">Undo</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Shift + Z</span>
              <span class="shortcut-desc">Redo</span>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>Debug</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">\`</span>
              <span class="shortcut-desc">Toggle Debug Console</span>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>Selection</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Click</span>
              <span class="shortcut-desc">Multi-select blocks/cells</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Shift + Click</span>
              <span class="shortcut-desc">Range select blocks/cells</span>
            </div>
          </div>
          
          <div class="shortcut-section">
            <h4>Asset Manipulation</h4>
            <div class="shortcut-item">
              <span class="shortcut-key">Click & Drag</span>
              <span class="shortcut-desc">Move asset along axis (Move Mode)</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('.cheatsheet-close');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    document.body.appendChild(modal);
  }
}

window.ToolButtonManager = ToolButtonManager;