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

const FIRST_DIGIT_NB_PTS = {X: 11, Y: 2};
const SECOND_DIGIT_NB_PTS = {X: 19, Y: 2};
const NB_VOLTORBS_INDEX = {X: 19, Y: 15};

var SceneVoltorb = new Phaser.Class ({

    Extends: Phaser.Scene, 

    initialize: function SceneBattle() {
        Phaser.Scene.call(this, { key: 'scene_voltorb' });
    },

    init: function(data) {
        this.data = data;
        console.log(this.data);
        if (this.data.level != null) {
            this.level = this.data.level;
        }
        else {
            this.level = 1;
        }
        // this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

        this.grid = [];

        this.score = 1;
        this.level_max = this.level;

        this.nb_flipped = 0;
    },

    preload: function() {
        this.canvas = this.sys.game.canvas;

        this.load.image('main', 'assets/voltorb_flip.png');
        this.load.spritesheet('tiles', 'assets/tiles.png',
            {frameWidth: 28, frameHeight:28 });
        this.load.image('highlight', 'assets/highlight.png');
        this.load.spritesheet('digits', 'assets/digits.png',
            {frameWidth: 6, frameHeight: 8});

        //Memo assets
        this.load.image('memo_box', 'assets/memo_box.png');
        this.load.image('highlight_memo', 'assets/highlight_memo.png');
        // this.load.spritesheet('background_memo', 'assets/background_memo.png',
        //     {frameWidth: 24, frameHeight:24 });
        this.load.spritesheet('memos', 'assets/tiles_memo.png',
            {frameWidth: MEMO_TILE_SIZE, frameHeight:MEMO_TILE_SIZE });
        this.load.spritesheet('indexes', 'assets/indexes.png',
            {frameWidth: 7, frameHeight:7 });



        this.load.json('distribution', 'distribution.json');

    },

    create: function() {
        this.main = this.physics.add.image(0,0, 'main').setOrigin(0,0);

        for (var i = 0; i <= NB_ROWS; i++) {
            this.grid[i] = [];
            for (var j = 0; j <= NB_COLUMNS; j++) {
                this.grid[i][j] = {
                    value: 1,
                    memo: [],
                }
            }
        }
        
        this.distrib = this.getRandomDistribution();

        var sum = this.distrib[2] + this.distrib[3] + this.distrib[0];
        var x1 = NB_ROWS*NB_COLUMNS - sum;

        this.setValue(2, this.distrib[2]);
        this.setValue(3, this.distrib[3]);
        this.setValue(0, this.distrib[0]);

        // var stats = new Array(10).fill(0);
        // for (var i = 0; i < 10000; i++) {
        //     var j = this.getRandomInt(0,10);
        //     stats[j]++;
        // }
        // console.log(stats);

        for (var i = 0; i <= NB_COLUMNS; i++) {
            for (var j = 0; j <= NB_ROWS; j++) {
                this.grid[i][j].x = BORDER + i*(SQUARE + INTERSPACE);
                this.grid[i][j].y = BORDER + j*(SQUARE + INTERSPACE);
            }
        }

        for (var i = 0; i < NB_COLUMNS; i++) {
            var sum_pts = 0, sum_v = 0;

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
            this.grid[i][NB_ROWS].nb_voltorbs = sum_v;
            this.grid[i][NB_ROWS].nb_pts = sum_pts;

            this.addIndexes(i, NB_ROWS); 
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

            this.addIndexes(NB_COLUMNS, j);
        }

        if (!this.data.restart) {

            this.options = [
                    "Jouer",
                    "Informations",
                    "Quitter"
                ];

            var data = {
                text: 'Play Voltorb Flip level ' + this.level + '?',
                // confirm: false,
                options: this.options,
                origin_scene: this,
                level: 1,
            };

            this.scene.pause();
            this.scene.launch('scene_dialog', data);
        }


        //Set and highlight the current active tile to flip
        this.current = {i: 0, j: 0};
        this.highlight = this.physics.add.image(
            BORDER,
            BORDER,
            'highlight'
            ).setOrigin(0,0);
        this.highlight.setDepth(2);

        this.highlight_memo = this.physics.add.image(
            BORDER, 
            BORDER, 
            'highlight_memo'
            ).setOrigin(0,0);
        this.highlight_memo.setDepth(2);
        this.highlight_memo.setVisible(false);

        var border = 4;


        //TODO: pas besoin de sprite 'memos', juste 2 jeux de cases 0/1/2/3 pour activé/désactivé

        this.memo = this.physics.add.image(MEMO_POS.X, MEMO_POS.Y, 'memo_box').setOrigin(0,0);
        this.memo.is_open = false;

        this.memo.tiles = [];

        for (var k = 0; k < 4; k++) {
            this.memo.tiles.push(
                this.physics.add.sprite(MEMO_TILE_POS[k].X, MEMO_TILE_POS[k].Y, 'memos', k).setOrigin(0,0)
            );
            this.memo.tiles[k].setVisible(false);
        }
        this.memo.setVisible(this.memo.is_open);


        const tile_border = 3;
        for (var i = 0; i < NB_COLUMNS; i++) {
            for (var j = 0; j < NB_ROWS; j++) {
                var x0 = this.grid[i][j].x + tile_border;
                var x1 = this.grid[i][j].x + SQUARE - tile_border;
                var y0 = this.grid[i][j].y + tile_border;
                var y1 = this.grid[i][j].y + SQUARE - tile_border;
                this.grid[i][j].memo.push(this.physics.add.sprite(x0, y0, 'indexes', 0).setOrigin(0,0));
                this.grid[i][j].memo.push(this.physics.add.sprite(x1, y0, 'indexes', 1).setOrigin(1,0));
                this.grid[i][j].memo.push(this.physics.add.image(x0, y1, 'indexes', 2).setOrigin(0,1));
                this.grid[i][j].memo.push(this.physics.add.image(x1, y1, 'indexes', 3).setOrigin(1,1));

                for (var k = 0; k < 4; k++) {
                    this.grid[i][j].memo[k].setVisible(false);
                }
            }
        }

        const flip = () => {
            var tile = this.grid[this.current.i][this.current.j];
            if (tile.hidden) {
                var img = this.physics.add.image(tile.x, tile.y, 'tiles').setOrigin(0,0);
                img.setFrame(tile.value);

                //TODO: Add animation
                if (tile.value == 0) {
                    this.loseGame();
                }
                else {

                    this.nb_flipped++;
                    tile.hidden = false;

                    this.score *= tile.value;

                    this.distrib[tile.value]--;

                    if (this.distrib[2] + this.distrib[3] == 0) {
                        this.winGame();
                    }
                }
            }
        }

        const clickOnTile = (x, y) => {

            console.log("(" + x + ", " + y + ")");

            //Clicking on "OPEN MEMO"
            if (x > OPEN_MEMO_POS.X && x < OPEN_MEMO_POS.X + OPEN_MEMO_SIZE.X 
                && y > OPEN_MEMO_POS.Y && y < OPEN_MEMO_POS.Y + OPEN_MEMO_SIZE.Y) {

                //NOT ON ALREADY DISCOVERED TILES ?
                this.memo.is_open = !this.memo.is_open;

                if (this.memo.is_open) {
                    this.highlight.setVisible(false);
                    this.highlight_memo.setVisible(true);

                    this.memo.setVisible(true);
                    this.highlight_memo.x = this.grid[this.current.i][this.current.j].x;
                    this.highlight_memo.y = this.grid[this.current.i][this.current.j].y;
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
            else if (this.memo.is_open && x > MEMO_POS.X && x < MEMO_POS.X + this.memo.width 
                && y > MEMO_POS.Y && y < MEMO_POS.Y + this.memo.height) {
                console.log("clicking on memo!");
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
                        if (x >= this.grid[i][j].x && x < this.grid[i][j].x + SQUARE
                            && y >= this.grid[i][j].y && y < this.grid[i][j].y + SQUARE
                            && !(i == this.grid.length - 1 && j == this.grid[i].length - 1)) {

                            // if (this.memo.is_open && !this.grid[i][j].hidden) {
                            //     return;
                            // }

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

                            if (!this.memo.is_open) {
                                flip();
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
                    flip();
                    break;

                case 'Space':
                    flip();
                    break;

                //Moving our way around the grid
                case 'ArrowLeft':
                    if (this.current.i == 0) {}
                    else {
                        this.current.i--;
                        this.highlight_memo.x -= (INTERSPACE + SQUARE);
                        this.highlight.x -= (INTERSPACE + SQUARE);
                    }
                    break;

                case 'ArrowUp':
                    if (this.current.j == 0) {}
                    else {
                        this.current.j--;
                        this.highlight_memo.y -= (INTERSPACE + SQUARE);
                        this.highlight.y -= (INTERSPACE + SQUARE);
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
                    }
                    break;

                default:
                    break;
            }
        });

        this.events.on('resume', (scene, data) => {

            console.log(data);

            if (data.choice == 0) {
                this.scene.restart( {
                    level: Math.min(data.level, this.level_max),
                    restart: true
                });
            }
            else if (data.choice == 1) {
                //
            }
            else if (data.choice == 2) {
                this.cameras.main.fadeOut(100);
                this.cameras.main.on("camerafadeoutcomplete", () => {
                    this.scene.stop();
                });
            }
        });

        // var data = {
        //         text: 'Voltorb Flip',
        //         confirm: false,
        //         origin_scene: this.scene.key,
        // };

        // this.scene.pause();
        // this.scene.launch('scene_dialog', data);
    },

    //Sets (distrib) random non-attributed tiles to value (value)
    setValue(value, distrib) {

        for (var n = 0; n < distrib; n++) {
            var attributed = false;
            while (!attributed) {
                var i = this.getRandomInt(0, NB_ROWS);
                var j = this.getRandomInt(0, NB_COLUMNS);
                if (this.grid[i][j].value == 1 || this.grid[i][j].value == undefined) {
                    this.grid[i][j].value = value;
                    attributed = true;
                }
            }
        }
    },

    update: function(time, delta) {
        //
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

    winGame: function() {        
        var text = 'Game cleared!';
        text += '\n\n';
        text += 'Level ' + Math.min(this.level_max, this.level+1) + '!';
        text += '\n\nPlay Voltorb Flip level ' + (this.level+1) + ' ?';
    
        var data = {
                text: text,
                options: this.options,
                origin_scene: this.scene,
                level: this.level+1,
        };

        // this.cameras.main.fadeOut(200);
        this.scene.pause();
        this.scene.launch('scene_dialog', data);
    },

    loseGame: function() {
        var new_level = Math.max(Math.min(this.level, this.nb_flipped), 1);
        var text = 'Game over!';
        text += '\n\nThe game is back on level ' + new_level + '!';

        var options = [
            "Rejouer",
            "Quitter"
        ];

        var data = {
            text: text,
            options: this.options,
            origin_scene: this.scene,
            level: new_level,
        }
        console.log(this.options);
        this.scene.pause();
        this.scene.launch('scene_dialog', data);
    },

    getRandomInt: function(min, max) {
        return (Math.floor(Math.random()*max - min));
    },

    getRandomDistribution: function() {
        var distribs = this.cache.json.get('distribution');

        this.level_max = distribs.length - 1;

        var index = Math.floor(Math.random()*distribs[this.level].length);

        return distribs[this.level][index];
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
    scene: [ SceneVoltorb, SceneDialog, SceneChoice ],
};

var game = new Phaser.Game(config);