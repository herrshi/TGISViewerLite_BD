define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "jimu/BaseWidget",
  "jimu/utils"
], function(declare, lang, array, topic, BaseWidget, jimuUtils) {
  return declare([BaseWidget], {
    _odLayer: null,

    _oIcon: null,
    _dIcon: null,

    postCreate: function() {
      this.inherited(arguments);

      this._oIcon = L.icon({
        iconUrl: window.path + "images/BlueSphere.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      this._dIcon = L.icon({
        iconUrl: window.path + "images/RedSphere.png",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      this._odLayer = L.layerGroup().addTo(this.map);

      topic.subscribe("addOD", lang.hitch(this, this.onTopicHandler_addOD));
      topic.subscribe(
        "deleteOD",
        lang.hitch(this, this.onTopicHandler_deleteOD)
      );
    },

    _clearData: function() {
      this._odLayer.clearLayers();
    },

    onTopicHandler_addOD: function(params) {
      var paramsObj = JSON.parse(params);
      var type = paramsObj.type;

      this._clearData();

      //加入起点
      if (!isNaN(paramsObj.startPoint.x) && !isNaN(paramsObj.startPoint.y)) {
        var newXY = jimuUtils.coordTransform(
          paramsObj.startPoint.x,
          paramsObj.startPoint.y
        );
        var startPoint = L.marker([newXY[1], newXY[0]], {
          icon: type.toLowerCase() === "o" ? this._oIcon : this._dIcon
        });
        startPoint.addTo(this._odLayer);

        //加入终点
        var totalFlow = 0;
        array.forEach(
          paramsObj.endFlows,
          function(endObj) {
            if (!isNaN(endObj.endPoint.x) && !isNaN(endObj.endPoint.y)) {
              totalFlow += endObj.flow;
              var endPointNewXY = jimuUtils.coordTransform(
                endObj.endPoint.x,
                endObj.endPoint.y
              );
              var endPoint = L.marker([endPointNewXY[1], endPointNewXY[0]], {
                icon: type.toLowerCase() === "o" ? this._dIcon : this._oIcon
              });
              endPoint.addTo(this._odLayer);
              endPoint
                .bindPopup(
                  (type.toLowerCase() === "o" ? "迄" : "起") +
                    ": " +
                    Math.round(endObj.flow),
                  {
                    autoClose: false,
                    className: "od-popup",
                    closeButton: false
                  }
                )
                .openPopup();

              //起点和终点连线
              var path =
                type.toLowerCase() === "o"
                  ? [startPoint.getLatLng(), endPoint.getLatLng()]
                  : [endPoint.getLatLng(), startPoint.getLatLng()];
              var line = L.polyline(path, {
                color: type.toLowerCase() === "o" ? "#000099" : "#cc3300"
              }).addTo(this._odLayer);
              if (L.Browser.ielt9) {
                this._refreshMap();
              }
            }
          },
          this
        );

        //起点加入总流量
        startPoint
          .bindPopup(
            (type.toLowerCase() === "o" ? "起" : "迄") +
              ": " +
              Math.round(totalFlow),
            {
              autoClose: false,
              className: "od-popup",
              closeButton: false
            }
          )
          .openPopup();
      }
    },

    onTopicHandler_deleteOD: function() {
      this._clearData();
    },

    _refreshMap: function() {
      this.map.panTo(this.map.getCenter());
    }
  });
});
