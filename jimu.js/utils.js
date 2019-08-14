define([
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "dojo/_base/config",
  "dojo/on",
  "dojo/number",
  "dojo/Deferred",
  "jimu/ConfigManager"
], function(
  lang,
  html,
  array,
  config,
  on,
  dojoNumber,
  Deferred,
  ConfigManager
) {
  var mo = {};

  var widgetProperties = [
    "inPanel",
    "hasLocale",
    "hasStyle",
    "hasConfig",
    "hasUIFile",
    "hasSettingPage",
    "hasSettingUIFile",
    "hasSettingLocale",
    "hasSettingStyle",
    "keepConfigAfterMapSwitched",
    "isController",
    "hasVersionManager",
    "isThemeWidget",
    "supportMultiInstance"
  ];

  mo.getPositionStyle = function(_position) {
    var style = {};
    if (!_position) {
      return style;
    }
    var position = lang.clone(_position);

    var ps = [
      "left",
      "top",
      "right",
      "bottom",
      "width",
      "height",
      "padding",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom"
    ];
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (typeof position[p] === "number") {
        style[p] = position[p] + "px";
      } else if (typeof position[p] !== "undefined") {
        style[p] = position[p];
      } else {
        if (p.substr(0, 7) === "padding") {
          style[p] = 0;
        } else {
          style[p] = "auto";
        }
      }
    }

    if (typeof position.zIndex === "undefined") {
      //set zIndex=auto instead of 0, because inner dom of widget may need to overlay other widget
      //that has the same zIndex.
      style.zIndex = "auto";
    } else {
      style.zIndex = position.zIndex;
    }
    return style;
  };

  mo.processUrlInAppConfig = function(url) {
    if (!url) {
      return;
    }
    if (url.startWith("data:") || url.startWith("http") || url.startWith("/")) {
      return url;
    } else {
      return window.path + url;
    }
  };

  //if no beforeId, append to head tag, or insert before the id
  mo.loadStyleLink = function(id, href, beforeId) {
    var def = new Deferred(),
      styleNode,
      styleLinkNode;

    var hrefPath = require(mo.getRequireConfig()).toUrl(href);
    //the cache will use the baseUrl + module as the key
    if (require.cache["url:" + hrefPath]) {
      //when load css file into index.html as <style>, we need to fix the
      //relative path used in css file
      var cssStr = require.cache["url:" + hrefPath];
      var fileName = hrefPath.split("/").pop();
      var rPath = hrefPath.substr(0, hrefPath.length - fileName.length);
      cssStr = addRelativePathInCss(cssStr, rPath);
      if (beforeId) {
        styleNode = html.create(
          "style",
          {
            id: id,
            type: "text/css"
          },
          html.byId(beforeId),
          "before"
        );
      } else {
        styleNode = html.create(
          "style",
          {
            id: id,
            type: "text/css"
          },
          document.getElementsByTagName("head")[0]
        );
      }

      if (styleNode.styleSheet && !styleNode.sheet) {
        //for IE
        styleNode.styleSheet.cssText = cssStr;
      } else {
        styleNode.appendChild(html.toDom(cssStr));
      }
      def.resolve("load");
      return def;
    }

    if (beforeId) {
      styleLinkNode = html.create(
        "link",
        {
          id: id,
          rel: "stylesheet",
          type: "text/css",
          href: hrefPath
        },
        html.byId(beforeId),
        "before"
      );
    } else {
      styleLinkNode = html.create(
        "link",
        {
          id: id,
          rel: "stylesheet",
          type: "text/css",
          href: hrefPath
        },
        document.getElementsByTagName("head")[0]
      );
    }

    // def.resolve("load");
    on(styleLinkNode, "load", function() {
      def.resolve("load");
    });

    //for the browser which doesn't fire load event
    //safari update documents.stylesheets when style is loaded.
    var ti = setInterval(function() {
      var loadedSheet;
      if (
        array.some(document.styleSheets, function(styleSheet) {
          if (
            styleSheet.href &&
            styleSheet.href.substr(
              styleSheet.href.indexOf(href),
              styleSheet.href.length
            ) === href
          ) {
            loadedSheet = styleSheet;
            return true;
          }
        })
      ) {
        try {
          if (
            !def.isFulfilled() &&
            ((loadedSheet.cssRules && loadedSheet.cssRules.length) ||
              (loadedSheet.rules && loadedSheet.rules.length))
          ) {
            def.resolve("load");
          }
          clearInterval(ti);
        } catch (err) {
          //In FF, we can"t access .cssRules before style sheet is loaded,
          //but FF will emit load event. So, we catch this error and do nothing,
          //just wait for FF to emit load event and go on.
        }
      }
    }, 50);
    return def;
  };

  function addRelativePathInCss(css, rpath) {
    var m = css.match(/url\([^)]+\)/gi),
      i,
      m2;

    if (m === null || rpath === "") {
      return css;
    }
    for (i = 0; i < m.length; i++) {
      m2 = m[i].match(/(url\(["|"]?)(.*)((?:["|"]?)\))/i);
      if (m2.length >= 4) {
        var path = m2[2];
        if (!rpath.endWith("/")) {
          rpath = rpath + "/";
        }
        css = css.replace(m2[1] + path + m2[3], m2[1] + rpath + path + m2[3]);
      }
    }
    return css;
  }

  mo.getRequireConfig = function() {
    /* global jimuConfig */
    if (jimuConfig) {
      var packages = [];
      if (jimuConfig.widgetsPackage) {
        packages = packages.concat(jimuConfig.widgetsPackage);
      }
      if (jimuConfig.themesPackage) {
        packages = packages.concat(jimuConfig.themesPackage);
      }
      if (jimuConfig.configsPackage) {
        packages = packages.concat(jimuConfig.configsPackage);
      }
      return {
        packages: packages
      };
    } else {
      return {};
    }
  };

  /////////////widget and theme manifest processing/////////
  mo.widgetJson = (function() {
    var ret = {};

    ret.addManifest2WidgetJson = function(widgetJson, manifest) {
      lang.mixin(widgetJson, manifest.properties);
      widgetJson.name = manifest.name;
      // if(!widgetJson.label){
      //   widgetJson.label = manifest.label;
      // }
      widgetJson.label = manifest.label;
      widgetJson.manifest = manifest;
      widgetJson.isRemote = manifest.isRemote;
      if (widgetJson.isRemote) {
        widgetJson.itemId = manifest.itemId;
      }
      if (manifest.featureActions) {
        widgetJson.featureActions = manifest.featureActions;
      }

      if (!widgetJson.icon) {
        widgetJson.icon = manifest.icon;
      }

      if (!widgetJson.thumbnail) {
        widgetJson.thumbnail = manifest.thumbnail;
      }

      widgetJson.folderUrl = manifest.folderUrl;
      widgetJson.amdFolder = manifest.amdFolder;
    };

    ret.removeManifestFromWidgetJson = function(widgetJson) {
      //we set property to undefined, instead of delete them.
      //The reason is: configmanager can"t hanle delete properties for now
      if (!widgetJson.manifest) {
        return;
      }
      for (var p in widgetJson.manifest.properties) {
        widgetJson[p] = undefined;
      }
      widgetJson.name = undefined;
      widgetJson.label = undefined;
      widgetJson.featureActions = undefined;
      widgetJson.manifest = undefined;
    };
    return ret;
  })();

  mo.manifest = (function() {
    var ret = {};

    function addThemeManifestProperties(manifest) {
      manifest.panels.forEach(function(panel) {
        panel.uri = "panels/" + panel.name + "/Panel.js";
      });

      manifest.styles.forEach(function(style) {
        style.uri = "styles/" + style.name + "/style.css";
      });

      manifest.layouts.forEach(function(layout) {
        layout.uri = "layouts/" + layout.name + "/config.json";
        layout.icon = "layouts/" + layout.name + "/icon.png";
        layout.RTLIcon = "layouts/" + layout.name + "/icon_rtl.png";
      });
    }

    function addWidgetManifestProperties(manifest) {
      //because tingo db engine doesn"t support 2D, 3D property, so, change here
      if (typeof manifest["2D"] !== "undefined") {
        manifest.support2D = manifest["2D"];
      }
      if (typeof manifest["3D"] !== "undefined") {
        manifest.support3D = manifest["3D"];
      }

      if (
        typeof manifest["2D"] === "undefined" &&
        typeof manifest["3D"] === "undefined"
      ) {
        manifest.support2D = true;
      }

      delete manifest["2D"];
      delete manifest["3D"];

      if (typeof manifest.properties === "undefined") {
        manifest.properties = {};
      }

      if (typeof manifest.properties.isController === "undefined") {
        manifest.properties.isController = false;
      }
      if (typeof manifest.properties.isThemeWidget === "undefined") {
        manifest.properties.isThemeWidget = false;
      }
      if (typeof manifest.properties.hasVersionManager === "undefined") {
        manifest.properties.hasVersionManager = false;
      }

      widgetProperties.forEach(function(p) {
        if (typeof manifest.properties[p] === "undefined") {
          manifest.properties[p] = true;
        }
      });
    }

    ret.addManifestProperties = function(manifest) {
      if (!manifest.icon) {
        manifest.icon =
          manifest.folderUrl + "images/icon.png?wab_dv=" + window.deployVersion;
      }

      if (!manifest.thumbnail) {
        manifest.thumbnail = manifest.folderUrl + "images/thumbnail.png";
      }

      if (manifest.category === "theme") {
        addThemeManifestProperties(manifest);
      } else {
        addWidgetManifestProperties(manifest);
      }
    };

    ret.processManifestLabel = function(manifest, locale) {
      var langCode = locale.split("-")[0];
      manifest.label =
        (manifest.i18nLabels &&
          (manifest.i18nLabels[locale] ||
            manifest.i18nLabels[langCode] ||
            manifest.i18nLabels.defaultLabel)) ||
        manifest.label ||
        manifest.name;
      if (manifest.layouts) {
        array.forEach(manifest.layouts, function(layout) {
          var key = "i18nLabels_layout_" + layout.name;
          layout.label =
            (manifest[key] &&
              (manifest[key][locale] || manifest[key].defaultLabel)) ||
            layout.label ||
            layout.name;
        });
      }
      if (manifest.styles) {
        array.forEach(manifest.styles, function(_style) {
          var key = "i18nLabels_style_" + _style.name;
          _style.label =
            (manifest[key] &&
              (manifest[key][locale] || manifest[key].defaultLabel)) ||
            _style.label ||
            _style.name;
        });
      }
    };

    ret.addI18NLabel = function(manifest) {
      var def = new Deferred();
      if (manifest.i18nLabels) {
        def.resolve(manifest);
        return def;
      }
      manifest.i18nLabels = {};

      if (manifest.properties && manifest.properties.hasLocale === false) {
        def.resolve(manifest);
        return def;
      }

      //theme or widget label
      var nlsFile;
      if (manifest.isRemote) {
        nlsFile = manifest.amdFolder + "nls/strings.js";
      } else {
        nlsFile = manifest.amdFolder + "nls/strings";
      }
      require(["dojo/i18n!" + nlsFile], function(localeStrings) {
        var localesStrings = {};
        localesStrings[window.dojoConfig.locale] = localeStrings;
        addI18NLabelToManifest(manifest, null, localesStrings);
        def.resolve(manifest);
      });

      return def;
    };
    return ret;
  })();

  mo.getUriInfo = function(uri) {
    var pos,
      firstSeg,
      info = {},
      amdFolder;

    pos = uri.indexOf("/");
    firstSeg = uri.substring(0, pos);

    //config using package
    amdFolder = uri.substring(0, uri.lastIndexOf("/") + 1);
    info.folderUrl = window.path + amdFolder;
    info.amdFolder = amdFolder;

    info.url = info.folderUrl; //for backward compatibility

    if (/^http(s)?:\/\//.test(uri) || /^\/\//.test(uri)) {
      info.isRemote = true;
    }

    return info;
  };

  /*
   *Optional
   *An object with the following properties:
   *pattern (String, optional):
   *override formatting pattern with this string. Default value is based on locale.
   Overriding this property will defeat localization. Literal characters in patterns
   are not supported.
   *type (String, optional):
   *choose a format type based on the locale from the following: decimal, scientific
   (not yet supported), percent, currency. decimal by default.
   *places (Number, optional):
   *fixed number of decimal places to show. This overrides any information in the provided pattern.
   *round (Number, optional):
   *5 rounds to nearest .5; 0 rounds to nearest whole (default). -1 means do not round.
   *locale (String, optional):
   *override the locale used to determine formatting rules
   *fractional (Boolean, optional):
   *If false, show no decimal places, overriding places and pattern settings.
   */
  mo.localizeNumber = function(num, options) {
    var decimalStr = num.toString().split(".")[1] || "",
      decimalLen = decimalStr.length;
    var _pattern = "";
    var places = options && isFinite(options.places) && options.places;
    if (places > 0 || decimalLen > 0) {
      var patchStr = Array.prototype.join.call(
        {
          length: places > 0 ? places + 1 : decimalLen
        },
        "0"
      );
      _pattern = "#,###,###,##0.0" + patchStr;
    } else {
      _pattern = "#,###,###,##0";
    }

    var _options = {
      locale: config.locale,
      pattern: _pattern
    };
    lang.mixin(_options, options || {});

    try {
      return dojoNumber.format(num, _options);
    } catch (err) {
      console.error(err);
      return num.toLocaleString();
    }
  };

  /*
  *n: Number
  *fieldInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
  */
  mo.localizeNumberByFieldInfo = function(n, fieldInfo) {
    var fn = null;
    var p = lang.exists("format.places", fieldInfo) && fieldInfo.format.places;
    fn = mo.localizeNumber(n, {
      places: p
    });

    if (
      lang.exists("format.digitSeparator", fieldInfo) &&
      !fieldInfo.format.digitSeparator
    ) {
      return fn.toString().replace(new RegExp("\\" + nlsBundle.group, "g"), "");
    } else {
      return fn;
    }
  };

  mo.geometryUtils = (function() {
    var ret = {};

    function rad(d) {
      return d * Math.PI / 180.0;
    }

    var EARTH_RADIUS = 6378.137;

    ret.getDistance = function(lat1, lng1, lat2, lng2) {
      var radLat1 = rad(lat1);
      var radLat2 = rad(lat2);
      var a = radLat1 - radLat2;
      var b = rad(lng1) - rad(lng2);
      var s =
        2 *
        Math.asin(
          Math.sqrt(
            Math.pow(Math.sin(a / 2), 2) +
              Math.cos(radLat1) *
                Math.cos(radLat2) *
                Math.pow(Math.sin(b / 2), 2)
          )
        );
      s = s * EARTH_RADIUS;
      s = Math.round(s * 10000) / 10000;
      return s;
    };

    ret.isMarkerInsidePolygon = function(marker, poly) {
      var inside = false;
      var x = marker.getLatLng().lat,
        y = marker.getLatLng().lng;
      for (var ii = 0; ii < poly.getLatLngs().length; ii++) {
        var polyPoints = poly.getLatLngs()[ii];
        for (
          var i = 0, j = polyPoints.length - 1;
          i < polyPoints.length;
          j = i++
        ) {
          var xi = polyPoints[i].lat,
            yi = polyPoints[i].lng;
          var xj = polyPoints[j].lat,
            yj = polyPoints[j].lng;

          var intersect =
            yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
      }

      return inside;
    };

    //将点位坐标转到地图坐标
    mo.coordTransform = function(x, y, inverse = false, coordinateSystem = "WGS84") {

      var mapCoordSystem = ConfigManager.getInstance().appConfig.map
        .coordinateSystem;
      //坐标系相同不用转换
      if (mapCoordSystem === coordinateSystem) {
        return [x, y];
      }

      //gcj02 <-> wgs84
      if (mapCoordSystem === "GCJ02" && coordinateSystem === "WGS84") {
        //wgs84 -> gcj02
        if (!inverse) {
          return coordtransform.wgs84togcj02(x, y);
        }
        //gcj02 -> wgs84
        else {
          return coordtransform.gcj02towgs84(x, y);
        }
      }
      //gcj02 <-> bd09
      else if (mapCoordSystem === "GCJ02" && coordinateSystem === "BD09") {
        //bd09 -> gcj02
        if (!inverse) {
          return coordtransform.bd09togcj02(x, y);
        }
        //gcj02 -> bd09
        else {
          return coordtransform.gcj02tobd09(x, y);
        }
      }
      //bd09 <-> wgs84
      else if (mapCoordSystem === "BD09" && coordinateSystem === "WGS84") {
        //wgs84 -> bd09
        if (!inverse) {
          var result = coordtransform.wgs84togcj02(x, y);
          return coordtransform.gcj02tobd09(result[0], result[1]);
        }
        //bd09 -> wgs94
        else {
          result = coordtransform.bd09togcj02(x, y);
          return coordtransform.gcj02towgs84(result[0], result[1]);
        }
      }
    };

    return ret;
  })();

  return mo;
});
