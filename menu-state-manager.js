class MenuStateManager {
  constructor() {
    // Automatically load menu state on construction
    this.loadMenuState();
  }

  saveMenuState() {
    // Save expanded states
    const expandedStates = {};
    document.querySelectorAll('.section-header').forEach(header => {
      const title = header.querySelector('h3').textContent;
      const content = header.nextElementSibling;
      expandedStates[title] = content.classList.contains('expanded');
    });
    localStorage.setItem('menuExpandedStates', JSON.stringify(expandedStates));

    // Save section order
    const sectionOrder = Array.from(document.querySelectorAll('.section-header h3'))
      .map(h3 => h3.textContent);
    localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));

    // Save toolbar positions
    const toolbarPositions = {
      left: Array.from(document.querySelector('#toolbar').querySelectorAll('.section-header h3')).map(h3 => h3.textContent),
      right: Array.from(document.querySelector('#right-toolbar').querySelectorAll('.section-header h3')).map(h3 => h3.textContent),
      bottom: Array.from(document.querySelector('#bottom-toolbar').querySelectorAll('.section-header h3')).map(h3 => h3.textContent)
    };
    localStorage.setItem('toolbarPositions', JSON.stringify(toolbarPositions));
  }

  loadMenuState() {
    // Load toolbar visibility states with actual defaults
    const toolbarHidden = localStorage.getItem('toolbarHidden') === 'true';
    const rightToolbarHidden = localStorage.getItem('rightToolbarHidden') === null ? true : localStorage.getItem('rightToolbarHidden') === 'true';
    const bottomToolbarHidden = localStorage.getItem('bottomToolbarHidden') === null ? true : localStorage.getItem('bottomToolbarHidden') === 'true';

    // Apply left toolbar state
    if (toolbarHidden) {
      const toolbar = document.getElementById('toolbar');
      const toggleButton = document.getElementById('toggle-menu');
      const arrow = toggleButton.querySelector('.menu-arrow');
      toolbar.classList.add('hidden');
      toggleButton.classList.add('menu-hidden');
      arrow.classList.add('collapsed');
    }

    // Apply right toolbar state
    if (rightToolbarHidden) {
      const toolbar = document.getElementById('right-toolbar');
      const toggleButton = document.getElementById('toggle-right-menu');
      const arrow = toggleButton.querySelector('.right-menu-arrow');
      toolbar.classList.add('hidden');
      toggleButton.classList.add('menu-hidden');
      arrow.classList.add('collapsed');
    } else {
      const toolbar = document.getElementById('right-toolbar');
      const toggleButton = document.getElementById('toggle-right-menu');
      const arrow = toggleButton.querySelector('.right-menu-arrow');
      toolbar.classList.remove('hidden');
      toggleButton.classList.remove('menu-hidden');
      arrow.classList.remove('collapsed');
    }

    // Apply bottom toolbar state
    if (bottomToolbarHidden) {
      const toolbar = document.getElementById('bottom-toolbar');
      const toggleButton = document.getElementById('toggle-bottom-menu');
      const arrow = toggleButton.querySelector('.bottom-menu-arrow');
      toolbar.classList.add('hidden');
      toggleButton.classList.add('menu-hidden');
      arrow.classList.add('collapsed');
    } else {
      const toolbar = document.getElementById('bottom-toolbar');
      const toggleButton = document.getElementById('toggle-bottom-menu');
      const arrow = toggleButton.querySelector('.bottom-menu-arrow');
      toolbar.classList.remove('hidden');
      toggleButton.classList.remove('menu-hidden');
      arrow.classList.remove('collapsed');
    }

    // Load expanded states
    const expandedStates = JSON.parse(localStorage.getItem('menuExpandedStates') || '{}');
    document.querySelectorAll('.section-header').forEach(header => {
      const title = header.querySelector('h3').textContent;
      const content = header.nextElementSibling;
      const toggle = header.querySelector('.section-toggle');
      
      if (expandedStates.hasOwnProperty(title)) {
        if (!expandedStates[title]) {
          content.classList.remove('expanded');
          toggle.classList.remove('expanded');
        } else {
          content.classList.add('expanded');
          toggle.classList.add('expanded');
        }
      }
    });
  }
}

window.MenuStateManager = MenuStateManager;