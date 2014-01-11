define(function (require) {
    var activity = require("sugar-web/activity/activity");
    require("rAF");

    var maze = require("activity/maze");
    var directions = require("activity/directions");

    require(['domReady!'], function (doc) {
        activity.setup();

        var canvasWidth;
        var canvasHeight;

        var wallColor = "#101010";
        var corridorColor = "#ffffff";
        var startColor = "hsl(0, 0%, 80%)";
        var goalColor;

        var cellWidth;
        var cellHeight;

        var dirtyCells = [];

        var controls = {
            'arrows': [38, 39, 40, 37],
            'wasd': [87, 68, 83, 65],
            'ijkl': [73, 76, 75, 74]
        };

        var controlColors = {};

        var players = {};

        var gameSize = 60;

        var debug = false; //true;

        var mazeCanvas = document.getElementById("maze");
        var ctx = mazeCanvas.getContext("2d");

        var updateMazeSize = function () {
            var toolbarElem = document.getElementById("main-toolbar");

            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight - toolbarElem.offsetHeight - 3;

            cellWidth = Math.floor(canvasWidth / maze.width);
            cellHeight = Math.floor(canvasHeight / maze.height);

            mazeCanvas.width = canvasWidth;
            mazeCanvas.height = canvasHeight;
        };

        var onWindowResize = function () {
            updateMazeSize();
            drawMaze();
        };
        window.addEventListener('resize', onWindowResize);

        var drawCell = function (x, y, color) {
            ctx.fillStyle = color;
            ctx.fillRect(cellWidth * x, cellHeight * y, cellWidth, cellHeight);
        }

        var drawGround = function (x, y, value) {
            var color;
            if (value == 1) {
                color = wallColor;
            } else {
                color = corridorColor;
            }
            drawCell(x, y, color);
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
            drawGround(x, y, maze.walls[x][y]);

            if (maze.visited[x][y] !== undefined) {
                drawPoint(x, y, maze.visited[x][y]);
            }

            if (debug) {
                if (maze.forks[x][y] == 1) {
                    drawPoint(x, y, '#faa');
                }
            }

            if (x == maze.startPoint.x && y == maze.startPoint.y) {
                drawPoint(maze.startPoint.x, maze.startPoint.y, startColor, 1);
            }

            if (x == maze.goalPoint.x && y == maze.goalPoint.y) {
                drawCell(maze.goalPoint.x, maze.goalPoint.y, goalColor);
            }

            for (control in players) {
                var player = players[control];
                if (x == player.x && y == player.y) {
                    drawPoint(player.x, player.y, player.color, 1);
                }
            };

        }

        var drawMaze = function () {
            for (var x=0; x<maze.width; x++) {
                for (var y=0; y<maze.height; y++) {
                    drawGround(x, y, maze.walls[x][y]);
                    if (maze.visited[x][y] !== undefined) {
                        drawPoint(x, y, maze.visited[x][y]);
                    }
                    if (debug) {
                        if (maze.forks[x][y] == 1) {
                            drawPoint(x, y, '#faa');
                        }
                    }
                }
            }

            drawPoint(maze.startPoint.x, maze.startPoint.y, startColor, 1);
            drawCell(maze.goalPoint.x, maze.goalPoint.y, goalColor);

            for (control in players) {
                var player = players[control];
                drawPoint(player.x, player.y, player.color, 1);
            };

        };

        var runLevel = function () {
            maze.generate(window.innerWidth / window.innerHeight, gameSize);
            updateMazeSize();
            players = {};
            drawMaze();
        }
        runLevel();

        var nextLevel = function () {
            gameSize *= 1.2;
            runLevel();
        }

        var Player = function (control) {
            this.x = maze.startPoint.x;
            this.y = maze.startPoint.y;
            if (!(control in controlColors)) {
                var hue = Math.floor(Math.random()*360);
                controlColors[control] = {
                    'color': 'hsl(' + hue + ', 90%, 50%)',
                    'visitedColor': 'hsl(' + hue + ', 30%, 80%)'
                }
            }
            this.color = controlColors[control].color;
            this.visitedColor = controlColors[control].visitedColor;
            this.path = undefined;
            this.animation = undefined;

            dirtyCells.push({'x': this.x, 'y': this.y});
        };

        Player.prototype.isMoving = function () {
            return (this.animation !== undefined);
        };

        Player.prototype.canGo = function (direction) {
            var dirs = maze.directions[this.x][this.y];
            var i = directions[direction];
            return dirs[i] == 1;
        };

        Player.prototype.findPath = function (direction) {

            var find = function (x, y, direction, first) {

                if (!(first) && (maze.isDeadEnd(x, y) || maze.isFork(x, y))) {
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

                    var dirs = maze.directions[newX][newY];
                    var tempDirs = dirs.slice(0);
                    tempDirs[directions[directions.getOpposite(direction)]] = 0;
                    newDir = directions.orders[tempDirs.indexOf(1)];

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

                maze.visited[that.x][that.y] = that.visitedColor;

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

                if (that.x == maze.goalPoint.x && that.y == maze.goalPoint.y) {
                    clearInterval(that.animation);
                    that.animation = undefined;
                    nextLevel();
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
                    currentDirection = directions.orders[controls[control].
                                                         indexOf(event.keyCode)];
                }
            }
            if (currentControl === undefined) {
                return;
            }

            if (!(currentControl in players)) {
                players[currentControl] = new Player(currentControl);
            }

            var player = players[currentControl];
            player.move(currentDirection);
        };

        document.addEventListener("keydown", onKeyDown);

        var animate = function (timestamp) {
            var hue = Math.floor(120 * (1 + Math.cos(timestamp / 3000)));
            var light = Math.floor(50 + (15 * (1 + Math.cos(timestamp / 300))));
            goalColor = 'hsl(' + hue + ', 50%, ' + light + '%)';
            dirtyCells.push({'x': maze.goalPoint.x, 'y': maze.goalPoint.y});

            dirtyCells.forEach(function (cell) {
                drawMazeCell(cell.x, cell.y);
            });
            dirtyCells = [];

            requestAnimationFrame(animate);
        };
        animate();

    });

});
