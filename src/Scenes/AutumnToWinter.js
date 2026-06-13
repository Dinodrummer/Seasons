class AutumnToWinter extends Phaser.Scene {
    constructor() {
        super("autumnToWinter");
    }

    create() {
        this.add.text(game.config.width / 2 - 200, game.config.height / 2 - 50, "Moving from Autumn to Winter...", {
            fontFamily: 'Times, serif',
            fontSize: 100,
            wordWrap: { width: 1000 }
        });

        this.add.text(game.config.width / 2 - 100, game.config.height / 2 + 80, "Press SPACE to continue", {
            fontFamily: 'Times, serif',
            fontSize: 24,
            wordWrap: { width: 1000 }
        });

        this.spaceKey = this.input.keyboard.addKey("SPACE");
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start("autumnScene");
        }
    }
}
