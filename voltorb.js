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

        console.log('Initialization Voltorb Flip');
    },

    preload: function() {
        this.canvas = this.sys.game.canvas;

        this.load.image('main', 'assets/voltorb_flip.png');
        this.load.spritesheet('tiles', 'assets/tiles.png',
            {frameWidth: 28, frameHeight:28 });
        this.load.image('highlight', 'assets/highlight.png');

        this.load.image('quit', 'assets/quit_btn.png');
        this.load.image('memo', 'assets/open_memo.png');
        this.load.spritesheet('digits', 'assets/digits.png',
            {frameWidth: 6, frameHeight: 8});

        this.load.json('distribution', 'distribution.json');

    },

    create: function() {
        this.main = this.physics.add.image(0,0, 'main').setOrigin(0,0);

        for (var i = 0; i <= NB_ROWS; i++) {
            this.grid[i] = [];
            for (var j = 0; j <= NB_COLUMNS; j++) {
                this.grid[i][j] = {
                    value: 1,
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

        var data = {
            text: 'Level ' + this.level + '!',
            confirm: false,
            origin_scene: this,
        };

        this.scene.pause();
        this.scene.launch('scene_dialog', data);


        //Set and highlight the current active tile to flip
        this.current = {i: 0, j: 0};
        this.highlight = this.physics.add.image(
            BORDER,
            BORDER,
            'highlight'
            ).setOrigin(0,0);
        this.highlight.setDepth(3);

        // this.memo = this.physics.add.image(this.canvas.width - 14, 4, 'memo').setOrigin(1,0);
        // this.quit = this.physics.add.image(this.canvas.width - 12, this.canvas.height - 2, 'quit').setOrigin(1,1);

        const flip = () => {
            var tile = this.grid[this.current.i][this.current.j];
            if (tile.hidden) {
                var img = this.physics.add.image(tile.x, tile.y, 'tiles').setOrigin(0,0);
                img.setFrame(tile.value);

                tile.hidden = false;

                this.score *= tile.value;

                this.distrib[tile.value]--;

                if (this.distrib[2] + this.distrib[3] == 0) {
                    this.winGame();
                }
            }
        }

        const getTile = (x, y) => {
            console.log("Getting tile at (" + x + ", " + y + ")");
            for (var i = 0; i < this.grid.length; i++) {
                for (var j = 0; j < this.grid[i].length; j++) {
                    if (x >= this.grid[i][j].x && x < this.grid[i][j].x + SQUARE
                        && y >= this.grid[i][j].y && y < this.grid[i][j].y + SQUARE) {
                        this.current.i = i;
                        this.current.j = j;
                        this.highlight.x = this.grid[i][j].x;
                        this.highlight.y = this.grid[i][j].y;
                        flip();
                    }
                }
            }
        }

        this.input.on("pointerdown", (pointer) => {
            if (pointer.leftButtonDown()) {
                console.log(this.grid);
                getTile(pointer.downX, pointer.downY);
            }

        });

        this.input.keyboard.on("keydown", (key) => {

            switch(key.code) {
                case 'Backspace':
                    console.log("Fin de la scène");
                    this.scene.stop(this.scene.key);
                    this.scene.resume(this.data.origin_scene);
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
                        this.highlight.x -= (INTERSPACE + SQUARE);
                    }
                    break;

                case 'ArrowUp':
                    if (this.current.j == 0) {}
                    else {
                        this.current.j--;
                        this.highlight.y -= (INTERSPACE + SQUARE);
                    }
                    break;

                case 'ArrowRight':
                    if (this.current.i == NB_COLUMNS || 
                        (this.current.i == NB_COLUMNS - 1 && this.current.j == NB_ROWS)) {}
                    else {
                        this.current.i++;
                        this.highlight.x += (INTERSPACE + SQUARE);
                    }
                    break;

                case 'ArrowDown':
                    if (this.current.j == NB_ROWS ||
                    (this.current.j == NB_ROWS - 1 && this.current.i == NB_COLUMNS)) {}
                    else {
                        this.current.j++;
                        this.highlight.y += (INTERSPACE + SQUARE);
                    }
                    break;

                default:
                    break;
            }
        });

        this.events.on('resume', (scene, data) => {
            if (data.level > 0) {
                this.scene.restart({level: data.level });
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
        fd.setFrame(0);

        var sd = this.physics.add.sprite(
            this.grid[i][j].x + SECOND_DIGIT_NB_PTS.X, 
            this.grid[i][j].y + SECOND_DIGIT_NB_PTS.Y,
            'digits').setOrigin(0,0);
        sd.setFrame(this.grid[i][j].nb_pts);

        var nb = this.physics.add.sprite(
            this.grid[i][j].x + NB_VOLTORBS_INDEX.X, 
            this.grid[i][j].y + NB_VOLTORBS_INDEX.Y,
            'digits').setOrigin(0,0);
        nb.setFrame(this.grid[i][j].nb_voltorbs);

    },

    winGame: function() {        
        var text = 'Game cleared!';
        var finished = false;
        if (this.level == this.level_max) {
            //Congratulations you won 
            finished = true;
        }
        else {
            text += '\n\n';
            text += 'Level ' + (this.level+1) + '!! Would you like to keep playing?';
        }
        var data = {
                text: text,
                confirm: !finished,
                origin_scene: this.scene,
                level: this.level,
                level_max: this.level_max,
        };

        console.log(this);

        // this.cameras.main.fadeOut(200);
        this.scene.pause();
        this.scene.launch('scene_dialog', data);
    },

    getRandomInt: function(min, max) {
        return (Math.floor(Math.random()*max - min));
    },

    getRandomDistribution: function() {
        var distribs = this.cache.json.get('distribution');
        console.log(distribs);

        this.level_max = 1;//distribs.length - 1;

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