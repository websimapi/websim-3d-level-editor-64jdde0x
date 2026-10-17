class InputHandler {
  constructor() {
    this.keyState = {};
    this.mouseState = {
      left: false,
      right: false,
      middle: false,
      x: 0,
      y: 0
    };
    this.initEventListeners();
  }

  initEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse events
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile support
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

    // Handle keyboard shortcuts
    this.initKeyboardShortcuts();
  }

  handleKeyDown(event) {
    this.keyState[event.key] = true;
    
    // Don't handle shortcuts if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Tool shortcuts
    switch(event.key) {
      case 'p':
        document.getElementById('place-block').click();
        break;
      case 'r':
        document.getElementById('remove-block').click();
        break;
      case 's':
        document.getElementById('select-tool').click();
        break;
      case 'c':
        document.getElementById('color-dropper').click();
        break;
      case 'd':
        document.getElementById('drag-mode').click();
        break;
      case 'm':
        document.getElementById('move-mode').click();
        break;
      case 'g':
        document.getElementById('rotation-mode').click();
        break;
    }
  }

  handleKeyUp(event) {
    this.keyState[event.key] = false;
  }

  handleMouseDown(event) {
    switch(event.button) {
      case 0: this.mouseState.left = true; break;
      case 1: this.mouseState.middle = true; break;
      case 2: this.mouseState.right = true; break;
    }
    this.mouseState.x = event.clientX;
    this.mouseState.y = event.clientY;
  }

  handleMouseUp(event) {
    switch(event.button) {
      case 0: this.mouseState.left = false; break;
      case 1: this.mouseState.middle = false; break;
      case 2: this.mouseState.right = false; break;
    }
  }

  handleTouchStart(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.mouseState.left = true;
      this.mouseState.x = touch.clientX;
      this.mouseState.y = touch.clientY;
    }
  }

  handleTouchEnd(event) {
    this.mouseState.left = false;
    this.mouseState.right = false;
    this.mouseState.middle = false;
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
          case 's':
            event.preventDefault();
            window.fileManager.exportLevel();
            break;
          case 'o':
            event.preventDefault();
            document.getElementById('import-input').click();
            break;
        }
      }
    });
  }

  isKeyDown(key) {
    return this.keyState[key] === true;
  }

  isMouseButtonDown(button) {
    switch(button) {
      case 'left': return this.mouseState.left;
      case 'right': return this.mouseState.right;
      case 'middle': return this.mouseState.middle;
      default: return false;
    }
  }

  getMousePosition() {
    return {
      x: this.mouseState.x,
      y: this.mouseState.y
    };
  }
}

window.InputHandler = InputHandler;