/* ---------------------------------------------------------------------------------------------------------------

  MANAGER  (manager.html)

  The workbench with its tables open for authoring: lens prescriptions are opened from, and saved to, files on disk;
  rows are added to the Lens Prescription and to the Objects and Images tables as on every page; and a debug window
  collects what is wrong with a prescription - a file that will not parse, values that cannot be traced, an error the
  optics threw - so that a bad prescription can be seen and fixed rather than quietly drawing nothing.

--------------------------------------------------------------------------------------------------------------- */

var managerLog = [];            // { time, level, source, message, row }

// what the description panel holds: the words about the model that a lens file carries besides its optics
var META_FIELDS = [ ["title", "Title", "text"], ["shortName", "Short name", "text"], ["category", "Category", "text"],
                    ["subcategory", "Group", "text"], ["keywords", "Keywords (commas)", "text"],
                    ["reference", "Source", "text"], ["about", "Description", "area"] ];
var managerMeta = {};
var metaFor = null;             // the loaded file the panel was last filled from

/* --- the debug window ----------------------------------------------------------------------------------------- */

function debugAdd (level, source, message, row) {

  managerLog.push({ time: new Date(), level: level, source: source, message: String(message), row: row });
  if (managerLog.length > 500) { managerLog.shift(); }
  renderDebug();
}

function debugClearKind (source) {
  managerLog = managerLog.filter(function (e) { return e.source !== source; });
  renderDebug();
}

function renderDebug () {

  var list  = document.getElementById("debug-list");
  var badge = document.getElementById("debug-badge");
  if (!list || !badge) { return; }

  var errors = managerLog.filter(function (e) { return e.level === "error"; }).length;
  var warns  = managerLog.filter(function (e) { return e.level === "warning"; }).length;
  badge.textContent = errors + warns;
  badge.className = "badge ml-1 " + (errors ? "badge-danger" : (warns ? "badge-warning" : "badge-secondary"));

  var show = document.getElementById("debug-show").value;
  list.textContent = "";
  var any = false;
  managerLog.slice().reverse().forEach(function (e) {
    if (show !== "all" && e.level !== show) { return; }
    any = true;
    var line = document.createElement("div");
    line.className = "debug-line debug-" + e.level;
    var stamp = e.time.toTimeString().slice(0, 8);
    line.innerHTML = "<span class=\"debug-time\">" + stamp + "</span> <span class=\"debug-level\">" + e.level + "</span> " +
                     "<span class=\"debug-source\">" + escapeHTML(e.source) + "</span>" +
                     (e.row !== undefined && e.row !== null ? " <span class=\"debug-row\">row " + escapeHTML(String(e.row)) + "</span>" : "") +
                     " " + escapeHTML(e.message);
    list.appendChild(line);
  });
  if (!any) { list.innerHTML = "<div class=\"text-muted p-2\">Nothing to report.</div>"; }
}

/* --- the drawer (debug and summary) and the height of the shell --------------------------------------------------- */

var mgrSplitV = null;          // Split.js: diagram | tables | drawer
var mgrSplitH = null;          // Split.js: lens prescription | objects and images
var mgrSplitT = null;          // Split.js: diagram | summary
var MGR_SIZES = { v: [46, 40, 14], h: [58, 42], t: [62, 38] };

function mgrRedraw () {
  try { lens.table.redraw(true); lens.pointsTable.redraw(true); } catch (e) { /* tables not built yet */ }
  try { window.dispatchEvent(new Event("resize")); } catch (e) { /* ignore */ }
}

// the shell takes the rest of the screen under the top panel
var lastShellHeight = -1;
function fitManagerHeights () {
  var shell = document.getElementById("mgr-shell");
  if (!shell) { return; }
  var h = Math.max(300, Math.round(window.innerHeight - shell.getBoundingClientRect().top - 8));
  if (h === lastShellHeight) { return; }
  lastShellHeight = h;
  shell.style.height = h + "px";
  if (mgrSplitV) { mgrRedraw(); }
}
window.addEventListener("resize", fitManagerHeights);

function showDrawer (view) {
  var drawer = document.getElementById("mgr-drawer");
  if (!drawer) { return; }
  drawer.setAttribute("data-view", view);
  Array.prototype.forEach.call(drawer.querySelectorAll("#mgr-drawer-tabs button"), function (t) { t.classList.toggle("active", t.getAttribute("data-view") === view); });
  var btn = document.getElementById("manager-debug");
  if (btn) { btn.classList.toggle("active", view === "debug"); }
}

function drawerSize () { return mgrSplitV ? mgrSplitV.getSizes()[2] : 0; }

// open the drawer on the debug window (making room if it has been pushed shut), or fold it away
function toggleDebug (open) {
  var drawer = document.getElementById("mgr-drawer");
  if (!drawer || !mgrSplitV) { return; }
  var showing = drawer.getAttribute("data-view") === "debug" && drawerSize() > 8;
  var on = (open === undefined) ? !showing : !!open;
  if (on) {
    showDrawer("debug");
    if (drawerSize() < 12) { var s = mgrSplitV.getSizes(); var take = 20 - s[2]; s[2] = 20; s[1] = Math.max(8, s[1] - take); mgrSplitV.setSizes(s); mgrRedraw(); }
  } else {
    var t = mgrSplitV.getSizes(); t[1] += t[2] - 4; t[2] = 4; mgrSplitV.setSizes(t); mgrRedraw();
  }
}

/* --- what is wrong with a prescription ------------------------------------------------------------------------ */

var ELEMENT_TYPES = ["index", "sphere", "thin", "prism", "stop", "img", "plane"];

function mgrNum (v) { return (v === null || v === undefined || v === "") ? NaN : Number(v); }

