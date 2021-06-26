var scene_key = 'scene_dialog';

const DIALOG_COLOR = '#3050C8';
const LINE_SIZE = 37;

const TEXT_CONFIG = { fontFamily: 'pkmn', color: DIALOG_COLOR, fontSize: '10px' };

const BORDER = 5; //thickness of the border
const FONT_SIZE = 10;
const FONT_WIDTH = 6; 
const INTERSPACE = 6; //space between two lines
const LINE_HEIGHT = 16; //font size + interspace
const VERTICAL_OFFSET = 9; //blank between top border and first line
const HORIZONTAL_OFFSET = 16; //blank between left border and first line

export var SceneDialog = new Phaser.Class({

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

        console.log(data);
    },

    preload: function () {      
        this.canvas = this.sys.game.canvas;
        this.load.image('text_box', 'menus/text_box.png');
        this.load.image('yes_or_no', 'menus/yes_or_no.png');
        this.load.image('select', 'menus/select.png');

        this.load.spritesheet('waiting_arrow', 'menus/arrow_wait.png',
            {frameWidth: 10, frameHeight: 10} );
        //make the border transparent
    },

    create: function () {
        var box = this.physics.add.image(this.canvas.width/2, this.canvas.height, 'text_box').setOrigin(0.5, 1);

        this.x = box.x - box.width/2 + this.horizontalOffset;
        this.y = box.y - box.height + this.verticalOffset - 3; //3 is the transparent space under the text box
    
        //We get the text as an array of lines to display
        this.data.text = this.processText(this.data.text);

        this.first_line = this.add.text(this.x, this.y, this.data.text[0], 
                    TEXT_CONFIG);
        this.lines_read = 1;
        
        var arrow_x = this.x + this.first_line.width;
        var arrow_y = this.y;

        //If there's a second line to display
        if (this.data.text[1] != undefined) {
            this.y += this.line_height;
            this.second_line = this.add.text(this.x, this.y, this.data.text[1],
                    TEXT_CONFIG);

            this.lines_read++;

            arrow_y = this.y;
            arrow_x = this.x + this.second_line.width;
        }

        //If there's still more to come
        if (this.lines_read < this.data.text.length) {
            this.arrow = this.physics.add.sprite(arrow_x, arrow_y, 'waiting_arrow').setOrigin(0,0);
        
            this.anims.create({
                key: 'waiting',
                frames: this.scene.scene.anims.generateFrameNumbers('waiting_arrow', { frames: [ 0, 1, 2, 1 ] }),
                frameRate: 4,
                repeat: -1
            });

            this.arrow.play("waiting");
        }

        //TODO : should not appear on the second line when there's no text

        // x = x + this.border;
        // y = y + 8 + (this.choice-1)*(this.interspace + this.fontSize);


        this.input.keyboard.on("keydown", (key) => {

            //Next line or ends the scene
            if (key.code == 'Space') {

                //If there's more text to display
                if (this.lines_read < this.data.text.length) {
                    this.first_line.setText(this.data.text[this.lines_read]);
                    this.lines_read++;

                    //If the text contains 2 lines
                    if (this.lines_read < this.data.text.length) {
                        this.second_line.setText(this.data.text[this.lines_read]);
                        this.lines_read++;
                    }

                    //Only one
                    else {
                        this.second_line.setVisible(false);

                        this.arrow.x = this.x + this.first_line.width;
                        this.arrow.y = this.first_line.y;
                    }
                }
                else if (this.data.confirm && !this.hasConfirmed) {
                    this.scene.pause();
                    this.scene.launch('scene_choice', {origin_scene: this });
                }
                else {
                    this.scene.stop(scene_key);
                    this.scene.resume(this.data.origin_scene, {level: 0});
                }
            }
        });

        //2 parameters necessary to pass data on resume
        this.events.on('resume', (scene, data) => {
            if (data.choice) {
                scene.scenePlugin.stop(scene_key);
                console.log(this.data);
                scene.scenePlugin.resume('scene_voltorb',
                 { level: Math.min(this.data.level + 1, this.data.level_max) } );
            }
            else {
                this.cameras.main.fadeOut(200);

                this.cameras.main.on('camerafadeoutcomplete', function (c) {
                    // data.scene.scene.stop();
        }, this);
            }
        });
    },

    update: function (time, delta)
    {
        //this.pic.rotation += 0.01;
    },

    typeText: function(text, x, y) {
        var line = [];
        var nb_chars = text.length;

        for (var i = 0; i < nb_chars; i++) {
            line.push(this.add.text(x, y, text.charAt(i), 
                    { fontFamily: 'pkmn', color: DIALOG_COLOR, fontSize: this.fontSize + 'px' }));
            x += this.font;
        }
    },

    processText: function(text) {
        var textTab = [];
        var lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length < LINE_SIZE) {
                textTab.push(lines[i]);
            }
            else {
                var nb_char = 0;
                var words = lines[i].split(' ');
                var line = new String();


                for (var j = 0; j < words.length; j++) {

                    if (nb_char + words[j].length < LINE_SIZE) {
                        line += words[j] + " ";
                        nb_char += words[j].length + 1; //word length + space
                    }
                    else {
                        textTab.push(line);
                        line = words[j] + " ";
                        nb_char = words[j].length + 1;
                    }
                }
                textTab.push(line);
            }
        }

        // if (text.length < LINE_SIZE) {
        //     textTab.push(text);
        // }
        // else {
        //     // var i = 0;
        //     // while (i < text.length) {
        //     //     textTab.push(text.slice(i, i + LINE_SIZE));
        //     //     i += LINE_SIZE;
        //     // }
        //     var words = text.split(' ');
        //     var nb_char = 0;
        //     while (words)
        // }

        return textTab;
    },

});

