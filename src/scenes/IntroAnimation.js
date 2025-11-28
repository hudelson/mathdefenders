// IntroAnimation Scene - Cinematic intro before the main preloader
class IntroAnimationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroAnimationScene' });
        this._canSkip = false;
    }

    preload() {
        // Use actual scene images
        this.load.image('intro-scene-red', 'src/assets/scenes/red.png');
        this.load.image('intro-scene-green', 'src/assets/scenes/green.png');
        this.load.image('intro-scene-yellow', 'src/assets/scenes/yellow.png');
        // Player scene (placeholder file player.png inside scenes/)
        this.load.image('intro-scene-player', 'src/assets/scenes/player.png');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        // Background layer
        const bg = this.add.rectangle(0, 0, w, h, 0x000011).setOrigin(0).setAlpha(1);

        // Allow spacebar to skip the intro at any time
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('PreloaderScene');
        });

        // Helper: promise-based timer
        const wait = (ms) => new Promise(resolve => this.time.delayedCall(ms, resolve));

        // Helper: run a vignette tween on bg color
        const flashTo = (color, duration = 400) => new Promise(resolve => {
            this.tweens.add({
                targets: bg,
                fillColor: color,
                duration,
                onComplete: resolve
            });
        });

        // Helper: show one ship scene with fade
        const showShip = async (key, tintColor) => {
            await flashTo(tintColor, 250);
            const ship = this.add.image(cx, cy, key).setOrigin(0.5).setAlpha(0);
            // Scale the scene image to fit most of the vertical space (~90%)
            let ih = 64;
            try {
                const src = this.textures.get(key).getSourceImage();
                ih = (src && (src.naturalHeight || src.height)) || ih;
            } catch(e) {}
            const targetH = h * 0.9;
            const baseScale = Math.max(0.1, targetH / ih);
            ship.setScale(baseScale);
            this.tweens.add({ targets: ship, alpha: 1, duration: 400, ease: 'Quad.easeOut' });
            // Gentle breathing while visible
            this.tweens.add({ targets: ship, scale: baseScale * 1.05, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            await wait(3000); // hold at least 3s per scene
            await new Promise(resolve => this.tweens.add({ targets: ship, alpha: 0, duration: 450, onComplete: resolve }));
            ship.destroy();
        };

        // Sequence runner
        (async () => {
            await showShip('intro-scene-red', 0x330000);
            await showShip('intro-scene-green', 0x003300);
            await showShip('intro-scene-yellow', 0x333300);

            // Player scene
            await flashTo(0x001133, 250);
            let playerImg;
            if (this.textures.exists('intro-scene-player')) {
                playerImg = this.add.image(cx, cy, 'intro-scene-player').setOrigin(0.5).setAlpha(0);
                // Scale player scene to ~90% of screen height (match others)
                let ih = 64;
                try {
                    const src = this.textures.get('intro-scene-player').getSourceImage();
                    ih = (src && (src.naturalHeight || src.height)) || ih;
                } catch(e) {}
                const targetH = h * 0.9;
                const baseScale = Math.max(0.1, targetH / ih);
                playerImg.setScale(baseScale);
            } else {
                const g = this.add.graphics();
                g.fillStyle(0x66ccff).fillRect(cx - 40, cy - 20, 80, 40);
                playerImg = g;
                playerImg.setAlpha(0);
            }
            this.tweens.add({ targets: playerImg, alpha: 1, duration: 400 });
            await wait(3000); // hold at least 3s for player scene as well
            await new Promise(resolve => this.tweens.add({ targets: playerImg, alpha: 0, duration: 450, onComplete: resolve }));
            playerImg.destroy();

            // Title animation
            await flashTo(0x000011, 200);
            const titleMath = this.add.text(cx, cy - 20, 'MATH', {
                fontFamily: 'Courier New, monospace',
                fontSize: '96px',
                color: '#00ffff',
                stroke: '#003344',
                strokeThickness: 8,
            }).setOrigin(0.5).setScale(0.05).setAlpha(0.2);

            const titleDef = this.add.text(w + 200, cy + 60, 'DEFENDERS', {
                fontFamily: 'Courier New, monospace',
                fontSize: '72px',
                color: '#ffffff',
                stroke: '#00ffff',
                strokeThickness: 6,
            }).setOrigin(0.5);

            this.tweens.add({ targets: titleMath, alpha: 1, duration: 300, ease: 'Sine.easeOut' });
            await new Promise(resolve => this.tweens.add({ targets: titleMath, scale: 1.15, duration: 1200, ease: 'Cubic.easeOut', onComplete: resolve }));
            await new Promise(resolve => this.tweens.add({ targets: titleDef, x: cx, duration: 800, ease: 'Cubic.easeOut', onComplete: resolve }));

            // Prompt
            const prompt = this.add.text(cx, h - 40, 'Press any key or tap to start', {
                fontFamily: 'Courier New, monospace',
                fontSize: '24px',
                color: '#00ff88'
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: prompt, alpha: { from: 0, to: 1 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

            this._canSkip = true;
        })();

        // Accept ANY key press, mouse click, or touch to proceed
        this.input.keyboard.on('keydown', () => this._canSkip && this._startPreloader());
        this.input.on('pointerdown', () => this._canSkip && this._startPreloader());
    }

    _startPreloader() {
        this._canSkip = false;
        // Quick fade and move on to the real preloader
        const rect = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0).setAlpha(0);
        this.tweens.add({ targets: rect, alpha: 1, duration: 250, onComplete: () => this.scene.start('PreloaderScene') });
    }
}