// Everything that can be seen to be wrong in the rows of the lens table, without tracing a ray.
function validatePrescription (rows) {

  var found = [];
  function problem (level, row, message) { found.push({ level: level, row: row.id, message: message }); }

  if (!rows.length) { found.push({ level: "error", row: null, message: "The prescription is empty." }); return found; }

  var stops = 0, lastMedium = null;

  rows.forEach(function (r, i) {

    var where = (r.description ? "\"" + r.description + "\" " : "") + "(" + r.type + ")";

    if (ELEMENT_TYPES.indexOf(r.type) < 0) { problem("error", r, where + ": unknown element type."); return; }

    if (r.type === "index") {
      var n = mgrNum(r.index);
      if (!isFinite(n) || n === 0) { problem("error", r, where + ": the refractive index must be a number (not zero)."); }
      else if (Math.abs(n) < 1 && Math.abs(n) !== 1) { problem("warning", r, where + ": a refractive index below 1 (" + n + ") is unusual."); }
      else if (n < 0 && n !== -1 && Math.abs(Math.abs(n) - 1) > 1e-9) { problem("warning", r, where + ": a negative index means light travelling back (a mirror); only -1 in air is the usual convention."); }
      var t = mgrNum(r.thickness);
      if (isFinite(t) && t < 0 && n > 0) { problem("warning", r, where + ": a negative thickness in a positive medium: light only travels backwards after a mirror (negative index)."); }
      if (isFinite(t) && t > 0 && n < 0) { problem("warning", r, where + ": a positive thickness after a mirror (negative index): the elements that follow lie to the left, so the gap should be negative."); }
      if (i > 0 && i < rows.length - 1 && rows[i - 1].type === "index") { problem("warning", r, where + ": follows another medium with no element between them."); }
      if (!isFinite(t) && i > 0 && i < rows.length - 1 && !(rows[i + 1] && rows[i + 1].type === "img" && false)) {
        // a medium between two elements needs a thickness (the first and last media do not)
        if (rows[i - 1].type !== "index") { problem("warning", r, where + ": no thickness (taken as zero)."); }
      }
      lastMedium = r;
    }

    if (r.type === "sphere") {
      var R = mgrNum(r.radius), h = mgrNum(r.height), a = mgrNum(r.aperture);
      if (!isFinite(R) || R === 0) { problem("error", r, where + ": a surface needs a radius (use a very large one for a flat surface, or a Stop/Img element)."); }
      if (isFinite(R) && isFinite(h) && h > 2 * Math.abs(R)) { problem("warning", r, where + ": the height (" + h + ") is more than twice the radius (" + Math.abs(R) + "): the surface cannot be drawn that tall."); }
      if (isFinite(a) && isFinite(h) && a > h) { problem("warning", r, where + ": the aperture is larger than the element's height."); }
    }

    if (r.type === "thin" || r.type === "prism") {
      if (!isFinite(mgrNum(r.power))) { problem("error", r, where + ": the power is not a number."); }
      var ap = mgrNum(r.aperture), ht = mgrNum(r.height);
      if (isFinite(ap) && isFinite(ht) && ap > ht) { problem("warning", r, where + ": the aperture is larger than the element's height."); }
      if (r.type === "prism" && r.base !== "up" && r.base !== "down") { problem("warning", r, where + ": the base should be \"up\" or \"down\"."); }
    }

    if (r.type === "stop" && !isFinite(mgrNum(r.aperture))) { problem("error", r, where + ": a stop needs an aperture."); }
    if (r.type === "img" && !isFinite(mgrNum(r.height))) { problem("warning", r, where + ": an image plane without a height is drawn very small."); }

    if (r.material && typeof Materials !== "undefined" && !Materials.find(r.material)) {
      problem("warning", r, where + ": the material \"" + r.material + "\" is not in the list (a fixed index is used instead).");
    }

    if (r.stop === true || r.type === "stop") { stops++; }
  });

  // surfaces, thin lenses and prisms are separated by media: two in a row cannot be traced
  var isElement = function (r) { return r.type === "sphere" || r.type === "thin" || r.type === "prism"; };
  rows.forEach(function (r, i) {
    if (i > 0 && isElement(r) && isElement(rows[i - 1])) {
      problem("error", r, "\"" + (r.description || r.type) + "\" (" + r.type + ") follows another element directly: a medium (an index row, with no thickness if they touch) must come between them.");
    }
  });

  if (rows[0].type !== "index") { problem("warning", rows[0], "The prescription should begin with the medium the light starts in (an index row)."); }
  var last = rows[rows.length - 1];
  if (last.type !== "index" && last.type !== "img") { problem("warning", last, "The prescription should end with a medium or an image plane."); }
  if (stops > 1) { found.push({ level: "warning", row: null, message: stops + " elements are marked as the stop; only the first is used." }); }
  if (!rows.some(function (r) { return r.type === "sphere" || r.type === "thin" || r.type === "prism"; })) {
    found.push({ level: "warning", row: null, message: "There is no refracting or reflecting element yet." });
  }

  return found;
}

function checkPrescription () {

  if (typeof lens === "undefined" || !lens.table) { return; }
  debugClearKind("prescription");
  validatePrescription(lens.table.getData()).forEach(function (p) { debugAdd(p.level, "prescription", p.message, p.row); });
}

/* --- opening and saving ---------------------------------------------------------------------------------------- */

// the keys of a file that nothing in the tables owns are kept as they were loaded (title, viewBox, visible, ...)
var OWNED_KEYS = ["prescription", "sources"];

function mgrClean (value) {
  if (value === null || value === undefined || value === "" || value === false) { return undefined; }
  if (typeof value === "number" && isNaN(value)) { return undefined; }
  return value;
}

function prescriptionFromTable () {

  return lens.table.getData().map(function (r) {

    var args = {};
    function put (key, value) { var v = mgrClean(value); if (v !== undefined) { args[key] = v; } }

    switch (r.type) {
      case "index":  put("index", r.index); put("thickness", r.thickness); put("material", r.material); break;
      case "sphere": put("radius", r.radius); put("height", r.height); put("aperture", r.aperture); put("stop", r.stop === true); put("intermediate", r.intermediate === true); break;
      case "thin":   put("power", r.power); put("height", r.height); put("aperture", r.aperture); put("stop", r.stop === true); put("material", r.material); put("intermediate", r.intermediate === true); break;
      case "prism":  put("power", r.power); put("base", r.base); put("height", r.height); put("aperture", r.aperture); put("stop", r.stop === true); put("material", r.material); break;
      case "stop":   put("height", r.height); put("aperture", r.aperture); break;
      case "img":    put("radius", r.radius); put("height", r.height); break;
      default:       ["radius", "power", "height", "index", "thickness", "aperture"].forEach(function (k) { put(k, r[k]); });
    }

    var out = { id: r.tag_id || String(r.id) };
    if (r.group) { out.group = r.group; }
    out.type = r.type; out.description = r.description || ""; out.args = args;
    return out;
  });
}

// the objects: z, h and the angle as a lens file writes them (the table shows the height and the angle with the
// opposite sign convention from the drawing's own: file h = table h, file t = - table angle)
function sourcesFromTable () {

  if (!lens.pointsTable) { return []; }
  return lens.pointsTable.getData().map(function (d) {
    var s = { id: d.id, type: d.type === "point" ? "point" : "object", which: "object" };
    if (d.type !== "point") { s.infinity = !!d.infinity; }
    var z = mgrNum(d.zo), h = mgrNum(d.ho), t = mgrNum(d.to);
    s.z = isFinite(z) ? z : NaN;
    s.h = isFinite(h) ? h : NaN;
    s.t = isFinite(t) ? -t : NaN;
    if (isFinite(mgrNum(d.beamwidth))) { s.beamwidth = Number(d.beamwidth); }
    if (d.wavelength !== undefined && d.wavelength !== null && d.wavelength !== "") { s.wavelength = d.wavelength; }
    if (d.group) { s.group = d.group; }
    if (d.hidden) { s.hidden = true; }
    if (d.draw) { s.draw = d.draw; }
    return s;
  });
}

