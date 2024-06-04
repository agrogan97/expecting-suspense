class Card extends Primitive {
    // An image object extended to include some animations
    constructor(x, y, id, value="", kwargs={}){
        super(x, y, kwargs);

        this.id = id;
        this.value = value;
        this.doShuffle = false;
        this.animationLength = 0.5;
        this.ticker = 0;
        this.show = true;
        this.shuffleCoords = {x: [], y: []};
        this.originalPos = createVector(x, y);
        // NB: must give x and y, not this.position.x and this.position.y - as positionMode = "PERCENTAGE"
        this.img = new pImage(x, y, assets.imgs.card, kwargs).setScale(0.5);
        this.centerPoint = this.img.centerPoint;
        // this.label = new pText(this.value, this.pos.x + this.img.width/4, this.pos.y + this.img.height/4, {fontSize: 36, textAlign:"CENTER", positionMode: "PIXELS", ...kwargs});
        this.label = new pText(this.value, this.centerPoint.x, this.centerPoint.y);
    }

    setValue(value){
        this.value = value;
        this.label.text = value;
    }

    lerper(a, b, N, insertNoise=false){
        // Lerp between a and b in N steps
        let vals = _.range(0, 1, N).map(i => lerp(a, b, i));
        if (insertNoise){
            vals = vals.map(i => (a + Math.random(-1, 1)*_.random((a-b)/2, (b-a)/2)))
        }
        // Round the last value so we don't get a drifting effect
        vals[vals.length-1] = b;
        return vals
    }

    moveTo(coords, insertNoise=false){
        // if percentage mode, translate coords to pixels
        // everything else uses percentage mode, so we'll expect coords to be a p5.vector with % sizing
        // coords = Primitive.toPixels(coords);

        this.shuffleCoords.x = this.lerper(this.pos.x, coords.x, 1/(this.animationLength*_.round(frameRate())), insertNoise); // 1 / seconds * FPS = total frame freq
        this.shuffleCoords.y = this.lerper(this.pos.y, coords.y, 1/(this.animationLength*_.round(frameRate())), insertNoise);
        this.doShuffle = true;
        this.shuffleIx = 0;
    }

    hide(){
        // `flip` the card to hide the value - but not remove the value var
        this.label.text = "";
    }

    toggleDisplay(){
        // Hide the card itself - simulates drawing from the deck and placing them back in
        this.show = !this.show;
    }

    draw(){
        if (!this.show){return}
        if (this.doShuffle){
            if (this.shuffleIx >= this.shuffleCoords.x.length) {
                this.doShuffle = false
                this.pos = createVector(_.round(_.last(this.shuffleCoords.x)), _.round(_.last(this.shuffleCoords.y)))
                this.ticker = 0;
            } else {
                if (this.ticker%1 == 0){
                    this.pos = createVector(this.shuffleCoords.x[this.shuffleIx], this.shuffleCoords.y[this.shuffleIx])
                    this.shuffleIx += 3;
                }
                this.ticker += 1;
            }
        }
        // Update the positions of the card img and the label - including rerunning getCenter()
        this.img.pos = this.pos;
        this.img.getCenter();
        this.label.pos = this.img.centerPoint;

        this.img.draw();
        this.label.draw();
    }
}

