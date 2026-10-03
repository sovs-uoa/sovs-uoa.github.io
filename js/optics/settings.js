/* ---------------------------------------------------------------------------------------------------------------

  ADVANCED MATERIALS - the buttons and the plumbing  (the model itself is in materials.js)

  What the user sees, in one paragraph: turn on "Advanced materials" in Settings (the gear) and the Ref. Index
  column becomes a Material column (still showing each material's nominal, white-light index - the d line); each
  object in the Objects and Images table gets a coloured wavelength cell, and is traced at that wavelength; the
  Summary gets its own coloured wavelength selector. With it off, or with everything left on the d line, nothing
  differs from a plain prescription.

  What this file does underneath: the app keeps ONE lens analysis in the global `renderableLens` (the nominal
  one - everything the prescription draws, the cardinal points, the pupils). An object at any other wavelength
  needs the same lens analysed with that wavelength's indices, so for the duration of anything that object
  computes - being refreshed, redrawn, dragged - `renderableLens` is swapped for that wavelength's analysis and
  then put back (withLensAt). The constructions themselves never need to know.

--------------------------------------------------------------------------------------------------------------- */


function escapeHTML (text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
  });
}

// "d 587.6" - the chip text for a wavelength (name only if it has one in the list)
function wavelengthText (nm) {
  var w = SovsSettings.entryFor(nm);
  return (w.name ? w.name + " " : "") + w.nm;
}

function wavelengthChipHTML (nm) {
  var w = SovsSettings.entryFor(nm);
  return "<span title=\"" + w.nm + " nm\"><span class=\"wavelength-swatch\" style=\"background:" + w.color + ";\"></span>" + escapeHTML(wavelengthText(nm)) + "</span>";
}


/* --- tracing at a wavelength --------------------------------------------------------------------------------- */

var nominalLens        = null;   // the analysis of the table as typed - what the prescription draws
var lensAnalysisCache  = {};     // wavelength (nm) -> analysis; emptied whenever the prescription changes
var currentLensWavelength;       // the wavelength of whatever is being computed / drawn right now (undefined: none)

// called by updatePrescriptionView() each time it has re-analysed the table
function noteNominalLens (analysis) {
  nominalLens       = analysis;
  lensAnalysisCache = {};
}

function lensAt (nm) {

  if (!SovsSettings.advancedMaterials || isNominalWavelength(nm) || !nominalLens) { return nominalLens; }

  var key = String(nm);
  if (!lensAnalysisCache[key]) {

    // Optics.analyze reads the bare global `lensTable` internally as well as its argument
    var savedTable = lensTable;
    lensTable = effectiveLensTable(lens.table.getData(), nm);
    try     { lensAnalysisCache[key] = Optics.analyze(lensTable); }
    finally { lensTable = savedTable; }
  }
  return lensAnalysisCache[key];
}

// Run fn with the global renderableLens swapped for the analysis at nm, and note which wavelength is "current" so
// drawing code can colour itself (see beamShadeColor). A call with no wavelength of its own - e.g. something a
// construction does to itself while it is still being built - simply inherits the wavelength it is already inside.
// A no-op unless advanced mode is on.
function withLensAt (nm, fn, thisArg, args) {

  if (!SovsSettings.advancedMaterials || !nominalLens) { return fn.apply(thisArg, args || []); }

  var savedLens = renderableLens;
  var savedNm   = currentLensWavelength;
  var useNm     = isFinite(nm) ? nm : savedNm;

  currentLensWavelength = useNm;
  renderableLens        = lensAt(useNm);

  try     { return fn.apply(thisArg, args || []); }
  finally { renderableLens = savedLens; currentLensWavelength = savedNm; }
}

// Make every construction compute through its own wavelength's lens, however it is poked: its public methods
// are wrapped here, and the drag handlers (free functions that compute straight from renderableLens before
// calling the construction) are wrapped to find the construction they belong to. Installed once, after all the
// construction scripts have loaded and before application.js starts using them.
function installLensWavelengthWrappers () {

  var classes = [];
  if (typeof PointSourceConstruction !== "undefined") { classes.push(PointSourceConstruction); }
  if (typeof ParallelBeamConstruction !== "undefined") { classes.push(ParallelBeamConstruction); }
  if (typeof AfocalBeamConstruction !== "undefined")   { classes.push(AfocalBeamConstruction); }

  var methods = [ "refresh", "updateRays", "draw", "setInputRays", "setPinToApertureStop", "setBeamWidth",
                  "drawPointSourceConstruction", "drawBeamConstruction", "drawAfocalConstruction" ];

  classes.forEach(function (Class) {
    if (Class.prototype.__lensWrapped) { return; }
    Class.prototype.__lensWrapped = true;

    methods.forEach(function (name) {
      var original = Class.prototype[name];
      if (typeof original !== "function") { return; }
      Class.prototype[name] = function () {
        return withLensAt(this.WavelengthNm, original, this, arguments);
      };
    });
  });

  // the construction a drag handler is acting on: an AnglePicker has .parent, a dragged point carries it in its data
  function constructionOf (thing) {
    if (!thing) { return null; }
    if (thing.parent && typeof thing.parent.getId === "function") { return thing.parent; }
    if (typeof thing.data === "function") {
      var info = thing.data("data-attr") || thing.data("data-attr-info");
      if (info && info.parent && typeof info.parent.getId === "function") { return info.parent; }
    }
    return null;
  }

  [ "onmove", "onAfocalMove", "movePointSource", "moveBeamImagePoint", "moveBeam" ].forEach(function (name) {

    var original = window[name];
    if (typeof original !== "function" || original.__lensWrapped) { return; }

    var wrapped = function () {
      var owner = constructionOf(this);
      if (owner && typeof owner.getId === "function") { setFocusedObject(owner.getId()); }   // the row of what is being dragged
      return withLensAt(owner ? owner.WavelengthNm : undefined, original, this, arguments);
    };
    wrapped.__lensWrapped = true;
    window[name] = wrapped;
  });
}


