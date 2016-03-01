var fakeData = {
  sources: [],
  scheduled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  scheduledTotal: 0,
  flex: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  flexTotal: 0,
  wpd: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  wpdTotal: 0,
  currentDay: 0
};

function main() {
  fakeData = updateData(fakeData);
  d3.select("body").on("keydown", function () {
    switch (d3.event.keyCode) {//chrome.storage.sync.set({'value': theValue}, function() {
      case 76:
        chrome.storage.sync.get('data', function(results) {
          fakeData = results['data'];
          console.log("loaded");
          fakeData = updateData(fakeData);
        });
        break;
      case 83:
        chrome.storage.sync.set({'data': fakeData}, function() {
          console.log("saved");
        });
        break;
      default:
        break;
    }
  }).on("mouseup", function () {
    dragging = false;
  });
}

function addItem(data, source, task, time) {
  for (var i = 0; i < data.sources.length; i++) {
    if (data.sources[i].name == source) {
      for (var k = 0; k < data.sources[i].tasks.length; k++) {
        if (data.sources[i].tasks[k].name == task) {
          data.sources[i].tasks[k].time = time;
        } else if (k == data.sources[i].tasks.length - 1) {
          data.sources[i].tasks.push({
            name: task,
            time: time,
            start: -1,
            end: -1
          })
        }
      }
    } else if (i == data.sources.length - 1) {
      data.sources.push({
        name: source,
        tasks: [{
          name: task,
          time: time,
          start: -1,
          end: -1
        }]
      })
    }
  }
  if (data.sources.length == 0) {
    data.sources.push({
        name: source,
        tasks: [{
          name: task,
          time: time,
          start: -1,
          end: -1
        }]
      })
  }
  return data;
}

function flattenSource(data) {
  var flat = [];
  for(var i in data.sources) {
    var source = data.sources[i];
    for (var k in source.tasks) {
      var task = source.tasks[k];
      flat.push({
        source: source,
        task: task,
        i: i,
        k: k
      });
    }
  }
  return flat;
}

function padNum(i) {
  var str = '' + i;
  if (str.indexOf(".") == -1) str += ".00";
  while (str.indexOf(".") + 3 < str.length) str = str.substring(0, str.length - 1);
  while (str.indexOf(".") + 3 > str.length) str += "0";
  while (str.length < 5) str = "0" + str;
  return str;
}

function findTarget(total, amountSet, numSet, set, scheduled) {
  var guess = (total - amountSet) / (13 - numSet);
  var extra = 0;
  var extraSet = 0;
  
  while (true) {
    var newExtraSet = 0;
    extra = 0;
    for (var i = 0; i < 13; i++) {
      if (set[i] !== true && scheduled[i] > guess) {
        extra += scheduled[i];
        newExtraSet++;
      }
    }
    if (extraSet == newExtraSet) {
      return guess;
    }
    extraSet = newExtraSet;
    guess = (total - amountSet - extra) / (13 - numSet - extraSet);
  }
}

function updateData(data) {
  flat = flattenSource(data);
  data.scheduledTotal = 0;
  for (var i in data.scheduled) {
    data.scheduledTotal += data.scheduled[i];
  }
  data.flexTotal = 0;
  for (var i in flat) {
    data.flexTotal += flat[i].task.time;
  }
  var total = data.flexTotal + data.scheduledTotal;
  data.wpdTotal = padNum((data.flexTotal + data.scheduledTotal) / (13 - data.currentDay)) + " hour(s)";
  data.scheduledTotal = padNum(data.scheduledTotal) + " hour(s)";
  data.flexTotal = padNum(data.flexTotal) + " hour(s)";
  
  for (var i in data.flex) {
    data.flex[i] = 0;
    for (var k in flat) {
      if (flat[k].task.start <= i && i <= flat[k].task.end) data.flex[i] += flat[k].task.time;
    }
  }
  
  var numSet = 0;
  var set = [false, false, false, false, false, false, false, false, false, false, false, false, false];
  var amountSet = 0;
  
  var found = false;
  while (!found) {
    var target = findTarget(total, amountSet, numSet, set, data.scheduled);
      
    var flexDone = 0;
    for (var i = 0; i < 13; i++) {
      var flexAvailable = 0;
      for (var k in flat) {
        if (flat[k].task.start <= i) flexAvailable += flat[k].task.time;
      }
      var available = flexAvailable - flexDone + data.scheduled[i];
      if (available < target) {
        if (set[i] !== true) {
          set[i] = true;
          numSet++;
          amountSet += available;
          break;
        } else if (Math.abs(data.wpd[i] - available) < 0.0001) {
          found = (i == 12);
        } else {
          amountSet += available - data.wpd[i];
          data.wpd[i] = available;
          break;
        }
      } else {
        if (data.scheduled[i] <= target) flexDone += target - data.scheduled[i];
        data.wpd[i] = Math.max(data.scheduled[i], target);
      }
      if (i == 12) found = true;
    }
  }
  buildTable(data);
  
  return data;
}

var dragStartX = -1;
var dragStartY = -1;
var dragging = false;

function buildTable(data) {
  var flat = flattenSource(data);
  var select = d3.select("#tasktable").select("tbody").selectAll("tr").data(flat);
  
  var newTr = select.enter().append("tr");
  newTr.append("th")
       .attr("scope", "row")
       .classed("lefttd", true);
  newTr.append("td")
       .classed("lefttd", true);
  for (var i = 0; i < 14; i++)
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
        this.innerHTML = padNum(flat[i1].task.time) + " hours(s)"; break;
      default:
        i2 -= 2;
        d3.select(this).classed("table-success", i2 >= flat[i1].task.start && i2 <= flat[i1].task.end)
          .on("mousedown", function () {
            dragStartX = i1;
            dragStartY = i2;
            dragging = true;
            flat[i1].task.start = Math.min(i2, dragStartY);
            flat[i1].task.end = Math.max(i2, dragStartY);
            data = buildTable(data);
          }).on("mouseover", function () {
            if (dragging && dragStartX == i1) {
              flat[i1].task.start = Math.min(i2, dragStartY);
              flat[i1].task.end = Math.max(i2, dragStartY);
              data = updateData(data);
            }
          });
        break;
    }
  });
  
  select.exit().remove();
  
  d3.selectAll(".flexestimate").each(function (garbage, i) {
    this.innerHTML = data.flexTotal;
  });
  
  d3.selectAll(".flexdaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = padNum(data.flex[i]);
  });
  
  d3.selectAll(".scheduledestimate").each(function (garbage, i) {
    this.innerHTML = data.scheduledTotal;
  });
  
  d3.selectAll(".scheduleddaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = padNum(data.scheduled[i]);
  });
  
  d3.selectAll(".wpdaverage").each(function (garbage, i) {
    this.innerHTML = data.wpdTotal;
  });
  
  d3.selectAll(".wpddaily").style("font-weight", "normal").each(function (garbage, i) {
    this.innerHTML = padNum(data.wpd[i]);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  main();
});