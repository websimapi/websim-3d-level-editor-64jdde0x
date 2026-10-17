class HistoryCommands {
  static undo(action) {
    const d = action.data;
    if (!d || !d.type) {
      console.log('Skipping undo for action with no data or type:', action.description);
      return;
    }

    // Handle world size changes
    if (d.type === 'changeWorldSize') {
      if (window.gridManager) {
        window.gridManager.setWorldSize(d.previousWidth, d.previousHeight);
      }
      if (window.debugTools) window.debugTools.updateDebugInfo();
      return;
    }

    // Try each command handler in order
    const handlers = [
      BlockHistoryCommands,
      AssetHistoryCommands,
      BlockTextureHistoryCommands,
      GroundTextureHistoryCommands,
      BackgroundHistoryCommands
    ];

    for (const handler of handlers) {
      if (handler.undo(action)) {
        if (window.debugTools) window.debugTools.updateDebugInfo();
        return; // Successfully handled
      }
    }

    // If we get here, no handler processed the action
    console.log('Unknown action type:', d.type);
    if (window.debugTools) window.debugTools.updateDebugInfo();
  }

  static redo(action) {
    const d = action.data;
    if (!d || !d.type) {
      console.log('Skipping redo for action with no data or type:', action.description);
      return;
    }

    // Handle world size changes
    if (d.type === 'changeWorldSize') {
      if (window.gridManager) {
        window.gridManager.setWorldSize(d.newWidth, d.newHeight);
      }
      if (window.debugTools) window.debugTools.updateDebugInfo();
      return;
    }

    // Try each command handler in order
    const handlers = [
      BlockHistoryCommands,
      AssetHistoryCommands,
      BlockTextureHistoryCommands,
      GroundTextureHistoryCommands,
      BackgroundHistoryCommands
    ];

    for (const handler of handlers) {
      if (handler.redo(action)) {
        if (window.debugTools) window.debugTools.updateDebugInfo();
        return; // Successfully handled
      }
    }

    // If we get here, no handler processed the action
    console.log('Unknown action type:', d.type);
    if (window.debugTools) window.debugTools.updateDebugInfo();
  }
}

window.HistoryCommands = HistoryCommands;