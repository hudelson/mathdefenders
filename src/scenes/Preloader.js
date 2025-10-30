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
                'enemy-ship-0','enemy-ship-1','enemy-ship-2','enemy-ship-3',
                'enemy-missile','player-missile',
                'outfit-light-blue','buddy-normal'
            ];
            
            // Add all shop ships
            const shopShipIds = ['blue_fancy', 'cyber', 'falcon', 'green', 'red', 'white', 'xwing'];
            shopShipIds.forEach(id => keysToProcess.push(`shop-ship-${id}`));
            
            // Add all shop outfits
            const outfitIds = [
                'light_blue', 'light_black', 'light_gold', 'light_green', 'light_red',
                'heavy_blue', 'heavy_black', 'heavy_gold', 'heavy_green', 'heavy_red'
            ];
            outfitIds.forEach(id => keysToProcess.push(`shop-outfit-${id}`));
            
            keysToProcess.forEach(k => {
                if (this.textures.exists(k)) {
                    this.chromaKeyTexture(k, { r: 255, g: 255, b: 255 }, 245);
                }
            });

            // For buddies, use corner-based chroma-key to preserve internal white colors
            const buddyIds = ['normal', 'alien', 'aristocrat', 'chef', 'cyber', 'fancy', 
                             'ghost', 'log_cabin', 'lumberjack', 'ninja', 'r2d2', 'red', 'toaster'];
            const greenScreenBuddies = ['chef', 'r2d2'];

            buddyIds.forEach(id => {
                const key = `shop-buddy-${id}`;
                if (this.textures.exists(key)) {
                    if (greenScreenBuddies.includes(id)) {
                        // Sample the border to find the actual green backdrop (can be pastel)
                        this.chromaKeyByCornerAverageColor(key, 120);
                    } else {
                        // Use corner-based removal for all others
                        this.chromaKeyByCornerColor(key, 18);
                    }
                }
            });

            // For explosion, chroma-key only the background by sampling corner color
            if (this.textures.exists('hit-explosion')) {
                this.chromaKeyByCornerColor('hit-explosion', 18);
            }

            // Ensure placeholders exist for any missing ship textures
            this.ensureShipPlaceholders();

            // Ensure placeholders exist for any missing effect textures (after load to avoid key collisions)
            this.ensureEffectPlaceholders();
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
        // Player ship images (now from shop/ships/0/)
        this.load.image('player-ship-0', 'src/assets/shop/ships/0/0_full_health.png');
        this.load.image('player-ship-1', 'src/assets/shop/ships/0/1_minor_damage.png');
        this.load.image('player-ship-2', 'src/assets/shop/ships/0/2_heavy_damage.png');
        this.load.image('player-ship-3', 'src/assets/shop/ships/0/3_destroyed.png');

        // Load index of enemy variants, then dynamically queue one variant
        this.load.json('enemyVariantsIndex', 'src/assets/enemy_ship/index.json');

        // Effects (optional assets with fallbacks)
        this.load.image('enemy-missile', 'src/assets/effects/enemy_missile.png');
        this.load.image('player-missile', 'src/assets/effects/player_missile.png');
        this.load.image('hit-explosion', 'src/assets/effects/explosion.png');

        // Background image
        this.load.image('bg-galaxy', 'src/assets/background/galaxy.png');
        
        // Shop assets
        this.load.image('bg-shop', 'src/assets/background/shop.png');
        this.load.image('outfit-light-blue', 'src/assets/shop/outfits/light_blue.png');
        this.load.image('buddy-normal', 'src/assets/shop/buddy/0_normal.png');
        
        // Shop data JSON files
        this.load.json('shipsData', 'src/assets/shop/ships.json');
        this.load.json('outfitsData', 'src/assets/shop/outfits.json');
        this.load.json('buddiesData', 'src/assets/shop/buddies.json');
        this.load.json('puns', 'src/assets/puns.json');
        
        // Load all shop ships
        this.loadShopShips();
        
        // Load all shop outfits
        this.loadShopOutfits();
        
        // Load all shop buddies
        this.loadShopBuddies();
    }
    
    loadShopShips() {
        // Load shop ship images
        const shipFolders = ['BLUE_FANCY', 'CYBER', 'FALCON', 'GREEN', 'RED', 'WHITE', 'XWING'];
        const shipIds = ['blue_fancy', 'cyber', 'falcon', 'green', 'red', 'white', 'xwing'];
        
        shipFolders.forEach((folder, index) => {
            const id = shipIds[index];
            this.load.image(`shop-ship-${id}`, `src/assets/shop/ships/${folder}/0.png`);
        });
    }
    
    loadShopOutfits() {
        // Load all outfit images
        const outfits = [
            'light_blue', 'light_black', 'light_gold', 'light_green', 'light_red',
            'heavy_blue', 'heavy_black', 'heavy_gold', 'heavy_green', 'heavy_red'
        ];
        
        outfits.forEach(outfit => {
            this.load.image(`shop-outfit-${outfit}`, `src/assets/shop/outfits/${outfit}.png`);
        });
    }
    
    loadShopBuddies() {
        // Load all buddy images
        const buddies = [
            { id: 'normal', file: '0_normal.png' },
            { id: 'alien', file: 'alien.png' },
            { id: 'aristocrat', file: 'aristocrat.png' },
            { id: 'chef', file: 'chef_green.png' },
            { id: 'cyber', file: 'cyber.png' },
            { id: 'fancy', file: 'fancy.png' },
            { id: 'ghost', file: 'ghost.png' },
            { id: 'log_cabin', file: 'log_cabin.png' },
            { id: 'lumberjack', file: 'lumberjack.png' },
            { id: 'ninja', file: 'ninja.png' },
            { id: 'r2d2', file: 'r2d2_green.png' },
            { id: 'red', file: 'red.png' },
            { id: 'toaster', file: 'toaster.png' }
        ];
        
        buddies.forEach(buddy => {
            this.load.image(`shop-buddy-${buddy.id}`, `src/assets/shop/buddy/${buddy.file}`);
        });
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

        // Effect placeholders are generated after load completes to avoid overriding real assets
    }

    ensureEffectPlaceholders() {
        // Generate simple placeholders for effects only if not found after loading
        if (!this.textures.exists('enemy-missile')) {
            this.add.graphics().fillStyle(0xff6666)
                .fillRect(0, 0, 8, 20).generateTexture('enemy-missile', 8, 20);
        }
        if (!this.textures.exists('player-missile')) {
            this.add.graphics().fillStyle(0x66ff66)
                .fillRect(0, 0, 8, 20).generateTexture('player-missile', 8, 20);
        }
        if (!this.textures.exists('hit-explosion')) {
            const g = this.add.graphics();
            g.fillStyle(0xffff66).fillCircle(16, 16, 16)
                .generateTexture('hit-explosion', 32, 32);
            g.destroy();
        }
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

    // Remove pixels close to a specific RGB color using Euclidean distance in RGB space
    chromaKeyByColor(key, target = { r: 0, g: 255, b: 0 }, tolerance = 70) {
        try {
            const src = this.textures.get(key).getSourceImage();
            if (!src || !(src instanceof HTMLImageElement)) return;
            const w = src.naturalWidth || src.width;
            const h = src.naturalHeight || src.height;
            if (w === 0 || h === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(src, 0, 0);
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const tol2 = tolerance * tolerance;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a <= 5) continue; // already transparent
                const dr = r - target.r;
                const dg = g - target.g;
                const db = b - target.b;
                const dist2 = dr * dr + dg * dg + db * db;
                if (dist2 <= tol2) {
                    data[i + 3] = 0; // transparent
                }
            }
            ctx.putImageData(imgData, 0, 0);
            this.textures.remove(key);
            this.textures.addCanvas(key, canvas);
            console.log(`Chroma-key by target color applied to texture: ${key}`);
        } catch (e) {
            console.warn(`Chroma-key by color failed for ${key}:`, e);
        }
    }

    // Remove pixels close to the average color sampled from image borders (good for flat/gradient backdrops)
    chromaKeyByCornerAverageColor(key, tolerance = 110) {
        try {
            const src = this.textures.get(key).getSourceImage();
            if (!src || !(src instanceof HTMLImageElement)) return;
            const w = src.naturalWidth || src.width;
            const h = src.naturalHeight || src.height;
            if (w === 0 || h === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(src, 0, 0);
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Sample multiple border points: 4 corners + midpoints of each edge
            const sampleCoords = [
                [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
                [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
                [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
            ];
            let sr = 0, sg = 0, sb = 0, n = 0;
            for (const [x, y] of sampleCoords) {
                const idx = (y * w + x) * 4;
                const a = data[idx + 3];
                if (a > 5) {
                    sr += data[idx];
                    sg += data[idx + 1];
                    sb += data[idx + 2];
                    n++;
                }
            }
            if (n === 0) return;
            const target = { r: sr / n, g: sg / n, b: sb / n };
            const tol2 = tolerance * tolerance;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a <= 5) continue;
                const dr = r - target.r;
                const dg = g - target.g;
                const db = b - target.b;
                const dist2 = dr * dr + dg * dg + db * db;
                if (dist2 <= tol2) data[i + 3] = 0;
            }
            ctx.putImageData(imgData, 0, 0);
            this.textures.remove(key);
            this.textures.addCanvas(key, canvas);
            console.log(`Chroma-key by corner-avg color applied to texture: ${key}`);
        } catch (e) {
            console.warn(`Chroma-key by corner-avg failed for ${key}:`, e);
        }
    }

    // Chroma-key using the color in the top-left pixel as background, with tolerance
    chromaKeyByCornerColor(key, tolerance = 24) {
        try {
            const src = this.textures.get(key).getSourceImage();
            if (!src || !(src instanceof HTMLImageElement)) return;
            const w = src.naturalWidth || src.width;
            const h = src.naturalHeight || src.height;
            if (w === 0 || h === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(src, 0, 0);
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Sample all four corner colors
            const corners = [
                [data[0], data[1], data[2]], // Top-left
                [data[(w - 1) * 4], data[(w - 1) * 4 + 1], data[(w - 1) * 4 + 2]], // Top-right
                [data[(h - 1) * w * 4], data[(h - 1) * w * 4 + 1], data[(h - 1) * w * 4 + 2]], // Bottom-left
                [data[data.length - 4], data[data.length - 3], data[data.length - 2]] // Bottom-right
            ];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if the pixel color is close to any of the corner colors
                let isBg = false;
                for (const corner of corners) {
                    const dr = Math.abs(r - corner[0]);
                    const dg = Math.abs(g - corner[1]);
                    const db = Math.abs(b - corner[2]);
                    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
                        isBg = true;
                        break;
                    }
                }

                if (isBg) {
                    data[i + 3] = 0; // Make transparent
                }
            }
            ctx.putImageData(imgData, 0, 0);
            this.textures.remove(key);
            this.textures.addCanvas(key, canvas);
            console.log(`Advanced corner chroma-key applied to texture: ${key}`);
        } catch (e) {
            console.warn(`Advanced corner chroma-key failed for ${key}:`, e);
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