class GameOverScene extends Phaser.Scene {
    constructor() {
        super("gameOver");
    }

    create() {
        this.add.text(350, 250, "Game Over", { fontSize: "28px", fill: "#ff0000" });
        this.input.once("pointerdown", () => {
            this.scene.start("title");
        });
    }
}