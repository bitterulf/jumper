const Quintus = require('quintus');

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
    let tileEndX = tileStartX + 5;

    let fullTile = Array(tileLayer.p.tileW).fill(1);
    let emptyTile = Array(tileLayer.p.tileW).fill(0);

    let inputVector = [];
    for(var tileX = tileStartX; tileX<=tileEndX; tileX++) {
        if(tileLayer.tilePresent(tileX,tileY)) {
            inputVector = inputVector.concat(fullTile.slice());
        } else {
            inputVector = inputVector.concat(emptyTile.slice());
        }
    }
    //console.log(tileStartX, inputVector);
    return inputVector;
}

const shouldJump = function(data) {
    data = data.slice(0, 75);
    return true;
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
        Q.inputs['right'] = true;
        if (shouldJump(realSight(this.p))) {
            console.log('jump');
            if (this.p.y === 113) {
                this.p.vy = -400
            }
        }
        if (this.p.y > 272) {
            //Q.stageScene("endGame",1, { label: "You died!" });
            Q.clearStages();
            Q.stageScene('level1');
        }
        if (this.p.x > 6500) {
            //Q.stageScene("endGame",1, { label: "You won!" });
            Q.clearStages();
            Q.stageScene('level1');
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
