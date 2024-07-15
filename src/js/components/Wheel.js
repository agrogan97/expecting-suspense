class Wheel extends Primitive {
    constructor(x, y, img, kwargs={}){
        super(x, y, kwargs)

        // Params to control the spin animations
        this.rotationAngle = 0;
        this.initialRotation = 0;
        this.isSpinning = false;
        this.ticker = 0;
        // this.scale = 1.75;
        if (window.innerWidth <= 1100){
            // ipad-type size
            this.scale = 1.25;
        } else if (_.inRange(window.innerWidth, 1100, 1500)){
            this.scale = 1.45;
        } else if (_.inRange(window.innerWidth, 1500, 2000)){
            this.scale = 1.75;
        } else {
            this.scale = 2;
        }
        this.img = new pImage(x, y, assets.imgs.wheel).setScale(this.scale)
        // this.wheelDims = createVector(assets.imgs.wheel.width*1.75, assets.imgs.wheel.height*1.75);
        // this.wheelDims = Primitive.toPercentage(this.wheelDims);
        this.wheelDims = this.img.dims;
        // let triangleBase = createVector(this.pos.x, this.pos.y - this.wheelDims.y*0.7);
        let triangleBase = createVector(50, 10)
        
        // this.arrow = new pTriangle(triangleBase.x, triangleBase.y, triangleBase.x + 2*mod, triangleBase.y, triangleBase.x+mod, triangleBase.y-mod, {backgroundColor: 'black'});

        this.arrow = new pTriangle(triangleBase.x-3, triangleBase.y, triangleBase.x+3, triangleBase.y, triangleBase.x, triangleBase.y-9);
        this.isHeld = true;

        // Set some quantities that the rest of the programe can listen to for info on the current stage of spinning
        this.spinningAllowed = false;
        this.expectingSpin = false;
        // Pre-generate the fixed spin values - the changes in rotation after the player releases the 'spin' key
        // this.generateSpinValues("red");
        // Set the key index of the key to be pressed to spin the wheel
        // See https://www.toptal.com/developers/keycode for keycodes
        this.key = 32; // space bar
        
    }


    generateSpinValues(to){
        // Same and opposite refers to colours - this shifts the end result by a segment, which is 45 degs
        this.spinVals_same = [];
        this.spinVals_opposite = [];
        this.spinVals_grey = [];
        this.spinVals = [];
        let baseSpeed = 10;

        const getRate = (t) => {return baseSpeed - 0.9*baseSpeed*Math.exp((0.008104*t/2 - 1));} // 0.008104 is a specific value to control the final value to a minimal degree of error 

        // This equation takes 278 ticks to get to zero - and rotates through 1094 degrees, exactly 14 full rotations
        _.range(0, 278).forEach(i => {
            this.spinVals_same.push(getRate(i));
            // this.spinVals_opposite.push(getRate(i));
            // this.spinVals_grey.push(getRate(i));
            this.spinVals.push(getRate(i));
            
        })

        let current = this.computeCurrentWheelValue(undefined, true);
        let targetSegment;
        // let segDiff;

        if (to == "grey"){
            // Calculate the number of segments between one of the 2 grey cards at random - to avoid patterns
            targetSegment = _.sample([0, 1]);
        } else if (to == "red"){
            targetSegment = _.sample([3, 5, 7]);
        } else if (to == "blue"){
            targetSegment = _.sample([2, 4, 6]);
        } else {
            throw new Error(`Did not recognise target ${to}`)
        }

        let segDiff = targetSegment - current;
        // console.log(`Target segment: ${targetSegment} -- Current segment: ${current} -- Diff: ${segDiff}`);
        if (segDiff < 0){segDiff = 8 + segDiff};

        // console.log(`SegDiff applied: ${segDiff}`)
        
        let diff = 0;
        this.spinVals_same.forEach((i, ix) => {
            if (diff <= (45*segDiff)){
                let tmp = 10 - i;
                this.spinVals[ix] = 10;
                diff += tmp;
            }
        })
    }

    computeCurrentWheelValue(val = undefined, asSegmentNumber=false){
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
        // Check if segment num will land in grey -> the 0th and 1st segments
        if (segmentNum == 0 || segmentNum == 1){
            return asSegmentNumber ? segmentNum : 'grey';
        } else if (segmentNum == 2 || segmentNum == 4 || segmentNum == 6){
            return asSegmentNumber ? segmentNum : 'blue';
        } else if (segmentNum == 3 || segmentNum == 5 || segmentNum == 7){
            return asSegmentNumber ? segmentNum : 'red';
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
                // if the target is a grey card - as in a surprise round - make sure we hit either the 0th or 1st segment
                this.generateSpinValues(this.target);
                this.useVals = this.spinVals

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
        this.img.setRotate(this.rotationAngle)
        // angleMode(DEGREES)
        if (this.spinningAllowed){
            if (keyIsDown(this.key)){
                this.spin()
            }
        }
        this.isHeld = keyIsDown(this.key);

        // super.draw();
        if (this.isSpinning){
            this.spinControl(this.isHeld)
        }

        this.img.draw();
        this.arrow.draw();
    }
}