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
            var data = {'x': x, 'y': y, 'value': value};
            mazeData.push(data);
        };

        var generateMaze = function () {
            mazeData = [];
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
            mazeData.forEach(function (data) {
                drawCell(data.x, data.y, data.value);
            });
        };

        drawMaze();

    });

});