function lensFileText () {

  var file = {};
  var base = (typeof response === "object" && response) ? response : {};
  Object.keys(base).forEach(function (k) { if (OWNED_KEYS.indexOf(k) < 0) { file[k] = base[k]; } });
  var title = (document.getElementById("filename_display") || {}).value;
  if (!file.title && title) { file.title = title; }

  // what the description panel says about the model wins over what the file had
  Object.keys(managerMeta).forEach(function (k) {
    var v = managerMeta[k];
    if (k === "keywords") {
      var list = String(v).split(",").map(function (w) { return w.trim(); }).filter(Boolean);
      if (list.length) { file.keywords = list; } else { delete file.keywords; }
    } else if (String(v).trim() !== "") { file[k] = String(v).trim(); }
    else { delete file[k]; }
  });
  file.units = "m";                                  // the tables hold metres, whatever the file said it was in
  file.sources = sourcesFromTable();
  file.prescription = prescriptionFromTable();

  var tokens = { "__NaN__": "NaN", "__Infinity__": "Infinity", "__-Infinity__": "-Infinity" };
  var json = JSON.stringify(file, function (key, value) {
    if (typeof value === "number" && !isFinite(value)) { return isNaN(value) ? "__NaN__" : (value > 0 ? "__Infinity__" : "__-Infinity__"); }
    return value;
  }, "\t");
  Object.keys(tokens).forEach(function (t) { json = json.split("\"" + t + "\"").join(tokens[t]); });
  return json + "\n";
}

/* recompile: check the prescription in the tables, and if it is consistent write it out and load it again, so what is
   on show is exactly what the tables describe (the same way a saved file would open) */
function recompileLens () {

  if (typeof lens === "undefined" || !lens.table) { return; }
  checkPrescription();
  var problems = validatePrescription(lens.table.getData());
  var errors = problems.filter(function (p) { return p.level === "error"; });
  if (errors.length) {
    debugAdd("error", "prescription", "Not recompiled: " + errors.length + " error" + (errors.length > 1 ? "s" : "") + " to fix first.");
    toggleDebug(true);
    return false;
  }
  var title = (document.getElementById("filename_display") || {}).value || "Recompiled";
  var text = lensFileText();
  if (openLensText(text, title)) {
    var warnings = problems.length;
    debugAdd("info", "file", "Recompiled" + (warnings ? " with " + warnings + " warning" + (warnings > 1 ? "s" : "") : ": consistent") + ".");
    if (warnings) { toggleDebug(true); }
    return true;
  }
  return false;
}

function saveLensFile () {

  if (typeof lens === "undefined" || !lens.table) { return; }
  var text = lensFileText();
  var title = (document.getElementById("filename_display") || {}).value || "lens";
  var name = title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "lens";
  var blob = new Blob([text], { type: "application/json" });
  var url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name + ".lens";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  debugAdd("info", "file", "Saved " + name + ".lens (" + text.length + " characters).");
}

// open a prescription from text (a file the person chose, or a new one): parse it, report what is wrong with it, and
// load it as the model on show
function openLensText (text, title) {

  debugClearKind("file"); debugClearKind("prescription");

  var parsed;
  try { parsed = JSON5.parse(text); }
  catch (e) {
    debugAdd("error", "file", "\"" + title + "\" could not be read as a lens file: " + (e.message || e));
    toggleDebug(true);
    return false;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.prescription)) {
    debugAdd("error", "file", "\"" + title + "\" has no \"prescription\" list.");
    toggleDebug(true);
    return false;
  }

  // look at the prescription before it is loaded: what is wrong with it, row by row. A prescription with errors in it
  // cannot be traced, so it is reported and not loaded (the model on show stays as it was).
  var problems = [];
  try { problems = validatePrescription(convertToLensTable(JSON.parse(JSON.stringify(parsed.prescription)))); }
  catch (e) { problems = [{ level: "error", row: null, message: "The prescription could not be read row by row: " + (e.message || e) }]; }
  problems.forEach(function (p) { debugAdd(p.level, "file", "\"" + title + "\": " + p.message, p.row); });
  if (problems.some(function (p) { return p.level === "error"; })) {
    debugAdd("error", "file", "\"" + title + "\" was not opened: fix the errors above and open it again.");
    toggleDebug(true);
    return false;
  }

  window.__localLens = { text: text, title: title };
  var entry = fileList.filter(function (m) { return m.id === "__local__"; })[0];
  if (!entry) { entry = { id: "__local__" }; fileList.push(entry); }
  entry.filename = "(file on disk)"; entry.title = title;

  try {
    clearLens();
    load("__local__");
    if (typeof history.replaceState === "function") { try { history.replaceState(null, "", location.pathname); } catch (e) { /* file:// */ } }
    debugAdd("info", "file", "Opened \"" + title + "\" (" + parsed.prescription.length + " rows).");
    setTimeout(checkPrescription, 800);
    return true;
  } catch (e) {
    debugAdd("error", "file", "\"" + title + "\" could not be loaded: " + (e.message || e));
    toggleDebug(true);
    return false;
  }
}

function openLensFile (file) {
  var reader = new FileReader();
  reader.onload = function () { openLensText(String(reader.result), file.name.replace(/\.lens$/i, "")); };
  reader.onerror = function () { debugAdd("error", "file", "\"" + file.name + "\" could not be read."); toggleDebug(true); };
  reader.readAsText(file);
}

function newLens () {
  var text = JSON.stringify({
    title: "New lens", units: "m", visible: { radius: true, power: true, curvature: true, aperture: true },
    viewBox: [-0.2, 0.1, 0.4, 0.2],
    sources: [{ id: 1, type: "object", which: "object", infinity: true, beamwidth: 0.02, z: "NaN", h: "NaN", t: 0 }],
    prescription: [ { id: "0001", type: "index", description: "air", args: { index: 1 } },
                    { id: "0002", type: "thin", description: "lens", args: { power: 10, height: 0.1, aperture: 0.08 } },
                    { id: "0003", type: "index", description: "air", args: { index: 1 } } ]
  }).replace("\"NaN\"", "NaN");
  openLensText(text, "New lens");
}

// fill the description panel from the file now loaded (once per file: the panel is the person's own after that)
function fillMeta () {

  var panel = document.getElementById("manager-meta");
  if (!panel || typeof response !== "object" || !response || metaFor === response) { return; }
  metaFor = response;
  managerMeta = {};
  META_FIELDS.forEach(function (f) {
    var v = response[f[0]];
    if (Array.isArray(v)) { v = v.join(", "); }
    managerMeta[f[0]] = (v === undefined || v === null) ? "" : String(v);
    var box = panel.querySelector("[data-meta=\"" + f[0] + "\"]");
    if (box) { box.value = managerMeta[f[0]]; }
  });
}

