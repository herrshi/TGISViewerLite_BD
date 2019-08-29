define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "jimu/BaseWidget"
], function(declare, lang, topic, BaseWidget) {
  return declare([BaseWidget], {
    postCreate: function() {
      this.inherited(arguments);

      topic.subscribe(
        "mixinSearch",
        lang.hitch(this, this.onTopicHandler_mixinSearch)
      );
    },

    onTopicHandler_mixinSearch: function() {}
  });
});
