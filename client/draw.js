const drawBorder = () => {
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



const drawBoxes = () => {
    for(let b = 0; b < boxes.length; b++)
    {
        ctx.fillStyle = "grey";
        ctx.fillRect(boxes[b].x - boxes[b].width/2, 
                     boxes[b].y - boxes[b].height/2, 
                     boxes[b].width, 
                     boxes[b].height);   
        
        ctx.fillStyle = "red";
        ctx.fillRect(boxes[b].x,boxes[b].y,2,2);
    }
}

const drawPlayers = () => {
    const keys = Object.keys(squares);

    for (let i = 0; i < keys.length; i++) {

        const square = squares[keys[i]];

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
        ctx.fillRect(square.x,square.y,2,2);
        ctx.fillRect(square.x,square.y+24,2,2);
    }
};

const redraw = (time) => {
    updatePosition();

    const mySquare = squares[hash];

    ctx.clearRect(0, 0, 500, 500); 


    ctx.save()
    ctx.translate(-mySquare.camX + canvas.width / 2, -mySquare.camY + canvas.height / 2);

    drawBorder(); 
    drawPlayers();
    drawBoxes();

    ctx.restore();

    requestAnimationFrame(redraw);
};