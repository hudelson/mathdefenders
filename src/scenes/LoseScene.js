class LoseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoseScene' });
    }

    init(data) {
        this.score = data.score;
        this.level = data.level;
    }

    create() {
        this.add.image(400, 300, 'bg-galaxy').setDisplaySize(800, 600);

        // Game Over Title
        this.add.text(400, 100, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Placeholder for lose image
        const loseImage = this.add.graphics();
        loseImage.fillStyle(0xff0000, 0.5);
        loseImage.fillRect(275, 150, 250, 200);
        this.add.text(400, 250, 'Placeholder\nLose Image', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Display a random lose pun
        const puns = this.cache.json.get('puns');
        const losePuns = puns.lose;
        const pun = Phaser.Utils.Array.GetRandom(losePuns);
        this.add.text(400, 400, pun, {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        // Score display
        this.add.text(400, 450, `Final Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Retry button
        const retryButton = this.add.text(400, 520, 'Try Again', {
            fontSize: '28px',
            fill: '#00ffff',
            backgroundColor: '#333333',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryButton.on('pointerdown', () => {
            this.scene.start('GameScene', { level: this.level });
        });
        retryButton.on('pointerover', () => retryButton.setStyle({ fill: '#ffffff' }));
        retryButton.on('pointerout', () => retryButton.setStyle({ fill: '#00ffff' }));
    }
}
