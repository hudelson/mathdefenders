// Game Scene - Main gameplay
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.enemy = null;
        this.equationBlocks = null;
        this.currentEquation = null;
        this.playerInput = '';
        this.isProcessingEquation = false;
    }

    create() {
        console.log('Game: Scene created');
        
        // Initialize flags
        this.collisionHandled = false;
        
        // Add background
        this.add.image(400, 300, 'space-background');
        
        // Create player and enemy
        this.player = new Player(this, 400, 500);
        this.enemy = new Enemy(this, 400, 100);
        
        // Create equation blocks group
        this.equationBlocks = this.physics.add.group();
        
        // Set up input handling
        this.setupInput();
        
        // Start the UI scene
        this.scene.launch('UIScene');
        
        // Generate first equation after short delay
        this.time.delayedCall(2000, () => {
            this.generateNewEquation();
        });
        
        console.log(`Game: Level ${window.gameState.currentLevel} started in ${window.gameState.gameMode} mode`);
    }

    update() {
        // Update all equation blocks (to ensure text follows sprites)
        if (this.equationBlocks) {
            this.equationBlocks.children.entries.forEach(blockSprite => {
                if (blockSprite.equationBlock) {
                    blockSprite.equationBlock.update();
                }
                
                // Check if block has gone past the player (collision detection backup)
                if (blockSprite.y > this.player.sprite.y + 50) {
                    // Block missed player, trigger collision anyway if we're processing wrong answer
                    if (this.isProcessingEquation && blockSprite.body.velocity.y > 100) {
                        this.handleBlockCollision(blockSprite);
                        return;
                    }
                }
            });
        }
        
        // Check collision between equation blocks and player
        if (this.equationBlocks && this.player && !this.collisionHandled) {
            this.physics.overlap(this.equationBlocks, this.player.sprite, (playerSprite, blockSprite) => {
                this.handleBlockCollision(blockSprite);
            });
        }
        
        // Check win/loss conditions
        this.checkGameConditions();
    }

    setupInput() {
        // Keyboard input for numbers and backspace
        this.input.keyboard.on('keydown', (event) => {
            this.handleKeyInput(event.key);
        });
    }

    handleKeyInput(key) {
        if (this.isProcessingEquation) return;
        
        if (key >= '0' && key <= '9') {
            // Don't allow input longer than the answer
            if (this.playerInput.length >= this.answerLength) return;
            
            this.playerInput += key;
            // Update the equation blocks to show the input
            this.updateAnswerBlanks();
            // Update UI
            this.scene.get('UIScene').updatePlayerInput(this.playerInput);
            // Then check answer (which might lock input)
            this.checkAnswer();
        } else if (key === 'Backspace' && this.playerInput.length > 0) {
            this.playerInput = this.playerInput.slice(0, -1);
            // Update the equation blocks to show the input
            this.updateAnswerBlanks();
            // Update UI
            this.scene.get('UIScene').updatePlayerInput(this.playerInput);
        }
    }

    updateAnswerBlanks() {
        if (!this.equationBlocks || this.answerStartIndex === undefined) return;
        
        const blocks = this.equationBlocks.children.entries;
        
        for (let i = 0; i < this.answerLength; i++) {
            const blockIndex = this.answerStartIndex + i;
            if (blockIndex < blocks.length) {
                const blockSprite = blocks[blockIndex];
                if (blockSprite.equationBlock) {
                    const char = i < this.playerInput.length ? this.playerInput[i] : '_';
                    blockSprite.equationBlock.updateText(char);
                }
            }
        }
    }

    generateNewEquation() {
        if (this.isProcessingEquation) return;
        
        // Reset collision handling
        this.collisionHandled = false;
        
        // Clear any existing wrong answer timer
        if (this.wrongAnswerTimer) {
            this.wrongAnswerTimer.destroy();
            this.wrongAnswerTimer = null;
        }
        
        const level = window.gameState.currentLevel;
        const mode = window.gameState.gameMode;
        
        this.currentEquation = this.createEquation(level, mode);
        this.playerInput = '';
        
        // Create visual equation blocks
        this.createEquationBlocks(this.currentEquation);
        
        console.log(`Generated equation: ${this.currentEquation.display} = ${this.currentEquation.answer}`);
    }

    createEquation(level, mode) {
        let num1, num2, answer, operator, display;
        let isSpecial = Math.random() < 0.15; // 15% chance for special equation
        let specialType = null;
        
        if (isSpecial) {
            const rand = Math.random();
            if (rand < 0.33) specialType = 'red';      // Double damage
            else if (rand < 0.66) specialType = 'green'; // Heal player
            else specialType = 'gold';                   // Bonus SpaceBux
        }
        
        switch (mode) {
            case 'addition':
                num1 = Phaser.Math.Between(1, 10 + level);
                num2 = Phaser.Math.Between(1, 10 + level);
                answer = num1 + num2;
                operator = '+';
                break;
                
            case 'subtraction':
                num1 = Phaser.Math.Between(10 + level, 20 + level);
                num2 = Phaser.Math.Between(1, num1); // Ensure positive result
                answer = num1 - num2;
                operator = '-';
                break;
                
            case 'multiplication':
                num1 = Phaser.Math.Between(1, Math.min(12, 2 + level));
                num2 = Phaser.Math.Between(1, level > 10 ? 15 : 12);
                answer = num1 * num2;
                operator = '×';
                break;
                
            case 'division':
                // Generate backwards: a * b = c, then c / a = b
                num2 = Phaser.Math.Between(1, Math.min(12, 2 + level));
                answer = Phaser.Math.Between(1, level > 10 ? 15 : 12);
                num1 = num2 * answer;
                operator = '÷';
                break;
        }
        
        display = `${num1} ${operator} ${num2}`;
        
        return {
            num1,
            num2,
            answer,
            operator,
            display,
            specialType,
            isSpecial
        };
    }

    createEquationBlocks(equation) {
        // Clear existing blocks
        this.equationBlocks.clear(true, true);
        
        const blockTexture = equation.specialType ? 
            `equation-block-${equation.specialType}` : 'equation-block';
        
        // Create the equation parts: "5 × 3 = ???"
        const parts = equation.display.split(' '); // ['5', '×', '3']
        const equationParts = [...parts, '='];
        
        // Calculate answer length for blanks
        const answerLength = equation.answer.toString().length;
        const answerBlanks = Array(answerLength).fill('_');
        
        const allParts = [...equationParts, ...answerBlanks];
        const startX = 400 - ((allParts.length - 1) * 20);
        
        allParts.forEach((char, index) => {
            const x = startX + (index * 40);
            const y = 120;
            
            // Determine if this is an answer blank
            const isAnswerBlank = index >= equationParts.length;
            
            const block = new EquationBlock(this, x, y, blockTexture, char, isAnswerBlank);
            
            // Store reference to the EquationBlock object in the sprite
            block.sprite.equationBlock = block;
            
            this.equationBlocks.add(block.sprite);
            
            // Set velocity to move downward
            block.setVelocityY(50 + (window.gameState.currentLevel * 2));
        });
        
        // Store answer blank positions for updating
        this.answerStartIndex = equationParts.length;
        this.answerLength = answerLength;
        
        // Initialize answer blanks display
        this.updateAnswerBlanks();
        
        console.log(`Created equation: ${equation.display} = ${'_'.repeat(answerLength)}`);
    }

    checkAnswer() {
        if (!this.currentEquation || this.isProcessingEquation) return;
        
        const inputAnswer = parseInt(this.playerInput);
        if (inputAnswer === this.currentEquation.answer) {
            this.handleCorrectAnswer();
        } else if (this.playerInput.length > 0 && !isNaN(inputAnswer)) {
            // Check if this could still be a partial correct answer
            const correctAnswerStr = this.currentEquation.answer.toString();
            const isPartialMatch = correctAnswerStr.startsWith(this.playerInput);
            
            if (!isPartialMatch) {
                // Wrong answer - trigger immediate collision
                this.handleWrongAnswer();
            }
        }
    }

    handleWrongAnswer() {
        console.log('Wrong answer! Rocketing blocks at player...');
        this.isProcessingEquation = true;
        
        // Speed up blocks significantly toward player
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.setVelocityY(300 + (window.gameState.currentLevel * 15)); // Much faster
            blockSprite.setTint(0xff0000); // Flash red immediately
            
            // Also tint the EquationBlock if it exists
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.setTint(0xff0000);
            }
        });
        
        // Lock out further input
        this.playerInput = '';
        this.scene.get('UIScene').updatePlayerInput('WRONG!');
        
        // Set up a timer to force collision if physics doesn't detect it
        this.wrongAnswerTimer = this.time.delayedCall(1000, () => {
            if (!this.collisionHandled) {
                console.log('Force triggering collision after wrong answer');
                this.handleBlockCollision(this.equationBlocks.children.entries[0]);
            }
        });
    }

    handleCorrectAnswer() {
        console.log('Correct answer!');
        this.isProcessingEquation = true;
        
        // Reverse block direction and speed them up
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.setVelocityY(-150); // Move back toward enemy
            blockSprite.setTint(0x00ff00); // Flash green
            
            // Also tint the EquationBlock if it exists
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.setTint(0x00ff00);
            }
        });
        
        // Deal damage to enemy after blocks reach it
        this.time.delayedCall(1000, () => {
            this.dealDamageToEnemy();
            this.clearEquationBlocks();
            
            // Generate next equation after delay
            this.time.delayedCall(1500, () => {
                this.isProcessingEquation = false;
                this.generateNewEquation();
            });
        });
        
        this.playerInput = '';
        this.scene.get('UIScene').updatePlayerInput('');
    }

    handleBlockCollision(blockSprite) {
        // Prevent multiple collision triggers
        if (this.collisionHandled) return;
        
        console.log('Block collision with player!');
        this.collisionHandled = true;
        this.isProcessingEquation = true;
        
        // Stop all blocks immediately
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.setVelocity(0, 0);
            blockSprite.setTint(0xff0000);
            
            // Also tint the EquationBlock if it exists
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.setTint(0xff0000);
            }
        });
        
        // Show damage feedback
        this.scene.get('UIScene').updatePlayerInput('HIT!');
        
        // Deal damage to player
        this.dealDamageToPlayer();
        
        // Add screen shake for impact
        this.cameras.main.shake(200, 0.02);
        
        // Clear blocks and generate new equation
        this.time.delayedCall(800, () => {
            this.clearEquationBlocks();
            
            this.time.delayedCall(1200, () => {
                this.collisionHandled = false;
                this.isProcessingEquation = false;
                if (window.gameState.playerHP > 0) {
                    this.generateNewEquation();
                }
            });
        });
        
        this.playerInput = '';
    }

    clearEquationBlocks() {
        // Properly destroy EquationBlock objects including their text
        this.equationBlocks.children.entries.forEach(blockSprite => {
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.destroy();
            }
        });
        this.equationBlocks.clear(true, true);
    }

    dealDamageToEnemy() {
        const baseDamage = 20;
        let damage = baseDamage;
        
        if (this.currentEquation.specialType === 'red') {
            damage *= 2; // Double damage
        }
        
        window.gameState.enemyHP = Math.max(0, window.gameState.enemyHP - damage);
        
        if (this.currentEquation.specialType === 'green') {
            // Heal player
            window.gameState.playerHP = Math.min(100, window.gameState.playerHP + 15);
        } else if (this.currentEquation.specialType === 'gold') {
            // Award bonus SpaceBux
            const bonus = window.gameState.currentLevel * 10;
            window.gameState.spaceBux += bonus;
        }
        
        console.log(`Enemy takes ${damage} damage. HP: ${window.gameState.enemyHP}`);
    }

    dealDamageToPlayer() {
        const damage = 15;
        window.gameState.playerHP = Math.max(0, window.gameState.playerHP - damage);
        console.log(`Player takes ${damage} damage. HP: ${window.gameState.playerHP}`);
        
        // Visual feedback for player damage
        if (this.player) {
            this.player.takeDamage(damage);
        }
    }

    checkGameConditions() {
        if (window.gameState.enemyHP <= 0) {
            this.handleLevelWin();
        } else if (window.gameState.playerHP <= 0) {
            this.handleGameOver();
        }
    }

    handleLevelWin() {
        console.log('Level completed!');
        
        // Award SpaceBux
        const levelBonus = 50 * window.gameState.currentLevel;
        window.gameState.spaceBux += levelBonus;
        
        // Update highest level
        const currentMode = window.gameState.gameMode;
        if (window.gameState.currentLevel >= window.gameState.highestLevels[currentMode]) {
            window.gameState.highestLevels[currentMode] = window.gameState.currentLevel + 1;
            window.saveProgress();
        }
        
        // Stop UI scene and return to level select
        this.scene.stop('UIScene');
        this.scene.start('LevelSelectScene');
    }

    handleGameOver() {
        console.log('Game Over!');
        
        // Stop UI scene and return to main menu
        this.scene.stop('UIScene');
        this.scene.start('MainMenuScene');
    }
}