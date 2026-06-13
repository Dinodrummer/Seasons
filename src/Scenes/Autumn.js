class Autumn extends Phaser.Scene {
    constructor() {
        super("autumnScene");
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
        this.LEFT_WALL_JUMP_AVAILABLE = true;
        this.RIGHT_WALL_JUMP_AVAILABLE = true;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("autumn-level", 18, 18, 30, 80);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        this.bgTileset = this.map.addTilesetImage("tilemap-backgrounds_packed", "bgTilemap_tiles");
        this.autumnTileset = this.map.addTilesetImage("autumn_tilemap_packed", "autumn_tilemap_tiles");

        this.bgLayer = this.map.createLayer("bg", [this.bgTileset, this.autumnTileset], 0, 0);

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tileset, this.autumnTileset], 0, 0);
        //this.groundLayer.setScale(0.5);

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

        //goal handling
        this.goals = this.map.createFromObjects("objects", {
            name: "goal",
            key: "tilemap_sheet",
            frame: 112
        });

        this.physics.world.enable(this.goals, Phaser.Physics.Arcade.STATIC_BODY);
        this.goalGroup = this.add.group(this.goals);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(36, 1368, "platformer_characters", "tile_0000.png");
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 2000);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocityX(this.MAX_VELOCITY);

        this.transLayer = this.map.createLayer("transition", [this.tileset, this.autumnTileset], 0, 0);

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

        this.physics.add.overlap(my.sprite.player, this.goalGroup, () => {
            this.scene.start("autumnToWinter");
        });


        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        

        //this.cameras.main.setBounds(0, 0, 0, 0, my.sprite.player);
        //this.cameras.main.setZoom(1.5);
        //this.cameras.main.setPosition(game.config.width/4, game.config.height/2);
        //this.cameras.main.setScroll(game.config.width/4, game.config.height/2);
        //this.cameras.main.centerOn(game.config.width/4, game.config.height/2);
        //this.cameras.main.startFollow(my.sprite.player, true, 0.5, 0.9, 0, 150);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.10, 0.25);
        this.cameras.main.setDeadzone(540, 50);
        this.cameras.main.setZoom(3.5);
        
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

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

        // Wall jumping
        if(my.sprite.player.body.blocked.left) {
            my.sprite.player.body.velocity.y *= 0.85;
            if(!my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.LEFT_WALL_JUMP_AVAILABLE) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                my.sprite.player.body.setVelocityX(200);
                this.RIGHT_WALL_JUMP_AVAILABLE = true;
                this.LEFT_WALL_JUMP_AVAILABLE = false;
            }
        } else if(my.sprite.player.body.blocked.right) {
            my.sprite.player.body.velocity.y *= 0.85;
            if(!my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.RIGHT_WALL_JUMP_AVAILABLE) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                my.sprite.player.body.setVelocityX(-200);
                this.RIGHT_WALL_JUMP_AVAILABLE = false;
                this.LEFT_WALL_JUMP_AVAILABLE = true;
            }
        }

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
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.LEFT_WALL_JUMP_AVAILABLE = true;
            this.RIGHT_WALL_JUMP_AVAILABLE = true;
            if (this.JUMP_VELOCITY == -600) {
                this.sound.play("jump", { volume: 0.5 });
            } else {
                this.sound.play("bigJump", { volume: 0.5 });
            }
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}