// Buddy Shop Scene - Browse and purchase buddies
class BuddyShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BuddyShopScene' });
    }

    create() {
        console.log('BuddyShop: Scene created');
        
        // Add background
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        
        // Title
        this.add.text(400, 30, 'BUDDY BAZAAR', {
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
        
        // Load buddy data and create grid
        const buddiesData = this.cache.json.get('buddiesData');
        if (buddiesData && buddiesData.buddies) {
            this.createBuddyGrid(buddiesData.buddies);
        }
    }
    
    createBuddyGrid(buddies) {
        const startX = 110;
        const startY = 110;
        const itemWidth = 150;
        const itemHeight = 220;
        const cols = 5;
        
        buddies.forEach((buddy, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * itemWidth;
            const y = startY + row * itemHeight;
            
            this.createBuddyItem(buddy, x, y);
        });
    }
    
    createBuddyItem(buddy, x, y) {
        // Container for the item
        const container = this.add.container(x, y);
        
        // Background card
        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 0.8);
        card.fillRoundedRect(-65, -95, 130, 210, 8);
        card.lineStyle(2, 0x00ffff, 1);
        card.strokeRoundedRect(-65, -95, 130, 210, 8);
        container.add(card);
        
        // Buddy image key
        const buddyKey = `shop-buddy-${buddy.id}`;
        
        // Buddy image
        if (this.textures.exists(buddyKey)) {
            const buddyImage = this.add.image(0, -35, buddyKey);
            buddyImage.setScale(0.3);
            container.add(buddyImage);
        }
        
        // Buddy name
        const nameText = this.add.text(0, 30, buddy.name, {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 120 }
        }).setOrigin(0.5);
        container.add(nameText);
        
        // Ability
        const abilityText = this.add.text(0, 60, buddy.ability, {
            fontSize: '9px',
            fill: '#aaaaaa',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 120 }
        }).setOrigin(0.5);
        container.add(abilityText);
        
        // Cost/Owned indicator
        const owned = window.gameState.ownedBuddies && window.gameState.ownedBuddies.includes(buddy.id);
        const costText = this.add.text(0, 85, owned ? 'OWNED' : `${buddy.cost} SB`, {
            fontSize: '14px',
            fill: owned ? '#00ff00' : '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(costText);
        
        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-65, -95, 130, 210);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.setData('buddy', buddy);
        
        container.on('pointerover', () => {
            card.clear();
            card.fillStyle(0x2a2a4e, 0.9);
            card.fillRoundedRect(-65, -95, 130, 210, 8);
            card.lineStyle(3, 0x00ffff, 1);
            card.strokeRoundedRect(-65, -95, 130, 210, 8);
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
            card.fillRoundedRect(-65, -95, 130, 210, 8);
            card.lineStyle(2, 0x00ffff, 1);
            card.strokeRoundedRect(-65, -95, 130, 210, 8);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2'
            });
        });
        
        container.on('pointerdown', () => {
            this.selectBuddy(buddy);
        });
    }
    
    selectBuddy(buddy) {
        console.log('Selected buddy:', buddy);
        
        // Initialize owned buddies if needed
        if (!window.gameState.ownedBuddies) {
            window.gameState.ownedBuddies = ['normal'];
        }
        
        const owned = window.gameState.ownedBuddies.includes(buddy.id);
        
        if (owned) {
            // Equip the buddy
            window.gameState.currentBuddy = buddy.id;
            this.showMessage('Buddy equipped!');
        } else {
            // Try to purchase
            if (window.gameState.spaceBux >= buddy.cost) {
                window.gameState.spaceBux -= buddy.cost;
                window.gameState.ownedBuddies.push(buddy.id);
                window.gameState.currentBuddy = buddy.id;
                window.saveProgress();
                this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
                this.showMessage('Buddy purchased and equipped!');
                // Refresh the scene
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
