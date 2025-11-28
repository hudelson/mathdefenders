// Main Menu Scene - Game mode selection
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        console.log('MainMenu: Scene created');
        
        // Add background - galaxy_earth with proper aspect ratio (crop, don't stretch)
        if (this.textures.exists('bg-galaxy-earth')) {
            const bg = this.add.image(400, 300, 'bg-galaxy-earth');
            // Scale to cover the viewport while maintaining aspect ratio
            const scaleX = 800 / bg.width;
            const scaleY = 600 / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
        } else {
            this.add.image(400, 300, 'space-background');
        }
        
        // Game title
        this.add.text(400, 100, 'MATH DEFENDERS', {
            fontSize: '48px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(400, 150, 'Defend Civilization with Mathematics!', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Create menu buttons
        this.createMenuButtons();
        
        // Display current SpaceBux
        this.add.text(50, 550, `SpaceBux: ${window.gameState.spaceBux}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        });
    }

    createMenuButtons() {
        const buttonStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        };

        const hoverStyle = {
            fontSize: '24px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            backgroundColor: '#555555',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        };

        // Addition button
        const addButton = this.add.text(400, 220, 'Addition (+)', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => addButton.setStyle(hoverStyle))
            .on('pointerout', () => addButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.selectGameMode('addition'));

        // Subtraction button
        const subButton = this.add.text(400, 270, 'Subtraction (-)', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => subButton.setStyle(hoverStyle))
            .on('pointerout', () => subButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.selectGameMode('subtraction'));

        // Multiplication button
        const mulButton = this.add.text(400, 320, 'Multiplication (×)', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => mulButton.setStyle(hoverStyle))
            .on('pointerout', () => mulButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.selectGameMode('multiplication'));

        // Division button
        const divButton = this.add.text(400, 370, 'Division (÷)', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => divButton.setStyle(hoverStyle))
            .on('pointerout', () => divButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.selectGameMode('division'));

        // Shop button
        const shopButton = this.add.text(400, 450, 'Shop', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => shopButton.setStyle(hoverStyle))
            .on('pointerout', () => shopButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('ShopScene'));

        // Tutorial button
        const tutorialButton = this.add.text(400, 500, 'How to Play', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => tutorialButton.setStyle(hoverStyle))
            .on('pointerout', () => tutorialButton.setStyle(buttonStyle))
            .on('pointerdown', () => this.scene.start('TutorialScene'));
    }

    selectGameMode(mode) {
        console.log(`MainMenu: Selected game mode: ${mode}`);
        window.gameState.gameMode = mode;
        this.scene.start('LevelSelectScene');
    }
}