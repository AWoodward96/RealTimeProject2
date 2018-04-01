const http = require('http');
const socketio = require('socket.io');
const xxh = require('xxhashjs');
const fs = require('fs');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
    // read the html
  if (req.url === '/bundle.js') {
    fs.readFile(`${__dirname}/../hosted/bundle.js`, (err, data) => {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
  } else {
    fs.readFile(`${__dirname}/../hosted/index.html`, (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
};

const app = http.createServer(handler);
const io = socketio(app);

app.listen(PORT);

let init = false;
const boxes = [];

const initBoxes = () => {
  const temp = {};

  // Ditto Left
  temp.x = -350;
  temp.y = 750;
  temp.width = 1000;
  temp.height = 40;
  boxes.push(temp);

  // Very bottom
  const b1 = {};
  b1.x = 500;
  b1.y = 980;
  b1.width = 1500;
  b1.height = 40;
  boxes.push(b1);

  // Side Right
  const b2 = {};
  b2.x = 900;
  b2.y = 250;
  b2.width = 350;
  b2.height = 40;
  boxes.push(b2);

  // Ditto Right
  const b3 = {};
  b3.x = 1350;
  b3.y = 750;
  b3.width = 1000;
  b3.height = 40;
  boxes.push(b3);

  // Middle Mini
  const b4 = {};
  b4.x = 500;
  b4.y = 500;
  b4.width = 250;
  b4.height = 40;
  boxes.push(b4);


  // Side Left
  const b5 = {};
  b5.x = 100;
  b5.y = 250;
  b5.width = 350;
  b5.height = 40;
  boxes.push(b5);
};

const initialize = () => {
  initBoxes();
};


const boxCollision = (x1, y1, w1, h1, x2, y2, w2, h2) => {
  if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && h1 + y1 > y2) { return true; }
  return false;
};


const handlePhysics = (s) => {
  const square = s;
  let grounded = false;
  for (let i = 0; i < boxes.length; i++) {
        // Handle collision

    const currentPosX = square.x - 20;
    const currentPosY = square.y - 20;
    const boxPosX = boxes[i].x - (boxes[i].width / 2);
    const boxPosY = boxes[i].y - (boxes[i].height / 2);


    if (boxCollision(
                     currentPosX,
                     currentPosY,
                     40,
                     40,
                     boxPosX,
                     boxPosY,
                     boxes[i].width,
                     boxes[i].height)) {
      // get displacements
      // const xDisplacement = Math.abs(currentPosX - boxPosX);
      // const desiredxDisplacement = (boxes[i].width / 2) + 20;
      const yDisplacement = Math.abs(currentPosY - boxPosY);
      const desiredyDisplacement = (boxes[i].height / 2) + 20;

      // If the y displacement is greater then half the extents of both boxes
      if (yDisplacement < desiredyDisplacement) {
        const yVal = desiredyDisplacement - yDisplacement;
        // we need to resolve a y collision
        if (currentPosY > boxPosY) { // If we are currently beneath the box
          square.y += yVal;
        } else { // If we're above the box
          square.y -= yVal;
        }
        square.velY = 0;
        square.destY = square.y;
      }


        // Ok I know this section looks bad, especially because it's commented out but like
        // This code should make everything work except it doesn't.
        // I need a way to handle if the collision should be handled horizontally or virtically
        // Because otherwise we get a massive issue where the positions
        // jump around regardless of the collision

/*
    // if the x displacement is greater then half the extents of both boxes
      if (xDisplacement < desiredxDisplacement) {
        const xVal = desiredxDisplacement - xDisplacement;
        // we need to resolve an x collision
        if (currentPosX > boxPosX) // We're on the right of a box
        {
          square.x += xVal;
        } else { // We're on the left of the box
          square.x -= xVal;
        }
        square.velX = 0;
        square.destX = square.x;
      }

*/

        // Check this box for grounded
      if (boxCollision(
                     currentPosX,
                     currentPosY + 24,
                     2,
                     16,
                     boxPosX,
                     boxPosY,
                     boxes[i].width,
                     boxes[i].height)) {
        grounded = true;
      }
    }
  }


  // Also let the player jump if on the ground
  if (square.y >= 980) {
    grounded = true;
  }

  if (square.y < 980 && !grounded) { square.velY += 3; }
  square.grounded = grounded;
  return square;
};

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  socket.square = {
    hash: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),

    camX: 0,
    camY: 0,
    x: 250,
    y: 250,
    prevX: 0,
    prevY: 0,

    destX: 0,
    destY: 0,
    velX: 0,
    velY: 0,
    alpha: 0,

    grounded: false,
    isIt: false,
    canBeIt: true,
  };

  if (!init) {
    init = true;
    initialize();
    socket.square.isIt = true;
  } else {
        // Check to see if we need to set this player as 'IT'
    let it = false;
    const arrOfSockets = Object.keys(io.sockets.sockets);
    for (let i = 0; i < arrOfSockets.length; i++) {
      const curSocket = io.sockets.connected[arrOfSockets[i]];
      if (curSocket.square.isIt) { it = true; }
    }

    if (!it) { socket.square.isIt = true; }
  }

  // Set the players initial position
  const initX = 800 * Math.random();
  const initY = 800 * Math.random();
  socket.square.x = initX + 100;
  socket.square.y = initY + 100;
  socket.square.prevX = socket.square.x;
  socket.square.prevY = socket.square.y;
  socket.square.destX = socket.square.x;
  socket.square.destY = socket.square.y;


  socket.emit('joined', socket.square, boxes);

  socket.on('movementUpdate', (data) => {
    socket.square = data;

    socket.square.lastUpdate = new Date().getTime();

    socket.broadcast.to('room1').emit('updatedMovement', socket.square);
  });

  socket.on('disconnect', () => {
    // Handle disconnecting while it
    if (socket.square.isIt) {
      const arrOfSockets = Object.keys(io.sockets.sockets);

      if (arrOfSockets.length !== 0) { // if you're the last one in the level don't bother
        // make sure that the hash isn't your own
        let v = 0;
        if (arrOfSockets[v] === socket.square.hash) { v++; }

        // Now push it out
        const nhash = io.sockets.connected[arrOfSockets[v]].square.hash;
        io.sockets.in('room1').emit('tag', socket.square.hash, nhash);
      }
    }

    // Leave
    io.sockets.in('room1').emit('left', socket.square.hash);
    socket.leave('room1');
  });
});

