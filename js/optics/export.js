/* ---------------------------------------------------------------------------------------------------------------

  SAVE THE DIAGRAM AS AN IMAGE

  The Save image button of the tool rail: PNG (a picture), SVG (a drawing, editable and scalable) or PDF (the picture
  on a page, for print).

  The diagram is an SVG whose look comes partly from the page's style sheet (line widths that stay the same
  on screen however far you zoom, the dark canvas...). A saved file has no style sheet, so every style is written
  into the copy, and the "same on screen" widths - which only a browser understands - are turned into real widths in
  the drawing's own units. Handles, grab bands and anything invisible are left out; a scale bar is added.

--------------------------------------------------------------------------------------------------------------- */

var EXPORT_PROPS = ["fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "opacity",
                    "display", "visibility", "font-family", "font-size", "font-weight", "text-anchor", "paint-order",
                    "stop-color", "stop-opacity"];

function exportNumbers (list) { return (String(list).match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number); }

// a copy of the diagram as a standalone SVG element: { svg, width, height, dark }
function diagramCopy () {

  var src  = paper.canvas;
  var box  = src.getBoundingClientRect();
  var dark = document.getElementById("lens-container").classList.contains("dark-canvas");

  // the handles that turn or drag a beam (the green ball with its dashed stick, and the invisible target round it)
  // are for working with the diagram, not part of the picture: mark them so the copy can leave them out
  var marked = [];
  if (typeof lens !== "undefined" && lens.raphael && lens.raphael.constructions) {
    lens.raphael.constructions.forEach(function (c) {
      var picker = c && c.anglePicker;
      if (!picker) { return; }
      [picker.clicker, picker.extender, picker.hit].forEach(function (part) {
        if (part && part.node) { part.node.setAttribute("data-export-skip", "1"); marked.push(part.node); }
      });
    });
  }

  var copy = src.cloneNode(true);

  // leave out what is not part of the picture: the handles, and the invisible grab bands and hit areas
  var drop = "[data-export-skip], path.width-edge, path.ruler-hit, .annotation-grip";
  Array.prototype.forEach.call(copy.querySelectorAll(drop), function (n) { n.parentNode.removeChild(n); });

  // write every style into the copy (walking the two trees together; the removed nodes are matched by skipping them)
  var from = Array.prototype.slice.call(src.querySelectorAll("*")).filter(function (n) { return !n.matches(drop); });
  marked.forEach(function (node) { node.removeAttribute("data-export-skip"); });       // (the marks were only for the copy)
  var to   = Array.prototype.slice.call(copy.querySelectorAll("*"));
  var scale = (typeof kx === "number" && isFinite(kx) && kx > 0) ? kx : 1;           // drawing units per screen pixel

  from.forEach(function (orig, i) {
    var node = to[i], cs = window.getComputedStyle(orig);
    if (!node || node.tagName !== orig.tagName) { return; }
    EXPORT_PROPS.forEach(function (p) { var v = cs.getPropertyValue(p); if (v) { node.style.setProperty(p, v); } });

    // stroke widths and dashes that stay put on screen become widths in drawing units
    var sw = parseFloat(cs.getPropertyValue("stroke-width"));
    var nonScaling = cs.getPropertyValue("vector-effect") === "non-scaling-stroke";
    node.style.removeProperty("vector-effect");
    if (isFinite(sw)) { node.style.setProperty("stroke-width", String(nonScaling ? sw * scale : sw)); }
    var dash = cs.getPropertyValue("stroke-dasharray");
    if (dash && dash !== "none") {
      var parts = exportNumbers(dash);
      if (parts.length) { node.style.setProperty("stroke-dasharray", parts.map(function (v) { return String(nonScaling ? v * scale : v); }).join(" ")); }
    }
  });

  // some copies of the drawing are hidden with a style the copy has now lost: drop what is not displayed
  Array.prototype.slice.call(copy.querySelectorAll("*")).forEach(function (n) {
    if (n.style && (n.style.display === "none") && n.tagName !== "defs") { n.parentNode && n.parentNode.removeChild(n); }
  });

  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width",  String(Math.round(box.width)));
  copy.setAttribute("height", String(Math.round(box.height)));
  copy.removeAttribute("style");

  // the white (or dark) page, behind everything, and the scale bar in front
  var NS = "http://www.w3.org/2000/svg";
  var ctm = src.getScreenCTM().inverse();
  function modelAt (px, py) { var pt = src.createSVGPoint(); pt.x = box.left + px; pt.y = box.top + py; return pt.matrixTransform(ctm); }
  var a = modelAt(0, 0), b = modelAt(box.width, box.height);

  var page = document.createElementNS(NS, "rect");
  page.setAttribute("x", a.x); page.setAttribute("y", a.y);
  page.setAttribute("width", b.x - a.x); page.setAttribute("height", b.y - a.y);
  page.setAttribute("fill", dark ? "#0b0b0f" : "#ffffff");
  var firstReal = Array.prototype.slice.call(copy.childNodes).filter(function (n) { return n.nodeType === 1 && n.tagName !== "defs" && n.tagName !== "desc"; })[0];
  copy.insertBefore(page, firstReal || null);

  if (typeof niceRoundNumberAtMost === "function" && scale > 0) {
    var metres = niceRoundNumberAtMost(120 * scale);
    var barPx  = metres / scale;
    var end    = modelAt(box.width - 18, box.height - 22), start = modelAt(box.width - 18 - barPx, box.height - 22);
    var ink    = dark ? "#e6e6e6" : "#444444";
    var g = document.createElementNS(NS, "g");
    g.setAttribute("stroke", ink); g.setAttribute("fill", "none");
    g.setAttribute("stroke-width", String(2 * scale));
    var bar = document.createElementNS(NS, "path");
    bar.setAttribute("d", "M " + start.x + " " + (start.y - 5 * scale) + " L " + start.x + " " + start.y + " L " + end.x + " " + end.y + " L " + end.x + " " + (end.y - 5 * scale));
    g.appendChild(bar);
    var label = document.createElementNS(NS, "text");
    var text  = Math.round(toDisplayDistance(metres) * 1e6) / 1e6 + " " + DISTANCE_UNIT_LABEL[currentDistanceUnit];
    label.setAttribute("x", (start.x + end.x) / 2); label.setAttribute("y", end.y - 9 * scale);
    label.setAttribute("text-anchor", "middle"); label.setAttribute("font-family", "Arial, sans-serif");
    label.setAttribute("font-size", String(12 * scale)); label.setAttribute("fill", ink); label.setAttribute("stroke", "none");
    label.textContent = text;
    g.appendChild(label);
    copy.appendChild(g);
  }

  return { svg: copy, width: Math.round(box.width), height: Math.round(box.height), dark: dark };
}

