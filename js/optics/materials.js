/* ---------------------------------------------------------------------------------------------------------------

  MATERIALS + WAVELENGTHS  (the "advanced materials" mode)

  An educational dispersion model, not an optical-design catalogue. Every material is just two numbers
  that students already meet in class - the refractive index at the d line (n_d) and the Abbe number
  (V_d = (n_d - 1) / (n_F - n_C)) - and the index at any other wavelength comes from a two-term Cauchy fit
  through those two numbers:

        n(lambda) = A + B / lambda^2         (lambda in micrometres)

  chosen so that it reproduces n_d exactly and n_F - n_C = (n_d - 1) / V_d exactly. That is accurate to a
  few parts in 10^3 across the visible, which is far better than the classroom needs, and it keeps the
  whole thing explainable on one line. Air and anything with no Abbe number is simply non-dispersive.

  Everything that is shown or entered elsewhere (radii, thin-lens powers, the plain "Ref. Index" column
  when advanced mode is off) is the DESIGN value, i.e. at the d line. Advanced mode only changes what the
  optics is asked to trace.

--------------------------------------------------------------------------------------------------------------- */


var Materials = (function () {

  // the three Fraunhofer lines that define n_d and the Abbe number (nm)
  var LAMBDA_D = 587.56;
  var LAMBDA_F = 486.13;
  var LAMBDA_C = 656.27;

  // name, n_d, V_d (null = no dispersion). Values are typical catalogue/handbook figures.
  var list = [
    { name: "Air",                  nd: 1.0000, Vd: null },
    { name: "Water",                nd: 1.3330, Vd: 55.8 },
    { name: "Ocular media",         nd: 1.3360, Vd: 50.0 },   // aqueous / vitreous
    { name: "Fused silica",         nd: 1.4585, Vd: 67.8 },
    { name: "PMMA (acrylic)",       nd: 1.4917, Vd: 57.4 },
    { name: "CR-39",                nd: 1.4980, Vd: 58.0 },
    { name: "BK7",                  nd: 1.5168, Vd: 64.2 },
    { name: "Crown glass (1.523)",  nd: 1.5230, Vd: 58.6 },
    { name: "Trivex",               nd: 1.5320, Vd: 45.0 },
    { name: "Polycarbonate",        nd: 1.5855, Vd: 29.9 },
    { name: "High index 1.60",      nd: 1.6000, Vd: 41.0 },
    { name: "F2 flint",             nd: 1.6200, Vd: 36.4 },
    { name: "High index 1.67",      nd: 1.6700, Vd: 32.0 },
    { name: "High index 1.74",      nd: 1.7400, Vd: 33.0 },
    { name: "SF11 dense flint",     nd: 1.7847, Vd: 25.7 }
  ];

  function normalise (text) {
    return String(text == null ? "" : text).toLowerCase().replace(/[^a-z0-9.]/g, "");
  }

  // exact (case/punctuation-insensitive) match first, then a unique prefix match ("poly" -> Polycarbonate)
  function find (text) {

    var key = normalise(text);
    if (key === "") { return null; }

    for (var i = 0; i < list.length; i++) {
      if (normalise(list[i].name) === key) { return list[i]; }
    }

    var hits = list.filter(function (m) { return normalise(m.name).indexOf(key) === 0; });
    return (hits.length === 1) ? hits[0] : null;
  }

  function cauchy (m) {

    if (!m.Vd) { return { A: m.nd, B: 0 }; }

    var uF = LAMBDA_F / 1000, uC = LAMBDA_C / 1000, uD = LAMBDA_D / 1000;
    var B  = ((m.nd - 1) / m.Vd) / (1/(uF*uF) - 1/(uC*uC));
    var A  = m.nd - B/(uD*uD);
    return { A: A, B: B };
  }

  // refractive index of material m (an entry of list, or its name) at wavelength nm
  function indexAt (m, nm) {

    if (typeof m === "string") { m = find(m); }
    if (!m) { return NaN; }

    var c = cauchy(m);
    var u = nm / 1000;
    return c.A + c.B/(u*u);
  }

  // Accepts what a person might type into a Ref. Index / Material cell: a plain number (a fixed,
  // non-dispersive index), the word "Custom" (keep whatever fixed index the row already has - the textbook
  // value every prescription starts with), or a material name.
  // Returns {material: <entry>} / {index: <number>} / {custom: true} / null.
  function parse (text) {

    var s = String(text == null ? "" : text).trim();
    if (s === "") { return null; }

    if (normalise(s) === "custom") { return { custom: true }; }

    if (/^[0-9]*\.?[0-9]+$/.test(s)) {
      var n = parseFloat(s);
      return (n >= 1 && n <= 5) ? { index: n } : null;
    }

    var m = find(s);
    return m ? { material: m } : null;
  }

  return { list: list, find: find, indexAt: indexAt, parse: parse,
           LAMBDA_D: LAMBDA_D, LAMBDA_F: LAMBDA_F, LAMBDA_C: LAMBDA_C };

})();



