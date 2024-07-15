class Slider extends Primitive {
    constructor(x, y, w, h, metric, kwargs={}){
        super(x, y, kwargs);
        this.dims = createVector(w, h);
        this.initPos = createVector(x, y);
        this.slideValue = 0.5;
        this.bounds = [this.pos.x, this.pos.x+w];
        this.node = new pRectangle(x+w/2, y, 1, 10, {backgroundColor: "black"});
        this.submitted = false;
        this.node.toggleDragable();
        this.node.onDrag = () => {
            const convertTo = (params.positionMode == "PERCENTAGE" ? "PIXELS" : "IGNORE");
            const C = Primitive._convertCoordinates(createVector(mouseX, mouseY), convertTo);
            if (_.inRange(C.x, this.bounds[0], this.bounds[1])){
                this.node.pos.x = C.x;
                // Compute a value based on position
                // NB: this will be in range [0, 1)
                this.slideValue = (this.node.pos.x - this.initPos.x)/((this.pos.x + this.dims.x) - this.initPos.x)
            }
        }

        // Also have a submit button once they've selected their score
        this.submitBtn = new pButton(x+w/2, y+20, w*0.4, 10).addText(`Submit`);
        this.submitBtn.onClick = () => {
            this.submitted = true;
        }

        // And a text label
        this.queryType = metric;

        this.textObj = new pText(
            // `Please rate your current feelings of ${this.queryType}\n using the keyboard keys 1-5.\n 1 = no ${this.queryType}, 5 = highest ${this.queryType}.`, 
            `Please rate your current feelings of ${this.queryType}\n using the slider below.`,
            this.pos.x+this.dims.x/2, this.pos.y-25, 
            {textSize: this.textSize});

        this.lowLabel = new pText(`Low\n${this.queryType}`, this.pos.x, this.pos.y+10, {textSize: this.textSize});
        this.highLabel = new pText(`High\n${this.queryType}`, this.pos.x + this.dims.x, this.pos.y+10, {textSize: this.textSize});

        this.show = true;
    }

    listen(){
        return new Promise((resolve, reject) => {
            let intv = setInterval(() => {
                if (this.submitted == true){
                    clearInterval(intv);
                    this.submitted = false;
                    resolve(this.slideValue);
                    // Reset the slider to remove anchoring on the next round
                    this.slideValue = 0.5;
                    this.node.pos.x = this.initPos.x + this.dims.x/2;
                }
            }, 50)
        })
    }

    draw(){
        if (!this.show){return}
        let p = super.draw();
        let dims = Primitive._convertCoordinates(this.dims, this.constants.positionMode);
        push();
        translate(p.x, p.y);
        // Draw a line
        strokeWeight(5)
        line(0, 0, dims.x, 0);
        
        pop();

        this.node.draw();
        this.submitBtn.draw();
        this.textObj.draw();
        this.lowLabel.draw();
        this.highLabel.draw();

    }
}