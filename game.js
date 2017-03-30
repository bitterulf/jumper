const Quintus = require('quintus');

const convnetjs = require('./convnet');
const deepqlearn = require('./deepqlearn');

window.convnetjs = convnetjs;
window.deepqlearn = deepqlearn;
window.cnnutil = require('./util');
window.cnnvis = require('./vis');

class Brain {
    constructor(width, height) {
        const num_inputs = width * height;
        const num_actions = 2;
        const temporal_window = 1;
        const network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

        let layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
        //layer_defs.push({type:'conv', sx:3, filters:8, stride:1, activation:'relu'});
        //layer_defs.push({type:'pool', sx:3, stride:2});
        //layer_defs.push({type:'conv', sx:3, filters:8, stride:1, activation:'relu'});
        //layer_defs.push({type:'pool', sx:3, stride:2});
        layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
        layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
        layer_defs.push({type:'regression', num_neurons:num_actions});

        const tdtrainer_options = {learning_rate:0.001, momentum:0.1, batch_size:64, l2_decay:0.01};

        let opt = {};
        opt.temporal_window = 0;
        opt.experience_size = 3000;
        opt.start_learn_threshold = 1000;
        opt.gamma = 0.7;
        opt.learning_steps_total = 1000;
        opt.learning_steps_burnin = 200;
        opt.epsilon_min = 0.05;
        opt.epsilon_test_time = 0.05;
        opt.layer_defs = layer_defs;
        opt.tdtrainer_options = tdtrainer_options;

        //this.brain = new deepqlearn.Brain(num_inputs, num_actions, opt);
        this.brain = new deepqlearn.Brain(width, 2, opt);
        this.width = width;

        //this.brain.epsilon_test_time = 0.0; // don't make any random choices, ever
        //this.brain.learning = false;
    }

    play(input) {
        input = input.slice(0, brain.width);
        //let v = new convnetjs.Vol(input.length, 1, 1, 0.0);
        //v.w = input;
        let action = this.brain.forward(input);
        //console.log(input, action);
        return action;
    }
}


const brain = new Brain(15, 1);

const randomSight = function() {
    const result = [];
    for (var i = 0; i < 75; i++) {
        result.push(Math.round(Math.random()));
    }

    return result;
}

const realSight = function(p) {
    const tileLayer = Q.stage()._collisionLayers[0];
    let tileStartX = Math.floor((p.x - p.cx - tileLayer.p.x) / tileLayer.p.tileW);
    //let tileStartY = Math.floor((this.p.y - this.p.cy - tileLayer.p.y) / tileLayer.p.tileH);
    //let tileEndX =  Math.ceil((this.p.x - this.p.cx + this.p.w - tileLayer.p.x) / tileLayer.p.tileW);
    //let tileEndY =  Math.ceil((this.p.y - this.p.cy + this.p.h - tileLayer.p.y) / tileLayer.p.tileH);
    let tileY = 4;
    let tileEndX = tileStartX + brain.width;

    let fullTile = Array(tileLayer.p.tileW).fill(1);
    let emptyTile = Array(tileLayer.p.tileW).fill(0);

    let inputVector = [];
    for(var tileX = tileStartX; tileX<=tileEndX; tileX++) {
        if(tileLayer.tilePresent(tileX,tileY)) {
            inputVector.push(1);
            //inputVector = inputVector.concat(fullTile.slice());
        } else {
            //inputVector = inputVector.concat(emptyTile.slice());
            inputVector.push(0);
        }
    }
    //console.log(tileStartX, inputVector);
    return inputVector;
}

const shouldJump = function(data) {
    //data = data.slice(0, 75);
    const action = brain.play(data);
    //console.log('action', action);
    return action === 0;
}

const vis_canvas = document.createElement('canvas');
vis_canvas.width = 350;
vis_canvas.height = 150;
document.body.append(vis_canvas);

const graph_canvas = document.createElement('canvas');
graph_canvas.width = 350;
graph_canvas.height = 150;
document.body.append(graph_canvas);

const net_canvas = document.createElement('canvas');
net_canvas.width = 700;
net_canvas.height = 200;
document.body.append(net_canvas);

const epsilon = document.createElement('span');
document.body.append(epsilon);

let clock = 0;

var reward_graph = new cnnvis.Graph();
let draw_stats = () => {
    var b = brain.brain;
    var canvas = vis_canvas;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var netin = b.last_input_array;
    ctx.strokeStyle = "rgb(0,0,0)";
    //ctx.font="12px Verdana";
    //ctx.fillText("Current state:",10,10);
    ctx.lineWidth = 10;
    ctx.beginPath();
    for(var k=0,n=netin.length;k<n;k++) {
        ctx.moveTo(10+k*12, 120);
        ctx.lineTo(10+k*12, 120 - netin[k] * 100);
    }
    ctx.stroke();

    if(clock % 100 === 0) {
        reward_graph.add(clock/100, b.average_reward_window.get_average());
        var gcanvas = graph_canvas;
        reward_graph.drawSelf(gcanvas);
        epsilon.innerText = brain.brain.epsilon;
    }
}

let draw_net = () => {
    var canvas = net_canvas;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var L = brain.brain.value_net.layers;
    var dx = (W - 50)/L.length;
    var x = 10;
    var y = 40;
    ctx.font="12px Verdana";
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillText("Value Function Approximating Neural Network:", 10, 14);
    for(var k=0;k<L.length;k++) {
        if(typeof(L[k].out_act)==='undefined') continue; // maybe not yet ready
        var kw = L[k].out_act.w;
        var n = kw.length;
        var dy = (H-50)/n;
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillText(L[k].layer_type + "(" + n + ")", x, 35);
        for(var q=0;q<n;q++) {
            var v = Math.floor(kw[q]*255);
            if(v >= 0) ctx.fillStyle = "rgb(0,0," + v + ")";
            if(v < 0) ctx.fillStyle = "rgb(" + (-v) + ",0,0)";
            ctx.fillRect(x,y,10,10);
            y += 12;
            if(y>H-25) { y = 40; x += 12};
        }
        x += 50;
        y = 40;
    }
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
        clock++;
        Q.inputs['right'] = true;
        if (shouldJump(realSight(this.p))) {
            //console.log('jump');
            if (this.p.y === 113) {
                this.p.vy = -400
            }
        }
        if (this.p.y > 272) {
            //Q.stageScene("endGame",1, { label: "You died!" });
            Q.clearStages();
            Q.stageScene('level1');
            brain.brain.backward(-1);
            console.log('died!');
        }
        if (this.p.x > 6500) {
            //Q.stageScene("endGame",1, { label: "You won!" });
            Q.clearStages();
            Q.stageScene('level1');
            brain.brain.backward(1);
            console.log('won!');
        }

        if (Math.floor(this.p.x) % 100 === 0) {
            console.log('progress!');
            brain.brain.backward(1);
        }
            draw_stats();
        if (clock % 10 === 0) {
        draw_net();
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
