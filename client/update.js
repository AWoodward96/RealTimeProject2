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
    square.alpha = 0.01; 
};

const lerp = (v0, v1, alpha) => {
    return (1 - alpha) * v0 + alpha * v1;
};
 

const updatePosition = () => {
    const square = squares[hash];

    // Keep track of the last positions
    square.prevX = square.x;
    square.prevY = square.y;
 
    
     // Handle jump cd 
    if (moveUp && square.destY > 20) {
        if(!jumpCD){
            square.destY -= 120;
            jumpCD = true;
        }
    }
    
    if(jumpCD && !moveUp)
        jumpCD = false;
    
   
    // handle other movement 
    if (moveLeft && square.destX > 20) {
        square.destX -= 10;
    }
    if (moveRight && square.destX < 980) {
        square.destX += 10;
    }

    square.camX = square.x;
    square.camY = square.y;
 
    square.alpha = 0.05;

};

