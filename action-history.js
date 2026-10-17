class ActionHistory {
  constructor() {
    this.history = [];
    this.redoHistory = [];
    this.MAX_REDO_HISTORY = 100;
    // Initialize UI (buttons + keyboard shortcuts)
    this.ui = new ActionHistoryUI(this);
  }

  // Remove unused keyboard shortcut methods
  // initKeyboardShortcuts() and initButtons() are now handled by ActionHistoryUI

  addAction(description, actionData = {}) {
    // Clear redo stack and disable redo button
    this.redoHistory = [];
    this.ui.enableRedo(false);

    const action = { description, data: actionData };
    this.history.push(action);

    // Add a UI entry
    this.ui.addItem(description);
  }

  undo() {
    if (!this.history.length) return;

    const lastAction = this.history.pop();
    this.redoHistory.push(lastAction);
    if (this.redoHistory.length > this.MAX_REDO_HISTORY) {
      this.redoHistory.shift();
    }

    // Enable redo button and remove last UI entry
    this.ui.enableRedo(true);
    this.ui.removeLast();

    // Delegate undo logic to HistoryCommands
    HistoryCommands.undo(lastAction);
  }

  redo() {
    if (!this.redoHistory.length) return;

    const actionToRedo = this.redoHistory.pop();
    // Update redo button state
    this.ui.enableRedo(this.redoHistory.length > 0);

    // Delegate redo logic to HistoryCommands
    HistoryCommands.redo(actionToRedo);

    // Push back onto history and add UI entry
    this.history.push(actionToRedo);
    this.ui.addItem(actionToRedo.description);
  }

  getHistory() {
    return this.history;
  }

  setHistory(history) {
    this.history = history;
    // Rebuild UI
    this.ui.clear();
    history.forEach(action => this.ui.addItem(action.description));
  }
}

window.ActionHistory = ActionHistory;