const itCollision = (curSocket, socketList) => {
    // Loop through each player and see if you've collided with them
  for (let i = 0; i < socketList.length; i++) {
        // Get the socket
    const s = io.sockets.connected[socketList[i]];
        // console.log(s.square.hash + "---" + curSocket.square.hash);

        // If it's ourselves, don't bother
    if (s.square.hash === curSocket.square.hash) { continue; }

    const curSquare = s.square;
    const currentPosX = curSquare.x - 20;
    const currentPosY = curSquare.y - 20;
    const currentPosX2 = curSocket.square.x - 20;
    const currentPosY2 = curSocket.square.y - 20;


        // If the person who is it overlaps on another player, tag them as it now
    if (boxCollision(currentPosX, currentPosY, 40, 40, currentPosX2, currentPosY2, 40, 40)
        && curSquare.canBeIt) {
      io.sockets.in('room1').emit('tag', curSocket.square.hash, s.square.hash);
      return;
    }
  }
};


const CheckPositions = () => {
  if (!init) { return; }

    // Make sure each player is actually in a valid position
  const arrOfSockets = Object.keys(io.sockets.sockets);

    // Loop through each socket and grab their square to validate position
  for (let i = 0; i < arrOfSockets.length; i++) {
        // Get the socket and square
    const curSocket = io.sockets.connected[arrOfSockets[i]];
    let curSquare = curSocket.square;
    if (curSquare == null) { continue; }

        // Validate physics
    curSquare = handlePhysics(curSquare);

        // If you're it handle colliding with others
    if (curSquare.isIt) {
      itCollision(curSocket, arrOfSockets);
    }
        // Push out the updated positions
    curSocket.broadcast.to('room1').emit('updateMovement', curSquare);
  }
};

setInterval(CheckPositions, 40);
