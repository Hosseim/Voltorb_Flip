import {SceneDialog} from './scene_dialog.js';
import {SceneChoice} from './scene_choice.js';

const scene_key = 'scene_voltorb';

const BACKGROUND_COLOR = '28a068';

const BORDER = 6;
const SQUARE = 28;
const INTERSPACE = 4;
const NB_COLUMNS = 5;
const NB_ROWS = 5;

const NB_VOLTORBS_GAME = 6;


const ALPHABET = {FRAMEWIDTH: 6, FRAMEHEIGHT: 13};

const OPEN_MEMO_POS = {X: 198, Y: 10};
const OPEN_MEMO_SIZE = {X: 52, Y: 60};

const MEMO_POS = {X: 198, Y: 76};
const MEMO_TILE_POS = [
    {X: 202, Y: 80},
    {X: 226, Y: 80},
    {X: 202, Y: 104},
    {X: 226, Y: 104}
];

const MEMO_BORDER = 4;
const MEMO_TILE_SIZE = 24;
// const MEMO_SIZE = {X: 198, Y: 76};

const FIRST_DIGIT_NB_PTS = {X: -3, Y: -12};
const SECOND_DIGIT_NB_PTS = {X: 5, Y: -12};
const NB_VOLTORBS_INDEX = {X: 5, Y: 1};

