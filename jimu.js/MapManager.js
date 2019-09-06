define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/query"
], function(declare, lang, topic, query) {
  var instance = null,
    clazz;

  clazz = declare(null, {
    appConfig: null,
    mapDivId: "",
    map: null,
    _miniMap: null,
    layerList: [],
    _intervals: [],
    _layerIndex: 0,
    constructor: function(options, mapDivId) {
      this.appConfig = options.appConfig;
      this.mapDivId = mapDivId;
      this.id = mapDivId;

      topic.subscribe(
        "setLayerVisibility",
        lang.hitch(this, this._onTopicHandler_setLayerVisibility)
      );

      topic.subscribe(
        "showOverviewMap",
        lang.hitch(this, this._onTopicHandler_showOverviewMap)
      );

      topic.subscribe(
        "hideOverviewMap",
        lang.hitch(this, this._onTopicHandler_hideOverviewMap)
      );

      topic.subscribe(
        "showNavigationBar",
        lang.hitch(this, this._onTopicHandler_showNavigationBar)
      );

      topic.subscribe(
        "hideNavigationBar",
        lang.hitch(this, this._onTopicHandler_hideNavigationBar)
      );

      topic.subscribe("setMapCenter", lang.hitch(this, this._onTopicHandler_setMapCenter));
      topic.subscribe("setMapLevel", lang.hitch(this, this._onTopicHandler_setMapLevel));
    },

    showMap: function() {
      console.time("Load Map");

      var mapOptions = this.appConfig.map.mapOptions;
      //百度坐标系
      if (this.appConfig.map.coordinateSystem === "BD09") {
        mapOptions = lang.mixin(mapOptions, { crs: L.CRS.Baidu });
      }
      var map = L.map(this.mapDivId, mapOptions);

      this.appConfig.map.basemaps.forEach(
        lang.hitch(this, function(layerConfig) {
          this._createMap(map, layerConfig);
        })
      );

      console.timeEnd("Load Map");
      this.map = map;
      topic.publish("mapLoaded", this.map);
    },
    
    _createMap: function(map, layerConfig) {
      var keyProperties = ["label", "url", "type"];
      var options = [];
      for (var p in layerConfig) {
        if (layerConfig.hasOwnProperty(p)) {
          if (keyProperties.indexOf(p) < 0) {
            options[p] = layerConfig[p];
          }
        }
      }
      var layer;
      var miniMapLayer;
      layerConfig.url = layerConfig.url.replace(
        /{gisServer}/i,
        this.appConfig.map.gisServer
      );
      switch (layerConfig.type) {
        case "tile":
          var url = layerConfig.url;
          layer = L.tileLayer(url, options);

          if (layerConfig.label === this.appConfig.map.miniMap.layer) {
            miniMapLayer = L.tileLayer(url, options);
          }
          break;

        case "csv":
          break;
        case "BD_vec_own":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "bdvec",
            bigFont: layerConfig.bigFont
          });
          break;
        case "BD_vec":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "vec",
            bigFont: layerConfig.bigFont
          });

          if (
            this.appConfig.map.miniMap.show &&
            layerConfig.label === this.appConfig.map.miniMap.layer
          ) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "vec",
              bigFont: layerConfig.bigFont
            });
          }
          break;

        case "BD_img":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "img_d"
          });

          if (layerConfig.label === this.appConfig.map.miniMap.layer) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "img_d"
            });
          }
          break;

        case "BD_ano":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "img_z",
            bigFont: layerConfig.bigFont
          });
          break;

        case "BD_custom":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "custom",
            customid: layerConfig.style
          });

          if (layerConfig.label === this.appConfig.map.miniMap.layer) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "custom",
              customid: layerConfig.style
            });
          }
          break;

        case "BD_time":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "time"
          });
          break;
        case "BD_time_own":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            proxy: layerConfig.proxyUrl,
            layer: "time_own"
          });
          break;
      }
      layer.label = layerConfig.label;
      layer.index = this._layerIndex;
      this._layerIndex++;
      this.layerList.push(layer);

      layer.layerConfig = layerConfig;

      if (layerConfig.refreshInterval) {
        layer.refreshInterval = layerConfig.refreshInterval;
      }
      if (layerConfig.visible) {
        layer.addTo(map);
        if (layerConfig.refreshInterval) {
          this._setRefresh(map, layer);
        }
      }

      if (miniMapLayer) {
        this._miniMap = new L.Control.MiniMap(miniMapLayer, {
          toggleDisplay: true,
          zoomLevelOffset: -4,
          minimized: true,
          zoomAnimation: true,
          strings: {
            hideText: "隐藏鹰眼图",
            showText: "显示鹰眼图"
          }
        }).addTo(map);
      }
    },

    _setRefresh: function(map, layer) {
      var layerConfig = layer.layerConfig;
      var index = layer.index;
      var interval = setInterval(
        lang.hitch(this, function() {
          //console.log(layer.label);
          this.map.eachLayer(
            lang.hitch(this, function(layeritem) {
              if (layeritem.label === layer.label) {
                layeritem.remove();
                this.layerList.forEach(function(item, index) {
                  if (item.label === layeritem.label) {
                    this.layerList.splice(index, 1);
                  }
                }, this);
                this._refreshLayer(map, layerConfig, index);
              }
            })
          );
        }),
        layerConfig.refreshInterval * 1000 * 60
      );
      this._intervals.push({ timer: interval, label: layer.label });
    },

    _refreshLayer: function(map, layerConfig, index) {
      switch (layerConfig.type) {
        case "tile":
          var url = layerConfig.url.replace(
            /{gisServer}/i,
            this.appConfig.map.gisServer
          );
          layer = L.tileLayer(url, options);

          break;

        case "csv":
          break;
        case "BD_vec2":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "bdvec",
            bigFont: layerConfig.bigFont
          });
          break;
        case "BD_vec":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "vec",
            bigFont: layerConfig.bigFont
          });

          if (
            this.appConfig.map.miniMap.show &&
            layerConfig.label === this.appConfig.map.miniMap.layer
          ) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "vec",
              bigFont: layerConfig.bigFont
            });
          }
          break;

        case "BD_img":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "img_d"
          });

          if (layerConfig.label === this.appConfig.map.miniMap.layer) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "img_d"
            });
          }
          break;

        case "BD_ano":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "img_z",
            bigFont: layerConfig.bigFont
          });
          break;

        case "BD_custom":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "custom",
            customid: layerConfig.style
          });

          if (layerConfig.label === this.appConfig.map.miniMap.layer) {
            miniMapLayer = L.tileLayer.baidu({
              url: layerConfig.url,
              layer: "custom",
              customid: layerConfig.style
            });
          }
          break;

        case "BD_time":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            layer: "time"
          });
          break;
        case "BD_time_own":
          layer = L.tileLayer.baidu({
            url: layerConfig.url,
            proxy: layerConfig.proxyUrl,
            layer: "time_own"
          });
          break;
      }
      layer.label = layerConfig.label;
      layer.layerConfig = layerConfig;
      layer.refreshInterval = layerConfig.refreshInterval;
      layer.index = index;
      layer.addTo(map);

      layer.setZIndex(index);

      this.layerList.push(layer);
    },

    _clearInterval: function(label) {
      this._intervals.forEach(function(interval, index) {
        if (interval.label === label) {
          clearInterval(interval.timer);
          this._intervals.splice(index, 1);
        }
      }, this);
    },

    _onTopicHandler_setLayerVisibility: function(params) {
      this.layerList.forEach(function(layer) {
        if (layer.label === params.label) {
          if (params.visible && !this.map.hasLayer(layer)) {
            this.map.addLayer(layer);
            layer.setZIndex(layer.index);
            if (layer.refreshInterval) {
              this._clearInterval(layer.label);
              this._setRefresh(this.map, layer);
            }
          } else if (!params.visible && this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
            this._clearInterval(layer.label);
          }
        }
      }, this);
    },

    _onTopicHandler_showOverviewMap: function() {
      this._miniMap._container.style.display = "block";
    },

    _onTopicHandler_hideOverviewMap: function() {
      this._miniMap._container.style.display = "none";
    },

    _onTopicHandler_showNavigationBar: function() {
      query(".leaflet-control-zoom").style("display", "block");
    },

    _onTopicHandler_hideNavigationBar: function() {
      query(".leaflet-control-zoom").style("display", "none");
    },
    
    _onTopicHandler_setMapCenter: function (params) {
      this.map.panTo([params.y, params.x]);
    },

    _onTopicHandler_setMapLevel: function (params) {
      this.map.setZoom(params.level);
    }
  });

  clazz.getInstance = function(options, mapDivId) {
    if (instance === null) {
      instance = new clazz(options, mapDivId);
    }
    return instance;
  };

  return clazz;
});