/* --- the wavelength cell in the Objects and Images table ------------------------------------------------------ */

// plain text at the normal size, the cell itself painted in the wavelength's colour
function wavelengthCellFormatter (cell, formatterParams, onRendered) {

  if (cell.getRow().getData().type !== "object") { return ""; }   // only objects have a wavelength

  var nm = Number(cell.getValue()) || SovsSettings.NOMINAL_NM;
  var w  = SovsSettings.entryFor(nm);

  var el = cell.getElement();
  el.style.background = w.color;
  el.style.color      = readableTextColor(w.color);
  var tip             = (w.name ? w.name + " line, " : "") + w.common;   // e.g. "d line, Yellow"
  el.title            = tip;
  if (onRendered) { onRendered(function () { el.title = tip; }); }

  return String(w.nm);
}

// A table of the wavelengths in the list - colour name, line, nm and a swatch in the colour itself - popped up
// under anchorEl. Calls onPick(nm) for a choice, onClose() if dismissed (click elsewhere, Esc).
function openWavelengthPalette (anchorEl, current, onPick, onClose) {

  // Order: the wavelengths the objects are using, in the order of the Objects and Images table; a divider; then
  // Custom (any wavelength you type) and the rest of the list in numerical order.
  var listed = SovsSettings.wavelengths.slice().sort(function (a, b) { return a.nm - b.nm; });
  function entryOf (nm) {
    var hit = listed.filter(function (w) { return Math.abs(w.nm - nm) < 0.05; })[0];
    return hit || { name: "", nm: nm };     // one removed from the list (or typed in) is still selectable
  }

  var used = [];
  if (typeof lens !== "undefined" && lens.pointsTable) {
    lens.pointsTable.getData().forEach(function (d) {
      if (d.type !== "object") { return; }
      var nm = Number(d.wavelength) || SovsSettings.NOMINAL_NM;
      if (!used.some(function (u) { return Math.abs(u - nm) < 0.05; })) { used.push(nm); }
    });
  }
  var usedEntries = used.map(entryOf);
  var rest = listed.filter(function (w) { return !used.some(function (u) { return Math.abs(u - w.nm) < 0.05; }); });
  if (!used.length && !listed.some(function (w) { return Math.abs(w.nm - current) < 0.05; })) { usedEntries.push(entryOf(current)); }

  var palette = document.createElement("div");
  palette.className = "wavelength-palette";

  var table = document.createElement("table");
  table.innerHTML = "<thead><tr><th>Colour</th><th>Line</th><th>nm</th><th></th></tr></thead>";
  var tbody = document.createElement("tbody");
  table.appendChild(tbody);
  palette.appendChild(table);

  var done = false;
  function finish (nm) {
    if (done) { return; }
    done = true;
    document.removeEventListener("mousedown", outside, true);
    document.removeEventListener("keydown", escape, true);
    if (palette.parentNode) { palette.parentNode.removeChild(palette); }
    if (nm === undefined) { if (onClose) { onClose(); } } else { onPick(nm); }
  }
  function outside (e) { if (!palette.contains(e.target)) { finish(); } }
  function escape (e) { if (e.key === "Escape") { finish(); } }

  function addEntry (w) {
    var color  = wavelengthToColor(w.nm);
    var common = w.common || commonColorName(w.nm);
    var tr = document.createElement("tr");
    tr.className = Math.abs(w.nm - current) < 0.05 ? "selected" : "";
    tr.innerHTML = "<td>" + escapeHTML(common) + "</td><td>" + escapeHTML(w.name) + "</td><td class=\"nm\">" + w.nm +
                   "</td><td class=\"swatch\" style=\"background:" + color + ";\"></td>";
    tr.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); finish(w.nm); });
    tbody.appendChild(tr);
  }

  function addDivider () {
    var tr = document.createElement("tr");
    tr.className = "divider";
    tr.innerHTML = "<td colspan=\"4\"></td>";
    tbody.appendChild(tr);
  }

  usedEntries.forEach(addEntry);
  if (usedEntries.length) { addDivider(); }

  // Custom: type any wavelength; the swatch previews its colour
  var custom = document.createElement("tr");
  custom.className = "custom";
  custom.innerHTML = "<td colspan=\"2\">Custom</td><td class=\"nm\"><input type=\"text\" size=\"5\" placeholder=\"nm\"></td><td class=\"swatch\"></td>";
  var box = custom.querySelector("input"), chip = custom.querySelector(".swatch");
  box.addEventListener("input", function () {
    var nm = parseFloat(box.value);
    chip.style.background = (isFinite(nm) && nm >= 200 && nm <= 3000) ? wavelengthToColor(nm) : "";
  });
  box.addEventListener("keydown", function (e) {
    e.stopPropagation();
    if (e.key === "Enter") {
      var nm = parseFloat(box.value);
      if (isFinite(nm) && nm >= 200 && nm <= 3000) { finish(Math.round(nm * 10) / 10); }
    }
    if (e.key === "Escape") { finish(); }
  });
  tbody.appendChild(custom);

  rest.forEach(addEntry);

  document.body.appendChild(palette);

  var r = anchorEl.getBoundingClientRect();
  var h = palette.offsetHeight;
  var top = (r.bottom + h > window.innerHeight && r.top - h > 0) ? r.top - h : r.bottom;
  palette.style.left = Math.max(0, Math.min(r.left, window.innerWidth - palette.offsetWidth)) + "px";
  palette.style.top  = top + "px";

  document.addEventListener("mousedown", outside, true);
  document.addEventListener("keydown", escape, true);
}

