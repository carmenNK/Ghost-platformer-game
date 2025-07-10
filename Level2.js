class Level2 extends Phaser.Scene {
    constructor() {
        super("level2"); 
        this.cursors = null;
    }

    create() {
        this.sound.unlock();
        this.sound.stopAll(); // Coupe la musique du menu
        this.bgMusic = this.sound.add("bgMusic2", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");
        this.soulSteal = this.sound.add("soulSteal");
        this.teleportSound = this.sound.add("teleportation");
        this.isDying = false;
        this.score = 0;
        this.canTeleport = true;
        this.add.text(20, 20, "Level 2");
        
        const map = this.make.tilemap({ key: "level2" });
        const tileset = map.addTilesetImage("tilesetlevel2", "tiles2");
        this.layer = map.createLayer("floor", tileset, 0, 0);
        this.layer.setOrigin(0, 0);
        this.endPortalLayer = map.createLayer("endportal", tileset, 0, 0);
        this.endPortalLayer.setVisible(false);

        // Defining the limits of the world
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Player
        this.player = this.physics.add.sprite(30, 50, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);

        // Camera follow player
        this.cameras.main.startFollow(this.player);

        // Normal floor
        this.layer.setCollisionByProperty({ collides: true });
        this.physics.add.collider(this.player, this.layer);

        // soul

        this.souls = this.physics.add.group({
            key: "soul",
            repeat: 2,
            setXY: { x: 12, y: 80, stepX: 350 }
        });
        this.souls.children.iterate((soul) => {
            soul.play("soulMove");
        });
        this.physics.add.overlap(this.player, this.souls, this.collectSoul, null, this);
        this.physics.add.collider(this.souls, this.layer);

       /* this.time.addEvent({
            delay: 2000,
            callback: this.spawnSoul,
            callbackScope: this,
            loop: true
        });*/

        // Score text
        this.scoreText = this.add.text(100, 20, "Score: 0");

        // Group of invisible trap
        this.spikeZones = this.physics.add.staticGroup();

        // Create invisible traps on ‘dead’ tiles
        this.layer.forEachTile(tile => {
            if (tile.properties.dead) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2 ;
                const spike = this.spikeZones.create(x, y)
                    .setSize(32, 32)
                    .setVisible(false)
                    .setOrigin(0.5);
                spike.refreshBody(); 
            }
        });

        this.teleportZones = this.physics.add.staticGroup();

        const portalObjects = map.getObjectLayer("portals").objects;

        portalObjects.forEach(obj => {
            const zone = this.teleportZones.create(obj.x + obj.width/2, obj.y + obj.height/2)
                .setSize(obj.width, obj.height)
                .setVisible(false)
                .setOrigin(0.5);

            const props = obj.properties.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {});
            zone.destX = props.destX;
            zone.destY = props.destY;

            zone.refreshBody();

            const animSprite = this.add.sprite(zone.x, zone.y-18, "portalAnim").setOrigin(0.5);
            animSprite.play("portalGlow");
        });

        this.physics.add.overlap(this.player, this.teleportZones, this.teleportPlayer, null, this);

        // Player collision ↔ trap
        this.physics.add.overlap(this.player, this.spikeZones, this.hitTrap, null, this);

        //end of level
        this.portalZones = this.physics.add.staticGroup();


        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.enabled = true;
        this.input.keyboard.resetKeys();
    }

    update() {
        if (this.isDying || !this.cursors || !this.input.keyboard.enabled) return;

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

    collectSoul(player, soul) {
        this.soulSteal.play();
        soul.disableBody(true, true);
        this.souls.remove(soul, true, true);
        this.score += 1;
        this.scoreText.setText("Score: " + this.score);

        if (this.souls.countActive(true) === 0) {
            this.revealPortal(this.endPortalLayer); 
        }
        
    }

    teleportPlayer(player, zone) {
        if (!this.canTeleport) return; 

        this.canTeleport = false; 

        this.teleportSound.play();
        this.cameras.main.fadeOut(300);

        this.time.delayedCall(300, () => {
            player.x = zone.destX;
            player.y = zone.destY;
            this.cameras.main.fadeIn(300);

            this.time.delayedCall(4000, () => {
                this.canTeleport = true;
            });
        });
    }

    hitTrap() {
        if (this.isDying) return;
        this.isDying = true;
        this.dieSound.play();
        this.player.setVelocity(0);
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

    revealPortal(layer) {
        // Create the finish portal
        layer.forEachTile(tile => {
            if (tile.properties.finish) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2;
                const portal = this.portalZones.create(x, y)
                    .setSize(96, 96)
                    .setVisible(false)
                    .setOrigin(0.5);
                portal.refreshBody();

                // Optionnel : sprite animé visuel
                const sprite = this.add.sprite(x, y - 25, "endPortal")
                    .setOrigin(0.5)
                    .setScale(0.9)
                    .setDepth(5)
                    .play("finishPortal");
            }
        });

        // Detect the end of the level
        this.physics.add.overlap(this.player, this.portalZones, () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start("level3"); 
            });
        }, null, this);
    }


}