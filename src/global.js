var _global = {
  days: 13,
  maxWork: 999
};

_global.init = function() {
  d3.select("body").on("keydown", function() {
    switch (d3.event.keyCode) {
      case 76:
        _data.load(function() {
          _table.update();
        });
        break;
      case 83:
        _data.save(function() {});
        break;
      default:
        break;
    }
  }).on("mouseup", function() {
    _table.dragging = false;
  });
};