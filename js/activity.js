define(function (require) {
    var activity = require("sugar-web/activity/activity");
    var ROT = require("rot");

    require(['domReady!'], function (doc) {
        activity.setup();

        var canvasWidth;
        var canvasHeight;
        var mazeWidth = 30;
        var mazeHeight = 20;

        var wallColor = "#111111";
        var corridorColor = "#ffffff";

        var cellWidth;
        var cellHeight;

        var mazeData = [];

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

        var onCellGenerated = function (x, y, value) {
            mazeData[x][y] = value;
        };

        var generateMaze = function () {
            mazeData = [];
            for (var x=0; x<mazeWidth; x++) {
                mazeData[x] = new Array(mazeHeight);
            }
            var maze = new ROT.Map.IceyMaze(mazeWidth, mazeHeight, 1);
//            var maze = new ROT.Map.EllerMaze(mazeWidth, mazeHeight, 1);
            maze.create(onCellGenerated);
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

        var drawMaze = function () {
            for (var x=0; x<mazeWidth; x++) {
                for (var y=0; y<mazeHeight; y++) {
                    drawCell(x, y, mazeData[x][y]);
                }
            }
        };

        drawMaze();

    });

});
