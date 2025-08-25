class GameOverScene extends Phaser.Scene {
    constructor() {
        super("gameOver");
    }

    create() {
        GameState.soulAmmo = 0;
        this.sound.stopAll();

        this.gameOver = this.sound.add("gameOver");
        this.gameOver.play();

        this.add.text(250, 250, "Game Over", { fontSize: "60px", fill: "#ff0000" });

        // Automatic return after 5 seconds
        this.time.delayedCall(8000, () => {
            this.scene.start("title");
        });

        // Early return if click
        this.input.once("pointerdown", () => {
            this.scene.start("title");
        });
    }
}
export default GameOverScene;