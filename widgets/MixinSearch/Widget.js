define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "jimu/BaseWidget"
], function(declare, lang, topic, BaseWidget) {
  return declare([BaseWidget], {
    _graphicsLayer: null,
    _clusterGraphics: [],
    _overlayGraphics: [],

    postCreate: function() {
      this.inherited(arguments);

      this._graphicsLayer = L.layerGroup().addTo(this.map);

      topic.subscribe(
        "mixinSearch",
        lang.hitch(this, this.onTopicHandler_mixinSearch)
      );

      topic.subscribe(
        "clearMixinSearch",
        lang.hitch(this, this.onTopicHandler_clearMixinSearch)
      );
    },

    _getGeometryType: function(geometry) {
      if (geometry.hasOwnProperty("x") && geometry.hasOwnProperty("y")) {
        return "point";
      } else if (geometry.hasOwnProperty("paths")) {
        return "polyline";
      } else if (geometry.hasOwnProperty("rings")) {
        return "polygon";
      }
    },

    onTopicHandler_mixinSearch: function(parameter) {
      this._graphicsLayer.clearLayers();

      const { params, callback } = parameter;
      const {
        geometry,
        radius,
        showGeometry,
        showBuffer,
        showResult,
        contents,
        sort
      } = params;
      let originGeometry, searchGeometry;

      switch (this._getGeometryType(geometry)) {
        case "point":
          const latlng = [geometry.y, geometry.x];
          originGeometry = L.marker(latlng);
          if (radius && radius > 0) {
            // L.circle(latlng, { radius }).addTo(this._graphicsLayer);
            //使用turf判断点面关系，所以用turf做buffer
            searchGeometry = turf.buffer(
              turf.point([geometry.x, geometry.y]),
              radius,
              { units: "meters" }
            );
          }
          break;

        case "polyline":
          break;

        case "polygon":
          break;
      }

      if (showGeometry) {
        this._graphicsLayer.addLayer(originGeometry);
      }
      if (showBuffer) {
        //turf.polygon => leaflet.polygon
        //turf使用[lng, lat]格式, leaflet使用[lat, lng]格式
        const latlngs = searchGeometry.geometry.coordinates.map(ring =>
          ring.map(point => [point[1], point[0]])
        );
        this._graphicsLayer.addLayer(L.polygon(latlngs));
      }

      const searchResults = [];
      for (const searchContent of contents) {
        switch (searchContent.class) {
          case "poi":
            break;

          case "overlay":
            const overlayResult = this._overlaySearch({
              centerGeometry: geometry,
              searchGeometry,
              types: searchContent.types,
              showResult,
              sort
            });
            searchResults.push(overlayResult);
            break;
        }
      }

      if (typeof callback === "function") {
        callback(searchResults);
      }
    },

    onTopicHandler_clearMixinSearch: function() {
      this._graphicsLayer.clearLayers();
    },

    _overlaySearch: function(overlayParam) {
      const {
        centerGeometry,
        searchGeometry,
        types,
        showResult,
        sort
      } = overlayParam;
      const geometry = searchGeometry || centerGeometry;
      const searchType = types ? types.replace(/\s+/g, "").split(",") : [];

      let results = [];

      const centerPoint =
        this._getGeometryType(centerGeometry) === "point"
          ? turf.point([centerGeometry.x, centerGeometry.y])
          : null;

      this._clusterGraphics.concat(this._overlayGraphics).forEach(marker => {
        const latlng = marker.getLatLng();
        const lnglat = [latlng.lng, latlng.lat];
        if (
          (searchType.length === 0 || searchType.indexOf(marker.type) >= 0) &&
          turf.booleanPointInPolygon(
            turf.point(lnglat),
            turf.polygon(geometry.geometry.coordinates)
          )
        ) {
          if (showResult) {
            this._graphicsLayer.addLayer(marker);
          }

          const searchResult = {
            id: marker.id,
            type: marker.type,
            location: { x: latlng.lng, y: latlng.lat },
            fields: marker.fields
          };
          const resultPoint = turf.point([latlng.lng, latlng.lat]);
          if (centerPoint) {
            const distance = turf.distance(centerPoint, resultPoint, {
              units: "meters"
            });
            searchResult.distance = Math.round(distance * 100) / 100;
          }
          results.push(searchResult);
        }
      });

      //按距离排序
      if (centerPoint) {
        results.sort((a, b) =>
          sort === "desc" ? b.distance - a.distance : a.distance - b.distance
        );
      }

      return {
        class: "overlay",
        result: results
      };
    },

    onReceiveData: function(name, widgetId, data, historyData) {
      if (widgetId === "ClusterWidget") {
        this._clusterGraphics = [];
        //使用复制对象，否则清除clearMixinSearch时会将原始点位一起清除
        data.forEach(layerGroup => {
          this._clusterGraphics = this._clusterGraphics.concat(
            layerGroup.getLayers().map(graphic => this._cloneMarker(graphic))
          );
        });
      } else if (widgetId === "OverlayWidget") {
        //使用复制对象，否则清除clearMixinSearch时会将原始点位一起清除
        this._overlayGraphics = data
          .getLayers()
          .map(graphic => this._cloneMarker(graphic));
      }
    },

    _cloneMarker: function(marker) {
      const cloned = L.marker(marker.getLatLng(), {
        icon: marker.getIcon()
      });
      cloned.type = marker.type;
      cloned.id = marker.id;
      cloned.fields = marker.attributes;
      return cloned;
    }
  });
});
