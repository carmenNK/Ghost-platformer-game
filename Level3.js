class Level3 extends Phaser.Scene {
    constructor() {
        super("level3"); 
        this.cursors = null;
    }

    create() {
        this.sound.unlock();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");
        this.switchSound = this.sound.add("switch");
        this.teleportSound = this.sound.add("teleportation");
        this.sound.stopAll();
        this.bgMusic = this.sound.add("bgMusic3", { loop: true, volume: 0.4 });
        this.bgMusic.play();

        this.add.text(20, 20, "Level 3");
    
        this.score = 0;
        this.isDying = false;

        const map = this.make.tilemap({ key: "level3" });
        const tileset = map.addTilesetImage("tilesetlevel3b", "tiles3b");
        this.layer = map.createLayer("floor", tileset, 0, 0);
        this.layer.setCollisionByProperty({ collides: true });

        //this.physics.world.setBounds(800,600 );
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Player
        this.player = this.physics.add.sprite(700, map.heightInPixels - 300, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(false); // wrap-around

        this.physics.add.collider(this.player, this.layer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(0, 0); 
        this.cameras.main.setFollowOffset(0, 100); 

        //Enemy
        this.enemies = this.physics.add.group({
            allowGravity: true,
            immovable: false
        });

        const enemy = this.enemies.create(500, map.heightInPixels - 300, "enemy");
        enemy.play("enemyWalk"); 
        enemy.setCollideWorldBounds(true);
        enemy.direction = 1;
        enemy.speed = 40;

        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.collider(this.enemies, this.layer);

    
        // Moving platforms 
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

        //deadLift platforms
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

           // this.addDeadLift(500, map.heightInPixels - 300, "deadLift", "horizontal", auto);

            this.addDeadLift(x, y, "deadLift", type, auto);
        });

        this.physics.add.overlap(this.player, this.deadLifts, this.hitDeadLift, null, this);

        //platforms switches
        this.switchZones = this.physics.add.staticGroup();

        const switchObjects = map.getObjectLayer("switch")?.objects || [];

        switchObjects.forEach(obj => {
            const props = obj.properties.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {});

            const x = obj.x + obj.width / 2;
            const y = obj.y + obj.height / 2;

            // Zone invisible pour la détection
            const sw = this.switchZones.create(x, y)
                .setSize(obj.width, obj.height)
                .setOrigin(0.5)
                .setVisible(false);

            // Sprite animé visible
            const swSprite = this.add.sprite(x, y, "switch");
            swSprite.setFrame(0);             
            swSprite.setDepth(10); 
            sw.sprite = swSprite;

            // Optionnel : stocker la référence au sprite pour animation plus tard
            sw.sprite = swSprite;

            sw.targetId = props.targetId;
            sw.direction = props.direction || "toggle";
            sw.activated = false;
        });
        this.physics.add.overlap(this.player, this.switchZones, this.activateSwitch, null, this);

        // Projectiles group
        this.soulProjectiles = this.physics.add.group({
            allowGravity: false
        });

        // Shoot keyboard
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        this.physics.add.overlap(this.soulProjectiles, this.enemies, this.hitEnemy, null, this);

        

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.isDying) return;

        // 
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
            this.player.setVelocityY(-630);
            this.jumpSound.play();
        }

        // Wrap around
        if (this.player.x < 0) {
            this.player.x = this.physics.world.bounds.width;
        } else if (this.player.x > this.physics.world.bounds.width) {
            this.player.x = 0;
        }

        // Moving platforms
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

        // Moving deadly platforms
        this.deadLifts.getChildren().forEach(platform => {
             platform.activeMovement = true;
            if (!platform.activeMovement) return;
            if (platform.movement === "horizontal") {
                platform.x += platform.direction * platform.speed;
                if (platform.x <= platform.minX || platform.x >= platform.maxX) {
                    platform.direction *= -1;
                }
            } else {
                platform.y += platform.direction * platform.speed;
                if (platform.y <= platform.minY || platform.y >= platform.maxY) {
                    platform.direction *= -1;
                }
            }

            platform.body.updateFromGameObject();
        });

        // Moving enemy
        this.enemies.getChildren().forEach(enemy => {
            enemy.setVelocityX(enemy.direction * enemy.speed);

            // Change direction when hiting the wall
            if (enemy.body.blocked.left) {
                enemy.direction = 1;
                enemy.setFlipX(false);
            } else if (enemy.body.blocked.right) {
                enemy.direction = -1;
                enemy.setFlipX(true);
            }
        });

        // shoot
        
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fireSoul();
        }



    }

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

    /*addDeadLift(x, y, spriteKey, type, autoStart = true) {
        const platform = this.deadLifts.create(x, y, spriteKey);
        platform.setImmovable(true);
        //platform.setSize(96, 64);
        //platform.setDisplaySize(96, 64);
        platform.movement = type;
        platform.direction = 1;
        platform.activeMovement = autoStart;
        platform.speed = 2;

        if (type === "horizontal") {
            platform.minX = x - 60;
            platform.maxX = x + 60;
        } else {
            platform.minY = y ;
            platform.maxY = y ;
        }
    }*/
   addDeadLift(x, y, spriteKey, type, autoStart = true) {
        const platform = this.deadLifts.create(x, y, spriteKey);
        platform.setImmovable(true);
        platform.movement = type;
        platform.direction = 1;
        platform.activeMovement = autoStart ?? true; 
        platform.speed = 2;

        if (type === "horizontal") {
            platform.minX = x - 60;
            platform.maxX = x + 60;
        } else {
            platform.minY = y - 1000;
            platform.maxY = y + 50;
        }
    }

    activateSwitch(player, sw) {
        if (sw.activated) return;
        sw.activated = true;

        if (sw.sprite) {
            sw.sprite.play("switchPressed");
        }

        const target = this.movingPlatforms.getChildren().find(p => p.platformId === sw.targetId);
        target.activeMovement = true;


        if (target) {
            if (sw.direction === "toggle") {
                target.direction *= -1;
            } else if (sw.direction === "up") {
                target.direction = -1;
            } else if (sw.direction === "down") {
                target.direction = 1;
            }
        }
    }

    // Shoot Soul
    fireSoul() {
        if (GameState.soulAmmo <= 0) return; // pas de munitions
        GameState.soulAmmo--;

        const direction = this.player.flipX ? -1 : 1;
        const x = this.player.x + direction * 20;
        const y = this.player.y;

        const soul = this.soulProjectiles.create(x, y, "soul");
        soul.setVelocityX(direction * 300);
        soul.setScale(0.7);
        soul.play("soulMove");

        // auto-destruction hors écran
        soul.setCollideWorldBounds(true);
        soul.body.onWorldBounds = true;
        this.physics.world.on("worldbounds", body => {
            if (body.gameObject === soul) {
                soul.destroy();
            }
        });
    }


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



}
