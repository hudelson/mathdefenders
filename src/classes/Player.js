// Player class - Represents the player's ship
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Track damage separately (10 HP total, 1 damage per hit)
        this.damageAccumulated = 0;
        
        // Determine which ship to use based on equipped ship in gameState
        // Default ship uses 'default', shop ships use their ID (blue_fancy, cyber, etc.)
        this.shipId = window.gameState?.currentShip || 'default';
        
        // Build the initial texture key
        const initialTextureKey = `player-ship-${this.shipId}-0`;
        
        console.log('Player constructor - shipId:', this.shipId, 'textureKey:', initialTextureKey);
        
        // Create player sprite (use damage level 0 by default)
        this.sprite = scene.physics.add.sprite(x, y, initialTextureKey);
    // Flip vertically so ship points upward
    this.sprite.setFlipY(true);
    // Increase size by 50%
    this.sprite.setDisplaySize(144, 144);
        this.sprite.setImmovable(true);
        
        // Set up physics body
        this.sprite.body.setSize(40, 40);
        this.sprite.body.setCollideWorldBounds(true);
        
        console.log('Player created at:', x, y);

    // Ensure correct texture based on current progress (wrongs)
    this.updateTextureByProgress();

    // Add desynced, randomized sway and bob
    const ampX = Phaser.Math.Between(12, 28);
    const durX = Phaser.Math.Between(1600, 2600);
    const delayX = Phaser.Math.Between(0, 1200);
    this.addSway(x, ampX, durX, delayX);
    const ampY = Phaser.Math.Between(4, 10);
    const durY = Phaser.Math.Between(1400, 2200);
    const delayY = Phaser.Math.Between(0, 900);
    this.addBob(this.y, ampY, durY, delayY);
    }

    // Method to update player (for future movement controls)
    update() {
        // Currently static, but can add movement later
    }

    // Method to handle taking damage
    takeDamage(amount) {
        console.log(`Player takes ${amount} damage`);
        
        // Accumulate damage for this ship
        this.damageAccumulated += amount;
        
        // Flash red when taking damage
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });

        this.updateTextureByProgress();

        // Play destroyed animation once when fully destroyed (10 damage)
        if (this.damageAccumulated >= 10 && !this._destroyAnimPlayed) {
            this._destroyAnimPlayed = true;
            this.playDestroyedAnimation();
        }
    }

    // Method to heal player
    heal(amount) {
        console.log(`Player healed for ${amount} HP`);
        
        // Flash green when healing
        this.sprite.setTint(0x00ff00);
        this.scene.time.delayedCall(300, () => {
            this.sprite.clearTint();
        });

    this.updateTextureByProgress();
    }

    // Method to destroy the player (cleanup)
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    // Choose the texture variant based on accumulated damage to this ship
    // 0-3 damage = image 0, 4-6 damage = image 1, 7-9 damage = image 2, 10 damage = image 3
    updateTextureByProgress() {
        const damage = this.damageAccumulated;
        let idx = 0;
        if (damage >= 10) idx = 3;
        else if (damage >= 7) idx = 2;
        else if (damage >= 4) idx = 1;
        else idx = 0;
        
        const textureKey = `player-ship-${this.shipId}-${idx}`;
        if (this.scene.textures.exists(textureKey)) {
            this.sprite.setTexture(textureKey);
        }
    }

    playDestroyedAnimation() {
        // Quick scale pop + fade flash
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: this.sprite.scaleX * 1.15,
            scaleY: this.sprite.scaleY * 1.15,
            duration: 150,
            yoyo: true,
            onStart: () => this.sprite.setTint(0xffffff),
            onYoyo: () => this.sprite.clearTint()
        });
    }

    addSway(originX, amplitude = 16, duration = 2000, delay = 0) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: originX + amplitude,
            duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay
        });
    }

    addBob(originY, amplitude = 6, duration = 1800, delay = 0) {
        this.scene.tweens.add({
            targets: this.sprite,
            y: originY + amplitude,
            duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay
        });
    }
}