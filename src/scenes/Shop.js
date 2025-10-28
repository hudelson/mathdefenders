// Shop Scene - Displays current character, ship, and buddy
class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        console.log('Shop: Scene created');
        
        // Add shop background (scaled 180% larger - increased by 20%)
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        
        // Process and display outfit character (lower left)
        this.displayOutfit();
        
        // Display ship in center with pulsing animation
        this.displayShip();
        
        // Display buddy (lower right)
        this.displayBuddy();
        
        // Current SpaceBux display (top right) with background box
        const spaceBuxBg = this.add.graphics();
        spaceBuxBg.fillStyle(0x000000, 0.7);
        spaceBuxBg.fillRoundedRect(560, 20, 160, 40, 8);
        spaceBuxBg.lineStyle(2, 0xffff00, 1);
        spaceBuxBg.strokeRoundedRect(560, 20, 160, 40, 8);
        
        this.add.text(640, 40, `SpaceBux: ${window.gameState.spaceBux}`, {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        
        // Back button (top left)
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
    
    displayOutfit() {
        // Get the current outfit from game state
        const currentOutfit = window.gameState.currentOutfit || 'light_blue';
        const outfitKey = `shop-outfit-${currentOutfit}`;
        
        if (!this.textures.exists(outfitKey)) {
            console.warn('Outfit texture not found:', outfitKey);
            return;
        }
        
        // Crop left half, remove 5px border, then display
        const srcTexture = this.textures.get(outfitKey);
        const srcImage = srcTexture.getSourceImage();
        const srcWidth = srcImage.naturalWidth || srcImage.width;
        const srcHeight = srcImage.naturalHeight || srcImage.height;
        
        // Crop: left half only
        const halfWidth = Math.floor(srcWidth / 2);
        
        // Remove 5px from borders: x+5, y+5, width-10, height-10
        const cropX = 5;
        const cropY = 5;
        const cropWidth = halfWidth - 10;
        const cropHeight = srcHeight - 10;
        
        // Create canvas for the cropped version
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw the cropped portion
        ctx.drawImage(
            srcImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // Add as a new texture
        const croppedKey = 'outfit-cropped';
        if (this.textures.exists(croppedKey)) {
            this.textures.remove(croppedKey);
        }
        this.textures.addCanvas(croppedKey, canvas);
        
        // Display in lower left corner (scaled to 53% of original - decreased by 20%)
        const outfit = this.add.image(120, 480, croppedKey);
        outfit.setOrigin(0.5, 0.5);
        outfit.setScale(0.53);
        
        // Make interactive
        outfit.setInteractive({ useHandCursor: true });
        
        // Store original scale and create hover animation
        const originalScale = 0.53;
        let hoverTween = null;
        
        outfit.on('pointerover', () => {
            // Stop pulsing if exists and grow slightly
            if (hoverTween) hoverTween.stop();
            hoverTween = this.tweens.add({
                targets: outfit,
                scaleX: originalScale * 1.15,
                scaleY: originalScale * 1.15,
                duration: 200,
                ease: 'Power2'
            });
            
            // Flash light color
            outfit.setTint(0xddddff);
        });
        
        outfit.on('pointerout', () => {
            // Return to original scale
            if (hoverTween) hoverTween.stop();
            hoverTween = this.tweens.add({
                targets: outfit,
                scaleX: originalScale,
                scaleY: originalScale,
                duration: 200,
                ease: 'Power2'
            });
            
            // Remove tint
            outfit.clearTint();
        });
        
        outfit.on('pointerdown', () => {
            console.log('Navigate to Outfit Shop');
            // TODO: Navigate to outfit shop scene
            this.scene.start('OutfitShopScene');
        });
        
        console.log(`Outfit displayed: ${cropWidth}x${cropHeight} at lower left`);
    }
    
    displayShip() {
        // Get the current ship from game state
        const currentShip = window.gameState.currentShip || 'default';
        let shipKey;
        
        if (currentShip === 'default') {
            shipKey = 'player-ship-0';
        } else {
            shipKey = `shop-ship-${currentShip}`;
        }
        
        if (!this.textures.exists(shipKey)) {
            console.warn('Player ship texture not found:', shipKey);
            return;
        }
        
        const ship = this.add.image(400, 280, shipKey);
        ship.setOrigin(0.5, 0.5);
        ship.setScale(0.5);
        
        // Make interactive
        ship.setInteractive({ useHandCursor: true });
        
        // Store reference to pulsing tween and state
        const originalScale = 0.5;
        let pulsingTween = null;
        let hoverTween = null;
        
        // Start normal pulsing animation
        pulsingTween = this.tweens.add({
            targets: ship,
            scaleX: 0.55,
            scaleY: 0.55,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        ship.on('pointerover', () => {
            // Stop pulsing and grow slightly larger
            if (pulsingTween) pulsingTween.stop();
            if (hoverTween) hoverTween.stop();
            hoverTween = this.tweens.add({
                targets: ship,
                scaleX: originalScale * 1.2,
                scaleY: originalScale * 1.2,
                duration: 200,
                ease: 'Power2'
            });
            
            // Flash light color
            ship.setTint(0xddddff);
        });
        
        ship.on('pointerout', () => {
            // Return to original scale and restart pulsing
            if (hoverTween) hoverTween.stop();
            ship.clearTint();
            ship.setScale(originalScale);
            
            pulsingTween = this.tweens.add({
                targets: ship,
                scaleX: 0.55,
                scaleY: 0.55,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
        
        ship.on('pointerdown', () => {
            console.log('Navigate to Ship Shop');
            // TODO: Navigate to ship shop scene
            this.scene.start('ShipShopScene');
        });
        
        console.log('Ship displayed with pulsing animation');
    }
    
    displayBuddy() {
        // Get the current buddy from game state
        const currentBuddy = window.gameState.currentBuddy || 'normal';
        const buddyKey = `shop-buddy-${currentBuddy}`;
        
        if (!this.textures.exists(buddyKey)) {
            console.warn('Buddy texture not found:', buddyKey);
            return;
        }
        
        const buddy = this.add.image(675, 420, buddyKey);
        buddy.setOrigin(0.5, 0.5);
        buddy.setScale(0.375);
        
        // Make interactive
        buddy.setInteractive({ useHandCursor: true });
        
        // Store original scale
        const originalScale = 0.375;
        let hoverTween = null;
        
        buddy.on('pointerover', () => {
            // Grow slightly
            if (hoverTween) hoverTween.stop();
            hoverTween = this.tweens.add({
                targets: buddy,
                scaleX: originalScale * 1.15,
                scaleY: originalScale * 1.15,
                duration: 200,
                ease: 'Power2'
            });
            
            // Flash light color
            buddy.setTint(0xddddff);
        });
        
        buddy.on('pointerout', () => {
            // Return to original scale
            if (hoverTween) hoverTween.stop();
            hoverTween = this.tweens.add({
                targets: buddy,
                scaleX: originalScale,
                scaleY: originalScale,
                duration: 200,
                ease: 'Power2'
            });
            
            // Remove tint
            buddy.clearTint();
        });
        
        buddy.on('pointerdown', () => {
            console.log('Navigate to Buddy Shop');
            // TODO: Navigate to buddy shop scene
            this.scene.start('BuddyShopScene');
        });
        
        console.log('Buddy displayed at lower right');
    }
}
