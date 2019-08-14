define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "jimu/BaseWidget",
  "jimu/CustomLayers/leaflet-heat"
], function(declare, lang, array, topic, BaseWidget, leafletHeat) {
  return declare([BaseWidget], {
    _heat: null,
    defaultRenderJson: null,
    _heatLayer: null,
    _state: "nomal",
    zoomEvent: null,
    postCreate: function() {
      this.inherited(arguments);
      this._heatLayer = L.layerGroup().addTo(this.map);

      topic.subscribe(
        "addHeatMap",
        lang.hitch(this, this.onTopicHandler_addHeatMap)
      );
      topic.subscribe(
        "deleteHeatMap",
        lang.hitch(this, this.onTopicHandler_deleteHeatMap)
      );
      this.defaultRenderJson = {
        type: "simple",
        symbol: {
          url: "images/dot_clicked.png",
          height: 18,
          width: 18,
          type: "esriPMS"
        }
      };
    },
    onTopicHandler_addHeatMap: function(params) {
      this._clear();

      var options = params.options;
      var zoom = options.zoom || 0;
      if (zoom > 0) {
        if (this.map.getZoom() <= zoom) {
          this._addHeatLayer(params);
          this._state = "hot";
        } else {
          this._addPoint(params);
          this._state = "nomal";
        }

        this.zoomEvent = this.map.on(
          "zoomend",
          lang.hitch(this, function(e) {
            if (this.map.getZoom() <= zoom) {
              if (this._state == "nomal") {
                this._clear();

                this._addHeatLayer(params);
                this._state = "hot";
              }
            } else {
              if (this._state == "hot") {
                this._clear();

                this._addPoint(params);
                this._state = "nomal";
              }
            }
          })
        );
      } else {
        this._state = "hot";
        this._addHeatLayer(params);
      }
    },
    _addHeatLayer: function(params) {
      var options = params.options;
      var max = options.maxValue || 1;
      var colors = options.colors || ["blue", "cyan", "yellow", "red"];
      var valueField = options.field;
      var config = {
        //热力图的配置项
        radius: options.radius || 25,
        maxOpacity: 0.9,
        minOpacity: 0.3,
        scaleRadius: true,
        max: max,
        gradient: {
          0.2: colors[0],
          0.6: colors[1],
          0.85: colors.length > 2 ? colors[2] : colors[colors.length - 1],
          0.95: colors.length > 3 ? colors[3] : colors[colors.length - 1]
        }
      }; //滤镜系数将应用于所有热点数据。 //设置每一个热力点的半径 //设置最大的不透明度 //设置最小的不透明度 //设置热力点是否平滑过渡
      var points = params.points;
      var _latlngs = [];
      for (var i = 0; i < points.length; i++) {
        _latlngs.push([
          points[i].geometry.y,
          points[i].geometry.x,
          points[i].fields[valueField]
        ]);
      }
      this._heat = L.heatLayer(_latlngs, config).addTo(this.map);
    },
    _addPoint: function(params) {
      var options = params.options;
      var points = params.points;
      var renderer = options.renderer || this.defaultRenderJson;
      array.forEach(
        points,
        function(pointObj) {
          var geometry = pointObj.geometry;
          var icon = this._getSymbol(renderer, pointObj.fields, "point");
          var marker;
          if (icon !== null) {
            marker = L.marker([geometry.y, geometry.x], { icon: icon });
          } else {
            marker = L.marker([geometry.y, geometry.x]);
          }
          marker.addTo(this._heatLayer);
        },
        this
      );
    },
    /**将arcgis的Symbol转换为leaflet的icon*/
    _getSymbol: function(renderer, attr, geotype) {
      var icons;
      if (renderer.type === "simple") {
        icons = this._getSymbolByType(renderer.symbol, geotype);
      } else if (renderer.type === "uniqueValue") {
        var uniqueValueInfos = renderer.uniqueValueInfos;
        var value = attr == null ? null : attr[renderer.field1] || null;
        if (value) {
          for (var i = 0; i < uniqueValueInfos.length; i++) {
            if (uniqueValueInfos[i].value == value) {
              icons = this._getSymbolByType(
                uniqueValueInfos[i].symbol,
                geotype
              );
            }
          }
        } else {
          icons = this._getSymbolByType(renderer.defaultSymbol, geotype);
        }
      } else if (renderer.type === "classBreaks") {
        var classBreaksInfos = renderer.classBreaksInfos;
        var value = attr == null ? null : attr[renderer.field1] || null;
        if (value) {
          for (var i = 0; i < classBreaksInfos.length; i++) {
            if (classBreaksInfos[i].classMaxValue <= value) {
              icons = this._getSymbolByType(
                classBreaksInfos[i].symbol,
                geotype
              );
            }
          }
        } else {
          icons = this._getSymbolByType(renderer.defaultSymbol, geotype);
        }
      }
      return icons;
    },
    _getSymbolByType: function(symbol, geotype) {
      if (geotype == "point") {
        return this._getIcon(symbol);
      } else if (geotype == "polyline") {
        return this._getPolylineAndPolyGonOption(symbol);
      } else if (geotype == "polygon") {
        ///todo
        return this._getPolylineAndPolyGonOption(symbol);
      }
    },
    /**将arcgis的PictureMarkerSymbol转换为leaflet的icon*/
    _getIcon: function(symbol) {
      if (symbol && symbol.url !== "") {
        var url = symbol.url;
        var size =
          isNaN(symbol.width) || isNaN(symbol.height)
            ? null
            : [symbol.width, symbol.height];
        var anchor = [
          isNaN(symbol.xoffset) ? 0 : symbol.xoffset,
          isNaN(symbol.yoffset) ? 0 : symbol.yoffset
        ];
        return L.icon({
          iconUrl: window.path + url,
          iconSize: size,
          iconAnchor: anchor
        });
      } else {
        return null;
      }
    },
    /**将arcgis的SimpleLineSymbol转换为leaflet样式*/
    _getPolylineAndPolyGonOption: function(symbol) {
      var option = {};
      if (symbol.hasOwnProperty("outline")) {
        for (var key in symbol) {
          if (symbol.hasOwnProperty(key)) {
            option.fill = true;
            if (key === "alpha") {
              option["fillOpacity"] = symbol[key];
            } else if (key === "color") {
              option["fillColor"] = symbol[key];
            } else {
              option[key] = symbol[key];
            }
          }
        }
        for (var key in symbol.outline) {
          if (symbol.outline.hasOwnProperty(key)) {
            if (key === "alpha") {
              option["opacity"] = symbol.outline[key];
            } else if (key === "width") {
              option["weight"] = symbol.outline[key];
            } else {
              option[key] = symbol.outline[key];
            }
          }
        }
      } else {
        for (var key in symbol) {
          if (symbol.hasOwnProperty(key)) {
            if (key === "alpha") {
              option["opacity"] = symbol[key];
            } else if (key === "width") {
              option["weight"] = symbol[key];
            } else {
              option[key] = symbol[key];
            }
          }
        }
      }
      return option;
    },
    onTopicHandler_deleteHeatMap: function() {
      this._clear();
      if (this.zoomEvent) {
        this.map.off("zoomend");
        this.zoomEvent = null;
      }
    },
    _clear: function() {
      this._heatLayer.clearLayers();
      if (this._heat) {
        this.map.removeLayer(this._heat);
      }
    }
  });
});
