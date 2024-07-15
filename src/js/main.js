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
var querySatisfaction = true;
// ------------

function handleClick(e){
    // -- p5.js click listener -- //
    pEventListener(e, "click")
}

function mouseDragged(e){
    let C = Primitive.toPercentage(createVector(mouseX, mouseY));
    pEventListener(e, "drag");
}

function preload(){
    assets.imgs['card_blank'] = loadImage('static/imgs/card_blank.png');
    assets.imgs['card_yellow'] = loadImage('static/imgs/card_yellow.png');
    assets.imgs['card_green'] = loadImage('static/imgs/card_green.png')
    assets.imgs['card_grey'] = loadImage('static/imgs/card_grey_rsz.png')
    assets.imgs['wheel'] = loadImage('static/imgs/wheel_updated_200.png');
    assets.jsons['bottom10'] = loadJSON('static/json/bottom10.json');
    assets.jsons["top5"] = loadJSON('static/json/top5.json')

    // Load in 3 jsons with our low suspense, medium suspense, and high suspense rounds
    assets.jsons["lowSus"] = loadJSON('static/json/lowSus.json');
    assets.jsons["medSus"] = loadJSON('static/json/medSus.json');
    assets.jsons["highSus"] = loadJSON('static/json/highSus.json');
}

function setup(){
    var canvas = createCanvas(windowWidth, windowHeight*0.5);
    pixelDensity(1);
    console.log(windowWidth, windowHeight)
    frameRate(60)
    canvas.parent("gameCanvas");
    content.vars = {};
    content.vars.queryType = _.sample(["suspense", "surprise"]); // But actually from either URL params or jatos params
    content.vars.queryType = "suspense";
    

    document.getElementById("gameCanvas").addEventListener("click", (e) => {
        handleClick(e);
    })

    let textSize;
    if (window.innerWidth <= 1100){
        // ipad-type size
        textSize = 20;
    } else if (_.inRange(window.innerWidth, 1100, 1500)){
        textSize = 24;
    } else if (_.inRange(window.innerWidth, 1500, 2000)){
        textSize = 28;
    } else if (_.inRange(window.innerWidth, 2000, 2300)) {
        textSize = 30;
    } else {
        textSize = 40;
    }

    psychex.aesthetics.pText.edit({textSize: textSize, stokeWeight: 0.4})
    
    // Game content
    content.deck = new Deck(10, 5, _.range(0, 9));
    content.wheel = new Wheel(50, 55, assets.imgs.wheel);

    content.instructions = new pText(`Draw a card!`, 80, 20, {});
    content.drawCardBtn = new pButton(80, 45, 7.5, 12.5, {backgroundColor: "white", borderWidth: 5}).addText("Draw", {color: "black"});
    content.suspenseQuery = new SuspenseQuery(80, 5, content.vars.queryType, {color: 'black', lineSpacing: 8});

    myGame = new MyGame();
    myGame.queryType = content.vars.queryType;

    content.drawCounter = new pText(`Drawn ${myGame.roundIndex}/5 cards`, 80, 65, {});

    content.drawCardBtn.onClick = () => {
        myGame.startTrial();
    }

    content.slider = new Slider(75, 50, 15, 1, content.vars.queryType);
    content.slider.show = false;

    content.satisfaction = new SatisfactionQuery(37.5, 40);
    content.satisfaction.slider.textObj.text = `Please rate your level of satisfaction in the previous round \n using the slider below.`
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight*0.6);
}

function draw(){
    clear();
    background("white")

    if (querySatisfaction){
        content.satisfaction.show = true;
        content.satisfaction.draw();
    } else {
        content.deck.draw();
        content.wheel.draw();
        content.instructions.draw();
        content.slider.draw();
        if (!content.drawCardBtn.hide){
            content.drawCardBtn.draw();
            pText.draw_(`Round ${myGame.roundIndex+1}/24`, 80, 65, {textSize: textSize});
            pText.draw_(`Drawn ${myGame.trialIndex}/5 cards`, 80, 77.5, {textSize: textSize});
        }
    }

    
}