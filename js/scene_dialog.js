const SMALL_UPPERCASES = ['I', 'T', 'Y'];
const SMALL_LOWERCASES = ['f', 'i', 'j', 'k', 'l', 'n', 'r', 's', 't', 'u'];
const ALPHABET = {FRAMEWIDTH: 6, FRAMEHEIGHT: 13};
const LINE_SIZE = 37;

 class DialogBox {

    static writeText(scene, rt, config) {

        var text = config.text;
        var size = config.size; 
        var color = typeof(config.color) != 'undefined' ? config.color : 'grey';
        var originX = typeof(config.originX) != 'undefined' ? config.originX : 0;
        var originY = typeof(config.originY) != 'undefined' ? config.originY : 0;
        

        //if we want to center the text
        if (typeof config.centerText != 'undefined' && config.centerText) {
            if (text.length < rt.width) {
                var diff = rt.width - text.length;
                x += (diff/2);
            }
        }

        var alphabet = 'alphabet_' + color + '_' + size;


        var offset = 0;
        rt.clear();

        rt.beginDraw();

        var x = 0;
        var y = 0;

        for (var c of text) {

            var id;
            var nb = parseInt(c, 10);
            var small;

            //space
            if (c == ' ') {
                x += 5;
                continue;
            }
            //number
            else if (!isNaN(nb)) {
                //id = offset + 26 + nb;
                id = 52 + nb;
                small = (nb == 1);
            }
            else {
                //id = c.toUpperCase().charCodeAt(0) - 65 + offset;
                //small = (c.toUpperCase() == 'I' || c.toUpperCase() == 'T' || c.toUpperCase() == 'Y');

                var code = c.charCodeAt();
                //uppercase
                if (code >= 65 && code <= 90) {
                    id = code - 65;
                    small = SMALL_UPPERCASES.includes(c);
                }
                //lowercase
                else if (code >= 97 && code <= 122) {
                    id = code - 97 + 26;
                    small = SMALL_LOWERCASES.includes(c);
                }
                else if (code == 63) {
                    id = 63; //?
                }
                else if (code == 46) {
                    id = 64; //.
                }
            }

            var sprite = scene.add.sprite(x, y, alphabet).setOrigin(originX, originY).setFrame(id);

            sprite.setVisible(false);
            rt.draw(sprite);

            x += size - (small ? 1 : 0);
        }

        rt.endDraw();

        return rt;
    }


    static createLabel(scene, config) {

        if (typeof config.size == 'undefined') {
            config.size = 5;
        }
        if (typeof(config.color) == 'undefined') {
            config.color = 'grey';
        }
        if (typeof config.originX == 'undefined') {
            config.originX = 0;
        }
        if (typeof config.originY == 'undefined') {
            config.originY = 0;
        }
        if (typeof config.text == 'undefined') {
            config.text = '';
        }

        var text = config.text;
        var x = config.x;
        var y = config.y;

        var height = config.size == 5 ? 8 : 13;

        var width = 0;

        for (var c of text) {
            width += SMALL_LOWERCASES.includes(c) || SMALL_UPPERCASES.includes(c) || c == ' ' ? 5 : 6;
        }

        if (text == '') {
            width = 6*LINE_SIZE;
        }

        var rt = scene.add.renderTexture(x, y, SCREEN_WIDTH, LINE_HEIGHT);
        config.text = 'Placeholder';
        return DialogBox.writeText(scene, rt, config);
    }
}


const SCENE_KEY = 'scene_dialog';

const DIALOG_COLOR = '#3050C8';

const TEXT_CONFIG = { fontFamily: 'pkmn', color: DIALOG_COLOR, fontSize: '10px' };

const BORDER = 5; //thickness of the border
const FONT_SIZE = 10;
const FONT_WIDTH = 6; 
const INTERSPACE = 6; //space between two lines
const ROW_HEIGHT = 16; //font size + interspace
const VERTICAL_OFFSET = 6; //blank between top border and first line
const HORIZONTAL_OFFSET = 16; //blank between left border and first line
const OPTIONS_BOX_WIDTH = 54;

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 192;
//Dialog
const TEXT_BOX_POSITION = {X: 0, Y: 112};
const TEXT_POSITION = {X: 16, Y: 154};
const TEXT_BOX_HEIGHT = 48;
const LINE_HEIGHT = 15; //font size + interspace


export class SceneDialog extends Phaser.Scene {

    constructor() {
        super(SCENE_KEY);
    }

    init(data) {
        this.select_position = {x: 0, y: 0};
        this.initData(data);
    }

    initData(data) {
        this.origin_scene = data.origin_scene;
        this.style = data.style;
        this.dialog = data.dialog;
        this.dialog_line = 0; //block of lines ended by a user choice or the end of the dialog
        this.lines_read = 0; //line as displayed on the screen
    }

    preload() {      
        this.canvas = this.sys.game.canvas;
        this.load.image('text_box', 'dialog_frame.png');

        this.load.spritesheet('waiting_arrow', 'arrow_wait.png',
            {frameWidth: 10, frameHeight: 10} );
    }

