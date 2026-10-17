class GizmoManager {
  constructor(scene, placedAssets) {
    this.scene = scene;
    this.placedAssets = placedAssets;
    this.helper = null;
    this.isDragging = false;
    this.dragStartPos = new THREE.Vector3();
    this.dragAxis = null;
    this.events = null;
  }

  createHelper(asset) {
    this.removeHelper();

    const cfg = this.placedAssets.config.gizmo;
    const helperGroup = new THREE.Group();
    helperGroup.name = 'manipulationHelper';

    const arrowGeometry = new THREE.ConeGeometry(
      cfg.arrow.coneRadius,
      cfg.arrow.coneHeight,
      cfg.arrow.coneSegments
    );
    const cylinderGeometry = new THREE.CylinderGeometry(
      cfg.cylinder.radiusTop,
      cfg.cylinder.radiusBottom,
      cfg.cylinder.height,
      cfg.cylinder.radialSegments
    );

    const xArrowMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.xColor, transparent: cfg.materials.transparent });
    const xCylinderMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.xColor, transparent: cfg.materials.transparent });
    const xArrow = new THREE.Mesh(arrowGeometry, xArrowMaterial);
    const xCylinder = new THREE.Mesh(cylinderGeometry, xCylinderMaterial);
    xArrow.position.set(cfg.offset.arrowDistance, 0, 0);
    xArrow.rotateZ(-Math.PI / 2);
    xCylinder.position.set(cfg.offset.cylinderDistance, 0, 0);
    xCylinder.rotateZ(-Math.PI / 2);
    xArrow.userData.axis = 'x';
    xCylinder.userData.axis = 'x';
    helperGroup.add(xArrow);
    helperGroup.add(xCylinder);

    const yArrowMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.yColor, transparent: cfg.materials.transparent });
    const yCylinderMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.yColor, transparent: cfg.materials.transparent });
    const yArrow = new THREE.Mesh(arrowGeometry, yArrowMaterial);
    const yCylinder = new THREE.Mesh(cylinderGeometry, yCylinderMaterial);
    yArrow.position.set(0, cfg.offset.arrowDistance, 0);
    yCylinder.position.set(0, cfg.offset.cylinderDistance, 0);
    yArrow.userData.axis = 'y';
    yCylinder.userData.axis = 'y';
    helperGroup.add(yArrow);
    helperGroup.add(yCylinder);

    const zArrowMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.zColor, transparent: cfg.materials.transparent });
    const zCylinderMaterial = new THREE.MeshBasicMaterial({ color: cfg.materials.zColor, transparent: cfg.materials.transparent });
    const zArrow = new THREE.Mesh(arrowGeometry, zArrowMaterial);
    const zCylinder = new THREE.Mesh(cylinderGeometry, zCylinderMaterial);
    zArrow.position.set(0, 0, cfg.offset.arrowDistance);
    zArrow.rotateX(Math.PI / 2);
    zCylinder.position.set(0, 0, cfg.offset.cylinderDistance);
    zCylinder.rotateX(Math.PI / 2);
    zArrow.userData.axis = 'z';
    zCylinder.userData.axis = 'z';
    helperGroup.add(zArrow);
    helperGroup.add(zCylinder);

    helperGroup.position.copy(asset.model.position);
    helperGroup.renderOrder = cfg.renderOrder;
    helperGroup.traverse((child) => {
      if (child.material) {
        child.material.depthTest = this.placedAssets.config.gizmo.materialDepth.depthTest;
        child.material.depthWrite = this.placedAssets.config.gizmo.materialDepth.depthWrite;
      }
    });

    this.helper = helperGroup;
    this.scene.add(helperGroup);
    this.initEvents();

    this.placedAssets.manipulationHelper = this.helper;
  }

  removeHelper() {
    if (this.helper) {
      this.scene.remove(this.helper);
      this.helper = null;
      this.placedAssets.manipulationHelper = null;
    }

    this.placedAssets.isInteractingWithGizmo = false;

    if (this.events) {
      const renderer = window.rendererManager?.getRenderer();
      if (renderer) {
        renderer.domElement.removeEventListener('mousedown', this.events.onMouseDown, true);
        renderer.domElement.removeEventListener('mousemove', this.events.onMouseMove, true);
        renderer.domElement.removeEventListener('mouseup', this.events.onMouseUp, true);
        renderer.domElement.style.cursor = this.placedAssets.config.gizmo.cursor.default;
      }
      this.events = null;
    }
  }

  updateHelperPosition() {
    if (this.helper && this.placedAssets.selectedPlacedAsset) {
      this.helper.position.copy(this.placedAssets.selectedPlacedAsset.model.position);
    }
  }

  initEvents() {
    if (!window.rendererManager) return;

    const renderer = window.rendererManager.getRenderer();
    const camera = window.rendererManager.getCamera();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const cfg = this.placedAssets.config.gizmo;

    const onMouseDown = (event) => {
      if (!this.placedAssets.selectedPlacedAsset || !this.helper) return;
      if (!window.toolStateManager.isToolActive('move-mode')) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(this.helper.children, true);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        this.dragAxis = intersectedObject.userData.axis;
        this.isDragging = true;
        this.placedAssets.isInteractingWithGizmo = true;
        this.dragStartPos.copy(this.placedAssets.selectedPlacedAsset.model.position);

        if (window.cameraManager) {
          window.cameraManager.getControls().enabled = false;
        }

        renderer.domElement.style.cursor = cfg.cursor.drag;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    const onMouseMove = (event) => {
      if (!window.toolStateManager.isToolActive('move-mode')) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (!this.isDragging && this.helper) {
        const hoverIntersects = raycaster.intersectObjects(this.helper.children, true);
        if (hoverIntersects.length > 0) {
          renderer.domElement.style.cursor = cfg.cursor.hover;
          this.placedAssets.isInteractingWithGizmo = true;
          if (window.cameraManager) {
            window.cameraManager.getControls().enabled = false;
          }
        } else {
          renderer.domElement.style.cursor = cfg.cursor.default;
          this.placedAssets.isInteractingWithGizmo = false;
          if (window.cameraManager && !this.isDragging) {
            window.cameraManager.getControls().enabled = true;
          }
        }
      }

      if (!this.isDragging || !this.placedAssets.selectedPlacedAsset || !this.dragAxis) return;

      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const plane = new THREE.Plane(cameraDirection, 0);
      plane.setFromNormalAndCoplanarPoint(cameraDirection, this.dragStartPos);

      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      if (intersectionPoint) {
        const movement = new THREE.Vector3().subVectors(intersectionPoint, this.dragStartPos);
        const sensitivity = cfg.sensitivity || 1.0;
        switch (this.dragAxis) {
          case 'x':
            this.placedAssets.selectedPlacedAsset.model.position.x = this.dragStartPos.x + movement.x * sensitivity;
            break;
          case 'y':
            this.placedAssets.selectedPlacedAsset.model.position.y = this.dragStartPos.y + movement.y * sensitivity;
            break;
          case 'z':
            this.placedAssets.selectedPlacedAsset.model.position.z = this.dragStartPos.z + movement.z * sensitivity;
            break;
        }
        this.updateHelperPosition();
        if (this.placedAssets.selectedPlacedAsset.helper) {
          this.placedAssets.selectedPlacedAsset.helper.update();
        }
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const onMouseUp = (event) => {
      if (this.isDragging && this.placedAssets.selectedPlacedAsset) {
        const newPosition = this.placedAssets.selectedPlacedAsset.model.position.clone();

        window.debugInfo.lastAction = `Moved asset ${this.placedAssets.selectedPlacedAsset.id} to (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)})`;
        window.actionHistory.addAction(window.debugInfo.lastAction, {
          type: 'moveAsset',
          assetId: this.placedAssets.selectedPlacedAsset.id,
          previousPosition: this.dragStartPos.clone(),
          newPosition: newPosition
        });
        window.debugTools.updateDebugInfo();

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      this.isDragging = false;
      this.placedAssets.isInteractingWithGizmo = false;
      this.dragAxis = null;
      renderer.domElement.style.cursor = cfg.cursor.default;

      if (window.cameraManager) {
        window.cameraManager.getControls().enabled = true;
      }
    };

    if (this.events) {
      renderer.domElement.removeEventListener('mousedown', this.events.onMouseDown, true);
      renderer.domElement.removeEventListener('mousemove', this.events.onMouseMove, true);
      renderer.domElement.removeEventListener('mouseup', this.events.onMouseUp, true);
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown, true);
    renderer.domElement.addEventListener('mousemove', onMouseMove, true);
    renderer.domElement.addEventListener('mouseup', onMouseUp, true);
    this.events = { onMouseDown, onMouseMove, onMouseUp };
  }
}

window.GizmoManager = GizmoManager;