class BonusRunnerScene extends Phaser.Scene {
    constructor() {
        super("bonusRunner");
    }

    create() {
        // --- Sound setup ---
        this.sound.unlock();
        this.sound.stopAll(); 
        this.bgMusic = this.sound.add("bgMusic4", { loop: true, volume: 0.4 });
        this.bgMusic.play();
        this.jumpSound = this.sound.add("jump");
        this.dieSound = this.sound.add("die");

        // --- basic setup ---
        this.speed = 200;
        this.enemySpeed = 280;
        this.score = 0;
        this.isDying = false;

        // --- Background layers ---
        this.bg1 = this.add.tileSprite(400, 200, 800, 600, "bgSky1").setScrollFactor(0);
        this.bg = this.add.tileSprite(400, 500, 800, 600, "bgSky").setScrollFactor(0);

        // --- Player setup ---
        this.player = this.physics.add.sprite(100, 400, "ghost");
        this.player.play("float");
        this.player.setGravityY(500);
        this.player.setCollideWorldBounds(true);

          // --- Groups ---
        this.souls = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group({ allowGravity: false });

        // --- Ground setup ---
        this.ground = this.add.tileSprite(400, 450, 800, 64, "ground1");
        this.ground1 = this.add.sprite(400, 545, "ground2");
        this.physics.add.existing(this.ground, true); // true = static body
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.enemies, this.ground);
        this.ground.tilePositionX += 4;


        // --- Colliders and overlap ---
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.enemies, this.ground);
        this.physics.add.overlap(this.player, this.souls, this.collectSoul, null, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemyPlayer, null, this);

        // --- Controls ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // --- Score UI ---

        this.add.text(20, 20, "Bonus endless Runner", {  fontSize: "20px", color: "#fff" });
        this.scoreText = this.add.text(20, 50, "Score: 0", { fontSize: "20px", color: "#ffffff" });

        // --- Timed spawns ---
        this.time.addEvent({ delay: 1300, loop: true, callback: this.spawnSoul, callbackScope: this });
        this.time.addEvent({ delay: 3000, loop: true, callback: this.spawnEnemy, callbackScope: this });

        // --- Increase enemies speed withe the time ---
        this.time.addEvent({
            delay: 20000, 
            loop: true,
            callback: () => {
                this.enemySpeed += 20;
                if (this.enemySpeed > 450) this.enemySpeed = 500; 
            }
        });
    }

    update() {
        if (this.isDying) return;

        // --- Scroll backgrounds and ground ---
        this.ground.tilePositionX += 4;
        this.bg.tilePositionX += 4;
        this.bg1.tilePositionX += 4;

        // --- Move left/right ---
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-100);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(100);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // --- Jumping ----
        if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.blocked.down) {
            this.player.setVelocityY(-430);
            this.jumpSound.play();
        }

        // --- Shooting ---
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fireSoul();
        }

    }

    // --- Spawn a floating soul ---
    spawnSoul() {
    const y = Phaser.Math.Between(290, 400); 
        const soul = this.souls.create(850, y, "soul");
        soul.setVelocityX(-230);         
        soul.setScale(1.2);
        soul.play("soulMove");
    }

    // --- Spawn an enemy from the right ---
    spawnEnemy() {
        const enemy = this.enemies.create(850, 385, "enemy");
        enemy.setVelocityX(-this.enemySpeed);
        enemy.setFlipX(true);
        enemy.setScale(0.6)
        enemy.play("enemyWalk");
        enemy.setCollideWorldBounds(false);
    }

    //--- Collectt soul ---
    collectSoul(player, soul) {
        soul.destroy();
        GameState.soulAmmo += 1;
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }

     // --- Shoot soul projectile ---
    fireSoul() {
        if (GameState.soulAmmo <= 0) return;
        GameState.soulAmmo--;

        const x = this.player.x + 20;
        const y = this.player.y;
        const soul = this.projectiles.create(x, y, "soul");
        soul.setVelocityX(400);
        soul.setScale(0.7);
        soul.play("soulMove");
    }

    // --- Hit enemy with soul ---
    hitEnemy(soul, enemy) {
        soul.destroy();
        enemy.play("enemyDie");
        this.time.delayedCall(400, () => enemy.destroy());
        this.score += 20;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    // --- Player hit by enemy ---
    hitEnemyPlayer(player, enemy) {
        if (this.isDying) return;
        this.isDying = true;
        this.player.play("ghostDie");
         this.dieSound.play();
        this.player.setVelocity(0);
        this.physics.pause();
        this.time.delayedCall(1000, () => {
            this.scene.start("gameOver");
        });
    }
}
export default BonusRunnerScene;