/* ---------------------------------------------------------------------------------------------------------------

  WAVELENGTH -> COLOUR   (Dan Bruton's approximation; good enough for a colour chip)

--------------------------------------------------------------------------------------------------------------- */

function wavelengthToColor (nm) {

  if (!isFinite(nm)) { return "#808080"; }
  if (nm < 380) { return "#8f7fb8"; }   // ultraviolet - not visible, shown as a muted violet
  if (nm > 780) { return "#a67c7c"; }   // infrared    - not visible, shown as a muted red

  var r = 0, g = 0, b = 0;
  if      (nm < 440) { r = -(nm - 440)/(440 - 380); g = 0;                    b = 1; }
  else if (nm < 490) { r = 0;                       g = (nm - 440)/(490 - 440); b = 1; }
  else if (nm < 510) { r = 0;                       g = 1;                    b = -(nm - 510)/(510 - 490); }
  else if (nm < 580) { r = (nm - 510)/(580 - 510);  g = 1;                    b = 0; }
  else if (nm < 645) { r = 1;                       g = -(nm - 645)/(645 - 580); b = 0; }
  else               { r = 1;                       g = 0;                    b = 0; }

  var f = 1;
  if      (nm < 420) { f = 0.3 + 0.7*(nm - 380)/(420 - 380); }
  else if (nm > 700) { f = 0.3 + 0.7*(780 - nm)/(780 - 700); }

  function channel (c) { return Math.round(255 * Math.pow(c * f, 0.8)); }

  function hex (v) { var s = v.toString(16); return (s.length < 2 ? "0" : "") + s; }

  return "#" + hex(channel(r)) + hex(channel(g)) + hex(channel(b));
}

// the everyday name of a colour for a wavelength, used when an entry has none of its own
function commonColorName (nm) {

  if (!isFinite(nm)) { return ""; }
  if (nm < 380) { return "Ultraviolet"; }
  if (nm < 450) { return "Violet"; }
  if (nm < 495) { return "Blue"; }
  if (nm < 520) { return "Cyan"; }
  if (nm < 565) { return "Green"; }
  if (nm < 590) { return "Yellow"; }
  if (nm < 625) { return "Orange"; }
  if (nm <= 780) { return "Red"; }
  return "Infrared";
}

// black or white text, whichever reads better on the given #rrggbb background
function readableTextColor (hexColor) {

  var r = parseInt(hexColor.substr(1, 2), 16);
  var g = parseInt(hexColor.substr(3, 2), 16);
  var b = parseInt(hexColor.substr(5, 2), 16);
  return (0.299*r + 0.587*g + 0.114*b) > 150 ? "#000000" : "#ffffff";
}



/* ---------------------------------------------------------------------------------------------------------------

  SETTINGS  (the Settings dialog and the Wavelengths dialog edit this; it is remembered between visits)

  There is deliberately no "system wavelength". The prescription always shows each material's NOMINAL index
  (n_d, the d line - the single "white light" number every datasheet quotes), so a prescription reads exactly as
  it always has. Wavelength belongs where light is: each object carries its own (a column in the Objects table),
  and the Summary has its own selector - everything else keeps the nominal value.

--------------------------------------------------------------------------------------------------------------- */

