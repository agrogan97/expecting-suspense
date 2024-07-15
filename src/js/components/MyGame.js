class MyGame extends Game {
    constructor(){
        super()
        this.roundIndex = 0;
        this.trialIndex = 0;
        this.queryType = content.vars.queryType;
        this.data = {};
        // This will store all the suspense draws so we can compute the expected value and variance, and then sample from a distribution with those params
        this.suspenseDraws = [];
        this.threshold = 10;
        /* 
            We have 120 spins, which is 5 spins per round over 24 rounds.
            1/4 of these spins will draw surprise cards, which is 30 spins.
            No surprise cards will be drawn in the first 3 rounds (i.e. 15 spins).
            When we get a surprise card, we will sample from the surprise distribution.
            Otherwise, we sample from a suspense distribution - which one? Need to check
        */
        this.spinIndices = _.range(0, 120).map(i => (0));
        // If surprise mdoe, we'll predefine when the surprise draws will be
        if (this.queryType == "surprise"){
            let counter = 0;
            let isSurprise = true; // Since it will flip to false on 0
            _.range(0, 120).forEach(i => {
                if (i % 20 == 0){
                    isSurprise = !isSurprise;
                    console.log(isSurprise)
                }
                if (isSurprise){
                    // This is where we allocate the surprise rounds
                    // 2 at the start and 2 at the end?
                    // Here we have 20 indices (4 rounds of 5 spins, and we set in advance which will be surprise rounds)
                    let flipSet = [0, 1, 5, 6, 13, 14, 18, 19]; // Accounting for indexes starting at 0
                    if (flipSet.includes(i % 20)){
                        this.spinIndices[i] = 1;
                    }
                }
            })
        }
        

        // Players all either see a high, med or low-suspense round
        // We'll load these into an obj and shuffle them
        // Get the keys for each and create an object as obj = {id: {deck: [], pairSequence: [], condition: condition}}
        // And put into an array we can shuffle
        let allRounds = []
        let lowSusKeys = Object.keys(assets.jsons.lowSus.deck);
        lowSusKeys.forEach(k => {
            allRounds.push({id: k, deck: assets.jsons.lowSus.deck[k], pairSequence: assets.jsons.lowSus.pairSequence[k], condition: "low"})
        })
        let medSusKeys = Object.keys(assets.jsons.medSus.deck);
        medSusKeys.forEach(k => {
            allRounds.push({id: k, deck: assets.jsons.medSus.deck[k], pairSequence: assets.jsons.medSus.pairSequence[k], condition: "med"})
        })
        let highSusKeys = Object.keys(assets.jsons.highSus.deck);
        highSusKeys.forEach(k => {
            allRounds.push({id: k, deck: assets.jsons.highSus.deck[k], pairSequence: assets.jsons.highSus.pairSequence[k], condition: "high"})
        })
        this.allRounds = _.shuffle(allRounds)

        this.numRounds = this.allRounds.length;

        this.newRound();
    }

    newRound(){
        // Initialise a new round
        // A round is made up of 5 trials (spins)
        // Set a new deck, reset the round index etc.

        // Get the deck for the current round - the order of these is set in advance in the constructor
        let deckJson = this.allRounds[this.roundIndex];
        let deckIndex = deckJson.id;

        console.log(deckJson)
        console.log(deckIndex)

        // Get the surprise/non-surprise spin status for the next 5 spins
        let spinTypes = this.spinIndices.slice(this.roundIndex*5, this.roundIndex*5+5);

        // Make sure satisfaction query is hidden
        querySatisfaction = false;
        // hide the chart
        document.getElementById("myChart").style.visibility = "visible";

        // Build out the round-level storage
        this.trialIndex = 0;
        let roundSettings = {
            roundIndex : this.roundIndex,
            gameMode: content.vars.queryType,
            cumulativeScore: 0,
            spinTypes: spinTypes, // An array of 0s and 1s indicating if a normal (0) vs. grey (1) card will be drawn
            surpriseVals : [], // if this is a surprise spin, store here - non-surprise vals are set to {} as default
            // queryTrials: _.sampleSize([1, 2, 3, 4, 5], _.sample([2, 3])), // ask suspense/surprise after 2/3 trials chosen at random
            queryTrials : [1, 2, 3, 4, 5], // ask suspense/surprise after all trials
            deckIndex : deckIndex,
            deck: deckJson.deck,
            draws: deckJson.pairSequence.map(d => d[0]),
            randDraws : deckJson.pairSequence.map(d => d[1]),
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
            content.drawCardBtn.hide = false;
            if (!content.drawCardBtn.isClickable) {content.drawCardBtn.toggleClickable()};
        }

        content.deck.setCardVals(roundSettings.deck);
        content.deck.reset();

        content.deck.revealAll();
        
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
        // Here we insert the logic for if this is a surprise card or not
        let isSurprise = false
        if (this.data[this.roundIndex].spinTypes[this.trialIndex] == 1){
            // This is a surprise round
            isSurprise = true;
        } else {
            // Not a surprise round, draw from deck as normal
        }
        content.deck.multiShuffleAndDraw(6, pair)
            .then(() => {

                // Inform the player they can hold down the spin button to spin the wheel - update instruction text
                if (isSurprise){
                    content.wheel.target = "grey"
                } else {
                    content.wheel.target = (drawnCardPos == 0 ? "blue" : "red");
                }
                content.wheel.allowSpin();
                setTimeout(() => {
                    this.handleSpin(isSurprise);
                }, 400);
                

            })
            .catch(() => {console.log("Error")})
    }

    async handleSpin(isSurprise=false){
        let settings = this.data[this.roundIndex];
        // Define the spin function first
        const doSpin = () => {
            content.wheel.img.setRotate(0);
            content.wheel.rotationAngle = 0;
            // Hide the suspense query and stop it from listening
            content.slider.show = false;
            content.slider.listening = false;
            let spinningInterval = setInterval(() => {
                if (!content.wheel.isSpinning && !content.wheel.expectingSpin){
                    // Once the wheel has stopped spinning
                    let surpriseVal;
                    if (isSurprise){
                        // Sample from the distribution centred on expected value
                        // Old version that uses a Gaussian
                        // let m = _.mean(this.suspenseDraws);
                        // let s = standardDeviation(this.suspenseDraws);
                        // surpriseVal = Math.round(randomGaussian(m, s));
                        // this.data[this.roundIndex].surpriseVals.push({
                        //     mean: m,
                        //     std: s,
                        //     x: surpriseVal,
                        // });
                        surpriseVal = _.sample([this.drawnCard, this.randCard]);
                        this.data[this.roundIndex].surpriseVals.push(surpriseVal);
                        // remove the drawn cards and replace with the surprise card
                        content.deck.drawnCards.forEach(card => card.toggleDisplay());
                        content.deck.drawnGreyCard.hide();
                        content.deck.drawnGreyCard.setValue(surpriseVal); // replace with some value from the surprise distribution
                        content.deck.drawnGreyCard.toggleDisplay();
                        setTimeout(() => {
                            content.deck.drawnGreyCard.reveal();    
                        }, 1000)
                        
                    } else {
                        // Add to the all draws array
                        this.suspenseDraws.push(this.data[this.roundIndex].draws[this.trialIndex]);
                        try {
                            content.deck.drawnCards.filter(i => i.value != this.drawnCard)[0].toggleDisplay();    
                        } catch (error) {
                            // Catch in case we draw 2 of the same
                            content.deck.drawnCards[0].toggleDisplay();
                        }
                        this.data[this.roundIndex].surpriseVals.push({});
                    }
                    
                    // Add new score to cumulative score
                    this.data[this.roundIndex].cumulativeScore += (isSurprise ? surpriseVal : this.drawnCard);
                    // Update chart data - NB: cumulative score
                    clearInterval(spinningInterval);
                    setTimeout(() => {
                        addChartData(this.data[this.roundIndex].cumulativeScore, this.trialIndex+1) // score, label
                        // Increase round score
                        this.trialIndex += 1;
                        if (this.trialIndex == 5){
                            this.endRound();
                        } else {
                            content.drawCardBtn.toggleClickable();
                            content.instructions.text = "Click Draw to draw another card."
                            content.drawCardBtn.hide = false;
                        }
                    }, 1000)
                }
            }, 1000)
        }

        // If we need to query the player's suspense, call the promise and spin upon resolution
        if (settings.queryTrials.includes(this.trialIndex+1)){
            content.instructions.text = "";
            content.slider.show = true;
            content.wheel.disallowSpin();
            content.drawCardBtn.hide = true;
            content.slider.listen()
                .then((res) => {this.data[this.roundIndex].trials[this.trialIndex].feedback = res})
                .then(() => {content.wheel.allowSpin()}) // turn spinning back on
                .then(() => {content.instructions.text = "Hold space to spin the wheel,\n and release to stop."}) // update instructions
                .then(() => {doSpin()}) // begin spinning logic
        } else {
            content.instructions.text = "Hold space to spin the wheel,\n and release to stop."
            doSpin();
        }
    }

    endRound(){
        content.instructions.update({lineSpacing: 10});
        content.instructions.text = `Final score: ${this.data[this.roundIndex].cumulativeScore}\n ${(this.data[this.roundIndex].cumulativeScore > this.threshold ? "Bust!" : "You Win!")}`;
        // content.drawCardBtn.text.text = (this.data[this.roundIndex].cumulativeScore > this.threshold ? "Bust!" : "You Win!");
        setTimeout(() => {
            // Run the satisfaction query
            querySatisfaction = true;
            // hide the chart
            document.getElementById("myChart").style.visibility = "hidden";
            content.satisfaction.slider.listen()
                .then((res) => {this.data[this.roundIndex].satisfaction = res})
                .then(() => this.roundIndex += 1)
                .then(() => {
                    if (this.roundIndex == this.numRounds){
                        // TODO run end game redirect
                    } else {
                        this.newRound()
                    }
                })
        }, 3000)
        // Do the following in a .then() call
        // if (this.roundIndex == 18){
        //     console.log("End game")
        // } else {
        //     setTimeout(() => {
        //         content.instructions.text = "The next round will begin shortly...";
        //         content.wheel.rotationAngle = 0;
        //         setTimeout(() => {
        //             this.newRound();
        //         }, 1500)
        //     }, 1500)
        // }
    }

    nextRound(){
        content.deck.reset();
    }
}



