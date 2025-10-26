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
        this.wrongCount = 0;
    this.targetCorrect = 10; // require 10 correct answers to win
    this.attackTimer = null;
    this.correctFallbackTimer = null;
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
    this.wrongCount = 0;
    // Ensure time scales are reset (avoid slowdowns across levels)
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.physics.world.timeScale = 1;
        
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
        // Defensive cleanup of any leftover equation texts
        this.children.list.forEach(child => {
            if (child?.getData && child.getData('equationText')) {
                child.destroy();
            }
        });
        
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
        
    // Staging lineup near top center, then fall straight down in unison
    const spacing = 40;
    const totalWidth = (allParts.length - 1) * spacing;
    const centerX = this.cameras.main.centerX;
    const stageY = 140;
        
        // Store answer indices for live updates
        this.answerStartIndex = equationParts.length;
        this.answerLength = answerLength;
        this.playerInput = '';
        this.updateAnswerBlanks();
        
        // Fire an enemy missile for each block to its target slot; spawn the block on missile arrival
        let missilesCompleted = 0;
        allParts.forEach((char, index) => {
            const isAnswerBlank = index >= this.answerStartIndex;
            const targetX = centerX - (totalWidth / 2) + (index * spacing);
            // Stagger missile launches slightly
            this.time.delayedCall(60 * index, () => {
                const m = this.spawnEnemyMissile(this.enemy.sprite.x, this.enemy.sprite.y, targetX, stageY);
                m.on('complete', () => {
                    m.destroy();
                    const block = new EquationBlock(this, targetX, stageY, blockTexture, char, isAnswerBlank);
                    block.sprite.equationBlock = block;
                    block.updateTextPosition();
                    this.equationBlocks.add(block.sprite);
                    missilesCompleted++;
                    if (missilesCompleted === allParts.length) {
                        // After all blocks are in place, begin falling and arm the time-limit attack
                        this.time.delayedCall(160, () => {
                            this.beginFalling();
                            const timeLimit = Math.max(1500, 4000 - (window.gameState.currentLevel * 150));
                            this.attackTimer = this.time.delayedCall(timeLimit, () => {
                                if (!this.isProcessingEquation && !this.showingEndOverlay) {
                                    this.launchBlocksTowardPlayer();
                                }
                            });
                        });
                    }
                });
            });
        });
        
        console.log(`Created equation: ${equation.display} = ${'_'.repeat(answerLength)} (line staging; fall; blast on timeout or wrong)`);
    }

    beginFalling() {
        if (!this.equationBlocks) return;
        const fallSpeed = 50 + (window.gameState.currentLevel * 2);
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.setVelocity(0, fallSpeed);
        });
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
        
    // Lock out further input (no overlay text)
    this.playerInput = '';
        
        // Set up a timer to force collision if physics doesn't detect it (shortened for responsiveness)
        this.wrongAnswerTimer = this.time.delayedCall(600, () => {
            if (!this.collisionHandled) {
                console.log('Force triggering collision after wrong answer');
                this.handleBlockCollision(this.equationBlocks.children.entries[0]);
            }
        });
    }

    handleCorrectAnswer() {
        console.log('Correct answer!');
        this.isProcessingEquation = true;
        // Launch a player missile to the equation cluster, then set blocks to home to enemy
        const cluster = this.getEquationClusterCenter();
        const pm = this.spawnPlayerMissile(this.player.sprite.x, this.player.sprite.y, cluster.x, cluster.y);
        pm.on('complete', () => {
            pm.destroy();
            this.equationBlocks.children.entries.forEach(blockSprite => {
                blockSprite.homingToEnemy = true;
                blockSprite.setTint(0x00ff00);
                if (blockSprite.equationBlock) {
                    blockSprite.equationBlock.setTint(0x00ff00);
                }
            });
            // Fallback: if somehow no overlap detected, resolve after a short delay
            this.correctFallbackTimer = this.time.delayedCall(1200, () => {
                if (!this.enemyHitHandled) {
                    this.handleEnemyHit();
                }
            });
        });
        
        this.playerInput = '';
        this.scene.get('UIScene').updatePlayerInput('');
    }

    getEquationClusterCenter() {
        if (!this.equationBlocks || this.equationBlocks.getLength() === 0) {
            return { x: this.enemy?.sprite?.x || 400, y: this.enemy?.sprite?.y || 100 };
        }
        let sx = 0, sy = 0, n = 0;
        this.equationBlocks.children.entries.forEach(b => { sx += b.x; sy += b.y; n++; });
        return { x: sx / n, y: sy / n };
    }

    handleEnemyHit() {
        if (this.enemyHitHandled) return;
        this.enemyHitHandled = true;
        // Cancel any outstanding timers from the previous equation resolution
        this.clearTimers();
        // Explosion effect at enemy position
        const ex = this.enemy.sprite.x;
        const ey = this.enemy.sprite.y;
        const boom = this.add.image(ex, ey, 'hit-explosion').setDepth(999);
        // Scale explosion to 25% of enemy ship size
        if (this.enemy?.sprite) {
            boom.setDisplaySize(this.enemy.sprite.displayWidth * 0.25, this.enemy.sprite.displayHeight * 0.25);
        }
        this.tweens.add({ targets: boom, alpha: 0, duration: 220, onComplete: () => boom.destroy() });
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
        this.wrongCount = (this.wrongCount || 0) + 1;
        
        // Stop all blocks immediately
        this.equationBlocks.children.entries.forEach(blockSprite => {
            blockSprite.setVelocity(0, 0);
            blockSprite.setTint(0xff0000);
            
            // Also tint the EquationBlock if it exists
            if (blockSprite.equationBlock) {
                blockSprite.equationBlock.setTint(0xff0000);
            }
        });
        
    // No overlay text on player sprite
        
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
        // Extra defensive cleanup for any stray texts
        this.children.list.forEach(child => {
            if (child?.getData && child.getData('equationText')) {
                child.destroy();
            }
        });
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
        } else if (!this.showingEndOverlay && this.wrongCount >= this.targetCorrect) {
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
        
        // Cinematic slow-mo and flashes, then overlay
        this.doCinematicFlash(this.enemy.sprite, () => {
            this.showingEndOverlay = true;
            this.showEndOverlay({
                title: 'Mission Complete!',
                subtitle: `+${levelBonus} SpaceBux\nSolved ${this.correctCount}/${this.targetCorrect}`,
                primary: { label: 'Next Level ▶', action: () => this.startNextLevel() },
                secondary: { label: 'Level Select', action: () => this.gotoLevelSelect() }
            });
        });
    }

    handleGameOver() {
        console.log('Game Over!');
        
        // Cinematic slow-mo and flashes, then overlay
        this.doCinematicFlash(this.player.sprite, () => {
            this.showingEndOverlay = true;
            this.showEndOverlay({
                title: 'Game Over',
                subtitle: 'Try again?',
                primary: { label: 'Retry ▶', action: () => this.retryLevel() },
                secondary: { label: 'Main Menu', action: () => this.gotoMainMenu() }
            });
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
        if (this.correctFallbackTimer) {
            this.correctFallbackTimer.destroy();
            this.correctFallbackTimer = null;
        }
    }

    doCinematicFlash(targetSprite, onDone) {
        const oldTimeScale = this.time.timeScale;
        const oldTweenScale = this.tweens.timeScale;
        const oldPhysScale = this.physics.world.timeScale;
        this.time.timeScale = 0.3;
        this.tweens.timeScale = 0.3;
        this.physics.world.timeScale = 0.3;
        let count = 0;
        const tick = () => {
            count++;
            const boom = this.add.image(targetSprite.x, targetSprite.y, 'hit-explosion').setDepth(999);
            // Scale explosion to 25% of target ship size
            boom.setDisplaySize(targetSprite.displayWidth * 0.25, targetSprite.displayHeight * 0.25);
            this.tweens.add({ targets: boom, alpha: 0, duration: 120, onComplete: () => boom.destroy() });
            targetSprite.setTint(0xffffff);
            this.time.delayedCall(100, () => targetSprite.clearTint());
            if (count < 5) {
                this.time.delayedCall(140, tick);
            } else {
                this.time.timeScale = oldTimeScale;
                this.tweens.timeScale = oldTweenScale;
                this.physics.world.timeScale = oldPhysScale;
                onDone && onDone();
            }
        };
        tick();
    }

    spawnEnemyMissile(fromX, fromY, toX, toY) {
        const missile = this.add.image(fromX, fromY, 'enemy-missile').setDepth(900);
        // Scale to 25% of enemy ship size
        if (this.enemy?.sprite) {
            missile.setDisplaySize(this.enemy.sprite.displayWidth * 0.25, this.enemy.sprite.displayHeight * 0.25);
        }
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        missile.rotation = angle + Math.PI / 2;
        const travel = Math.max(200, Math.hypot(dx, dy) * 1.2);
        this.tweens.add({ targets: missile, x: toX, y: toY, duration: travel, ease: 'Sine.easeOut', onComplete: () => missile.emit('complete') });
        return missile;
    }

    spawnPlayerMissile(fromX, fromY, toX, toY) {
        const missile = this.add.image(fromX, fromY, 'player-missile').setDepth(900);
        // Scale to 25% of player ship size
        if (this.player?.sprite) {
            missile.setDisplaySize(this.player.sprite.displayWidth * 0.25, this.player.sprite.displayHeight * 0.25);
        }
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        missile.rotation = angle + Math.PI / 2;
        const travel = Math.max(200, Math.hypot(dx, dy));
        this.tweens.add({ targets: missile, x: toX, y: toY, duration: travel, ease: 'Power2', onComplete: () => missile.emit('complete') });
        return missile;
    }
}