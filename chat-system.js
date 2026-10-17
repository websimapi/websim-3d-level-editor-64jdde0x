class ChatSystem {
  constructor() {
    this.room = window.room;
    this.messages = [];
    this.chatPanel = document.getElementById('chat-messages');
    this.messageInput = document.getElementById('chat-input');
    this.init();
  }

  init() {
    // Initialize websocket connection for chat
    this.initChatConnection();
    // Add event listeners
    this.addEventListeners();
  }

  createChatPanel() {
    // This UI is now created directly in index.html to simplify layout management
  }

  initChatConnection() {
    // Subscribe to room.onmessage for chat events
    const originalOnMessage = this.room.onmessage;
    
    this.room.onmessage = (event) => {
      // Call original handler first
      if (originalOnMessage) {
        originalOnMessage(event);
      }
      
      // Handle chat messages
      const data = event.data;
      if (data.type === "chat-message") {
        this.receiveMessage(data);
      } else if (data.type === "world-share") {
        this.receiveWorldShare(data);
      }
    };
  }

  addEventListeners() {
    // Send button click
    document.getElementById('chat-send').addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key in input
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Share world button
    document.getElementById('share-world-btn').addEventListener('click', () => {
      this.shareWorld();
    });
  }

  sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text) return;

    const message = {
      type: "chat-message",
      text: text,
      time: new Date().toISOString()
    };

    this.room.send(message);
    this.messageInput.value = '';
  }

  receiveMessage(data) {
    const isFromMe = data.clientId === this.room.clientId;
    const sender = isFromMe ? 'You' : (this.room.peers[data.clientId]?.username || 'Unknown');
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isFromMe ? 'my-message' : ''}`;
    
    const time = new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-sender">${sender}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${this.escapeHTML(data.text)}</div>
    `;
    
    this.chatPanel.appendChild(messageEl);
    this.chatPanel.scrollTop = this.chatPanel.scrollHeight;
    
    // Add to messages array
    this.messages.push({
      sender: sender,
      text: data.text,
      time: data.time,
      isFromMe: isFromMe
    });
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  shareWorld() {
    try {
      // Get current world data from file manager
      const blocks = window.fileManager.serializeBlocks();
      const assets = window.placedAssets ? window.fileManager.serializeAssets() : [];
      
      const worldData = {
        blocks,
        assets,
        sharedBy: this.room.peers[this.room.clientId]?.username || 'Unknown',
        timestamp: new Date().toISOString()
      };
      
      // Create a message about the share
      const message = {
        type: "world-share",
        worldData: worldData,
        time: new Date().toISOString()
      };
      
      this.room.send(message);
      
      // Add a local message about the share
      const localMessage = {
        type: "chat-message",
        text: "You shared your world with the room.",
        time: new Date().toISOString(),
        clientId: this.room.clientId
      };
      
      this.receiveMessage(localMessage);
      
    } catch (error) {
      console.error('Error sharing world:', error);
      alert('Error sharing world. See console for details.');
    }
  }
  
  receiveWorldShare(data) {
    if (!data.worldData) return;
    
    const sender = this.room.peers[data.clientId]?.username || 'Unknown';
    const timestamp = new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const worldShareEl = document.createElement('div');
    worldShareEl.className = 'world-share-message';
    
    worldShareEl.innerHTML = `
      <div class="message-header">
        <span class="message-sender">${sender} shared a world</span>
        <span class="message-time">${timestamp}</span>
      </div>
      <div class="world-share-info">
        <p>${data.worldData.blocks.length} blocks, ${data.worldData.assets.length} assets</p>
        <button class="load-shared-world">Load</button>
        <button class="download-shared-world">Download</button>
      </div>
    `;
    
    // Add event listeners for the buttons
    worldShareEl.querySelector('.load-shared-world').addEventListener('click', () => {
      if (confirm('Loading a shared world will replace your current world. Continue?')) {
        this.loadSharedWorld(data.worldData);
      }
    });
    
    worldShareEl.querySelector('.download-shared-world').addEventListener('click', () => {
      this.downloadSharedWorld(data.worldData);
    });
    
    this.chatPanel.appendChild(worldShareEl);
    this.chatPanel.scrollTop = this.chatPanel.scrollHeight;
  }
  
  loadSharedWorld(worldData) {
    try {
      // Use the import level function to load the world
      window.fileManager.importLevel({
        blocks: worldData.blocks,
        assets: worldData.assets
      });
      
      // Add a local message 
      const localMessage = {
        type: "chat-message",
        text: `You loaded a world shared by ${worldData.sharedBy}.`,
        time: new Date().toISOString(),
        clientId: this.room.clientId
      };
      
      this.receiveMessage(localMessage);
      
    } catch (error) {
      console.error('Error loading shared world:', error);
      alert('Error loading shared world. See console for details.');
    }
  }
  
  downloadSharedWorld(worldData) {
    try {
      const levelData = {
        blocks: worldData.blocks,
        assets: worldData.assets,
        assetLibrary: [],
        textures: window.fileManager.extractTextureURLsFromData(worldData.blocks, worldData.assets),
        actionHistory: []
      };
      
      const blob = new Blob([JSON.stringify(levelData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shared-world-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading shared world:', error);
      alert('Error downloading shared world. See console for details.');
    }
  }
}

window.ChatSystem = ChatSystem;