class Deck extends Primitive {
    constructor(x, y, cardVals, kwargs={}){
        super(x, y, kwargs);
        // this.initPos = createVector(x, y)
        this.nCards = cardVals.length;
        this.cardVals = cardVals;
        const offset = Primitive.toPercentage(createVector(assets.imgs.card.width, assets.imgs.card.height))
        this.xOffset = offset.x*0.65;
        this.yOffset = offset.y*0.55;
        this.animationLength = 1.5;
        console.log(`Using ${this.nCards}-card deck`);

        // Set 3 in a column and then place leftovers in bottom row
        this.nCols = 3;
        this.nRows = Math.ceil(this.nCards/this.nCols);

        // place cards
        this.cards= [];
        _.range(0, this.nRows).forEach((rowIx, row) => { 
            _.range(0, this.nCols).forEach((colIx, col) => {
                // Check number of cards
                if (rowIx*this.nRows + colIx < this.nCards) {
                    this.cards.push(
                        new Card(
                            this.pos.x + this.xOffset*colIx, // x-pos
                            this.pos.y + this.yOffset*rowIx, // y-pos
                            rowIx*this.nRows + colIx, // id
                            // rowIx*this.nRows + colIx, // value
                            this.cardVals[rowIx*this.nRows + colIx],
                            {imageMode: "CORNER", textAlign: "LEFT"}
                        )
                    )
                }
            })
        });

        // Create 2 placeholder cards that represent 'drawn' cards
        this.drawnCards = [
            new Card(this.pos.x - this.xOffset, this.pos.y + 0.5*this.yOffset, 'drawn1'),
            new Card(this.pos.x - this.xOffset, this.pos.y + 1.5*this.yOffset, 'drawn2')
        ]
        this.drawnCards[0].img.img = assets.imgs.card_blue;
        this.drawnCards.forEach(card => {card.toggleDisplay()})
    }

    setCardVals(cardVals){
        this.cards.forEach((val, ix) => {this.cards[ix].setValue(val)})
        this.cards.forEach(card => {card.setValue(cardVals)});
    }

    drawCards(cardPair){
        // set the value of the drawn cards and update this.drawnCards, and render new values
        // top card is index 0, bottom card is index 1
        this.drawCards[0].setValue(cardPair[0]);
        this.drawCards[1].setValue(cardPair[1]);
    }

    drawFromDeck(pair){
        pair.forEach((card, ix) => {
            this.drawnCards[ix].setValue(card);
            this.drawnCards[ix].toggleDisplay();
        })
        // TODO and hide the first 2 in the deck to make it seem like they've been drawn
        this.cards[0].toggleDisplay();
        this.cards[1].toggleDisplay();
    }

    shuffle(){
        this.cards.forEach(card => card.hide());

        // Take a copy of the card list, shuffle it, and get a list of shuffled positions
        let newCardList =  [];
        _.shuffle(this.cards).forEach(card => {newCardList.push(createVector(card.pos.x, card.pos.y))})
        newCardList.forEach((newCard, ix) => {
            this.cards[ix].moveTo(newCard, false);
        })
    }

    multiShuffleAndDraw(depth=3, pair=[]){
        // shuffle the deck multiple times and draw 2 cards, then flip all cards and 'remove' 2 from the deck
        // to make it seem like they've been drawn
        // depth is number of shuffles to do
        // pair is the pair of cards to be drawn
        return new Promise((resolve, reject) => {
            // hide all cards before shuffling
        this.drawnCards.forEach(card => {if (card.show){card.toggleDisplay()}});
        let loops = 1;
        // Queue shuffle animations by setting an interval at the animation length
        let intv = setInterval(() => {
            this.shuffle();
            if (loops == depth){
                clearInterval(intv);
                setTimeout(() => {
                    // If a pair isn't provided, then sample at random
                    if (pair.length == 0 || pair == undefined){
                        pair = _.sampleSize(this.cardVals, 2);
                    }
                    // Draw 2 cards from the deck
                    this.drawFromDeck(pair);
                    resolve();
                }, 1000); // this waits 1 second before drawing from the deck
            }
            loops += 1;
        }, this.animationLength*1000*0.2);
        })
    }

    reset(){
        // Make all cards visible in the original grid and remove the drawn cards
        this.drawnCards.forEach(card => card.toggleDisplay())
        this.cards.forEach((card, ix) => {
            card.show = true;
            this.cards.forEach(card => {card.moveTo(card.originalPos)});
            card.setValue(this.cardVals[ix]);
        });

    }

    test(){
        content.deck.multiShuffleAndDraw(3);
        setTimeout(() => {
            this.reset();
        }, 5000)
    }

    draw(update={}){
        super.draw(update)
        push();
        this.cards.forEach((card) => {card.draw()})
        this.drawnCards.forEach((card) => {card.draw()})
        pop();
    }


}