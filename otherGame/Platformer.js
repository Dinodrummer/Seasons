class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        //this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.MAX_VELOCITY = 200;
        this.LEFT_WALL_JUMP_AVAILABLE = true;
        this.RIGHT_WALL_JUMP_AVAILABLE = true;

    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);


        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        this.backgroundTileset = this.map.addTilesetImage("tilemap-backgrounds_packed", "tilemap_backgrounds");

        // Background first so it renders behind everything
        this.background = this.map.createLayer("Background", this.backgroundTileset, 0, 0);

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.objects = this.map.createFromObjects("Objects", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Create coins from Objects layer in tilemap
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.key = this.map.createFromObjects("Objects", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });

        this.door1 = this.map.createFromObjects("Objects", {
            name: "door1",
            key: "tilemap_sheet",
            frame: 130
        });
        this.door2 = this.map.createFromObjects("Objects", {
            name: "door2",
            key: "tilemap_sheet",
            frame: 110
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.key, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.door1, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.door2, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        this.keyGroup = this.add.group(this.key);
        this.doorGroup = this.add.group([...this.door1, ...this.door2]);
        this.hasKey = false;
        this.gameOver = false;

        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            //maxAliveParticles: 12,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -300,
            alpha: {start: 0.8, end: 0.0},
            frequency: 60,
        }).stop();

        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            //maxAliveParticles: 12,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -300,
            alpha: {start: 0.8, end: 0.0},
            frequency: 60,
        }).stop();

        my.vfx.land = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_09.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            //maxAliveParticles: 12,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -300,
            alpha: {start: 0.8, end: 0.0},
            frequency: 60,
        }).stop();

        ////////////////////
        // TODO: put water bubble particle effect here
        // It's OK to have it start running
        ////////////////////
        this.waterParticles = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_01.png', 'circle_02.png'],
            // TODO: Try: add random: true
            random: true,
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            //maxAliveParticles: 12,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -300,
            alpha: {start: 0.8, end: 0.0}, 
            emitZone: {
                type: 'random',
                source: {
                getRandomPoint: (point) => {
                    let tile = Phaser.Utils.Array.GetRandom(this.waterTiles);
                    if (!tile) return;
                    point.x = tile.pixelX + Phaser.Math.Between(0, tile.width);
                    point.y = tile.pixelY + Phaser.Math.Between(0, tile.height);
                }
                }
            },
            frequency: 100,
            tint: 0x20D7E8,
            
        });

        // Audio
        my.sprite.jumpNoise = this.sound.add("jump");
        my.sprite.walkNoise = this.sound.add("walk", {
            loop: true,
            volume: 0.3,

        });
        this.coinGetNoise = this.sound.add("coin");
        this.keyGetNoise = this.sound.add("key");
        this.winNoise = this.sound.add("win");
        this.loseNoise = this.sound.add("lose");

        this.music = this.sound.add("music", {
            loop: true,
            volume: 0.5
        });
        
        this.music.play();

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocityX(this.MAX_VELOCITY);
        my.sprite.player.body.gravityY = config.physics.arcade.gravity.y;

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: create coin collect particle effect here
        // Important: make sure it's not running
        this.coinCollectParticles = this.add.particles(0,0,"kenny-particles", {
            frame: "spark_01.png",
            speed: { min: -150, max: 150 },
            scale: { start: 0.02, end: 0.0 },
            lifespan: 500,
            tint: 0xFFD700,
            emitting: false
        }).setDepth(2);

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coinCollectParticles.explode(15,obj2.x,obj2.y)
            this.sound.add("coin").play();
            obj2.destroy(); 

            if (this.pauseParticles) {
                this.time.delayedCall(500, () => {   // 500 ms after particles trigger, adjust as needed
                    this.scene.pause();
                    setTimeout(() => this.scene.resume(), 3000); // 3 seconds to grab your screenshot
                    this.pauseParticles = false;
                });
            }
        });

        this.physics.add.overlap(my.sprite.player, this.keyGroup, (player, key) => {
            key.destroy();
            this.keyGetNoise.play();
            this.hasKey = true;
        });

        this.physics.add.overlap(my.sprite.player, this.doorGroup, (player, door) => {
            if (this.hasKey && !this.gameOver) {
                this.gameOver = true;
                this.music.stop();
                this.winNoise.play();
                this.showWinScreen();
            }
        });

        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            if (this.physics.world.drawDebug) {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic?.destroy();
            } else {
                this.physics.world.drawDebug = true;
                this.physics.world.createDebugGraphic();
            }
        }, this);

        // toggle flag used for pause on striking a particle
        this.pauseParticles = false;
        this.input.keyboard.on('keydown-P', () => {
            this.pauseParticles = !this.pauseParticles;
        });

        // TODO: Add creation of movement vfx here
        

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        this.ground = 1;

    }

    update() {
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        if (this.gameOver) return;
        // Wall Jumping
        if(my.sprite.player.body.velocity.x != 0 && my.sprite.player.body.blocked.down){
            if (!my.sprite.walkNoise.isPlaying) my.sprite.walkNoise.play();
        } else my.sprite.walkNoise.stop();
        if(my.sprite.player.body.blocked.left){
            //my.sprite.player.body.setGravityY(-1300);
            my.sprite.player.body.velocity.y *= 0.85;
            if(!my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.LEFT_WALL_JUMP_AVAILABLE == true){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                my.sprite.player.body.setVelocityX(200);
                this.RIGHT_WALL_JUMP_AVAILABLE = true;
                this.LEFT_WALL_JUMP_AVAILABLE = false;
            }
        } else if (my.sprite.player.body.blocked.right){
            //my.sprite.player.body.setGravityY(-1300);
            my.sprite.player.body.velocity.y *= 0.85;
            if(!my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.RIGHT_WALL_JUMP_AVAILABLE == true){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                my.sprite.player.body.setVelocityX(-200);
                this.RIGHT_WALL_JUMP_AVAILABLE = false;
                this.LEFT_WALL_JUMP_AVAILABLE = true;
            }
        }
        // Left movement
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            
            if(my.sprite.player.body.velocity.x > 0) {   
                my.sprite.player.body.velocity.x *= 0.97;
            }
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            } else{
                my.vfx.walking.stop();
            }
        
        // Right movement
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            if(my.sprite.player.body.velocity.x < 0) {  
                my.sprite.player.body.velocity.x *= 0.97;
            }
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            } else{
                my.vfx.walking.stop();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            this.ground = 0;
        } else{
            if(this.ground == 0){
                my.vfx.land.explode(3, my.sprite.player.body.x + 10, my.sprite.player.body.y + 20)
            }
            this.ground = 1;
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.jumpNoise.play();
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jump.explode(3, my.sprite.player.body.x + 10, my.sprite.player.body.y + 20)
            this.LEFT_WALL_JUMP_AVAILABLE = true;
            this.RIGHT_WALL_JUMP_AVAILABLE = true;
        }
        if(Phaser.Input.Keyboard.JustUp(cursors.up) && my.sprite.player.body.velocity.y < 0) {
            my.sprite.player.body.velocity.y *= 0.4;  // cut upward speed on release
        }

        if (!this.gameOver) {
            let waterTile = this.groundLayer.getTileAtWorldXY(my.sprite.player.x, my.sprite.player.y);
            if (waterTile && waterTile.properties.water) {
                this.gameOver = true;
                this.music.stop();
                this.loseNoise.play();
                this.showLoseScreen();
            }
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    showWinScreen() {
        this.gameOver = true;
        my.sprite.player.setAccelerationX(0);
        my.sprite.player.setVelocity(0, 0);
        my.sprite.player.setActive(false).setVisible(false);

        this.add.rectangle(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000, 0.6
        ).setScrollFactor(0);

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            "You Win!",
            { fontSize: "32px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            "Press R to restart",
            { fontSize: "16px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);
    }
    showLoseScreen() {
        this.gameOver = true;
        my.sprite.player.setAccelerationX(0);
        my.sprite.player.setVelocity(0, 0);
        my.sprite.player.setActive(false).setVisible(false);

        this.add.rectangle(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000, 0.6
        ).setScrollFactor(0);

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            "You Lose.",
            { fontSize: "32px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            "Press R to restart",
            { fontSize: "16px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);
    }
}