// Level Select Scene - Choose starting level
class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        console.log('LevelSelect: Scene created');
        
        // Add background
        this.add.image(400, 300, 'space-background');
        
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
        const maxLevelsToShow = Math.min(highestLevel + 1, 20); // Show up to 20 levels
        
        const buttonStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 12, right: 12, top: 8, bottom: 8 }
        };

        const lockedStyle = {
            fontSize: '18px',
            fill: '#666666',
            fontFamily: 'Courier New',
            backgroundColor: '#222222',
            padding: { left: 12, right: 12, top: 8, bottom: 8 }
        };

        const hoverStyle = {
            fontSize: '18px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            backgroundColor: '#555555',
            padding: { left: 12, right: 12, top: 8, bottom: 8 }
        };

        // Create level buttons in a grid
        const buttonsPerRow = 5;
        const startX = 250;
        const startY = 150;
        const buttonSpacing = 70;

        for (let level = 1; level <= maxLevelsToShow; level++) {
            const row = Math.floor((level - 1) / buttonsPerRow);
            const col = (level - 1) % buttonsPerRow;
            const x = startX + (col * buttonSpacing);
            const y = startY + (row * 60);

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

        // Show progress info
        this.add.text(400, 450, `Highest Level Completed: ${highestLevel}`, {
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