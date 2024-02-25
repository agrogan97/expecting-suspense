class Card {
    constructor(x, y, id, value=""){
        this.cardContainer = new PIXI.Container();

        this.card = PIXI.Sprite.from('/static/imgs/card.png')
        this.card.anchor.set(0.5)
        this.cardContainer.x = x
        this.cardContainer.y = y;
        this.id = id
        // this.card.x = x;
        // this.card.y = y;
        this.card.scale.set(0.05)
        this.cardContainer.addChild(this.card);
        // this.value = _.sample(_.range(-3, 9)).toString()
        this.value = value

        // Add card value label
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 34,
            fontStyle: 'italic',
            fontWeight: 'bold',
        })

        this.textLabel = new PIXI.Text(this.value, style)
        this.textLabel.anchor.set(0.5)
        this.textLabel.x = 0
        this.textLabel.y = 0 
        this.cardContainer.addChild(this.textLabel)

        deckContainer.addChild(this.cardContainer)
    }

    setValue(value){
        this.value = value;
        this.textLabel.text = this.value;
    }

    moveTo(coords){
        // Get vector between points
        let xDiff = this.cardContainer.x - coords.x
        let yDiff = this.cardContainer.y - coords.y
        app.ticker.add(() => {
            // this.cardContainer.rotation += 0.01;
            if ((_.inRange(this.cardContainer.x, coords.x*0.999, coords.x*1.001)) && (_.inRange(this.cardContainer.y, coords.y*0.999, coords.y*1.001))){
                {}
            } else {
                // TODO this bit isn't right, actually work out how to do it
                this.cardContainer.x -= xDiff*0.01;
                this.cardContainer.y -= yDiff*0.01;
            }
        })
    }
}

class Deck {
    constructor(x, y, N){
        this.x = x // x-coord of top-LHS
        this.y = y // y-coord of top-RHS
        this.xOffset = 100;
        this.yOffset = 100;
        this.nCards = N // number of cards in deck
        console.log(`Using ${this.nCards}-card deck`)

        // Always have 3 in a column, and find how many rows/leftovers
        this.nCols = 3
        this.nRows = Math.ceil(this.nCards/this.nCols)

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
                            rowIx*this.nRows + colIx
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
        // 2 parts: actually shuffle card positions, and run shuffle animation
        
        // Get a list of the coordinates of all cards:
        let cardCoords = []
        this.cards.forEach((card, ix) => {
            cardCoords.push({x : card.cardContainer.x, y : card.cardContainer.y})
        })
        // Shuffle them
        let cardCoordsShuffled = _.shuffle(cardCoords)
        cardCoordsShuffled.forEach((val, ix) => {
            // console.log(cardCoords[ix], cardCoordsShuffled[ix])
        })


        // For each card in the deck, move it to the coordinates of the card with the same index
        this.cards.forEach((card, ix) => {
            card.moveTo(cardCoordsShuffled[ix])
        })
        
    }
}