class WebsocketHandler {
  constructor(scene) {
    this.scene = scene;
    this.room = new WebsimSocket();
    this.peers = {};
    
    // Initialize websocket functionality
    this.initWebsocketListeners();
  }

  initWebsocketListeners() {
    // Subscribe to peer updates
    this.room.party.subscribe(newPeers => {
      this.peers = newPeers;
      this.updateOnlineUsers();
    });

    // Handle incoming messages - no longer processing grid updates from peers
    this.room.onmessage = event => {
      const data = event.data;
      switch (data.type) {
        case "connected":
          console.log(`Client ${data.clientId} connected`);
          this.updateOnlineUsers();
          break;
          
        case "disconnected":
          console.log(`Client ${data.clientId} disconnected`);
          this.updateOnlineUsers();
          break;
      }
    };
  }

  updateOnlineUsers() {
    const usersList = document.getElementById('online-users');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    // Add all connected peers including the current client
    for (const clientId in this.room.party.peers) {
      const { username, avatarUrl } = this.room.party.peers[clientId];
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      userEl.innerHTML = `
        <img src="${avatarUrl}" alt="${username}" width="24" height="24">
        <span>${username}</span>
        ${clientId === this.room.party.client.id ? ' (You)' : ''}
      `;
      usersList.appendChild(userEl);
    }
  }

  handleGridUpdate(data) {
    // Don't process our own updates
    if (data.clientId !== this.room.party.client.id) {
      if (data.action === 'place') {
        if (data.assetData) {
          this.handleAssetPlacement(data);
        } else {
          this.handleBlockPlacement(data);
        }
      } else if (data.action === 'remove') {
        const key = `${data.position.x},${data.position.y},${data.position.z}`;
        window.placedBlocks.removeBlock(key);
      }
    }
  }

  handleAssetPlacement(data) {
    window.loader.load(data.assetData.url, gltf => {
      const model = gltf.scene;
      model.position.set(
        data.position.x + 0.5, 
        data.position.y + 0.5, 
        data.position.z + 0.5
      );
      this.scene.add(model);
      window.placedAssets.addPlacedAsset(model, data.assetData);
    });
  }

  handleBlockPlacement(data) {
    const block = window.placedBlocks.addBlock(
      new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    );
    if (data.color) {
      block.material.color.set('#' + data.color);
    }
  }

  handleLevelUpdate(data) {
    // Don't process our own updates
    if (data.clientId !== this.room.party.client.id) {
      // Clear existing content
      Object.keys(window.gridBlocks).forEach(key => {
        window.placedBlocks.removeBlock(key);
      });
      window.placedAssets.clearAllAssets();

      // Add new blocks
      data.data.blocks?.forEach(block => {
        const newBlock = window.placedBlocks.addBlock(
          new THREE.Vector3(block.x, block.y, block.z)
        );
        if (block.color) {
          newBlock.material.color.set('#' + block.color);
        }
      });

      // Add new assets
      data.data.assets?.forEach(assetData => {
        window.placedAssets.loadAndPlaceAsset(assetData);
      });
    }
  }

  sendGridUpdate(action, position, color = null, assetData = null) {
    // Removed websocket sending functionality
    console.log("Local-only grid update:", action, position);
  }

  broadcastLevelUpdate(levelData) {
    // Removed websocket sending functionality 
    console.log("Local-only level update");
  }
}

window.WebsocketHandler = WebsocketHandler;