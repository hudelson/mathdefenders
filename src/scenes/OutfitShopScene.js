// Outfit Shop Scene - Browse and purchase outfits
class OutfitShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OutfitShopScene' });
    }

    create() {
        console.log('OutfitShop: Scene created');
        
        // Add background
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        
        // Title
        this.add.text(400, 30, 'OUTFIT ARMORY', {
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
        
        // Load outfit data and create grid
        const outfitsData = this.cache.json.get('outfitsData');
        if (outfitsData && outfitsData.outfits) {
            this.createOutfitGrid(outfitsData.outfits);
        }
    }
    
    createOutfitGrid(outfits) {
        const startX = 120;
        const startY = 110;
        const itemWidth = 160;
        const itemHeight = 240;
        const cols = 5;
        
        outfits.forEach((outfit, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * itemWidth;
            const y = startY + row * itemHeight;
            
            this.createOutfitItem(outfit, x, y);
        });
    }
    
    createOutfitItem(outfit, x, y) {
        // Container for the item
        const container = this.add.container(x, y);
        
        // Background card
        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 0.8);
        card.fillRoundedRect(-70, -100, 140, 220, 8);
        card.lineStyle(2, 0x00ffff, 1);
        card.strokeRoundedRect(-70, -100, 140, 220, 8);
        container.add(card);
        
        // Outfit image key
        const outfitKey = `shop-outfit-${outfit.id}`;
        
        // Show outfit image (right side of the image for shop view)
        if (this.textures.exists(outfitKey)) {
            const outfitImage = this.add.image(0, -35, outfitKey);
            outfitImage.setScale(0.25);
            container.add(outfitImage);
        }
        
        // Outfit name
        const nameText = this.add.text(0, 35, outfit.name, {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 130 }
        }).setOrigin(0.5);
        container.add(nameText);
        
        // Type indicator
        const typeText = this.add.text(0, 65, outfit.type.toUpperCase(), {
            fontSize: '10px',
            fill: outfit.type === 'heavy' ? '#ff9900' : '#00ff99',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        container.add(typeText);
        
        // Cost/Owned indicator
        const owned = window.gameState.ownedOutfits && window.gameState.ownedOutfits.includes(outfit.id);
        const costText = this.add.text(0, 90, owned ? 'OWNED' : `${outfit.cost} SB`, {
            fontSize: '14px',
            fill: owned ? '#00ff00' : '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(costText);
        
        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-70, -100, 140, 220);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.setData('outfit', outfit);
        
        container.on('pointerover', () => {
            card.clear();
            card.fillStyle(0x2a2a4e, 0.9);
            card.fillRoundedRect(-70, -100, 140, 220, 8);
            card.lineStyle(3, 0x00ffff, 1);
            card.strokeRoundedRect(-70, -100, 140, 220, 8);
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
            card.fillRoundedRect(-70, -100, 140, 220, 8);
            card.lineStyle(2, 0x00ffff, 1);
            card.strokeRoundedRect(-70, -100, 140, 220, 8);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2'
            });
        });
        
        container.on('pointerdown', () => {
            this.selectOutfit(outfit);
        });
    }
    
    selectOutfit(outfit) {
        console.log('Selected outfit:', outfit);
        
        // Initialize owned outfits if needed
        if (!window.gameState.ownedOutfits) {
            window.gameState.ownedOutfits = ['light_blue'];
        }
        
        const owned = window.gameState.ownedOutfits.includes(outfit.id);
        
        if (owned) {
            // Equip the outfit
            window.gameState.currentOutfit = outfit.id;
            this.showMessage('Outfit equipped!');
        } else {
            // Try to purchase
            if (window.gameState.spaceBux >= outfit.cost) {
                window.gameState.spaceBux -= outfit.cost;
                window.gameState.ownedOutfits.push(outfit.id);
                window.gameState.currentOutfit = outfit.id;
                window.saveProgress();
                this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
                this.showMessage('Outfit purchased and equipped!');
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
