class CameraMobileControls {
  constructor(camera, controls, renderer) {
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    this.rotationControl = null;
  }

  attach() {
    this.rotationControl = document.getElementById('mobile-rotation-control');
    if (!this.rotationControl) return;

    this.rotationControl.style.display = 'block';

    let rotationStartPosition = { x: 0, y: 0 };
    let lastTouchPosition = { x: 0, y: 0 };
    let isPinchZooming = false;
    let isPanning = false;
    let initialPinchDistance = 0;
    let lastPinchDistance = 0;
    let lastPanCenter = { x: 0, y: 0 };
    let isMobileRotating = false;

    const startTwoFingerGesture = (touches) => {
      const [touch1, touch2] = [touches[0], touches[1]];
      initialPinchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      lastPinchDistance = initialPinchDistance;
      lastPanCenter = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
      isPinchZooming = false;
      isPanning = false;
      isMobileRotating = false;
    };

    const handlePinchZoom = (currentPinchDistance) => {
      const zoomDelta = currentPinchDistance - lastPinchDistance;
      const zoomSpeed = 0.01;
      const zoomFactor = 1 + (zoomDelta * zoomSpeed);
      const cameraDistance = this.camera.position.distanceTo(this.controls.target);
      const minDistance = 2, maxDistance = 100;
      const newDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance / zoomFactor));
      const direction = new THREE.Vector3();
      direction.subVectors(this.camera.position, this.controls.target).normalize().multiplyScalar(newDistance);
      this.camera.position.copy(this.controls.target).add(direction);
      lastPinchDistance = currentPinchDistance;
    };

    const handleTwoFingerPan = (currentPanCenter, lastPanCenterLocal) => {
      const panDeltaX = currentPanCenter.x - lastPanCenterLocal.x;
      const panDeltaY = currentPanCenter.y - lastPanCenterLocal.y;
      const panSpeed = 0.003;
      const cameraDistance = this.camera.position.distanceTo(this.controls.target);
      const scaledPanSpeed = panSpeed * cameraDistance;
      const cameraMatrix = new THREE.Matrix4().lookAt(this.camera.position, this.controls.target, this.camera.up);
      const rightVector = new THREE.Vector3();
      const upVector = new THREE.Vector3();
      cameraMatrix.extractBasis(rightVector, upVector, new THREE.Vector3());
      const panMovement = new THREE.Vector3()
        .addScaledVector(rightVector, -panDeltaX * scaledPanSpeed)
        .addScaledVector(upVector, panDeltaY * scaledPanSpeed);
      this.camera.position.add(panMovement);
      this.controls.target.add(panMovement);
    };

    const onRotationTouchStart = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.touches.length === 2) { startTwoFingerGesture(e.touches); return; }
      if (e.touches.length === 1 && !isPinchZooming) {
        isMobileRotating = true;
        const touch = e.touches[0];
        const rect = this.rotationControl.getBoundingClientRect();
        rotationStartPosition = { x: touch.clientX - rect.left - rect.width / 2, y: touch.clientY - rect.top - rect.height / 2 };
        lastTouchPosition = { ...rotationStartPosition };
        this.rotationControl.style.cursor = 'grabbing';
      }
    };

    const onRotationTouchMove = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.touches.length === 2) {
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const currentPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentPanCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        const pinchDelta = Math.abs(currentPinchDistance - lastPinchDistance);
        const panDelta = Math.hypot(currentPanCenter.x - lastPanCenter.x, currentPanCenter.y - lastPanCenter.y);
        const pinchThreshold = 5, panThreshold = 2;
        if (!isPanning && pinchDelta > pinchThreshold && pinchDelta > panDelta) { isPinchZooming = true; isPanning = false; }
        else if (panDelta > panThreshold && !isPinchZooming) { isPanning = true; isPinchZooming = false; }
        if (isPinchZooming) { handlePinchZoom(currentPinchDistance); }
        else if (isPanning) { handleTwoFingerPan(currentPanCenter, lastPanCenter); lastPanCenter = currentPanCenter; }
        return;
      }
      if (e.touches.length === 1 && isMobileRotating && !isPinchZooming) {
        const touch = e.touches[0];
        const rect = this.rotationControl.getBoundingClientRect();
        const currentPosition = { x: touch.clientX - rect.left - rect.width / 2, y: touch.clientY - rect.top - rect.height / 2 };
        const deltaX = currentPosition.x - lastTouchPosition.x;
        const deltaY = currentPosition.y - lastTouchPosition.y;
        const rotationSpeed = 0.01;
        const spherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
        spherical.theta -= deltaX * rotationSpeed;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * rotationSpeed));
        this.camera.position.setFromSpherical(spherical).add(this.controls.target);
        this.camera.lookAt(this.controls.target);
        lastTouchPosition = currentPosition;
      }
    };

    const onRotationTouchEnd = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.touches.length === 0) {
        isMobileRotating = false; isPinchZooming = false; isPanning = false; this.rotationControl.style.cursor = 'grab';
      } else if (e.touches.length === 1 && (isPinchZooming || isPanning)) {
        isPinchZooming = false; isPanning = false;
        const touch = e.touches[0];
        const rect = this.rotationControl.getBoundingClientRect();
        const isOnControl = touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        if (isOnControl) {
          isMobileRotating = true;
          rotationStartPosition = { x: touch.clientX - rect.left - rect.width / 2, y: touch.clientY - rect.top - rect.height / 2 };
          lastTouchPosition = { ...rotationStartPosition };
          this.rotationControl.style.cursor = 'grabbing';
        }
      }
    };

    this.rotationControl.addEventListener('touchstart', onRotationTouchStart, { passive: false });
    this.rotationControl.addEventListener('touchmove', onRotationTouchMove, { passive: false });
    this.rotationControl.addEventListener('touchend', onRotationTouchEnd, { passive: false });

    const canvas = this.renderer.domElement;

    const onCanvasTouchStart = (e) => {
      if (e.touches.length === 2) { e.preventDefault(); e.stopPropagation(); startTwoFingerGesture(e.touches); }
    };

    const onCanvasTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault(); e.stopPropagation();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const currentPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentPanCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        const pinchDelta = Math.abs(currentPinchDistance - lastPinchDistance);
        const panDelta = Math.hypot(currentPanCenter.x - lastPanCenter.x, currentPanCenter.y - lastPanCenter.y);
        const pinchThreshold = 5, panThreshold = 2;
        if (!isPanning && pinchDelta > pinchThreshold && pinchDelta > panDelta) { isPinchZooming = true; isPanning = false; }
        else if (panDelta > panThreshold && !isPinchZooming) { isPanning = true; isPinchZooming = false; }
        if (isPinchZooming) { handlePinchZoom(currentPinchDistance); }
        else if (isPanning) { handleTwoFingerPan(currentPanCenter, lastPanCenter); lastPanCenter = currentPanCenter; }
      }
    };

    const onCanvasTouchEnd = (e) => {
      if (e.touches.length < 2) { isPinchZooming = false; isPanning = false; }
    };

    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
  }
}
window.CameraMobileControls = CameraMobileControls;