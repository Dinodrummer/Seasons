class Win extends Phaser.Scene {
    constructor() {
        super("win");

        
    }

    preload() {
        this.load.setPath("./assets/");

        
    }

    create() {

        this.add.text(game.config.width/2 - 75, game.config.height/2 + 120, "Press r to restart", {
            fontFamily: 'Times, serif',
            fontSize: 24,
            wordWrap: {
                width: 1000
            }
        });

        this.add.text(game.config.width/2 - 290, game.config.height/2 - 100, "You Win!", {
            fontFamily: 'Times, serif',
            fontSize: 150,
            wordWrap: {
                width: 1000
            }
        });

        this.restart = this.input.keyboard.addKey("R");
    }

    update(time, delta) {
        if (this.restart.isDown) {
            this.scene.start("winterScene");
        }
    }

}