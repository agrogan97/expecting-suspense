class Wheel extends Primitive {
    constructor(x, y, img, kwargs={}){
        super(x, y, kwargs)

        // Params to control the spin animations
        this.rotationAngle = 7;
        this.initialRotation = 0;
        this.isSpinning = false;
        this.ticker = 0;
        this.img = new pImage(x, y, assets.imgs.wheel).setScale(2);
        let mod = 2.5; // using pixels
        let triangleBase = createVector(this.pos.x, this.pos.y-this.img.dims.y*1.3);
        // this.arrow = new pTriangle(triangleBase.x, triangleBase.y, triangleBase.x + 2*mod, triangleBase.y, triangleBase.x+mod, triangleBase.y-mod, {backgroundColor: 'black'});

        this.arrow = new pTriangle(triangleBase.x-3, triangleBase.y, triangleBase.x+3, triangleBase.y, triangleBase.x, triangleBase.y-9);
        this.isHeld = true;

        // Set some quantities that the rest of the programe can listen to for info on the current stage of spinning
        this.spinningAllowed = false;
        this.expectingSpin = false;
        // Pre-generate the fixed spin values - the changes in rotation after the player releases the 'spin' key
        this.generateSpinValues();
        // Set the key index of the key to be pressed to spin the wheel
        // See https://www.toptal.com/developers/keycode for keycodes
        this.key = 32; // space bar
    }


    generateSpinValues(){
        this.spinVals_same = [];
        this.spinVals_opposite = [];
        let baseSpeed = 10;

        const getRate = (t) => {return baseSpeed - 0.9*baseSpeed*Math.exp((0.008104*t/2 - 1));} // 0.008104 is a specific value to control the final value to a minimal degree of error 

        // This equation takes 278 ticks to get to zero - and rotates through 1094 degrees
        _.range(0, 278).forEach(i => {
            this.spinVals_same.push(getRate(i));
            this.spinVals_opposite.push(getRate(i))
        })

        // Change the first N values in the other array to be the basespeed, so that it always lands on the opposite colour segment
        let diff = 0;
        this.spinVals_same.forEach((i, ix) => {
            if (diff <= 45){
                let tmp = 10 - i;
                this.spinVals_opposite[ix] = 10;
                diff += tmp;
            }
          }) 

        // let val = baseSpeed - baseSpeed*(Math.exp((3*t - numTicks*0.3)/numTicks*0.3)-1);
    }

    computeCurrentWheelValue(val = undefined){
        // Based on the number of segments and the rotational value, work out the current colour that the arrow is pointing at

        // Get modulus of angle
        let modRot;
        if (val == undefined){
            modRot = this.rotationAngle % 360; 
        } else {
            // if provided use an input value
            modRot = val % 360;
        }
        
        let anglePerSegment = 360 / 8; // 8 segments
        // Get the segment index from current angle divided by anglePerSegment
        let segmentNum = Math.floor(modRot / anglePerSegment); // Indexing from 0 -> 7
        let isEven = ((segmentNum % 2) == 0);
        if (isEven === true){
            return 'blue'
        } else {
            return 'red'
        }
    }

    handleSpin(buttonHeldDown, tick){
        // Computes the rotation values based on a modified exponential damping equation
        let target;
        let baseSpeed = 10;
        if (buttonHeldDown){
            return baseSpeed
        } else if (!buttonHeldDown) {
            if (tick == 0){
                let current = this.computeCurrentWheelValue()
                let projected = this.computeCurrentWheelValue(this.rotationAngle + _.sum(this.spinVals))
                // Determine which array of damping values to use based on desired value
                if (current == this.target){
                    this.useVals = this.spinVals_same
                } else {
                    this.useVals = this.spinVals_opposite
                }

            }
            // Once released, use the pre-calculated damping values
            let val = this.useVals[tick];
            return val >= 0 ? val : 0
        } else {
            throw new Error("No value provided for buttonHeldDown - expected a boolean.")
        }
    }

    spinControl(isHeld){
        // Handles the logic for when to spin based on user control and the change in speed upon release

        let newRot = this.handleSpin(isHeld, this.ticker)
        if (newRot == 0){ 
            this.isSpinning = false
            this.spinningAllowed = false;
        } else {
            this.rotationAngle += newRot;
            this.img.setRotate(this.rotationAngle);
            if (!keyIsDown(this.key)){this.ticker += 1}
            
        }
    }

    spin(){
        this.ticker = 0;
        this.img.setRotate(0);
        this.rotationAngle = 0;
        this.isSpinning = true;
        // Reset this value so only initialises once
        this.spinningAllowed = false;
        this.expectingSpin = false;
    }

    allowSpin(){
        this.spinningAllowed = true;
        this.expectingSpin = true;
    }

    disallowSpin(){
        this.spinningAllowed = false;
        this.expectingSpin = false;
    }

    draw(){

        if (this.spinningAllowed){
            if (keyIsDown(this.key)){
                this.spin()
            }
        }
        this.isHeld = keyIsDown(this.key);

        super.draw();
        if (this.isSpinning){
            this.spinControl(this.isHeld)
        }

        this.img.draw();
        this.arrow.draw();
    }
}