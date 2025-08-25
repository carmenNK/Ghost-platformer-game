class CreditsScene extends Phaser.Scene {
    constructor() {
        super("credits");
    }

    create() {
        this.add.image(400, 300, "bgMenu").setDisplaySize(800, 600);

        // Credits text
        const credits = [
            "CREDITS",
            "",
            "Game Design & Code: Carmen Ngosso and Mariella Kuimo ",
            "Engine: Phaser 3",
            "Pixel-Art: made with Piskel",
            "Sounds: pixabay.com",
            "Musik: ghosts-of-the-past-instrumental-halloween-autumn-spooky,",
                    "yurei-japanese-ghosts-bells-soundtrack-fantasy-mystery,",
                    "haunted-house-explorer-instrumental",
            "",
            "Special Thanks:",
            "- Prof. Dr. Volker Paelke and Andreas Lochwitz ",
            "- To all testers for feedback",
            "- To fellow students for inspiration and exchange",
            "",
            "Thanks for playing!",
        ];

        // Text container
        const startY = 700;
        const textGroup = this.add.container(400, startY);

        // Add every line
        credits.forEach((line, index) => {
            const lineText = this.add.text(0, index * 30, line, {
                fontFamily: "PixelFont",
                fontSize: "22px",
                color: "#ffffff",
                align: "center"
            }).setOrigin(0.5, 0);
            textGroup.add(lineText);
        });

        // Scroll animation
        this.tweens.add({
            targets: textGroup,
            y: -credits.length * 30, 
            duration: 20000,         
            ease: "Linear",
            onComplete: () => {
                this.scene.start("title"); // retour au menu principal
            }
        });

        // Go back to title
        this.input.on("pointerdown", () => {
            this.scene.start("title");
        });

        // Instructions
        this.add.text(400, 570, "Click to return to the previous menu", {
            fontSize: "16px",
            color: "#ffff00"
        }).setOrigin(0.5);
    }
}
export default CreditsScene;