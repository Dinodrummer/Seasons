class Spring extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 1700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1800;
        this.JUMP_VELOCITY = -600;
        this.walkCool = 15;
        this.walk = 0;
        this.MAX_VELOCITY = 300;
        this.my = {text: {}};
        this.maxJumps = 1; // total jumps allowed (1 = single jump, 2 = double jump (when get powerup))
        this.jumpsRemaining = this.maxJumps;
        this.wasOnGround = false;
        this.movementdisabled = false;
    }

    create() {

        this.map = this.make.tilemap({ key: "spring" });

        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        this.bgTileset = this.map.addTilesetImage("tilemap-backgrounds_packed", "bgTilemap_tiles");

        this.bgLayer = this.map.createLayer("bg", this.bgTileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.platLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.bgLayer.setScrollFactor(0.75); // parallax scrolling
    
        this.groundLayer.setCollisionByProperty({
            Collides: true // ground collision
        });
        this.platLayer.setCollisionByProperty({
            Collides: true // platform collision
        });

        //coin vfx
        let coinParticle = this.add.particles(
            40, 
            40, 
            'kenny-particles', 
            {
                frame: "star_02.png",
                radial: true,
                speed: {min: 50, max: 100},
                lifespan: 300,
                //frequency: 500,
                scale: {start: 0.03, end: 0},
                blendMode: "ADD",
                //maxAliveParticles: 3,
                quantity: 50,
                //gravityY: -50,
                emitting: false,
                stopAfter: 50
            }
        );

        //goal vfx
        let goalParticle = this.add.particles(
            40, 
            40, 
            'kenny-particles', 
            {
                frame: "star_02.png",
                radial: true,
                speed: {min: 50, max: 100},
                lifespan: 600,
                //frequency: 500,
                scale: {start: 0.09, end: 0.03},
                blendMode: "ADD",
                //maxAliveParticles: 3,
                quantity: 70,
                //gravityY: -50,
                emitting: false,
                stopAfter: 70,
                alpha: {start: 1, end: 0}
            }
        );

        //walking vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_02.png'],
            //random: true,
            scale: {start: 0.04, end: 0.001},
            //maxAliveParticles: 40,
            lifespan: 350,
            gravityY: -400,
            alpha: {start: 1, end: 0}, 
            //emitting: false,
        });

        my.vfx.walking.stop();

        //coin handling
        this.coins = this.map.createFromObjects("objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coins);

        //player spawn
        this.spawn = this.map.createFromObjects("objects", {
            name: "spawn",
            key: "tilemap_sheet",
            frame: 157
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawn[0].x, this.spawn[0].y, "platformer_characters", "tile_0000.png");
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 2000);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocityX(this.MAX_VELOCITY);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            coinParticle.start();
            coinParticle.x = obj2.x;
            coinParticle.y = obj2.y;
            this.sound.play("coin", {
                volume: 0.4
            });
            //this.score += this.COIN_VALUE;
            //my.text.score.setText("Score " + this.score);
        });

        //goal handling
        this.goal = this.map.createFromObjects("objects", {
            name: "goal",
            key: "tilemap_sheet",
            frame: 9
        });

        this.physics.world.enable(this.goal, Phaser.Physics.Arcade.STATIC_BODY);
        this.goalGroup = this.add.group(this.goal);

        this.physics.add.overlap(my.sprite.player, this.goalGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            goalParticle.start();
            goalParticle.x = obj2.x;
            goalParticle.y = obj2.y;
            this.sound.play("goal", {
                volume: 0.4
            });

            this.time.delayedCall(1000, () => {
                this.scene.start("win");
            });
            
            //this.score += 500;
            //my.text.score.setText("Score " + this.score);
        });

        //power-up handling
        this.gem = this.map.createFromObjects("objects", {
            name: "power",
            key: "tilemap_sheet",
            frame: 10
        });

        this.physics.world.enable(this.gem, Phaser.Physics.Arcade.STATIC_BODY);
        this.gemGroup = this.add.group(this.gem);

        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            obj2.destroy(); // remove powerup on overlap
            coinParticle.start();
            coinParticle.x = obj2.x;
            coinParticle.y = obj2.y;
            this.maxJumps = 2; // allow double jump
            this.sound.play("power", {
                volume: 0.4
            });
        });

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.platLayer.setCollisionByProperty({
            collides: true
        });

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.10, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(25, 25);
        this.cameras.main.setZoom(1.8);
        
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.platLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        this.physics.world.TILE_BIAS = 30;

        this.rKey = this.input.keyboard.addKey('R');

    }

    update() {
        this.walk++;
        if(cursors.left.isDown) {
            /*
            if(my.sprite.player.body.velocity.x <= 0){
                my.sprite.player.setAccelerationX(-this.ACCELERATION);
            } else my.sprite.player.setDragX(this.DRAG);
            */

            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            if (this.walk > this.walkCool && my.sprite.player.body.blocked.down) {
                this.walk = 0;
                this.sound.play("walk", {
                    volume: 0.5
                });
            }

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }


        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            /*
            if(my.sprite.player.body.velocity.x >= 0){
                my.sprite.player.setAccelerationX(this.ACCELERATION);
            } else my.sprite.player.setDragX(this.DRAG);
             */
            
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            if (this.walk > this.walkCool && my.sprite.player.body.blocked.down) {
                    this.walk = 0;
                    this.sound.play("walk", {
                        volume: 0.5
                    });
                }

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
            

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && !this.wasOnGround) {
            this.jumpsRemaining = this.maxJumps;
        }

        // double jump
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.movementdisabled != true) {
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.jumpsRemaining = this.maxJumps - 1;
                this.sound.play("jump", {
                        volume: 0.5
                });
            } else if (this.jumpsRemaining > 1) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.jumpsRemaining--;
                this.sound.play("bigJump", {
                        volume: 0.5
                });
            }
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        if(my.sprite.player.y > this.map.heightInPixels) {
            this.scene.restart();
        }

    }
}