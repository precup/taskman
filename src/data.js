var _data = {
  data: {
    sources: [],
    scheduled: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    scheduledTotal: 0,
    due: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    available: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    flex: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    flexTotal: 0,
    wpd: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    wpdTotal: 0,
    currentDay: 0
  }
};

_data.init = function() {
  _data.load(null);
};

_data.save = function() {
  chrome.storage.sync.set({'data': _data.data}, function() {});
};

_data.load = function() {
  chrome.storage.sync.get(null, function(results) {
    if (typeof results['data'] === "object") {
      _data.data = results['data'];
      _data.update();    
      _table.update();
    }
  });
};

_data.flat = function() {
  var flat = [];
  for(var i in _data.data.sources) {
    var source = _data.data.sources[i];
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
};

_data.available = function(day) {
  return Math.floor(_data.data.available[day] * 100);
};

_data.due = function(day) {
  return Math.floor(_data.data.due[day] * 100);
};

_data.scheduled = function(day) {
  return Math.floor(_data.data.scheduled[day] * 100);
};

_data.scheduleDay = function(average, day, workSoFar, cache, precise) {
  if (day >= _global.days) return {variance: 0};
  if (cache[day][workSoFar] != -1) return cache[day][workSoFar];
  
  var available = _data.available(day) - workSoFar + _data.scheduled(day);
  var due = _data.due(day) - workSoFar + _data.scheduled(day);
  var inc = precise ? 5 : 25;
  for (var work = Math.min(due, Math.min(available, _global.maxWork)); work <= _global.maxWork && work <= available; work += inc) {
    var variance = _data.scheduleDay(average, day + 1, work + workSoFar - _data.scheduled(day), cache, precise).variance + Math.pow(work - average, 2);
    if (cache[day][workSoFar] == -1 || cache[day][workSoFar].variance > variance) {
      cache[day][workSoFar] = {
        variance: variance,
        work: work - _data.scheduled(day)
      };
    }
  }
  return cache[day][workSoFar];
};

_data.schedule = function(precise) {
  var total = _data.due(_global.days - 1) + 1;
  var cache = new Array(_global.days);
  for (var i = 0; i < cache.length; i++) {
    cache[i] = new Array(total);
    for (var k = 0; k < cache[i].length; k++) {
      cache[i][k] = -1;
    }
  }
  var workSoFar = _data.scheduleDay(total / _global.days, 0, 0, cache, precise).work;
  _data.data.wpd[0] = workSoFar + _data.scheduled(0);
  for (var i = 1; i < _global.days; i++) {
    _data.data.wpd[i] = cache[i][workSoFar].work + _data.scheduled(i);
    workSoFar += cache[i][workSoFar].work;
  }
  for (var i = 0; i < _global.days; i++) {
    _data.data.wpd[i] = _data.data.wpd[i] / 100;
  }
  return cache;
};

_data.update = function() {
  flat = _data.flat();
  _data.data.scheduledTotal = 0;
  for (var i in _data.data.scheduled) {
    _data.data.scheduledTotal += _data.data.scheduled[i];
  }
  _data.data.flexTotal = 0;
  for (var i in flat) {
    _data.data.flexTotal += flat[i].task.time;
  }
  _data.data.wpdTotal = (_data.data.flexTotal + _data.data.scheduledTotal) / (13 - _data.data.currentDay);
  
  for (var i in _data.data.flex) {
    _data.data.flex[i] = 0;
    _data.data.due[i] = 0;
    _data.data.available[i] = 0;
    for (var k in flat) {
      if (flat[k].task.start <= i && i <= flat[k].task.end) _data.data.flex[i] += flat[k].task.time;
      if (flat[k].task.end <= i) _data.data.due[i] += flat[k].task.time;
      if (flat[k].task.start <= i) _data.data.available[i] += flat[k].task.time;
    }
  }
  
  return _data.schedule(false);
};

_data.add = function(source, task, time) {
  var newTask = {
    name: task,
    time: time,
    start: -1,
    end: -1
  };
  var sourceFound = false;
  for (var i = 0; i < _data.data.sources.length && !sourceFound; i++) {
    if (_data.data.sources[i].name == source) {
      sourceFound = true;
      for (var k = 0; k < _data.data.sources[i].tasks.length; k++) {
        if (_data.data.sources[i].tasks[k].name == task) {
          _data.data.sources[i].tasks[k].time = time;
        } else if (k == _data.data.sources[i].tasks.length - 1) {
          _data.data.sources[i].tasks.push(newTask);
        }
      }
    }
  }
  if (!sourceFound) {
    _data.data.sources.push({
      name: source,
      tasks: [newTask]
    });
  }
};