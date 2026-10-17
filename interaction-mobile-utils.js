class InteractionMobileUtils {
  constructor() {}

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  isTouchOnRotationControl(event) {
    const rotationControl = document.getElementById('mobile-rotation-control');
    if (!rotationControl) return false;
    const rect = rotationControl.getBoundingClientRect();
    const clientX = event.clientX || event.touches?.[0]?.clientX || event.changedTouches?.[0]?.clientX;
    const clientY = event.clientY || event.touches?.[0]?.clientY || event.changedTouches?.[0]?.clientY;
    if (clientX == null || clientY == null) return false;
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  showMobileFeedback(event) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed; left: ${event.clientX - 10}px; top: ${event.clientY - 10}px;
      width: 20px; height: 20px; background: rgba(0, 255, 0, 0.7);
      border-radius: 50%; pointer-events: none; z-index: 9999; animation: mobileFeedback 0.3s ease-out;
    `;
    if (!document.querySelector('#mobile-feedback-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'mobile-feedback-styles';
      styleEl.textContent = `
        @keyframes mobileFeedback { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
      `;
      document.head.appendChild(styleEl);
    }
    document.body.appendChild(indicator);
    setTimeout(() => indicator.parentNode && document.body.removeChild(indicator), 300);
  }
}
window.InteractionMobileUtils = InteractionMobileUtils;