// Clicking the cell pops up that palette; the cell itself keeps showing the current chip meanwhile.
function wavelengthCellEditor (cell, onRendered, success, cancel) {

  var current = Number(cell.getValue()) || SovsSettings.NOMINAL_NM;

  var holder = document.createElement("div");
  holder.tabIndex = 0;
  holder.style.outline = "none";
  holder.textContent = String(current);

  onRendered(function () {
    holder.focus();
    openWavelengthPalette(cell.getElement(), current, success, cancel);
  });

  return holder;
}


/* --- the prescription's Ref. Index column at one chosen wavelength ----------------------------------------------- */

// One wavelength for the whole column: every row with a material shows that material's index at it. This is a
// display of the table, not a change to it - radii, powers and the drawn lens keep the nominal (d line) values.
function indexFormatter (cell) {

  var data = cell.getRow().getData();
  var v    = cell.getValue();

  if (SovsSettings.advancedMaterials && data.type === "index" && data.material) {
    var m = Materials.find(data.material);
    if (m) { v = Materials.indexAt(m, SovsSettings.prescriptionNm); }
  }
  return formatIndex(v);
}

// 3 decimals (1.500, 1.333), and a 4th only when it says something (1.5168) - the same for every row
function formatIndex (v) {

  if (v == null || isNaN(v)) { return ""; }
  var text = Number(v).toFixed(4);
  return text.charAt(text.length - 1) === "0" ? text.slice(0, -1) : text;
}


/* --- columns that only matter when the prescription has something for them ------------------------------------ */

// Surf. R. is only used by surface rows and Base only by prism rows - show each only while the table has one.
function updatePrescriptionColumns () {

  if (typeof lens === "undefined" || !lens.table) { return; }

  var types = {};
  lens.table.getData().forEach(function (d) { types[d.type] = true; });

  var wanted = { radius: !!(types.sphere || types.img), base: !!types.prism };

  Object.keys(wanted).forEach(function (field) {
    var col = lens.table.getColumn(field);
    if (!col) { return; }
    var shown = col.getElement().style.display !== "none";
    if (wanted[field] && !shown) { lens.table.showColumn(field); }
    if (!wanted[field] && shown) { lens.table.hideColumn(field); }
  });
}


// The wavelength button beside the units box: shown in advanced mode, on the Lens Prescription tab only (the
// Objects table has a wavelength for each object, and the Summary its own selector).
function refreshIndexChip () {

  var btn = document.getElementById("prescription-wavelength-btn");
  if (!btn) { return; }

  var onPrescription = document.getElementById("prescription-nav").classList.contains("active");
  btn.style.display = (SovsSettings.advancedMaterials && onPrescription) ? "" : "none";

  var w = SovsSettings.entryFor(SovsSettings.prescriptionNm);
  btn.className = "btn btn-sm mr-2";
  btn.style.background  = w.color;
  btn.style.borderColor = w.color;
  btn.style.color       = readableTextColor(w.color);
  btn.innerHTML = "&lambda; " + escapeHTML(wavelengthText(w.nm)) + " nm &#9662;";
}

