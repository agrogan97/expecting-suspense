var canvas;
var deck;
var assets = {'imgs' : {}};

function preload(){
    assets.imgs['card'] = loadImage('/static/imgs/card.png')
}

function setup(){
    canvas = createCanvas(window.innerWidth, window.innerHeight/2);
    canvas.parent("gameCanvas")
    rectMode(CENTER);
    imageMode(CENTER);
    deck = new Deck(2*window.innerWidth/3, 100, 8)

}

function draw(){
    deck.draw();
}

function mousePressed(){

}