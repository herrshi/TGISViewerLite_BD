var arrFeatureStyles3 = {
  0: [2, "rgba(0,192,73,0.99609375)", 2, 2, 0, [], 0, 0],
  1: [2, "rgba(0,192,73,0.99609375)", 3, 2, 0, [], 0, 0],
  10: [2, "rgba(242,48,48,0.99609375)", 2, 2, 0, [], 0, 0],
  11: [2, "rgba(242,48,48,0.99609375)", 3, 2, 0, [], 0, 0],
  12: [2, "rgba(242,48,48,0.99609375)", 4, 2, 0, [], 0, 0],
  13: [2, "rgba(242,48,48,0.99609375)", 5, 2, 0, [], 0, 0],
  14: [2, "rgba(242,48,48,0.99609375)", 6, 2, 0, [], 0, 0],
  15: [2, -1, 4, 0, 0, [], 0, 0],
  16: [2, -1, 3, 0, 0, [], 0, 0],
  17: [2, -1, 4, 0, 0, [], 0, 0],
  18: [2, -1, 5, 0, 0, [], 0, 0],
  19: [2, -1, 6, 0, 0, [], 0, 0],
  2: [2, "rgba(0,192,73,0.99609375)", 4, 2, 0, [], 0, 0],
  3: [2, "rgba(0,192,73,0.99609375)", 5, 2, 0, [], 0, 0],
  4: [2, "rgba(0,192,73,0.99609375)", 6, 2, 0, [], 0, 0],
  5: [2, "rgba(255,159,25,0.99609375)", 2, 2, 0, [], 0, 0],
  6: [2, "rgba(255,159,25,0.99609375)", 3, 2, 0, [], 0, 0],
  7: [2, "rgba(255,159,25,0.99609375)", 4, 2, 0, [], 0, 0],
  8: [2, "rgba(255,159,25,0.99609375)", 5, 2, 0, [], 0, 0],
  9: [2, "rgba(255,159,25,0.99609375)", 6, 2, 0, [], 0, 0]
};
var BMap = {};
var data;
function _drawTrafficLayer(x, y, z, url, proxyUrl) {
  var img;
  var can = document.createElement("canvas");
  can.width = 256;
  can.height = 256;
  var b = "_t" + parseInt(x + "" + y + z).toString(36);
  var c = "BMap." + b;
  BMap[b] = function(res) {
    if (res.error == 0) {
      data = res;
      if (data && data.content && data.content.tf) {
        return _drawFeatures(data.content.tf, can, x, y);
      } else {
        return null;
      }
    }
  };
  if (proxyUrl) {
    proxyUrl = proxyUrl + "?";
  }
  else
  {
      proxyUrl=""
  }
  var reqUrl =
    proxyUrl +
    url +
    "&x=" +
    x +
    "&y=" +
    y +
    "&z=" +
    z +
    "&fn=" +
    c +
    "&t=" +
    new Date().getTime();
  $.ajax({
    type: "GET",
    url: reqUrl,
    async: false,
    dataType: "json",
    success: function(res) {},
    error: function(err) {
      img = eval(err.responseText);
    }
  });
  return img;
}
function _drawFeatures(t, e, i, n) {
  var o = e.getContext("2d"),
    a = (getRGBA, getLineCap),
    s = getLineJoin;
  /*
        1 < ratio && !e._scale && (o.scale(ratio, ratio), e._scale = !0),
        e._translate || (e._translate = !0, o.translate(tileSizeMargin / 2, tileSizeMargin / 2));
        */
  for (var r = 0, l = t.length; r < l; r++) {
    var h = t[r],
      c = h[1],
      d = arrFeatureStyles3[h[3]],
      u = (arrFeatureStyles3[h[4]], c[0] / 10),
      p = c[1] / 10;
    o.beginPath(), o.moveTo(u, p);
    for (var _ = 2, m = c.length; _ < m; _ += 2)
      (u += c[_] / 10), (p += c[_ + 1] / 10), o.lineTo(u, p);
    (o.strokeStyle = d[1]),
      15 <= h[3] && h[3] <= 19 && (o.strokeStyle = "rgba(186, 0, 0, 1)"),
      (o.lineWidth = d[2] - 1),
      (o.lineCap = a(d[3])),
      (o.lineJoin = s(d[4])),
      o.stroke();
  }
  var fff = convertCanvasToImage(e);
  return fff.src;
}
function getRGBA(t) {
  return (
    "rgba(" +
    (((t >>>= 0) >> 24) & 255) +
    "," +
    ((t >> 16) & 255) +
    "," +
    ((t >> 8) & 255) +
    "," +
    (255 & t) / 256 +
    ")"
  );
}
function getLineCap(t) {
  return ["butt", "square", "round"][t];
}
function getLineJoin(t) {
  return ["miter", "bevel", "round"][t];
}
function convertCanvasToImage(canvas) {
  var image = new Image();
  image.width = 256;
  image.height = 256;
  image.src = canvas.toDataURL("image/png");
  image.crossorigin = "Anonymous";
  return image;
}
