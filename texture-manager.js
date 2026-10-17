class TextureManager {
    constructor() {
        this.textureFileHandler = new TextureFileHandler();
        this.textureApplicationUI = new TextureApplicationUI();
        this.textureGenerator = new TextureGenerator();
        
        // Make components globally available
        window.textureFileHandler = this.textureFileHandler;
        window.textureApplicationUI = this.textureApplicationUI;
        window.textureGenerator = this.textureGenerator;
    }
    
    // Delegate methods to maintain compatibility
    clearTextureLibrary() {
        return this.textureFileHandler.clearTextureLibrary();
    }

    getLoadedTextures() {
        return this.textureFileHandler.getLoadedTextures();
    }

    addTextureToLibrary(url, name) {
        return this.textureFileHandler.addTextureToLibrary(url, name);
    }

    showTextureApplicationUI(textureUrl) {
        return this.textureApplicationUI.showTextureApplicationUI(textureUrl);
    }

    async generateTextureFromPrompt() {
        return this.textureGenerator.generateTextureFromPrompt();
    }

    async fetchWithCorsProxy(url, attempts = 0) {
        return this.textureGenerator.fetchWithCorsProxy(url, attempts);
    }
}

window.TextureManager = TextureManager;