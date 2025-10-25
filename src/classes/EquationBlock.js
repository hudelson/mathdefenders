// EquationBlock class - Represents individual blocks in an equation
class EquationBlock {
    constructor(scene, x, y, texture, character, isAnswerBlank = false) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.character = character;
        this.isAnswerBlank = isAnswerBlank;
        
        // Create the block sprite
        this.sprite = scene.physics.add.sprite(x, y, texture);
        this.sprite.setDisplaySize(32, 32);
        
        // Add the character text on top of the block
        const textColor = isAnswerBlank ? '#666666' : '#000000';
        this.text = scene.add.text(x, y, character, {
            fontSize: '18px',
            fill: textColor,
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Set up physics
        this.sprite.body.setSize(28, 28);
        
        // Ensure collision detection works properly
        this.sprite.body.setCollideWorldBounds(false);
        
        // Make text follow sprite
        this.updateTextPosition();
        
        console.log(`EquationBlock created: ${character} at (${x}, ${y}) ${isAnswerBlank ? '(answer blank)' : ''}`);
    }

    // Update text position to follow sprite
    updateTextPosition() {
        if (this.text && this.sprite) {
            this.text.setPosition(this.sprite.x, this.sprite.y);
        }
    }

    // Method called every frame to update the block
    update() {
        this.updateTextPosition();
    }

    // Method to set the block's velocity
    setVelocity(x, y) {
        if (this.sprite && this.sprite.body) {
            this.sprite.setVelocity(x, y);
        }
    }

    // Method to set only Y velocity (commonly used)
    setVelocityY(y) {
        if (this.sprite && this.sprite.body) {
            this.sprite.setVelocityY(y);
        }
    }

    // Method to set the block's tint (color effect)
    setTint(color) {
        if (this.sprite) {
            this.sprite.setTint(color);
        }
    }

    // Method to clear the tint
    clearTint() {
        if (this.sprite) {
            this.sprite.clearTint();
        }
    }

    // Method to animate the block (e.g., flash effect)
    flash(color, duration = 200) {
        this.setTint(color);
        this.scene.time.delayedCall(duration, () => {
            this.clearTint();
        });
    }

    // Method to create a pulse animation
    pulse() {
        this.scene.tweens.add({
            targets: [this.sprite, this.text],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // Method to update the text content (for answer blanks)
    updateText(newText) {
        if (this.text) {
            this.text.setText(newText);
            // Make filled-in answers more visible
            if (newText !== '_' && this.isAnswerBlank) {
                this.text.setStyle({ fill: '#000000' });
            }
        }
    }

    // Method to destroy the block (cleanup)
    destroy() {
        if (this.text) {
            this.text.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}