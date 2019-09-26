var //TGISViewer所在的url
  path = null;
//项目配置文件
projectConfig = null;
//全部加载完成以后的回调
loadFinishCallback = null;

var TMap = {
  createNew: function(options, divId, callback) {
    window.path = addSlash(options.viewerUrl);
    window.projectConfig = options.config;
    window.loadFinishCallback = callback;

    // var loaderScript = document.createElement("script");
    // loaderScript.setAttribute("type", "text/javascript");
    // loaderScript.setAttribute("src", path + "simpleLoader.js");
    // document.body.appendChild(loaderScript);

    var initScript = document.createElement("script");
    initScript.setAttribute("type", "text/javascript");
    initScript.setAttribute("src", path + "init.js");
    document.body.appendChild(initScript);

    var mainPageDiv = document.createElement("div");
    mainPageDiv.id = "main-page";
    mainPageDiv.style.width = "100%";
    mainPageDiv.style.height = "100%";
    mainPageDiv.style.position = "relative";
    document.getElementById(divId).appendChild(mainPageDiv);

    var layoutManagerDiv = document.createElement("div");
    layoutManagerDiv.id = "jimu-layout-manager";
    layoutManagerDiv.style.width = "100%";
    layoutManagerDiv.style.height = "100%";
    layoutManagerDiv.style.position = "absolute";
    mainPageDiv.appendChild(layoutManagerDiv);

    return TMap;

    function addSlash(url) {
      if (url.substr(url.length - 1, url.length) !== "/") {
        url += "/";
      }
      return url;
    }
  },

  /************************ Overlay BEGIN **************************/
  /**
   * 在地图上添加点覆盖物
   * symbol: 点覆盖物的图标样式
   *   url: string, required. 图标的绝对地址.
   *   width: number, optional. 图标宽度.
   *          单位为px.
   *   height: number, optional. 图标高度.
   *           单位为px.
   *   xoffset: number, optional. 图标在横轴上的偏移量, >0图标往左偏移, <0图标往右偏移, 原点为图标左上角.
   *            单位为px.
   *   yoffset: number, optional. 图标在纵轴上的偏移量, >0往上偏移, <0往下偏移, 原点为图标左上角.
   *            单位为px.
   *   angle: number, optional. 旋转角度
   * @param params: string, json字符串
   *   defaultSymbol: optional, 默认样式.
   *   defaultVisible: option, 默认是否显示. 默认为true.
   *   coordinateSystem: optional, 点位坐标系, "WGS84" | "GCJ02" | "BD09"
   *     默认和底图一致
   *   points: [{}], required.
   *     id: string, required. 编号
   *     type: string, optional. 类型
   *     visible: boolean, optional. 是否显示. 默认为true.
   *     fields: {}, optional. 属性
   *       点击以后在弹出框中显示fields中的键值对
   *     content: string, optional. html, 自定义的弹出框内容. 使用以后会覆盖fields.
   *     geometry: object, required. 几何属性.
   *       x: x坐标
   *       y: y坐标
   *     symbol: object, optional. 样式.
   *       会覆盖defaultSymbol.
   *       若defaultSymbol和symbol都没有定义, 则使用箭头图标
   * @sample
   *   添加三个点, 其中两个使用images/RedSphere.png, 另一个使用images/BlueSphere.png
   *     map.addPoints('{"defaultSymbol":{"url":"images/RedSphere.png","xoffset":32,"yoffset":32},"points":[{"id":"pt001","type":"police","geometry":{"x":103.8535,"y":36.0342},"symbol":{"url":"images/BlueSphere.png","xoffset":32,"yoffset":32}},{"id":"pt002","type":"police","geometry":{"x":103.8431,"y":36.053}},{"id":"pt003","type":"police","geometry":{"x":103.8541,"y":36.05}}]}');
   * */
  addPoints: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "string") {
        params = JSON.parse(params);
      }
      topic.publish("addPoints", params);
    });
  },

  /**
   * 删除指定点覆盖物
   * @param params: string, json字符串
   *   types: [string], optional, 要删除的类型
   *   ids: [string], optional, 要删除的id
   * @sample
   *   删除所有类型为"police"的覆盖物
   *     map.deletePoints('{"types":["police"]}');
   *   删除类型为"car"，且id是"沪A11111", "沪A22222"的覆盖物
   *     map.deletePoints('{types: ["car"], ids: ["沪A11111", "沪A22222"]}');
   * */
  deletePoints: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("deletePoints", params);
    });
  },

  /**删除所有点覆盖物*/
  deleteAllPoints: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteAllPoints");
    });
  },

  /**
   * 显示指定覆盖物
   * 参数同deletePoints
   * */
  showPoints: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("showPoints", params);
    });
  },

  /**
   * 隐藏指定覆盖物
   * 参数同deletePoints, 但不删除, 只是隐藏
   * */
  hidePoints: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("hidePoints", params);
    });
  },

  /**
   * 在地图上添加线覆盖物
   * symbol: 线覆盖物的样式
   *   color: string, optional. 颜色.
   *     默认为#3388ff
   *   width: number, optional. 线宽
   *     默认为3
   *   alpha: number, optional. 透明度. 0--1, 0: 完全透明, 1: 完全不透明
   *     默认为1
   * @param params: string, json字符串
   *   defaultSymbol: optional, 默认样式.
   *   lines: [{}], required.
   *     id: string, required. 编号
   *     type: string, optional. 类型
   *     fields: {}, optional. 属性
   *       点击以后在弹出框中显示fields中的键值对
   *     content: string, optional. html, 自定义的弹出框内容. 使用以后会覆盖fields.
   *     geometry: object, required. 几何属性.
   *       paths : [
   *         [ [x11, y11], [x12, y12], ..., [x1n, y1n] ],
   *         [ [x21, y21], [x22, y22], ..., [x2n, y2n] ],
   *         ...,
   *         [ [xm1, ym1], [xm2, ym2], ..., [xmn, ymn] ]
   *       ]
   *       一个polyline对象可以包含多段分离的折线，所有paths是一个数组. 一般情况下paths中只会有一个元素, 即一条连续折线.
   *     symbol: object, optional. 样式.
   *       会覆盖defaultSymbol.
   * @sample
   *   map.addLines('{"defaultSymbol":{"color":"#ff0000"},"lines":[{"id":"wx001","type":"GPS","geometry":{"paths":[[[103.8535,36.0342],[103.8431,36.053],[103.8541,36.05]]]},"symbol":{"alpha":0.5, "width":5}}]}');
   * */
  addLines: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("addLines", params);
    });
  },

  /**
   * 删除指定线覆盖物
   * 参数同deletePoints
   * */
  deleteLines: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("deleteLines", params);
    });
  },

  /**删除所有线覆盖物*/
  deleteAllLines: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteAllLines");
    });
  },

  /**
   * 在地图上添加面覆盖物
   * symbol: 面覆盖物的样式
   *   color: string, optional. 颜色.
   *     默认为#3388ff
   *   alpha: number, optional. 透明度. 0--1, 0: 完全透明, 1: 完全不透明
   *     默认为0.5
   *   outline: object, optional
   *     color: string, optional. 颜色.
   *       默认为#3388ff
   *     alpha: number, optional. 透明度. 0--1, 0: 完全透明, 1: 完全不透明
   *       默认为1
   *     width: number, optional.
   *       默认为2
   * @param params: string/object, json
   *   defaultSymbol: optional, 默认样式.
   *   polygons: [{}], required.
   *     id: string, required. 编号
   *     type: string, optional. 类型
   *     fields: {}, optional. 属性
   *       点击以后在弹出框中显示fields中的键值对
   *     content: string, optional. html, 自定义的弹出框内容. 使用以后会覆盖fields.
   *     geometry: object, required. 几何属性.
   *       rings : [
   *         [ [x11, y11], [x12, y12], ..., [x1n, y1n] ],
   *         [ [x21, y21], [x22, y22], ..., [x2n, y2n] ],
   *         ...,
   *         [ [xm1, ym1], [xm2, ym2], ..., [xmn, ymn] ]
   *       ]
   *       一个polyline对象可以包含多段分离的折线，所有paths是一个数组. 一般情况下paths中只会有一个元素, 即一条连续折线.
   *     symbol: object, optional. 样式.
   *       会覆盖defaultSymbol.
   * @sample
   *   map.addPolygons({"polygons":[{"id":"test001","type":"area","geometry":{"type":"polygon","rings":[[[121.47304678111577,31.397380608608263],[121.4835389901274,31.397072524739393],[121.48145492121412,31.389370096185758],[121.4670101677118,31.390787390944077],[121.47304678111577,31.397380608608263]]]}}]});
   * */
  addPolygons: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params === "string") {
        params = JSON.parse(params);
      }
      topic.publish("addPolygons", params);
    });
  },

  /**
   * 删除指定面覆盖物
   * 参数同deletePoints
   * */
  deletePolygons: function({ ids = [], types = [] } = {}) {
    require(["dojo/topic"], function(topic) {
      topic.publish("deletePolygons", { ids, types });
    });
  },

  /**删除所有面覆盖物*/
  deleteAllPolygons: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteAllPolygons");
    });
  },

  /**
   * 在地图上显示聚合点
   * @param params: string/Obj, required.
   *   type: string, required.
   *   points: [], required. 要聚合的点位
   *     id: string.
   *     fields: object.
   *     geometry: object.
   *     symbol: object.
   *   defaultVisible: boolean, optional. 默认为true.
   *   defaultSymbol: {}, optional.
   *   defaultInfoTemplate: object, optional.
   *   coordinateSystem: string. 点位坐标系. 默认为地图坐标系
   *   distance: int, optional. 聚合距离, 默认100.
   *   zoom: int, optional. 显示聚合效果的最大层级. 超过此层级时取消聚合, 显示原始点位. 默认为始终聚合.
   * */
  addOverlaysCluster: function({
    type,
    points,
    defaultVisible = true,
    defaultSymbol = {},
    defaultInfoTemplate = {},
    distance = 100,
    zoom = null,
    coordinateSystem = null
  } = {}) {
    require(["dojo/topic"], function(topic) {
      topic.publish("addOverlaysCluster", {
        type,
        points,
        defaultVisible,
        defaultSymbol,
        defaultInfoTemplate,
        distance,
        zoom,
        coordinateSystem
      });
    });
  },

  /**
   * 删除聚合点
   * @param params: object, optional
   *   types: [string]
   * 不传参数时删除所有聚合点
   * */
  deleteOverlaysCluster: function(params) {
    if (typeof params === "string") {
      params = JSON.parse(params);
    }
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteOverlaysCluster", params);
    });
  },

  /**
   * 显示聚合点
   * @param params: object, optional
   *   types: [string]
   * 不传参数时显示所有聚合点
   * */
  showOverlaysCluster: function(params) {
    if (typeof params === "string") {
      params = JSON.parse(params);
    }
    require(["dojo/topic"], function(topic) {
      topic.publish("showOverlaysCluster", params);
    });
  },

  /**
   * 隐藏聚合点
   * @param params: object, optional
   *   types: [string]
   * 不传参数时隐藏所有聚合点
   * */
  hideOverlaysCluster: function(params) {
    if (typeof params === "string") {
      params = JSON.parse(params);
    }
    require(["dojo/topic"], function(topic) {
      topic.publish("hideOverlaysCluster", params);
    });
  },

  /**
   * 开始绘制
   * @param params: string, json字符串
   *   type: string, required. 绘制类型
   *     "point" || "line" || "polygon" || "circle" || "rectangle"
   *   showMeasure: boolean, optional. 画线时显示长度, 面显示周长、面积
   *     默认false
   *   continuousDraw: boolean, optional. 画完一个要素时不结束绘制, 继续画下一个
   *     默认false
   *   clearRepeat: boolean, optional. 连续绘制时, 画下一个时清除上一个要素, 只保留一个要素
   *     默认false
   * @param callback: function, 回传坐标的回调函数
   * */
  startDraw: function(params, callback) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("startDraw", { params: params, callback: callback });
    });
  },
  /**
   * 不打开DrawWidget, 直接在地图上绘制覆盖物
   * @param params: object, required.
   *   drawType: string, required. 绘制类型
   * @param callback: function, optional.
   * */
  startDrawOverlay: function(params, callback) {
    require(["dojo/topic"], function(topic) {
      topic.publish("startDraw", {
        params: JSON.stringify({ type: params.drawType, clearRepeat: true }),
        callback: callback
      });
    });
  },
  /**停止绘制*/
  stopDraw: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("stopDraw");
    });
  },

  /**清除绘制内容*/
  clearDraw: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("clearDraw");
    });
  },
  /************************ Overlay END **************************/

  /************************ UI BEGIN **************************/
  /**显示顶部工具栏*/
  showTopToolbar: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("showTopToolbar");
    });
  },

  /**隐藏顶部工具栏*/
  hideTopToolbar: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("hideTopToolbar");
    });
  },

  /**显示底部工具栏*/
  showBottomToolbar: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("showBottomToolbar");
    });
  },

  /**隐藏底部工具栏*/
  hideBottomToolbar: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("hideBottomToolbar");
    });
  },
  showBottomToolbarButton: function(param) {
    require(["dojo/topic"], function(topic) {
      topic.publish("showBottomToolbarButton", param);
    });
  },
  hideBottomToolbarButton: function(param) {
    require(["dojo/topic"], function(topic) {
      topic.publish("hideBottomToolbarButton", param);
    });
  },
  /************************ UI END **************************/

  /************************ Search BEGIN **************************/
  /**
   * 根据id查找要素
   * @param params: json object/json string
   *   id: string, required.
   *   type: string, optional.
   *   zoom: number, optional.
   * */
  findFeature: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "string") {
        params = JSON.parse(params);
      }
      topic.publish("findFeature", params);
    });
  },

  /**
   * 图形搜索
   * 对用户绘制的图层进行搜索
   * @param params: object
   *   geoType: string, required. 图形类型
   *     point(点, 需配合radius参数) | cycle(圆形) | rectangle(矩形) | polygon(多边形)
   *   radius: number, optional. 搜索半径
   *     default: 0, 不进行缓冲
   *   showBuffer: boolean, radius可用时, 是否显示搜索缓冲区
   *     default: true
   *   showResult: boolean, optional. 是否显示搜索结果
   *     default: true
   *   contents: [object], 搜索内容
   *     class: string, "poi" | "overlay" | "fbd"
   *     types: string, 不指定时搜索此类型下所有要素
   *   sort: string, optional. "asc" | "desc"
   *     当geometry为点时，搜索结果将按去中心点距离排序。默认为升序。
   * @param callback: function
   * */
  geometrySearch: function(
    {
      geoType,
      radius = 0,
      showBuffer = true,
      showResult = true,
      contents,
      sort = "asc"
    } = {},
    callback
  ) {
    require(["dojo/topic"], function(topic) {
      topic.publish("geometrySearch", {
        params: {
          geoType,
          radius,
          showBuffer,
          showResult,
          contents,
          sort
        },
        callback
      });
    });
  },

  stopGeometrySearch: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("stopGeometrySearch");
    });
  },

  /***
   * 图形搜索
   * 对用户输入的图形进行搜索
   * @param params: object, required.
   *   geometry: object, required. 搜索中心, 可以为点、线、面
   *     点：
   *       {"x" : -118.15, "y" : 33.80, "spatialReference" : {"wkid" : 4326}}
   *     线：
   *       {
   *         "paths" : [[[-97.06138,32.837],[-97.06133,32.836],[-97.06124,32.834],[-97.06127,32.832]],
   *                    [[-97.06326,32.759],[-97.06298,32.755]]],
   *         "spatialReference" : {"wkid" : 4326}
   *       }
   *     面：
   *       {
   *         "rings" : [[[-97.06138,32.837],[-97.06133,32.836],[-97.06124,32.834],[-97.06127,32.832],
   *                    [-97.06138,32.837]],[[-97.06326,32.759],[-97.06298,32.755],[-97.06153,32.749],
   *                    [-97.06326,32.759]]],
   *         "spatialReference" : {"wkid" : 4326}
   *       }
   *   radius: number, 搜索半径
   *     default: 0, 不进行缓冲
   *   showGeometry: boolean, 是否显示原始geometry
   *     default: true
   *   showBuffer: boolean, radius可用时, 是否显示搜索缓冲区
   *     default: true
   *   showResult: boolean, optional. 是否显示搜索结果
   *     default: true
   *   contents: [object], 搜索内容
   *     class: string, "poi" | "overlay" | "fbd"
   *     types: string, 不指定时搜索此类型下所有要素
   *   sort: string, optional. "asc" | "desc"
   *     当geometry为点时，搜索结果将按去中心点距离排序。默认为升序。
   * @param callback: function, required.
   *   回调函数
   *   可使用promise或回调函数获取返回结果
   * @example
   *
   {
    center: [121.441, 31.159],
    radius: 500,
    showResult: true,
    contents: [
      {
        class: "poi",
        types: "路口名,道路名"
      },
      {
        class: "overlay",
        types: "police"
      },
      {
        class: "fbd"
        types: "城市道路,快速路"
      }
    ]
   }
   *
   * @callback: 回调函数返回
   {
      results: [
        {
          class: "poi",
          result: [
	        id: "B0FFGQ9Q9Y",
            name: "天目中路",
            location: [121.455896, 31.247646]
            type: "地名地址信息;交通地名;道路名"
          ]
        },
	      {
	        class: "fbd",
	        result: [
	          {
		          id: "21252416912",
		          name: "武康路(华山路->安福路)",
		          location: [121.44019983601686, 31.213175770283573],
		          type: "地面道路"
		        },
		        {
		          id: "61191954001",
		          name: "外圈吴中路下匝道至吴中路上匝道",
		          location: [121.42395568881847, 31.185519213177798],
		          type: "快速路"
		        }
	        ]
	      },
	      {
	        class: "overlay",
	        result: [
	          {
		          id: "",
		          name: "",
		          location: [],
		          type: "police"
		        }
	        ]
	      }
      ]
    }
   */
  mixinSearch: function(
    {
      geometry,
      radius = 0,
      showGeometry = true,
      showBuffer = true,
      showResult = true,
      contents,
      sort = undefined
    } = {},
    callback
  ) {
    require(["dojo/topic"], function(topic) {
      topic.publish("mixinSearch", {
        params: {
          geometry,
          radius,
          showGeometry,
          showBuffer,
          showResult,
          contents,
          sort
        },
        callback
      });
    });
  },

  clearMixinSearch: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("clearMixinSearch");
    });
  },
  /************************ Search END **************************/

  /************************ Utils END **************************/
  /**
   * 显示OD数据
   * @param params: string, json字符串
   *   type: string, required. 类型, "O" || "D".
   *   startID: string, optional. O分析时为O点ID, D分析时为D点ID.
   *   startPoint: object, optional. 不传ID时使用坐标定位.
   *     x: number, required.
   *     y: number, required.
   *   endFlows: [object]. required. O分析时为D点数据, D分析时为O点数据.
   *     ID: string, optional. O分析时为D点ID, D分析时为O点ID.
   *     point: object, optional. 不传ID时使用坐标定位.
   *     x: number, required.
   *     y: number, required.
   *     flow: number, required. O分析时为D点流量, D分析时为O点流量
   * */
  addOD: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("addOD", params);
    });
  },

  /**清除OD数据*/
  deleteOD: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteOD");
    });
  },

  /**
   * 开始轨迹回放
   * @param params: string, required.
   *   trackPoints: [object], required. 轨迹点列表.
   *     id: string, required. 轨迹点id.
   *     x: number, required. x坐标.
   *     y: number, required. y坐标.
   *     isHighlight: boolean, optional. 是否需要高亮显示此轨迹点.
   *     fields: object, optional. 业务属性. 点击以后会在弹出框中显示
   *   autoStart: boolean, optional. 是否在添加数据以后自动开始回放. 默认为true.
   *   loop: boolean, optional. 是否循环播放. 默认为true.
   *   showTrackPoints: boolean, optional. 是否显示轨迹点. 默认为true.
   * @sample
   *   {"trackPoints":[{"x": 104.023, "y": 30.577, "isHighlight": true, "fields": {"经过时间": "2017/11/24 08:00:00","编号":"","位置描述":"","路口路段":"","辖区名称":"","车牌号":""}}, {"x": 104.002, "y": 30.565, "fields":{"经过时间": "2017/11/24 08:00:05"}}, {"x": 103.969, "y": 30.56, "fields":{"经过时间": "2017/11/24 08:00:10"}}, {"x": 103.907, "y": 30.536, "fields":{"经过时间": "2017/11/24 08:00:15"}}], "autoStart": true, "loop": true, "showTrackPoints": true}
   * */
  startTrackPlayback: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("startTrackPlayback", params);
    });
  },

  /**停止轨迹回放, 并清除轨迹*/
  stopTrackPlayback: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("stopTrackPlayback");
    });
  },
  /************************ Utils END **************************/

  /************************ Utils BEGIN **************************/
  hideTopToolbarButton: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("hideTopToolbarButton", params);
    });
  },
  hideLayer: function(params) {
    require(["dojo/topic", "dojo/_base/lang"], function(topic, lang) {
      lang.mixin(params, { visible: false });
      topic.publish("setLayerVisibility", params);
    });
  },
  showLayer: function(params) {
    require(["dojo/topic", "dojo/_base/lang"], function(topic, lang) {
      lang.mixin(params, { visible: true });
      topic.publish("setLayerVisibility", params);
    });
  },
  /************************ Utils END **************************/

  /**
   * 添加热力图
   * @param params: object, required.
   *   points: [object]
   *     fields: object, optional. 业务属性.
   *       存放权重值和弹框内容
   *     geometry: object, required. 几何属性.
   *       x: x坐标
   *       y: y坐标
   *   options: object, optional. 热力图样式相关配置
   *     radius: number, optional. 每个点的扩散半径.
   *       默认为25像素
   *     colors: [string], optional. 渐变色带，至少需要两个颜色.
   *       默认黄->红渐变
   *       ["rgba(0, 0, 255, 0)","rgb(0, 0, 255)","rgb(255, 0, 255)", "rgb(255, 0, 0)"]
   *     field: string, optional. 权重字段.
   *       默认为null, 不带权重
   *     maxValue: number, optional. 在颜色渐变中分配最终颜色的像素强度值, 高于此数字的值也将分配渐变色的最终色
   *       默认为1
   *     zoom:number, optional. 需要显示热力图层级,地图小于等于该层级时,显示热力图.默认值为地图最大zoom
   *     renderer:object, optional. 设置图层renderer.
   * */
  addHeatMap: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("addHeatMap", params);
    });
  },
  deleteHeatMap: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("deleteHeatMap");
    });
  },
  //显示辖区
  showJurisdiction: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("showJurisdiction");
    });
  },

  //隐藏辖区
  hideJurisdiction: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("hideJurisdiction");
    });
  },

  /**
   * 设置地图中心点
   * @param params: required.
   *   x: number
   *   y: number
   * */
  setMapCenter: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("setMapCenter", params);
    });
  },

  /**
   * 设置地图等级
   * @param params: required.
   *   level: number
   * */
  setMapLevel: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("setMapLevel", params);
    });
  },

  setMapCenterAndLevel: function(params) {
    require(["dojo/topic"], function(topic) {
      topic.publish("setMapCenterAndLevel", params);
    });
  }
};
