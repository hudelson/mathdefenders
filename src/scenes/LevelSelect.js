// Level Select Scene - Choose starting level
class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        console.log('LevelSelect: Scene created');
        
        // Add background - asteroid field with proper aspect ratio (crop, don't stretch)
        if (this.textures.exists('bg-asteroid-field')) {
            const bg = this.add.image(400, 300, 'bg-asteroid-field');
            // Scale to cover the viewport while maintaining aspect ratio
            const scaleX = 800 / bg.width;
            const scaleY = 600 / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
        } else {
            this.add.image(400, 300, 'space-background');
        }
        
        // Title
        const modeTitle = window.gameState.gameMode.charAt(0).toUpperCase() + 
                         window.gameState.gameMode.slice(1);
        this.add.text(400, 80, `${modeTitle} Levels`, {
            fontSize: '36px',
            fill: '#00ffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Create level buttons
        this.createLevelButtons();
        
        // Back button
        const backButton = this.add.text(100, 550, '← Back', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 15, right: 15, top: 8, bottom: 8 }
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => backButton.setStyle({ fill: '#00ffff', backgroundColor: '#555555' }))
        .on('pointerout', () => backButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' }))
        .on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    createLevelButtons() {
        const currentMode = window.gameState.gameMode;
        const highestLevel = window.gameState.highestLevels[currentMode];
        
        const buttonStyle = {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 16, right: 16, top: 12, bottom: 12 }
        };

        const lockedStyle = {
            fontSize: '20px',
            fill: '#444444',
            fontFamily: 'Courier New',
            backgroundColor: '#1a1a1a',
            padding: { left: 16, right: 16, top: 12, bottom: 12 }
        };

        const hoverStyle = {
            fontSize: '20px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            backgroundColor: '#555555',
            padding: { left: 16, right: 16, top: 12, bottom: 12 }
        };

        const endlessStyle = {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            backgroundColor: '#444400',
            padding: { left: 14, right: 14, top: 10, bottom: 10 }
        };

        const endlessHoverStyle = {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            backgroundColor: '#666600',
            padding: { left: 14, right: 14, top: 10, bottom: 10 }
        };

        // Create a 4x3 grid for levels 1-12
        const cols = 4;
        const rows = 3;
        const startX = 220;
        const startY = 160;
        const buttonSpacing = 90;
        const rowSpacing = 70;

        for (let level = 1; level <= 12; level++) {
            const row = Math.floor((level - 1) / cols);
            const col = (level - 1) % cols;
            const x = startX + (col * buttonSpacing);
            const y = startY + (row * rowSpacing);

            const isUnlocked = level <= highestLevel + 1;
            const style = isUnlocked ? buttonStyle : lockedStyle;

            const levelButton = this.add.text(x, y, `${level}`, style)
                .setOrigin(0.5);

            if (isUnlocked) {
                levelButton
                    .setInteractive({ useHandCursor: true })
                    .on('pointerover', () => levelButton.setStyle(hoverStyle))
                    .on('pointerout', () => levelButton.setStyle(buttonStyle))
                    .on('pointerdown', () => this.startLevel(level));
            }
        }

        // Add Endless mode button below the grid
        const endlessButton = this.add.text(400, startY + (rows * rowSpacing) + 30, 'ENDLESS', endlessStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => endlessButton.setStyle(endlessHoverStyle))
            .on('pointerout', () => endlessButton.setStyle(endlessStyle))
            .on('pointerdown', () => this.startLevel(999)); // Use 999 as endless level marker

        // Show progress info
        this.add.text(400, 480, `Highest Level: ${highestLevel}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    }

    startLevel(level) {
        console.log(`LevelSelect: Starting level ${level} in ${window.gameState.gameMode} mode`);
        window.gameState.currentLevel = level;
        
        // Reset HP for new level
        window.gameState.playerHP = 100;
        window.gameState.enemyHP = 100;
        
        this.scene.start('GameScene');
    }
}