class SuspenseQuery extends Primitive {
    // DEPRECATED replaced with the slider
    // The suspense query
    // Show text to the player and listen for a response using keyboard keys 1-5
    constructor(x, y, queryType, kwargs={}){
        super(x, y, kwargs);
        this.show = false;
        this.queryType = queryType;

        // Adjust text for screen size

        if (window.innerWidth <= 1100){
            // ipad-type size
            this.textSize = 20;
        } else if (_.inRange(window.innerWidth, 1100, 1500)){
            this.textSize = 24;
        } else if (_.inRange(window.innerWidth, 1500, 2000)){
            this.textSize = 28;
        } else if (_.inRange(window.innerWidth, 2000, 2300)) {
            this.textSize = 30;
        } else {
            this.textSize = 40;
        }

        this.textObj = new pText(
            `Please rate your current feelings of ${this.queryType}\n using the keyboard keys 1-5.\n 1 = no ${this.queryType}, 5 = highest ${this.queryType}.`, 
            this.pos.x, this.pos.y, 
            {textSize: this.textSize});
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
                if (res != undefined) {}
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

class SatisfactionQuery extends Primitive {
    constructor(x, y, kwargs={}){
        super(x, y, kwargs);
        this.slider = new Slider(x, y, 25, 5, "satisfaction", kwargs);
    }

    draw(){
        this.slider.draw();
    }
}

function gaussian(x, m, s){
    let frac = 1/(s * Math.sqrt(2 * PI));
    let exp = -0.5 * (((x - m)/ s)**2);

    return frac * (Math.exp(exp));
}

function standardDeviation(arr) {
    if (arr.length == 0) {return 0}

    // Creating the mean with Array.reduce
    let mean = arr.reduce((acc, curr) => {
        return acc + curr
    }, 0) / arr.length;

    // Assigning (value - mean) ^ 2 to
    // every array item
    arr = arr.map((k) => {
        return (k - mean) ** 2
    });

    // Calculating the sum of updated array 
    let sum = arr.reduce((acc, curr) => acc + curr, 0);

    // Calculating the variance
    let variance = sum / arr.length

    // Returning the standard deviation
    return Math.sqrt(sum / arr.length)
}