/* --- the row menu (right-click a row of either table) ------------------------------------------------------------- */

var NEW_ROWS = {
  index:  { description: "air",             index: 1, thickness: 0.01 },
  sphere: { description: "surface",         radius: 0.1, height: 0.05, aperture: 0.04 },
  thin:   { description: "thin lens",       power: 5, height: 0.05, aperture: 0.04 },
  prism:  { description: "prism",           power: 5, base: "up", height: 0.05, aperture: 0.04 },
  stop:   { description: "stop",            height: 0.1, aperture: 0.02 },
  img:    { description: "image plane",     radius: Infinity, height: 0.05 }
};

function blankRow (type) {
  var row = { id: 0, tag_id: "", group: "", type: type, description: "", radius: null, power: null, height: null, index: null,
              material: "", thickness: null, stop: false, aperture: null, intermediate: false, base: "up" };
  return Object.assign(row, NEW_ROWS[type]);
}

// the position of a row in its table (the row components handed out are new objects each time: compare the elements)
function rowPosition (table, row) {
  var element = row.getElement();
  var rows = table.getRows();
  for (var i = 0; i < rows.length; i++) { if (rows[i].getElement() === element) { return i; } }
  return -1;
}

function closeRowMenu () { var m = document.getElementById("row-menu"); if (m) { m.remove(); } }

function managerRowMenu (e, row, kind) {

  closeRowMenu();
  var table = (kind === "prescription") ? lens.table : lens.pointsTable;
  var menu  = document.createElement("div");
  menu.id = "row-menu";
  menu.className = "row-menu";

  function item (label, action, disabled, className) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = label; b.disabled = !!disabled;
    if (className) { b.className = className; }
    b.addEventListener("click", function () { closeRowMenu(); action(); });
    menu.appendChild(b);
  }
  function heading (text) { var h = document.createElement("div"); h.className = "row-menu-head"; h.textContent = text; menu.appendChild(h); }

  var rows  = table.getRows();
  var index = rowPosition(table, row);

  if (kind === "prescription") {
    heading("Insert after this row");
    [ ["index", "a medium"], ["sphere", "a surface"], ["thin", "a thin lens"], ["prism", "a prism"], ["stop", "a stop"], ["img", "an image plane"] ].forEach(function (t) {
      item(t[1], function () { insertLensRowAfter(row, blankRow(t[0])); });
    });
    heading("This row");
    item("Duplicate", function () { insertLensRowAfter(row, JSON.parse(JSON.stringify(row.getData()))); });
  } else {
    heading("This object");
    item("Duplicate", function () { duplicateObjectRow(row); });
  }
  item("Move up",   function () { table.moveRow(row, rows[index - 1], false); if (kind === "prescription") { afterLensRowsMoved(); } }, index === 0);
  item("Move down", function () { table.moveRow(row, rows[index + 1], true);  if (kind === "prescription") { afterLensRowsMoved(); } }, index === rows.length - 1);
  item("Delete", function () { deleteRowOf(row, kind); }, false, "row-menu-danger");

  document.body.appendChild(menu);
  menu.style.left = Math.min(e.pageX, window.scrollX + document.documentElement.clientWidth - menu.offsetWidth - 8) + "px";
  menu.style.top  = Math.min(e.pageY, window.scrollY + window.innerHeight - menu.offsetHeight - 8) + "px";
  setTimeout(function () {
    document.addEventListener("mousedown", function away (ev) {
      if (!menu.contains(ev.target)) { closeRowMenu(); document.removeEventListener("mousedown", away, true); }
    }, true);
  }, 0);
}

// Elements (surfaces, thin lenses, prisms) are separated by media in a prescription. An element put in after another
// element, or in front of one, brings a medium with it - the one it was put into, with no thickness - so the
// prescription stays a valid alternation and can be traced straight away.
function insertLensRowAfter (row, data) {

  var rows = lens.table.getRows();
  var at = rowPosition(lens.table, row);
  var next = rows[at + 1] ? rows[at + 1].getData() : null;
  var before = row.getData();
  var isMedium = function (d) { return d && d.type === "index"; };
  var isElement = function (d) { return d && (d.type === "sphere" || d.type === "thin" || d.type === "prism"); };

  // the medium this row sits in: the nearest one before it
  var medium = null;
  for (var i = at; i >= 0 && !medium; i--) { if (isMedium(rows[i].getData())) { medium = rows[i].getData(); } }
  var gap = function () {
    return Object.assign(blankRow("index"), { description: medium ? medium.description : "air", index: medium ? medium.index : 1,
                                              thickness: 0, material: medium ? medium.material : "" });
  };

  data.id = 0;                                      // numbered again below

  // (adding a row is asynchronous in Tabulator: each step follows the one before)
  var made = null;
  lens.table.addRow(data, false, row).then(function (inserted) {                // false: after
    made = inserted;
    var step = Promise.resolve();
    if (isElement(data) && isElement(next))   { step = step.then(function () { return lens.table.addRow(gap(), false, inserted); }); }
    if (isElement(data) && isElement(before)) { step = step.then(function () { return lens.table.addRow(gap(), false, row); }); }
    return step;
  }).then(function () {
    afterLensRowsMoved();
    if (made) { try { lens.table.deselectRow(); made.select(); made.scrollTo(); } catch (e) { /* not selectable */ } }
  });
}

// the same, in front of a row
function insertLensRowBefore (row, data) {
  var rows = lens.table.getRows();
  var at = rowPosition(lens.table, row);
  if (at > 0) { insertLensRowAfter(rows[at - 1], data); return; }
  var isElement = function (d) { return d && (d.type === "sphere" || d.type === "thin" || d.type === "prism"); };
  data.id = 0;
  lens.table.addRow(data, true, row).then(function (inserted) {
    var next = row.getData();
    if (isElement(data) && isElement(next)) {
      var gap = Object.assign(blankRow("index"), { description: "air", index: 1, thickness: 0 });
      return lens.table.addRow(gap, false, inserted).then(function () { return inserted; });
    }
    return inserted;
  }).then(function (inserted) {
    afterLensRowsMoved();
    try { lens.table.deselectRow(); inserted.select(); } catch (e) { /* not selectable */ }
  });
}

/* --- the selected row of the lens prescription --------------------------------------------------------------------- */

function selectedLensRow () {
  var sel = lens.table.getSelectedRows();
  return sel.length ? sel[0] : null;
}

function managerSelectionChanged () {
  var label = document.getElementById("manager-selected");
  if (!label || typeof lens === "undefined" || !lens.table) { return; }
  var row = selectedLensRow();
  var n = row ? rowPosition(lens.table, row) + 1 : 0;
  label.textContent = row ? "row " + n + " selected: " + (row.getData().description || row.getData().type) : "no row selected (rows are added at the end)";
  Array.prototype.forEach.call(document.querySelectorAll("[data-needs-row]"), function (b) { b.disabled = !row; });
}

