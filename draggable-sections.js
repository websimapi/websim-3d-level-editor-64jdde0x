class DraggableSections {
  constructor() {
    this.initDraggableSections();
  }

  initDraggableSections() {
    // Load the saved toolbar positions
    const savedPositions = JSON.parse(localStorage.getItem('toolbarPositions') || '{}');
    const leftToolbar = document.getElementById('toolbar');
    const rightToolbar = document.getElementById('right-toolbar');
    const bottomToolbar = document.getElementById('bottom-toolbar');

    // Function to check if point is within element
    const isPointInElement = (x, y, element) => {
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    document.querySelectorAll('.toolbar-section').forEach(section => {
      if (section && section.parentNode) {
        section.replaceWith(...section.childNodes);
      }
    });

    document.querySelectorAll('.section-header').forEach(header => {
      const content = header.nextElementSibling;
      if (!content || !header.parentNode) return;
      const section = document.createElement('div');
      section.className = 'toolbar-section';
      if (!header.parentNode.classList.contains('toolbar-section')) {
        header.parentNode.insertBefore(section, header);
        section.appendChild(header);
        section.appendChild(content);
      }

      let isDragging = false;
      let startY = 0;
      let startX = 0;
      let initialRect = null;
      let placeholder = null;
      let currentToolbar = null;

      header.addEventListener('mousedown', e => {
        if (e.target.classList.contains('section-toggle')) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialRect = section.getBoundingClientRect();
        section.classList.add('dragging');
        section.style.width = `${initialRect.width}px`;
        section.style.position = 'fixed';
        section.style.left = `${initialRect.left}px`;
        section.style.top = `${initialRect.top}px`;
        section.style.zIndex = '9999';
        
        placeholder = document.createElement('div');
        placeholder.style.height = `${initialRect.height}px`;
        placeholder.style.margin = '5px 0';
        placeholder.style.background = 'rgba(100,100,100,0.2)';
        placeholder.style.borderRadius = '4px';
        
        if (section.parentNode) {
          section.parentNode.insertBefore(placeholder, section);
          currentToolbar = section.parentNode;
        }
        
        document.body.style.cursor = 'grabbing';
      });

      document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        section.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Determine which toolbar we're hovering over
        let targetToolbar = null;
        if (isPointInElement(e.clientX, e.clientY, leftToolbar)) {
          targetToolbar = leftToolbar;
        } else if (isPointInElement(e.clientX, e.clientY, rightToolbar)) {
          targetToolbar = rightToolbar;
        } else if (isPointInElement(e.clientX, e.clientY, bottomToolbar)) {
          targetToolbar = bottomToolbar;
        }

        if (targetToolbar && targetToolbar !== currentToolbar) {
          // Move placeholder to new toolbar
          targetToolbar.appendChild(placeholder);
          currentToolbar = targetToolbar;
        }

        if (currentToolbar) {
          const sections = Array.from(currentToolbar.querySelectorAll('.toolbar-section'));
          sections.forEach(s => s.classList.remove('drop-target'));
          
          let closestSection = null;
          let closestDistance = Infinity;
          
          sections.forEach(s => {
            if (s === section) return;
            const rect = s.getBoundingClientRect();
            const distance = Math.abs(e.clientY - (rect.top + rect.height / 2));
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSection = s;
            }
          });

          if (closestSection) {
            closestSection.classList.add('drop-target');
            const rect = closestSection.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
              currentToolbar.insertBefore(placeholder, closestSection);
            } else {
              currentToolbar.insertBefore(placeholder, closestSection.nextSibling);
            }
          }
        }
      });

      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        section.classList.remove('dragging');
        section.style.transform = '';
        section.style.position = '';
        section.style.width = '';
        section.style.left = '';
        section.style.top = '';
        section.style.zIndex = '';
        
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(section, placeholder);
          placeholder.remove();
        }
        
        document.querySelectorAll('.drop-target').forEach(s => s.classList.remove('drop-target'));
        document.body.style.cursor = '';
        
        // Save the new section positions
        if (window.menuStateManager) {
          window.menuStateManager.saveMenuState();
        }
      });
    });

    // Apply saved positions if they exist
    if (savedPositions) {
      Object.entries(savedPositions).forEach(([toolbar, sections]) => {
        const toolbarEl = toolbar === 'left' ? leftToolbar :
                         toolbar === 'right' ? rightToolbar :
                         toolbar === 'bottom' ? bottomToolbar : null;
        
        if (toolbarEl && Array.isArray(sections)) {
          sections.forEach(sectionTitle => {
            // Find the section by matching the h3 text content
            const section = Array.from(document.querySelectorAll('.toolbar-section')).find(
              section => section.querySelector('h3')?.textContent === sectionTitle
            );
            if (section) {
              toolbarEl.appendChild(section);
            }
          });
        }
      });
    }
  }
}

window.DraggableSections = DraggableSections;