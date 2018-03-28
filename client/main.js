"use strict";

let canvas;
let result;
let ctx;
let rctx;

//our websocket connection
let socket;
let hash;
let moveDown = false;
let moveUp = false;
let moveRight = false;
let moveLeft = false;

let squares = {};
let mouse = {};
let draws = {};
let box = []; 
let mouseState = false;


const removeUser = (hash) => {
    if (squares[hash]) {
        delete squares[hash];
    }
};

const setUser = (data, boxdata) => {
    hash = data.hash;
    squares[hash] = data;
    requestAnimationFrame(redraw); 
    box = boxdata.splice(0);
    console.log(box);
}; 

const keyDownHandler = (e) => {
    var keyPressed = e.which;

    // W OR UP
    if (keyPressed === 87 || keyPressed === 38 || keyPressed===32) {
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

const keyUpHandler = (e) => {
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


const init = () => {
    canvas = document.querySelector("#canvas"); 
    ctx = canvas.getContext("2d"); 

    socket = io.connect();

    //socket.on('connect', function() { 
    //});

    socket.on('updateDraws', (data) => {
        draws[data.time] = data.coords;
    });

    socket.on('joined', setUser);

    socket.on('updatedMovement', update);

    socket.on('left', removeUser); 

    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler); 
};

window.onload = init;