    create() {

        if (this.dialog_line > this.dialog.length) {
            return;
        }

        var box;
        box = this.physics.add.image(SCREEN_WIDTH, SCREEN_HEIGHT, 'text_box').setOrigin(1,1);

        this.x = TEXT_POSITION.X;
        this.y = TEXT_POSITION.Y;

        var config = {
            x: TEXT_POSITION.X,
            y: TEXT_POSITION.Y,
            text: '',
            size: 6,
            color: 'grey'
        }

        //this.first_line = this.add.text(this.x, this.y, '', TEXT_CONFIG).setOrigin(0,0);

        this.first_line = DialogBox.createLabel(this, config);
        config.y += LINE_HEIGHT;
        this.second_line = DialogBox.createLabel(this, config);

        //this.first_line = DialogBox.createLabel(this, config);
        //this.second_line = this.add.text(this.x, this.y + 16, '', TEXT_CONFIG).setOrigin(0,0);
        this.arrow = this.physics.add.sprite(this.x, this.y, 'waiting_arrow').setOrigin(0,0);
        //this.first_line.setDepth(2);
        //this.second_line.setDepth(10);

        this.arrow.setVisible(false);

        this.input.on("pointerdown", (pointer) => {
            if (pointer.leftButtonDown()) {
                this.updateText();
            }
        });


        this.events.on('resume', (scene, data) => {
            debugger;
        });

        this.text = this.processText(this.dialog[this.dialog_line].text);
        this.read();
    }

    keyHandler(key) {
        if (key.code == 'Enter') {
            console.log("updating text");
            this.updateText();
        }
    }

    resumeHandler(scene, response) {
        scene.scene.updateText();
    }

    wakeHandler(scene, response) {
        scene.scene.initData(response);
        scene.scene.text = scene.scene.processText(scene.scene.dialog[scene.scene.dialog_line].text);
        scene.scene.read();
    }

    update (time, delta) {
        //this.pic.rotation += 0.01;
    }

    read() {
        //If there's more text to display
        if (this.lines_read < this.text.length) {
            //this.first_line.setText(this.text[this.lines_read]);
            this.setText(this.text[this.lines_read], 1);
            this.lines_read++;

            //If the text contains 2 lines
            if (this.lines_read < this.text.length) {
                //this.second_line.setText(this.text[this.lines_read]);
                this.setText(this.text[this.lines_read], 2);
                this.lines_read++;

                //this.arrow.x = this.x + this.second_line.width;
                //this.arrow.y = this.second_line.y;
                this.arrow.setVisible(true);
            }

            //Only one
            else {
                // this.second_line.setVisible(false);
                this.second_line.clear();

                //this.arrow.x = this.x + this.first_line.width;
                //this.arrow.y = this.first_line.y;
            }

            //If these were the last lines
            if (this.lines_read == this.text.length) {
                this.arrow.setVisible(false);

                switch(this.dialog[this.dialog_line].selection_type) {
                    case 0:
                    if (this.dialog[this.dialog_line].handler != null) {
                        this.dialog[this.dialog_line].handler(this);
                    }
                    break;

                    case 1:
                    this.chooseText();
                    break;

                    case 2:
                    this.choosePokemon();
                    break;

                    case 3:
                    this.chooseItem();
                    break;

                    default:
                    break;

                } 
                this.dialog_line++;
            }
        }
        else {
            this.exit();
        }
    }

    typeText(text, x, y) {
        var line = [];
        var nb_chars = text.length;

        for (var i = 0; i < nb_chars; i++) {
            line.push(this.add.text(x, y, text.charAt(i), TEXT_CONFIG));
            x += this.font;
        }
    }

    setText(text, numLine) {
        if (numLine <= 0 && numLine > 2) {
            return;
        }
        var config = {
            x: TEXT_POSITION.X,
            y: TEXT_POSITION.Y,
            text: text,
            size: 6
        }
        if (numLine == 2) {
            config.y += LINE_HEIGHT;
            this.second_line = DialogBox.writeText(this, this.second_line, config);
        }
        else {
            this.first_line = DialogBox.writeText(this, this.first_line, config);
        }
    }

    processText(text) {
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

        return textTab;
    }

    updateText() {
        if (this.dialog_line < this.dialog.length) {
            //this.lines_read = 0; //line as displayed on the screen
            this.first_line
            this.text = this.processText(this.dialog[this.dialog_line].text);
            this.read();
        }
        else {
            this.exit();
        }
    }

    chooseText() {

        var data = {
            origin_scene: this,
            x: SCREEN_WIDTH,
            y: SCREEN_HEIGHT - TEXT_BOX_HEIGHT,
            width: OPTIONS_BOX_WIDTH,
            items: this.dialog[this.dialog_line].choices,
            handlers: this.dialog[this.dialog_line].handlers,
            originX: 1,
            originY: 1,
            id_menu: 0,
        }
        
        this.scene.pause();
        
        if (this.scene.isSleeping('scene_choice')) {
            this.scene.wake('scene_choice', data);
        }
        else {
            this.scene.launch('scene_choice', data);
        }
    }

    exit(p) {

        console.log("Exit dialog scene");
        this.scene.resume(this.origin_scene, 
            {
                origin_scene: this.scene.key,
                response: p, 
                mode: 0,
                choice: 0,
                level: 1
            }
        );
        this.scene.sleep();
    }
}


