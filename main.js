// collect soul
window.GameState = {
    soulAmmo: 0 
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: 0x052143,
    scene: [PreloadScene, TitleScene, Level1, Level2, Level3, GameOverScene],
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 500 },
            debug: false // désactive le mode debug, active-le si besoin
        }
    }
};

const game = new Phaser.Game(config);

