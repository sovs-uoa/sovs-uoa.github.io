/* ---------------------------------------------------------------------------------------------------------------

  RULER

  Measure distances on the diagram. Switch the Ruler tool on (toolbar), then drag across the diagram: a ruler with
  the length beside it appears, in the units chosen for the tables (mm, cm...).

    - the ends snap to any point on the diagram (cardinal points, vertices, object and image points);
    - hold Shift to keep a ruler level (measure along the axis);
    - drag an end to change it, or the line itself to move the whole ruler;
    - the ruler points from where you started to where you finished (an arrowhead marks the end), and a level one
      reads its length along the axis as a signed number: negative when it points left;
    - click the reading to copy its number (just the number, in the units shown, with every digit);
    - click a ruler to select it, then press Delete (or double-click it) to remove it;  Esc (or the Ruler button) puts the tool away - the rulers stay.

  A ruler belongs to the diagram it was drawn on: loading another model clears them.

  Everything is drawn in the layer #ruler-layer, which is kept in front of the beams (see bringRulersToFront).

--------------------------------------------------------------------------------------------------------------- */

var rulers    = [];
var selectedRuler = null;     // the ruler last clicked or drawn: Delete removes it
var rulerMode = false;

function rulerLayer () {

  if (typeof paper === "undefined" || !paper || !paper.canvas) { return null; }
  var g = paper.canvas.querySelector("#ruler-layer");
  if (!g) {
    g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "ruler-layer");
    paper.canvas.appendChild(g);
  }
  return g;
}

// the ruler layer goes after everything else, so nothing is drawn across a ruler
function bringRulersToFront () {

  var g = paper && paper.canvas ? paper.canvas.querySelector("#ruler-layer") : null;
  if (g && g !== paper.canvas.lastChild) { paper.canvas.appendChild(g); }
}

function selectRuler (r) {

  selectedRuler = r || null;
  rulers.forEach(function (x) {
    [x.hit, x.line, x.caps, x.arrow, x.ha, x.hb, x.label].forEach(function (el) { el.node.classList.toggle("selected", x === selectedRuler); });
  });
}

function clearRulers () {
  selectedRuler = null;
  rulers.forEach(function (r) { removeRuler(r, true); });
  rulers = [];
}

