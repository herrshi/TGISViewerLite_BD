define(["dojo/_base/declare", "dojo/_base/lang", "dojo/topic"], function(
  declare,
  lang,
  topic
) {
  var instance = null,
    clazz;

  clazz = declare(null, {
    constructor: function(widgetManager) {
      topic.subscribe("publishData", lang.hitch(this, this.onDataPublished));
      topic.subscribe("fetchData", lang.hitch(this, this.onFetchData));
      topic.subscribe('clearAllData', lang.hitch(this, this.onClearAllData));
      topic.subscribe('removeData', lang.hitch(this, this.onRemoveData));
      topic.subscribe('clearDataHistory', lang.hitch(this, this.onClearDataHistory));

      this.widgetManager = widgetManager;
    },

    //key = widgetId, value={current: data, history: [data]}
    _dataStore: {},

    /**存储数据*/
    onDataPublished: function(name, id, data, keepHistory) {
      //默认不保存历史数据
      if (typeof keepHistory === "undefined") {
        keepHistory = false;
      }

      if (!this._dataStore[id]) {
        this._dataStore[id] = { current: data };
        if (keepHistory) {
          this._dataStore[id].history = [data];
        }
      } else {
        this._dataStore[id].current = data;
        if (keepHistory) {
          if (this._dataStore[id].history) {
            this._dataStore[id].history.push(data);
          } else {
            this._dataStore[id].history = [data];
          }
        }
      }
    },

    onFetchData: function(id) {
      var widget;
      //发送指定widget的data
      if (id) {
        if (id === "framework") {
          if (this._dataStore[id]) {
            topic.publish(
              "dataFetched",
              "framework",
              "framework",
              this._dataStore[id].current,
              this._dataStore[id].history
            );
          } else {
            this.publish("noData", "framework", "framework");
          }
        } else {
          widget = this.widgetManager.getWidgetById(id);
          if (widget) {
            if (this._dataStore[id]) {
              topic.publish(
                "dataFetched",
                widget.name,
                id,
                this._dataStore[id].current,
                this._dataStore[id].history
              );
            }
          } else {
            topic.publish("noData", undefined, id);
          }
        }
      }
      //不传id则发送所有data
      else {
        for (var p in this._dataStore) {
          widget = this.widgetManager.getWidgetById(p);
          if (widget) {
            topic.publish(
              "dataFetched",
              widget.name,
              p,
              this._dataStore[p].current,
              this._dataStore[p].history
            );
          }
        }
        if (!widget) {
          topic.publish("noData", undefined, undefined);
        }
      }
    },

    onClearAllData: function() {
      this._dataStore = {};
      topic.publish("allDataCleared");
    },

    onRemoveData: function(id) {
      delete this._dataStore[id];
      topic.publish("dataRemoved", id);
    },

    onClearDataHistory: function(id) {
      if (this._dataStore[id]) {
        this._dataStore[id].history = [];
      }
      topic.publish("dataHistoryCleared", id);
    }
  });

  clazz.getInstance = function(widgetManager) {
    if (instance === null) {
      instance = new clazz(widgetManager);
    }
    return instance;
  };

  return clazz;
});
