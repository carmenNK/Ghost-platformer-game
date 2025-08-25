class EndGame extends Phaser.Scene {
    constructor() {
        super("endGame");
    }

    create() {
        this.sound.stopAll();
        this.winner = this.sound.add("winner");
        this.winner.play();

        const text = this.add.text(400, 150, "YOU WIN!!!", { 
            fontSize: "60px", 
            fill: "#2fe7f6" })
            .setOrigin(0.5, 0.5);

         this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 3000,
            yoyo: true,
            onUpdate: (tween) => {

                const v = tween.getValue();
                const c = 255 * v;

                text.setFontSize(60 + v * 64);
            }
        });

        // --- Bonus button ---
        const bonusBtn = this.add.text(400, 340, "Bonus level", {
            fontSize: "22px",
            color: "#ffffff"
        })
        .setOrigin(0.5)
        .setInteractive()
        .on("pointerdown", () => this.scene.start("bonusRunner"));
        [bonusBtn].forEach(btn => {
            btn.on("pointerover", () => btn.setTint(0xaaaaaa));
            btn.on("pointerout", () => btn.clearTint());
        });


        // Retour au menu si on clique ailleurs
        this.add.text(400, 550, "Click anywhere else to return to the menu", {
            fontFamily: "PixelFont",
            fontSize: "16px",
            color: "#aaaaaa"
        }).setOrigin(0.5);

        // Si clic ailleurs que sur le bouton, retour au menu
        this.input.on("pointerdown", (pointer, targets) => {
            if (targets.length === 0) {
                this.scene.start("title");
            }
        });
    }
}
export default EndGame;