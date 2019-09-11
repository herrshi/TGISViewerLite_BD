define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "dojo/on",
  "dojo/dom-style",
  "dojo/dom-construct",
  "jimu/BaseWidget",
  "jimu/utils"
], function(
  declare,
  lang,
  array,
  topic,
  on,
  domStyle,
  domConstruct,
  BaseWidget,
  jimuUtils
) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-BasicDraw",

    _drawType: "",
    _showMeasure: false,
    _drawLayer: null,
    _pointList: [],
    _defaultCursor: "auto",

    //连续绘制, 画完一个以后不结束绘制状态
    _continuousDraw: false,
    //是否删除上一个绘制图形
    _clearRepeat: false,

    _tooltipDiv: null,

    _currentPolyline: null,
    _currentPolygon: null,

    //鼠标移动时绘制的辅助图形
    _tempPolyline: null,
    _tempPolygon: null,
    _tempRectangle: null,
    _tempCircle: null,

    //绘制矩形
    _rectangleBounds: [],
    //绘制圆形
    _circleCenter: null,

    _vectorIcon: null,

    _callbackFunction: null,

    postCreate: function() {
      this.inherited(arguments);

      this._drawLayer = L.layerGroup().addTo(this.map);
      this._defaultCursor = domStyle.get(
        document.getElementById(jimuConfig.mapId),
        "cursor"
      );

      this._vectorIcon = L.icon({
        iconUrl: window.path + "images/dot_clicked.png",
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      //显示tooltip
      this._tooltipDiv = domConstruct.place(
        "<div id='drawTooltip' class='tooltipDiv'></div>",
        document.getElementById(jimuConfig.mapId)
      );

      topic.subscribe("startDraw", lang.hitch(this, this.onStartDraw));
      topic.subscribe("stopDraw", lang.hitch(this, this.onStopDraw));
      topic.subscribe("clearDraw", lang.hitch(this, this.onClearDraw));
    },

    onStartDraw: function(params) {
      var paramsObj = JSON.parse(params.params);
      this._drawType = paramsObj.type;
      this._showMeasure = paramsObj.showMeasure === true;
      this._continuousDraw = paramsObj.continuousDraw === true;
      this._clearRepeat = paramsObj.clearRepeat === true;
      this._callbackFunction = params.callback;
      //禁用双击放大, 将双击事件留给停止绘制
      this.map.doubleClickZoom.disable();
      this._pointList = [];
      //改变鼠标指针
      domStyle.set(
        document.getElementById(jimuConfig.mapId),
        "cursor",
        "crosshair"
      );

      if (this._drawType === "rectangle" || this._drawType === "circle") {
        //矩形和圆形使用拖拽方式绘制, 禁止地图拖拽移动
        this.map.dragging.disable();
        this._tooltipDiv.innerHTML = this.config.tooltip.rectangleStartDraw;
        this.map.on("mousedown", lang.hitch(this, this.onMapMouseDown));
        this.map.on("mouseup", lang.hitch(this, this.onMapMouseUp));
      } else {
        this._tooltipDiv.innerHTML = this.config.tooltip.startDraw;
        this.map.on("click", lang.hitch(this, this.onMapClick));
        this.map.on("dblclick", lang.hitch(this, this.onMapDoubleClick));
      }
      this.map.on("mousemove", lang.hitch(this, this.onMapMouseMove));
    },

    onStopDraw: function() {
      this.map.doubleClickZoom.enable();
      this.map.dragging.enable();
      this.map.off("click");
      this.map.off("mousemove");
      this.map.off("dblclick");
      this.map.off("mousedown");
      this.map.off("mouseup");
      this._pointList = [];
      this._tempPolyline = null;
      this._currentPolyline = null;
      this._tempPolygon = null;
      this._currentPolygon = null;
      this._tempRectangle = null;
      this._tempCircle = null;
      //改变鼠标指针
      domStyle.set(
        document.getElementById(jimuConfig.mapId),
        "cursor",
        this._defaultCursor
      );
      //隐藏tooltip
      domStyle.set(this._tooltipDiv, "display", "none");
    },

    onClearDraw: function() {
      this._drawLayer.clearLayers();
    },

    onMapClick: function(event) {
      if (this._clearRepeat && this._drawType.toLowerCase() === "point") {
        this._drawLayer.clearLayers();
        this._pointList = [];
      }
      var point = event.latlng;
      this._pointList.push(point);

      var latlngs = array.map(this._pointList, function(point) {
        return [point.lat, point.lng];
      });

      switch (this._drawType.toLowerCase()) {
        //点
        case "point":
          var marker = L.marker(point);
          marker.addTo(this._drawLayer);
          if (this._callbackFunction) {
            var newXY = jimuUtils.coordTransform(point.lng, point.lat, true);
            this._callbackFunction({ x: newXY[0], y: newXY[1], type: "point" });
          }

          if (!this._continuousDraw) {
            this.onStopDraw();
          }
          break;

        //线
        case "line":
          //删除辅助线
          if (this._tempPolyline) {
            this._drawLayer.removeLayer(this._tempPolyline);
            this._tempPolyline = null;
          }

          //添加节点图标
          var vectorMarker = L.marker(point, { icon: this._vectorIcon }).addTo(
            this._drawLayer
          );
          //显示线段长度
          if (this._showMeasure) {
            if (!L.Browser.ielt9) {
              if (this._pointList.length === 1) {
                vectorMarker.bindTooltip("起点", {
                  permanent: true,
                  className: "tooltipDiv"
                });
              } else {
                var distance = this.map.distance(
                  this._pointList[this._pointList.length - 1],
                  this._pointList[this._pointList.length - 2]
                );
                var tooltipText =
                  distance < 1000
                    ? Math.round(distance) + "米"
                    : (distance / 1000).toFixed(2) + "公里";
                vectorMarker.bindTooltip(tooltipText, {
                  permanent: true,
                  className: "tooltipDiv"
                });
              }
            }
          }

          if (!this._showMeasure) {
            this._tooltipDiv.innerHTML = this.config.tooltip.finishDraw;
          }

          if (this._pointList.length === 2) {
            //两个点时创建线对象
            this._currentPolyline = L.polyline(latlngs).addTo(this._drawLayer);
            if (L.Browser.ielt9) {
              this._refreshMap();
            }
          } else if (this._pointList.length > 2) {
            //超过两个点时往线对象里加点
            this._currentPolyline.addLatLng(point);
          }
          break;

        //面
        case "polygon":
          //删除辅助线和面
          if (this._tempPolyline) {
            this._drawLayer.removeLayer(this._tempPolyline);
            this._tempPolyline = null;
          }
          if (this._tempPolygon) {
            this._drawLayer.removeLayer(this._tempPolygon);
            this._tempPolygon = null;
          }
          this._tooltipDiv.innerHTML = this.config.tooltip.continueDraw;
          if (this._pointList.length === 2) {
            this._tooltipDiv.innerHTML = this.config.tooltip.finishDraw;
            //两个点时连线
            this._currentPolyline = L.polyline(latlngs).addTo(this._drawLayer);
            if (L.Browser.ielt9) {
              this._refreshMap();
            }
          } else if (this._pointList.length === 3) {
            this._tooltipDiv.innerHTML = this.config.tooltip.finishDraw;
            //三个点时先删除前两个点的连线, 再创建面对象
            this._drawLayer.removeLayer(this._currentPolyline);
            this._currentPolygon = L.polygon(latlngs).addTo(this._drawLayer);
          } else if (this._pointList.length > 3) {
            this._tooltipDiv.innerHTML = this.config.tooltip.finishDraw;
            //超过三个点时往面对象里加点
            this._currentPolygon.addLatLng(point);
          }
          break;
      }
    },

    onMapMouseMove: function(event) {
      var point = event.latlng;

      //tooltip
      var containerPoint = event.containerPoint;
      domStyle.set(this._tooltipDiv, "display", "block");
      domStyle.set(this._tooltipDiv, "top", containerPoint.y - 15 + "px");
      domStyle.set(this._tooltipDiv, "left", containerPoint.x + 15 + "px");

      var tooltip = "";
      switch (this._drawType.toLowerCase()) {
        case "line":
          //至少有一个点时画辅助线
          if (this._pointList.length >= 1) {
            var lastPoint = this._pointList[this._pointList.length - 1];
            if (!this._tempPolyline) {
              //创建辅助线
              this._tempPolyline = L.polyline([
                [lastPoint.lat, lastPoint.lng],
                [point.lat, point.lng]
              ]).addTo(this._drawLayer);
              this._refreshMap();
            } else {
              //改变辅助线坐标
              this._tempPolyline.setLatLngs([
                [lastPoint.lat, lastPoint.lng],
                [point.lat, point.lng]
              ]);
            }

            //计算长度
            if (this._showMeasure) {
              var totalLength = 0;
              if (this._pointList.length >= 2) {
                for (var i = 0; i < this._pointList.length - 1; i++) {
                  totalLength += this.map.distance(
                    this._pointList[i],
                    this._pointList[i + 1]
                  );
                }
              }
              totalLength += this.map.distance(lastPoint, point);
              var tooltipText =
                totalLength < 1000
                  ? "<font color='#ff8000'>" +
                    Math.round(totalLength) +
                    "</font>米"
                  : "<font color='#ff8000'>" +
                    (totalLength / 1000).toFixed(2) +
                    "</font>公里";

              this._tooltipDiv.innerHTML =
                "总长: " +
                tooltipText +
                "<br>" +
                this.config.tooltip.finishDraw;
            }
          }

          break;

        case "polygon":
          if (this._pointList.length === 1) {
            //只有一个点时画辅助线
            lastPoint = this._pointList[0];
            if (!this._tempPolyline) {
              //创建辅助线
              this._tempPolyline = L.polyline([
                [lastPoint.lat, lastPoint.lng],
                [point.lat, point.lng]
              ]).addTo(this._drawLayer);
              this._refreshMap();
            } else {
              //改变辅助线坐标
              this._tempPolyline.setLatLngs([
                [lastPoint.lat, lastPoint.lng],
                [point.lat, point.lng]
              ]);
            }
          } else if (this._pointList.length >= 2) {
            //超过2个点时画辅助面
            var latlngs = array.map(this._pointList, function(point) {
              return [point.lat, point.lng];
            });
            latlngs.push([point.lat, point.lng]);
            if (!this._tempPolygon) {
              this._tempPolygon = L.polygon(latlngs).addTo(this._drawLayer);
            } else {
              this._tempPolygon.setLatLngs(latlngs);
            }
          }
          break;

        //矩形
        case "rectangle":
          if (this._rectangleBounds.length >= 1) {
            this._rectangleBounds[1] = point;
            if (!this._tempRectangle) {
              this._tempRectangle = L.rectangle(this._rectangleBounds).addTo(
                this._drawLayer
              );
            } else {
              this._tempRectangle.setBounds(this._rectangleBounds);
            }
          }
          break;

        //圆形
        case "circle":
          if (this._circleCenter) {
            //计算半径
            var radius = this._circleCenter.distanceTo(point);
            if (!this._tempCircle) {
              this._tempCircle = L.circle(this._circleCenter, {
                radius: radius
              }).addTo(this._drawLayer);
            } else {
              this._tempCircle.setRadius(radius);
            }
          }
          break;
      }
    },

    onMapDoubleClick: function(event) {
      if (this._callbackFunction) {
        switch (this._drawType.toLowerCase()) {
          case "line":
            this._currentPolyline.type = "polyline";
            var geometry = this._onGetDrawGraphic(this._currentPolyline);
            this._callbackFunction(geometry);
            break;

          case "polygon":
            this._currentPolygon.type = "polygon";
            var geometry = this._onGetDrawGraphic(this._currentPolygon);
            this._callbackFunction(geometry);
            break;
        }
      }
      this._pointList = [];
      this._tempPolyline = null;
      this._currentPolyline = null;
      this._currentPolygon = null;
      this._tooltipDiv.innerHTML = this.config.tooltip.startDraw;
      if (!this._continuousDraw) {
        this.onStopDraw();
      }
    },

    _onGetDrawGraphic: function(marker) {
      var obj = {};
      obj.type = marker.type;
      if (marker.type == "point") {
        marker.points = marker._latlngs;
      } else if (marker.type == "polyline") {
        marker.paths = this._getPath(marker._latlngs, marker.type);
        obj.paths = marker.paths;
      } else if (marker.type == "polygon" || marker.type == "freehandpolygon") {
        marker.rings = this._getPath(marker._latlngs, marker.type);
        obj.rings = marker.rings;
      }
      return obj;
    },

    _getPath: function(latlngs, type) {
      var arr = [];
      if (type == "polyline") {
        for (var i = 0; i < latlngs.length; i++) {
          arr.push([latlngs[i].lng, latlngs[i].lat]);
        }
        return [arr];
      } else if (type == "polygon" || type == "freehandpolygon") {
        for (var i = 0; i < latlngs.length; i++) {
          var arr1 = [];
          for (var j = 0; j < latlngs[i].length; j++) {
            arr1.push([latlngs[i][j].lng, latlngs[i][j].lat]);
          }
          arr.push(arr1);
        }
        return arr;
      }
    },

    onMapMouseDown: function(event) {
      if (this._clearRepeat) {
        this._drawLayer.clearLayers();
      }
      switch (this._drawType.toLowerCase()) {
        case "rectangle":
          this._rectangleBounds[0] = event.latlng;
          break;

        case "circle":
          this._circleCenter = event.latlng;
          break;
      }
    },

    onMapMouseUp: function(event) {
      switch (this._drawType.toLowerCase()) {
        case "rectangle":
          if (this._callbackFunction) {

            this._tempRectangle.type = "polygon";
            var geometry = this._onGetDrawGraphic(this._tempRectangle);
            this._callbackFunction(geometry);
          }
          this._rectangleBounds = [];
          if (!this._continuousDraw) {
            this.onStopDraw();
          }
          break;

        case "circle":
          if (this._callbackFunction) {
            this._callbackFunction(this._tempCircle);
          }
          this._circleCenter = null;
          if (!this._continuousDraw) {
            this.onStopDraw();
          }
          break;
      }
    },

    _refreshMap: function() {
      this.map.panTo(this.map.getCenter());
    }
  });
});
