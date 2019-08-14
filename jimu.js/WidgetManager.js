define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "dojo/topic",
  "dojo/Deferred",
  "dojo/promise/all",
  "dojo/request/xhr",
  "jimu/utils"
], function(declare, lang, html, array, topic, Deferred, all, xhr, jimuUtils) {
  var instance = null,
    clazz;

  clazz = declare(null, {
    constructor: function() {
      //the loaded widget list
      this.loaded = [];

      topic.subscribe("mapLoaded", lang.hitch(this, this._onMapLoaded));
      topic.subscribe(
        "appConfigLoaded",
        lang.hitch(this, this._onAppConfigLoaded)
      );
    },

    _onAppConfigLoaded: function(_appConfig) {
      this.appConfig = lang.clone(_appConfig);
    },

    _onMapLoaded: function(map) {
      this.map = map;
    },

    loadWidget: function(setting) {
      var def = new Deferred();

      all([
        this._loadWidgetClass(setting),
        this._loadWidgetManifest(setting)
      ]).then(
        lang.hitch(this, function(results) {
          var clazz = results[0];
          var setting = results[1];
          this._loadWidgetResources(setting).then(
            lang.hitch(this, function(resources) {
              try {
                var widget = this._createWidget(setting, clazz, resources);
                html.setAttr(widget.domNode, "data-widget-name", setting.name);
                console.log("widget [" + setting.uri + "] created.");
              } catch (error) {
                console.error(
                  "create [" + setting.uri + "] error:" + error.stack
                );
                def.reject(error);
              }

              //use timeout to let the widget can get the correct dimension in startup function
              setTimeout(
                lang.hitch(this, function() {
                  def.resolve(widget);
                  // this.emit("widget-created", widget);
                  topic.publish("widgetCreated", widget);
                }),
                50
              );
            }),
            function(error) {
              def.reject(error);
            }
          );
        }),
        function(error) {
          def.reject(error);
        }
      );

      return def;
    },

    _loadWidgetManifest: function(setting) {
      var def = new Deferred();

      var info = jimuUtils.getUriInfo(setting.uri);
      var url;
      if (info.isRemote) {
        url = info.folderUrl + "manifest.json?f=json";
      } else {
        url = info.folderUrl + "manifest.json";
      }

      if (setting.manifest) {
        def.resolve(setting);
        return def;
      }

      xhr(url, {
        handleAs: "json",
        headers: {
          "X-Requested-With": null
        }
      }).then(
        lang.hitch(this, function(manifest) {
          manifest.category = "widget";
          lang.mixin(manifest, jimuUtils.getUriInfo(setting.uri));
          jimuUtils.manifest.addManifestProperties(manifest);
          jimuUtils.widgetJson.addManifest2WidgetJson(setting, manifest);
          def.resolve(setting);
        })
      );

      return def;
    },

    _loadWidgetClass: function(setting) {
      var def = new Deferred();

      var uri = window.path + setting.uri + ".js";
      require([uri], lang.hitch(this, function(clazz) {
        def.resolve(clazz);
      }));

      return def;
    },

    _loadWidgetResources: function(setting) {
      var def = new Deferred(),
        defConfig,
        defStyle,
        defTemplate,
        defs = [];
      var setting2 = lang.clone(setting);

      defConfig = this.tryLoadWidgetConfig(setting2);
      defStyle = this._tryLoadResource(setting2, "style");
      defTemplate = this._tryLoadResource(setting2, "template");

      defs.push(defConfig);
      defs.push(defTemplate);
      defs.push(defStyle);

      all(defs).then(
        lang.hitch(this, function(results) {
          var res = {};
          res.config = results[0];
          res.template = results[1];
          res.style = results[2];
          def.resolve(res);
        }),
        function(err) {
          console.log(err);
          def.reject(err);
        }
      );

      return def;
    },

    tryLoadWidgetConfig: function(setting) {
      return this._tryLoadWidgetConfig(setting).then(
        lang.hitch(this, function(config) {
          setting.config = config;
          return config;
        })
      );
    },

    _tryLoadWidgetConfig: function(setting) {
      var def = new Deferred();
      //need load config first, because the template may be use the config data
      if (setting.config && lang.isObject(setting.config)) {
        //if widget is configurated in the app config.json, the i18n has been processed
        def.resolve(setting.config);
        return def;
      } else if (setting.config) {
        if (require.cache["url:" + setting.config]) {
          def.resolve(json.parse(require.cache["url:" + setting.config]));
          return def;
        }

        var configFile = jimuUtils.processUrlInAppConfig(setting.config);
        // The widgetConfig filename is dependent on widget label,
        // IE8 & IE9 do not encode automatically while attempt to request file.
        var configFileArray = configFile.split("/");
        configFileArray[configFileArray.length - 1] = encodeURIComponent(
          configFileArray[configFileArray.length - 1]
        );
        configFile = configFileArray.join("/");
        return xhr(configFile, {
          handleAs: "json",
          headers: {
            "X-Requested-With": null
          }
        });
      } else {
        return this._tryLoadResource(setting, "config").then(function(config) {
          //this property is used in map config plugin
          setting.isDefaultConfig = true;
          return config;
        });
      }
    },

    _tryLoadResource: function(setting, flag) {
      var file,
        hasp,
        def = new Deferred(),
        doLoad = function() {
          var loadDef;
          if (flag === "config") {
            loadDef = this.loadWidgetConfig(setting);
          } else if (flag === "style") {
            loadDef = this.loadWidgetStyle(setting);
          } else if (flag === "template") {
            loadDef = this.loadWidgetTemplate(setting);
          } else {
            return def;
          }
          loadDef.then(
            function(data) {
              def.resolve(data);
            },
            function(err) {
              console.error("加载widget错误: " + setting.uri);
              def.reject(err);
            }
          );
        };

      if (flag === "config") {
        file = setting.amdFolder + "config.json";
        setting.configFile = file;
        hasp = "hasConfig";
      } else if (flag === "style") {
        file = setting.amdFolder + "css/style.css";
        setting.styleFile = file;
        hasp = "hasStyle";
      } else if (flag === "template") {
        file = setting.amdFolder + "Widget.html";
        setting.templateFile = file;
        hasp = "hasUIFile";
      } else {
        return def;
      }

      if (setting[hasp]) {
        doLoad.apply(this);
      } else {
        def.resolve(null);
      }
      return def;
    },

    loadWidgetConfig: function(widgetSetting) {
      var configFilePath = window.path + widgetSetting.configFile;
      if (require.cache["url:" + configFilePath]) {
        var def = new Deferred();
        def.resolve(json.parse(require.cache["url:" + configFilePath]));
        return def;
      }
      return xhr(configFilePath, {
        handleAs: "json",
        headers: {
          "X-Requested-With": null
        }
      });
    },

    /*
     * Load the css file in a widget.
     * This function load the widget"s css file and insert it into the HTML page through <link>.
     * It also ensure that the css file is inserted only one time.
     */
    loadWidgetStyle: function(widgetSetting) {
      var id = "widget/style/" + widgetSetting.uri,
        def = new Deferred();
      id = this._replaceId(id);
      if (html.byId(id)) {
        def.resolve("load");
        return def;
      }
      // var themeCommonStyleId =
      //   "theme_" + this.appConfig.theme.name + "_style_common";
      //insert widget style before theme style, to let theme style over widget style
      return jimuUtils.loadStyleLink(id, window.path + widgetSetting.styleFile);
    },

    loadWidgetTemplate: function(widgetSetting) {
      var def = new Deferred();
      require([
        "dojo/text!" + window.path + widgetSetting.templateFile
      ], function(template) {
        def.resolve(template);
      });

      return def;
    },

    _replaceId: function(id) {
      return id.replace(/\//g, "_").replace(/\./g, "_");
    },

    _createWidget: function(setting, clazz, resources) {
      var widget;

      setting.rawConfig = setting.config;
      setting.config = resources.config || {};
      if (resources.template) {
        setting.templateString = resources.template;
      }
      setting["class"] = "jimu-widget";
      if (!setting.label) {
        setting.label = setting.name;
      }
      if (this.map) {
        setting.map = this.map;
      }
      setting.appConfig = this.appConfig;

      // for IE8
      var setting2 = {};
      for (var prop in setting) {
        if (setting.hasOwnProperty(prop)) {
          setting2[prop] = setting[prop];
        }
      }

      setting2.widgetManager = this;

      widget = new clazz(setting2);
      widget.clazz = clazz;

      this.loaded.push(widget);
      return widget;
    },

    _getWidgetById: function(id) {
      var ret = null;
      array.some(
        this.loaded,
        function(w) {
          if (w.id === id) {
            ret = w;
            return true;
          }
        },
        this
      );
      return ret;
    },

    openWidget: function(widget) {
      if (typeof widget === "string") {
        widget = this._getWidgetById(widget);
        if (!widget) {
          return;
        }
      }

      if (!widget.started) {
        try {
          widget.started = true;
          widget.startup();
        } catch (error) {
          console.error(
            "Fail to startup widget " + widget.name + ". " + error.stack
          );
        }
      }

      if (widget.state === "closed") {
        html.setStyle(widget.domNode, "display", "");
        widget.setState("opened");
        try {
          widget.onOpen();
        } catch (error) {
          console.error(
            "Fail to open widget " + widget.name + ". " + error.stack
          );
        }
      }
    },

    closeWidget: function (widget) {
      if (typeof widget === "string") {
        widget = this._getWidgetById(widget);
        if (!widget) {
          return;
        }
      }

      if (widget.state !== "closed") {
        html.setStyle(widget.domNode, "display", "none");
        widget.setState("closed");
        try {
          widget.onClose();
        } catch (error) {
          console.error("Fail to close widget " + widget.name + ". " + error.stack);
        }
      }
    }
  });

  clazz.getInstance = function() {
    if (instance === null) {
      instance = new clazz();
    }
    return instance;
  };
  return clazz;
});
