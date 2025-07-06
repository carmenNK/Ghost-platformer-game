class PreloadScene extends Phaser.Scene {
    constructor() {
        super("bootgame");
    }

    preload() {
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);
        
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                fontFamily: "PixelFont",
                fontSize: "32px",
                color: "#ffffff"
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                fontFamily: "PixelFont",
                fontSize: "32px",
                color: "#ffffff"
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        var assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: 'PixelFont',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);
        
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });
            
        this.load.on('fileprogress', function (file) {
            assetText.setText('Loading asset: ' + file.key);
        });
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });



        this.load.image("bg", "assets/bg.jpg");
        this.load.image("logo1", "assets/GhostLogo.png");
        this.load.image("logo", "assets/logo.png");
        this.load.image("gif", "assets/ghost.gif");
        this.load.image("soundOn", "assets/soundOn.png");
        this.load.image("soundOff", "assets/soundOff.png");
        this.load.image("bgMenu", "assets/bg1.png");
        this.load.image("tiles1a", "assets/tileset.png");
        this.load.image("tiles3", "assets/Tilesetv3.png");
        this.load.image("tiles", "assets/tilesetlevel1.png");
        this.load.image("tiles2", "assets/tilesetlevel2.png");
        this.load.image("portal", "assets/portal1.png");
        this.load.image("lift", "assets/lift.png");
        this.load.tilemapTiledJSON("level1", "assets/tilesetlevel1.tmj");
        this.load.tilemapTiledJSON("level2", "assets/tilesetlevel2.tmj");
        this.load.tilemapTiledJSON("level3", "assets/tilesetlevel3.tmj");
        this.load.spritesheet("soul", "assets/fire.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("switch", "assets/switch.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("ghost", "assets/ghost.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("portalAnim", "assets/teleportal1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("endPortal", "assets/portal.png", {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.video("intro", "assets/title_intro.mp4", "loadeddata", false, false);
    }

    create() {

        // Ghost animation
        if (!this.anims.exists("float")) {
            this.anims.create({
                key: "float",
                frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists("ghostDie")) {
            this.anims.create({
                key: "ghostDie",
                frames: this.anims.generateFrameNumbers("ghost", { start: 12, end: 25 }),
                frameRate: 15,
                repeat: 0
            });
        }

        // soul(blue fire) animation
        if (!this.anims.exists("soulMove")) {
            this.anims.create({
                key: "soulMove",
                frames: this.anims.generateFrameNumbers("soul", { start: 0, end: 6 }),
                frameRate: 12,
                repeat: -1
            });
        }

        //teleportation portal animation
        if (!this.anims.exists("portalGlow")) {
            this.anims.create({
                key: "portalGlow",
                frames: this.anims.generateFrameNumbers("portalAnim", { start: 0, end: 7 }),
                frameRate: 12,
                repeat: -1
            });
        }

        //Lift switch animation
        if (!this.anims.exists("switchPressed")) {
            this.anims.create({
                key: "switchPressed",
                frames: this.anims.generateFrameNumbers("switch", { start: 0, end: 3 }),
                frameRate: 8,
                repeat: 0
            });
        }

        //end portal animation
        if (!this.anims.exists("finishPortal")) {
            this.anims.create({
                key: "finishPortal",
                frames: this.anims.generateFrameNumbers("endPortal", { start: 0, end: 3 }),
                frameRate: 16,
                repeat: -1
            });
        }

        this.scene.start("title");

    }
}