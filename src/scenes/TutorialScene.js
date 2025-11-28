// Tutorial Scene - Explains game rules and controls
class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;

        // Background
        this.add.rectangle(0, 0, w, h, 0x001133).setOrigin(0);

        // Title
        this.add.text(cx, 40, 'HOW TO PLAY', {
            fontFamily: 'Courier New, monospace',
            fontSize: '36px',
            color: '#00ffff',
            stroke: '#003344',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Instructions text - simplified and condensed
        const instructions = [
            'OBJECTIVE:',
            'Defend your ship by solving math equations!',
            'First to 10 correct answers wins.',
            '',
            'GAMEPLAY:',
            '• Enemy launches equation blocks at you',
            '• Type the correct answer',
            '• Correct answers send blocks back to damage enemy',
            '• Wrong answers or timeout hit your ship',
            '',
            'SPECIAL BLOCKS:',
            '• RED border = Double damage',
            '• GREEN border = Heals you',
            '• GOLD border = Bonus SpaceBux',
            '',
            'CONTROLS:',
            '• Type numbers 0-9',
            '• Press BACKSPACE to delete',
            '• Use on-screen numpad for mobile'
        ];

        let yPos = 110;
        instructions.forEach(line => {
            const isHeader = line.endsWith(':');
            const style = {
                fontFamily: 'Courier New, monospace',
                fontSize: isHeader ? '18px' : '16px',
                color: isHeader ? '#ffff00' : '#ffffff',
                fontStyle: isHeader ? 'bold' : 'normal'
            };
            this.add.text(60, yPos, line, style);
            yPos += line === '' ? 10 : (isHeader ? 26 : 22);
        });

        // Back button
        const backBtn = this.add.text(cx, h - 60, '[ BACK TO MENU ]', {
            fontFamily: 'Courier New, monospace',
            fontSize: '24px',
            color: '#00ff88'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#00ffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#00ff88'));
        backBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
}
