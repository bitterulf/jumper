const Quintus = require('quintus');

const synaptic = require('synaptic');
const Neuron = synaptic.Neuron;
const Layer = synaptic.Layer;
const Network = synaptic.Network;
const Trainer = synaptic.Trainer;
const Architect = synaptic.Architect;

function Perceptron(input, hidden, output)
{
    // create the layers
    var inputLayer = new Layer(input);
    var hiddenLayer = new Layer(hidden);
    var outputLayer = new Layer(output);

    // connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    // set the layers
    this.set({
        input: inputLayer,
        hidden: [hiddenLayer],
        output: outputLayer
    });
}

Perceptron.prototype = new Network();
Perceptron.prototype.constructor = Perceptron;

const myPerceptron = new Perceptron(75,30,1);

const randomSight = function() {
    const result = [];
    for (var i = 0; i < 75; i++) {
        result.push(Math.round(Math.random()));
    }

    return result;
}

const shouldJump = function(data) {
    return myPerceptron.activate(data) > 0.5;
}

var Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Touch, UI")
        .setup({ maximize: true })
        .controls().touch()

Q.Sprite.extend("Player",{
  init: function(p) {
    this._super(p, { sheet: "player", x: 47, y: 90 });
    this.add('2d, platformerControls');

    this.on("hit.sprite",function(collision) {
      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" });
        this.destroy();
      }
    });

    this.on("step",function(time) {
        if (shouldJump(randomSight())) {
            console.log('jump');
        }
        if (this.p.y > 272) {
            Q.stageScene("endGame",1, { label: "You died!" });
        }
        if (this.p.x > 6500) {
            Q.stageScene("endGame",1, { label: "You won!" });
        }
    });
  }
});

Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

function generateLevel() {
    const width = 500;
    let air = Array(width).fill(0);
    air[0] = 1;
    air[air.length-1] = 1;
    let ground = Array(width).fill(1);
    for (let i = 10; i < ground.length; i++) {
        if (Math.random() < 0.3 && ground[i-1] === 1 && ground[i-2] === 1) {
            ground[i] = 0;
            ground[i-1] = 0;
            i++;
        }
    }
    let bedrock = Array(width).fill(1);
    let level = [air, air, air, air, ground, ground, ground, ground, ground, bedrock];
    let layer = new Q.TileLayer({ sheet: 'tiles' });
    layer.p.tiles = level;
    return layer;
}

Q.scene("level1",function(stage) {
  //stage.collisionLayer(new Q.TileLayer({ dataAsset: 'level.json', sheet: 'tiles' }));
  stage.collisionLayer(generateLevel());
  var player = stage.insert(new Q.Player());

  stage.add("viewport").follow(player);

  //stage.insert(new Q.Enemy({ x: 700, y: 0 }));
  //stage.insert(new Q.Enemy({ x: 800, y: 0 }));
  //stage.insert(new Q.Tower({ x: 180, y: 50 }));
});

Q.scene('endGame',function(stage) {
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Play Again" }))
  var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h,
                                        label: stage.options.label }));
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });
  box.fit(20);
});

Q.load("sprites.png, sprites.json, level.json, tiles.png", function() {
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });
  Q.compileSheets("sprites.png","sprites.json");
  Q.stageScene("level1");
});
