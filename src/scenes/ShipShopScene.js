// Ship Shop Scene - Browse and purchase ships
class ShipShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipShopScene' });
        this.selectedShip = null;
        this.scrollY = 0;
        this.detailElements = []; // Track popup elements for cleanup
        this.shipContainers = []; // Track ship containers for fade effect
        this.maxScroll = 0; // Will be calculated based on content
        this.isDraggingScrollbar = false;
    }

    create() {
        console.log('ShipShop: Scene created');
        
        // Add background
        const bg = this.add.image(400, 300, 'bg-shop');
        bg.setDisplaySize(800 * 1.8, 600 * 1.8);
        bg.setScrollFactor(0);
        
        // Title - shorter to avoid overlap
        this.add.text(400, 35, 'SHIP HANGAR', {
            fontSize: '28px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);
        
        // SpaceBux display with background box (top right)
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
        
        // Back button (now says "Return to Hangar")
        this.createBackButton();
        
        // Create permanent top bar overlay to prevent ship overlap
        this.createTopBarOverlay();
        
        // Load ship data and calculate scroll bounds
        const shipsData = this.cache.json.get('shipsData');
        if (shipsData && shipsData.ships) {
            // Calculate required scroll based on number of ships
            const cols = 3;
            const itemHeight = 240;
            const rows = Math.ceil(shipsData.ships.length / cols);
            const startY = 180; // Start lower on screen
            const totalHeight = startY + (rows * itemHeight) + 100; // Extra padding at bottom
            const viewHeight = 600;
            
            // Calculate max scroll needed
            this.maxScroll = Math.max(0, totalHeight - viewHeight);
            
            // Set up camera bounds for scrolling
            this.cameras.main.setBounds(0, 0, 800, totalHeight);
            
            this.createShipGrid(shipsData.ships);
        } else {
            this.maxScroll = 0;
            this.cameras.main.setBounds(0, 0, 800, 600);
        }
        
        // Create scrollbar after we know the max scroll
        this.createScrollbar();
        
        // Enable mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            this.scrollY += deltaY * 0.5;
            this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
            this.cameras.main.scrollY = this.scrollY;
            this.updateScrollbar();
            this.updateShipFade();
        });
    }
    
    update() {
        // Continuously update ship fade based on scroll position
        // This ensures smooth fading even during drag operations
        if (this.shipContainers.length > 0) {
            this.updateShipFade();
        }
    }
    
    createTopBarOverlay() {
        // Create a solid bar at the top to cover ships that scroll underneath
        const topBar = this.add.graphics();
        topBar.fillStyle(0x0a0a1a, 1); // Solid dark background
        topBar.fillRect(0, 0, 800, 75); // Cover the top 75px
        topBar.setScrollFactor(0);
        topBar.setDepth(999); // Just below the UI elements but above ships
    }
    
    createScrollbar() {
        const scrollbarX = 770; // Moved left to accommodate wider scrollbar
        const scrollbarY = 80;
        const scrollbarWidth = 30; // 3x wider (was 10, now 30)
        const scrollbarHeight = 510;
        
        // Scrollbar background track
        this.scrollbarBg = this.add.graphics();
        this.scrollbarBg.fillStyle(0x1a1a2e, 0.7);
        this.scrollbarBg.fillRoundedRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 8);
        this.scrollbarBg.setScrollFactor(0);
        this.scrollbarBg.setDepth(50);
        
        // Scrollbar thumb (draggable)
        this.scrollbarThumb = this.add.graphics();
        this.scrollbarThumb.setScrollFactor(0);
        this.scrollbarThumb.setDepth(51);
        
        // Create interactive zone for the scrollbar thumb
        this.scrollbarZone = this.add.zone(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);
        this.scrollbarZone.setOrigin(0, 0);
        this.scrollbarZone.setScrollFactor(0);
        this.scrollbarZone.setDepth(52);
        this.scrollbarZone.setInteractive({ useHandCursor: true, draggable: true });
        
        // Store scrollbar dimensions
        this.scrollbarData = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarWidth,
            height: scrollbarHeight,
            thumbHeight: 0,
            thumbY: scrollbarY
        };
        
        // Scrollbar drag handlers
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
        
        // Calculate which part of scrollbar was clicked
        const relativeY = clickY - scrollbarY;
        const scrollProgress = Phaser.Math.Clamp(relativeY / scrollbarHeight, 0, 1);
        
        this.scrollY = scrollProgress * this.maxScroll;
        this.cameras.main.scrollY = this.scrollY;
        this.updateScrollbar();
        this.updateShipFade();
    }
    
    handleScrollbarDrag(pointer) {
        const scrollbarY = this.scrollbarData.y;
        const scrollbarHeight = this.scrollbarData.height;
        const pointerY = pointer.y;
        
        // Calculate scroll position based on drag
        const relativeY = pointerY - scrollbarY;
        const scrollProgress = Phaser.Math.Clamp(relativeY / scrollbarHeight, 0, 1);
        
        this.scrollY = scrollProgress * this.maxScroll;
        this.cameras.main.scrollY = this.scrollY;
        this.updateScrollbar();
        this.updateShipFade();
    }
    
    updateScrollbar() {
        if (!this.scrollbarThumb || this.maxScroll <= 0) {
            // Hide scrollbar if no scrolling needed
            if (this.scrollbarThumb) this.scrollbarThumb.clear();
            if (this.scrollbarBg) this.scrollbarBg.clear();
            if (this.scrollbarZone) this.scrollbarZone.disableInteractive();
            return;
        }
        
        this.scrollbarThumb.clear();
        
        const scrollbarHeight = this.scrollbarData.height;
        const viewHeight = 600;
        const contentHeight = viewHeight + this.maxScroll;
        
        // Calculate thumb size based on content ratio
        const thumbHeight = Math.max(40, (viewHeight / contentHeight) * scrollbarHeight);
        
        // Calculate thumb position based on scroll progress
        const scrollProgress = this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0;
        const thumbY = this.scrollbarData.y + scrollProgress * (scrollbarHeight - thumbHeight);
        
        // Store for drag calculations
        this.scrollbarData.thumbHeight = thumbHeight;
        this.scrollbarData.thumbY = thumbY;
        
        // Draw the thumb with rounded corners matching the width
        this.scrollbarThumb.fillStyle(0x00ffff, 0.8);
        this.scrollbarThumb.fillRoundedRect(this.scrollbarData.x, thumbY, this.scrollbarData.width, thumbHeight, 8);
    }
    
    createShipGrid(ships) {
        const cols = 3;  // 3 ships per row
        const itemWidth = 200;
        const itemHeight = 240;
        const gridWidth = cols * itemWidth;
        const startX = (800 - gridWidth) / 2 + itemWidth / 2;  // Center the grid
        const startY = 180;  // Start lower on screen (was 140)
        
        ships.forEach((ship, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * itemWidth;
            const y = startY + row * itemHeight;
            
            this.createShipItem(ship, x, y);
        });
        
        // Initial fade update
        this.updateShipFade();
    }
    
    updateShipFade() {
        const fadeStartY = 100; // Start fading when ships get this close to top
        const fadeEndY = 70;    // Fully transparent at this Y position
        
        this.shipContainers.forEach(container => {
            // Get the container's screen position (accounting for camera scroll)
            const screenY = container.y - this.cameras.main.scrollY;
            
            if (screenY < fadeStartY) {
                // Calculate fade based on position
                const fadeProgress = Phaser.Math.Clamp((fadeStartY - screenY) / (fadeStartY - fadeEndY), 0, 1);
                const alpha = 1 - fadeProgress;
                container.setAlpha(alpha);
            } else {
                container.setAlpha(1);
            }
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
        
        // Ship image - scale to fit within card (max 140px wide, 120px tall)
        if (this.textures.exists(shipKey)) {
            const shipImage = this.add.image(0, -30, shipKey);
            
            // Get the actual dimensions of the ship texture
            const shipWidth = shipImage.width;
            const shipHeight = shipImage.height;
            
            // Calculate scale to fit within 140x120 area (leaving some margin)
            const maxWidth = 140;
            const maxHeight = 120;
            const scaleX = maxWidth / shipWidth;
            const scaleY = maxHeight / shipHeight;
            const finalScale = Math.min(scaleX, scaleY);
            
            shipImage.setScale(finalScale);
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
            this.showShipDetail(ship);
        });
        
        // Track this container for fade effects
        this.shipContainers.push(container);
    }
    
    showShipDetail(ship) {
        // Clear any existing detail elements
        this.detailElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.detailElements = [];
        
        // Create a semi-transparent overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, 800, 600);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 800, 600), Phaser.Geom.Rectangle.Contains);
        overlay.setDepth(100);
        overlay.setScrollFactor(0);
        this.detailElements.push(overlay);
        
        // Create detail panel below the top bar (starts at y=85 to clear 75px top bar)
        const topBarHeight = 75;
        const panelWidth = 650;
        const availableHeight = 600 - topBarHeight - 20; // 20px margin at bottom
        const panelHeight = Math.min(480, availableHeight); // Max 480px or fit available space
        const panelX = (800 - panelWidth) / 2;
        const panelY = topBarHeight + (availableHeight - panelHeight) / 2; // Center in available space
        
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 1);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
        panel.lineStyle(4, 0x00ffff, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
        panel.setDepth(101);
        panel.setScrollFactor(0);
        this.detailElements.push(panel);
        
        // Determine the texture key
        let shipKey;
        if (ship.isDefault) {
            shipKey = 'player-ship-0';
        } else {
            shipKey = `shop-ship-${ship.id}`;
        }
        
        // Ship image on the left - scaled to fit available space
        let shipImage;
        if (this.textures.exists(shipKey)) {
            shipImage = this.add.image(panelX + 180, panelY + panelHeight / 2, shipKey);
            
            // Get the actual dimensions of the ship texture
            const shipWidth = shipImage.width;
            const shipHeight = shipImage.height;
            
            // Calculate scale to fit within the left area (max 280px wide, adjust height to panel)
            const maxWidth = 280;
            const maxHeight = panelHeight - 120; // Leave room for margins
            const scaleX = maxWidth / shipWidth;
            const scaleY = maxHeight / shipHeight;
            const finalScale = Math.min(scaleX, scaleY);
            
            shipImage.setScale(finalScale);
            shipImage.setDepth(102);
            shipImage.setScrollFactor(0);
            this.detailElements.push(shipImage);
        }
        
        // Ship name/title
        const titleText = this.add.text(panelX + 340, panelY + 50, ship.name, {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            align: 'left',
            wordWrap: { width: 280 }
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(titleText);
        
        // Ship description
        const descText = this.add.text(panelX + 340, panelY + 110, ship.description, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'left',
            wordWrap: { width: 280 }
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(descText);
        
        // Ship stats (if available)
        let statsY = panelY + 200;
        if (ship.stats) {
            const statsTitle = this.add.text(panelX + 340, statsY, 'STATS:', {
                fontSize: '16px',
                fill: '#ffff00',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(statsTitle);
            
            statsY += 25;
            const speedText = this.add.text(panelX + 340, statsY, `Speed: ${ship.stats.speed}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(speedText);
            
            statsY += 22;
            const armorText = this.add.text(panelX + 340, statsY, `Armor: ${ship.stats.armor}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(armorText);
            
            statsY += 22;
            const firePowerText = this.add.text(panelX + 340, statsY, `Firepower: ${ship.stats.firepower}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Courier New'
            }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
            this.detailElements.push(firePowerText);
        }
        
        // Cost display - position dynamically based on panel height
        const costText = this.add.text(panelX + 340, panelY + panelHeight - 130, `Cost: ${ship.cost.toLocaleString()} SpaceBux`, {
            fontSize: '22px',
            fill: '#ffff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(102).setScrollFactor(0);
        this.detailElements.push(costText);
        
        // Check if owned
        if (!window.gameState.ownedShips) {
            window.gameState.ownedShips = ['default'];
        }
        const owned = window.gameState.ownedShips.includes(ship.id);
        const isEquipped = window.gameState.currentShip === ship.id;
        
        // Buttons at bottom
        const buttonY = panelY + panelHeight - 70;
        const buttonWidth = 140;
        const buttonHeight = 50;
        const buttonSpacing = 30;
        
        // Close button (always visible)
        const closeButton = this.createButton(panelX + panelWidth/2 - buttonWidth - buttonSpacing/2, buttonY, buttonWidth, buttonHeight, 'Close', 103);
        this.detailElements.push(closeButton);
        closeButton.on('pointerdown', () => {
            this.closeShipDetail();
        });
        
        // Purchase or Equip button
        let actionButton = null;
        if (owned) {
            if (!isEquipped) {
                actionButton = this.createButton(panelX + panelWidth/2 + buttonSpacing/2, buttonY, buttonWidth, buttonHeight, 'Equip', 103);
                this.detailElements.push(actionButton);
                actionButton.on('pointerdown', () => {
                    window.gameState.currentShip = ship.id;
                    window.saveProgress();
                    this.showMessage('Ship equipped!');
                    this.closeShipDetail();
                });
            } else {
                // Already equipped - show status
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
                if (window.gameState.spaceBux >= ship.cost) {
                    window.gameState.spaceBux -= ship.cost;
                    window.gameState.ownedShips.push(ship.id);
                    window.gameState.currentShip = ship.id;
                    window.saveProgress();
                    this.spaceBuxText.setText(`SpaceBux: ${window.gameState.spaceBux}`);
                    this.showMessage('Ship purchased and equipped!');
                    this.closeShipDetail();
                    this.scene.restart();
                } else {
                    this.showMessage('Not enough SpaceBux!');
                }
            });
        }
    }
    
    closeShipDetail() {
        // Destroy all detail elements
        this.detailElements.forEach(element => {
            if (element && element.destroyButton) {
                // Custom destroy for buttons
                element.destroyButton();
            } else if (element && element.destroy) {
                element.destroy();
            }
        });
        this.detailElements = [];
    }
    
    createButton(x, y, width, height, text, depth) {
        // Create a graphics object for the button background
        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeRoundedRect(x, y, width, height, 8);
        bg.setDepth(depth);
        bg.setScrollFactor(0);
        
        // Create button text
        const buttonText = this.add.text(x + width / 2, y + height / 2, text, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        buttonText.setDepth(depth + 1);
        buttonText.setScrollFactor(0);
        
        // Create an invisible interactive zone that covers the entire button
        const hitZone = this.add.zone(x, y, width, height);
        hitZone.setOrigin(0, 0);
        hitZone.setInteractive({ useHandCursor: true });
        hitZone.setDepth(depth);
        hitZone.setScrollFactor(0);
        
        // Store references for cleanup and interaction
        hitZone.setData('bg', bg);
        hitZone.setData('text', buttonText);
        hitZone.setData('x', x);
        hitZone.setData('y', y);
        hitZone.setData('width', width);
        hitZone.setData('height', height);
        
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
        
        // Custom destroy method to clean up all parts
        hitZone.destroyButton = function() {
            bg.destroy();
            buttonText.destroy();
            hitZone.destroy();
        };
        
        return hitZone;
    }
    
    selectShip(ship) {
        // This method is no longer used - replaced by showShipDetail
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
