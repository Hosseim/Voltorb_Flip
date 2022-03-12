var scene_key = 'scene_choice';

const LINE_SIZE = 37;

const TEXT_CONFIG = { 
	fontFamily: 'pkmn', 
	color: '#FFFFFF', 
	fontSize: '12px',
	textShadow: '2px 0 0 black, -2px 0 0 black, 0 2px 0 black, 0 -2px 0 black, 1px 1px black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
};


const BORDER = 5; //thickness of the border
const FONT_SIZE = 10;
const FONT_WIDTH = 6; 
const INTERSPACE = 6; //space between two lines
const LINE_HEIGHT = 16; //font size + interspace
const VERTICAL_OFFSET = 9; //blank between top border and first line
const HORIZONTAL_OFFSET = 16; //blank between left border and first line

const MENU_ITEM_HEIGHT = 24;

export var SceneChoice = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function SceneDialog() {
        Phaser.Scene.call(this, { key: scene_key });
    },

    init: function(data) {
        this.scale = 1;

        this.border = 5*this.scale;
        this.fontSize = 10*this.scale; //height of a single character in px
        this.fontWidth = 6*this.scale; //width of a single character in px
        this.interspace = 6*this.scale; //space between two lines
        this.line_height = (this.fontSize + this.interspace) * this.scale;
        this.verticalOffset = 9*this.scale; //space betwen top border and first line
        this.horizontalOffset = 16*this.scale; //space betwen top border and first line
        this.select_position = {x: 0, y: 0};

        this.data = data;
    },

    preload: function () {      
        this.canvas = this.sys.game.canvas;
        this.load.image('yes_or_no', 'yes_or_no.png');
        this.load.image('select', 'selection.png');
        this.load.image('menu_item', 'menu_item.png');
        this.load.image('highlight_item', 'highlight_item.png');
        //make the border transparent
    },

    create: function () {
        var x = this.canvas.width - 25;
        var y = this.canvas.height - 45;

        // this.box = this.physics.add.image(x, y, 'yes_or_no').setOrigin(1, 1);

        // this.select = this.physics.add.image(
        //     x - this.box.width + 8,
        //     y - this.box.height + 11,
        //     'select').setOrigin(0,0);

        x = this.canvas.width;
        y = this.canvas.height - 48;

        var nb = this.data.options.length;

        var rect = this.add.rectangle(x, y, 120, 8 + nb*24, 0x73747b).setOrigin(1,1);

        var items = [];

        x = x - rect.width + 4;
        y = y - rect.height + 5;

        this.highlight = this.add.image(x, y, 'highlight_item').setOrigin(0,0);
        this.highlight.setDepth(1);

        for (var i = 0; i < nb; i++) {
        	items.push(this.add.image(x, y, 'menu_item').setOrigin(0,0));
        	var x_text = x + items[i].width/2;
        	var y_text = y + items[i].height/2;
        	this.add.text(x_text, y_text, this.data.options[i], 
                    TEXT_CONFIG).setOrigin(0.5, 0.5);
        	y += MENU_ITEM_HEIGHT;
        }


        this.choice = 0;

        this.input.on("pointerdown", (pointer) => {
        	if (pointer.leftButtonDown()) {
                var x = pointer.downX;
                var y = pointer.downY;

                for (var i in items) {
                	if (x > items[i].x && x < (items[i].x + items[i].width) &&
                		y > items[i].y && y < (items[i].y + items[i].height)) {
                		this.choice = i;
                		this.highlight.y = items[i].y;
                		this.scene.stop();
                		this.scene.resume(this.data.origin_scene.scene.key, {choice: this.choice } );
                		return;
                	}
                }
            }
        });

        this.input.keyboard.on("keydown", (key) => {

            //Next line or ends the scene
            if (key.code == 'Enter' || key.code == 'Space') {
                this.scene.stop();
                this.scene.resume(this.data.origin_scene.scene.key, {choice: this.choice} );
            }
            
            else if (key.code == 'ArrowDown' && this.choice < nb - 1) {
                this.choice++;
                this.highlight.y += MENU_ITEM_HEIGHT;
            }
            else if (key.code == 'ArrowUp' && this.choice > 0) {
                this.choice--;
                this.highlight.y -= MENU_ITEM_HEIGHT;
            }
        });
    },

    update: function (time, delta)
    {
        //this.pic.rotation += 0.01;
    },

});

