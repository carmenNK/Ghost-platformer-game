class Level3 extends Phaser.Scene {
    constructor() {
        super("level3"); 
        this.cursors = null;
    }

    create() {
        // --- Initialisation of sounds and basic settings ---
        this.sound.unlock();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");
        this.switchSound = this.sound.add("switch");
        this.teleportSound = this.sound.add("teleportation");
        this.sound.stopAll();
        this.bgMusic = this.sound.add("bgMusic3", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.score = 0;
        this.isDying = false;
        this.input.keyboard.enabled = true;

        // --- Loading the map and layers ---
        const map = this.make.tilemap({ key: "level3" });
        const tileset = map.addTilesetImage("tilesetlevel3b", "tiles3b");
        const layer = map.createLayer("floor", tileset, 0, 0);
        layer.setCollisionByProperty({ collides: true });

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- Displaying the instruction ---
         this.instruction = this.add.text(420, map.heightInPixels - 380, "Use the F key to shoot,\n   but be careful, \nyou don't have many souls.",{
                fontSize: "25px",
                color: "#0a3365"
            });

        // --- Player ---
        this.player = this.physics.add.sprite(700, map.heightInPixels - 300, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(false); // wrap-around

        this.physics.add.collider(this.player, layer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(0, 0); 
        this.cameras.main.setFollowOffset(0, 100); 

        // --- HUD souls ---
        this.soulText = this.add.text(20, 50, `Souls: ${GameState.soulAmmo}`, {
            fontSize: "16px",
            color: "#ffffff"
        });
        this.soulText.setScrollFactor(0);

        // --- Enemy ---
        this.enemies = this.physics.add.group({
            allowGravity: true,
            immovable: false
        });

        // --- First enemy ---
        const enemy1 = this.enemies.create(500, map.heightInPixels - 500, "enemy");
        enemy1.play("enemyWalk");
        enemy1.setCollideWorldBounds(true);
        enemy1.direction = 1;
        enemy1.speed = 40;

        // --- Second enemy ---
        const enemy2 = this.enemies.create(400, map.heightInPixels - 1500, "enemy");
        enemy2.play("enemyWalk");
        enemy2.setCollideWorldBounds(true);
        enemy2.direction = -1;
        enemy2.speed = 30;

        // --- Third enemy ---
        const enemy3 = this.enemies.create(200, map.heightInPixels - 2500, "enemy");
        enemy3.play("enemyWalk");
        enemy3.setCollideWorldBounds(true);
        enemy3.direction = 1;
        enemy3.speed = 50;

        this.physics.add.collider(this.player, this.enemies, this.hitDeadLift, null, this);
        this.physics.add.collider(this.enemies, layer);


        // --- Moving platforms ---
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        const platformObjects = map.getObjectLayer("lift").objects;

        platformObjects.forEach(obj => {
            const props = obj.properties.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {});

            const x = obj.x + obj.width / 2;
            const y = obj.y + obj.height / 2;
            const type = props.movement;
            const id = props.platformId;
            const auto = props.autoStart ?? false; 

            this.addMovingPlatform(x, y, "lift", type, id, auto);
        });


        this.physics.add.collider(this.player, this.movingPlatforms);

        // --- deadLift platforms ---
        this.deadLifts = this.physics.add.group({ allowGravity: false, immovable: true });
        const deadLiftObjects = map.getObjectLayer("deadLift")?.objects ;

        deadLiftObjects.forEach(obj => {
            const props = obj.properties?.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {}) || {};

            const x = obj.x + obj.width / 2;
            const y = obj.y + obj.height / 2;
            const type = props.movement || "vertical";
            const auto = props.autoStart ?? true;

            this.addDeadLift(x, y, "deadLift", type, auto);
        });

        this.physics.add.overlap(this.player, this.deadLifts, this.hitDeadLift, null, this);

        // --- platforms switches ---
        this.switchZones = this.physics.add.staticGroup();

        const switchObjects = map.getObjectLayer("switch")?.objects || [];

        switchObjects.forEach(obj => {
            const props = obj.properties.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {});

            const x = obj.x + obj.width / 2;
            const y = obj.y + obj.height / 2;

            // --- Invisible zone for detection ---
            const sw = this.switchZones.create(x, y)
                .setSize(obj.width, obj.height)
                .setOrigin(0.5)
                .setVisible(false);

            // --- Visible animated sprite ---
            const swSprite = this.add.sprite(x, y, "switch");
            swSprite.setFrame(0);             
            swSprite.setDepth(10); 
            sw.sprite = swSprite;

            sw.targetId = props.targetId;
            sw.direction = props.direction || "toggle";
            sw.activated = false;
        });
        this.physics.add.overlap(this.player, this.switchZones, this.activateSwitch, null, this);

        // --- Projectiles ---
        this.soulProjectiles = this.physics.add.group({ allowGravity: false });
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.physics.add.overlap(this.soulProjectiles, this.enemies, this.hitEnemy, null, this);

        // --- finish the level ---
        this.portalZones = this.physics.add.staticGroup();
        layer.forEachTile(tile => {
            if (tile.properties.finish) {
                const x = tile.pixelX + tile.width / 2;
                const y = tile.pixelY + tile.height / 2 ;
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

        this.physics.add.overlap(this.player, this.portalZones, () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start("level3");
            });
        }, null, this);

        this.physics.add.overlap(this.player, this.portalZones, this.reachFinish, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
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
            this.player.setVelocityY(-550);
            this.jumpSound.play();
        }

        // --- Wrap around ---
        if (this.player.x < 0) {
            this.player.x = this.physics.world.bounds.width;
        } else if (this.player.x > this.physics.world.bounds.width) {
            this.player.x = 0;
        }

        // --- Moving platforms ---
        this.movingPlatforms.getChildren().forEach(platform => {
            if (!platform.activeMovement) return;

            if (platform.movement === "horizontal") {
                platform.x += platform.direction * platform.speed;

                if (platform.x <= platform.minX) {
                    platform.x = platform.minX;
                    platform.direction = 1;
                } else if (platform.x >= platform.maxX) {
                    platform.x = platform.maxX;
                    platform.direction = -1;
                }

            } else if (platform.movement === "vertical") {
                platform.y += platform.direction * platform.speed;

                if (platform.y <= platform.minY) {
                    platform.y = platform.minY;
                    platform.direction = 1;
                } else if (platform.y >= platform.maxY) {
                    platform.y = platform.maxY;
                    platform.direction = -1;
                }
            }

            platform.body.updateFromGameObject();
        });

        // --- Deadlifts ---
        this.deadLifts.getChildren().forEach(platform => {
            if (!platform.activeMovement) return;
            if (platform.movement === "horizontal") {
                platform.x += platform.direction * platform.speed;
                if (platform.x <= platform.minX || platform.x >= platform.maxX) platform.direction *= -1;
            } else {
                platform.y += platform.direction * platform.speed;
                if (platform.y <= platform.minY || platform.y >= platform.maxY) platform.direction *= -1;
            }
            platform.body.updateFromGameObject();
        });

        // --- Enemies ---
        this.enemies.getChildren().forEach(enemy => {
            enemy.setVelocityX(enemy.direction * enemy.speed);
            if (enemy.body.blocked.left) {
                enemy.direction = 1;
                enemy.setFlipX(false);
            } else if (enemy.body.blocked.right) {
                enemy.direction = -1;
                enemy.setFlipX(true);
            }
        });

        // --- Fire Soul ---
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fireSoul();
        }

        // --- Update UI ---
        this.soulText.setText(`level 3 | Souls: ${GameState.soulAmmo}`);
    }

    // --- Creates a moving platform ---
    addMovingPlatform(x, y, lift, type, id, autoStart = false) {
        const platform = this.movingPlatforms.create(x, y, lift);
        platform.setImmovable(true);
        platform.setSize(64, 16);
        platform.setDisplaySize(64, 16);
        platform.movement = type;
        platform.platformId = id;
        platform.direction = 1;
        platform.activeMovement = autoStart;
        platform.speed = 1;
        if (type === "horizontal") {
            platform.minX = x - 100;
            platform.maxX = x + 50;
        } else {
            platform.minY = y - 200;
            platform.maxY = y + 40;
        }
    }

    // --- Adds a deadly moving platform ---
   addDeadLift(x, y, spriteKey, type, autoStart = true) {
        const platform = this.deadLifts.create(x, y, spriteKey);
        platform.setImmovable(true);
        platform.setOrigin(0.5);
        platform.movement = type;
        platform.startY = y;
        platform.startX = x;

        if (autoStart) {
            this.activateDeadLiftTween(platform);
        }
    }

    // --- Adds animation to a deadly platform ---
    activateDeadLiftTween(platform) {
        const distance = 220;
        const duration = 2000;

        if (platform.movement === "horizontal") {
            this.tweens.add({
                targets: platform,
                x: platform.startX + distance,
                duration: duration,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1
            });
        } else {
            this.tweens.add({
                targets: platform,
                y: platform.startY - distance,
                duration: duration,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1
            });
        }
    }

    // --- Activates a switch ---
    activateSwitch(player, sw) {
        if (sw.activated) return;
        sw.activated = true;
        if (sw.sprite) sw.sprite.play("switchPressed");
        const target = this.movingPlatforms.getChildren().find(p => p.platformId === sw.targetId);
        if (target) {
            target.activeMovement = true;
            if (sw.direction === "toggle") target.direction *= -1;
            else if (sw.direction === "up") target.direction = -1;
            else if (sw.direction === "down") target.direction = 1;
        }
    }

    // --- Shoots a soul projectile ---
    fireSoul() {
        if (GameState.soulAmmo <= 0) return;
        GameState.soulAmmo--;
        const direction = this.player.flipX ? -1 : 1;
        const x = this.player.x + direction * 20;
        const y = this.player.y;
        const soul = this.soulProjectiles.create(x, y, "soul");
        soul.setVelocityX(direction * 300);
        soul.setScale(0.7);
        soul.play("soulMove");
        soul.setCollideWorldBounds(true);
        soul.body.onWorldBounds = true;
        this.physics.world.on("worldbounds", body => {
            if (body.gameObject === soul) soul.destroy();
        });
    }

    // --- Handles collision between soul and enemy ---
    hitEnemy(soul, enemy) {
        soul.destroy();
        enemy.play("enemyDie");
        this.time.delayedCall(400, () => {
            enemy.disableBody(true, true);
         });
    }

    // --- Player touches a deadly lift or enemy ---
    hitDeadLift(player, platform) {
        if (this.isDying) return;
        this.isDying = true;
        this.dieSound.play();
        player.setVelocity(0);
        this.input.keyboard.enabled = false;
        player.play("ghostDie");
        player.once("animationcomplete", () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start("gameOver");
            });
        });
    }

    // --- Help to identify finish tile ---
     isFinishTile(player, tile) {
        return tile.properties.finish === true;
    }

    // --- Player finishes the level ---
    reachFinish() {
        this.scene.start("endGame"); 
    }
}
export default Level3;