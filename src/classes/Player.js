// Player class - Represents the player's ship
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Create player sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player-ship');
        this.sprite.setDisplaySize(48, 48);
        this.sprite.setImmovable(true);
        
        // Set up physics body
        this.sprite.body.setSize(40, 40);
        this.sprite.body.setCollideWorldBounds(true);
        
        console.log('Player created at:', x, y);
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
    }

    // Method to heal player
    heal(amount) {
        console.log(`Player healed for ${amount} HP`);
        
        // Flash green when healing
        this.sprite.setTint(0x00ff00);
        this.scene.time.delayedCall(300, () => {
            this.sprite.clearTint();
        });
    }

    // Method to destroy the player (cleanup)
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}