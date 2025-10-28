// Outfit Shop Scene - Browse and purchase outfits
class OutfitShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OutfitShopScene' });
        this.selectedOutfit = null;
        this.scrollY = 0;
        this.detailElements = [];
        this.outfitContainers = [];
        this.maxScroll = 0;
        this.isDraggingScrollbar = false;
    }

    create() {
        console.log('OutfitShop: Scene created');
        
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        bg.setScrollFactor(0);
        
        this.add.text(400, 35, 'OUTFIT ARMORY', {
            fontSize: '28px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);
        
        const spaceBuxBg = this.add.graphics();
        spaceBuxBg.fillStyle(0x000000, 0.7);
        spaceBuxBg.fillRoundedRect(620, 25, 160, 40, 8);
        spaceBuxBg.lineStyle(2, 0xffff00, 1);
        spaceBuxBg.strokeRoundedRect(620, 25, 160, 40, 8);
        spaceBuxBg.setScrollFactor(0);
        spaceBuxBg.setDepth(1000);
        
        this.spaceBuxText = this.add.text(700, 45, `SpaceBux: ${window.gameState.spaceBux}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
        
        this.createBackButton();
        this.createTopBarOverlay();
        
        const outfitsData = this.cache.json.get('outfitsData');
        if (outfitsData && outfitsData.outfits) {
            const cols = 3;
            const itemHeight = 240;
            const rows = Math.ceil(outfitsData.outfits.length / cols);
            const startY = 180;
            const totalHeight = startY + (rows * itemHeight) + 100;
            const viewHeight = 600;
            
            this.maxScroll = Math.max(0, totalHeight - viewHeight);
            this.cameras.main.setBounds(0, 0, 800, totalHeight);
            this.createOutfitGrid(outfitsData.outfits);
        } else {
            this.maxScroll = 0;
            this.cameras.main.setBounds(0, 0, 800, 600);
        }
        
        this.createScrollbar();
        
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            this.scrollY += deltaY * 0.5;
            this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
            this.cameras.main.scrollY = this.scrollY;
            this.updateScrollbar();
            this.updateOutfitFade();
        });
    }
    
    update() {
        if (this.outfitContainers.length > 0) {
            this.updateOutfitFade();
        }
    }
    
    createTopBarOverlay() {
        const topBar = this.add.graphics();
        topBar.fillStyle(0x0a0a1a, 1);
        topBar.fillRect(0, 0, 800, 75);
        topBar.setScrollFactor(0);
        topBar.setDepth(999);
    }
    
    createScrollbar() {
        const scrollbarX = 770;
        const scrollbarY = 80;
        const scrollbarWidth = 30;
        const scrollbarHeight = 510;
        
        this.scrollbarBg = this.add.graphics();
        this.scrollbarBg.fillStyle(0x1a1a2e, 0.7);
        this.scrollbarBg.fillRoundedRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 8);
        this.scrollbarBg.setScrollFactor(0);
        this.scrollbarBg.setDepth(50);
        
        this.scrollbarThumb = this.add.graphics();
        this.scrollbarThumb.setScrollFactor(0);
        this.scrollbarThumb.setDepth(51);
        
        this.scrollbarZone = this.add.zone(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);
        this.scrollbarZone.setOrigin(0, 0);
        this.scrollbarZone.setScrollFactor(0);
        this.scrollbarZone.setDepth(52);
        this.scrollbarZone.setInteractive({ useHandCursor: true, draggable: true });
        
        this.scrollbarData = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarWidth,
            height: scrollbarHeight,
            thumbHeight: 0,
            thumbY: scrollbarY
        };
        
        this.scrollbarZone.on('pointerdown', (pointer) => {
            this.isDraggingScrollbar = true;
            this.handleScrollbarClick(pointer);
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isDraggingScrollbar) {
                this.handleScrollbarDrag(pointer);
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDraggingScrollbar = false;
        });
        
        this.updateScrollbar();
    }
    
    handleScrollbarClick(pointer) {
        const scrollbarY = this.scrollbarData.y;
        const scrollbarHeight = this.scrollbarData.height;
        const clickY = pointer.y;
        const relativeY = clickY - scrollbarY;
        const scrollProgress = Phaser.Math.Clamp(relativeY / scrollbarHeight, 0, 1);
        this.scrollY = scrollProgress * this.maxScroll;
        this.cameras.main.scrollY = this.scrollY;
        this.updateScrollbar();
        this.updateOutfitFade();
    }
    
    handleScrollbarDrag(pointer) {
        const scrollbarY = this.scrollbarData.y;
        const scrollbarHeight = this.scrollbarData.height;
        const pointerY = pointer.y;
        const relativeY = pointerY - scrollbarY;
        const scrollProgress = Phaser.Math.Clamp(relativeY / scrollbarHeight, 0, 1);
        this.scrollY = scrollProgress * this.maxScroll;
        this.cameras.main.scrollY = this.scrollY;
        this.updateScrollbar();
        this.updateOutfitFade();
    }
    
    updateScrollbar() {
        if (!this.scrollbarThumb || this.maxScroll <= 0) {
            if (this.scrollbarThumb) this.scrollbarThumb.clear();
            if (this.scrollbarBg) this.scrollbarBg.clear();
            if (this.scrollbarZone) this.scrollbarZone.disableInteractive();
            return;
        }
        
        this.scrollbarThumb.clear();
        const scrollbarHeight = this.scrollbarData.height;
        const viewHeight = 600;
        const contentHeight = viewHeight + this.maxScroll;
        const thumbHeight = Math.max(40, (viewHeight / contentHeight) * scrollbarHeight);
        const scrollProgress = this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0;
        const thumbY = this.scrollbarData.y + scrollProgress * (scrollbarHeight - thumbHeight);
        this.scrollbarData.thumbHeight = thumbHeight;
        this.scrollbarData.thumbY = thumbY;
        this.scrollbarThumb.fillStyle(0x00ffff, 0.8);
        this.scrollbarThumb.fillRoundedRect(this.scrollbarData.x, thumbY, this.scrollbarData.width, thumbHeight, 8);
    }
    
    createOutfitGrid(outfits) {
        const cols = 3;
        const itemWidth = 200;
        const itemHeight = 240;
        const gridWidth = cols * itemWidth;
        const startX = (800 - gridWidth) / 2 + itemWidth / 2;
        const startY = 180;
        
        outfits.forEach((outfit, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * itemWidth;
            const y = startY + row * itemHeight;
            this.createOutfitItem(outfit, x, y);
        });
        
        this.updateOutfitFade();
    }
    
    updateOutfitFade() {
        const fadeStartY = 100;
        const fadeEndY = 70;
        this.outfitContainers.forEach(container => {
            const screenY = container.y - this.cameras.main.scrollY;
            if (screenY < fadeStartY) {
                const fadeProgress = Phaser.Math.Clamp((fadeStartY - screenY) / (fadeStartY - fadeEndY), 0, 1);
                const alpha = 1 - fadeProgress;
                container.setAlpha(alpha);
            } else {
                container.setAlpha(1);
            }
        });
    }
    
    createOutfitItem(outfit, x, y) {
        const container = this.add.container(x, y);
        const card = this.add.graphics();
        card.fillStyle(0x1a1a2e, 0.8);
        card.fillRoundedRect(-80, -90, 160, 200, 8);
        card.lineStyle(2, 0x00ffff, 1);
        card.strokeRoundedRect(-80, -90, 160, 200, 8);
        container.add(card);
        
        const outfitKey = `shop-outfit-${outfit.id}`;
        if (this.textures.exists(outfitKey)) {
            const outfitImage = this.createRightHalfImage(outfitKey, 0, -30);
            if (outfitImage) {
                const imgWidth = outfitImage.width;
                const imgHeight = outfitImage.height;
                const maxWidth = 140;
                const maxHeight = 120;
                const scaleX = maxWidth / imgWidth;
                const scaleY = maxHeight / imgHeight;
                const finalScale = Math.min(scaleX, scaleY);
                outfitImage.setScale(finalScale);
                container.add(outfitImage);
            }
        }
        
        const nameText = this.add.text(0, 30, outfit.name, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: 150 }
        }).setOrigin(0.5);
        container.add(nameText);
        
        const owned = window.gameState.ownedOutfits && window.gameState.ownedOutfits.includes(outfit.id);
        const costText = this.add.text(0, 70, owned ? 'OWNED' : `${outfit.cost.toLocaleString()} SB`, {
            fontSize: '16px',
            fill: owned ? '#00ff00' : '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(costText);
        
        const hitArea = new Phaser.Geom.Rectangle(-80, -90, 160, 200);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.setData('outfit', outfit);
        
        container.on('pointerover', () => {
            card.clear();
            card.fillStyle(0x2a2a4e, 0.9);
            card.fillRoundedRect(-80, -90, 160, 200, 8);
            card.lineStyle(3, 0x00ffff, 1);
            card.fillRoundedRect(-80, -90, 160, 200, 8);
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
            this.showOutfitDetail(outfit);
        });
        
        this.outfitContainers.push(container);
    }
    
    createRightHalfImage(textureKey, x, y) {
        try {
            // Check if we already have the cropped version
            const croppedKey = `outfit-right-${textureKey}`;
            if (this.textures.exists(croppedKey)) {
                return this.add.image(x, y, croppedKey);
            }
            
            if (!this.textures.exists(textureKey)) {
                console.warn(`Texture ${textureKey} does not exist`);
                return null;
            }
            
            const srcTexture = this.textures.get(textureKey);
            const srcImage = srcTexture.getSourceImage();
            
            if (!srcImage) {
                console.warn(`No source image for texture ${textureKey}`);
                return null;
            }
            
            // Get dimensions - handle both HTMLImageElement and HTMLCanvasElement
            const srcWidth = srcImage.naturalWidth || srcImage.width || 0;
            const srcHeight = srcImage.naturalHeight || srcImage.height || 0;
            
            if (srcWidth === 0 || srcHeight === 0) {
                console.warn(`Invalid dimensions for texture ${textureKey}`);
                return null;
            }
            
            const halfWidth = Math.floor(srcWidth / 2);
            const cropX = halfWidth + 5;
            const cropY = 5;
            const cropWidth = Math.max(1, halfWidth - 10);
            const cropHeight = Math.max(1, srcHeight - 10);
            
            const canvas = document.createElement('canvas');
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.warn(`Could not get canvas context for ${textureKey}`);
                return null;
            }
            
            ctx.drawImage(srcImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            // Add the canvas as a new texture (only once)
            this.textures.addCanvas(croppedKey, canvas);
            return this.add.image(x, y, croppedKey);
        } catch (error) {
            console.error(`Error creating right half image for ${textureKey}:`, error);
            return null;
        }
    }
    
    showOutfitDetail(outfit) {
        this.detailElements.forEach(element => {
            if (element && element.destroyButton) {
                element.destroyButton();
            } else if (element && element.destroy) {
                element.destroy();
            }
        });
        this.detailElements = [];
        
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, 800, 600);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 800, 600), Phaser.Geom.Rectangle.Contains);
        overlay.setDepth(100);
        overlay.setScrollFactor(0);
        this.detailElements.push(overlay);
        
        const topBarHeight = 75;
        const panelWidth = 650;
        const availableHeight = 600 - topBarHeight - 20;
        const panelHeight = Math.min(480, availableHeight);
        const panelX = (800 - panelWidth) / 2;
        const panelY = topBarHeight + (availableHeight - panelHeight) / 2;
        
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 1);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
        panel.lineStyle(4, 0x00ffff, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
        panel.setDepth(101);
        panel.setScrollFactor(0);
        this.detailElements.push(panel);
        
        const outfitKey = `shop-outfit-${outfit.id}`;
        if (this.textures.exists(outfitKey)) {
            const outfitImage = this.createRightHalfImage(outfitKey, panelX + 180, panelY + panelHeight / 2);
            if (outfitImage) {
                const imgWidth = outfitImage.width;
                const imgHeight = outfitImage.height;
                const maxWidth = 280;
                const maxHeight = panelHeight - 120;
                const scaleX = maxWidth / imgWidth;
                const scaleY = maxHeight / imgHeight;
                const finalScale = Math.min(scaleX, scaleY);
                outfitImage.setScale(finalScale);
                outfitImage.setDepth(102);
                outfitImage.setScrollFactor(0);
                this.detailElements.push(outfitImage);
            }
        }
        
        const titleText = this.add.text(panelX + 340, panelY + 50, outfit.name, {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            align: 'left',
            wordWrap: { width: 280 }
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(titleText);
        
        const descText = this.add.text(panelX + 340, panelY + 110, outfit.description, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'left',
            wordWrap: { width: 280 }
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(descText);
        
        let statsY = panelY + 200;
        if (outfit.stats) {
            const statsTitle = this.add.text(panelX + 340, statsY, 'STATS:', {
                fontSize: '16px',
                fill: '#ffff00',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(statsTitle);
            
            statsY += 25;
            const defenseText = this.add.text(panelX + 340, statsY, `Defense: ${outfit.stats.defense}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(defenseText);
            
            statsY += 22;
            const mobilityText = this.add.text(panelX + 340, statsY, `Mobility: ${outfit.stats.mobility}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(mobilityText);
            
            statsY += 22;
            const styleText = this.add.text(panelX + 340, statsY, `Style: ${outfit.stats.style}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(styleText);
        }
        
        const costText = this.add.text(panelX + 340, panelY + panelHeight - 130, `Cost: ${outfit.cost.toLocaleString()} SpaceBux`, {
            fontSize: '22px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(costText);
        
        if (!window.gameState.ownedOutfits) {
            window.gameState.ownedOutfits = ['light_blue'];
        }
        const owned = window.gameState.ownedOutfits.includes(outfit.id);
        const isEquipped = window.gameState.currentOutfit === outfit.id;
        
        const buttonY = panelY + panelHeight - 70;
        const buttonWidth = 140;
        const buttonHeight = 50;
        const buttonSpacing = 30;
        
        const closeButton = this.createButton(panelX + panelWidth/2 - buttonWidth - buttonSpacing/2, buttonY, buttonWidth, buttonHeight, 'Close', 103);
        this.detailElements.push(closeButton);
        closeButton.on('pointerdown', () => {
            this.closeOutfitDetail();
        });
        
        let actionButton = null;
        if (owned) {
            if (!isEquipped) {
                actionButton = this.createButton(panelX + panelWidth/2 + buttonSpacing/2, buttonY, buttonWidth, buttonHeight, 'Equip', 103);
                this.detailElements.push(actionButton);
                actionButton.on('pointerdown', () => {
                    window.gameState.currentOutfit = outfit.id;
                    window.saveProgress();
                    this.showMessage('Outfit equipped!');
                    this.closeOutfitDetail();
                });
            } else {
                const equippedText = this.add.text(panelX + panelWidth/2 + buttonSpacing/2 + buttonWidth/2, buttonY + buttonHeight/2, 'EQUIPPED', {
                    fontSize: '18px',
                    fill: '#00ff00',
                    fontFamily: 'Courier New',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
                this.detailElements.push(equippedText);
            }
        } else {
            actionButton = this.createButton(panelX + panelWidth/2 + buttonSpacing/2, buttonY, buttonWidth, buttonHeight, 'Purchase', 103);
            this.detailElements.push(actionButton);
            actionButton.on('pointerdown', () => {
                if (window.gameState.spaceBux >= outfit.cost) {
                    window.gameState.spaceBux -= outfit.cost;
                    window.gameState.ownedOutfits.push(outfit.id);
                    window.gameState.currentOutfit = outfit.id;
                    window.saveProgress();
                    this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
                    this.showMessage('Outfit purchased and equipped!');
                    this.closeOutfitDetail();
                    this.scene.restart();
                } else {
                    this.showMessage('Not enough SpaceBux!');
                }
            });
        }
    }
    
    closeOutfitDetail() {
        this.detailElements.forEach(element => {
            if (element && element.destroyButton) {
                element.destroyButton();
            } else if (element && element.destroy) {
                element.destroy();
            }
        });
        this.detailElements = [];
    }
    
    createButton(x, y, width, height, text, depth) {
        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeRoundedRect(x, y, width, height, 8);
        bg.setDepth(depth);
        bg.setScrollFactor(0);
        
        const buttonText = this.add.text(x + width / 2, y + height / 2, text, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        buttonText.setDepth(depth + 1);
        buttonText.setScrollFactor(0);
        
        const hitZone = this.add.zone(x, y, width, height);
        hitZone.setOrigin(0, 0);
        hitZone.setInteractive({ useHandCursor: true });
        hitZone.setDepth(depth);
        hitZone.setScrollFactor(0);
        hitZone.setData('bg', bg);
        hitZone.setData('text', buttonText);
        
        hitZone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x555555, 1);
            bg.fillRoundedRect(x, y, width, height, 8);
            bg.lineStyle(3, 0x00ffff, 1);
            bg.strokeRoundedRect(x, y, width, height, 8);
            buttonText.setStyle({ fill: '#00ffff' });
        });
        
        hitZone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x333333, 1);
            bg.fillRoundedRect(x, y, width, height, 8);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.strokeRoundedRect(x, y, width, height, 8);
            buttonText.setStyle({ fill: '#ffffff' });
        });
        
        hitZone.destroyButton = function() {
            bg.destroy();
            buttonText.destroy();
            hitZone.destroy();
        };
        
        return hitZone;
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
        }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
        
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
        const backButton = this.add.text(110, 35, '← Return to Hangar', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#333333',
            padding: { left: 16, right: 16, top: 8, bottom: 8 }
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(1000)
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
