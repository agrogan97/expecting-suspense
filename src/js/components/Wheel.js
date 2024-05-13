class Wheel {
    constructor(x, y){
        this.position = createVector(x, y);
        this.imgScaleFactor = 0.475;
        this.arrow = 40;
        this.ticker = 0;
        this.rotationAngle = 0;
        this.isSpinning = false;
    }

    spin() {
        this.isSpinning = true;
        this.ticker = 0;

        this.computeSpinTrajectory();
    }

    computeSpinTrajectory(){
        // Compute rotational values to create a non-linear rotation speed
        const numTicks = 10 * frameRate() // spins for 5 seconds
        const baseSpeed = 10;
        const rate = (t) => {
            if (t < numTicks*0.3){
                return baseSpeed;
            } else {
                let val = baseSpeed - baseSpeed*(Math.exp((3*t - numTicks*0.3)/numTicks*0.3)-1);
                return val >= 0 ? val : 0
            }
        }

        this.spinVals = _.range(0, numTicks).map(t => (
            rate(t)
        ))
    }

    draw(){
        let pos = this.position;
        // Draw a marker arrow to denote which card is drawn
        push();
        translate(10 + pos.x + assets.imgs.wheel.width*this.imgScaleFactor/2, 0);
        stroke('black')
        fill('black')
        triangle(-this.arrow, 0, this.arrow, 0, 0, this.arrow)

        pop();


        // Render wheel
        push();
        translate(pos.x + assets.imgs.wheel.width/4, pos.y + assets.imgs.wheel.height/4);
        scale(this.imgScaleFactor)
        if (this.isSpinning){
            if (this.ticker == this.spinVals.length){
                this.isSpinning = false;
                // this.ticker = 0
            } else {
                this.rotationAngle += this.spinVals[this.ticker]
                rotate(this.rotationAngle);
                this.ticker += 1;
            }
        } else {
            rotate(this.rotationAngle)
        }
        image(assets.imgs.wheel, 0, 0);
        pop();
    }
}