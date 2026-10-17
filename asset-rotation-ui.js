class AssetRotationUI {
  constructor(placedAssets) {
    this.placedAssets = placedAssets;
  }

  show(asset) {
    const rcfg = this.placedAssets.config.rotationUI;
    const rotationUI = document.createElement('div');
    rotationUI.className = 'rotation-ui';

    // Position controls
    const positionControls = document.createElement('div');
    positionControls.className = 'rotation-controls';

    const positionLabel = document.createElement('div');
    positionLabel.className = 'rotation-label';
    positionLabel.textContent = 'Position';
    positionControls.appendChild(positionLabel);

    ['X', 'Y', 'Z'].forEach(axis => {
      const axisControl = document.createElement('div');
      axisControl.className = 'rotation-axis';
      const label = document.createElement('span');
      label.textContent = `${axis}:`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = Math.floor(asset.model.position[axis.toLowerCase()] - rcfg.positionSliderRange);
      slider.max = Math.floor(asset.model.position[axis.toLowerCase()]) + rcfg.positionSliderRange;
      slider.step = rcfg.positionStep;
      slider.value = asset.model.position[axis.toLowerCase()];

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = slider.min;
      numberInput.max = slider.max;
      numberInput.step = rcfg.positionStep;
      numberInput.value = asset.model.position[axis.toLowerCase()];

      const updatePosition = (e) => {
        const newPos = parseFloat(e.target.value);
        const currentPos = axis.toLowerCase();
        asset.model.position[currentPos] = newPos;
        if (asset.helper) asset.helper.update();
        this.placedAssets.updateManipulationHelper();
        window.debugInfo.lastAction = `Adjusted asset ${asset.id} ${axis} position to ${newPos}`;
        window.debugTools.updateDebugInfo();
      };

      slider.addEventListener('input', e => { numberInput.value = e.target.value; updatePosition(e); });
      numberInput.addEventListener('input', e => { slider.value = e.target.value; updatePosition(e); });

      axisControl.appendChild(label);
      axisControl.appendChild(slider);
      axisControl.appendChild(numberInput);
      positionControls.appendChild(axisControl);
    });

    rotationUI.appendChild(positionControls);

    // Rotation controls
    const rotationControls = document.createElement('div');
    rotationControls.className = 'rotation-controls';

    const rotationLabel = document.createElement('div');
    rotationLabel.className = 'rotation-label';
    rotationLabel.textContent = 'Rotation';
    rotationControls.appendChild(rotationLabel);

    ['X', 'Y', 'Z'].forEach(currentAxis => {
      const axisControl = document.createElement('div');
      axisControl.className = 'rotation-axis';
      const label = document.createElement('span');
      label.textContent = `${currentAxis}:`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = rcfg.rotation.min;
      slider.max = rcfg.rotation.max;
      slider.value = (asset.model.rotation[currentAxis.toLowerCase()] * 180 / Math.PI) % 360;
      slider.step = rcfg.rotation.step;

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = rcfg.rotation.min;
      numberInput.max = rcfg.rotation.max;
      numberInput.value = slider.value;
      numberInput.step = rcfg.rotation.step;

      const updateRotation = (e) => {
        const radians = e.target.value * Math.PI / 180;
        const axis = currentAxis.toLowerCase();
        const previousRotation = asset.model.rotation[axis];
        asset.model.rotation[axis] = radians;
        if (asset.helper) asset.helper.update();

        window.debugInfo.lastAction = `Rotated asset ${asset.id} ${currentAxis}-axis to ${e.target.value} degrees`;
        window.actionHistory.addAction(window.debugInfo.lastAction, {
          type: 'rotateAssetAxis',
          assetId: asset.id,
          axis: axis,
          previousRotation: previousRotation,
          newRotation: radians
        });
        window.debugTools.updateDebugInfo();
      };

      slider.addEventListener('input', e => { numberInput.value = e.target.value; updateRotation(e); });
      numberInput.addEventListener('input', e => { slider.value = e.target.value; updateRotation(e); });

      axisControl.appendChild(label);
      axisControl.appendChild(slider);
      axisControl.appendChild(numberInput);
      rotationControls.appendChild(axisControl);
    });

    rotationUI.appendChild(rotationControls);

    // Scale controls
    const scalingControls = document.createElement('div');
    scalingControls.className = 'rotation-controls';

    const scaleLabel = document.createElement('div');
    scaleLabel.className = 'rotation-label';
    scaleLabel.textContent = 'Scale';
    scalingControls.appendChild(scaleLabel);

    const scaleAxes = ['X', 'Y', 'Z', 'All'];
    scaleAxes.forEach(axis => {
      const axisControl = document.createElement('div');
      axisControl.className = 'rotation-axis';
      const label = document.createElement('span');
      label.textContent = axis;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = this.placedAssets.config.rotationUI.scale.min;
      slider.max = this.placedAssets.config.rotationUI.scale.max;
      slider.step = this.placedAssets.config.rotationUI.scale.step;
      slider.value = axis === 'All' ? this.placedAssets.config.rotationUI.scale.default : asset.model.scale[axis.toLowerCase()];

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = slider.min;
      numberInput.max = slider.max;
      numberInput.step = slider.step;
      numberInput.value = slider.value;

      const updateScale = e => {
        const scale = parseFloat(e.target.value);
        const prev = axis === 'All'
          ? { x: asset.model.scale.x, y: asset.model.scale.y, z: asset.model.scale.z }
          : asset.model.scale[axis.toLowerCase()];
        if (axis === 'All') {
          asset.model.scale.set(scale, scale, scale);
        } else {
          asset.model.scale[axis.toLowerCase()] = scale;
        }
        if (asset.helper) asset.helper.update();

        window.debugInfo.lastAction = `Scaled asset ${asset.id} ${axis} axis to ${scale}`;
        window.actionHistory.addAction(window.debugInfo.lastAction, {
          type: 'scaleAsset',
          assetId: asset.id,
          axis: axis,
          previousScale: prev,
          newScale: scale
        });
        window.debugTools.updateDebugInfo();
      };

      slider.addEventListener('input', e => { numberInput.value = e.target.value; updateScale(e); });
      numberInput.addEventListener('input', e => { slider.value = e.target.value; updateScale(e); });

      axisControl.appendChild(label);
      axisControl.appendChild(slider);
      axisControl.appendChild(numberInput);
      scalingControls.appendChild(axisControl);
    });

    rotationUI.appendChild(scalingControls);

    // Preset rotation buttons
    this.placedAssets.config.rotationUI.presetAngles.forEach(angle => {
      const button = document.createElement('button');
      button.className = 'rotation-button';
      button.innerHTML = `<span class="arrow-icon" style="transform: rotate(${angle}deg);">&#9650;</span>`;
      button.addEventListener('click', event => {
        event.stopPropagation();
        this.rotateToAngle(asset.id, angle);
      });
      rotationUI.appendChild(button);
    });

    asset.assetItem.appendChild(rotationUI);
    asset.rotationUI = rotationUI;
  }

  hide(asset) {
    if (asset.rotationUI) {
      asset.assetItem.removeChild(asset.rotationUI);
      asset.rotationUI = null;
    }
  }

  rotateToAngle(assetId, angle) {
    const asset = this.placedAssets.getPlacedAssetById(assetId);
    if (asset) {
      const previousRotation = asset.model.rotation.y;
      asset.model.rotation.y = THREE.Math.degToRad(angle);
      if (asset.helper) asset.helper.update();

      window.debugInfo.lastAction = `Rotated asset ${assetId} to ${angle} degrees`;
      window.actionHistory.addAction(window.debugInfo.lastAction, {
        type: 'rotateAsset',
        assetId: assetId,
        previousRotation: previousRotation,
        newRotation: asset.model.rotation.y
      });
      window.debugTools.updateDebugInfo();
    }
  }
}

window.AssetRotationUI = AssetRotationUI;