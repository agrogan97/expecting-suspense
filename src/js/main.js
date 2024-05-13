var canvas;
var deck;
var wheel;
var assets = {'imgs' : {}};

function preload(){
    assets.imgs['card'] = loadImage('/static/imgs/card.png');
    assets.imgs['wheel'] = loadImage('/static/imgs/wheel.png');
}

function setup(){
    var canvas = createCanvas(window.innerWidth, 500);
    frameRate(24)
    canvas.parent("gameCanvas")
    background("white")
    angleMode(DEGREES);
    imageMode(CENTER);

    deck = new Deck(2*width/3, 100, 8);
    wheel = new Wheel(width/8, 50);
    // wheel = new Wheel(100, 100);
    
}

function mousePressed(){

}

function draw(){
    clear();
    deck.draw(); 
    wheel.draw();
}