class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                       // Packed tilemap
        this.load.image("autumn_tilemap_tiles", "autumn_tilemap_packed.png");
        this.load.image("bgTilemap_tiles", "tilemap-backgrounds_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON
        this.load.tilemapTiledJSON("autumn-level", "autumn-level.tmj");
        this.load.tilemapTiledJSON("winterLevel", "winterLevel.tmj");
        this.load.tilemapTiledJSON("spring", "spring.tmj");

        this.load.audio("coin", "toggle_001.ogg");
        this.load.audio("power", "powerUp7.ogg");
        this.load.audio("collect", "threeTone2.ogg");
        this.load.audio("walk", "footstep_concrete_003.ogg");
        this.load.audio("jump", "phaseJump3.ogg");
        this.load.audio("bigJump", "phaseJump2.ogg");
        this.load.audio("land", "footstep_grass_003.ogg");
        this.load.audio("goal", "phaserUp7.ogg");
        this.load.audio("drown", "impactPlate_heavy_001.ogg");
        

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet("bgTilemap_sheet", "tilemap-backgrounds_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.multiatlas("kenny-particles", "kenny-particles.json");
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("autumnScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}