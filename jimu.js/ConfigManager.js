define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/request/xhr"
], function(
  declare,
  lang,
  topic,
  xhr
) {
  var instance = null,
    clazz;

  clazz = declare(null, {
    appConfig: null,
    configFile: null,
    _configLoaded: false,

    loadConfig: function () {
      console.time("Load Config");
      this._tryLoadConfig().then(lang.hitch(this, function (appConfig) {
        this.appConfig = appConfig;
        console.timeEnd("Load Config");

        topic.publish("appConfigLoaded", appConfig);

      }), lang.hitch(this, function (error) {
        console.error(error);
      }));
      
    },

    _tryLoadConfig: function () {
      if (window.projectConfig) {
        this.configFile = window.projectConfig;
        return xhr(this.configFile, {
          handleAs: "json"
        }).then(lang.hitch(this, function (appConfig) {
          return appConfig;
        }));
      }
    }


  });

  clazz.getInstance = function() {
    if (instance === null) {
      instance = new clazz();
    }

    window.getAppConfig = lang.hitch(instance, instance.getAppConfig);
    return instance;
  };

  return clazz;
});
