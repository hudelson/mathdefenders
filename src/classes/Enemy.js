// Enemy class - Represents the enemy ship
class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Track damage separately (10 HP total, 1 damage per hit)
        this.damageAccumulated = 0;
        
        // Determine enemy variant based on game mode
        // addition=1, subtraction=2, multiplication=3, division=4
        const modeMap = { addition: 1, subtraction: 2, multiplication: 3, division: 4 };
        const mode = window.gameState?.gameMode || 'multiplication';
        this.variant = modeMap[mode] || 3;
        
        // Create enemy sprite (use damage level 0 by default)
        this.sprite = scene.physics.add.sprite(x, y, `enemy-ship-${this.variant}-0`);
        // Increase size by 50%
        this.sprite.setDisplaySize(192, 192);
        this.sprite.setImmovable(true);
        
        // Set up physics body
        this.sprite.body.setSize(40, 40);
        
        console.log('Enemy created at:', x, y);

        // Ensure correct texture based on current progress (corrects)
    this.updateTextureByProgress();

    // Add desynced, randomized sway and bob
    const ampX = Phaser.Math.Between(18, 36);
    const durX = Phaser.Math.Between(1700, 2800);
    const delayX = Phaser.Math.Between(0, 1300);
    this.addSway(x, ampX, durX, delayX);
    const ampY = Phaser.Math.Between(6, 14);
    const durY = Phaser.Math.Between(1500, 2400);
    const delayY = Phaser.Math.Between(0, 1000);
    this.addBob(this.y, ampY, durY, delayY);
    }

    // Method to update enemy (for future behaviors)
    update() {
        // Currently static, but can add animations or movement later
    }

    // Method to handle taking damage
    takeDamage(amount) {
        console.log(`Enemy takes ${amount} damage`);
        
        // Accumulate damage for this ship
        this.damageAccumulated += amount;
        
        // Flash red when taking damage
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });
        
        // Add screen shake effect for impact
        this.scene.cameras.main.shake(100, 0.01);

        this.updateTextureByProgress();

        // Play destroyed animation once when fully destroyed (10 damage)
        if (this.damageAccumulated >= 10 && !this._destroyAnimPlayed) {
            this._destroyAnimPlayed = true;
            this.playDestroyedAnimation();
        }
    }

    // Method to animate equation launching
    launchEquation() {
        // Animate enemy slightly when launching equations
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // Method to destroy the enemy (cleanup)
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
        
        const texKey = `enemy-ship-${this.variant}-${idx}`;
        if (this.scene.textures.exists(texKey)) {
            this.sprite.setTexture(texKey);
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

    addSway(originX, amplitude = 24, duration = 2200, delay = 0) {
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

    addBob(originY, amplitude = 8, duration = 2000, delay = 0) {
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