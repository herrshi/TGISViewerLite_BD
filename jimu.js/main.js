define([
  "dojo/_base/lang",
  "jimu/LayoutManager",
  "jimu/ConfigManager"
], function(lang, LayoutManager, ConfigManager) {
  var mo = {};

  String.prototype.startWith = function(str) {
    return this.substr(0, str.length) === str;
  };

  String.prototype.endWith = function(str) {
    return this.substr(this.length - str.length, str.length) === str;
  };

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /*, thisp*/) {
      var len = this.length;
      if (typeof fun !== "function") throw new TypeError();
      var thisP = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in this) fun.call(thisP, this[i], i, this);
      }
    };
  }

  if (!Array.indexOf) {
    Array.prototype.indexOf = function(obj) {
      for (var i = 0; i < this.length; i++) {
        if (this[i] === obj) {
          return i;
        }
      }
      return -1;
    };
  }

  function initApp() {
    console.log("jimu.js init...");

    var layoutManager = LayoutManager.getInstance(jimuConfig.layoutId);
    layoutManager.startup();

    var configManager = ConfigManager.getInstance();
    configManager.loadConfig();
  }

  mo.initApp = initApp;
  return mo;
});