function exportFileName (extension) {
  var name = (document.getElementById("filename_display") && document.getElementById("filename_display").value) || "diagram";
  name = name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "diagram";
  return name + "." + extension;
}

function exportDownload (blob, fileName) {
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url; link.download = fileName;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function exportScript (url) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = url; s.onload = resolve; s.onerror = function () { reject(new Error("could not load " + url)); };
    document.head.appendChild(s);
  });
}

function saveDiagram (format) {

  if (typeof paper === "undefined" || !paper || !paper.canvas) { return; }
  var d = diagramCopy();
  var markup = new XMLSerializer().serializeToString(d.svg);

  if (format === "svg") {
    exportDownload(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + markup], { type: "image/svg+xml" }), exportFileName("svg"));
    return;
  }

  if (format === "png") {
    var image = new Image(), scale = 2;                                        // twice the screen size: sharp when printed
    image.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = d.width * scale; canvas.height = d.height * scale;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = d.dark ? "#0b0b0f" : "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) { exportDownload(blob, exportFileName("png")); }, "image/png");
    };
    image.onerror = function () { alert("The picture could not be made."); };
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    return;
  }

  if (format === "pdf") {
    // A PDF that holds the picture itself (three times the screen size, so it prints sharply). A vector PDF was
    // tried first (svg2pdf), but it lost the grid and mangled the faded beams - the SVG is the vector format here.
    var page = new Image(), factor = 3;
    page.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = d.width * factor; canvas.height = d.height * factor;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = d.dark ? "#0b0b0f" : "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(page, 0, 0, canvas.width, canvas.height);
      var png = canvas.toDataURL("image/png");
      var ready = window.jspdf ? Promise.resolve()
                : exportScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      ready.then(function () {
        // the page is the picture's own size (in points, 1 px = 0.75 pt), landscape or portrait to suit
        var w = d.width * 0.75, h = d.height * 0.75;
        var doc = new window.jspdf.jsPDF({ orientation: w >= h ? "l" : "p", unit: "pt", format: [w, h] });
        doc.addImage(png, "PNG", 0, 0, w, h, undefined, "FAST");      // ("FAST": compressed, or the page is megabytes of raw pixels)
        doc.save(exportFileName("pdf"));
      }).catch(function (e) {
        console.log(e);
        alert("The PDF could not be made (it needs a small library from the internet). Save the PNG or SVG instead.");
      });
    };
    page.onerror = function () { alert("The picture could not be made."); };
    page.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
  }
}