// add a row of the given type at the selected row (or at the end when none is selected)
function addAtSelection (type, where) {
  var row = selectedLensRow();
  var rows = lens.table.getRows();
  var data = blankRow(type);
  if (!row) { insertLensRowAfter(rows[rows.length - 1], data); return; }
  if (where === "before") { insertLensRowBefore(row, data); } else { insertLensRowAfter(row, data); }
}

function deleteRowOf (row, kind) {
  if (kind === "prescription") {
    if (lens.table.getRows().length <= 1) { debugAdd("warning", "rows", "The last row of the prescription cannot be deleted."); return; }
    row.delete();
    afterLensRowsMoved();
  } else if (typeof deleteConstruction === "function") {
    var id = row.getData().id;
    deleteConstruction(id);
    var r = lens.pointsTable.getRow(id);
    if (r) { r.delete(); }
  }
}

// a copy of an object, a little way from the original (an angle or a height further on) so the two can be told apart
function duplicateObjectRow (row) {

  var d = row.getData();
  var ids = lens.pointsTable.getData().map(function (x) { return Number(x.id); });
  var source = sourcesFromTable().filter(function (s) { return s.id === d.id; })[0];
  if (!source) { return; }
  source.id = Math.max.apply(null, ids) + 1;
  delete source.group;                              // a copy of one of a linked group stands alone
  if (isFinite(source.t)) { source.t = source.t + 2; }
  else if (isFinite(source.h)) { source.h = source.h + 0.01; }
  if (isFinite(source.h)) { source.h = -source.h; } // (the file's heights are turned over on the way in)
  addConstruction(source);
  var made = lens.pointsTable.getRow(source.id);
  if (made) { lens.pointsTable.moveRow(made, row, true); }
}

