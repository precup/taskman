var _table = {
  dragStartX: -1,
  dragStartY: -1,
  dragging: false
};

_table.update = function() {
  var flat = _data.flat();
  var select = d3.select("#tasktable").select("tbody").selectAll("tr").data(flat);
  
  var newTr = select.enter().append("tr");
  newTr.append("th")
       .attr("scope", "row")
       .classed("lefttd", true);
  newTr.append("td")
       .classed("lefttd", true);
  for (var i = 0; i < _global.days; i++)
    newTr.append("td");
  
  var used = {};
  select.select("th").each(function (d) {
    if (used[d.source.name] !== true) {
      this.innerHTML = d.source.name;
      used[d.source.name] = true;
    } else {
      this.innerHTML = "";
    }
  });
  
  select.selectAll("td").each(function (garbage, i2, i1) {
    switch (i2) {
      case 0:
        this.innerHTML = flat[i1].task.name; break;
      case 1:
        this.innerHTML = _utils.padNum(flat[i1].task.time) + " hours(s)"; break;
      default:
        i2 -= 2;
        d3.select(this).classed("table-success", i2 >= flat[i1].task.start && i2 <= flat[i1].task.end)
          .on("mousedown", function () {
            _table.dragStartX = i1;
            _table.dragStartY = flat[i1].task.start = flat[i1].task.end = i2;
            _table.dragging = true;
            _data.update();
            _table.update();
          }).on("mouseover", function () {
            if (_table.dragging && _table.dragStartX == i1) {
              flat[i1].task.start = Math.min(i2, _table.dragStartY);
              flat[i1].task.end = Math.max(i2, _table.dragStartY);
            }
          }).on("mouseup", function () {
            if (_table.dragging) {
              _data.update();
              _table.update();
            }
          });
        break;
    }
  });
  
  select.exit().remove();
  
  d3.selectAll(".flexestimate").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.flexTotal) + " hour(s)";
  });
  
  d3.selectAll(".flexdaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.flex[i]);
  });
  
  d3.selectAll(".scheduledestimate").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.scheduledTotal) + " hour(s)";
  });
  
  d3.selectAll(".scheduleddaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.scheduled[i]);
  });
  
  d3.selectAll(".wpdaverage").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.wpdTotal) + " hour(s)";
  });
  
  d3.selectAll(".wpddaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = _utils.padNum(_data.data.wpd[i]);
  });
};