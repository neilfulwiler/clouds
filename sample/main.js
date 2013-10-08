require.config({
  'shim' : {
    underscore : {
      exports : '_'
    },

    jquery : {
      exports : '$'
    }
  }
});

require(
  ['../clouds'
  ],
function(Clouds) {
  Clouds.main();
});
