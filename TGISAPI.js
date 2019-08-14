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
   * @param params: string, json字符串
   *   defaultSymbol: optional, 默认样式.
   *   coordinateSystem: optional, 点位坐标系, "WGS84" | "GCJ02" | "BD09"
   *     默认WGS84
   *   points: [{}], required.
   *     id: string, required. 编号
   *     type: string, optional. 类型
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
      if (typeof params == "object") {
        params = JSON.stringify(params);
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
   * 开始绘制
   * @param params: string, json字符串
   *   type: string, required. 绘制类型
   *     "point" || "line" || "polygon" || "circle" || "rectangle"
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
   * @param params: string, json字符串
   *   id: string, required.
   * */
  findFeature: function(params) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("findFeature", params);
    });
  },

  /**
   * 图形搜索
   * @param params: string, json字符串
   *   userDraw: boolean, required.
   *     true: 用户绘制图形
   *     false: 参数传入图形
   *   geoType: string, optional.
   *     图形类型, 默认为polygon
   *   geometry: object. optional
   *   onlyVisible: boolean, optional.
   *     是否只搜索可见要素.
   *   types: [string], optional.
   *     要搜索的要素类型. []代表所有要素类型.
   *     onlyVisible=true时, 忽略此参数.
   * @param callback: function
   * */
  geometrySearch: function(params, callback) {
    require(["dojo/topic"], function(topic) {
      if (typeof params == "object") {
        params = JSON.stringify(params);
      }
      topic.publish("geometrySearch", { params: params, callback: callback });
    });
  },

  stopGeometrySearch: function() {
    require(["dojo/topic"], function(topic) {
      topic.publish("stopGeometrySearch");
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
  }
};