var SovsSettings = (function () {

  var STORAGE_KEY = "sovs.settings.v2";

  // the usual suspects - F, d and C are the three lines the Abbe number is defined from
  function defaultWavelengths () {
    return [ { common: "Violet", name: "g",    nm: 435.8 },
             { common: "Blue",   name: "F",    nm: 486.1, group: true },
             { common: "Green",  name: "e",    nm: 546.1, group: true },
             { common: "Yellow", name: "d",    nm: 587.6 },
             { common: "Orange", name: "HeNe", nm: 632.8 },
             { common: "Red",    name: "C",    nm: 656.3, group: true } ];
  }

  var NOMINAL_NM = 587.6;       // the d line - what a new object, and the Summary, start on

  var state = { advancedMaterials: false, wavelengths: defaultWavelengths(), summaryNm: NOMINAL_NM, additiveBeams: false };

  function load () {

    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved) {
        state.advancedMaterials = !!saved.advancedMaterials;
        if (Array.isArray(saved.wavelengths) && saved.wavelengths.length > 0) {
          var kept = saved.wavelengths
            .filter(function (w) { return w && isFinite(w.nm) && w.nm > 0; })
            .map(function (w) { return { common: String(w.common || commonColorName(Number(w.nm))), name: String(w.name || ""), nm: Number(w.nm), group: !!w.group }; });
          // a list saved before white-light groups existed: the usual red, green and blue lines make up the group
          if (!kept.some(function (w) { return w.group; })) {
            kept.forEach(function (w) { w.group = [656.3, 546.1, 486.1].some(function (nm) { return Math.abs(nm - w.nm) < 0.05; }); });
          }
          if (kept.length > 0) { state.wavelengths = kept; }
        }
        state.additiveBeams = !!saved.additiveBeams;
        if (isFinite(saved.prescriptionNm) && saved.prescriptionNm > 0) { state.prescriptionNm = Number(saved.prescriptionNm); }
        if (isFinite(saved.summaryNm) && saved.summaryNm > 0) { state.summaryNm = Number(saved.summaryNm); }
      }
    } catch (e) { /* storage can be missing or blocked - run on the defaults */ }
  }

  function save () {

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* not worth bothering anyone over */ }
  }

  // The name and colour for a wavelength: its entry in the list if it has one, otherwise just the number
  // (an object keeps the wavelength it was given even if that entry is later removed from the list).
  function entryFor (nm) {

    var hit = state.wavelengths.filter(function (w) { return Math.abs(w.nm - nm) < 0.05; })[0];
    return { common: hit ? hit.common : commonColorName(Number(nm)), name: hit ? hit.name : "", nm: Number(nm), color: wavelengthToColor(Number(nm)) };
  }

  load();

  return {
    get advancedMaterials ()  { return state.advancedMaterials; },
    set advancedMaterials (v) { state.advancedMaterials = !!v; save(); },

    // the wavelength the prescription's Ref. Index column is shown at (display only - see indexFormatter)
    get prescriptionNm ()   { return state.prescriptionNm || NOMINAL_NM; },
    set prescriptionNm (nm) { state.prescriptionNm = Number(nm); save(); },

    get additiveBeams ()  { return state.additiveBeams; },
    set additiveBeams (v) { state.additiveBeams = !!v; save(); },

    // the wavelengths a "white light" group is made of (red, green and blue unless the Wavelengths dialog says otherwise)
    get groupWavelengths () {
      var nms = state.wavelengths.filter(function (w) { return w.group; }).map(function (w) { return w.nm; });
      return nms.length > 0 ? nms : [656.3, 546.1, 486.1];
    },

    get wavelengths () { return state.wavelengths; },
    setWavelengths: function (list) { state.wavelengths = list; save(); },
    defaults: defaultWavelengths,

    get summaryNm ()   { return state.summaryNm; },
    set summaryNm (nm) { state.summaryNm = Number(nm); save(); },

    NOMINAL_NM: NOMINAL_NM,
    entryFor: entryFor
  };

})();

// the d line (give or take rounding in a typed-in list) is the nominal wavelength - the table exactly as typed
function isNominalWavelength (nm) {
  return !isFinite(nm) || Math.abs(nm - Materials.LAMBDA_D) < 0.1;
}



/* ---------------------------------------------------------------------------------------------------------------

  EFFECTIVE LENS TABLE

  What the optics should actually be asked to trace for light of wavelength nm. At the nominal wavelength (or with
  advanced mode off) that is simply the table as typed, so nothing changes unless a different wavelength is asked
  for. Otherwise every row with a material gets the index (or, for a thin lens, the power) that material has at nm.
  The table itself - what is displayed and what gets saved - keeps its design (d line) values.

     "index" rows   -> index = n(lambda)
     "thin"  rows   -> power = power_d * (n(lambda) - 1) / (n_d - 1)       (a thin lens in air: P ~ n - 1)

  Surfaces ("sphere") need nothing: the optics works their power out from the radius and the media either side.

--------------------------------------------------------------------------------------------------------------- */

function effectiveLensTable (rows, nm) {

  if (!SovsSettings.advancedMaterials || isNominalWavelength(nm)) { return rows; }

  return rows.map(function (row) {

    var material = row.material ? Materials.find(row.material) : null;
    if (!material) { return row; }

    if (row.type === "index") {
      return Object.assign({}, row, { index: Materials.indexAt(material, nm) });
    }

    if (row.type === "thin" && material.nd !== 1) {
      var scale = (Materials.indexAt(material, nm) - 1) / (material.nd - 1);
      return Object.assign({}, row, { power: row.power * scale });
    }

    return row;
  });
}


if (typeof module !== "undefined" && module.exports) {
  module.exports = { Materials: Materials, wavelengthToColor: wavelengthToColor };
}
