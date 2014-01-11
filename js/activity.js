define(function (require) {
    var activity = require("sugar-web/activity/activity");
    var ROT = require("rot");
    require("rAF");

    require(['domReady!'], function (doc) {
        activity.setup();

        var canvasWidth;
        var canvasHeight;
        var mazeWidth = 30;
        var mazeHeight = 20;
        var goal = {'x': mazeWidth-3, 'y': mazeHeight-3};

        var wallColor = "#101010";
        var corridorColor = "#ffffff";

        var cellWidth;
        var cellHeight;

        var dirtyCells = [];

        var mazeWalls = [];
        var mazeDirections = [];
        var mazeForks = [];

        var dirOrders = ['north', 'east', 'south', 'west'];

        var directions = {};
        dirOrders.forEach(function (dir, i) {
            directions[dir] = i;
        });

        var opositeDir = function (direction) {
            switch(direction) {
            case 'north':
                return 'south';
                break;
            case 'south':
                return 'north';
                break;
            case 'east':
                return 'west';
                break;
            case 'west':
                return 'east';
                break;
            }
        }

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

        var drawGround = function (x, y, value) {
            if (value == 1) {
                ctx.fillStyle = wallColor;
            } else {
                ctx.fillStyle = corridorColor;
            }
            ctx.fillRect(cellWidth * x, cellHeight * y, cellWidth, cellHeight);
        };

        var drawPoint = function (x, y, color, size) {
            if (size === undefined) {
                size = 0.5;
            }

            var centerX = cellWidth * (x + 0.5);
            var centerY = cellHeight * (y + 0.5);
            var radius = size * Math.min(cellWidth, cellHeight) / 2;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        };

        var drawMazeCell = function (x, y) {
            drawGround(x, y, mazeWalls[x][y]);

            if (debug) {
                if (mazeForks[x][y] == 1) {
                    drawPoint(x, y, '#faa');
                }
            }

            if (x == mazeWidth-3 && y == mazeHeight-3) {
                drawPoint(mazeWidth-3, mazeHeight-3, '#afa');
            }

            for (control in players) {
                var player = players[control];
                if (x == player.x && y == player.y) {
                    drawPoint(player.x, player.y, player.color, 1);
                }
            };

        }

        var drawMaze = function () {
            for (var x=0; x<mazeWidth; x++) {
                for (var y=0; y<mazeHeight; y++) {
                    drawGround(x, y, mazeWalls[x][y]);
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

            drawPoint(goal.x, goal.y, '#afa');

            for (control in players) {
                var player = players[control];
                drawPoint(player.x, player.y, player.color, 1);
            };

        };

        drawMaze();

        var Player = function () {
            this.x = 1;
            this.y = 1;
            this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
            this.path = undefined;
            this.animation = undefined;
        };

        Player.prototype.isMoving = function () {
            return (this.animation !== undefined);
        };

        Player.prototype.canGo = function (direction) {
            var dirs = mazeDirections[this.x][this.y];
            var i = directions[direction];
            return dirs[i] == 1;
        };

        Player.prototype.findPath = function (direction) {

            var find = function (x, y, direction, first) {

                if (!(first) && (isDeadEnd(x, y) || isFork(x, y))) {
                    return [];
                }

                var nextCell = function (x, y, direction) {
                    var newX = x;
                    var newY = y;
                    var newDir;

                    if (direction == 'north') {
                        newY -= 1;
                    }
                    if (direction == 'east') {
                        newX += 1;
                    }
                    if (direction == 'south') {
                        newY += 1;
                    }
                    if (direction == 'west') {
                        newX -= 1;
                    }

                    var dirs = mazeDirections[newX][newY];
                    var tempDirs = dirs.slice(0);
                    tempDirs[directions[opositeDir(direction)]] = 0;
                    newDir = dirOrders[tempDirs.indexOf(1)];

                    return {'x': newX, 'y': newY, 'direction': newDir};
                };

                var next = nextCell(x, y, direction);
                var result = find(next.x, next.y, next.direction, false);
                result.unshift(direction);
                return result;

            };

            return find(this.x, this.y, direction, true);
        }

        Player.prototype.move = function (direction) {
            if (this.isMoving()) {
                return
            }

            if (!(this.canGo(direction))) {
                return;
            }

            var that = this;

            var next = function () {
                var direction = that.path.shift();
                if (direction == undefined) {
                    clearInterval(that.animation);
                    that.animation = undefined;
                };

                dirtyCells.push({'x': that.x, 'y': that.y});

                if (direction == 'north') {
                    that.y -= 1;
                }
                if (direction == 'east') {
                    that.x += 1;
                }
                if (direction == 'south') {
                    that.y += 1;
                }
                if (direction == 'west') {
                    that.x -= 1;
                }

                dirtyCells.push({'x': that.x, 'y': that.y});

                if (that.x == goal.x && that.y == goal.y) {
                    clearInterval(that.animation);
                    that.animation = undefined;
                    console.log("you won!");
                }
            }

            this.path = this.findPath(direction);
            this.animation = setInterval(next, 40);
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
            }

            var player = players[currentControl];
            player.move(currentDirection);
        };

        document.addEventListener("keydown", onKeyDown);

        var animate = function () {
            dirtyCells.forEach(function (cell) {
                drawMazeCell(cell.x, cell.y);
            });
            dirtyCells = [];

            requestAnimationFrame(animate);
        };
        animate();

    });

});
