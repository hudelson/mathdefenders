// Math Defenders - Main Game Configuration
// This file initializes the Phaser game instance and manages scenes

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#000011',
    // Responsive scaling: keep base 800x600, scale up to fit parent while preserving aspect
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        min: { width: 800, height: 600 }
        // max can be left undefined to allow full parent size
    },
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
    },
    // Shop ownership tracking
    ownedShips: ['default'],
    ownedOutfits: ['light_blue'],
    ownedBuddies: ['normal'],
    currentShip: 'default',
    currentOutfit: 'light_blue',
    currentBuddy: 'normal'
};

// Save/Load functions for localStorage
window.saveProgress = function() {
    const saveData = {
        progress: window.gameState.highestLevels,
        spaceBux: window.gameState.spaceBux,
        ownedShips: window.gameState.ownedShips,
        ownedOutfits: window.gameState.ownedOutfits,
        ownedBuddies: window.gameState.ownedBuddies,
        currentShip: window.gameState.currentShip,
        currentOutfit: window.gameState.currentOutfit,
        currentBuddy: window.gameState.currentBuddy
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
        window.gameState.ownedShips = data.ownedShips || ['default'];
        window.gameState.ownedOutfits = data.ownedOutfits || ['light_blue'];
        window.gameState.ownedBuddies = data.ownedBuddies || ['normal'];
        window.gameState.currentShip = data.currentShip || 'default';
        window.gameState.currentOutfit = data.currentOutfit || 'light_blue';
        window.gameState.currentBuddy = data.currentBuddy || 'normal';
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
        ShopScene,
        ShipShopScene,
        OutfitShopScene,
        BuddyShopScene,
        WinScene,
        LoseScene
    ];
    
    // Create and start the game
    window.game = new Phaser.Game(config);
    
    console.log('Math Defenders initialized');
});