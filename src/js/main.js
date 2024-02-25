let sprite = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png')
app.stage.addChild(sprite);

const deckContainer = new PIXI.Container();
app.stage.addChild(deckContainer)

let deck = new Deck(2*window.innerWidth/3, 100, 8)
// deckContainer.addChild(deck)

// const basicText = new PIXI.Text('Test text')
// basicText.x = 50
// basicText.y = 50
// app.stage.addChild(basicText)

// const card2 = new Card(150, 150, 'test', 7)