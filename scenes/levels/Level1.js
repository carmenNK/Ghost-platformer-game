class Level1 extends Phaser.Scene { 
    constructor() {
        super("level1");
        this.cursors = null;
    }

    create() {
        // --- Sound setup ---
        this.sound.unlock();
        this.sound.stopAll(); 
        this.bgMusic = this.sound.add("bgMusic1", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");

        // --- Level title and instructions ---
        this.add.text(20, 20, "Level 1");
        this.instruction = this.add.text(150, 200, "Use <- and -> to move, \n up or SPACE to jump", {
            fontSize: "45px",
            color: "#0a3365"
        });

        // --- Load tilemap and layers ---
        const map = this.make.tilemap({ key: "level1" });
        const tileset = map.addTilesetImage("tilesetlevel1", "tiles");
        const layer = map.createLayer("floor", tileset, 0, 280);
        layer.setOrigin(0, 0);
        this.isDying = false;

        // --- Set world and camera bounds ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 280, map.widthInPixels, map.heightInPixels);

        // --- Create player ---
        this.player = this.physics.add.sprite(30, 200, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(true);

        // --- Make the camera follow the player ---
        this.cameras.main.startFollow(this.player);

        // --- Handle floor collisions ---
        layer.setCollisionByProperty({ collides: true });
        this.physics.add.collider(this.player, layer);

        // --- Invisible traps setup (spike zones) ---
        this.spikeZones = this.physics.add.staticGroup();

        // --- Create spikes on tiles marked with "dead" property ---
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

        // --- Player dies if touching spike zone ---
        this.physics.add.overlap(this.player, this.spikeZones, this.hitTrap, null, this);

        // --- Setup portal to finish the level ---
        this.portalZones = this.physics.add.staticGroup();

        // --- Create invisible portal on tile marked with "finish" property ---
        layer.forEachTile(tile => {
            if (tile.properties.finish) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2 + 280;
                const portal = this.portalZones.create(x, y)
                    .setSize(96, 96)
                    .setVisible(false)
                    .setOrigin(0.5);
                portal.refreshBody();

                // --- Add animated portal sprite ---
                const sprite = this.add.sprite(x, y - 25, "endPortal")
                    .setOrigin(0.5)
                    .setScale(0.9)
                    .setDepth(5)
                    .play("finishPortal");
            }
        });

        // --- Trigger fade-out and next level on portal overlap ---
        this.physics.add.overlap(this.player, this.portalZones, () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start("level3");
            });
        }, null, this);

        // --- Alternative level finish handler (redundant call) ---
        this.physics.add.overlap(this.player, this.portalZones, this.reachFinish, null, this);

        // --- Keyboard input setup ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.enabled = true;
    }

    update() {
        // --- Stop updating if player is dying or controls are disabled ---
        if (this.isDying || !this.cursors || !this.input.keyboard.enabled) {
            return;
        }

        // --- Horizontal movement ---
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // --- Jumping logic ---
        if ((this.cursors.up.isDown || this.cursors.space.isDown) && this.player.body.blocked.down) {
            this.player.setVelocityY(-400);
            this.jumpSound.play();
        }
    }

    // --- Handle player death when touching spikes ---
    hitTrap() {
        if (this.isDying) return;
        this.isDying = true;

        this.dieSound.play();
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
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

    // --- Check if tile is a finish portal tile (unused) ---
    isFinishTile(player, tile) {
        return tile.properties.finish === true;
    }

    // --- Transition to Level 2 (redundant, not called directly) ---
    reachFinish() {
        this.scene.start("level2"); 
    }
}
export default Level1;