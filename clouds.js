define(
  ['underscore'
  ,'jquery'
],
function(_,$) {

  /* these are the defaults */
  var defaults = {
    update_interval : 100,
    background_color : "rgba(17, 82, 248, 0.52)",
    nclouds : 10,
    cloud_radius : 50,
    cloud_width : 50,
    cloud_speed_range : [.5,2],
    puffs_per_cloud : 10
  };

  var options = {};

  // exports objects
  var exports = {};

  /**

  Utils

  currently only randint

  **/

  var Utils = {
    randint : function(a,b) {
      if(b===undefined) {
        b=a;
        a=0;
      }
      return a+Math.floor(Math.random()*(b-a));
    }
  };

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
    var x = Utils.randint(this.pos.x - options.cloud_width, this.pos.x + options.cloud_width);
    var y = Utils.randint(this.pos.y - options.cloud_width, this.pos.y + options.cloud_width);
    return this.factory.newInstance(x,y,options.cloud_radius);
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
    this.puff_maker = puff_maker.bind(this);
    this.speed = Utils.randint.apply(Utils, options.cloud_speed_range);
    this.init_fluff();
  }

  _.extend(Cloud.prototype, {
    init_fluff: function() {
      var x,y;
      var puffs = _.map(_.range(options.puffs_per_cloud), this.puff_maker);
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

  main

  the main function that exposes functionality of the
  clouds. Can either pass in a canvas element or by default
  will grab the CSSCanvasContext to use

  **/

  exports.main = function(_options) {
    _options = _options || {};

    // get the defaults if not provided in options
    _.each(_.keys(defaults), function(option) {
      options[option] = _options[option] || defaults[option]
    });

    // using offscreen canvas
    var ctx,w,h;
    if(_options.canvas===undefined) {
      // using full background so set width and height
      // to screen dimensions
      w = screen.width;
      h = screen.height;

      var background_name = "cloud_background";
      ctx = document.getCSSCanvasContext("2d", background_name, w, h);

      // set the body background to the canvas you just created
      $('body').css('background', '-webkit-canvas('+background_name+')');
    }

    else {
      ctx = _options.canvas.getContext("2d");
      w = ctx.canvas.width;
      h = ctx.canvas.height;
    }

    var factory = new CloudFactory(ctx)
      , clouds = factory.make(options.nclouds)
      ;

    var draw_background = function() {
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = options.background_color;
      ctx.fillRect(0,0,w,h);
    };

    setInterval(function() {
      draw_background();
      _.each(clouds, function(cloud) {
        cloud.update();
        cloud.draw();
      });
    }, options.update_interval);

  };


  /**
  EXPORT
  **/

  return exports;
});
