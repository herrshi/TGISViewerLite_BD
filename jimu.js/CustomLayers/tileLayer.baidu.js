//������ proj4.js �� proj4leaflet.js
L.CRS.Baidu = new L.Proj.CRS(
  "EPSG:900913",
  "+proj=merc +a=6378206 +b=6356584.314245179 +lat_ts=0.0 +lon_0=0.0 +x_0=0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs",
  {
    resolutions: (function() {
      level = 19;
      var res = [];
      // res[0] = Math.pow(2, 18);
      for (var i = 0; i < level; i++) {
        res[i] = Math.pow(2, level - i - 1);
      }
      return res;
    })(),
    origin: [0, 0],
    bounds: L.bounds([20037508.342789244, 0], [0, 20037508.342789244])
  }
);

function encode(t) {
  for (var e = "", i = 0; i < t.length; i++) {
    var n = (l = t.charCodeAt(i) << 1).toString(2),
      o = n;
    n.length < 8 && (o = (o = "00000000" + n).substr(n.length, 8)), (e += o);
  }
  var a = 5 - (e.length % 5),
    s = [];
  for (i = 0; i < a; i++) s[i] = "0";
  e = s.join("") + e;
  var r = [];
  for (i = 0; i < e.length / 5; i++) {
    var l = e.substr(5 * i, 5),
      h = parseInt(l, 2) + 50;
    r.push(String.fromCharCode(h));
  }
  return r.join("") + a.toString();
}

L.TileLayer.BDVec = L.TileLayer.extend({
  options: {
    minZoom: 12,
    maxZoom: 19
  },
  // _url: null,
  getTileUrl: function(coords) {
    var n = (Math.abs(coords.x) + "").replace(/-/gi, "M"),
      o = (Math.abs(coords.y) - 1 + "").replace(/-/gi, "M"),
      a = coords.z,
      s = this._url;
    var r = encode("x=" + n + "&y=" + o + "&z=" + a);
    return s + "?param=" + r;
  }
});

L.TileLayer.Traffic = L.TileLayer.extend({
  _url: null,
  getTileUrl: function(coords) {
    var n = (Math.abs(coords.x) + "").replace(/-/gi, "M"),
      o = (Math.abs(coords.y) - 1 + "").replace(/-/gi, "M"),
      a = coords.z;
    var s = _drawTrafficLayer(n, o, a, this._url.url, this._url.proxy);
    return s;
  }
});
L.tileLayer.bdvec = function(url) {
  return new L.TileLayer.BDVec(url);
};

L.tileLayer.traffic = function(option) {
  return new L.TileLayer.Traffic(option);
};

L.tileLayer.baidu = function(option) {
  option = option || {};

  var layer;
  var subdomains = "0123456789";
  switch (option.layer) {
    //��ͼ��
    case "bdvec":
      layer = L.tileLayer.bdvec(option.url);
      break;
    //��ͼ��
    case "vec":
      layer = L.tileLayer(
        option.url + "&styles=" + (option.bigFont ? "ph" : "pl"),
        {
          name: option.name,
          subdomains: subdomains,
          tms: true
        }
      );
      break;
    case "img_d":
      layer = L.tileLayer(option.url, {
        name: option.name,
        subdomains: subdomains,
        tms: true
      });
      break;
    case "img_z":
      layer = L.tileLayer(
        option.url + "&styles=" + (option.bigFont ? "sh" : "sl"),
        {
          name: option.name,
          subdomains: subdomains,
          tms: true
        }
      );
      break;

    case "custom": //Custom �����Զ�����ʽ
      //��ѡֵ��dark,midnight,grayscale,hardedge,light,redalert,googlelite,grassgreen,pink,darkgreen,bluish
      option.customid = option.customid || "midnight";
      layer = L.tileLayer(option.url + "&customid=" + option.customid, {
        name: option.name,
        subdomains: "012",
        tms: true
      });
      break;
    case "time": //ʵʱ·��
      var time = new Date().getTime();
      layer = L.tileLayer(option.url + "&time=" + time, {
        name: option.name,
        subdomains: subdomains,
        tms: true
      });
      break;
    case "time_own": //ʵʱ·��
      layer = L.tileLayer.traffic(option);
      break;

    //�ϲ�
    case "img":
      layer = L.layerGroup([
        L.tileLayer.baidu({
          name: "��ͼ",
          layer: "img_d",
          bigFont: option.bigFont
        }),
        L.tileLayer.baidu({
          name: "ע��",
          layer: "img_z",
          bigFont: option.bigFont
        })
      ]);
      break;
  }
  return layer;
};
