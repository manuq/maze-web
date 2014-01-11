define(function (require) {
    var ROT = require("rot");

    var directions = require("activity/directions");

    var maze = {};

    maze.width = 30;
    maze.height = 20;
    maze.goal = {'x': maze.width-3, 'y': maze.height-3};

    maze.walls = [];
    maze.directions = [];
    maze.forks = [];

    var countOptions = function (x, y) {
        var dirs = maze.directions[x][y];
        return dirs.reduce(function (previousValue, currentValue) {
            return previousValue + currentValue;
        });
    };

    var getDirections = function (x, y) {
        var dirs = [0, 0, 0, 0];

        if (maze.walls[x][y] == 1) {
            return dirs;
        }

        if (maze.walls[x-1][y] == 0) {
            dirs[directions.west] = 1;
        }
        if (maze.walls[x+1][y] == 0) {
            dirs[directions.east] = 1;
        }
        if (maze.walls[x][y-1] == 0) {
            dirs[directions.north] = 1;
        }
        if (maze.walls[x][y+1] == 0) {
            dirs[directions.south] = 1;
        }

        return dirs;
    };

    var findDirections = function () {
        maze.directions = [];
        for (var x=0; x<maze.width; x++) {
            maze.directions[x] = new Array(maze.height);
        }
        for (var x=0; x<maze.width; x++) {
            for (var y=0; y<maze.height; y++) {
                maze.directions[x][y] = getDirections(x, y);
            }
        }
    };

    maze.isDeadEnd = function (x, y) {
        return countOptions(x, y) == 1;
    };

    maze.isFork = function (x, y) {
        return countOptions(x, y) > 2;
    };

    var findForks = function () {
        maze.forks = [];
        for (var x=0; x<maze.width; x++) {
            maze.forks[x] = new Array(maze.height);
        }
        for (var x=0; x<maze.width; x++) {
            for (var y=0; y<maze.height; y++) {
                if (maze.isDeadEnd(x, y) || maze.isFork(x, y)) {
                    maze.forks[x][y] = 1;
                }
            }
        }
    };

    var onCellGenerated = function (x, y, value) {
        maze.walls[x][y] = value;
    };

    maze.generate = function () {
        maze.walls = [];
        for (var x=0; x<maze.width; x++) {
            maze.walls[x] = new Array(maze.height);
        }
        var rotmaze = new ROT.Map.IceyMaze(maze.width, maze.height, 1);
        //var rotmaze = new ROT.Map.EllerMaze(maze.width, maze.height, 1);
        rotmaze.create(onCellGenerated);

        findDirections();
        findForks();
    };

    return maze;

});
