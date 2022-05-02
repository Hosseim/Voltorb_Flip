import {DialogBox} from './scene_dialog.js';
import {SceneDialog} from './scene_dialog.js';
import {SceneChoice} from './scene_choice.js';

const FIRST_TILE_POSITION = {X: 6, Y: 6};
const INTERSPACE = {X: 4, Y: 4};
const TILE_SIZE = {WIDTH: 28, HEIGHT: 28};
const TILE_BORDER = 4;
const NB_ROWS = 5;
const NB_COLUMNS = 5;

const MEMO_INITIAL_POS = {X: 256, Y: 76};
const MEMO_POS = {X: 197, Y: 76};
const MEMO_BUTTON_POS = {X: 197, Y: 9};
const MEMO_TILE_INITIAL_POS = [
    {X: 259, Y: 79},
    {X: 283, Y: 79},
    {X: 259, Y: 103},
    {X: 283, Y: 103}
];
const MEMO_TILE_POS = [
    {X: 200, Y: 79},
    {X: 224, Y: 79},
    {X: 200, Y: 103},
    {X: 224, Y: 103}
];
const MEMO_TILE_SIZE = {X: 24, Y: 24};

const MEMO_LABEL_POS = { X: 210, Y: 35}
const OPEN_MEMO_POS = {X: 198, Y: 10};
const OPEN_MEMO_SIZE = {X: 52, Y: 60};


const FIRST_DIGIT_NB_PTS = {X: -3, Y: -12};
const SECOND_DIGIT_NB_PTS = {X: 5, Y: -12};
const NB_VOLTORBS_INDEX = {X: 5, Y: 1};