function initIndexWavelengthButton () {

  var btn = document.getElementById("prescription-wavelength-btn");
  if (!btn) { return; }

  btn.addEventListener("click", function () {
    openWavelengthPalette(btn, SovsSettings.prescriptionNm, function (nm) {
      SovsSettings.prescriptionNm = nm;
      refreshIndexChip();
      if (lens.table) { lens.table.redraw(true); }
    });
  });

  $('a[data-toggle="tab"]').on("shown.bs.tab", refreshIndexChip);
  refreshIndexChip();
}


/* --- the Summary tab's wavelength selector -------------------------------------------------------------------- */

// the Summary pane is re-rendered from a template on every update, so its selector is put back each time
function attachSummaryWavelengthBar (pane) {

  if (!SovsSettings.advancedMaterials) { return; }

  var cur = SovsSettings.entryFor(SovsSettings.summaryNm);

  var bar = document.createElement("div");
  bar.className = "d-inline-flex align-items-center summary-wavelength";
  bar.innerHTML =
    "<span class=\"text-muted mr-2\">Wavelength</span>" +
    "<button class=\"btn btn-sm\" type=\"button\" title=\"Choose the wavelength the Summary is calculated at\" " +
      "style=\"background:" + cur.color + ";border-color:" + cur.color + ";color:" + readableTextColor(cur.color) + ";\">" +
      escapeHTML(wavelengthText(cur.nm)) + " nm &#9662;</button>";

  var button = bar.querySelector("button");
  button.addEventListener("click", function () {
    openWavelengthPalette(button, SovsSettings.summaryNm, function (nm) {
      SovsSettings.summaryNm = nm;
      if (typeof updateSummaryView === "function" && typeof renderableLens !== "undefined" && renderableLens) { updateSummaryView(); }
    });
  });

  // right beside the "Summary" heading, on the same line
  var heading = pane.querySelector("h4");
  if (heading) {
    heading.style.display = "inline-block";
    heading.style.marginRight = "20px";
    pane.insertBefore(bar, heading.nextSibling);
  } else {
    pane.insertBefore(bar, pane.firstChild);
  }
}


/* --- advanced materials on / off ------------------------------------------------------------------------------ */

// the Add Lens Element dialog's "Value" box takes a material name in advanced mode, a plain index otherwise
function refreshModalIndexInput () {

  var input = document.getElementById("modal-lens-refractive-index");
  var label = document.getElementById("modal-index-label");
  if (!input || !label) { return; }

  if (SovsSettings.advancedMaterials) {
    input.setAttribute("list", "material-options-modal");
    label.textContent = "Material, or refractive index";
  } else {
    input.removeAttribute("list");
    label.textContent = "Value";
  }
}

// something that every wavelength-dependent view shows has changed: re-trace and redraw them all
function applyMaterialsChange () {

  if (typeof lens !== "undefined" && lens.table && typeof updatePrescriptionView === "function") {
    updatePrescriptionView();     // re-analyses, refreshes every object at its own wavelength, redraws the Summary
  }
  if (typeof lens !== "undefined" && lens.pointsTable) { lens.pointsTable.redraw(true); }
}

function setAdvancedMaterials (on) {

  SovsSettings.advancedMaterials = on;

  refreshModalIndexInput();

  if (typeof lens !== "undefined" && lens.table) {
    if (on) { lens.table.showColumn("material"); }
    else    { lens.table.hideColumn("material"); }
  }
  if (typeof lens !== "undefined" && lens.pointsTable) {
    if (on) { lens.pointsTable.showColumn("wavelength"); lens.pointsTable.showColumn("group"); }
    else    { lens.pointsTable.hideColumn("wavelength"); lens.pointsTable.hideColumn("group"); }
  }
  refreshAdvancedOnlyMenuItems();
  refreshIndexChip();
  if (typeof lens !== "undefined" && lens.table) { lens.table.redraw(true); }

  applyMaterialsChange();
}


/* --- the object in focus --------------------------------------------------------------------------------------------- */

// The row of whatever is being worked on - dragged in the diagram, or clicked / edited in the table - is lit up in
// the Objects table, with the rest of its group (they move as one). It is separate from the tick boxes, which
// are the selection for deleting.

var focusedObjectId = null;

function applyFocusClass (row) {

  var el = row.getElement();
  if (!el) { return; }

  var data  = row.getData();
  var focus = focusedObjectId != null && lens.pointsTable &&
              lens.pointsTable.getData().some(function (d) {
                return d.id == focusedObjectId && (d.id == data.id || (d.group && d.group === data.group));
              });
  el.classList.toggle("row-focus", !!focus);
}

function setFocusedObject (id) {

  if (focusedObjectId === id) { return; }
  focusedObjectId = id;
  if (typeof lens !== "undefined" && lens.pointsTable) { lens.pointsTable.getRows().forEach(applyFocusClass); }
}

/* --- white-light groups: objects linked together ---------------------------------------------------------------- */

