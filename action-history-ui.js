class ActionHistoryUI {
  constructor(actionHistory) {
    this.actionHistory = actionHistory;
    this.container = document.getElementById('action-history');
    this.undoBtn = document.getElementById('undo-action');
    this.redoBtn = document.getElementById('redo-action');
    this.init();
  }

  init() {
    // Button clicks
    this.undoBtn.addEventListener('click', () => this.actionHistory.undo());
    this.redoBtn.addEventListener('click', () => this.actionHistory.redo());
    // Keyboard shortcuts
    window.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' || event.key === 'Z') {
          if (event.shiftKey) {
            this.actionHistory.redo();
          } else {
            this.actionHistory.undo();
          }
          event.preventDefault();
        }
      }
    });
  }

  addItem(description) {
    const actionItem = document.createElement('div');
    actionItem.textContent = description;
    this.container.appendChild(actionItem);
  }

  removeLast() {
    const last = this.container.lastChild;
    if (last) {
      this.container.removeChild(last);
    }
  }

  enableRedo(state) {
    this.redoBtn.disabled = !state;
  }

  clear() {
    this.container.innerHTML = '';
  }
}

window.ActionHistoryUI = ActionHistoryUI;