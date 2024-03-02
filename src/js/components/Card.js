class Card {
    constructor(x, y, id, value=""){
        this.position = createVector(x, y)
        this.id = id;
        this.value = value;
    }

    setValue(value){
        this.value = value;
        this.textLabel.text = this.value;
    }

    hideNumber(){

    }

    draw(){
        let pos = this.position;
        push();
        translate(pos.x, pos.y)
        image(assets.imgs.card, 0, 0)
        pop();
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
        if (animate) {
            this.cards.forEach((card, ix) => {
                card.moveTo(cardCoordsShuffled[ix])
            })
        }
    }

    draw() {
        this.cards.forEach((card) => {card.draw()})
        // this.drawCards.forEach((card) => {card.draw()})
    }
}