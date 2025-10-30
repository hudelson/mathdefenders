class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    init(data) {
        this.score = data.score;
        this.level = data.level;
    }

    create() {
        this.add.image(400, 300, 'bg-galaxy').setDisplaySize(800, 600);

        // Win Title
        this.add.text(400, 100, 'LEVEL COMPLETE!', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Placeholder for win image
        const winImage = this.add.graphics();
        winImage.fillStyle(0x00ff00, 0.5);
        winImage.fillRect(275, 150, 250, 200);
        this.add.text(400, 250, 'Placeholder\nWin Image', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Display a random win pun
        const puns = this.cache.json.get('puns');
        const winPuns = puns.win;
        const pun = Phaser.Utils.Array.GetRandom(winPuns);
        this.add.text(400, 400, pun, {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5);

        // Score display
        this.add.text(400, 450, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Continue button
        const continueButton = this.add.text(400, 520, 'Continue', {
            fontSize: '28px',
            fill: '#00ffff',
            backgroundColor: '#333333',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        continueButton.on('pointerdown', () => {
            this.scene.start('LevelSelectScene');
        });
        continueButton.on('pointerover', () => continueButton.setStyle({ fill: '#ffffff' }));
        continueButton.on('pointerout', () => continueButton.setStyle({ fill: '#00ffff' }));
    }
}
