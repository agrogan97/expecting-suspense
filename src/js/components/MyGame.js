class MyGame extends Game {
    constructor(){
        super()
        this.roundIndex = 0;
        this.data.rounds = {};

        // Define some game settings we might want, like the deck to show and the preset draws
        this.gameSettings = {
            cumulativeScore: 0,
            numQueries: 0, // the number of times their suspense has been queried
            queryRounds : _.sampleSize([1, 2, 3, 4, 5], _.sample([2, 3])) // the rounds on which the user will be queried
        }

        // Randomly sample from either the low or high suspense batches based on URL params
        try {
            this.gameSettings.suspenseGroup = Utils.getUrlParams()["mode"]; // low
        } catch (error) {
            console.log(`Suspense group provided in URL params not recognised - defaulting to 0.`)
            this.gameSettings.suspenseGroup = 0;
        }
        
        // this.gameSettings.suspenseGroup
        // Get the deck according to the suspense group
        let deckJson = (this.gameSettings.suspenseGroup == 0 ? assets.jsons.bottom10 : assets.jsons.top5);
        this.gameSettings.deckIndex = _.sample(Object.keys(deckJson.pairSequence));
        this.gameSettings.deck = deckJson.deck[this.gameSettings.deckIndex]
        this.gameSettings.draws = deckJson.pairSequence[this.gameSettings.deckIndex].map(d => d[0]);
        this.gameSettings.randDraws = deckJson.pairSequence[this.gameSettings.deckIndex].map(d => d[1]);
    }

    start(){
        if (this.roundIndex != 0){
            // this.nextRound();
            content.deck.reset();
            content.wheel.img.setRotate(0);
            content.wheel.rotationAngle = 0;
        }
        // Shuffle the deck and draw 2 cards, then spin the wheel
        this.drawnCard = this.gameSettings.draws[this.roundIndex];
        this.randCard = this.gameSettings.randDraws[this.roundIndex];
        this.data.rounds[this.roundIndex] = {
            drew: this.drawnCard,
            randCard: this.randCard,
            feedback: ''
        }
        // Randomly pick if the target card will be first or second (which equates to blue or red)
        let drawnCardPos = _.sample([0, 1]);
        let pair = (drawnCardPos == 0 ? [this.drawnCard, this.randCard] : [this.randCard, this.drawnCard]);
        content.drawCardBtn.toggleClickable();
        content.deck.multiShuffleAndDraw(6, pair)
            .then(() => {

                // Inform the player they can hold down the spin button to spin the wheel - update instruction text
                
                content.wheel.target = (drawnCardPos == 0 ? "blue" : "red");
                content.wheel.allowSpin();
                setTimeout(() => {
                    this.handleSpin();
                }, 400);
                

            })
            .catch(() => {console.log("Error ")})
    }

    async handleSpin(){
        // Define the spin function first
        const doSpin = () => {
            // Hide the suspense query and stop it from listening
            content.suspenseQuery.show = false;
            content.suspenseQuery.listening = false;
            let spinningInterval = setInterval(() => {
                if (!content.wheel.isSpinning && !content.wheel.expectingSpin){
                    try {
                        content.deck.drawnCards.filter(i => i.value != this.drawnCard)[0].toggleDisplay();    
                    } catch (error) {
                        // Catch in case we draw 2 of the same
                        content.deck.drawnCards[0].toggleDisplay();
                    }
                    
                    // Add new score to cumulative score
                    this.gameSettings.cumulativeScore += this.drawnCard;
                    // Update chart data - NB: cumulative score
                    addChartData(this.gameSettings.cumulativeScore, this.roundIndex+1) // score, label
                    clearInterval(spinningInterval);
                    // Increase round score
                    this.roundIndex += 1;
                    if (this.roundIndex == 5){
                        this.endGame();
                    } else {
                        content.drawCardBtn.toggleClickable();
                        content.instructions.text = "Click Draw to draw another card." 
                    }
                    
                }
            }, 1000)
        }

        // If we need to query the player's suspense, call the promise and spin upon resolution
        if (this.gameSettings.queryRounds.includes(this.roundIndex+1)){
            content.instructions.text = "";
            content.suspenseQuery.show = true;
            content.wheel.disallowSpin();
            content.suspenseQuery.testListen()
                .then((res) => {this.data.rounds[this.roundIndex].feedback = res})
                .then(() => {content.wheel.allowSpin()}) // turn spinning back on
                .then(() => {content.instructions.text = "Hold space to spin and release to stop."}) // update instructions
                .then(() => {doSpin()}) // begin spinning logic
        } else {
            content.instructions.text = "Hold space to spin and release to stop."
            doSpin();
        }

        
        // query if the wheel is still spinning
    }

    endGame(){
        content.instructions.text = `Final score: ${this.gameSettings.cumulativeScore}`;
        content.drawCardBtn.text.text = (this.gameSettings.cumulativeScore > 21 ? "Bust!" : "You Win!");
    }

    nextRound(){
        content.deck.reset();
        // setTimeout(() => {
        //     this.start();
        // }, 500)
    }
}

class SuspenseQuery extends Primitive {
    // The suspense query
    // Show text to the player and listen for a response using keyboard keys 1-5
    constructor(x, y, kwargs={}){
        super(x, y, kwargs);
        this.show = false;
        this.textObj = new pText("Please rate your current feelings of suspense using the keyboard keys 1-5.\n 1 = no suspense, 5 = highest suspense.", this.pos.x, this.pos.y, kwargs);
        this.listening = false;
    }

    toggleListen(){
        this.listening = !this.listening;
    }

    keyListen(){
        // Listen for key presses
        switch (true) {
            case keyIsDown(49): // 1
                return 1;
            case keyIsDown(50): // 2
                return 2;
            case keyIsDown(51): // 3
                return 3;
            case keyIsDown(52): // 4
                return 4;
            case keyIsDown(53): // 5
                return 5;
            default:
                return undefined;
        }
    }

    testListen(){
        return new Promise((resolve, reject) => {
            let res = undefined;
            let intv = setInterval(() => {
                res = this.keyListen();
                if (res != undefined) {console.log(`Answered: ${res}`)}
                if (res != undefined) {
                    clearInterval(intv);
                    resolve(res);
                };
            }, 50)
        })
    }

    draw(){
        super.draw();
        if (this.show){
            // listen for keyboard presses
            if (this.listening) {this.keyListen()};
            this.textObj.draw();
        }
    }
}