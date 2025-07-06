class Level3 extends Phaser.Scene {
    constructor() {
        super("level3"); 
        this.cursors = null;
    }

    create() {
        this.add.text(20, 20, "Level 3");
    
        this.score = 0;
        this.isDying = false;

        const map = this.make.tilemap({ key: "level3" });
        const tileset = map.addTilesetImage("Tilesetv3", "tiles3");
        this.layer = map.createLayer("floor", tileset, 0, 0);
        this.layer.setCollisionByProperty({ collides: true });

        //this.physics.world.setBounds(800,600 );
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Player
       this.player = this.physics.add.sprite(600, map.heightInPixels - 300, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(false); // wrap-around

        this.physics.add.collider(this.player, this.layer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(0, 0); // ou aucune ligne pour désactiver totalement
        this.cameras.main.setFollowOffset(0, 100); // suit le joueur mais garde un peu de sol visible


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
            const auto = props.autoStart ?? false; // booléen

            this.addMovingPlatform(x, y, "lift", type, id, auto);
        });


        this.physics.add.collider(this.player, this.movingPlatforms);

        //platforms switches
        this.switchZones = this.physics.add.staticGroup();

        const switchObjects = map.getObjectLayer("switches")?.objects || [];

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
            sw.sprite = swSprite;

            // Optionnel : stocker la référence au sprite pour animation plus tard
            sw.sprite = swSprite;

            sw.targetId = props.targetId;
            sw.direction = props.direction || "toggle";
            sw.activated = false;
        });
        this.physics.add.overlap(this.player, this.switchZones, this.activateSwitch, null, this);
        

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
        }

        // Wrap around
        if (this.player.x < 0) {
            this.player.x = this.physics.world.bounds.width;
        } else if (this.player.x > this.physics.world.bounds.width) {
            this.player.x = 0;
        }

        // Mouvement plateformes
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
            platform.minX = x - 50;
            platform.maxX = x + 50;
        } else {
            platform.minY = y - 100;
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
            // Exemple : inverser le sens ou forcer un sens
            if (sw.direction === "toggle") {
                target.direction *= -1;
            } else if (sw.direction === "up") {
                target.direction = -1;
            } else if (sw.direction === "down") {
                target.direction = 1;
            }

            /*/ Animation visuelle si tu veux
            const sprite = this.add.sprite(sw.x, sw.y, "switchAnim").play("switchPressed");
            this.time.delayedCall(500, () => sprite.destroy());*/
        }
    }


}
