define(function (require) {
    var activity = require("sugar-web/activity/activity");
    var ROT = require("rot");

    require(['domReady!'], function (doc) {
        activity.setup();

        var canvasWidth;
        var canvasHeight;
        var mazeWidth = 30;
        var mazeHeight = 20;

        var wallColor = "#101010";
        var corridorColor = "#ffffff";

        var cellWidth;
        var cellHeight;

        var mazeWalls = [];
        var mazeDirections = [];
        var mazeForks = [];

        var dirOrders = ['north', 'east', 'south', 'west'];

        var directions = {};
        dirOrders.forEach(function (dir, i) {
            directions[dir] = i;
        });

        var controls = {
            'arrows': [38, 39, 40, 37],
            'wasd': [87, 68, 83, 65],
            'ijkl': [73, 76, 75, 74]
        };

        var players = {};

        var debug = true;

        var mazeCanvas = document.getElementById("maze");
        var ctx = mazeCanvas.getContext("2d");

        var updateMazeSize = function () {
            var toolbarElem = document.getElementById("main-toolbar");

            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight - toolbarElem.offsetHeight - 1;

            cellWidth = Math.ceil(canvasWidth / mazeWidth);
            cellHeight = Math.ceil(canvasHeight / mazeHeight);

            mazeCanvas.width = canvasWidth;
            mazeCanvas.height = canvasHeight;
        };
        updateMazeSize();

        var onWindowResize = function () {
            updateMazeSize();
            drawMaze();
        };
        window.addEventListener('resize', onWindowResize);

        var countOptions = function (x, y) {
            var dirs = mazeDirections[x][y];
            return dirs.reduce(function (previousValue, currentValue) {
                return previousValue + currentValue;
            });
        };

        var getDirections = function (x, y) {
            var dirs = [0, 0, 0, 0];

            if (mazeWalls[x][y] == 1) {
                return dirs;
            }

            if (mazeWalls[x-1][y] == 0) {
                dirs[directions.west] = 1;
            }
            if (mazeWalls[x+1][y] == 0) {
                dirs[directions.east] = 1;
            }
            if (mazeWalls[x][y-1] == 0) {
                dirs[directions.north] = 1;
            }
            if (mazeWalls[x][y+1] == 0) {
                dirs[directions.south] = 1;
            }

            return dirs;
        };

        var findDirections = function () {
            mazeDirections = [];
            for (var x=0; x<mazeWidth; x++) {
                mazeDirections[x] = new Array(mazeHeight);
            }
            for (var x=0; x<mazeWidth; x++) {
                for (var y=0; y<mazeHeight; y++) {
                    mazeDirections[x][y] = getDirections(x, y);
                }
            }
        };

        var isDeadEnd = function (x, y) {
            return countOptions(x, y) == 1;
        };

        var isFork = function (x, y) {
            return countOptions(x, y) > 2;
        };

        var findForks = function () {
            mazeForks = [];
            for (var x=0; x<mazeWidth; x++) {
                mazeForks[x] = new Array(mazeHeight);
            }
            for (var x=0; x<mazeWidth; x++) {
                for (var y=0; y<mazeHeight; y++) {
                    if (isDeadEnd(x, y) || isFork(x, y)) {
                        mazeForks[x][y] = 1;
                    }
                }
            }
        };

        var onCellGenerated = function (x, y, value) {
            mazeWalls[x][y] = value;
        };

        var generateMaze = function () {
            mazeWalls = [];
            for (var x=0; x<mazeWidth; x++) {
                mazeWalls[x] = new Array(mazeHeight);
            }
            var maze = new ROT.Map.IceyMaze(mazeWidth, mazeHeight, 1);
            //var maze = new ROT.Map.EllerMaze(mazeWidth, mazeHeight, 1);
            maze.create(onCellGenerated);

            findDirections();
            findForks();
        };
        generateMaze();

        var drawCell = function (x, y, value) {
            if (value == 1) {
                ctx.fillStyle = wallColor;
            } else {
                ctx.fillStyle = corridorColor;
            }
            ctx.fillRect(cellWidth * x, cellHeight * y, cellWidth, cellHeight);
        };

        var drawPoint = function (x, y, color) {
            var centerX = cellWidth * (x + 0.5);
            var centerY = cellHeight * (y + 0.5);
            var radius = cellWidth / 4;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        };

        var drawMaze = function () {
            for (var x=0; x<mazeWidth; x++) {
                for (var y=0; y<mazeHeight; y++) {
                    drawCell(x, y, mazeWalls[x][y]);
                }
            }

            if (debug) {
                for (var x=0; x<mazeWidth; x++) {
                    for (var y=0; y<mazeHeight; y++) {
                        if (mazeForks[x][y] == 1) {
                            drawPoint(x, y, '#faa');
                        }
                    }
                }
            }

            drawPoint(mazeWidth-3, mazeHeight-3, '#afa');

            for (control in players) {
                var player = players[control];
                drawPoint(player.x, player.y, player.color);
            };

        };

        drawMaze();

        var Player = function () {
            this.x = 1;
            this.y = 1;
            this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
        };

        var onKeyDown = function (event) {
            var currentControl;
            var currentDirection;
            for (control in controls) {
                if (controls[control].indexOf(event.keyCode) != -1) {
                    currentControl = control;
                    currentDirection = dirOrders[controls[control].
                                                 indexOf(event.keyCode)];
                }
            }
            if (currentControl === undefined) {
                return;
            }

            if (!(currentControl in players)) {
                players[currentControl] = new Player();
                drawMaze();
            }
        };

        document.addEventListener("keydown", onKeyDown);

    });

});
