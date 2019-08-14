/**
 * Created by herrshi on 2017/6/16.
 */
(function(global) {
  /**
   * global function used to load css and js files
   * @param {[string]} resources 要加载的资源url
   * @param {function} onOneBeginLoad 单个url加载前要调用的函数
   * @param {function} onOneAfterLoad 单个url加载完以后要调用的函数
   * @param {function} onAfterLoad 所有url加载完以后要调用的函数
   * */
  function loadResources(
    resources,
    onOneBeginLoad,
    onOneAfterLoad,
    onAfterLoad
  ) {
    var loaded = [];

    function _onOneAfterLoad(url) {
      //避免同一个资源多次加载
      if (checkHaveLoaded(url)) {
        return;
      }
      loaded.push(url);
      if (onOneAfterLoad) {
        onOneAfterLoad(url, loaded.length);
      }
      if (loaded.length === resources.length) {
        if (onAfterLoad) {
          onAfterLoad();
        }
      } else {
        loadResource(resources[loaded.length], onOneBeginLoad, _onOneAfterLoad)
      }
    }

    // for (var i = 0; i < resources.length; i++) {
    //   loadResource(resources[i], onOneBeginLoad, _onOneAfterLoad);
    // }
    loadResource(resources[0], onOneBeginLoad, _onOneAfterLoad);

    function checkHaveLoaded(url) {
      for (var i = 0; i < loaded.length; i++) {
        if (loaded[i] === url) {
          return true;
        }
      }
      return false;
    }
  }

  /**获取url里的文件类型*/
  function getExtension(url) {
    url = url || "";
    var items = url.split("?")[0].split(".");
    return items[items.length - 1].toLowerCase();
  }

  /**加载单个url*/
  function loadResource(url, onBeginLoad, onAfterLoad) {
    if (onBeginLoad) {
      onBeginLoad(url);
    }

    var type = getExtension(url);
    if (type.toLowerCase() === "css") {
      loadCss(url);
    } else {
      loadJs(url);
    }

    function createElement(config) {
      var e = document.createElement(config.element);
      for (var i in config) {
        if (i !== "element" && i !== "appendTo") {
          e[i] = config[i];
        }
      }
      var root = document.getElementsByTagName(config.appendTo)[0];
      return typeof root.appendChild(e) === "object";
    }

    function loadCss(url) {
      var result = createElement({
        element: "link",
        rel: "stylesheet",
        type: "text/css",
        href: url,
        onload: function() {
          elementLoaded(url);
        },
        appendTo: "head"
      });

      //for the browser which doesn't fire load event
      //safari update documents.stylesheets when style is loaded.
      var ti = setInterval(function() {
        var styles = document.styleSheets;
        for (var i = 0; i < styles.length; i++) {
          // console.log(styles[i].href);
          if (
            styles[i].href &&
            styles[i].href.substr(
              styles[i].href.indexOf(url),
              styles[i].href.length
            ) === url
          ) {
            clearInterval(ti);
            elementLoaded(url);
          }
        }
      }, 500);

      return result;
    }

    function loadJs(url) {
      return createElement({
        element: "script",
        type: "text/javascript",
        onload: function() {
          elementLoaded(url);
        },
        onreadystatechange: function() {
          elementReadyStateChanged(url, this);
        },
        src: url,
        appendTo: "body"
      });
    }

    function elementLoaded(url) {
      if (onAfterLoad) {
        onAfterLoad(url);
      }
    }

    function elementReadyStateChanged(url, thisObj) {
      if (
        thisObj.readyState === "loaded" ||
        thisObj.readyState === "complete"
      ) {
        elementLoaded(url);
      }
    }
  }

  /***********
   testLoad({
    test: window.console,
    success
  })
   ************/
  function testLoad(testObj) {
    testObj.success = !!testObj.success
      ? isArray(testObj.success) ? testObj.success : [testObj.success]
      : [];
    testObj.failure = !!testObj.failure
      ? isArray(testObj.failure) ? testObj.failure : [testObj.failure]
      : [];

    if (testObj.test && testObj.success.length > 0) {
      loadResources(testObj.success, null, null, testObj.callback);
    } else if (!testObj.test && testObj.failure.length > 0) {
      loadResources(testObj.failure, null, null, testObj.callback);
    } else {
      testObj.callback();
    }
  }

  function is(type, obj) {
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  }

  function isArray(item) {
    return is("Array", item);
  }

  global.loadResources = loadResources;
  global.loadResource = loadResource;
  global.testLoad = testLoad;
})(window);
