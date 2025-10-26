// Enemy class - Represents the enemy ship
class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Create enemy sprite (use damage level 0 by default)
        this.sprite = scene.physics.add.sprite(x, y, 'enemy-ship-0');
        // Increase size by 50%
        this.sprite.setDisplaySize(192, 192);
        this.sprite.setImmovable(true);
        
        // Set up physics body
        this.sprite.body.setSize(40, 40);
        
        console.log('Enemy created at:', x, y);

        // Ensure correct texture based on current progress (corrects)
        this.updateTextureByProgress();

        // Add gentle horizontal sway
        this.addSway(x, 28, 2200);
    }

    // Method to update enemy (for future behaviors)
    update() {
        // Currently static, but can add animations or movement later
    }

    // Method to handle taking damage
    takeDamage(amount) {
        console.log(`Enemy takes ${amount} damage`);
        
        // Flash red when taking damage
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });
        
        // Add screen shake effect for impact
        this.scene.cameras.main.shake(100, 0.01);

        this.updateTextureByProgress();

        // Play destroyed animation once when correct answers reach target
        const correct = this.scene?.correctCount ?? 0;
        const target = this.scene?.targetCorrect ?? 10;
        if (correct >= target && !this._destroyAnimPlayed) {
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

    // Choose the texture variant based on correct answers progress (10 to win)
    updateTextureByProgress() {
        const correct = this.scene?.correctCount ?? 0;
        const target = this.scene?.targetCorrect ?? 10;
        const pct = Math.max(0, 100 - (correct / target) * 100);
        let idx = 0;
        if (pct > 75) idx = 0;
        else if (pct > 50) idx = 1;
        else if (pct > 25) idx = 2;
        else idx = 3;
        if (this.scene.textures.exists(`enemy-ship-${idx}`)) {
            this.sprite.setTexture(`enemy-ship-${idx}`);
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

    addSway(originX, amplitude = 24, duration = 2200) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: originX + amplitude,
            duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}