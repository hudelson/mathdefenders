// Enemy class - Represents the enemy ship
class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Create enemy sprite
        this.sprite = scene.physics.add.sprite(x, y, 'enemy-ship');
        this.sprite.setDisplaySize(48, 48);
        this.sprite.setImmovable(true);
        
        // Set up physics body
        this.sprite.body.setSize(40, 40);
        
        console.log('Enemy created at:', x, y);
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
}