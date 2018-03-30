let jumpCD = false;


const update = (data) => {
    if (!squares[data.hash]) {
        squares[data.hash] = data;
        return;
    }
    
    const square = squares[data.hash];

    if (square.lastUpdate >= data.lastUpdate) {
        return;
    }

    square.lastUpdate = data.lastUpdate; 
    square.prevX = data.prevX;
    square.prevY = data.prevY;
    square.destX = data.destX;
    square.destY = data.destY; 
    square.velX = data.velX;
    square.velY = data.velY;
    square.alpha = 0.01;
    square.grounded = data.grounded;
};

const lerp = (v0, v1, alpha) => {
    return (1 - alpha) * v0 + alpha * v1;
};


const boxCollision = (x1, y1, w1, h1, x2, y2, w2, h2) => {
  if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && h1 + y1 > y2) { return true; }
  return false;
};

 
const runPhysics = (s) => {
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
      //const xDisplacement = Math.abs(currentPosX - boxPosX);
      //const desiredxDisplacement = (boxes[i].width / 2) + 20;
      const yDisplacement = Math.abs(currentPosY - boxPosY);
      const desiredyDisplacement = (boxes[i].height / 2) + 20;

      // If the y displacement is greater then half the extents of both boxes
      if (yDisplacement < desiredyDisplacement) {
        const yVal = desiredyDisplacement - yDisplacement;
        // we need to resolve a y collision
        if (currentPosY > boxPosY) { // If we are currently beneath the box
          square.prevY += yVal;
        } else { // If we're above the box
          square.prevY -= yVal;
        } 
        square.velY = 0;
        square.destY = square.prevY;
      }
 
   
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
        console.log("is grounded");
        grounded = true;
      }
    }
  }


  // Also let the player jump if on the ground
  if (square.y >= 980) {
    grounded = true;
  }

  if (square.y < 980 && !grounded) { square.velY += 2; }
  square.grounded = grounded;
  return square;
}

const updatePosition = () => {
    var square = squares[hash];

        
    // Update physics locally
    square = runPhysics(square);
 
    
    // Keep track of the last positions
    square.prevX = square.x;
    square.prevY = square.y;
 
    
     // Handle jump cd 
    if (moveUp && square.destY > 20) {
        if(square.grounded && !jumpCD){ 
            square.velY = -60;
            jumpCD = true;
        }
    }
    
    if(jumpCD && !moveUp)
        jumpCD = false;
    
    
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

    square.alpha = 0.1;
    
    square.velX *= .9;
    square.velY *= .9;

    socket.emit('movementUpdate', square);
};

