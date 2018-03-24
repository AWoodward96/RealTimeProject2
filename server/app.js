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
  var temp = {};

  temp.x = 0;
  temp.y = 700;
  temp.width = 1000;
  temp.height = 40;
  boxes.push(temp);
  
   
  var b1 = {};
  b1.x = 600;
  b1.y = 930;
  b1.width = 1000;
  b1.height = 40;
  boxes.push(b1);
  
 
  var b2 = {};
  b2.x = 1000;
  b2.y = 500;
  b2.width = 500;
  b2.height = 40;
  boxes.push(b2);
};

const initialize = () => {
  initBoxes();
};

const boxCollision = (x1,y1,w1,h1,x2,y2,w2,h2) =>
{
    if(x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 +h2 && h1 + y1 > y2)
        return true;
    else
        return false;
};

const handlePhysics = (s) => {
  const square = s;  
  var grounded = false;
  for (let i = 0; i < boxes.length; i++) {
        // Handle collision
      
      const currentPosX = square.x - 20;
      const currentPosY = square.y - 20;
      const boxPosX = boxes[i].x- (boxes[i].width/2);
      const boxPosY = boxes[i].y - (boxes[i].height/2);
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
      const xDisplacement = Math.abs(currentPosX - boxPosX);
      const yDisplacement = Math.abs(currentPosY - boxPosY);
    const desiredyDisplacement = (boxes[i].height/2) + 20;
    const desiredxDisplacement = (boxes[i].width/2) + 20;
    
    // If the y displacement is greater then half the extents of both boxes
    if(yDisplacement < desiredyDisplacement)
    {
        var yVal = desiredyDisplacement - yDisplacement;
        // we need to resolve a y collision
        if(currentPosY > boxPosY) // If we are currently beneath the box
        {
            square.y += yVal;
        }else{ // If we're above the box
            square.y -= yVal;
        }
        square.velY = 0;
        square.destY = square.y;
    }
     
        /*
        
        // Ok I know this section looks bad, especially because it's commented out but like
        // This code should make everything work except it doesn't.
        // I need a way to handle if the collision should be handled horizontally or virtically
        // Because otherwise we get a massive issue where the positions jump around regardless of the collision
        
    // if the x displacement is greater then half the extents of both boxes
    if(xDisplacement < desiredxDisplacement)
    {
        var xVal = desiredxDisplacement - xDisplacement;
        // we need to resolve an x collision
        if(currentPosX > boxPosX) // We're on the right of a box
        {
            square.x += xVal;
        }else{ // We're on the left of the box
            square.x -= xVal;
        }
        square.velX = 0;
        square.destX = square.x;
    }

   */
        // Check this box for grounded
        if(boxCollision(
                     currentPosX,
                     currentPosY + 24,
                     2,
                     16,
                     boxPosX,
                     boxPosY,
                     boxes[i].width,
                     boxes[i].height)){
            grounded = true; 
        }
        
    }
  }

    
  // Also let the player jump if on the ground
  if(square.y >= 980)
  {
      grounded = true;
  }
    
  if (square.y < 980 && !grounded) { square.velY += 3; }
  square.grounded = grounded;
  return square;
};

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  if (!init) {
    init = true;
    initialize();
  }


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
  };

  socket.draws = {
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  socket.emit('joined', socket.square, boxes);

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();


    // check position of object. If greater than the bottom screen limit then make it fall
    // if (socket.square.y >= 980) {
    //  socket.square.y = 980; socket.square.prevY = 980;
    //  socket.square.destY = 980; socket.square.velY = 0;
    // }
    socket.square = handlePhysics(socket.square);

    io.sockets.in('room1').emit('updatedMovement', socket.square);
  });

  socket.on('draw', (data) => {
    if (data.time > socket.draws.lastUpdate) {
      socket.draws.lastUpdate = data.time;
      socket.draws.x = data.x;
      socket.draws.y = data.y;
      io.sockets.in('room1').emit('updateDraws', data);
    }
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.square.hash);

    socket.leave('room1');
  });
});
