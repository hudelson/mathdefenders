// Preloader Scene - Handles asset loading
class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log('Preloader: Loading assets...');
        
        // Create loading bar
        this.createLoadingBar();
        
        // Load placeholder assets (simple colored rectangles for now)
        this.createPlaceholderAssets();
        
        // Update loading bar
        this.load.on('progress', (value) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x00ffff);
            this.progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            console.log('Preloader: Assets loaded');
        });
    }

    create() {
        console.log('Preloader: Scene created');
        
        // Transition to main menu after short delay
        this.time.delayedCall(1000, () => {
            this.scene.start('MainMenuScene');
        });
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

    createPlaceholderAssets() {
        // Create simple colored rectangle textures as placeholders
        
        // Player ship - blue rectangle
        this.add.graphics()
            .fillStyle(0x0066ff)
            .fillRect(0, 0, 64, 64)
            .generateTexture('player-ship', 64, 64);

        // Enemy ship - red rectangle  
        this.add.graphics()
            .fillStyle(0xff0066)
            .fillRect(0, 0, 64, 64)
            .generateTexture('enemy-ship', 64, 64);

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
}