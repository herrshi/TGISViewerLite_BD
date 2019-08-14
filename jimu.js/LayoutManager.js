define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "dojo/topic",
  "dojo/promise/all",
  "dojo/Deferred",
  "dijit/_WidgetBase",
  "jimu/MapManager",
  "jimu/WidgetManager"
], function(
  declare,
  lang,
  html,
  array,
  topic,
  all,
  Deferred,
  _WidgetBase,
  MapManager,
  WidgetManager
) {
  var instance = null,
    clazz;

  clazz = declare([_WidgetBase], {
    map: null,
    mapId: "map",

    constructor: function(domId) {
      this.widgetManager = WidgetManager.getInstance();

      this.id = domId;

      this.own(
        topic.subscribe(
          "appConfigLoaded",
          lang.hitch(this, this.onAppConfigLoaded)
        )
      );
      this.own(
        topic.subscribe("mapLoaded", lang.hitch(this, this.onMapLoaded))
      );
      this.own(topic.subscribe("openWidget", lang.hitch(this, this._onOpenWidget)));
      this.own(topic.subscribe("closeWidget", lang.hitch(this, this._onCloseWidget)));
    },

    postCreate: function() {
      this.containerNode = this.domNode;
    },

    onAppConfigLoaded: function(config) {
      this.appConfig = lang.clone(config);

      this._loadMap();
    },

    onMapLoaded: function(map) {
      this.map = map;
      this._loadPreloadWidgets(this.appConfig);
    },

    _loadMap: function() {
      html.create(
        "div",
        {
          id: this.mapId,
          style: lang.mixin({
            position: "absolute",
            width: "100%",
            height: "100%"
          })
        },
        this.id
      );

      this.mapManager = MapManager.getInstance(
        {
          appConfig: this.appConfig
        },
        this.mapId
      );
      this.mapManager.showMap();
    },

    _loadPreloadWidgets: function(appConfig) {
      console.time("Load widgetOnScreen");

      var deferreds = [];
      appConfig.widgets.forEach(function(widgetConfig) {
        deferreds.push(this._loadPreloadWidget(widgetConfig));
      }, this);

      all(deferreds).then(
        lang.hitch(this, function() {
          console.timeEnd("Load widgetOnScreen");
          topic.publish("preloadWidgetsLoaded");
          if (window.loadFinishCallback) {
            window.loadFinishCallback();
          }
        }),
        lang.hitch(this, function() {
          console.timeEnd("Load widgetOnScreen");
          topic.publish("preloadWidgetsLoaded");
          if (window.loadFinishCallback) {
            window.loadFinishCallback();
          }
        })
      );
    },

    _loadPreloadWidget: function(widgetConfig) {
      var def = new Deferred();

      if (!widgetConfig.uri) {
        //in run mode, when no uri, do nothing
        def.resolve(null);
        return def;
      }

      this.widgetManager.loadWidget(widgetConfig).then(
        lang.hitch(this, function(widget) {
          widget.setPosition(widget.position);
          def.resolve(widget);
        }),
        function(error) {
          def.reject(error);
        }
      );

      return def;
    },

    _onOpenWidget: function (widgetId) {
      this.widgetManager.openWidget(widgetId);
    },

    _onCloseWidget: function (widgetId) {
      this.widgetManager.closeWidget(widgetId);
    }
  });

  clazz.getInstance = function(domId) {
    if (instance === null) {
      instance = new clazz(domId);
      // window._layoutManager = instance;
    }
    return instance;
  };
  return clazz;
});
