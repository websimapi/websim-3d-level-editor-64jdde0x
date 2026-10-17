class TextureGenerator {
    constructor() {
        // This class handles AI-based texture generation
    }

    async generateTextureFromPrompt() {
        const promptUI = document.createElement('div');
        promptUI.className = 'texture-generation-ui';
        promptUI.innerHTML = `
          <div class="prompt-container">
            <h3>Generate Texture</h3>
            <p class="hint">Describe the texture you want to create (e.g. "rough stone wall texture, gray with hints of moss")</p>
            <textarea id="texture-prompt" rows="4" placeholder="Describe the texture..."></textarea>
            <div class="texture-properties">
              <div class="property">
                <label for="texture-size">Size:</label>
                <select id="texture-size">
                  <option value="512x512">512×512</option>
                  <option value="1024x1024" selected>1024×1024</option>
                  <option value="2048x2048">2048×2048</option>
                </select>
              </div>
              <div class="property">
                <label for="texture-style">Style:</label>
                <select id="texture-style">
                  <option value="realistic" selected>Realistic</option>
                  <option value="stylized">Stylized</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="hand-painted">Hand-Painted</option>
                  <option value="pixel">Pixel Art</option>
                </select>
              </div>
              <div class="property">
                <label for="texture-material">Material Type:</label>
                <select id="texture-material">
                  <option value="">Any</option>
                  <option value="stone">Stone</option> <option value="wood">Wood</option> <option value="metal">Metal</option>
                  <option value="fabric">Fabric</option> <option value="plastic">Plastic</option> <option value="glass">Glass</option>
                  <option value="water">Water</option> <option value="dirt">Dirt/Ground</option> <option value="sand">Sand</option>
                  <option value="brick">Brick</option> <option value="concrete">Concrete</option>
                </select>
              </div>
              <div class="property">
                <label for="texture-detail">Detail Level:</label>
                <select id="texture-detail">
                  <option value="low">Low</option> <option value="medium" selected>Medium</option> <option value="high">High</option>
                </select>
              </div>
              <div class="property checkbox">
                <label for="texture-seamless">
                  <input type="checkbox" id="texture-seamless" checked> Make seamless tileable texture
                </label>
              </div>
            </div>
            <div class="button-container">
              <button id="generate-texture-btn" class="generate-btn">Generate</button>
              <button id="cancel-texture-btn" class="cancel-btn">Cancel</button>
            </div>
            <div id="generation-status" class="status-message" style="display: none;">Generating texture...</div>
          </div>
        `;

        document.body.appendChild(promptUI);

        promptUI.querySelector('#generate-texture-btn').addEventListener('click', async () => {
          const prompt = promptUI.querySelector('#texture-prompt').value;
          if (!prompt) return;

          const size = promptUI.querySelector('#texture-size').value;
          const style = promptUI.querySelector('#texture-style').value;
          const material = promptUI.querySelector('#texture-material').value;
          const detailLevel = promptUI.querySelector('#texture-detail').value;
          const isSeamless = promptUI.querySelector('#texture-seamless').checked;

          const statusEl = promptUI.querySelector('#generation-status');
          statusEl.style.display = 'block';
          statusEl.textContent = 'Analyzing prompt...';

          try {
            const completion = await websim.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content: `You are an expert at describing textures for image generation. Convert user descriptions into detailed image generation prompts focused on texture properties.
                  Consider these additional specifications:
                  - Style: ${style}
                  - Material Type: ${material || "not specified"}
                  - Detail Level: ${detailLevel}
                  - Seamless/Tileable: ${isSeamless ? "Yes" : "No"}
                  Response should be JSON with properties:
                  { "expandedPrompt": string, "style": string, "details": { "pattern": string, "colors": string[], "surfaceType": string } }`
                },
                { role: "user", content: prompt }
              ],
              json: true
            });

            const textureSpec = JSON.parse(completion.content);
            statusEl.textContent = 'Generating texture image...';

            const [width, height] = size.split('x').map(Number);
            const result = await websim.imageGen({
              prompt: `${isSeamless ? "Seamless tileable texture. " : ""}${textureSpec.expandedPrompt}. ${textureSpec.style}. Focus on ${textureSpec.details.surfaceType} surface detail. Main colors: ${textureSpec.details.colors.join(", ")}. ${textureSpec.details.pattern}`,
              width: width, height: height
            });

            statusEl.textContent = 'Processing generated texture...';
            const response = await this.fetchWithCorsProxy(result.url);
            const imageBlob = await response.blob();
            const imageFile = new File([imageBlob], 'generated-texture.png', { type: 'image/png' });
            const websimUrl = await websim.upload(imageFile);
            
            const textureName = `Generated: ${prompt.substring(0, 20)}...`;
            if (window.textureFileHandler) {
                window.textureFileHandler.addTextureToLibrary(websimUrl, textureName);
            }

            window.debugInfo.lastAction = `Generated and uploaded texture from prompt: ${prompt}`;
            window.actionHistory.addAction(window.debugInfo.lastAction, { type: 'generateTexture', prompt: prompt, url: websimUrl });
            window.debugTools.updateDebugInfo();
            document.body.removeChild(promptUI);

          } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
            console.error('Texture generation error:', error);
          }
        });

        promptUI.querySelector('#cancel-texture-btn').addEventListener('click', () => {
          document.body.removeChild(promptUI);
        });
    }

    async fetchWithCorsProxy(url, attempts = 0) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        } catch (error) {
            if (attempts < 3) {
                const proxyUrls = [
                    'https://api.allorigins.win/raw?url=',
                    'https://cors-anywhere.herokuapp.com/',
                    'https://cors.bridged.cc/'
                ];
                const proxyUrl = proxyUrls[attempts] + encodeURIComponent(url);
                return this.fetchWithCorsProxy(proxyUrl, attempts + 1);
            }
            throw error;
        }
    }
}

window.TextureGenerator = TextureGenerator;