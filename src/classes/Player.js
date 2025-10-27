// Player class - Represents the player's ship
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
    // Create player sprite (use damage level 0 by default)
    this.sprite = scene.physics.add.sprite(x, y, 'player-ship-0');
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
        
        // Flash red when taking damage
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });

    this.updateTextureByProgress();

        // Play destroyed animation once when HP reaches 0
        const hp = Math.max(0, window.gameState?.playerHP ?? 100);
        if (hp === 0 && !this._destroyAnimPlayed) {
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

    // Choose the texture variant based on player HP. Only show 'destroyed' at 0 HP.
    updateTextureByProgress() {
        const hp = Math.max(0, window.gameState?.playerHP ?? 100);
        let idx = 0;
        if (hp === 0) idx = 3;
        else if (hp > 66) idx = 0;
        else if (hp > 33) idx = 1;
        else idx = 2;
        if (this.scene.textures.exists(`player-ship-${idx}`)) {
            this.sprite.setTexture(`player-ship-${idx}`);
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