var SceneVoltorb = new Phaser.Class ({

    Extends: Phaser.Scene, 

    initialize: function SceneVoltorb() {
        Phaser.Scene.call(this, { key: 'scene_voltorb' });
    },

    init: function(data) {
        this.initData(data);
    },

    initData: function(data) {
        this.data = data;
        this.timer = 0;

        this.level = 1;

        // this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

        //tiles grid
        this.grid = [];
        for (var i = 0; i <= NB_COLUMNS; i++) {
            this.grid[i] = [];
            for (var j = 0; j <= NB_ROWS; j++) {
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

        //nb voltorbs flipped over so far
        this.nb_flipped = 0;
        this.current = {i: 0, j: 0};

        this.id_dialog = 0;
        this.busy = false;
        this.left_to_right_column = 0;
    },

    preload: function() {
        this.canvas = this.sys.game.canvas;

        this.load.image('main', 'assets/voltorb_flip.png');
        this.load.image('atlas', 'assets/atlas.png');
        this.load.atlas('atlas_main', 'assets/atlas.png', 'json/atlas.json');
        this.load.atlas('atlas_anim', 'assets/atlas_anim.png', 'json/atlas.json');

        this.load.spritesheet('digits', 'assets/digits.png',
            {frameWidth: 6, frameHeight: 8});
        this.load.spritesheet('alphabet_white_7', 'menus/alphabets/alphabet_white_7.png',
            {frameWidth: 7, frameHeight: 13} );

        this.load.json('distribution', 'json/distribution.json');
        this.load.json('animations', 'json/animations.json');

    },

    create: function() {

        this.main = this.physics.add.image(0,0, 'main').setOrigin(0,0);

        this.distribution = this.cache.json.get('distribution');
        this.animations = this.cache.json.get('animations');
        this.level_max = this.distribution.length - 1;
           
        var x = FIRST_TILE_POSITION.X;
        var y = FIRST_TILE_POSITION.Y;
        for (var i = 0; i < NB_COLUMNS; i++) {
            for (var j = 0; j < NB_ROWS; j++) {
                
                var t = this.grid[i][j];
                t.x = x + TILE_SIZE.WIDTH/2; //origin centered
                t.y = y + TILE_SIZE.HEIGHT/2; //origin centered

                t.sprite = this.physics.add.sprite(t.x, t.y, 'atlas_main', 'hidden');
                t.sprite.setDepth(2);

                t.spark = this.physics.add.sprite(t.x, t.y, 'atlas_anim', 'spark_1');
                t.spark.setVisible(false);
                t.spark.setDepth(10);
                t.frame = 0;

                y += TILE_SIZE.HEIGHT + INTERSPACE.Y;
            }            
            x += TILE_SIZE.WIDTH + INTERSPACE.X;
            y = FIRST_TILE_POSITION.Y;
        }

        //Count each row and column value and nb of voltorb/bombs to fill indexes
        for (var i = 0; i < NB_COLUMNS; i++) {
            this.grid[i][NB_ROWS].x = FIRST_TILE_POSITION.X + (INTERSPACE.X + TILE_SIZE.WIDTH)*i;
            this.grid[i][NB_ROWS].y = FIRST_TILE_POSITION.Y + (INTERSPACE.Y + TILE_SIZE.HEIGHT)*NB_ROWS;

            this.addIndexes(i, NB_ROWS); 
        }

        for (var j = 0; j < NB_ROWS; j++) {
            this.grid[NB_COLUMNS][j].x = FIRST_TILE_POSITION.X + (INTERSPACE.X + TILE_SIZE.WIDTH)*NB_COLUMNS;
            this.grid[NB_COLUMNS][j].y = FIRST_TILE_POSITION.Y + (INTERSPACE.Y + TILE_SIZE.HEIGHT)*j;

            this.addIndexes(NB_COLUMNS, j);
        }

        //add memo box
        this.memo = {};

        this.memo.button = this.physics.add.sprite(MEMO_BUTTON_POS.X, MEMO_BUTTON_POS.Y, 'atlas_main', 'memo_button_0').setOrigin(0,0);
        this.memo.box = this.physics.add.sprite(MEMO_INITIAL_POS.X, MEMO_INITIAL_POS.Y, 'atlas_main', 'memo_box').setOrigin(0,0);
        this.memo.is_open = false;
        this.memo.frame = 0;
        this.memo.opening = false;
        this.memo.closing = false;

        var config = {
            x: MEMO_LABEL_POS.X,
            y: MEMO_LABEL_POS.Y,
            text: 'Open',
            size: 7,
            color: 'white'
        }
        this.memo.label = [];
        this.memo.label.push(DialogBox.createLabel(this, config));

        config.y += 16;
        config.text = 'Memo';
        this.memo.label.push(DialogBox.createLabel(this, config));


        this.memo.tiles = [];

        for (var k = 0; k < 4; k++) {
            this.memo.tiles.push(
                this.physics.add.sprite(MEMO_TILE_INITIAL_POS[k].X, MEMO_TILE_INITIAL_POS[k].Y, 'atlas_main', 'tile_' + k + '_memo').setOrigin(0,0)
            );
        }

        //Set the highlighting sprite
        this.highlight = this.physics.add.sprite(0, 0, 'atlas_main', 'highlight_red');
        this.highlight.setDepth(6);

        //Add memo numbers and set them invisible
        for (var i = 0; i < NB_COLUMNS; i++) {
            for (var j = 0; j < NB_ROWS; j++) {
                var x0 = this.grid[i][j].x - TILE_SIZE.WIDTH/2 + TILE_BORDER;
                var x1 = this.grid[i][j].x + TILE_SIZE.WIDTH/2 - TILE_BORDER;
                var y0 = this.grid[i][j].y - TILE_SIZE.HEIGHT/2 + TILE_BORDER;
                var y1 = this.grid[i][j].y + TILE_SIZE.HEIGHT/2 - TILE_BORDER;
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'atlas_main', 'index_0_memo').setVisible(false).setOrigin(0,0).setDepth(3));
                this.grid[i][j].memo.push(this.physics.add.sprite(x1, y0, 'atlas_main', 'index_1_memo').setVisible(false).setOrigin(1,0).setDepth(3));
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y1, 'atlas_main', 'index_2_memo').setVisible(false).setOrigin(0,1).setDepth(3));
                this.grid[i][j].memo.push(this.physics.add.sprite(x1, y1, 'atlas_main', 'index_3_memo').setVisible(false).setOrigin(1,1).setDepth(3));
            }
        }

        const closeMemo = () => {
            this.memo.closing = true;
            this.highlight.setFrame('highlight_red');
        }

        const openMemo = () => {
            this.memo.opening = true;
            this.highlight.setFrame('highlight_yellow');
        }

        const clickHandler = (x, y) => {
            //Clicking on "OPEN MEMO"
            if (x > OPEN_MEMO_POS.X && x < OPEN_MEMO_POS.X + OPEN_MEMO_SIZE.X 
                && y > OPEN_MEMO_POS.Y && y < OPEN_MEMO_POS.Y + OPEN_MEMO_SIZE.Y) {

                //TODO: Add click animation and modify label "open/close"
                this.memo.is_open = !this.memo.is_open;
                //this.memo.box.setVisible(this.memo.is_open);

                if (this.memo.is_open) {
                    openMemo();
                }
                else {
                    closeMemo();
                }
            }

            //Clicking on memos
            //TODO: add possibility to select several tiles at the same time with Ctrl
            else if (this.memo.is_open && x > MEMO_POS.X && x < MEMO_POS.X + this.memo.box.width 
                && y > MEMO_POS.Y && y < MEMO_POS.Y + this.memo.box.height) {
                
                //Identify which 
                var i = this.current.i;
                var j = this.current.j;

                if (this.grid[i][j].hidden) {
                    for (var k = 0; k < 4; k++) {
                        if (x > MEMO_TILE_POS[k].X && x < MEMO_TILE_POS[k].X + MEMO_TILE_SIZE.X &&
                            y > MEMO_TILE_POS[k].Y && y < MEMO_TILE_POS[k].Y + MEMO_TILE_SIZE.Y) {

                            var frame_name = 'tile_' + k + '_memo';

                            if (this.memo.tiles[k].frame.name == frame_name) {
                                frame_name = 'tile_' + k + '_selected_memo';
                            }

                            this.memo.tiles[k].setFrame(frame_name);

                            var v = this.grid[i][j].memo[k].visible;

                            this.grid[i][j].memo[k].setVisible(!v);
                            //this.memo.tiles[k].setVisible(!v);*/
                            return;
                        }
                    }
                }
            }

            //Clicking on a tile
            else {
                console.log("tile");
                for (var i = 0; i < NB_COLUMNS; i++) {
                    for (var j = 0; j < NB_ROWS; j++) {
                        var t = this.grid[i][j];

                        var xmin = t.x - TILE_SIZE.WIDTH/2;
                        var xmax = t.x + TILE_SIZE.WIDTH/2;
                        var ymin = t.y - TILE_SIZE.WIDTH/2;
                        var ymax = t.y + TILE_SIZE.WIDTH/2;

                        if (x >= xmin && x < xmax && y >= ymin && y < ymax) {
                            this.selectTile(i, j);
                        }
                    }
                }
            }
        }

        this.input.on("pointerdown", (pointer) => {
            if (this.busy) {
                return;
            }
            if (pointer.leftButtonDown()) {
                clickHandler(pointer.downX, pointer.downY);
            }
            if (pointer.rightButtonDown()) {
                debugger;
            }

        });

        this.input.keyboard.on("keydown", (key) => {

            if (this.busy) {
                return;
            }

            switch(key.code) {
                case 'Backspace':
                    console.log("Fin de la scène");
                    this.scene.stop(this.scene.key);
                    break;

                case 'Enter':
                    this.selectTile();
                    break;

                case 'Space':
                    this.selectTile();
                    break;

                //Moving our way around the grid
                case 'ArrowLeft':
                    if (this.current.i > 0) {
                        this.current.i--;
                        this.highlight.x -= (INTERSPACE.X + TILE_SIZE.WIDTH);

                        this.initMemoIndexes(this.current.i, this.current.j);
                    }
                    break;

                case 'ArrowUp':
                    if (this.current.j != 0) {
                        this.current.j--;
                        this.highlight.y -= (INTERSPACE.X + TILE_SIZE.HEIGHT);

                        this.initMemoIndexes(this.current.i, this.current.j);
                    }
                    break;

                case 'ArrowRight':
                    if (this.current.i != NB_COLUMNS - 1) {
                        this.current.i++;
                        this.highlight.x += (INTERSPACE.X + TILE_SIZE.WIDTH);

                        this.initMemoIndexes(this.current.i, this.current.j);
                    }
                    break;

                case 'ArrowDown':
                    if (this.current.j != NB_ROWS - 1) {
                        this.current.j++;
                        this.highlight.y += (INTERSPACE.X + TILE_SIZE.HEIGHT);

                        this.initMemoIndexes(this.current.i, this.current.j);
                    }
                    break;

                default:
                    break;
            }
        });
        //Should not be in menu
        var dialog_scene = this.scene.add('scene_dialog', SceneDialog, false, {});

        this.initGame(true); //first game
    },

    initGame: function(first_game, lost_game) {
        this.initHighlight();
        this.game_lost = false;
        this.game_won = false;
        this.nb_flipped = 0;

        this.id_dialog = 0;
        this.left_to_right_column = 0;

        var dialog = [];

        const startGame = () => {
            this.startGame();
        }
        const exitGame = () => {
            this.scene.stop();
        }

        dialog.push({
            text: 'Le jeu est au niveau ' + this.level,
            selection_type: 0,
            handler: null
        });

        dialog.push({
            text: 'Jouer ?',
            selection_type: 1,
            items: ['A', 'B'],
            handlers: [startGame, null]
        });

        var data_dialog = {
            origin_scene: this,
            dialog: dialog
        };


        this.scene.pause();
        if (first_game) {
            this.scene.launch('scene_dialog', data_dialog);
        }
        else {
            this.scene.wake('scene_dialog', data_dialog);
        }
    },

    startGame: function() {
        this.busy = false;

        this.nb_total_tiles = this.getRandomDistribution(this.distribution);
        this.distrib = { 0: this.nb_total_tiles[0], 2: this.nb_total_tiles[2], 3: this.nb_total_tiles[3] };

        for (var i = 0; i < NB_COLUMNS; i++) {
            for (var j = 0; j < NB_ROWS; j++) {
                
                var t = this.grid[i][j];
                t.value = 1;
                t.frame = 0;
            }            
        }
        for (var k = 0; k < this.memo.tiles.length; k++) {
            this.memo.tiles[k].setFrame('tile_' + k + '_memo');
        }
        this.setValue(2, this.distrib[2]);
        this.setValue(3, this.distrib[3]);
        this.setValue(0, this.distrib[0]);


        //Count each row and column value and nb of voltorb/bombs to fill indexes
        for (var i = 0; i < NB_COLUMNS; i++) {
            var sum_pts = 0, sum_v = 0;

            for (var j = 0; j < NB_ROWS; j++) {
                var t = this.grid[i][j];
                t.playable = (i != NB_COLUMNS && j != NB_ROWS);
                t.hidden = (i != NB_COLUMNS && j != NB_ROWS);
                for (var k = 0; k < 4; k++) {
                    t.memo[k].setVisible(false);
                }
                if (this.grid[i][j].value == 0) {
                    sum_v++;
                }
                else {
                    sum_pts += t.value;
                }
            }

            this.grid[i][NB_ROWS].nb_voltorbs = sum_v;
            this.grid[i][NB_ROWS].nb_pts = sum_pts;

            this.setIndexes(i, NB_ROWS); 
        }

        for (var j = 0; j < NB_ROWS; j++) {
            var sum_pts = 0, sum_v = 0;

            for (var i = 0; i < NB_COLUMNS; i++) {
                if (this.grid[i][j].value == 0) {
                    sum_v++;
                }
                else {
                    sum_pts += this.grid[i][j].value;
                }
            }
            this.grid[NB_COLUMNS][j].nb_voltorbs = sum_v;
            this.grid[NB_COLUMNS][j].nb_pts = sum_pts;

            this.setIndexes(NB_COLUMNS, j);
        }
        this.initHighlight();
    },

    initHighlight: function() {
        this.current.i = 0;
        this.current.j = 0;
        this.highlight.x = this.grid[0][0].x;
        this.highlight.y = this.grid[0][0].y;
        this.highlight.setVisible(true);
    },

    update: function(time, delta) {
        if (this.timer > 0) {
            this.timer--;
            console.log("timer at " + this.timer);
            return;
        }

        for (var i = 0; i < this.tiles_to_process.length; i++) {
            var t = this.tiles_to_process[i];

            switch(t.status) {
                case 0: //idle
                break;

                case 1: //flipping
                var length = this.animations.flip.frames.length;
                if (t.frame < length) {
                    var value = this.animations.flip.frames[t.frame];
                    var frame = '';
                    if (value == 0) {
                        frame = 'flip_left';
                    }
                    else if (value == 1) {
                        frame = 'flip_middle';
                    }
                    else if (value == 2) {
                        frame = 'flip_right';
                        frame = 'flip_' + t.value;
                    }
                    else {
                        frame = 'tile_' + t.value;
                    }
                    t.sprite.setFrame(frame);
                    t.frame++;
                }
                else {
                    t.frame = 0;
                    if (this.game_lost || this.game_won) {
                        t.status = 5;
                    }
                    else {
                        if (t.value > 0) {
                            this.busy = false;
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
                    t.spark.setFrame('explode_' + value);
                    t.spark.setVisible(true);
                    t.frame++;
                }
                else {
                    t.spark.setVisible(false);
                    this.loseGame();
                    t.status = 5;
                }
                break;

                case 4: //flipping back
                var length = this.animations.flip.frames.length;

                if (t.frame < length) {
                    var value = this.animations.flip.frames[t.frame];
                    var frame = '';
                    if (value == 0) {
                        frame = 'flip_right';
                        frame = 'flip_' + t.value;
                    }
                    else if (value == 1) {
                        frame = 'flip_middle';
                    }
                    else if (value == 2) {
                        frame = 'flip_left';
                    }
                    else {
                        frame = 'hidden';
                    }
                    t.sprite.setFrame(frame);
                    t.frame++;
                }
                else {
                    t.frame = 0;
                    t.status = 5;
                }
                break;

                default:
                t.frame = 0;
                this.tiles_to_process.splice(i, 1);
                if (this.tiles_to_process.length == 0) {
                    //this.busy = false;
                    if (this.flip_all) {
                        this.flip_all = false;
                        this.unflip_all = true;
                        this.leftToRight(this.left_to_right_column);
                    }
                    else if (this.unflip_all) {
                        this.left_to_right_column++;
                        if (this.left_to_right_column >= 0 && this.left_to_right_column < NB_COLUMNS) {
                            this.leftToRight(this.left_to_right_column);
                        }
                        else {
                            this.unflip_all = false;
                            this.initGame(false, this.game_won);
                        }
                    }
                    else {

                    }
                }
                break;
            }
        }

        if (this.memo.opening) {
            console.log("opening");
            var length = this.animations.open_memo.frames.length;
            if (this.memo.frame < length) {
                var value = this.animations.open_memo.frames[this.memo.frame];
                var frame = '';

                if (this.memo.frame == 0 || value != this.animations.open_memo.frames[this.memo.frame - 1]) {
                    switch (value) {
                        case 0:
                        this.memo.button.setFrame('memo_button_0'); //image clic
                        break;

                        case 1:
                        this.memo.button.setFrame('memo_button_1'); //normal
                        break;

                        case 2:
                        this.slideMemoBox(-10);
                        //this.memo.box.x = 246;
                        break;

                        case 3:
                        this.slideMemoBox(-18);
                        //this.memo.box.x = 228;
                        break;

                        case 4:
                        this.slideMemoBox(-31);
                        //this.memo.box.x = 197;
                        break;

                        case 5:
                        this.slideMemoBox(-4);
                        //this.memo.box.x = 193;
                        break;

                        case 6:
                        this.slideMemoBox(4);
                        //this.memo.box.x = 197;

                        default:
                        break;
                    }
                }
                this.memo.frame++;
            }
            else {
                this.memo.opening = false;
                this.memo.frame = 0;
            }
        }
        else if (this.memo.closing) {
            console.log("closing");
            var length = this.animations.open_memo.frames.length;
            if (this.memo.frame < length) {
                var value = this.animations.open_memo.frames[this.memo.frame];
                var frame = '';

                if (this.memo.frame == 0 || value != this.animations.open_memo.frames[this.memo.frame - 1]) {
                    switch (value) {
                        case 0:
                        this.memo.button.setFrame('memo_button_0'); //image clic
                        break;

                        case 1:
                        this.memo.button.setFrame('memo_button_1'); //normal
                        break;

                        case 2:
                        this.slideMemoBox(-4);
                        //this.memo.box.x = 193;
                        break;

                        case 3:
                        this.slideMemoBox(35);
                        //this.memo.box.x = 228;
                        break;

                        case 4:
                        this.slideMemoBox(18);
                        //this.memo.box.x = 246;
                        break;

                        case 5:
                        this.slideMemoBox(10);
                        //this.memo.box.x = 256;
                        break;

                        default:
                        break;
                    }
                }
                this.memo.frame++;
            }
            else {
                this.memo.closing = false;
                this.memo.frame = 0;
            }
        }
    },

    slideMemoBox: function(offset) {
        this.memo.box.x += offset;
        for (var k = 0; k < this.memo.tiles.length; k++) {
            this.memo.tiles[k].x += offset;
        }
    },

    selectTile: function(i, j) {

        if (typeof(i) != 'undefined' && typeof(j) != 'undefined') {
            this.current.i = i;
            this.current.j = j;
        }
        else {
            i = this.current.i;
            j = this.current.j;
        }
        var t = this.grid[i][j];

        this.highlight.x = t.x;
        this.highlight.y = t.y;
        
        if (this.memo.is_open) {
            this.initMemoIndexes(i, j);
        }
        else {
            this.flip(t);
        }
        return t;
    },

    //When memo box is open, set the memo indexes visibility according to the current selected tile
    initMemoIndexes: function(i, j) {
        var t = this.grid[i][j];
        for (var k = 0; k < 4; k++) {
            var v = t.memo[k].visible;
            //this.memo.tiles[k].setVisible(v);
            this.memo.tiles[k].setFrame('tile_' + k + '_' + (v ? 'selected_' : '') + 'memo');
        }
    },

    addIndexes: function(i, j) {

        var t = this.grid[i][j];

        t.fd = this.physics.add.sprite(
            t.x + FIRST_DIGIT_NB_PTS.X + TILE_SIZE.WIDTH/2, 
            t.y + FIRST_DIGIT_NB_PTS.Y + TILE_SIZE.HEIGHT/2,
            'digits').setOrigin(0,0).setDepth(4);

        t.sd = this.physics.add.sprite(
            t.x + SECOND_DIGIT_NB_PTS.X + TILE_SIZE.WIDTH/2, 
            t.y + SECOND_DIGIT_NB_PTS.Y + TILE_SIZE.HEIGHT/2,
            'digits').setOrigin(0,0).setDepth(4);

        t.fd.setFrame(0);
        t.sd.setFrame(0);

        t.nb = this.physics.add.sprite(
            t.x + NB_VOLTORBS_INDEX.X + TILE_SIZE.WIDTH/2, 
            t.y + NB_VOLTORBS_INDEX.Y + TILE_SIZE.HEIGHT/2,
            'digits').setOrigin(0,0).setDepth(4);

        t.nb.setFrame(0);
    },

    setIndexes: function(i, j) {

        var t = this.grid[i][j];

        if (t.nb_pts > 9) {
            t.fd.setFrame(1);
            t.sd.setFrame(t.nb_pts - 10);
        }
        else {
            t.fd.setFrame(0);
            t.sd.setFrame(t.nb_pts);
        }

        t.nb.setFrame(t.nb_voltorbs);
    },

    flip: function(tile) {    
        if (tile.hidden) {
            this.busy = true;
            tile.hidden = false;
            for (var k = 0; k < this.memo.tiles.length; k++) {
                this.memo.tiles[k].setFrame('tile_' + k + '_memo');
                tile.memo[k].setVisible(false);
            }
            tile.status = 1; //flip
            tile.sprite.setDepth(4);
            this.tiles_to_process.push(tile);
            this.nb_flipped++;
        }
    },

    unflip: function(tile) {
        if (!tile.hidden) {
            this.busy = true;
            tile.status = 4; //flip back
            tile.hidden = true;
            for (var k = 0; k < 4; k++) {
                tile.memo[k].setVisible(false);
            }
            tile.sprite.setDepth(2);
            this.tiles_to_process.push(tile);
        }
    },

    winGame: function() {
        this.level = Math.min(this.level_max, this.level+1);
        console.log("new level = " + this.level);
        
        const h = (scene) => { 
            scene.scene.sleep(); //dialog sleep
            this.scene.resume(); //resume the main game
            this.game_won = true;
            this.flipAll();
        }
        var dialog = [];
        dialog.push({
            text: 'Game cleared!',
            selection_type: 0,
            handler: null
        });
        dialog.push({
            text: 'Level ' + this.level + '!',
            selection_type: 0,
            handler: h
        });
    
        var data = {
            dialog: dialog,
            origin_scene: this.scene,
            level: this.level,
            restart: true,
        };

        // this.cameras.main.fadeOut(200);
        this.scene.pause();
        this.scene.wake('scene_dialog', data);
    },

    flipAll: function() {
        this.flip_all = true;
    	for (var i = 0; i < NB_COLUMNS; i++) {
    		for (var j = 0; j < NB_ROWS; j++) {
    			var tile = this.grid[i][j];
    			if (tile.hidden) {
                    this.flip(tile);
    			}
    		}
    	}
        console.log("flipped all, game over");
    },

    loseGame: function() {

        this.level = Math.max(Math.min(this.level, this.nb_flipped), 1);

        const t = (scene) => {
            scene.scene.sleep();
            this.scene.resume();
            this.game_lost = true;
            this.flipAll();
        };

        var dialog = [];
        dialog.push({
            text: 'Game over !', 
            selection_type: 0, //No selection
            handler: null
        });
        dialog.push({
            text: '', 
            selection_type: 0, //No selection
            handler: t
        });

        var data = {
            origin_scene: this,
            dialog: dialog
        }

        this.scene.pause();
        this.scene.wake('scene_dialog', data);
    },

    //Do nothing for nbFrames frames
    wait: function(nbFrames) {
        this.timer = nbFrames;
    },

    leftToRight: function(column) {
        console.log("left to right...");

        for (var j = 0; j < NB_COLUMNS; j++) {
            var t = this.grid[column][j];
            this.unflip(t);
        }
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
