define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "jimu/BaseWidget",
  "jimu/utils"
], function(declare, lang, array, topic, BaseWidget, jimuUtils) {
  return declare([BaseWidget], {
    _trackPointIcon: null,
    _startPointIcon: null,
    _endPointIcon: null,

    _trackLayer: null,

    _loop: false,
    _trackPoints: [],

    postCreate: function() {
      this.inherited(arguments);

      this._trackLayer = L.layerGroup().addTo(this.map);

      this._trackPointIcon = L.icon({
        iconUrl: window.path + "images/dot_clicked.png",
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });
      this._startPointIcon = L.icon({
        iconUrl: window.path + "images/mapIcons/TianJin/GongJiao/bus_start.png",
        iconSize: [26, 42],
        iconAnchor: [13, 42]
      });
      this._endPointIcon = L.icon({
        iconUrl: window.path + "images/mapIcons/TianJin/GongJiao/bus_end.png",
        iconSize: [26, 42],
        iconAnchor: [13, 42]
      });
      topic.subscribe(
        "startTrackPlayback",
        lang.hitch(this, this.onTopicHandler_startTrackPlayback)
      );
      topic.subscribe(
        "stopTrackPlayback",
        lang.hitch(this, this.onTopicHandler_stopTrackPlayback)
      );
    },

    _clearData: function() {
      this._trackLayer.clearLayers();
    },

    /**检查轨迹点数据, 去掉重复数据*/
    _checkTrackPoints: function(trackPoints) {
      //转换坐标
      array.map(trackPoints, function(trackPoint) {
        var newXY = jimuUtils.coordTransform(trackPoint.x, trackPoint.y);
        return { x: newXY[0], y: newXY[1] };
      });
      for (var i = 1; i < trackPoints.length; i++) {
        if (
          trackPoints[i - 1].x === trackPoints[i].x &&
          trackPoints[i - 1].y === trackPoints[i].y
        ) {
          trackPoints.splice(i, 1);
          i--;
        }
      }
      return trackPoints;
    },

    onTopicHandler_startTrackPlayback: function(params) {
      this._clearData();

      var paramsObj = JSON.parse(params);
      var autoStart = paramsObj.autoStart !== false;
      this._loop = paramsObj.loop !== false;
      var showTrackPoints = paramsObj.showTrackPoints !== false;

      this._trackPoints = this._checkTrackPoints(paramsObj.trackPoints);

      //显示起点和终点
      var startMarker = L.marker(
        [this._trackPoints[0].y, this._trackPoints[0].x],
        { icon: this._startPointIcon }
      );
      startMarker.bindPopup("经过时间: " + this._trackPoints[0].time);
      startMarker.addTo(this._trackLayer);
      var endMarker = L.marker(
        [
          this._trackPoints[this._trackPoints.length - 1].y,
          this._trackPoints[this._trackPoints.length - 1].x
        ],
        { icon: this._endPointIcon }
      );
      endMarker.bindPopup(
        "经过时间: " + this._trackPoints[this._trackPoints.length - 1].time
      );
      endMarker.addTo(this._trackLayer);

      //显示轨迹点
      if (showTrackPoints && this._trackPoints.length > 2) {
        for (var i = 1; i < this._trackPoints.length - 1; i++) {
          var marker = L.marker(
            [this._trackPoints[i].y, this._trackPoints[i].x],
            { icon: this._trackPointIcon }
          );
          marker.bindPopup("经过时间: " + this._trackPoints[i].time);
          marker.addTo(this._trackLayer);
        }
      }

      //显示轨迹线
      var path = array.map(this._trackPoints, function(trackPoint) {
        return [trackPoint.y, trackPoint.x];
      });
      var line = L.polyline(path);
      line.addTo(this._trackLayer);

      //ie7需要刷新一下地图才会显示Polyline
      if (L.Browser.ielt9){
        this._refreshMap();
      }
    },

    onTopicHandler_stopTrackPlayback: function() {
      this._clearData();
    },

    _refreshMap: function() {
      this.map.panTo(this.map.getCenter());
    }
  });
});