/*
  A group is a handful of objects (by default one each at the red, green and blue lines) that share a position and
  move as one - drag any of them, or edit its position / angle / beam width, and the others follow. They only differ
  in wavelength, so with Additive beams their overlap adds up to white. A row's "group" field holds the group number
  (undefined for an ordinary object); the link column shows it and a click on the link lets that object go.
*/

var nextGroupId  = 1;
var syncingGroup = false;
var GROUP_COLORS = ["#6f42c1", "#20c997", "#fd7e14", "#e83e8c", "#17a2b8", "#6c757d"];

function groupMates (row) {

  var gid = row.getData().group;
  if (!gid) { return []; }
  return row.getTable().getRows().filter(function (r) { return r !== row && r.getData().group === gid; });
}

// the rows to remove when these are deleted: a group goes as one
function expandSelectionWithGroups (selectedData) {

  var ids = {};
  selectedData.forEach(function (d) {
    ids[d.id] = true;
    if (d.group) {
      lens.pointsTable.getData().forEach(function (o) { if (o.group === d.group) { ids[o.id] = true; } });
    }
  });
  return Object.keys(ids).map(function (id) { return isNaN(id) ? id : Number(id); });
}

// Ungrouped objects show a tick box (tick two to link them); linked
// ones show their group's badge instead.
function groupCellFormatter (cell) {

  var data = cell.getRow().getData();
  var gid  = data.group;

  if (!gid) {
    if (data.type !== "object") { return ""; }
    return "<input type=\"checkbox\" style=\"cursor:pointer;\" " + (data._link ? "checked " : "") + "title=\"Tick two objects to link them so they move as one\">";
  }

  var color = GROUP_COLORS[(gid - 1) % GROUP_COLORS.length];
  return "<span class=\"badge group-lock\" style=\"background:" + color + ";\" title=\"Linked with the other objects in group " + gid +
         " - they move as one. Click to unlink this one.\">" + iconSVG("link", 12) + " " + gid + "</span>";
}

function groupCellClick (e, cell) {

  var row  = cell.getRow();
  var data = row.getData();

  if (!data.group) {
    if (data.type === "object") { row.update({ _link: !data._link }); linkTickedObjects(); }
    return;
  }

  var gid = data.group;
  syncingGroup = true;
  try {
    row.update({ group: undefined });
    var rest = row.getTable().getRows().filter(function (r) { return r.getData().group === gid; });
    if (rest.length === 1) { rest[0].update({ group: undefined }); }   // a group of one is just an object
  } finally { syncingGroup = false; }
  row.getTable().redraw(true);
}

// Called whenever a row of the Objects table changes: bring the rest of its group into line.
function syncGroupFrom (row) {

  if (syncingGroup || !SovsSettings.advancedMaterials) { return; }   // groups sleep while advanced mode is off
  var d = row.getData();
  if (!d.group) { return; }

  var mates = groupMates(row);
  if (mates.length === 0) { return; }

  syncingGroup = true;
  try {
    mates.forEach(function (m) {

      var md  = m.getData();
      var upd = {};
      (d.infinity ? [ "to", "beamwidth" ] : [ "zo", "ho", "beamwidth" ]).forEach(function (f) {
        if (f === "beamwidth" && (d.pin || md.pin)) { return; }   // a pinned beam takes its width from the stop
        if (d[f] !== undefined && md[f] !== d[f]) { upd[f] = d[f]; }
      });
      if (Object.keys(upd).length === 0) { return; }

      m.update(upd);
      rebuildObjectFromRow(m, upd.beamwidth !== undefined);
    });
  } finally { syncingGroup = false; }
}

// redraw one object's construction from what its table row now says (what updateConstruction does for an edited cell)
function rebuildObjectFromRow (row, beamWidthChanged) {

  var data = row.getData();
  var elem = lens.raphael.constructions.filter(function (c) { return c.getId() == data.id; })[0];
  if (!elem) { return; }

  var aPoint = lens.pointsTableHandler.convertRowData([ data ])[0];
  var pt     = { id: aPoint.id, which: "object", z: Number(aPoint.zo), h: Number(aPoint.ho), t: Number(aPoint.to),
                 infinity: aPoint.infinity, type: aPoint.type };

  if (beamWidthChanged && typeof elem.setBeamWidth === "function") { elem.setBeamWidth(Number(aPoint.beamwidth)); }

  inLensWavelength(elem.WavelengthNm, function () {
    var total = renderableLens.total;
    var pair  = Optics.calculateConjugatePairFrom(pt, total);
    updatePointsTable(pt.id, pair);
    elem.setPairData(pair);
    elem.refresh();
  });
}

// add copies of a new object, one per wavelength of the white-light group, linked together
function addWhiteLightGroup (source) {

  var gid = nextGroupId++;
  SovsSettings.groupWavelengths.forEach(function (nm, i) {
    var copy = Object.assign({}, source, { wavelength: nm, group: gid });
    if (i > 0) { globalIndexCounter += 1; copy.id = globalIndexCounter; }
    addConstruction(copy);
  });
}

