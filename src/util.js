var _utils = {};

_utils.padNum = function(i) {
  var str = '' + i;
  if (str.indexOf(".") == -1) str += ".00";
  while (str.indexOf(".") + 3 < str.length) str = str.substring(0, str.length - 1);
  while (str.indexOf(".") + 3 > str.length) str += "0";
  while (str.length < 5) str = "0" + str;
  return str;
};