var SceneVoltorb = new Phaser.Class ({

    Extends: Phaser.Scene, 

    initialize: function SceneVoltorb() {
        Phaser.Scene.call(this, { key: 'scene_voltorb' });
    },

    init: function(data) {
        this.data = data;
        if (this.data.level != null) {
            this.level = this.data.level;
        }
        else {
            this.level = 1;
        }
        // this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

        this.grid = [];
        for (var i = 0; i <= NB_ROWS; i++) {
            this.grid[i] = [];
            for (var j = 0; j <= NB_COLUMNS; j++) {
                this.grid[i][j] = {
                    value: 1,
                    memo: [],
                    status: 0,
                }
            }
        }
        //tiles being animated 
        this.tiles_to_process = [];

        this.score = 1;
        this.level_max = this.level;

        this.nb_flipped = 0;

        this.id_dialog = 0;
        this.busy = false;
    },

    preload: function() {
        this.canvas = this.sys.game.canvas;

        this.load.spritesheet('alphabet_white_5', 'alphabets/alphabet_white_5.png', {frameWidth: 5, frameHeight: 8});
        this.load.spritesheet('alphabet_white_6', 'alphabets/alphabet_white_6.png', {frameWidth: ALPHABET.FRAMEWIDTH, frameHeight: ALPHABET.FRAMEHEIGHT});
        this.load.spritesheet('alphabet_grey_5', 'alphabets/alphabet_grey_5.png', {frameWidth: 5, frameHeight: 8});
        this.load.spritesheet('alphabet_grey_6', 'alphabets/alphabet_grey_6.png', {frameWidth: ALPHABET.FRAMEWIDTH, frameHeight: ALPHABET.FRAMEHEIGHT});

        this.load.image('main', 'voltorb_flip.png');
        this.load.image('atlas2', 'atlas.png');
        this.load.atlas('atlas', 'atlas.png', 'atlas.json');
        this.load.atlas('atlas_anim', 'atlas_anim.png', 'atlas.json');

        this.load.spritesheet('digits', 'digits.png',
            {frameWidth: 6, frameHeight: 8});

        this.load.json('distribution', 'distribution.json');
        this.load.json('animations', 'animations.json');

    },

    create: function() {

        this.main = this.physics.add.image(0,0, 'main').setOrigin(0,0);

        var distribution = this.cache.json.get('distribution');
        this.animations = this.cache.json.get('animations');
        this.level_max = distribution.length - 1;
        
        this.nb_total_tils = this.getRandomDistribution(distribution);
        this.distrib = { 0: this.nb_total_tils[0], 2: this.nb_total_tils[2], 3: this.nb_total_tils[3] };

        this.setValue(2, this.distrib[2]);
        this.setValue(3, this.distrib[3]);
        this.setValue(0, this.distrib[0]);


        for (var i = 0; i <= NB_COLUMNS; i++) {
            for (var j = 0; j <= NB_ROWS; j++) {
                var x = BORDER + i*(SQUARE + INTERSPACE) + SQUARE/2;
                var y = BORDER + j*(SQUARE + INTERSPACE) + SQUARE/2;

                var t = this.grid[i][j];
                t.x = x;
                t.y = y;

                t.sprite = this.physics.add.sprite(x, y, 'atlas', 'tile_' + t.value);
                t.sprite.setVisible(false);
                t.sprite.setDepth(3);

                t.flipping_number = this.physics.add.sprite(x, y, 'atlas', 'flip_' + t.value);
                t.flipping_number.setVisible(false);

                t.spark = this.physics.add.sprite(t.x, t.y, 'atlas_anim', 'spark_1');
                t.spark.setVisible(false);
                t.spark.setDepth(4);
                t.frame = 0;

                if (t.value == 0) {
                    t.explode = this.physics.add.sprite(t.x, t.y, 'atlas_anim', 'explode_1');
                    t.explode.setVisible(false);
                    t.explode.setDepth(4);
                }
            }
        }

        //Count each row and column value and nb of voltorb/bombs
        for (var i = 0; i < NB_COLUMNS; i++) {
            var sum_pts = 0, sum_v = 0;

            if (this.data.restart) {
                for (var j = 0; j < NB_ROWS; j++) {
                    this.grid[i][j].playable = (i != NB_COLUMNS && j != NB_ROWS);
                    this.grid[i][j].hidden = (i != NB_COLUMNS && j != NB_ROWS);

                    if (this.grid[i][j].value == 0) {
                        sum_v++;
                    }
                    else {
                        sum_pts += this.grid[i][j].value;
                    }
                }
            }

            this.grid[i][NB_ROWS].nb_voltorbs = sum_v;
            this.grid[i][NB_ROWS].nb_pts = sum_pts;

            this.addIndexes(i, NB_ROWS); 
        }

        for (var j = 0; j < NB_ROWS; j++) {
            var sum_pts = 0, sum_v = 0;

            if (this.data.restart) {
                for (var i = 0; i < NB_COLUMNS; i++) {
                    if (this.grid[i][j].value == 0) {
                        sum_v++;
                    }
                    else {
                        sum_pts += this.grid[i][j].value;
                    }
                }
            }
            this.grid[NB_COLUMNS][j].nb_voltorbs = sum_v;
            this.grid[NB_COLUMNS][j].nb_pts = sum_pts;

            this.addIndexes(NB_COLUMNS, j);
        }

        //Set the start menu and the dialog
        if (!this.data.restart) {

            this.options = [
                    "Play",
                    // "Informations",
                    "Quit"
                ];

            var dialog = [];

            dialog.push({
                text: "Play Voltorb Flip level 1?", 
                selection_type: 0, //No selection
                handler: null,
            });

            var data_dialog = {
                text: 'Play Voltorb Flip level ' + this.level + '?',
                // confirm: false,
                options: this.options,
                origin_scene: this,
                level: 1,
                restart: false,
                dialog: dialog
            };

            var dialog_scene = this.scene.add('scene_dialog', SceneDialog, false, data_dialog);

            this.scene.pause();
            this.scene.launch('scene_dialog', data_dialog);
        }

        //Set and highlight the current active tile to flip
        this.current = {i: 0, j: 0};
        this.highlight = this.physics.add.sprite(
            this.grid[0][0].x,
            this.grid[0][0].y,
            'atlas', 'highlight_red'
            );
        this.highlight.setDepth(2);


        this.highlight_memo = this.physics.add.image(
            this.highlight.x, 
            this.highlight.y,
            'atlas',
            'highlight_yellow'
            );
        this.highlight_memo.setDepth(2);
        this.highlight_memo.setVisible(false);

        var border = 4;
        //add memo box
        this.memo = this.physics.add.sprite(MEMO_POS.X, MEMO_POS.Y, 'atlas', 'memo_box').setOrigin(0,0);
        this.memo.is_open = false;

        this.memo.tiles = [];

        for (var k = 0; k < 4; k++) {
            this.memo.tiles.push(
                this.physics.add.sprite(MEMO_TILE_POS[k].X, MEMO_TILE_POS[k].Y, 'atlas', 'tile_' + k + '_memo').setOrigin(0,0)
            );
            this.memo.tiles[k].setVisible(false);
        }
        this.memo.setVisible(this.memo.is_open);

        //Add memo numbers and set them invisible
        const tile_border = 3;
        for (var i = 0; i < NB_COLUMNS; i++) {
            for (var j = 0; j < NB_ROWS; j++) {
                var x0 = this.grid[i][j].x;
                var x1 = this.grid[i][j].x + SQUARE - tile_border;
                var y0 = this.grid[i][j].y;
                var y1 = this.grid[i][j].y + SQUARE - tile_border;
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'atlas', 'index_0_memo').setOrigin(1,1));
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'atlas', 'index_1_memo').setOrigin(0,1));
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'atlas', 'index_2_memo').setOrigin(1,0));
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'atlas', 'index_3_memo').setOrigin(0,0));

                for (var k = 0; k < 4; k++) {
                    this.grid[i][j].memo[k].setVisible(false);
                }
            }
        }

        const gameOver = this.loseGame;

        const clickOnTile = (x, y) => {

            console.log("(" + x + ", " + y + ")");

            //Clicking on "OPEN MEMO"
            if (x > OPEN_MEMO_POS.X && x < OPEN_MEMO_POS.X + OPEN_MEMO_SIZE.X 
                && y > OPEN_MEMO_POS.Y && y < OPEN_MEMO_POS.Y + OPEN_MEMO_SIZE.Y) {

                //TODO: Add click animation and modify label "open/close"
                //NOT ON ALREADY DISCOVERED TILES ?
                this.memo.is_open = !this.memo.is_open;

                if (this.memo.is_open) {
                    this.highlight.setVisible(false);
                    this.highlight_memo.setVisible(true);

                    this.memo.setVisible(true);
                    this.highlight_memo.x = this.grid[this.current.i][this.current.j].x;
                    this.highlight_memo.y = this.grid[this.current.i][this.current.j].y;

                    for (var k = 0; k < 4; k++) {
                        var v = this.grid[this.current.i][this.current.j].memo[k].visible;
                        this.memo.tiles[k].setVisible(v);
                    }
                }
                else {
                    for (var k = 0; k < 4; k++) {
                        this.memo.tiles[k].setVisible(false);
                    }
                    this.highlight_memo.setVisible(false);
                    this.highlight.setVisible(true);
                    this.memo.setVisible(false);
                }
            }

            //Clicking on memos
            //TODO: add possibility to select several tiles at the same time with Ctrl
            else if (this.memo.is_open && x > MEMO_POS.X && x < MEMO_POS.X + this.memo.width 
                && y > MEMO_POS.Y && y < MEMO_POS.Y + this.memo.height) {
                //Identify which 

                var i = this.current.i;
                var j = this.current.j;

                if (!this.grid[i][j].hidden) {
                    return;
                }
                for (var k = 0; k < 4; k++) {
                    if (x > MEMO_TILE_POS[k].X && x < MEMO_TILE_POS[k].X + MEMO_TILE_SIZE &&
                        y > MEMO_TILE_POS[k].Y && y < MEMO_TILE_POS[k].Y + MEMO_TILE_SIZE) {

                        var v = this.grid[i][j].memo[k].visible;

                        this.grid[i][j].memo[k].setVisible(!v);

                        this.memo.tiles[k].setVisible(!v);
                        return;
                    }
                }
            }

            //Clicking on a tile
            else {
                for (var i = 0; i < NB_COLUMNS; i++) {
                    for (var j = 0; j < NB_ROWS; j++) {
                        if (x >= this.grid[i][j].x - SQUARE/2 && x < this.grid[i][j].x + SQUARE/2
                            && y >= this.grid[i][j].y - SQUARE/2 && y < this.grid[i][j].y + SQUARE/2
                            && !(i == this.grid.length - 1 && j == this.grid[i].length - 1)) {

                            // if (this.memo.is_open && !this.grid[i][j].hidden) {
                            //     return;
                            // }

                            this.initMemoIndexes(i, j);

                            if (!this.memo.is_open) {
                                var tile = this.grid[this.current.i][this.current.j];
                                this.flip(tile);
                            }
                        }
                    }
                }
            }
        }

        this.input.on("pointerdown", (pointer) => {
            if (pointer.leftButtonDown()) {
                clickOnTile(pointer.downX, pointer.downY);
            }

        });

        this.input.keyboard.on("keydown", (key) => {

            switch(key.code) {
                case 'Backspace':
                    console.log("Fin de la scène");
                    this.scene.stop(this.scene.key);
                    // this.scene.resume(this.data.origin_scene);
                    break;

                case 'Enter':
                    var tile = this.grid[this.current.i][this.current.j];
                    this.flip(tile);
                    break;

                case 'Space':
                    var tile = this.grid[this.current.i][this.current.j];
                    this.flip(tile);
                    break;

                //Moving our way around the grid
                case 'ArrowLeft':
                    if (this.current.i == 0) {}
                    else {
                        this.current.i--;
                        this.highlight_memo.x -= (INTERSPACE + SQUARE);
                        this.highlight.x -= (INTERSPACE + SQUARE);

                        if (this.memo.is_open) {
                            for (var k = 0; k < 4; k++) {
                                this.initMemoIndexes(this.current.i, this.current.j);
                            }
                        }
                    }
                    break;

                case 'ArrowUp':
                    if (this.current.j == 0) {}
                    else {
                        this.current.j--;
                        this.highlight_memo.y -= (INTERSPACE + SQUARE);
                        this.highlight.y -= (INTERSPACE + SQUARE);

                        if (this.memo.is_open) {
                            for (var k = 0; k < 4; k++) {
                                this.initMemoIndexes(this.current.i, this.current.j);
                            }
                        }
                    }
                    break;

                case 'ArrowRight':
                    if (this.current.i == NB_COLUMNS - 1) {
                        //
                    }
                    else {
                        this.current.i++;
                        this.highlight_memo.x += (INTERSPACE + SQUARE);
                        this.highlight.x += (INTERSPACE + SQUARE);

                        if (this.memo.is_open) {
                            for (var k = 0; k < 4; k++) {
                                this.initMemoIndexes(this.current.i, this.current.j);
                            }
                        }
                    }
                    break;

                case 'ArrowDown':
                    if (this.current.j == NB_ROWS - 1) {
                        //
                    }
                    else {
                        this.current.j++;
                        this.highlight_memo.y += (INTERSPACE + SQUARE);
                        this.highlight.y += (INTERSPACE + SQUARE);

                        if (this.memo.is_open) {
                            for (var k = 0; k < 4; k++) {
                                this.initMemoIndexes(this.current.i, this.current.j);
                            }
                        }
                    }
                    break;

                default:
                    break;
            }
        });

        this.events.on('resume', (scene, data) => {
            if (data.choice == 0) {
                // this.scene.stop();
                this.scene.restart( 
                {
                    level: Math.min(data.level, this.level_max),
                    restart: true
                });
            }
            else {
                this.cameras.main.fadeOut(100);
                this.cameras.main.on("camerafadeoutcomplete", () => {
                    this.scene.stop();
                });
            }
        });
    },

    //Sets (distrib) random non-attributed tiles to value (value)
    setValue(value, distrib) {
        for (var n = 0; n < distrib; n++) {
            var attributed = false;
            while (!attributed) {
                var i = this.getRandomInt(0, NB_ROWS);
                var j = this.getRandomInt(0, NB_COLUMNS);
                if (this.grid[i][j].value == 1) {
                    this.grid[i][j].value = value;
                    attributed = true;
                }
            }
        }
    },

    update: function(time, delta) {

        for (var i = 0; i < this.tiles_to_process.length; i++) {
            var t = this.tiles_to_process[i];

            switch(t.status) {
                case 0: //idle
                break;

                case 1: //flipping
                var length = this.animations.flip.frames.length;
                if (t.frame < length) {
                    var value = this.animations.flip.frames[t.frame];
                    console.log(value);
                    t.sprite.setVisible(true);
                    var frame = '';
                    if (value == 0) {
                        frame = 'flip_left';
                    }
                    else if (value == 1) {
                        frame = 'flip_middle';
                    }
                    else if (value == 2) {
                        frame = 'flip_right';
                        t.flipping_number.setVisible(true);
                    }
                    else {
                        frame = 'tile_' + t.value;
                        t.flipping_number.setVisible(false);
                    }
                    t.sprite.setFrame(frame);
                    t.frame++;
                }
                else {
                    t.frame = 0;
                    if (this.game_lost) {
                        this.loseGame();
                    }
                    else {
                        if (t.value > 0) {
                            t.status = 2;
                        }
                        else {
                            t.status = 3;
                        }
                    }
                }
                break;

                case 2: //spark

                var length = this.animations.spark.frames.length;
                if (t.frame < length) {
                    var value = this.animations.spark.frames[t.frame];
                    t.spark.setFrame('spark_' + value);
                    t.spark.setVisible(true);
                    t.frame++;
                }
                else {
                    t.spark.setVisible(false);
                    this.score *= t.value;

                    this.distrib[t.value]--;
                    if (this.distrib[2] + this.distrib[3] == 0) {
                        this.winGame();
                    }
                    t.status = 5;
                }
                break;

                case 3: //exploding
                var length = this.animations.explode.frames.length;
                if (t.frame < length) {
                    var value = this.animations.explode.frames[t.frame];
                    t.explode.setFrame('explode_' + value);
                    t.explode.setVisible(true);
                    t.frame++;
                }
                else {
                    t.explode.setVisible(false);
                    this.endLevel();
                    t.status = 5;
                }
                break;

                case 4: //flipping back
                t.status = 5;
                break;

                default:
                this.tiles_to_process.splice(i, 1);
                break;
            }
        }
        
    },

    initMemoIndexes: function(i, j) {

        for (var k = 0; k < 4; k++) {
            this.memo.tiles[k].setVisible(false);
        }
        this.current.i = i;
        this.current.j = j;

        this.highlight_memo.x = this.grid[i][j].x;
        this.highlight_memo.y = this.grid[i][j].y;

        this.highlight.x = this.grid[i][j].x;
        this.highlight.y = this.grid[i][j].y;

        if (this.memo.is_open) {
            for (var k = 0; k < 4; k++) {
                if (this.grid[i][j].memo[k].visible) {
                    this.memo.tiles[k].setVisible(true);
                }
            }
        }
    },

    addIndexes: function(i, j) {
        var fd = this.physics.add.sprite(
            this.grid[i][j].x + FIRST_DIGIT_NB_PTS.X, 
            this.grid[i][j].y + FIRST_DIGIT_NB_PTS.Y,
            'digits').setOrigin(0,0);

        var sd = this.physics.add.sprite(
            this.grid[i][j].x + SECOND_DIGIT_NB_PTS.X, 
            this.grid[i][j].y + SECOND_DIGIT_NB_PTS.Y,
            'digits').setOrigin(0,0);

        if (this.grid[i][j].nb_pts > 9) {
            fd.setFrame(1);
            sd.setFrame(this.grid[i][j].nb_pts - 10);
        }
        else {
            fd.setFrame(0);
            sd.setFrame(this.grid[i][j].nb_pts);
        }

        var nb = this.physics.add.sprite(
            this.grid[i][j].x + NB_VOLTORBS_INDEX.X, 
            this.grid[i][j].y + NB_VOLTORBS_INDEX.Y,
            'digits').setOrigin(0,0);
        nb.setFrame(this.grid[i][j].nb_voltorbs);

    },

    flip: function(tile) {

        tile.status = 1;

        if (tile.hidden) {
            tile.hidden = false;
            tile.status = 1; //flip
            this.tiles_to_process.push(tile);
            this.nb_flipped++;
        }
    },

    winGame: function() {        
        var text = 'Game cleared!';
        var new_level = Math.min(this.level_max, this.level+1); 
        text += '\n\n';
        text += 'Level ' + new_level + '!';
        text += '\n\nPlay Voltorb Flip level ' + new_level + ' ?';
    
        var data = {
            text: text,
            options: this.options,
            origin_scene: this.scene,
            level: new_level,
            restart: true,
        };

        // this.cameras.main.fadeOut(200);
        this.scene.pause();
        this.scene.resume('scene_dialog', data);
    },

    endLevel: function() {
        var dialog = [];
        dialog.push({
            text: "Ligne1\nLigne2\nLigne3", 
            selection_type: 0, //No selection
            handler: null
        });
        this.scene.resume('scene_dialog', {style:1, origin_scene: this, dialog: dialog} );  

    },

    flipAll: function() {
    	for (var i = 0; i < NB_COLUMNS; i++) {
    		for (var j = 0; j < NB_ROWS; j++) {
    			var tile = this.grid[i][j];
    			if (tile.hidden) {
                    this.flip(tile);
    			}
    		}
    	}
        this.game_lost = true;
    },

    loseGame: function() {
        var new_level = Math.max(Math.min(this.level, this.nb_flipped), 1);
        var text = 'Game over!';
        if (new_level < this.level) {
            text += '\n\nThe game is back on level ' + new_level + '!';
        }

        text += '\n\nPlay Voltorb Flip level ' + new_level + '?';

        var options = [
            "Play again",
            "Quit"
        ];
        var dialog = [];
        dialog.push({
            text: text, 
            selection_type: 0, //No selection
            handler: null
        });

        var data = {
            text: text,
            options: this.options,
            origin_scene: this.scene,
            level: new_level,
            restart: true,
            dialog: dialog
        }

        this.scene.pause();
        this.scene.resume('scene_dialog', data);
    },

    getRandomInt: function(min, max) {
        return (Math.floor(Math.random()*max - min));
    },

    getRandomDistribution: function(distribution) {
        var nb_possibilities = distribution[this.level].length;
        var index = Math.floor(Math.random()*nb_possibilities);
        return distribution[this.level][index];
    }
});


const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 192;

//coordinates of the center

var config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'phaser-example',
    physics: {
        default: 'arcade'
    },
    scene: [ SceneVoltorb, SceneChoice ],
};

var game = new Phaser.Game(config);