function rulerPointer (e) {
  var pt = paper.canvas.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  var p = pt.matrixTransform(paper.canvas.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}

// the nearest point on the diagram to p (within 10 pixels), else p itself
function rulerSnap (p) {

  var best = null, reach = 10 * kx, bestD = reach;
  Array.prototype.forEach.call(paper.canvas.querySelectorAll("circle"), function (c) {
    if (c.parentNode && c.parentNode.id === "ruler-layer") { return; }
    if (c.style.display === "none" || c.getAttribute("display") === "none") { return; }
    if (c.getAttribute("opacity") === "0" || (c.getAttribute("fill-opacity") === "0" && c.getAttribute("stroke-opacity") === "0")) { return; }
    var x = parseFloat(c.getAttribute("cx")), y = parseFloat(c.getAttribute("cy"));
    if (!isFinite(x) || !isFinite(y)) { return; }
    var d = Math.hypot(x - p.x, y - p.y);
    if (d < bestD) { bestD = d; best = { x: x, y: y }; }
  });
  return best ? { x: best.x, y: best.y, snapped: true } : { x: p.x, y: p.y, snapped: false };
}

// what the label says, and what clicking it copies: a level ruler reads its signed length along the axis (from the
// start to the arrow: negative when it points left, as a distance measured against the light would be), a
// vertical one its height, any other its length with the two parts beside it
function rulerReading (r) {

  var dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
  var fmt = function (m) { return toDisplayDistance(m).toFixed(4); };       // four decimal places, as the tables show them
  var level = Math.abs(dy) < 1e-9 * (1 + Math.abs(dx)), upright = Math.abs(dx) < 1e-9 * (1 + Math.abs(dy));
  var measure = level ? dx : upright ? Math.abs(dy) : Math.hypot(dx, dy);
  var number = fmt(measure);
  // (what is copied keeps every digit that means anything - 12, which only trims the arithmetic noise - so a ruler
  // laid between two snapped points pastes the very number the tables show for that distance)
  var full = String(parseFloat(toDisplayDistance(measure).toPrecision(12)));
  var text = number + " " + DISTANCE_UNIT_LABEL[currentDistanceUnit];
  if (!level && !upright) { text += "  (" + fmt(dx) + " \u00d7 " + fmt(Math.abs(dy)) + ")"; }
  return { number: number, full: full, text: text.replace(/(^|\s|\()-(?=\d)/g, "$1\u2212") };
}

function rulerLabelText (r) { return rulerReading(r).text; }

function copyRulerReading (r) {

  var reading = rulerReading(r), number = reading.full;
  var done = function () {
    r.label.attr({ text: "copied " + reading.number });
    clearTimeout(r.flash);
    r.flash = setTimeout(function () { if (r.label.node.parentNode) { updateRuler(r); } }, 900);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(number).then(done, function () {});
  } else {                                   // (an older browser, or an insecure page)
    var box = document.createElement("textarea");
    box.value = number; document.body.appendChild(box); box.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(box);
  }
}

function updateRuler (r) {

  var a = r.a, b = r.b;
  var len = Math.hypot(b.x - a.x, b.y - a.y);
  var nx = len > 0 ? -(b.y - a.y) / len : 0, ny = len > 0 ? (b.x - a.x) / len : 1;   // unit normal
  var cap = 7 * kx;

  var line = ["M", a.x, a.y, "L", b.x, b.y];
  r.hit.attr({ path: line });
  r.line.attr({ path: line });
  r.caps.attr({ path: ["M", a.x - nx * cap, a.y - ny * cap, "L", a.x + nx * cap, a.y + ny * cap] });   // a tick at the start...
  // ...and an arrowhead at the end (the ruler is directed: a to b)
  var ux = len > 0 ? (b.x - a.x) / len : 1, uy = len > 0 ? (b.y - a.y) / len : 0;
  var head = Math.min(12 * kx, len * 0.5), wing = 5 * kx;
  r.arrow.attr({ path: ["M", b.x, b.y, "L", b.x - ux * head + nx * wing, b.y - uy * head + ny * wing,
                        "L", b.x - ux * head - nx * wing, b.y - uy * head - ny * wing, "Z"] });
  r.ha.attr({ cx: a.x, cy: a.y, r: kx * 4 });
  r.hb.attr({ cx: b.x, cy: b.y, r: kx * 4 });
  r.ha.node.classList.toggle("snapped", !!a.snapped);
  r.hb.node.classList.toggle("snapped", !!b.snapped);

  // the label sits just above the middle of the ruler (the page's y runs downwards)
  var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  r.label.attr({ x: mx, y: my, text: rulerLabelText(r) });
  r.label.transform(["t", mx, my, "s", 20 * kx, 20 * ky, 0, 0, "t", 0, -0.8]);
  r.label.show();
}

function removeRuler (r, quiet) {
  [r.hit, r.line, r.caps, r.arrow, r.ha, r.hb, r.label].forEach(function (el) { if (el && el.node && el.node.parentNode) { el.remove(); } });
  if (!quiet) { rulers = rulers.filter(function (x) { return x !== r; }); if (selectedRuler === r) { selectedRuler = null; } }
}

function makeRuler (a, b) {

  var g = rulerLayer();
  var r = { a: { x: a.x, y: a.y, snapped: !!a.snapped }, b: { x: b.x, y: b.y, snapped: !!b.snapped } };

  function mark (el, cls) { el.node.setAttribute("class", cls); g.appendChild(el.node); return el; }

  r.hit   = mark(paper.path(["M", 0, 0, "L", 1, 0]), "ruler-hit");
  r.line  = mark(paper.path(["M", 0, 0, "L", 1, 0]), "ruler-line");
  r.caps  = mark(paper.path(["M", 0, 0, "L", 1, 0]), "ruler-line");
  r.arrow = mark(paper.path(["M", 0, 0, "L", 1, 0]), "ruler-arrow");
  r.ha    = mark(paper.circle(0, 0, 1), "ruler-handle");
  r.hb    = mark(paper.circle(0, 0, 1), "ruler-handle");
  r.label = paper.text(0, 0, "");
  r.label.attr({ "font-family": "arial", "font-size": 1.0, "text-anchor": "middle" });
  mark(r.label, "ruler-label");
  r.line.node.style.pointerEvents = "none";
  r.caps.node.style.pointerEvents = "none";
  r.arrow.node.style.pointerEvents = "none";
  r.label.attr({ cursor: "copy" });              // click the reading to copy its number
  r.label.click(function () { copyRulerReading(r); });

  var level = function (e, other, p) { if (e && e.shiftKey) { p.y = other.y; p.snapped = false; } return p; };

  // an end: follow the pointer, snapping to points; Shift keeps the ruler level
  function dragEnd (handle, end, other) {
    handle.attr({ cursor: "move" });
    handle.drag(
      function (dx, dy, x, y, e) {
        var s = rulerSnap(rulerPointer(e || { clientX: x, clientY: y }));
        if (e && e.shiftKey) { s.y = r[other].y; if (s.snapped) { s.snapped = false; } }
        r[end].x = s.x; r[end].y = s.y; r[end].snapped = s.snapped;
        updateRuler(r);
      },
      function () { selectRuler(r); setGrabbingCursor(true); },
      function () { setGrabbingCursor(false); }
    );
    handle.click(function () { selectRuler(r); });
  }
  dragEnd(r.ha, "a", "b");
  dragEnd(r.hb, "b", "a");

  // the line itself: move the whole ruler
  var start = null;
  r.hit.attr({ cursor: "move" });
  r.hit.drag(
    function (dx, dy, x, y, e) {
      var p = rulerPointer(e || { clientX: x, clientY: y });
      r.a.x = start.a.x + p.x - start.p.x; r.a.y = start.a.y + p.y - start.p.y; r.a.snapped = false;
      r.b.x = start.b.x + p.x - start.p.x; r.b.y = start.b.y + p.y - start.p.y; r.b.snapped = false;
      updateRuler(r);
    },
    function (x, y, e) { selectRuler(r); start = { p: rulerPointer(e || { clientX: x, clientY: y }), a: { x: r.a.x, y: r.a.y }, b: { x: r.b.x, y: r.b.y } }; setGrabbingCursor(true); },
    function () { setGrabbingCursor(false); }
  );

  [r.hit, r.ha, r.hb].forEach(function (el) { el.dblclick(function () { removeRuler(r); }); });

  rulers.push(r);
  selectRuler(r);
  updateRuler(r);
  bringRulersToFront();
  return r;
}

function rescaleRulers () {
  rulers = rulers.filter(function (r) { return r.line.node && r.line.node.parentNode; });
  rulers.forEach(updateRuler);
}

// the Ruler button, and Esc
function setRulerMode (on) {

  rulerMode = !!on;
  [["ruler-button", rulerMode], ["pointer-button", !rulerMode]].forEach(function (b) {
    var btn = document.getElementById(b[0]);
    if (btn) { btn.classList.toggle("active", b[1]); btn.setAttribute("aria-pressed", b[1] ? "true" : "false"); }
  });
  var hint = document.getElementById("ruler-hint");
  if (hint) { hint.style.display = rulerMode ? "block" : "none"; }
  if (paper && paper.canvas) { paper.canvas.style.cursor = rulerMode ? "crosshair" : "default"; }
}

function toggleRulerMode () { setRulerMode(!rulerMode); }

// a new ruler: drag across empty diagram while the tool is on
function startRulerDrag (e) {

  if (selectedRuler && !(e.target.closest && e.target.closest("#ruler-layer"))) { selectRuler(null); }   // a click elsewhere lets go of it

  if (!rulerMode || e.button > 0 || (e.target.closest && e.target.closest("#ruler-layer"))) { return; }   // (anywhere but on a ruler: the ends of a ruler can be started on a point)
  e.stopPropagation();
  e.preventDefault();

  var a = rulerSnap(rulerPointer(e));
  var r = makeRuler(a, a);
  setGrabbingCursor(true);
  paper.canvas.style.cursor = "crosshair";

  function move (ev) {
    var s = rulerSnap(rulerPointer(ev));
    if (ev.shiftKey) { s.y = r.a.y; s.snapped = false; }
    r.b.x = s.x; r.b.y = s.y; r.b.snapped = s.snapped;
    updateRuler(r);
  }
  function up () {
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("mouseup", up, true);
    setGrabbingCursor(false);
    if (Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y) < 4 * kx) { removeRuler(r); }   // a click, not a ruler
  }
  document.addEventListener("mousemove", move, true);
  document.addEventListener("mouseup", up, true);
}

function attachRulerTool () {

  if (!paper || !paper.canvas) { return; }
  paper.canvas.addEventListener("mousedown", startRulerDrag, true);
  if (rulerMode) { paper.canvas.style.cursor = "crosshair"; }
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && rulerMode) { setRulerMode(false); }
  if ((e.key === "Delete" || e.key === "Backspace") && selectedRuler) {
    var t = e.target, typing = t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable);
    if (typing) { return; }                      // (never take a character out of a table cell or the search box)
    e.preventDefault();
    removeRuler(selectedRuler);
  }
});
