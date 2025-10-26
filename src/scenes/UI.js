// UI Scene - HUD and interface elements
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.playerHPBar = null;
        this.enemyHPBar = null;
        this.spaceBuxText = null;
        this.playerInputText = null;
        this.levelText = null;
    }

    create() {
        console.log('UI: Scene created');
        
        // Create UI elements
        this.createHealthBars();
        this.createHUD();
        this.createNumpad();
        
        // Update UI initially
        this.updateUI();
    }

    createHealthBars() {
        // Player HP Bar (bottom left)
        this.add.text(20, 20, 'PLAYER HP:', {
            fontSize: '14px',
            fill: '#00ffff',
            fontFamily: 'Courier New'
        });
        
        // Player HP background
        this.add.graphics()
            .fillStyle(0x333333)
            .fillRect(20, 40, 200, 20);
            
        this.playerHPBar = this.add.graphics();
        
        // Enemy HP Bar (top right)
        this.add.text(580, 20, 'ENEMY HP:', {
            fontSize: '14px',
            fill: '#ff6666',
            fontFamily: 'Courier New'
        });
        
        // Enemy HP background
        this.add.graphics()
            .fillStyle(0x333333)
            .fillRect(580, 40, 200, 20);
            
        this.enemyHPBar = this.add.graphics();
    }

    createHUD() {
        // SpaceBux display
        this.spaceBuxText = this.add.text(400, 20, '', {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        // Current level and mode
        this.levelText = this.add.text(400, 580, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        // Removed obstructing 'Your Answer' UI to avoid covering sprites.
        this.playerInputText = null;
    }

    createNumpad() {
        // Create on-screen numpad for mobile/touch support
        const numpadStyle = {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#444444',
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        };
        
        const hoverStyle = {
            fontSize: '20px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            backgroundColor: '#666666',
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        };
        
        // Position numpad in bottom right
        const startX = 650;
        const startY = 400;
        const spacing = 50;
        
        // Numbers 1-9
        for (let i = 1; i <= 9; i++) {
            const row = Math.floor((i - 1) / 3);
            const col = (i - 1) % 3;
            const x = startX + (col * spacing);
            const y = startY + (row * spacing);
            
            const button = this.add.text(x, y, i.toString(), numpadStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => button.setStyle(hoverStyle))
                .on('pointerout', () => button.setStyle(numpadStyle))
                .on('pointerdown', () => this.handleNumpadInput(i.toString()));
        }
        
        // Number 0
        const zeroButton = this.add.text(startX + spacing, startY + (3 * spacing), '0', numpadStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => zeroButton.setStyle(hoverStyle))
            .on('pointerout', () => zeroButton.setStyle(numpadStyle))
            .on('pointerdown', () => this.handleNumpadInput('0'));
        
        // Backspace button
        const backButton = this.add.text(startX + (2 * spacing), startY + (3 * spacing), '←', numpadStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle(hoverStyle))
            .on('pointerout', () => backButton.setStyle(numpadStyle))
            .on('pointerdown', () => this.handleNumpadInput('Backspace'));
    }

    handleNumpadInput(key) {
        // Send input to game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.handleKeyInput(key);
        }
    }

    updateUI() {
        // Update health bars
        this.updateHealthBars();
        
        // Update SpaceBux
        this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
        
        // Update level info
        const modeTitle = window.gameState.gameMode.charAt(0).toUpperCase() + 
                         window.gameState.gameMode.slice(1);
        this.levelText.setText(`${modeTitle} - Level ${window.gameState.currentLevel}`);
    }

    updateHealthBars() {
        // Clear and redraw player progress bar (wrongs -> lose at 10)
        const gameScene = this.scene.get('GameScene');
        const wrong = gameScene?.wrongCount ?? 0;
        const correct = gameScene?.correctCount ?? 0;
        const target = gameScene?.targetCorrect ?? 10;
        const playerHPPercent = Math.max(0, 1 - wrong / target);
        const enemyHPPercent = Math.max(0, 1 - correct / target);

        this.playerHPBar.clear();
        this.playerHPBar.fillStyle(playerHPPercent > 0.3 ? 0x00ff00 : 0xff6666);
        this.playerHPBar.fillRect(20, 40, 200 * playerHPPercent, 20);
        
        // Clear and redraw enemy progress bar (corrects -> win at 10)
        this.enemyHPBar.clear();
        this.enemyHPBar.fillStyle(0xff6666);
        this.enemyHPBar.fillRect(580, 40, 200 * enemyHPPercent, 20);
    }

    updatePlayerInput(input) {
        // Intentionally no-op; UI box removed to keep playfield clear
    }

    update() {
        // Continuously update UI elements
        this.updateUI();
    }
}