// menu entries that only make sense with wavelengths (the group item) follow the Advanced materials switch
function refreshAdvancedOnlyMenuItems () {
  Array.prototype.forEach.call(document.querySelectorAll(".advanced-only"), function (el) {
    el.style.display = SovsSettings.advancedMaterials ? "" : "none";
  });

}


// Ticking the box of a second object links the two (a new group; the second takes the first one's position).
// A pending tick is just a mark until then.
function linkTickedObjects () {

  if (!SovsSettings.advancedMaterials) { return; }   // linking objects together is about wavelengths

  var rows = lens.pointsTable.getRows().filter(function (r) {
    var d = r.getData();
    return d.type === "object" && d._link && !d.group;
  });
  if (rows.length < 2) { return; }

  if (rows.some(function (r) { return !!r.getData().infinity !== !!rows[0].getData().infinity; })) {
    rows.forEach(function (r) { r.update({ _link: false }); });
    lens.pointsTable.redraw(true);
    window.alert("Objects can only be linked together if they are all at infinity (beams) or all at a finite distance.");
    return;
  }

  var gid = nextGroupId++;
  syncingGroup = true;
  try {
    rows.forEach(function (r) { r.update({ group: gid, _link: false }); });
  } finally { syncingGroup = false; }

  syncGroupFrom(rows[0]);   // the others join the first one
  lens.pointsTable.redraw(true);
}

// The tick-box column: a box per row that mirrors (and sets) the row's selection, so highlight and tick never disagree.
function selectBoxFormatter (cell) {
  return "<input type=\"checkbox\" style=\"cursor:pointer;\" " + (cell.getRow().isSelected() ? "checked" : "") + ">";
}

function selectBoxClick (e, cell) {
  e.stopPropagation();                  // not also a click on the row, which would toggle it back
  cell.getRow().toggleSelect();
}

// The header of the tick-box column is the delete icon: grey and inactive until something is ticked.
function selectAllTitle () {
  return "<span class=\"table-icon table-icon-delete delete-icon\" title=\"Delete the ticked objects (tick some first)\">" + iconSVG("trash", 18) + "</span>";
}

function selectAllClick (e) {
  if (e.target.closest(".delete-icon") && lens.pointsTable.getSelectedRows().length > 0) { deleteSelectedObjects(); }
}

function refreshSelectBoxes () {

  if (!lens.pointsTable) { return; }   // fires while the table is still being created
  var rows = lens.pointsTable.getRows();
  rows.forEach(function (r) {
    var cell = r.getCell("_selected");
    var box  = cell && cell.getElement().querySelector("input");
    if (box) { box.checked = r.isSelected(); }
  });

  // the delete icon is inactive until something is ticked
  var any = lens.pointsTable.getSelectedRows().length > 0;
  Array.prototype.forEach.call(document.querySelectorAll("#lens-points .delete-icon"), function (el) {
    el.classList.toggle("active", any);
  });

  // ... and so is the Delete Selected button under the table
  var del = document.getElementById("lens-points-del-row");
  if (del) {
    del.disabled = !any;
    del.classList.toggle("btn-danger", any);
    del.classList.toggle("btn-secondary", !any);
  }

}

// Delete the ticked objects. A linked group goes as one, so say so if that takes in objects that were not ticked.
function deleteSelectedObjects () {

  var selected = lens.pointsTable.getSelectedData();
  if (selected.length === 0) { return; }

  var ids = expandSelectionWithGroups(selected);
  if (ids.length > selected.length &&
      !window.confirm("Deleting a linked object also deletes the others linked with it (" + ids.length + " objects in all). Continue?")) { return; }

  ids.forEach(function (id) {
    lens.pointsTable.deleteRow(id);
    deleteConstruction(id);
  });

  refreshSelectBoxes();   // nothing is ticked any more: the Delete button goes inactive
}

/* --- line icons: one set, one size, one stroke -------------------------------------------------------------------- */

var ICON_PATHS = {
  plus:  "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
  funnel: "M22 3H2l8 9.46V19l4 2v-8.54z",
  pin:   "M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
  link:  "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
};

function iconSVG (name, size) {
  return "<svg width=\"" + size + "\" height=\"" + size + "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" " +
         "stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"vertical-align:middle;\"><path d=\"" + ICON_PATHS[name] + "\"/></svg>";
}

/* --- the + icon in a table's top left corner ---------------------------------------------------------------------- */

