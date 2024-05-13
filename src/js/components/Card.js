class Card {
    constructor(x, y, id, value=""){
        this.position = createVector(x, y)
        this.id = id;
        this.value = value;
        this.doShuffle = false;
        this.animationLength = 1;
        this.ticker = 0;
        this.doUndraw = false;

        this.shuffleCoords = {x: [], y: []};
    }

    setValue(value){
        this.value = value;
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
        this.shuffleCoords.x = this.lerper(this.position.x, coords.x, 1/(this.animationLength*_.round(frameRate())), insertNoise) // 1 / seconds * FPS = total frame freq
        this.shuffleCoords.y = this.lerper(this.position.y, coords.y, 1/(this.animationLength*_.round(frameRate())), insertNoise)
        this.doShuffle = true
        this.shuffleIx = 0;
    }

    hide(){
        this.value = "";
    }

    toggleDisplay(){
        // Hide the card itself - simulates drawing from the deck and placing them back in
        this.doUndraw = !this.doUndraw;
    }

    draw(){
        if (this.doUndraw) {return}
        // if shuffling, set new position
        if (this.doShuffle){
            if (this.shuffleIx >= this.shuffleCoords.x.length) {
                this.doShuffle = false
                this.position = createVector(_.round(_.last(this.shuffleCoords.x)), _.round(_.last(this.shuffleCoords.y)))
                this.ticker = 0;
            } else {
                if (this.ticker%1 == 0){
                    this.position = createVector(this.shuffleCoords.x[this.shuffleIx], this.shuffleCoords.y[this.shuffleIx])
                    this.shuffleIx += 3;
                }
                this.ticker += 1;
            }
        }
        let pos = this.position;
        push();
        translate(pos.x, pos.y)
        scale(0.1);
        image(assets.imgs.card, 0, 0)
        pop();

        push();
        translate(pos.x, pos.y)
        textSize(36)
        text(this.value, -10, 12);
        pop();
    }
}

class Deck {
    constructor(x, y, N){
        this.x = x; // x-coord of top-LHS
        this.y = y; // y-coord of top-RHS
        this.xOffset = 150;
        this.yOffset = 150;
        this.nCards = N; // number of cards in deck
        this.animationLength = 1;
        console.log(`Using ${this.nCards}-card deck`);

        // Always have 3 in a column, and find how many rows/leftovers
        this.nCols = 3;
        this.nRows = Math.ceil(this.nCards/this.nCols);

        // Create a deck of cards and render them as a grid, storing copies in this.card
        this.cards= [];
        _.range(0, this.nRows).forEach((rowIx, row) => { 
            _.range(0, this.nCols).forEach((colIx, col) => {
                // Check number of cards
                if (rowIx*this.nRows + colIx < this.nCards) {
                    this.cards.push(
                        new Card(
                            this.x + this.xOffset*colIx, // x-position
                            this.y + this.yOffset*rowIx, // y-position
                            rowIx*this.nRows + colIx, // id
                            rowIx*this.nRows + colIx // value
                        )
                    )
                }
            })
        })

        // Create 2 placeholder cards that represent 'drawn' cards
        this.drawnCards = [
            new Card(this.x - this.xOffset, this.y + 0.5*this.yOffset, 'drawn1'),
            new Card(this.x - this.xOffset, this.y + 1.5*this.yOffset, 'drawn2')
        ]
        this.drawnCards.forEach(card => {card.toggleDisplay()})
    }

    setCards(cards){
        cards.forEach((val, ix) => {this.cards[ix].setValue(val)})
    }

    drawCards(cardPair){
        // set the value of the drawn cards and update this.drawnCards, and render new values
        // top card is index 0, bottom card is index 1
        cardPair.forEach((val, ix) => {this.drawnCards[ix].setValue(val)})
    }

    shuffle(animate=true){
        // This only appears like a shuffle, it's only actually an animation
        this.cards.forEach(card => card.hide())

        // Take a copy of the card list, shuffle it, and get a list of shuffled positions
        let newCardList =  []
        _.shuffle(this.cards).forEach(card => {newCardList.push(createVector(card.position.x, card.position.y))})
        newCardList.forEach((newCard, ix) => {
            this.cards[ix].moveTo(newCard, false);
        })
        console.log("shuffling")
    }

    multiShuffle(){
        this.drawnCards.forEach(card => {if (!card.doUndraw){card.toggleDisplay()}})
        let loops = 0;
        let intv = setInterval(() => {
            this.shuffle();
            if (loops == 4){
                clearInterval(intv);
                setTimeout(() => {
                    this.drawFromDeck(_.sampleSize(deck.cards, 2).map(i => i.id) );
                }, 1000);
            }
            loops += 1;
        }, this.animationLength*1000*1.01/2)
    }

    drawFromDeck(pair){
        pair.forEach((card, ix) => {
            this.drawnCards[ix].setValue(card);
            this.drawnCards[ix].toggleDisplay();
        })
        // TODO and hide the first 2 in the deck to make it seem like they've been drawn
    }

    draw() {
        this.cards.forEach((card) => {card.draw()})
        this.drawnCards.forEach((card) => {card.draw()})
    }
}