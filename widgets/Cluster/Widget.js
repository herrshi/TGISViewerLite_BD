define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/fx",
  "dojo/topic",
  "dojo/dom-style",
  "jimu/BaseWidget",
  "jimu/utils"
], function(declare, lang, fx, topic, domStyle, BaseWidget, jimuUtils) {
  return declare([BaseWidget], {
    _clusterLayers: [],

    postCreate: function() {
      this.inherited(arguments);

      topic.subscribe(
        "addOverlaysCluster",
        lang.hitch(this, this.onTopicHandler_addOverlaysCluster)
      );
      topic.subscribe(
        "deleteOverlaysCluster",
        lang.hitch(this, this.onTopicHandler_deleteOverlaysCluster)
      );
      topic.subscribe(
        "showOverlaysCluster",
        lang.hitch(this, this.onTopicHandler_showOverlaysCluster)
      );
      topic.subscribe(
        "hideOverlaysCluster",
        lang.hitch(this, this.onTopicHandler_hideOverlaysCluster)
      );
      topic.subscribe(
        "findFeature",
        lang.hitch(this, this.onTopicHandler_findFeature)
      );
    },

    _getClusterLayer: function(type) {
      for (let i = 0; i < this._clusterLayers.length; i++) {
        const layer = this._clusterLayers[i];
        if (layer.type === type) {
          return layer;
        }
      }
      return undefined;
    },

    /**将arcgis的PictureMarkerSymbol转换为leaflet的icon*/
    _getIcon: function(symbol) {
      if (symbol && symbol.url !== "") {
        const url = symbol.url;
        const size =
          isNaN(symbol.width) || isNaN(symbol.height)
            ? null
            : [symbol.width, symbol.height];
        const anchor = [
          isNaN(symbol.xoffset) ? 0 : symbol.xoffset,
          isNaN(symbol.yoffset) ? 0 : symbol.yoffset
        ];
        return L.icon({
          iconUrl: url,
          iconSize: size,
          iconAnchor: anchor
        });
      } else {
        return null;
      }
    },

    onTopicHandler_addOverlaysCluster: function(params) {
      const {
        type,
        coordinateSystem,
        zoom,
        distance,
        defaultSymbol,
        defaultVisible
      } = params;
      const defaultIcon = this._getIcon(defaultSymbol);

      let layer = this._getClusterLayer(type);
      if (!layer) {
        const layerOptions = {};
        if (zoom) {
          layerOptions.disableClusteringAtZoom = zoom;
        }
        if (distance) {
          layerOptions.maxClusterRadius = distance;
        }
        layer = L.markerClusterGroup(layerOptions);
        layer.type = type;
        this._clusterLayers.push(layer);
        if (defaultVisible) {
          this.map.addLayer(layer);
        }
      }

      params.points.forEach(pointObj => {
        const { id, geometry, fields, symbol } = pointObj;
        if (!isNaN(geometry.x) && !isNaN(geometry.y)) {
          if (coordinateSystem) {
            const newXY = jimuUtils.coordTransform(
              geometry.x,
              geometry.y,
              false,
              coordinateSystem
            );
            geometry.x = newXY[0];
            geometry.y = newXY[1];
          }
          const icon = this._getIcon(symbol) || defaultIcon;
          let marker;
          if (icon !== null) {
            marker = L.marker([geometry.y, geometry.x], {
              icon: icon
            });
          } else {
            marker = L.marker([geometry.y, geometry.x]);
          }
          marker.id = id;
          marker.type = type;
          marker.attributes = fields;
          marker.addTo(layer);

          marker.on(
            "click",
            lang.hitch(this, function(evt) {
              const point = evt.sourceTarget || evt.target;
              const { id, type } = point;
              showGisDeviceInfo(type, id);
              showGisDeviceDetailInfo(type, id, point.attributes);
            })
          );
        }
      });

      this.publishData(this._clusterLayers);
    },

    onTopicHandler_deleteOverlaysCluster: function(params) {
      if (!params || !params.types || params.types.length === 0) {
        this._clusterLayers.forEach(layer => {
          if (this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
          }
          layer.clearLayers();
        });
        this._clusterLayers = [];
      } else {
        const { types } = params;
        types.forEach(type => {
          const layer = this._getClusterLayer(type, false);
          if (layer) {
            layer.clearLayers();
          }
          if (this.map.hasLayer()) {
            this.map.removeLayer(layer);
          }
          for (let i = 0; i < this._clusterLayers.length; i++) {
            const layer = this._clusterLayers[i];
            if (layer.type === type) {
              this._clusterLayers.splice(i--, 1);
            }
          }
        });
      }
    },

    onTopicHandler_showOverlaysCluster: function(params) {
      //显示所有
      if (!params || !params.types || params.types.length === 0) {
        this._clusterLayers.forEach(layer => {
          if (!this.map.hasLayer(layer)) {
            this.map.addLayer(layer);
          }
        });
      } else {
        const { types } = params;
        types.forEach(type => {
          const layer = this._getClusterLayer(type);
          if (layer && !this.map.hasLayer(layer)) {
            this.map.addLayer(layer);
          }
        });
      }
    },

    onTopicHandler_hideOverlaysCluster: function(params) {
      if (!params || !params.types || params.types.length === 0) {
        this._clusterLayers.forEach(layer => {
          if (this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
          }
        });
      } else {
        const { types } = params;
        types.forEach(type => {
          const layer = this._getClusterLayer(type);
          if (layer && this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
          }
        });
      }
    },

    onTopicHandler_findFeature: function(params) {
      const { type, id, zoom } = params;
      this._clusterLayers.forEach(layer => {
        if (!type || layer.type === type) {
          layer.eachLayer(marker => {
            if (marker.id === id) {
              this.map.flyTo(marker.getLatLng(), zoom);
              setTimeout(() => this.flashFeature(marker), 1000);
              // this.flashFeature(marker);
            }
          });
        }
      });
    },

    flashFeature: function(marker) {
      const interval = setInterval(() => {
        if (domStyle.get(marker._icon, "opacity") === "0") {
          fx.fadeIn({ node: marker._icon, duration: 300 }).play();
        } else {
          fx.fadeOut({ node: marker._icon, duration: 300 }).play();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        domStyle.set(marker._icon, "opacity", "1");
      }, 5000);
    }
  });
});
