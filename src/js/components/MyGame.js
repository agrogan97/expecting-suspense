class MyGame extends Game {
    constructor(queryType){
        super()
        this.roundIndex = 0;
        this.trialIndex = 0;
        this.queryType = queryType;
        this.data = {};
        // 12 non-surprise rounds, 6 surprise rounds, non-interleaved
        // this.roundTypes = [..._.range(0, 12).map(i => "non"), ..._.range(13, 18).map(i => "surprise")];
        // Utils.getUrlParams()["mode"]
        this.roundTypes = [
            ..._.range(0, 12).map(i => ({roundType: "non", suspenseGroup: _.sample([0, 1])})),
            ..._.range(0, 2).map(i => ({roundType:"surprise", surpriseGroup: "low"})),
            ..._.range(0, 2).map(i => ({roundType:"surprise", surpriseGroup: "med"})),
            ..._.range(0, 2).map(i => ({roundType:"surprise", surpriseGroup: "high"})),
        ]
        // this.roundTypes = _.range(0, 17).map(i => "surprise");
        // if interleaved, uncomment
        this.roundTypes = _.shuffle(this.roundTypes);
        this.suspenseLevels = []

        // Randomly sample from either the low or high suspense batches based on URL params
        try {
            this.suspenseGroup = Utils.getUrlParams()["mode"]; // low
        } catch (error) { 
            console.log(`Suspense group provided in URL params not recognised - defaulting to 0.`)
            this.suspenseGroup = 0;
        }

        this.newRound();
    }

    newRound(){
        // Initialise a new round
        // A round is made up of 5 trials (spins)
        // Set a new deck, reset the round index etc.
        let prevRounds = Object.keys(this.data).map(r => (this.data[r].deckIndex));
        let deckJson = (this.suspenseGroup == 0 ? assets.jsons.bottom10 : assets.jsons.top5);
        // Filter the json to remove previous rounds
        let allowedPairs = Object.keys(deckJson.pairSequence).filter(i => (!prevRounds.includes(i)));
        let deckIndex = _.sample(allowedPairs);

        // Build out the round-level storage
        this.trialIndex = 0;
        let roundSettings = {
            roundIndex : this.roundIndex,
            cumulativeScore: 0,
            numQueries: 0,
            roundType: this.roundTypes[this.roundIndex],
            // queryTrials: _.sampleSize([1, 2, 3, 4, 5], _.sample([2, 3])), // ask suspense/surprise after 2/3 trials chosen at random
            queryTrials : [1, 2, 3, 4, 5], // ask suspense/surprise after all trials
            deckIndex : deckIndex,
            deck: deckJson.deck[deckIndex],
            draws: deckJson.pairSequence[deckIndex].map(d => d[0]),
            randDraws : deckJson.pairSequence[deckIndex].map(d => d[1]),
            trials : {}
        }

        if (this.roundIndex != 0){
            // Reset the deck in content.deck
            // content.deck.setCardVals(roundSettings.deck);
            // Reset the chart
            resetChart();
            // and add a end of game callback for roundIndex == 18 or whatever

            // Reset the button to say 'Draw'
            content.drawCardBtn.text.text = "Draw";
            content.instructions.text = "Click Draw to draw a card." 
            if (!content.drawCardBtn.isClickable) {content.drawCardBtn.toggleClickable()};
        }

        content.deck.setCardVals(roundSettings.deck);
        content.deck.reset();

        // If this isn't a suprise round, show the deck
        console.log(`Round type: ${this.roundTypes[this.roundIndex].roundType} -- level ${this.roundTypes[this.roundIndex].suspenseGroup == undefined ? this.roundTypes[this.roundIndex].surpriseGroup : this.roundTypes[this.roundIndex].suspenseGroup }`)
        if (this.roundTypes[this.roundIndex].roundType == "non"){
            content.deck.revealAll();
        } else if (this.roundTypes[this.roundIndex].roundType == "surprise"){
            console.log(`Surprise: ${this.roundTypes[this.roundIndex].surpriseGroup}`)
            content.deck.hideAll();
        }
        
        // Store the initialised config in this.data - indexable by the round index
        this.data[this.roundIndex] = roundSettings;
    }

    startTrial(){
        let settings = this.data[this.roundIndex];
        // A trial is a single spin - there are 5 trials per round
        if (this.trialIndex != 0){
            // this.nextRound();
            content.deck.reset();
            content.wheel.img.setRotate(0);
            content.wheel.rotationAngle = 0;
        }
        // Shuffle the deck and draw 2 cards, then spin the wheel
        this.drawnCard = settings.draws[this.trialIndex];
        this.randCard = settings.randDraws[this.trialIndex];
        this.data[this.roundIndex].trials[this.trialIndex] = {
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
            .catch(() => {console.log("Error")})
    }

    async handleSpin(){
        let settings = this.data[this.roundIndex];
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
                    this.data[this.roundIndex].cumulativeScore += this.drawnCard;
                    // Update chart data - NB: cumulative score
                    addChartData(this.data[this.roundIndex].cumulativeScore, this.trialIndex+1) // score, label
                    clearInterval(spinningInterval);
                    // Increase round score
                    this.trialIndex += 1;
                    if (this.trialIndex == 5){
                        this.endRound();
                        this.roundIndex += 1;
                    } else {
                        content.drawCardBtn.toggleClickable();
                        content.instructions.text = "Click Draw to draw another card." 
                    }
                    
                }
            }, 1000)
        }

        // If we need to query the player's suspense, call the promise and spin upon resolution
        if (settings.queryTrials.includes(this.trialIndex+1)){
            content.instructions.text = "";
            content.suspenseQuery.show = true;
            content.wheel.disallowSpin();
            content.suspenseQuery.testListen()
                .then((res) => {this.data[this.roundIndex].trials[this.trialIndex].feedback = res})
                .then(() => {content.wheel.allowSpin()}) // turn spinning back on
                .then(() => {content.instructions.text = "Hold space to spin and release to stop."}) // update instructions
                .then(() => {doSpin()}) // begin spinning logic
        } else {
            content.instructions.text = "Hold space to spin and release to stop."
            doSpin();
        }
    }

    endRound(){
        content.instructions.text = `Final score: ${this.data[this.roundIndex].cumulativeScore}`;
        content.drawCardBtn.text.text = (this.data[this.roundIndex].cumulativeScore > 21 ? "Bust!" : "You Win!");
        if (this.roundIndex == 18){
            console.log("End game")
        } else {
            setTimeout(() => {
                content.instructions.text = "The next round will begin shortly...";
                setTimeout(() => {
                    this.newRound();
                }, 1500)
            }, 1500)
        }
    }

    nextRound(){
        content.deck.reset();
    }
}

class SuspenseQuery extends Primitive {
    // The suspense query
    // Show text to the player and listen for a response using keyboard keys 1-5
    constructor(x, y, queryType, kwargs={}){
        super(x, y, kwargs);
        this.show = false;
        this.queryType = queryType;
        this.textObj = new pText(`Please rate your current feelings of ${this.queryType}\n using the keyboard keys 1-5.\n 1 = no ${this.queryType}, 5 = highest ${this.queryType}.`, this.pos.x, this.pos.y, {...kwargs});
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
        if (this.show){
            // listen for keyboard presses
            if (this.listening) {this.keyListen()};
            this.textObj.draw();
        }
    }
}