class BackgroundHistoryCommands {
  static undo(action) {
    const d = action.data;
    switch (d.type) {
      case 'setBackground':
        if (d.previousBackgroundData) {
          // Restore previous background without recording action
          window.backgroundManager.restoreBackground(d.previousBackgroundData, false);
        } else {
          // No previous background, just remove current one without recording action
          window.backgroundManager.removeBackground(false);
        }
        break;

      case 'removeBackground':
        if (d.removedBackgroundData) {
          // Restore the removed background without recording action
          window.backgroundManager.restoreBackground(d.removedBackgroundData, false);
        } else {
          console.log('Cannot undo background removal - no background data stored');
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
      case 'setBackground':
        if (d.textureUrl && d.name) {
          // Set background without recording action
          window.backgroundManager.setBackground(d.textureUrl, d.name, false);
        }
        break;

      case 'removeBackground':
        // Remove background without recording action
        window.backgroundManager.removeBackground(false);
        break;

      default:
        return false; // Not handled by this command handler
    }
    return true; // Handled successfully
  }
}

window.BackgroundHistoryCommands = BackgroundHistoryCommands;