// A small pop-up list built from the entries of a table's own "New" menu, so the two can never disagree.
function showTableAddMenu (event, menuSelector) {

  var old = document.querySelector(".table-add-menu");
  if (old) { old.parentNode.removeChild(old); }

  var menu = document.createElement("div");
  menu.className = "dropdown-menu show table-add-menu";

  Array.prototype.forEach.call(document.querySelectorAll(menuSelector + " > *"), function (src) {
    if (src.style.display === "none") { return; }
    var item;
    if (src.classList.contains("dropdown-divider")) {
      item = document.createElement("div");
      item.className = "dropdown-divider";
    } else {
      item = document.createElement("a");
      item.className = "dropdown-item";
      item.href = "#";
      item.textContent = src.textContent;
      if (src.classList.contains("disabled")) { item.classList.add("disabled"); }
      item.addEventListener("click", function (e) { e.preventDefault(); close(); src.click(); });
    }
    menu.appendChild(item);
  });

  function close () {
    document.removeEventListener("mousedown", outside, true);
    if (menu.parentNode) { menu.parentNode.removeChild(menu); }
  }
  function outside (e) { if (!menu.contains(e.target)) { close(); } }

  var r = event.target.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = r.left + "px";
  menu.style.top  = r.bottom + "px";
  menu.style.zIndex = 2000;
  document.body.appendChild(menu);
  document.addEventListener("mousedown", outside, true);
}

function addIconHeader (menuSelector, tip) {
  return {
    title: "<span class=\"table-icon table-icon-add\" title=\"" + tip + "\">" + iconSVG("plus", 18) + "</span>",
    headerClick: function (e) { showTableAddMenu(e, menuSelector); }
  };
}


/* --- additive beams ---------------------------------------------------------------------------------------------- */

// Dark diagram with beams that add like light: overlapping red, green and blue come out white. Pure CSS (see
// .additive-beams in optics.css), so it applies to whatever is already drawn.
// Tag the edge lines of every beam, whichever part of the beam they belong to (incoming, between the elements,
// outgoing), so one rule can show or hide them all alike. Dashed construction lines are left alone.
function tagBeamEdges () {

  if (typeof lens === "undefined" || !lens.raphael) { return; }

  lens.raphael.constructions.forEach(function (c) {
    if (!c.cd_set || !c.cd_set.items) { return; }
    c.cd_set.items.forEach(function (item) {
      var node = item.node;
      if (!node || node.tagName !== "path" || node.classList.contains("beam-shade")) { return; }
      var dashed = node.getAttribute("stroke-dasharray");
      if (dashed && dashed !== "none") { return; }
      if (node.getAttribute("stroke") === "none") { return; }
      node.classList.add("beam-edge");
    });
  });
}

var beamEdgeTagging = false;
function scheduleBeamEdgeTagging () {
  if (beamEdgeTagging) { return; }
  beamEdgeTagging = true;
  window.requestAnimationFrame(function () { beamEdgeTagging = false; tagBeamEdges(); });
}

// Appearance: a dark canvas, and on it (only) beams that add like light
function applyCanvasTheme () {
  var dark = SovsSettings.darkCanvas;
  var on   = SovsSettings.additiveBeams && dark;
  Array.prototype.forEach.call(document.querySelectorAll("#lens-container"), function (el) {
    el.classList.toggle("dark-canvas", dark);
    el.classList.toggle("additive-beams", on);
    el.classList.toggle("beam-edges-off", !SovsSettings.beamEdges);

    // beams are redrawn all the time: tag the new edge lines as they appear
    if (!el.__edgeObserver && window.MutationObserver) {
      el.__edgeObserver = new MutationObserver(scheduleBeamEdgeTagging);
      el.__edgeObserver.observe(el, { childList: true, subtree: true });
    }
  });
  scheduleBeamEdgeTagging();
}

function applyAdditiveBeams () { applyCanvasTheme(); }

function setBeamEdges (on) {
  SovsSettings.beamEdges = on;
  applyCanvasTheme();
}

function setDarkCanvas (dark) {
  SovsSettings.darkCanvas = dark;
  syncAppearanceControls();
  applyCanvasTheme();
}

// additive beams need the dark canvas: the tick boxes under Appearance follow that
function syncAppearanceControls () {
  var dark = SovsSettings.darkCanvas;
  var radioDark  = document.getElementById("setting-canvas-dark");
  var radioLight = document.getElementById("setting-canvas-light");
  if (radioDark)  { radioDark.checked  = dark; }
  if (radioLight) { radioLight.checked = !dark; }
  ["setting-additive-beams", "setting-beam-edges"].forEach(function (id) {
    var box = document.getElementById(id);
    if (box) { box.disabled = !dark; }
  });
}

function setAdditiveBeams (on) {
  SovsSettings.additiveBeams = on;
  applyCanvasTheme();
}


/* --- the Wavelengths dialog ------------------------------------------------------------------------------------ */

var wavelengthDraft = [];   // edited in the dialog, only kept if "Done" is pressed

