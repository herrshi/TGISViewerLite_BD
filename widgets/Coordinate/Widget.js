define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/on",
  "jimu/BaseWidget",
  "jimu/utils"
], function (
  declare,
  lang,
  on,
  BaseWidget,
  jimuUtils
) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-coordinate",

    postCreate: function() {
      this.inherited(arguments);
      this.own(on(this.map, "mousemove", lang.hitch(this, this.onMapMouseMove)));

    },

    onMapMouseMove: function (event) {
      this.coordinateInfo.innerHTML = this._toFormat(event.latlng.lng) + " " + this._toFormat(event.latlng.lat);
    },

    _toFormat: function(num) {
      if(isNaN(num)){
        return "";
      }

      return jimuUtils.localizeNumberByFieldInfo(num, {
        format: {
          places: this.config.decimalPlaces,
          digitSeparator: this.config.addSeparator
        }
      });
    }
  });
});