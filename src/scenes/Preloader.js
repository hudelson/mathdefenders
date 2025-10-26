// Preloader Scene - Handles asset loading
class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log('Preloader: Loading assets...');
        
        // Create loading bar
        this.createLoadingBar();
        
        // Try to load real assets
        this.loadRealAssets();
        
    // Prepare non-ship placeholder assets (blocks, background)
    this.createNonShipPlaceholders();
        
        // Update loading bar
        this.load.on('progress', (value) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x00ffff);
            this.progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            console.log('Preloader: Assets loaded');

            // Attempt to chroma-key white background out of ship images
            const keysToProcess = [
                'player-ship-0','player-ship-1','player-ship-2','player-ship-3',
                'enemy-ship-0','enemy-ship-1','enemy-ship-2','enemy-ship-3'
            ];
            keysToProcess.forEach(k => {
                if (this.textures.exists(k)) {
                    this.chromaKeyTexture(k, { r: 255, g: 255, b: 255 }, 245);
                }
            });

            // Ensure placeholders exist for any missing ship textures
            this.ensureShipPlaceholders();
        });

        // When enemy variants index is loaded, queue images for a random variant
        this.load.on('filecomplete-json-enemyVariantsIndex', (key, type, data) => {
            const variants = this.cache.json.get('enemyVariantsIndex');
            if (Array.isArray(variants) && variants.length) {
                const choice = Phaser.Utils.Array.GetRandom(variants);
                window.gameState = window.gameState || {};
                window.gameState.enemyVariant = choice;
                this.queueEnemyVariant(choice);
            }
        });
    }

    create() {
        console.log('Preloader: Scene created');
        
        // Transition to main menu after short delay
        this.time.delayedCall(1000, () => {
            this.scene.start('MainMenuScene');
        });
    }

    loadRealAssets() {
        // Player ship images (static paths)
        this.load.image('player-ship-0', 'src/assets/player_ship/0_full_health.png');
        this.load.image('player-ship-1', 'src/assets/player_ship/1_minor_damage.png');
        this.load.image('player-ship-2', 'src/assets/player_ship/2_heavy_damage.png');
        this.load.image('player-ship-3', 'src/assets/player_ship/3_destroyed.png');

        // Load index of enemy variants, then dynamically queue one variant
        this.load.json('enemyVariantsIndex', 'src/assets/enemy_ship/index.json');
    }

    queueEnemyVariant(variantFolder) {
        const base = `src/assets/enemy_ship/${variantFolder}`;
        this.load.image('enemy-ship-0', `${base}/0_full_health.png`);
        this.load.image('enemy-ship-1', `${base}/1_minor_damage.png`);
        this.load.image('enemy-ship-2', `${base}/2_major_damage.png`);
        this.load.image('enemy-ship-3', `${base}/3_destroyed.png`);
        // If loader already running, ensure these get processed
        if (this.load.isLoading()) {
            this.load.start();
        }
    }

    createLoadingBar() {
        // Create loading bar graphics
        this.add.text(400, 250, 'Loading Math Defenders...', {
            fontSize: '20px',
            fill: '#00ffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222);
        this.progressBox.fillRect(250, 280, 300, 30);

        this.progressBar = this.add.graphics();
    }

    createNonShipPlaceholders() {
        // Create simple placeholder textures for equation blocks and background
        // Equation blocks - various colors
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(0, 0, 32, 32)
            .generateTexture('equation-block', 32, 32);

        this.add.graphics()
            .fillStyle(0xff0000)
            .fillRect(0, 0, 32, 32)
            .generateTexture('equation-block-red', 32, 32);

        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillRect(0, 0, 32, 32)
            .generateTexture('equation-block-green', 32, 32);

        this.add.graphics()
            .fillStyle(0xffff00)
            .fillRect(0, 0, 32, 32)
            .generateTexture('equation-block-gold', 32, 32);

        // Background - simple gradient effect
        this.add.graphics()
            .fillGradientStyle(0x000033, 0x000033, 0x000011, 0x000011)
            .fillRect(0, 0, 800, 600)
            .generateTexture('space-background', 800, 600);
    }

    // Replace near-white pixels with transparency in a texture
    chromaKeyTexture(key, color = { r: 255, g: 255, b: 255 }, threshold = 250) {
        try {
            const src = this.textures.get(key).getSourceImage();
            if (!src || !(src instanceof HTMLImageElement)) return;
            const w = src.naturalWidth || src.width;
            const h = src.naturalHeight || src.height;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(src, 0, 0);
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r >= threshold && g >= threshold && b >= threshold) {
                    data[i + 3] = 0; // make transparent
                }
            }
            ctx.putImageData(imgData, 0, 0);
            // Replace the existing texture with the chroma-keyed canvas
            this.textures.remove(key);
            this.textures.addCanvas(key, canvas);
            console.log(`Chroma-key applied to texture: ${key}`);
        } catch (e) {
            console.warn(`Chroma-key failed for ${key}:`, e);
        }
    }

    ensureShipPlaceholders() {
        // Generate rectangle placeholders only for missing ship textures to avoid key collisions
        const playerShades = [0x2f7bff, 0x1d64df, 0x0f4fbf, 0x093c99];
        const enemyShades = [0xff2f7b, 0xdf1d64, 0xbf0f4f, 0x99093c];
        for (let idx = 0; idx < 4; idx++) {
            const pKey = `player-ship-${idx}`;
            if (!this.textures.exists(pKey)) {
                this.add.graphics()
                    .fillStyle(playerShades[idx])
                    .fillRect(0, 0, 64, 64)
                    .generateTexture(pKey, 64, 64);
            }
            const eKey = `enemy-ship-${idx}`;
            if (!this.textures.exists(eKey)) {
                this.add.graphics()
                    .fillStyle(enemyShades[idx])
                    .fillRect(0, 0, 64, 64)
                    .generateTexture(eKey, 64, 64);
            }
        }
    }
}