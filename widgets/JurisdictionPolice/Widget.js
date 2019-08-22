/**
 * 辖区警力
 * 通过json文件画出辖区，再在辖区中标注警力
 * */

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/fx",
  "dojo/string",
  "dojo/topic",
  "dojo/dom-style",
  "jimu/BaseWidget",
  "jimu/utils"
], function(
  declare,
  lang,
  array,
  fx,
  string,
  topic,
  domStyle,
  BaseWidget,
  jimuUtils
) {
  var lineColor = {
    ROAD: [255, 78, 65],
    "NON-ROAD": [90, 190, 242],
    RIVER: [90, 190, 242]
  };
  var lineStyle = {
    //CONTAINED: SimpleLineSymbol.STYLE_SOLID,
    //"NOT-CONTAINED": SimpleLineSymbol.STYLE_DASH
  };

  return declare([BaseWidget], {
    lineGraphics: [],
    jurisdictionLayer: null,
    jurisdictionLineLayer: null,
    streetLayer: null,

    postCreate: function() {
      this.inherited(arguments);
      this.jurisdictionLayer = L.layerGroup().addTo(this.map);
      this.jurisdictionLineLayer = L.layerGroup().addTo(this.map);

      this._readJurisdictionLayer();

      topic.subscribe(
        "showJurisdiction",
        lang.hitch(this, this.onTopicHandler_showJurisdiction)
      );
      topic.subscribe(
        "hideJurisdiction",
        lang.hitch(this, this.onTopicHandler_hideJurisdiction)
      );
    },

    /**
     * 派出所辖区和警力统计
     * 从json读取派出所辖区, 符号化后显示在地图上
     * */
    _readJurisdictionLayer: function() {
      //派出所辖区区域
      fetch(
        window.path + "configs/JurisdictionPolice/bsga_v2.geojson"
      ).then(
        lang.hitch(this, function(response) {
          if (response.ok) {
            response.json().then(
              lang.hitch(this, function(data) {
                var colorRamps = [
                  "#9575cd", "#7986cb", "#64b5f6", "#4dd0e1",
                  "#4db6ac", "#81c784", "#aed581", "#dce775",
                  "#fff176", "#ffd54f", "#ffb74d", "#ff8a65"];

                data.features.forEach(function(feature, index) {
                  if (feature.geometry.type === "Polygon") {
                    var paths = feature.geometry.coordinates;

                    var leafletPaths = paths.map(function(path) {
                      return array.map(path, function(coords) {
                        var newXY = coordtransform.gcj02tobd09(
                          coords[0],
                          coords[1]
                        );

                        return [newXY[1], newXY[0]];
                      });
                    });

                    var polygon = L.polygon(leafletPaths, {
                      color: "#3f51b5",
                      opacity: 1,
                      weight: 1,
                      fillColor: colorRamps[index % (colorRamps.length)],
                      fillOpacity: 0.4,
                      attribution: feature.properties
                    }).addTo(this.jurisdictionLayer);

                    polygon.on(
                      "click",
                      lang.hitch(this, function(e) {
                        if (this.jurisdictionLineLayer.getLayers().length > 0) {
                          //判断点击是否是已高亮的派出所
                          if (
                            e.sourceTarget.options.attribution.name ===
                            this.jurisdictionLineLayer.getLayers()[0].options
                              .attribution.name
                          ) {
                            this.jurisdictionLineLayer.clearLayers();
                            return;
                          }
                        }
                        this.jurisdictionLineLayer.clearLayers();
                        var latlngs = e.sourceTarget._latlngs;

                        var area = L.polyline(latlngs[0], {
                          color: "#FF0000",
                          opacity: 0.9,
                          weight: 4,
                          dashArray: "5,8",
                          attribution: feature.properties
                        }).addTo(this.jurisdictionLineLayer);
                      })
                    );

                    var pcsName = feature.properties.name;
                    //去掉名称里的“派出所”
                    if (pcsName.indexOf("派出所") >= 0) {
                      pcsName = pcsName.substr(0, pcsName.indexOf("派出所"));
                    }
                    var myIcon = L.divIcon({
                      html: pcsName,
                      className: "my-div-icon"
                    });
                    L.marker(polygon.getCenter(), {
                      icon: myIcon
                    }).addTo(this.jurisdictionLayer);
                  }

                }, this);

                this.map.removeLayer(this.jurisdictionLayer);
              })
            );
          }
        })
      );
    },

    onTopicHandler_showJurisdiction: function() {
      this.map.addLayer(this.jurisdictionLayer);
    },

    onTopicHandler_hideJurisdiction: function() {
      this.map.removeLayer(this.jurisdictionLayer);
      this.jurisdictionLineLayer.clearLayers();
    }
  });
});
