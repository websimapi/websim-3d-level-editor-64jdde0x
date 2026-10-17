class ToolbarManager {
  constructor() {
    this.initToolbarControls();
  }

  initToolbarControls() {
    // Left toolbar toggle
    document.getElementById('toggle-menu').addEventListener('click', () => {
      const toolbar = document.getElementById('toolbar');
      const toggleButton = document.getElementById('toggle-menu');
      const arrow = toggleButton.querySelector('.menu-arrow');
      toolbar.classList.toggle('hidden');
      toggleButton.classList.toggle('menu-hidden');
      arrow.classList.toggle('collapsed');
      localStorage.setItem('toolbarHidden', toolbar.classList.contains('hidden'));
    });

    // Right toolbar toggle
    document.getElementById('toggle-right-menu').addEventListener('click', () => {
      const toolbar = document.getElementById('right-toolbar');
      const toggleButton = document.getElementById('toggle-right-menu');
      const arrow = toggleButton.querySelector('.right-menu-arrow');
      toolbar.classList.toggle('hidden');
      toggleButton.classList.toggle('menu-hidden');
      arrow.classList.toggle('collapsed');
      localStorage.setItem('rightToolbarHidden', toolbar.classList.contains('hidden'));
    });

    // Bottom toolbar toggle
    document.getElementById('toggle-bottom-menu').addEventListener('click', () => {
      const toolbar = document.getElementById('bottom-toolbar');
      const toggleButton = document.getElementById('toggle-bottom-menu');
      const arrow = toggleButton.querySelector('.bottom-menu-arrow');
      toolbar.classList.toggle('hidden');
      toggleButton.classList.toggle('menu-hidden');
      arrow.classList.toggle('collapsed');
      localStorage.setItem('bottomToolbarHidden', toolbar.classList.contains('hidden'));
    });

    // Section toggle functionality
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', e => {
        if (e.target.classList.contains('section-toggle')) {
          const content = header.nextElementSibling;
          const toggle = header.querySelector('.section-toggle');
          content.classList.toggle('expanded');
          toggle.classList.toggle('expanded');
          e.stopPropagation();
          
          // Save section expanded state
          if (window.menuStateManager) {
            window.menuStateManager.saveMenuState();
          }
        }
      });
    });
  }
}

window.ToolbarManager = ToolbarManager;

