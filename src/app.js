const http = require('http');
const socketio = require('socket.io');
const xxh = require('xxhashjs');
const fs = require('fs');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
    // read the html
  fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
        // if err, throw it for now
    if (err) {
      throw err;
    }
    res.writeHead(200);
    res.end(data);
  });
};

const app = http.createServer(handler);
const io = socketio(app);
const timeToDraw = 20000;

let destTime; // When this match is over
let baseTime;
let initialized = false;

let curAnimal = 'An Elephant';
const animals = ['A Sark', 'An Oyster', 'A Whale', 'An Elephant', 'A Penguin', 'A Pig'];
app.listen(PORT);

const init = () => {
  baseTime = new Date().getTime();
  destTime = baseTime + timeToDraw;
  initialized = true;
};

const getRandomAnimal = () => {
  const copy = animals.slice(0);
  const index = copy.indexOf(curAnimal);
  copy.splice(index, 1);


  return copy[copy.length * Math.random() | 0];
};


io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  if (!initialized) {
    init();
  }

  socket.square = {
    hash: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),

    camX: 0,
    camY: 0,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,

    destX: 0,
    destY: 0,
    alpha: 0,
    curDir: 0,
  };

  socket.draws = {
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  socket.emit('joined', socket.square, curAnimal);

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();


    socket.broadcast.to('room1').emit('updatedMovement', socket.square);


    // Update time
    const curTime = destTime - new Date().getTime();
    io.sockets.in('room1').emit('updateTime', curTime);

    if (Math.floor(curTime / 1000) <= 0) {
      baseTime = new Date().getTime();
      destTime = baseTime + timeToDraw;
      curAnimal = getRandomAnimal();
      io.sockets.in('room1').emit('reset', curAnimal);
    }
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
