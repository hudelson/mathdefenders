// Shop Scene - Placeholder for future features
class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        console.log('Shop: Scene created');
        
        // Add background
        this.add.image(400, 300, 'space-background');
        
        // Shop title
        this.add.text(400, 150, 'SHOP', {
            fontSize: '48px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Coming soon message
        this.add.text(400, 250, 'Coming Soon!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        // Description
        this.add.text(400, 300, 'Use your SpaceBux to purchase upgrades,\nnew ships, and special abilities!', {
            fontSize: '18px',
            fill: '#cccccc',
            fontFamily: 'Courier New',
            align: 'center'
        }).setOrigin(0.5);
        
        // Current SpaceBux display
        this.add.text(400, 380, `Your SpaceBux: ${window.gameState.spaceBux}`, {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        // Back button
        const backButton = this.add.text(400, 500, '← Back to Main Menu', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 20, right: 20, top: 12, bottom: 12 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            backButton.setStyle({
                fill: '#00ffff',
                backgroundColor: '#555555'
            });
        })
        .on('pointerout', () => {
            backButton.setStyle({
                fill: '#ffffff',
                backgroundColor: '#333333'
            });
        })
        .on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
}