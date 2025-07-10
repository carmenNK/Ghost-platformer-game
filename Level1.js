class Level1 extends Phaser.Scene {
    constructor() {
        super("level1");
        this.cursors = null;
        //this.score = 0;
       // this.scoreText = null;
    }

   
    create() {
        this.sound.unlock();
        this.sound.stopAll(); 
        this.bgMusic = this.sound.add("bgMusic1", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");
        this.add.text(20, 20, "Level 1");
        const map = this.make.tilemap({ key: "level1" });
        const tileset = map.addTilesetImage("tilesetlevel1", "tiles");
        const layer = map.createLayer("floor", tileset, 0, 280);
        layer.setOrigin(0, 0);
        this.isDying = false;

        // Defining the limits of the world
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 280, map.widthInPixels, map.heightInPixels);

        // Player
        this.player = this.physics.add.sprite(30, 200, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(true);

        // Camera follow player
        this.cameras.main.startFollow(this.player);

        // Normal floor
        layer.setCollisionByProperty({ collides: true });
        this.physics.add.collider(this.player, layer);

        /**/

        // Group of invisible trap
        this.spikeZones = this.physics.add.staticGroup();

        // Create invisible traps on ‘dead’ tiles
        layer.forEachTile(tile => {
            if (tile.properties.dead) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2 + 280;
                const spike = this.spikeZones.create(x, y)
                    .setSize(32, 32)
                    .setVisible(false)
                    .setOrigin(0.5);
                spike.refreshBody(); 
            }
        });

        // Player collision ↔ trap
        this.physics.add.overlap(this.player, this.spikeZones, this.hitTrap, null, this);

        //finish the level
        this.portalZones = this.physics.add.staticGroup();

        layer.forEachTile(tile => {
            if (tile.properties.finish) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2 + 280;
                const portal = this.portalZones.create(x, y)
                    .setSize(32, 32)
                    .setVisible(false)
                    .setOrigin(0.5);
                portal.refreshBody();
            }
        });

        this.physics.add.overlap(this.player, this.portalZones, this.reachFinish, null, this);


        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.enabled = true;

    }

    update() {
        if (this.isDying || !this.cursors || !this.input.keyboard.enabled) {
            return;
        }
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
             this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.cursors.space.isDown) && this.player.body.blocked.down) {
            this.player.setVelocityY(-400);
            this.jumpSound.play();
        }
    }

    hitTrap() {
        if (this.isDying) return;
        this.isDying = true;

        this.dieSound.play();
        
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
        //this.player.body.allowGravity = true; 
        this.input.keyboard.enabled = false;

        this.time.delayedCall(200, () => {
            this.player.play("ghostDie");

            this.player.once("animationcomplete", () => {
                this.cameras.main.fadeOut(800);
                this.time.delayedCall(800, () => {
                    this.scene.start("gameOver");
                });
            });
        });
    }
    isFinishTile(player, tile) {
        return tile.properties.finish === true;
    }

    reachFinish() {
        this.scene.start("level2"); 
    }

}
