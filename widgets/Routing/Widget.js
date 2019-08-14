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
    baseClass: "jimu-widget-Routingbar",
    _routingLayer: null,
    _startPoint: null,
    _endPoint: null,
    _pointList: null,
    _tooltipDiv: null,
    postCreate: function() {
      this.inherited(arguments);
      this._routingLayer = L.layerGroup().addTo(this.map);

      this._startPoint = L.icon({
        iconUrl: window.path + "images/mapIcons/TianJin/GongJiao/bus_start.png",
        iconSize: [26, 42],
        iconAnchor: [13, 42]
      });
      this._endPoint = L.icon({
        iconUrl: window.path + "images/mapIcons/TianJin/GongJiao/bus_end.png",
        iconSize: [26, 42],
        iconAnchor: [13, 42]
      });

      //显示tooltip
      this._tooltipDiv = domConstruct.place(
        "<div id='Routingtooltip' class='tooltipDiv'></div>",
        document.getElementById(jimuConfig.mapId)
      );
    },
    startup: function() {
      this.inherited(arguments);
      $("." + this.baseClass).css("zIndex", 600);

      $("#btnStart").mouseup(lang.hitch(this, this.onBtnStartClick));
      $("#btnClear").mouseup(lang.hitch(this, this.onBtnClear));
    },
    onBtnClear: function(event) {
      this.map.doubleClickZoom.enable();
      this.map.off("click");
      this.map.off("mousemove");
      this._routingLayer.clearLayers();
      domStyle.set(this._tooltipDiv, "display", "none");
      //改变鼠标指针
      domStyle.set(document.getElementById(jimuConfig.mapId), "cursor", "auto");
    },
    onBtnStartClick: function(event) {
      //禁用双击放大, 将双击事件留给停止绘制
      this.onBtnClear();
      this.map.doubleClickZoom.disable();
      this._pointList = [];
      //改变鼠标指针
      domStyle.set(
        document.getElementById(jimuConfig.mapId),
        "cursor",
        "crosshair"
      );
      this._tooltipDiv.innerHTML = "点击添加起点";
      this.map.on("click", lang.hitch(this, this.onMapClick));
      this.map.on("mousemove", lang.hitch(this, this.onMapMouseMove));
    },
    onMapMouseMove: function(event) {
      var point = event.latlng;
      //tooltip
      var containerPoint = event.containerPoint;
      domStyle.set(this._tooltipDiv, "top", containerPoint.y - 15 + "px");
      domStyle.set(this._tooltipDiv, "left", containerPoint.x + 15 + "px");
    },
    onMapClick: function(event) {
      var point = event.latlng;
      //tooltip
      var containerPoint = event.containerPoint;
      domStyle.set(this._tooltipDiv, "display", "block");
      domStyle.set(this._tooltipDiv, "top", containerPoint.y - 15 + "px");
      domStyle.set(this._tooltipDiv, "left", containerPoint.x + 15 + "px");

      if (event.originalEvent.srcElement.nodeName == "INPUT") {
        return;
      }
      var point = event.latlng;
      this._pointList.push(point);
      var marker;
      if (this._pointList.length > 1) {
        marker = L.marker(point, { icon: this._endPoint });
        this.map.off("click");
        this.map.off("mousemove");
        //改变鼠标指针
        domStyle.set(
          document.getElementById(jimuConfig.mapId),
          "cursor",
          "auto"
        );
        domStyle.set(this._tooltipDiv, "display", "none");
        this.OnRouting();
      } else {
        marker = L.marker(point, { icon: this._startPoint });
        this._tooltipDiv.innerHTML = "再次点击添加终点";
      }

      marker.addTo(this._routingLayer);
      this.map.doubleClickZoom.enable();
    },
    OnRouting: function() {
      var sPoint = this._pointList[0].lng + "," + this._pointList[0].lat;
      var ePoint = this._pointList[1].lng + "," + this._pointList[1].lat;
      $.ajax({
        //用变量做url参数前面会带上http://localhost:8090, 不知如何解决
        url:
          "http://" +
          this.appConfig.map.gisServer +
          ":25001/as/route/car?ak=" +
          this.appConfig.map.key +
          "&callback=callback&origin=" +
          sPoint +
          "&destination=" +
          ePoint,
        type: "GET",
        dataType: "jsonp", //使用jsonp避免跨域问题
        jsonpCallback: "callback",
        success: lang.hitch(this, function(result) {
          if (result.message == "ok") {
            var steps = result.result.routes[0].steps;
            var latlngs = [];
            for (var i = 0; i < steps.length; i++) {
              var paths = steps[i].path.split(";");
              //turn:"3":左转;7,右转
              //var turn=steps[i].turn.toString()=="3"?"左转":"右转";
              //var road=steps[i].instruction;
              //var dir=steps[i].distance+"米";
              // var text=turn+"进入"+road+"沿着"+road+"行驶"+dir+"米";
              for (var j = 0; j < paths.length - 1; j++) {
                var point = paths[j].split(",");
                var latlng = [Number(point[1]), Number(point[0])];
                latlngs.push(latlng);
              }
            }
            console.log(latlngs);
            var polyline = L.polyline(latlngs, { color: "blue" }).addTo(
              this._routingLayer
            );
          }
        }),
        error: {}
      });
    }
  });
});
