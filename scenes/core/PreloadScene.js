class PreloadScene extends Phaser.Scene {
    constructor() {
        super("bootgame");
    }

    preload() {
        // --- Loading bar ---
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x0d5c62, 0.8);
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
                color: "#b3f9ff"
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
                color: "#b3f9ff"
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        var assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: 'PixelFont',
                fill: '#b3f9ff'
            }
        });
        assetText.setOrigin(0.5, 0.5);
        
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x2fe7f6, 1);
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

        // --- Audio ---
        this.load.audio("bgMusic1","assets/sounds/bg_Sound1.mp3");
        this.load.audio("bgMusic2","assets/sounds/bg_Sound2.mp3");
        this.load.audio("bgMusic3","assets/sounds/bg_Sound3.mp3");
        this.load.audio("bgMusic4","assets/sounds/bonusLevelMusic.mp3");
        this.load.audio("soulSteal","assets/sounds/soul.mp3");
        this.load.audio("teleportation","assets/sounds/teleportation.mp3");
        this.load.audio("switch","assets/sounds/lift_activation_sound.mp3");
        this.load.audio("jump","assets/sounds/Jump_Sound_1.wav");
        this.load.audio("die","assets/sounds/Dies_Sound_1.wav");
        this.load.audio("gameOver","assets/sounds/gameOver.mp3");
         this.load.audio("gameOver1","assets/sounds/AliceGameOver.mp3");
        this.load.audio("winner","assets/sounds/winnerSound.mp3");
        

        // --- Images ---
        this.load.image("bg", "assets/images/bg.jpg");
        this.load.image("logo1", "assets/images/GhostLogo.png");
        this.load.image("logo", "assets/images/logo.png");
        this.load.image("gif", "assets/images/ghost.gif");
        this.load.image("soundOn", "assets/images/soundOn.png");
        this.load.image("soundOff", "assets/images/soundOff.png");
        this.load.image("bgMenu", "assets/images/bg1.png");
        this.load.image("bgSky", "assets/images/NightSky.png");
        this.load.image("bgSky1", "assets/images/NightSkyTop.png");
        this.load.image("tiles1a", "assets/images/tileset.png");
        this.load.image("tiles", "assets/images/tilesetlevel1.png");
        this.load.image("ground", "assets/images/Boden_Block.png");
        this.load.image("tiles2", "assets/images/tilesetlevel2.png");
        this.load.image("ground1", "assets/images/BonusGround.png");
        this.load.image("ground2", "assets/images/groundSchwarz.png");
        this.load.image("tiles3b", "assets/images/tilesetlevel3b.png");
        this.load.image("portal", "assets/images/portal1.png");
        this.load.image("lift", "assets/images/lift.png");
        this.load.image("deadLift", "assets/images/deadLift.png");
        this.load.tilemapTiledJSON("level1", "assets/tilemap/tilesetlevel1.tmj");
        this.load.tilemapTiledJSON("level2", "assets/tilemap/tilesetlevel2.tmj");
        this.load.tilemapTiledJSON("level3b", "assets/tilemap/tilesetlevel3.tmj");
        this.load.tilemapTiledJSON("level3", "assets/tilemap/tilesetlevel3b.tmj");
        this.load.spritesheet("soul", "assets/images/fire.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("switch", "assets/images/switch.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("ghost", "assets/images/ghost.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet("enemy", "assets/images/enemy.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("portalAnim", "assets/images/teleportal1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("endPortal", "assets/images/portal.png", {
            frameWidth: 96,
            frameHeight: 96
        });
    }

    create() {

        // --- Ghost animation ---
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

        // --- Ennemy animation ---
        if (!this.anims.exists("enemyWalk")){
            this.anims.create({
                key: "enemyWalk",
                frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists("enemyDie")) {
            this.anims.create({
                key: "enemyDie",
                frames: this.anims.generateFrameNumbers("enemy", { start: 12, end: 24 }),
                frameRate: 16,
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

        // --- teleportation portal animation ---
        if (!this.anims.exists("portalGlow")) {
            this.anims.create({
                key: "portalGlow",
                frames: this.anims.generateFrameNumbers("portalAnim", { start: 0, end: 7 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // --- Lift switch animation ---
        if (!this.anims.exists("switchPressed")) {
            this.anims.create({
                key: "switchPressed",
                frames: this.anims.generateFrameNumbers("switch", { start: 0, end: 3 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // --- end portal animation ---
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
export default PreloadScene;