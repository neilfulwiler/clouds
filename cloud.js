define([
  'underscore'
],
function(_) {

  var UPDATE_INTERVAL = 100
    , BACKGROUND_COLOR = "rgba(17, 82, 248, 0.52)"
    , NCLOUDS = 10
    , CLOUD_RADIUS = 50
    , CLOUD_WIDTH = 50
    , CLOUD_SPEED_RANGE = [.5,2]
    , PUFFS_PER_CLOUD = 10
    ;

  // exports objects
  var exports = {};

  /**

  CloudFactory

  For facilitating the creation of clouds, simply
  binds to the a canvas context and then passes this
  in to each cloud instance it creates. Also allows for
  default creation of clouds scattered evenly around
  the canvas with make().

  **/

  var CloudFactory = function(ctx) {
    this.canvas = ctx.canvas;
    this.context = ctx;
  }

  _.extend(CloudFactory.prototype, {
    newInstance : function(x,y) {
      return new Cloud(x,y,this.context);
    },

    /**

    make

    takes nclouds and optionally next. nclouds
    is the number of clouds created and next is
    a function that returns the coordinates of
    the next cloud. This function will be bound
    to the cloudFactory instance upon invocation

    **/

    make : function(nclouds, next) {
      next = next || function() {
        var x = Utils.randint(this.canvas.width)
          , y = Utils.randint(this.canvas.height)
          ;
        return [x,y];
      };

      next = next.bind(this);

      var that=this;
      return _.map(_.range(nclouds), function() {
        var xy = next();
        return that.newInstance.apply(that,xy);
      });
    }

  });

  /**

  puff_maker

  This function defines how the clouds are created according
  relative to the (x,y) of the cloud itself. Default implementation
  simply places a cloud randomly within a square of sides
  2*CLOUD_WIDTH

  **/

  var puff_maker = function() {
    var x = Utils.randint(this.pos.x - CLOUD_WIDTH, this.pos.x + CLOUD_WIDTH);
    var y = Utils.randint(this.pos.y - CLOUD_WIDTH, this.pos.y + CLOUD_WIDTH);
    return this.factory.newInstance(x,y,CLOUD_RADIUS);
  };

  /**

  Cloud

  The cloud itself is composed of PUFFS_PER_CLOUD puffs, which
  are centered around the (x,y) coordinates of the cloud as described
  by the puff_maker function (which is bound to the instance of cloud)

  **/

  var Cloud = function(x,y,ctx) {
    this.pos = new Pos(x,y);
    this.factory = new CircleFactory(ctx);
    this.puff_maker = fluff_maker.bind(this);
    this.speed = randint.apply(this, CLOUD_SPEED_RANGE);
    this.init_fluff();
  }

  _.extend(Cloud.prototype, {
    init_fluff: function() {
      var x,y;
      var puffs = _.map(_.range(PUFFS_PER_CLOUD), this.puff_maker);
      this.puffs = puffs;
    },

    draw: function() {
      _.each(this.puffs, function(puff) {
        puff.draw();
      });
    },

    update: function() {
      var speed = this.speed;
      _.each(this.puffs, function(puff) {
        puff.pos.translate(speed,0);
      });
    }
  });

  /**

  CloudFactory

  Facilitates the creation of circles (which will be the puffs in
  the cloud). Here is simply binds to a canvas context and passes
  this to each circle it creates

  **/

  var CircleFactory = function(ctx) {
    this.context = ctx;
  }

  _.extend(CircleFactory.prototype, {
    newInstance: function(x,y,r) {
      return new Circle(x,y,this.context,r);
    }
  });

  /**

  Circle

  Defined by an (x,y) and radius. Also
  encapsulates functionality for wrapping
  around the screen

  **/

  var Circle = function(x,y,ctx,r,color) {
    this.pos = new Pos(x,y);
    this.r = r || 5;
    this.color = this.color || "white";
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;

    this.ctx = ctx;
  };

  _.extend(Circle.prototype, {
    draw_circle: function(x,y) {
      this.ctx.arc(x,y,this.r,0,Math.PI*2,false);
    },

    draw: function() {
      var ctx = this.ctx;
      ctx.beginPath();

      var from_wall = this.width - this.pos.x;
      if(from_wall < -this.r)
        this.pos.x = this.r;
      else if(from_wall < this.r)
        // then you need to draw yourself
        // coming into the other side
        this.draw_circle(-from_wall,this.pos.y);

      this.draw_circle(this.pos.x,this.pos.y);

      ctx.fillStyle = this.color;
      ctx.fill();
    }
  });

  /**

  main

  the main function that exposes functionality of the
  clouds. Can either pass in a canvas element or by default
  will grab the CSSCanvasContext to use

  **/

  exports.main = function(canvas) {
    // using offscreen canvas
    var w = screen.width, h = screen.height;

    var ctx = canvas || document.getCSSCanvasContext("2d", "mybackground", w, h)
      , factory = new CloudFactory(ctx)
      , clouds = factory.make(NCLOUDS);

    var draw_background = function() {
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0,0,w,h);
    };

    setInterval(function() {
      draw_background();
      _.each(clouds, function(cloud) {
        cloud.update();
        cloud.draw();
      });
    }, 100);

   */
  };

  /**
  Pos
  - for position manipulation
  **/

  var Pos = function(x,y) {
    this.x = x;
    this.y = y;
  };

  Pos.prototype.set = function(x,y) {
    this.x = x;
    this.y = y;
  };

  Pos.prototype.equals = function(b) {
    return this.x===b.x && this.y===b.y;
  }

  Pos.prototype.minus = function(b) {
    return new Pos(this.x - b.x, this.y - b.y);
  }

  Pos.prototype.add = function(x,y) {
    if (x instanceof Pos) {
      y = x.y;
      x = x.x;
    };

    return new Pos(this.x + x, this.y + y);
  }

  Pos.prototype.translate = function(x,y) {
    if (x instanceof Pos) {
      y = x.y;
      x = x.x;
    };

    this.x += x;
    this.y += y;
  }

  Pos.prototype.length = function() {
    return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
  }

  Pos.prototype.scale = function(c) {
    this.x *= c;
    this.y *= c;
    return this;
  }

  Pos.prototype.within = function(x,y,r) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)) < r;
  }

  Pos.prototype.toString = function() {
    return "x: " + this.x + ", y: " + this.y;
  }

  /**
  EXPORT
  **/

  return exports;
});
