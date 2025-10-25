// Math Defenders - Main Game Configuration
// This file initializes the Phaser game instance and manages scenes

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#000011',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: []  // Will be populated after scene classes are loaded
};

// Global game state object
window.gameState = {
    playerHP: 100,
    enemyHP: 100,
    spaceBux: 0,
    currentLevel: 1,
    gameMode: 'multiplication', // Default mode
    highestLevels: {
        addition: 1,
        subtraction: 1,
        multiplication: 1,
        division: 1
    }
};

// Save/Load functions for localStorage
window.saveProgress = function() {
    const saveData = {
        progress: window.gameState.highestLevels,
        spaceBux: window.gameState.spaceBux
    };
    localStorage.setItem('mathDefendersProgress', JSON.stringify(saveData));
    console.log('Progress saved:', saveData);
};

window.loadProgress = function() {
    const savedData = localStorage.getItem('mathDefendersProgress');
    if (savedData) {
        const data = JSON.parse(savedData);
        window.gameState.highestLevels = data.progress || window.gameState.highestLevels;
        window.gameState.spaceBux = data.spaceBux || 0;
        console.log('Progress loaded:', data);
    } else {
        console.log('No saved progress found, starting fresh');
    }
};

// Initialize game after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved progress
    window.loadProgress();
    
    // Add scenes to config (order matters for scene management)
    config.scene = [
        PreloaderScene,
        MainMenuScene,
        LevelSelectScene,
        GameScene,
        UIScene,
        ShopScene
    ];
    
    // Create and start the game
    window.game = new Phaser.Game(config);
    
    console.log('Math Defenders initialized');
});