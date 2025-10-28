// Ship Shop Scene - Browse and purchase ships
class ShipShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipShopScene' });
        this.selectedShip = null;
    }

    create() {
        console.log('ShipShop: Scene created');
        
        // Add background
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        
        // Title
        this.add.text(400, 30, 'SHIP HANGAR', {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        
        // SpaceBux display
        this.spaceBuxText = this.add.text(720, 30, `SpaceBux: ${window.gameState.spaceBux}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(1, 0);
        
        // Back button
        this.createBackButton();
        
        // Load ship data and create grid
        const shipsData = this.cache.json.get('shipsData');
        if (shipsData && shipsData.ships) {
            this.createShipGrid(shipsData.ships);
        }
    }
    
    createShipGrid(ships) {
        const startX = 100;
        const startY = 100;
        const itemWidth = 180;
        const itemHeight = 220;
        const cols = 4;
        
        ships.forEach((ship, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * itemWidth;
            const y = startY + row * itemHeight;
            
            this.createShipItem(ship, x, y);
        });
    }
    
    createShipItem(ship, x, y) {
        // Container for the item
        const container = this.add.container(x, y);
        
        // Background card
        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 0.8);
        card.fillRoundedRect(-80, -90, 160, 200, 8);
        card.lineStyle(2, 0x00ffff, 1);
        card.strokeRoundedRect(-80, -90, 160, 200, 8);
        container.add(card);
        
        // Determine the texture key
        let shipKey;
        if (ship.isDefault) {
            shipKey = 'player-ship-0';
        } else {
            shipKey = `shop-ship-${ship.id}`;
        }
        
        // Ship image
        if (this.textures.exists(shipKey)) {
            const shipImage = this.add.image(0, -30, shipKey);
            shipImage.setScale(0.4);
            container.add(shipImage);
        }
        
        // Ship name
        const nameText = this.add.text(0, 30, ship.name, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 150 }
        }).setOrigin(0.5);
        container.add(nameText);
        
        // Cost/Owned indicator
        const owned = window.gameState.ownedShips && window.gameState.ownedShips.includes(ship.id);
        const costText = this.add.text(0, 70, owned ? 'OWNED' : `${ship.cost} SB`, {
            fontSize: '16px',
            fill: owned ? '#00ff00' : '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(costText);
        
        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-80, -90, 160, 200);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.setData('ship', ship);
        
        container.on('pointerover', () => {
            card.clear();
            card.fillStyle(0x2a2a4e, 0.9);
            card.fillRoundedRect(-80, -90, 160, 200, 8);
            card.lineStyle(3, 0x00ffff, 1);
            card.strokeRoundedRect(-80, -90, 160, 200, 8);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Power2'
            });
        });
        
        container.on('pointerout', () => {
            card.clear();
            card.fillStyle(0x1a1a2e, 0.8);
            card.fillRoundedRect(-80, -90, 160, 200, 8);
            card.lineStyle(2, 0x00ffff, 1);
            card.strokeRoundedRect(-80, -90, 160, 200, 8);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2'
            });
        });
        
        container.on('pointerdown', () => {
            this.selectShip(ship);
        });
    }
    
    selectShip(ship) {
        console.log('Selected ship:', ship);
        
        // Check if already owned
        if (!window.gameState.ownedShips) {
            window.gameState.ownedShips = ['default'];
        }
        
        const owned = window.gameState.ownedShips.includes(ship.id);
        
        if (owned) {
            // Equip the ship
            window.gameState.currentShip = ship.id;
            this.showMessage('Ship equipped!');
        } else {
            // Try to purchase
            if (window.gameState.spaceBux >= ship.cost) {
                window.gameState.spaceBux -= ship.cost;
                window.gameState.ownedShips.push(ship.id);
                window.gameState.currentShip = ship.id;
                window.saveProgress();
                this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
                this.showMessage('Ship purchased and equipped!');
                // Refresh the scene to update owned status
                this.scene.restart();
            } else {
                this.showMessage('Not enough SpaceBux!');
            }
        }
    }
    
    showMessage(text) {
        const msg = this.add.text(400, 300, text, {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#000000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: 250,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => msg.destroy()
        });
    }
    
    createBackButton() {
        const backButton = this.add.text(80, 30, '← Back', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 16, right: 16, top: 8, bottom: 8 }
        })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            backButton.setStyle({ fill: '#00ffff', backgroundColor: '#555555' });
        })
        .on('pointerout', () => {
            backButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
        })
        .on('pointerdown', () => {
            this.scene.start('ShopScene');
        });
    }
}
