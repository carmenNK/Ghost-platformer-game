import PreloadScene from './scenes/core/PreloadScene.js';
import TitleScene from './scenes/core/TitleScene.js';
import Level1 from './scenes/levels/Level1.js';
import Level2 from './scenes/levels/Level2.js';
import Level3 from './scenes/levels/Level3.js';
import BonusRunnerScene from './scenes/levels/BonusRunnerScene.js';
import GameOverScene from './scenes/ui/GameOverScene.js';
import EndGame from './scenes/ui/EndGame.js';
import CreditsScene from './scenes/ui/CreditsScene.js';


// --- collect soul ---
window.GameState = {
    soulAmmo: 3 
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: 0x052143,
    scene: [PreloadScene, TitleScene, CreditsScene, Level1, Level2, Level3, GameOverScene, EndGame, BonusRunnerScene],
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

