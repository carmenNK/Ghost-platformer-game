class TitleScene extends Phaser.Scene {
    constructor() {
        super("title");
    }

    create() {
        this.sound.unlock();
        this.bgMusic = this.sound.add("bgMusic2", {
            loop: true,
            volume: 0.5
        });

        this.input.once("pointerdown", () => {
            this.bgMusic.play(); 
        });
        this.add.image(400, 300, "bgMenu").setDisplaySize(800, 600);
        this.add.image(400, 200, "logo").setScale(1.5);

        //Play button
        const playBtn = this.add.text(400, 340, "PLAY", {
            fontFamily: "PixelFont",
            fontSize: "32px",
            color: "#ffffff"
        })
        .setOrigin(0.5).setInteractive()
        .on("pointerdown", () => this.scene.start("level2"));
        
         //Credits button
        const creditsBtn =this.add.text(400, 380, "CREDITS", {
            fontFamily: "PixelFont",
            fontSize: "32px",
            color: "#ffffff"
        })
        .setOrigin(0.5).setInteractive()
        .on("pointerdown", () => this.scene.start("credits"));
        
        // Sound button (toggle)
        this.soundBtn = this.add.image(750, 50, "soundOn").setScale(0.03).setInteractive();
        this.soundBtn.on("pointerdown", () => {
            this.soundOn = !this.soundOn;
            this.sound.mute = !this.soundOn;
            this.soundBtn.setTexture(this.soundOn ? "soundOn" : "soundOff");
        });
        

        // Button hover
        [playBtn, creditsBtn, this.soundBtn].forEach(btn => {
            btn.on("pointerover", () => btn.setTint(0xaaaaaa));
            btn.on("pointerout", () => btn.clearTint());
        });

    }
}