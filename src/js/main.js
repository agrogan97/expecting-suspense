// -- PARAMS --
var assets = {"imgs" : {}, "fonts" : {}, "jsons": {}}
var params = {
    verbose: false, 
    positionMode: "PERCENTAGE", 
    textAlign: "CENTER", 
    imageMode: "CENTER", 
    rectMode: "CENTER", 
    angleMode: "DEGREES"};
var content = {};
var myGame;
// ------------

function handleClick(e){
    // -- p5.js click listener -- //
    pClickListener(e)
}

function preload(){
    assets.imgs['card'] = loadImage('static/imgs/card_15p.png');
    assets.imgs['card_blue'] = loadImage('static/imgs/card_blue_15p.png')
    assets.imgs['wheel'] = loadImage('static/imgs/wheel_200p.png');
    assets.jsons["bottom10"] = loadJSON('static/json/bottom10.json');
    assets.jsons["top5"] = loadJSON('static/json/top5.json')
    
}

function setup(){
    var canvas = createCanvas(windowWidth, windowHeight*0.5);
    pixelDensity(1);
    console.log(windowWidth, windowHeight)
    frameRate(60)
    canvas.parent("gameCanvas");
    content.vars = {};
    content.vars.queryType = _.sample(["suspense", "surprise"])
    

    document.getElementById("gameCanvas").addEventListener("click", (e) => {
        handleClick(e);
    })

    psychex.aesthetics.pText.edit({textSize: 32, stokeWeight: 0.4})
    
    // Game content
    content.deck = new Deck(10, 5, _.range(0, 9));
    content.wheel = new Wheel(50, 55, assets.imgs.wheel);

    content.instructions = new pText(`Draw a card!`, 80, 20, {fontSize: 32});
    content.drawCardBtn = new pButton(80, 45, 7.5, 12.5, {backgroundColor: "white", borderWidth: 4}).addText("Draw", {color: "black", textSize: 32});
    content.suspenseQuery = new SuspenseQuery(80, 5, content.vars.queryType, {color: 'black', textSize: 32, lineSpacing: 8});

    myGame = new MyGame();
    myGame.queryType = content.vars.queryType;

    content.drawCounter = new pText(`Drawn ${myGame.roundIndex}/5 cards`, 80, 65, {fontSize: 32});

    content.drawCardBtn.onClick = () => {
        myGame.startTrial();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight*0.6);
  }

function draw(){
    clear();
    background("white")

    content.deck.draw();
    content.wheel.draw();
    content.instructions.draw();
    content.drawCardBtn.draw();
    pText.draw_(`Round ${myGame.roundIndex+1}/18`, 80, 65, {fontSize: 32});
    pText.draw_(`Drawn ${myGame.trialIndex}/5 cards`, 80, 77.5, {fontSize: 32});
    content.suspenseQuery.draw();
    }