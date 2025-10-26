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
        this.showingEndOverlay = false;
        this.correctCount = 0;
        this.targetCorrect = 10; // require 10 correct answers to win
        this.attackTimer = null;
    }

    create() {
        console.log('Game: Scene created');
        
        // Initialize flags
        this.collisionHandled = false;
        this.isProcessingEquation = false;
        this.showingEndOverlay = false;
        this.correctCount = 0;
        this.finalApproach = false;
        this.clearTimers();
        
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
        this.time.delayedCall(1200, () => {
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
                // Home towards enemy if in homing mode (correct answer)
                if (blockSprite.homingToEnemy && this.enemy?.sprite) {
                    const dx = this.enemy.sprite.x - blockSprite.x;
                    const dy = this.enemy.sprite.y - blockSprite.y;
                    const len = Math.max(1, Math.hypot(dx, dy));
                    const speed = 420 + (window.gameState.currentLevel * 10);
                    blockSprite.setVelocity((dx / len) * speed, (dy / len) * speed);
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

            // Trigger final approach convergence near the player
            if (!this.finalApproach && this.equationBlocks.getLength() > 0) {
                const threshold = this.player.sprite.y - 180;
                const anyClose = this.equationBlocks.children.entries.some(b => b.y >= threshold);
                if (anyClose) {
                    this.finalApproach = true;
                    const rocketSpeed = 360 + (window.gameState.currentLevel * 10);
                    this.equationBlocks.children.entries.forEach(blockSprite => {
                        const dx = this.player.sprite.x - blockSprite.x;
                        const dy = this.player.sprite.y - blockSprite.y;
                        const len = Math.max(1, Math.hypot(dx, dy));
                        blockSprite.setVelocity((dx / len) * rocketSpeed, (dy / len) * rocketSpeed);
                    });
                }
            }
        }
        
        // Check collision between equation blocks and player
        if (this.equationBlocks && this.player && !this.collisionHandled) {
            this.physics.overlap(this.equationBlocks, this.player.sprite, (playerSprite, blockSprite) => {
                this.handleBlockCollision(blockSprite);
            });
        }
        // Check collision between blocks and enemy when homing
        if (this.equationBlocks && this.enemy && !this.enemyHitHandled) {
            this.physics.overlap(this.equationBlocks, this.enemy.sprite, (enemySprite, blockSprite) => {
                if (blockSprite.homingToEnemy) {
                    this.handleEnemyHit();
                }
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
        this.enemyHitHandled = false;
        
        // Clear any existing wrong answer timer
        this.clearTimers();
        
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
        this.finalApproach = false;
        
        const blockTexture = equation.specialType ? 
            `equation-block-${equation.specialType}` : 'equation-block';
        
        // Compose equation: display + '=' + answer blanks
        const parts = equation.display.split(' ');
        const equationParts = [...parts, '='];
        const answerLength = equation.answer.toString().length;
        const answerBlanks = Array(answerLength).fill('_');
        const allParts = [...equationParts, ...answerBlanks];
        
        // Staging lineup above the enemy, centered
    const spacing = 40;
    const totalWidth = (allParts.length - 1) * spacing;
    const centerX = this.cameras.main.centerX; // fixed screen center for readability
    const stageY = 150; // fixed near-top row
        
        // Store answer indices for live updates
        this.answerStartIndex = equationParts.length;
        this.answerLength = answerLength;
        this.playerInput = '';
        this.updateAnswerBlanks();
        
        // Sequentially spawn blocks from enemy and tween to staging lineup at screen center
        allParts.forEach((char, index) => {
            this.time.delayedCall(120 * index, () => {
                const isAnswerBlank = index >= this.answerStartIndex;
                const block = new EquationBlock(this, this.enemy.sprite.x, this.enemy.sprite.y, blockTexture, char, isAnswerBlank);
                block.sprite.equationBlock = block;
                this.equationBlocks.add(block.sprite);
                
                const targetX = centerX - (totalWidth / 2) + (index * spacing);
                const targetY = stageY;
                this.tweens.add({
                    targets: block.sprite,
                    x: targetX,
                    y: targetY,
                    duration: 180,
                    ease: 'Sine.easeOut',
                    onUpdate: () => block.updateTextPosition()
                });
                
                // After last block staged, arm a time-limit attack (do not launch immediately)
                if (index === allParts.length - 1) {
                    const timeLimit = Math.max(1500, 4000 - (window.gameState.currentLevel * 150));
                    this.attackTimer = this.time.delayedCall(timeLimit, () => {
                        if (!this.isProcessingEquation && !this.showingEndOverlay) {
                            this.launchBlocksTowardPlayer();
                        }
                    });
                }
            });
        });
        
        console.log(`Created equation: ${equation.display} = ${'_'.repeat(answerLength)} (staging then launch)`);
    }

    launchBlocksTowardPlayer() {
        const speed = 80 + (window.gameState.currentLevel * 3);
        this.equationBlocks.children.entries.forEach(blockSprite => {
            const dx = this.player.sprite.x - blockSprite.x;
            const dy = this.player.sprite.y - blockSprite.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            blockSprite.setVelocity((dx / len) * speed, (dy / len) * speed);
        });
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
        this.clearTimers();
        
        // Speed up blocks significantly toward player (vector toward player center)
        this.equationBlocks.children.entries.forEach(blockSprite => {
            const dx = this.player.sprite.x - blockSprite.x;
            const dy = this.player.sprite.y - blockSprite.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const speed = 360 + (window.gameState.currentLevel * 15);
            blockSprite.setVelocity((dx / len) * speed, (dy / len) * speed);
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
        
        // Fire blocks rapidly back toward enemy with homing behavior
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.homingToEnemy = true;
            blockSprite.setTint(0x00ff00); // Flash green
            
            // Also tint the EquationBlock if it exists
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.setTint(0x00ff00);
            }
        });
        // Fallback: if somehow no overlap detected, resolve after a short delay
        this.time.delayedCall(1200, () => {
            if (!this.enemyHitHandled) {
                this.handleEnemyHit();
            }
        });
        
        this.playerInput = '';
        this.scene.get('UIScene').updatePlayerInput('');
    }

    handleEnemyHit() {
        if (this.enemyHitHandled) return;
        this.enemyHitHandled = true;
        // Simple explosion flash at enemy position
        const ex = this.enemy.sprite.x;
        const ey = this.enemy.sprite.y;
        const boom = this.add.circle(ex, ey, 8, 0xffff66, 0.9).setDepth(999);
        this.tweens.add({
            targets: boom,
            radius: 38,
            alpha: 0,
            duration: 220,
            onComplete: () => boom.destroy()
        });
        this.dealDamageToEnemy();
        this.correctCount = (this.correctCount || 0) + 1;
        this.clearEquationBlocks();
        
        // Next step depending on progress
        this.time.delayedCall(600, () => {
            if (this.correctCount >= this.targetCorrect) {
                this.handleLevelWin();
            } else if (window.gameState.playerHP > 0 && !this.showingEndOverlay) {
                this.isProcessingEquation = false;
                this.generateNewEquation();
            }
        });
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
        if (this.enemy && typeof this.enemy.takeDamage === 'function') {
            this.enemy.takeDamage(damage);
        }
        
        if (this.currentEquation.specialType === 'green') {
            // Heal player
            window.gameState.playerHP = Math.min(100, window.gameState.playerHP + 15);
            if (this.player && typeof this.player.heal === 'function') {
                this.player.heal(15);
            }
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
        if (!this.showingEndOverlay && this.correctCount >= this.targetCorrect) {
            this.handleLevelWin();
        } else if (!this.showingEndOverlay && window.gameState.playerHP <= 0) {
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
        
        // Show Mission Complete overlay with next steps
        this.showingEndOverlay = true;
        this.showEndOverlay({
            title: 'Mission Complete!',
            subtitle: `+${levelBonus} SpaceBux\nSolved ${this.correctCount}/${this.targetCorrect}`,
            primary: { label: 'Next Level ▶', action: () => this.startNextLevel() },
            secondary: { label: 'Level Select', action: () => this.gotoLevelSelect() }
        });
    }

    handleGameOver() {
        console.log('Game Over!');
        
        // Show Game Over overlay with retry options
        this.showingEndOverlay = true;
        this.showEndOverlay({
            title: 'Game Over',
            subtitle: 'Try again?',
            primary: { label: 'Retry ▶', action: () => this.retryLevel() },
            secondary: { label: 'Main Menu', action: () => this.gotoMainMenu() }
        });
    }

    showEndOverlay({ title, subtitle, primary, secondary }) {
        // Pause block movement
        this.equationBlocks?.children?.entries?.forEach(b => b.setVelocity(0, 0));
        
        // Dim background
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6).setDepth(1000);
        const panel = this.add.rectangle(400, 300, 460, 220, 0x111122, 0.95).setStrokeStyle(2, 0x00ffff).setDepth(1001);
        const titleText = this.add.text(400, 250, title, { fontSize: '32px', fill: '#00ffff', fontFamily: 'Courier New' }).setOrigin(0.5).setDepth(1002);
        const subText = this.add.text(400, 285, subtitle || '', { fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New' }).setOrigin(0.5).setDepth(1002);
        
        const primaryBtn = this.add.text(400, 330, primary.label, {
            fontSize: '22px', fill: '#000000', backgroundColor: '#00ffff', fontFamily: 'Courier New', padding: { left: 18, right: 18, top: 8, bottom: 8 }
        }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });
        primaryBtn.on('pointerdown', () => { cleanup(); primary.action(); });
        
        const secondaryBtn = this.add.text(400, 375, secondary.label, {
            fontSize: '18px', fill: '#ffffff', backgroundColor: '#333333', fontFamily: 'Courier New', padding: { left: 14, right: 14, top: 6, bottom: 6 }
        }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });
        secondaryBtn.on('pointerdown', () => { cleanup(); secondary.action(); });
        
        const cleanup = () => {
            overlay.destroy(); panel.destroy(); titleText.destroy(); subText.destroy(); primaryBtn.destroy(); secondaryBtn.destroy();
        };
    }

    startNextLevel() {
        window.gameState.currentLevel += 1;
        window.gameState.playerHP = 100;
        window.gameState.enemyHP = 100;
        this.showingEndOverlay = false;
        this.isProcessingEquation = false;
        this.correctCount = 0;
        this.clearTimers();
        this.clearEquationBlocks();
        this.scene.stop('UIScene');
        this.scene.restart();
    }

    retryLevel() {
        window.gameState.playerHP = 100;
        window.gameState.enemyHP = 100;
        this.showingEndOverlay = false;
        this.isProcessingEquation = false;
        this.correctCount = 0;
        this.clearTimers();
        this.clearEquationBlocks();
        this.scene.stop('UIScene');
        this.scene.restart();
    }

    gotoLevelSelect() {
        this.showingEndOverlay = false;
        this.isProcessingEquation = false;
        this.clearTimers();
        this.scene.stop('UIScene');
        this.scene.start('LevelSelectScene');
    }

    gotoMainMenu() {
        this.showingEndOverlay = false;
        this.isProcessingEquation = false;
        this.clearTimers();
        this.scene.stop('UIScene');
        this.scene.start('MainMenuScene');
    }

    clearTimers() {
        if (this.wrongAnswerTimer) {
            this.wrongAnswerTimer.destroy();
            this.wrongAnswerTimer = null;
        }
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
    }
}