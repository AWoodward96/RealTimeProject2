"use strict";

var drawBorder = function drawBorder() {
    // draw a dotted line around the draw area
    ctx.save();
    ctx.setLineDash([5.15]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1000, 0);
    ctx.lineTo(1000, 1000);
    ctx.lineTo(0, 1000);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
};

var drawBoxes = function drawBoxes() {
    for (var b = 0; b < box.length; b++) {
        ctx.fillStyle = "grey";
        ctx.fillRect(box[b].x - box[b].width / 2, box[b].y - box[b].height / 2, box[b].width, box[b].height);

        ctx.fillStyle = "red";
        ctx.fillRect(box[b].x, box[b].y, 2, 2);
    }
};

var drawPlayers = function drawPlayers() {
    var keys = Object.keys(squares);

    for (var i = 0; i < keys.length; i++) {

        var square = squares[keys[i]];

        if (square.alpha < 1) {
            square.alpha += 0.05; // 5% increase, however you want it to be smoothed. Based on 16.6 ms        
        }

        if (square.hash === hash) {
            ctx.fillStyle = "blue";
        } else {
            ctx.fillStyle = "black";
        }

        square.x = lerp(square.prevX, square.destX, square.alpha);
        square.y = lerp(square.prevY, square.destY, square.alpha);

        ctx.fillRect(square.x - 20, square.y - 20, 40, 40);

        ctx.fillStyle = "red";
        ctx.fillRect(square.x, square.y, 2, 2);
        ctx.fillRect(square.x, square.y + 24, 2, 2);
    }
};

var redraw = function redraw(time) {
    updatePosition();

    var mySquare = squares[hash];

    ctx.clearRect(0, 0, 500, 500);

    ctx.save();
    ctx.translate(-mySquare.camX + canvas.width / 2, -mySquare.camY + canvas.height / 2);

    drawBorder();
    drawPlayers();
    drawBoxes();

    ctx.restore();

    requestAnimationFrame(redraw);
};
"use strict";

var canvas = void 0;
var result = void 0;
var ctx = void 0;
var rctx = void 0;

//our websocket connection
var socket = void 0;
var hash = void 0;
var moveDown = false;
var moveUp = false;
var moveRight = false;
var moveLeft = false;

var squares = {};
var mouse = {};
var draws = {};
var box = [];
var myColor = void 0;
var mouseState = false;

var removeUser = function removeUser(hash) {
    if (squares[hash]) {
        delete squares[hash];
    }
};

var setUser = function setUser(data, boxdata) {
    hash = data.hash;
    squares[hash] = data;
    requestAnimationFrame(redraw);
    box = boxdata.splice(0);
    console.log(box);
};

var keyDownHandler = function keyDownHandler(e) {
    var keyPressed = e.which;

    // W OR UP
    if (keyPressed === 87 || keyPressed === 38 || keyPressed === 32) {
        moveUp = true;
    }
    // A OR LEFT
    else if (keyPressed === 65 || keyPressed === 37) {
            moveLeft = true;
        }
        // S OR DOWN
        else if (keyPressed === 83 || keyPressed === 40) {
                moveDown = true;
            }
            // D OR RIGHT
            else if (keyPressed === 68 || keyPressed === 39) {
                    moveRight = true;
                }

    //if one of these keys is down, let's cancel the browsers
    //default action so the page doesn't try to scroll on the user
    if (moveUp || moveDown || moveLeft || moveRight) {
        e.preventDefault();
    }
};

var getRndColor = function getRndColor() {
    var r = 255 * Math.random() | 0,
        g = 255 * Math.random() | 0,
        b = 255 * Math.random() | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};

var keyUpHandler = function keyUpHandler(e) {
    var keyPressed = e.which;

    // W OR UP
    if (keyPressed === 87 || keyPressed === 38 || keyPressed === 32) {
        moveUp = false;
    }
    // A OR LEFT
    else if (keyPressed === 65 || keyPressed === 37) {
            moveLeft = false;
        }
        // S OR DOWN
        else if (keyPressed === 83 || keyPressed === 40) {
                moveDown = false;
            }
            // D OR RIGHT
            else if (keyPressed === 68 || keyPressed === 39) {
                    moveRight = false;
                }
};

var sendWithLag = function sendWithLag() {
    socket.emit('movementUpdate', squares[hash]);
};

var init = function init() {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    socket = io.connect();

    socket.on('connect', function () {
        setInterval(sendWithLag, 40);
        myColor = getRndColor();
    });

    socket.on('updateDraws', function (data) {
        draws[data.time] = data.coords;
    });

    socket.on('joined', setUser);

    socket.on('updatedMovement', update);

    socket.on('left', removeUser);

    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
"use strict";

var jumpCD = false;

var update = function update(data) {
    if (!squares[data.hash]) {
        squares[data.hash] = data;
        return;
    }

    var square = squares[data.hash];

    if (square.lastUpdate >= data.lastUpdate) {
        return;
    }

    if (data.hash == hash) return;

    square.lastUpdate = data.lastUpdate;
    square.prevX = data.prevX;
    square.prevY = data.prevY;
    square.destX = data.destX;
    square.destY = data.destY;
    //square.y = data.y;
    //square.x = data.x;
    square.velX = data.velX;
    square.velY = data.velY;
    square.alpha = 0.01;
    square.grounded = data.grounded;
};

var lerp = function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
};

var updatePosition = function updatePosition() {
    var square = squares[hash];

    // Keep track of the last positions
    square.prevX = square.x;
    square.prevY = square.y;

    // Handle jump cd 
    if (moveUp && square.destY > 20) {
        if (square.grounded && !jumpCD) {
            square.velY = -45;
            jumpCD = true;
        }
    }

    if (jumpCD && !moveUp) jumpCD = false;

    // handle other movement 
    if (moveLeft && square.destX > 20) {
        square.velX -= 2;
    }
    if (moveRight && square.destX < 980) {
        square.velX += 2;
    }

    square.destX += square.velX;
    square.destY += square.velY;
    square.camX = square.x;
    square.camY = square.y;

    square.alpha = 0.05;

    square.velX *= .9;
    square.velY *= .9;
};