/* --- the page ---------------------------------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {

  if (!document.body.classList.contains("has-manager")) { return; }

  // the buttons, under the model bar
  var group = document.querySelector(".input-group.mb-1, .input-group.mb-3");
  var bar = document.createElement("div");
  bar.id = "manager-bar";
  bar.className = "mb-2";
  bar.innerHTML =
    "<input type=\"file\" id=\"manager-file\" accept=\".lens,.json,.json5,.txt\" style=\"display:none;\">" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" id=\"manager-open\" title=\"Open a .lens prescription from the disk\"><i class=\"fas fa-folder-open\"></i> Open .lens&hellip;</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" id=\"manager-save\" title=\"Save the prescription and objects on show as a .lens file\"><i class=\"fas fa-save\"></i> Save .lens</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" id=\"manager-models\" title=\"Choose one of the models of the app to look at or change\"><i class=\"fas fa-search\"></i> Models&hellip;</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" id=\"manager-new\" title=\"Start a new prescription\"><i class=\"fas fa-file\"></i> New</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" id=\"manager-check\" title=\"Check the prescription for mistakes\"><i class=\"fas fa-check-circle\"></i> Check</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-primary mr-1\" id=\"manager-recompile\" title=\"Check the model is consistent, then build it again from the tables and show it\"><i class=\"fas fa-sync-alt\"></i> Recompile</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary mr-1\" data-toggle=\"modal\" data-target=\"#settingsModal\" title=\"Settings\"><i class=\"fas fa-cog\"></i> Settings</button>" +
    "<span class=\"dropdown d-inline-block mr-1\"><button type=\"button\" class=\"btn btn-sm btn-outline-success dropdown-toggle\" data-toggle=\"dropdown\" title=\"Add a row to the lens prescription at the selected row\"><i class=\"fas fa-plus\"></i> Add row</button>" +
    "<div class=\"dropdown-menu\" id=\"manager-add-menu\">" +
    ["after", "before"].map(function (w) {
      return "<div class=\"row-menu-head\">Insert " + w + " the selected row</div>" +
        [["index", "a medium"], ["sphere", "a surface"], ["thin", "a thin lens"], ["prism", "a prism"], ["stop", "a stop"], ["img", "an image plane"]].map(function (t) {
          return "<button type=\"button\" class=\"dropdown-item\" data-add=\"" + t[0] + "\" data-where=\"" + w + "\">" + t[1] + "</button>"; }).join("");
    }).join("") + "</div></span>" +
    "<span class=\"btn-group btn-group-sm mr-1\">" +
    "<button type=\"button\" class=\"btn btn-outline-secondary\" data-needs-row id=\"manager-dup\" title=\"Duplicate the selected row\"><i class=\"fas fa-clone\"></i></button>" +
    "<button type=\"button\" class=\"btn btn-outline-secondary\" data-needs-row id=\"manager-up\" title=\"Move the selected row up\"><i class=\"fas fa-arrow-up\"></i></button>" +
    "<button type=\"button\" class=\"btn btn-outline-secondary\" data-needs-row id=\"manager-down\" title=\"Move the selected row down\"><i class=\"fas fa-arrow-down\"></i></button>" +
    "<button type=\"button\" class=\"btn btn-outline-danger\" data-needs-row id=\"manager-del\" title=\"Delete the selected row\"><i class=\"fas fa-trash\"></i></button></span>" +
    "<span class=\"dropdown d-inline-block mr-1\"><button type=\"button\" class=\"btn btn-sm btn-outline-secondary dropdown-toggle\" data-toggle=\"dropdown\" title=\"How the diagram and the tables are tiled\"><i class=\"fas fa-th-large\"></i> Layout</button>" +
    "<div class=\"dropdown-menu\" id=\"manager-layout-menu\">" +
    "<div class=\"row-menu-head\" style=\"padding:4px 16px 2px;\">Proportions</div>" +
    "<button type=\"button\" class=\"dropdown-item\" data-preset=\"even\">Diagram and tables</button>" +
    "<button type=\"button\" class=\"dropdown-item\" data-preset=\"diagram\">Large diagram</button>" +
    "<button type=\"button\" class=\"dropdown-item\" data-preset=\"tables\">Large tables</button>" +
    "<div class=\"dropdown-divider\"></div>" +
    "<button type=\"button\" class=\"dropdown-item\" data-preset=\"reset\">Reset layout</button>" +
    "</div></span>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" id=\"manager-debug\" title=\"The debug window: what is wrong with the prescription\"><i class=\"fas fa-bug\"></i> Debug<span id=\"debug-badge\" class=\"badge badge-secondary ml-1\">0</span></button>";
  if (group) { group.insertAdjacentElement("afterend", bar); } else { document.body.insertBefore(bar, document.body.firstChild); }

  // the description of the model, read from the lens file and kept with it when it is saved
  var panel0 = document.createElement("div");
  panel0.id = "manager-meta";
  panel0.className = "mb-2";
  var fields = META_FIELDS.map(function (f) {
    var control = f[2] === "area"
      ? "<textarea class=\"form-control form-control-sm\" rows=\"2\" data-meta=\"" + f[0] + "\"></textarea>"
      : "<input type=\"text\" class=\"form-control form-control-sm\" data-meta=\"" + f[0] + "\">";
    return "<div class=\"meta-field meta-" + f[0] + "\"><label>" + f[1] + "</label>" + control + "</div>";
  }).join("");
  panel0.innerHTML = fields;
  bar.insertAdjacentElement("afterend", panel0);
  Array.prototype.forEach.call(panel0.querySelectorAll("[data-meta]"), function (box) {
    box.addEventListener("input", function () { managerMeta[box.getAttribute("data-meta")] = box.value; });
  });


  // --- the tiles: the diagram on top, the tables below, the drawer along the bottom (Split.js) ---
  var LAYOUT_KEY = "sovs.manager.layout.v3";
  var layout = { v: MGR_SIZES.v.slice(), h: MGR_SIZES.h.slice(), t: MGR_SIZES.t.slice(), metaOpen: false };
  try { var saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)); if (saved) { layout = Object.assign(layout, saved); } } catch (e) {}
  function saveLayout () { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (e) {} }
  function nudge () { try { window.dispatchEvent(new Event("resize")); } catch (e) {} }

  var container = document.querySelector(".container.app-wide");
  var rows = container ? container.querySelectorAll(":scope > .row") : [];
  var diagramRow = rows[1], tabsRow = rows[2];
  var presTab = document.getElementById("prescription-tab"), objTab = document.getElementById("objects-images-tab");
  var summaryTab = document.getElementById("summary-tab");

  var shell = document.createElement("div");
  shell.id = "mgr-shell";
  shell.innerHTML =
    "<div id=\"mgr-top\" class=\"mgr-pane\"><div id=\"mgr-diagram\" class=\"mgr-pane\"></div><div id=\"mgr-summary\" class=\"mgr-pane\"></div></div>" +
    "<div id=\"mgr-tables\" class=\"mgr-pane\"><div id=\"mgr-prescription\" class=\"mgr-pane\"></div><div id=\"mgr-objects\" class=\"mgr-pane\"></div></div>" +
    "<div id=\"mgr-drawer\" class=\"mgr-pane\" data-view=\"debug\">" +
      "<div id=\"mgr-drawer-tabs\"><button type=\"button\" data-view=\"debug\" class=\"active\">Debug</button></div>" +
      "<div id=\"mgr-drawer-body\"></div></div>";
  if (container && diagramRow) { container.insertBefore(shell, diagramRow); }

  document.getElementById("mgr-diagram").appendChild(diagramRow);
  if (presTab) { document.getElementById("mgr-prescription").appendChild(presTab); }
  if (objTab)  { document.getElementById("mgr-objects").appendChild(objTab); }
  if (summaryTab) { document.getElementById("mgr-summary").appendChild(summaryTab); }
  if (tabsRow) { tabsRow.style.display = "none"; }

  Array.prototype.forEach.call(shell.querySelectorAll("#mgr-drawer-tabs button"), function (t) {
    t.addEventListener("click", function () {
      showDrawer(t.getAttribute("data-view"));
      if (drawerSize() < 12) { toggleDebug(true); }
    });
  });

  function startSplit () {
    if (typeof Split !== "function") { debugAdd("warning", "page", "Split.js did not load: the panes cannot be resized."); return; }
    function cut (key) {
      return function () { layout[key] = ({ v: mgrSplitV, h: mgrSplitH, t: mgrSplitT })[key].getSizes(); saveLayout(); mgrRedraw(); };
    }
    mgrSplitV = Split(["#mgr-top", "#mgr-tables", "#mgr-drawer"], {
      direction: "vertical", sizes: layout.v, minSize: [60, 40, 30], gutterSize: 8, snapOffset: 0,
      onDragEnd: cut("v")
    });
    mgrSplitT = Split(["#mgr-diagram", "#mgr-summary"], {
      direction: "horizontal", sizes: layout.t, minSize: [60, 60], gutterSize: 8, snapOffset: 0,
      onDragEnd: cut("t")
    });
    mgrSplitH = Split(["#mgr-prescription", "#mgr-objects"], {
      direction: "horizontal", sizes: layout.h, minSize: [60, 60], gutterSize: 8, snapOffset: 0,
      onDragEnd: cut("h")
    });
    fitManagerHeights();
    mgrRedraw();
  }
  fitManagerHeights();
  startSplit();
  setTimeout(function () { lastShellHeight = -1; fitManagerHeights(); mgrRedraw(); }, 1200);

  // --- one window takes over: the button in the corner of each pane (or Esc) puts it full size and back again ---
  var maximised = null, beforeMax = null;
  function maxButtons () {
    Array.prototype.forEach.call(document.querySelectorAll(".mgr-max"), function (b) {
      var on = b.getAttribute("data-max") === maximised;
      b.classList.toggle("active", on);
      b.title = on ? "Back to the layout (Esc)" : "Take over the window";
      b.innerHTML = "<i class=\"fas fa-" + (on ? "compress-alt" : "expand-alt") + "\"></i>";
    });
  }
  // the diagram and the summary stay in view when a table is the one being worked on ("focus"): they are kept as a strip
  function maximise (which) {
    if (!mgrSplitV || !mgrSplitH || !mgrSplitT) { return; }
    if (maximised) {                                           // put things back
      var was = maximised; maximised = null;
      mgrSplitV.setSizes(beforeMax.v); mgrSplitH.setSizes(beforeMax.h); mgrSplitT.setSizes(beforeMax.t);
      maxButtons(); mgrRedraw();
      if (was === which) { return; }                           // (a different window asked: go on to take over)
    }
    beforeMax = { v: mgrSplitV.getSizes(), h: mgrSplitH.getSizes(), t: mgrSplitT.getSizes() };
    maximised = which;
    if (which === "diagram")       { mgrSplitV.setSizes([88, 8, 4]); mgrSplitT.setSizes([94, 6]); }
    else if (which === "summary")  { mgrSplitV.setSizes([70, 26, 4]); mgrSplitT.setSizes([36, 64]); }   // (a lesser zoom: the diagram stays in view)
    else if (which === "drawer")   { mgrSplitV.setSizes([4, 4, 92]); }
    else {
      mgrSplitV.setSizes([30, 66, 4]);                         // diagram and summary still there, above
      mgrSplitH.setSizes(which === "prescription" ? [94, 6] : [6, 94]);
    }
    maxButtons(); mgrRedraw();
  }
  [["mgr-diagram", "diagram"], ["mgr-summary", "summary"], ["mgr-prescription", "prescription"], ["mgr-objects", "objects"]].forEach(function (p) {
    var host = document.getElementById(p[0]);
    if (!host) { return; }
    var b = document.createElement("button");
    b.type = "button"; b.className = "mgr-max"; b.setAttribute("data-max", p[1]);
    b.addEventListener("click", function () { maximise(p[1]); });
    host.appendChild(b);
  });
  var tabsBar = document.getElementById("mgr-drawer-tabs");
  if (tabsBar) {
    var db = document.createElement("button");
    db.type = "button"; db.className = "mgr-max"; db.setAttribute("data-max", "drawer"); db.style.marginLeft = "auto";
    db.addEventListener("click", function () { maximise("drawer"); });
    tabsBar.appendChild(db);
  }
  maxButtons();
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && maximised && !document.querySelector(".modal.show")) { maximise(maximised); }
  });

  // the layout menu: ready-made proportions
  document.getElementById("manager-layout-menu").addEventListener("click", function (e) { e.stopPropagation(); });
  Array.prototype.forEach.call(document.querySelectorAll("#manager-layout-menu [data-preset]"), function (b) {
    b.addEventListener("click", function () {
      var presets = { even: [[46, 40, 14], [58, 42], [62, 38]], diagram: [[66, 26, 8], [58, 42], [72, 28]],
                      tables: [[26, 60, 14], [58, 42], [62, 38]], reset: [MGR_SIZES.v, MGR_SIZES.h, MGR_SIZES.t] };
      var chosen = presets[b.getAttribute("data-preset")];
      if (!chosen || !mgrSplitV) { return; }
      layout.v = chosen[0].slice(); layout.h = chosen[1].slice(); layout.t = chosen[2].slice();
      mgrSplitV.setSizes(layout.v); mgrSplitH.setSizes(layout.h); mgrSplitT.setSizes(layout.t); saveLayout(); mgrRedraw();
    });
  });
  function applyLayout () { saveLayout(); }

  if (typeof ResizeObserver === "function") {
    var watcher = new ResizeObserver(function () { lastShellHeight = -1; fitManagerHeights(); });
    watcher.observe(bar); watcher.observe(panel0);
  }
  // the grids follow their panes: a table is laid out again whenever its pane changes size (a window pulled wide, a gutter dragged)
  if (typeof ResizeObserver === "function") {
    var tableTimer = null;
    var tableWatcher = new ResizeObserver(function () {
      clearTimeout(tableTimer);
      tableTimer = setTimeout(function () {
        try { lens.table.redraw(true); lens.pointsTable.redraw(true); } catch (e) { /* tables not built yet */ }
      }, 40);
    });
    ["mgr-prescription", "mgr-objects"].forEach(function (id) { var el = document.getElementById(id); if (el) { tableWatcher.observe(el); } });
  }

  var file = document.getElementById("manager-file");
  document.getElementById("manager-open").addEventListener("click", function () { file.value = ""; file.click(); });
  file.addEventListener("change", function () { if (file.files && file.files[0]) { openLensFile(file.files[0]); } });
  document.getElementById("manager-save").addEventListener("click", saveLensFile);
  document.getElementById("manager-new").addEventListener("click", newLens);
  document.getElementById("manager-models").addEventListener("click", function () { $("#modelModal").modal("show"); });
  document.getElementById("manager-check").addEventListener("click", function () { checkPrescription(); toggleDebug(true); });
  // units: the distance units selector of the prescription tab lives in the top panel here
  var units = document.getElementById("distance-unit-selector");
  if (units) {
    var wrap = document.createElement("span");
    wrap.className = "form-inline d-inline-flex align-items-center ml-1";
    wrap.innerHTML = "<label class=\"small text-muted mb-0 mr-1\" for=\"distance-unit-selector\">Units</label>";
    units.style.display = "inline-block";
    wrap.appendChild(units);
    bar.insertBefore(wrap, document.getElementById("manager-debug"));
  }
  var detailsBtn = document.createElement("button");
  detailsBtn.type = "button"; detailsBtn.id = "manager-details"; detailsBtn.className = "btn btn-sm btn-outline-secondary ml-1";
  detailsBtn.title = "Show or hide the description of the model (category, keywords, source, description)";
  detailsBtn.innerHTML = "<i class=\"fas fa-info-circle\"></i> Details";
  bar.insertBefore(detailsBtn, document.getElementById("manager-debug"));
  function applyDetails () {
    panel0.classList.toggle("meta-collapsed", !layout.metaOpen);
    detailsBtn.classList.toggle("active", !!layout.metaOpen);
    setTimeout(nudge, 50);
  }
  detailsBtn.addEventListener("click", function () { layout.metaOpen = !layout.metaOpen; applyDetails(); applyLayout(); });
  applyDetails();
  var sel = document.createElement("span");
  sel.id = "manager-selected"; sel.className = "small text-muted ml-2";

  // the row tools live in a bar at the head of the lens prescription itself: Add row, and to its right the buttons
  // that act on the selected row
  var presPane = document.getElementById("prescription-tab");
  var addDrop = document.getElementById("manager-add-menu").parentNode;
  var rowButtons = document.getElementById("manager-dup").parentNode;
  if (presPane) {
    var rowbar = document.createElement("div");
    rowbar.id = "manager-rowbar";
    rowbar.appendChild(addDrop);
    rowbar.appendChild(rowButtons);
    rowbar.appendChild(sel);
    presPane.insertBefore(rowbar, presPane.firstChild);
  }
  // the same bar at the head of the objects and images: New, and to its right the buttons that act on the object in focus
  var objPane = document.getElementById("objects-images-tab");
  var objAdd = document.getElementById("lens-points-add-row");
  if (objPane && objAdd) {
    var objBar = document.createElement("div");
    objBar.id = "manager-objbar";
    objBar.className = "manager-bar-tools";
    var drop = objAdd.parentNode;
    objAdd.className = "btn btn-sm btn-outline-success dropdown-toggle";
    objAdd.innerHTML = "<i class=\"fas fa-plus\"></i> Add object";
    objBar.appendChild(drop);
    var tools = document.createElement("span");
    tools.className = "btn-group btn-group-sm";
    tools.innerHTML =
      "<button type=\"button\" class=\"btn btn-outline-secondary\" id=\"manager-obj-dup\" title=\"Duplicate the object in focus (click a row to focus it)\"><i class=\"fas fa-clone\"></i></button>" +
      "<button type=\"button\" class=\"btn btn-outline-secondary\" id=\"manager-obj-up\" title=\"Move the object in focus up\"><i class=\"fas fa-arrow-up\"></i></button>" +
      "<button type=\"button\" class=\"btn btn-outline-secondary\" id=\"manager-obj-down\" title=\"Move the object in focus down\"><i class=\"fas fa-arrow-down\"></i></button>" +
      "<button type=\"button\" class=\"btn btn-outline-danger\" id=\"manager-obj-del\" title=\"Delete the object in focus\"><i class=\"fas fa-trash\"></i></button>";
    objBar.appendChild(tools);
    var objLabel = document.createElement("span");
    objLabel.id = "manager-obj-selected"; objLabel.className = "small text-muted";
    objBar.appendChild(objLabel);
    objPane.insertBefore(objBar, objPane.firstChild);

    var focusedObjectRow = function () {
      if (typeof focusedObjectId === "undefined" || focusedObjectId === null) { return null; }
      return lens.pointsTable.getRow(focusedObjectId) || null;
    };
    window.managerObjectFocusChanged = function () {
      var row = null;
      try { row = focusedObjectRow(); } catch (e) { /* table not ready */ }
      objLabel.textContent = row ? "object " + row.getData().id + " in focus: " + (row.getData().description || row.getData().type || "") : "no object in focus (click a row)";
      Array.prototype.forEach.call(objBar.querySelectorAll("#manager-obj-dup, #manager-obj-up, #manager-obj-down, #manager-obj-del"), function (b) { b.disabled = !row; });
    };
    var withObject = function (fn) { return function () { var r = focusedObjectRow(); if (r) { fn(r); } window.managerObjectFocusChanged(); }; };
    document.getElementById("manager-obj-dup").addEventListener("click", withObject(function (r) { duplicateObjectRow(r); }));
    document.getElementById("manager-obj-up").addEventListener("click", withObject(function (r) {
      var rows = lens.pointsTable.getRows(), i = rowPosition(lens.pointsTable, r);
      if (i > 0) { lens.pointsTable.moveRow(r, rows[i - 1], false); }
    }));
    document.getElementById("manager-obj-down").addEventListener("click", withObject(function (r) {
      var rows = lens.pointsTable.getRows(), i = rowPosition(lens.pointsTable, r);
      if (i < rows.length - 1) { lens.pointsTable.moveRow(r, rows[i + 1], true); }
    }));
    document.getElementById("manager-obj-del").addEventListener("click", withObject(function (r) { deleteRowOf(r, "objects"); }));
    // the focus follows a click on a row (setFocusedObject, settings.js)
    if (typeof setFocusedObject === "function") {
      var originalFocus = setFocusedObject;
      setFocusedObject = function (id) { originalFocus(id); window.managerObjectFocusChanged(); };
    }
    setInterval(window.managerObjectFocusChanged, 1500);   // objects come and go with the model
    setTimeout(window.managerObjectFocusChanged, 1000);
  }

  Array.prototype.forEach.call(document.querySelectorAll("#manager-add-menu [data-add]"), function (b) {
    b.addEventListener("click", function () { addAtSelection(b.getAttribute("data-add"), b.getAttribute("data-where")); });
  });
  function withSelected (fn) { return function () { var r = selectedLensRow(); if (r) { fn(r); } }; }
  document.getElementById("manager-dup").addEventListener("click", withSelected(function (r) { insertLensRowAfter(r, JSON.parse(JSON.stringify(r.getData()))); }));
  document.getElementById("manager-up").addEventListener("click", withSelected(function (r) {
    var rows = lens.table.getRows(), i = rowPosition(lens.table, r);
    if (i > 0) { lens.table.moveRow(r, rows[i - 1], false); afterLensRowsMoved(); }
  }));
  document.getElementById("manager-down").addEventListener("click", withSelected(function (r) {
    var rows = lens.table.getRows(), i = rowPosition(lens.table, r);
    if (i < rows.length - 1) { lens.table.moveRow(r, rows[i + 1], true); afterLensRowsMoved(); }
  }));
  document.getElementById("manager-del").addEventListener("click", withSelected(function (r) { deleteRowOf(r, "prescription"); managerSelectionChanged(); }));
  setTimeout(managerSelectionChanged, 1000);

  document.getElementById("manager-recompile").addEventListener("click", recompileLens);
  document.getElementById("manager-debug").addEventListener("click", function () { toggleDebug(); });

  // the debug window, along the bottom of the page
  var panel = document.createElement("div");
  panel.id = "debug-panel";
  panel.innerHTML =
    "<div class=\"debug-head\"><strong>Debug</strong>" +
    "<select id=\"debug-show\" class=\"custom-select custom-select-sm\" style=\"width:auto;\"><option value=\"all\">everything</option><option value=\"error\">errors</option><option value=\"warning\">warnings</option><option value=\"info\">notes</option></select>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" id=\"debug-copy\">Copy</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" id=\"debug-clear\">Clear</button>" +
    "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" id=\"debug-close\" title=\"Fold the drawer away\">&times;</button></div>" +
    "<div id=\"debug-list\"></div>";
  var drawerBody = document.getElementById("mgr-drawer-body");
  if (drawerBody) { drawerBody.insertBefore(panel, drawerBody.firstChild); } else { document.body.appendChild(panel); }
  showDrawer("debug");
  document.getElementById("debug-show").addEventListener("change", renderDebug);
  document.getElementById("debug-clear").addEventListener("click", function () { managerLog = []; renderDebug(); });
  document.getElementById("debug-close").addEventListener("click", function () { toggleDebug(false); });
  document.getElementById("debug-copy").addEventListener("click", function () {
    var text = managerLog.map(function (e) { return e.time.toISOString() + "  " + e.level + "  " + e.source + (e.row != null ? "  row " + e.row : "") + "  " + e.message; }).join("\n");
    if (navigator.clipboard) { navigator.clipboard.writeText(text); }
  });
  renderDebug();

  // what the page itself reports: errors thrown anywhere, and the optics' own complaints
  window.addEventListener("error", function (e) { debugAdd("error", "script", (e.message || "error") + (e.filename ? "  (" + e.filename.split("/").pop() + ":" + e.lineno + ")" : "")); });
  window.addEventListener("unhandledrejection", function (e) { debugAdd("error", "script", "unhandled: " + (e.reason && e.reason.message ? e.reason.message : e.reason)); });
  var originalError = console.error;
  console.error = function () {
    debugAdd("error", "console", Array.prototype.slice.call(arguments).map(String).join(" "));
    return originalError.apply(console, arguments);
  };

  // the optics: an analysis that throws is a prescription that cannot be traced - say so, then carry on as before
  if (typeof Optics !== "undefined" && typeof Optics.analyze === "function") {
    var analyze = Optics.analyze;
    Optics.analyze = function () {
      try { return analyze.apply(Optics, arguments); }
      catch (e) { debugAdd("error", "optics", "The prescription could not be analysed: " + (e && e.message ? e.message : e)); toggleDebug(true); throw e; }
    };
  }

  // every change to the prescription: look at it again
  if (typeof updatePrescriptionView === "function") {
    var update = updatePrescriptionView;
    window.updatePrescriptionView = updatePrescriptionView = function () {
      var result = update.apply(this, arguments);
      fillMeta();
      checkPrescription();
      return result;
    };
  }
});
