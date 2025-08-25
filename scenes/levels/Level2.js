class Level2 extends Phaser.Scene {
    constructor() {
        super("level2");
        this.cursors = null;
    }

    create() {
        // --- Initialisation of sounds and basic settings ---
        this.sound.unlock();
        this.sound.stopAll();
        this.bgMusic = this.sound.add("bgMusic2", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");
        this.soulSteal = this.sound.add("soulSteal");
        this.teleportSound = this.sound.add("teleportation");
        this.isDying = false;
        this.canTeleport = true;

        // --- Loading the map and layers ---
        const map = this.make.tilemap({ key: "level2" });
        const tileset = map.addTilesetImage("tilesetlevel2", "tiles2");
        this.layer = map.createLayer("floor", tileset, 0, 0);
        this.layer.setOrigin(0, 0);
        this.endPortalLayer = map.createLayer("endportal", tileset, 0, 0);
        this.endPortalLayer.setVisible(false);
        
        // --- Displaying the instruction ---
         this.instruction = this.add.text(360, 110, "Collect all the souls",{
                fontSize: "35px",
                color: "#0a3365"
            });

         // --- Defining camera and world boundaries ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- Player creation ---
        this.player = this.physics.add.sprite(10, 50, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);
        this.cameras.main.startFollow(this.player);
        // --- Collisions with the ground ---
        this.layer.setCollisionByProperty({ collides: true });
        this.physics.add.collider(this.player, this.layer);

        // --- Placement of souls to collect ---
        this.souls = this.physics.add.group({
            key: "soul",
            repeat: 4,
            setXY: { x: 100, y: 50, stepX: 205 }
        });
        this.souls.children.iterate((soul) => {
            soul.play("soulMove");
        });
        this.physics.add.overlap(this.player, this.souls, this.collectSoul, null, this);
        this.physics.add.collider(this.souls, this.layer);

        // --- HUD for the soul counter ---
        this.soulText = this.add.text(10, 16, `Souls: ${GameState.soulAmmo}`, {
            fontSize: "16px",
            color: "#ffffff"
        }).setScrollFactor(0);

        // --- Deadly trap zones (spikes) ---
        this.spikeZones = this.physics.add.staticGroup();
        this.layer.forEachTile(tile => {
            if (tile.properties.dead) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2;
                const spike = this.spikeZones.create(x, y)
                    .setSize(32, 32)
                    .setVisible(false)
                    .setOrigin(0.5);
                spike.refreshBody();
            }
        });

        // --- Teleportation zones ---
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

        // --- Collision detection with special areas --
        this.physics.add.overlap(this.player, this.teleportZones, this.teleportPlayer, null, this);
        this.physics.add.overlap(this.player, this.spikeZones, this.hitTrap, null, this);
        
        // --- Preparing exit gates ---
        this.portalZones = this.physics.add.staticGroup();

        
        // --- Keyboard controls ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.enabled = true;
        this.input.keyboard.resetKeys();
    }

    update() {
        
        // --- Interrupting actions if dead or controls disabled ---
        if (this.isDying || !this.cursors || !this.input.keyboard.enabled) return;

        // --- Move left/right ---
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // --- Jump if up key or space bar is pressed ---
        if ((this.cursors.up.isDown || this.cursors.space.isDown) && this.player.body.blocked.down) {
            this.player.setVelocityY(-400);
            this.jumpSound.play();
        }

        // --- Update soul counter display---
        this.soulText.setText(`level 2 | Souls: ${GameState.soulAmmo}`);
    }

    // --- Function called when collecting a soul ---
    collectSoul(player, soul) {
        this.soulSteal.play();
        soul.disableBody(true, true);
        this.souls.remove(soul, true, true);

        GameState.soulAmmo += 1;
         // --- If all souls are collected, activate the exit portal ---
         if (this.souls.countActive(true) === 0) {
            this.revealPortal(this.endPortalLayer); 
        }
    }

    // --- Teleporting the player from one area to another ---
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

     // --- Player death due to a trap ---
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

    // --- Appearance of the end portal after collecting souls ---
    revealPortal(layer) {
        layer.forEachTile(tile => {
            if (tile.properties.finish) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2;
                const portal = this.portalZones.create(x, y)
                    .setSize(96, 96)
                    .setVisible(false)
                    .setOrigin(0.5);
                portal.refreshBody();

                const sprite = this.add.sprite(x, y - 25, "endPortal")
                    .setOrigin(0.5)
                    .setScale(0.9)
                    .setDepth(5)
                    .play("finishPortal");
            }
        });

        
        // --- Activation of the passage to the next level ---
        this.physics.add.overlap(this.player, this.portalZones, () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start("level3");
            });
        }, null, this);
    }
}

export default Level2;