function renderWavelengthRows () {

  var body = document.getElementById("wavelength-rows");
  body.innerHTML = "";

  wavelengthDraft.forEach(function (w, i) {

    var row = document.createElement("tr");
    row.innerHTML =
      "<td><input type=\"text\" class=\"form-control form-control-sm\" value=\"" + escapeHTML(w.common) + "\" maxlength=\"16\" aria-label=\"Colour name\"></td>" +
      "<td><input type=\"text\" class=\"form-control form-control-sm\" value=\"" + escapeHTML(w.name) + "\" maxlength=\"12\" aria-label=\"Line name\"></td>" +
      "<td><input type=\"number\" class=\"form-control form-control-sm\" value=\"" + w.nm + "\" min=\"200\" max=\"3000\" step=\"0.1\" aria-label=\"Wavelength (nm)\"></td>" +
      "<td class=\"text-center\" style=\"vertical-align:middle;\"><input type=\"checkbox\" " + (w.group ? "checked " : "") + "aria-label=\"In the white-light group\"></td>" +
      "<td style=\"vertical-align:middle;\"><span class=\"wavelength-swatch\" style=\"background:" + wavelengthToColor(w.nm) + ";\"></span></td>" +
      "<td><button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" title=\"Remove\">&times;</button></td>";

    var inputs = row.querySelectorAll("input[type=text], input[type=number]");
    row.querySelector("input[type=checkbox]").addEventListener("change", function (e) { w.group = e.target.checked; });
    inputs[0].addEventListener("input", function () { w.common = inputs[0].value; });
    inputs[1].addEventListener("input", function () { w.name = inputs[1].value; });
    inputs[2].addEventListener("input", function () {
      w.nm = parseFloat(inputs[2].value);
      row.querySelector(".wavelength-swatch").style.background = wavelengthToColor(w.nm);
    });
    row.querySelector("button").addEventListener("click", function () {
      if (wavelengthDraft.length > 1) { wavelengthDraft.splice(i, 1); renderWavelengthRows(); }
    });

    body.appendChild(row);
  });
}

function openWavelengthsDialog () {

  // Bootstrap 4 cannot stack modals - close Settings first, then open this one
  $("#settingsModal").one("hidden.bs.modal", function () {
    wavelengthDraft = SovsSettings.wavelengths.map(function (w) { return { common: w.common, name: w.name, nm: w.nm, group: !!w.group }; });
    renderWavelengthRows();
    $("#wavelengthsModal").modal("show");
  }).modal("hide");
}

function addWavelengthRow () {
  wavelengthDraft.push({ common: commonColorName(550), name: "", nm: 550, group: false });
  renderWavelengthRows();
}

function resetWavelengthRows () {
  wavelengthDraft = SovsSettings.defaults().map(function (w) { return { common: w.common, name: w.name, nm: w.nm, group: !!w.group }; });
  renderWavelengthRows();
}

function saveWavelengths () {

  var cleaned = wavelengthDraft
    .filter(function (w) { return isFinite(w.nm) && w.nm > 0; })
    .map(function (w) { return { common: (String(w.common).trim() || commonColorName(Number(w.nm))), name: (String(w.name).trim() || String(w.nm)), nm: Number(w.nm), group: !!w.group }; })
    .sort(function (a, b) { return a.nm - b.nm; });

  if (cleaned.length > 0) {
    SovsSettings.setWavelengths(cleaned);
    applyMaterialsChange();    // chips and the Summary selector pick up renamed / recoloured entries
  }

  $("#wavelengthsModal").modal("hide");
}


/* --- start-up ---------------------------------------------------------------------------------------------------- */

$(function () {

  // suggestions for the Material cell editor and the Add Lens Element dialog
  var materialOptions = Materials.list.map(function (m) {
    return "<option value=\"" + escapeHTML(m.name) + "\" label=\"nd " + m.nd + "\"></option>";
  }).join("");

  // the table cell can also say "Custom" (keep the fixed, textbook index); the Add dialog needs a number or a name
  var cellOptions = document.getElementById("material-options");
  if (cellOptions) {
    cellOptions.innerHTML = "<option value=\"Custom\" label=\"fixed index as typed, no dispersion\"></option>" + materialOptions;
  }
  var modalOptions = document.getElementById("material-options-modal");
  if (modalOptions) { modalOptions.innerHTML = materialOptions; }

  $("#settingsModal").on("show.bs.modal", function () {
    document.getElementById("setting-advanced-materials").checked = SovsSettings.advancedMaterials;
    document.getElementById("setting-additive-beams").checked     = SovsSettings.additiveBeams;
    document.getElementById("setting-beam-edges").checked         = SovsSettings.beamEdges;
    syncAppearanceControls();
  });

  applyCanvasTheme();
  syncAppearanceControls();
  refreshAdvancedOnlyMenuItems();
  initIndexWavelengthButton();

  refreshModalIndexInput();
});

function linkColumnTitle () { return "<span class=\"table-icon\" title=\"Linked objects move as one - tick two to link them\">" + iconSVG("link", 18) + "</span>"; }

function pinColumnTitle () { return "<span class=\"table-icon\" title=\"Pin: fill the designated aperture stop\">" + iconSVG("pin", 18) + "</span>"; }

function vigColumnTitle () { return "<span class=\"table-icon\" title=\"Vig: your beam width, clipped by whichever elements vignette it\">" + iconSVG("funnel", 18) + "</span>"; }
