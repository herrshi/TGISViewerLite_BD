define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/query",
  "dojo/on",
  "dojo/request/xhr",
  "dojo/dom",
  "dojo/dom-construct",
  "jimu/BaseWidget",
  "jimu/utils"
], function (declare, lang, array, query, on, xhr, dom, domConstruct, BaseWidget, jimuUtils) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-POISearch",

    _markerLayer: null,

    postCreate: function () {
      this.inherited(arguments);

      this._markerLayer = L.layerGroup().addTo(this.map);
    },

    startup: function () {
      this.inherited(arguments);
      $("." + this.baseClass).css("zIndex", 600);
      $("#btnPoiSearch").click(lang.hitch(this, this.onBtnPoiSearchClick));
      $("#btnPoiClear").click(lang.hitch(this, this.onBtnPoiClearClick));
    },

    onBtnPoiSearchClick: function () {
      var searchText = $("#txtSearchText").val();
      if (searchText === "") {
        return;
      }
      // var url = this.config.url;
      // url = url.replace(/{gisServer}/i, this.appConfig.map.gisServer);
      // url = url.replace(/{key}/i, this.appConfig.map.key);
      // url = url.replace(/{searchText}/i, searchText);
      // url = encodeURI(url);
      this._requestPoiData(searchText);

    },

    onBtnPoiClearClick: function () {
      $("#txtSearchText").val("");
      $("#divResult").css("display", "none");
      $("#tableResult").empty();
      this._markerLayer.clearLayers();
    },

    _requestPoiData: function (searchText) {
      // var url = this.config.url;
      // url = url.replace(/{gisServer}/i, this.appConfig.map.gisServer);
      // url = url.replace(/{key}/i, this.appConfig.map.key);
      // url = url.replace(/{searchText}/i, searchText);
      // url = encodeURI(url);
      // console.log(url);
      $.ajax({
        //用变量做url参数前面会带上http://localhost:8090, 不知如何解决
        url: "http://" + this.appConfig.map.gisServer + ":25001/as/search/poi?ak=" + this.appConfig.map.key + "&query=" + searchText + "&region=兰州&scope=2&page_size=9&page_num=1",
        type: "GET",
        dataType: "jsonp", //使用jsonp避免跨域问题
        success: lang.hitch(this, function (result) {
          if (result.message === "ok") {
            $("#divResult").css("display", "block");
            $("#tableResult").empty();
            this._markerLayer.clearLayers();

            for (var i = 0; i < result.results.length; i++) {
              var poiInfo = result.results[i];
              var icon = "images/red" + (i + 1) + ".png";
              var popup =
                '<b>' + poiInfo.name + '</b><br>' +
                '地址: ' + poiInfo.address + '<br>' +
                '电话: ' + poiInfo.telephone + '<br>' +
                '类型: ' + poiInfo.type;
              var poiItem =
                '<tr style="cursor: pointer; margin: 30px 8px 20px 6px; border-bottom: 1px solid #C0C0C0;" ' +
                'id="' + poiInfo.uid + '">' +
                  '<td style="width: 33px; height: 30px; vertical-align: top">' +
                    '<img src="images/red' + (i + 1) + '.png">' +
                  '</td>' +
                  '<td>' +
                    '<p>名称: ' + poiInfo.name + '</p>' +
                    '<p>地址: ' + poiInfo.address + '</p>' +
                    '<p>电话: ' + poiInfo.telephone + '</p>' +
                  '</td>' +
                '</tr>';
              $(poiItem).appendTo("#tableResult");

              //加点
              var x = poiInfo.location.lng;
              var y = poiInfo.location.lat;
              var newXY = jimuUtils.coordTransform(x, y);
              var marker = L.marker([newXY[1], newXY[0]], {
                icon: L.icon({
                  iconUrl: icon,
                  iconAnchor: [12, 35]
                })
              });
              marker.id = poiInfo.uid;
              marker.bindPopup(popup);
              marker.popup = marker.getPopup();
              marker.addTo(this._markerLayer);
            }

            //点击事件

          }
        })
      });
    }
  });
});
