/* Loads the optics code (raytracer/js/optics/*.js) into a plain Node context, with no browser, so that it can be tested.

   optics.js and materials.js are ordinary browser scripts (global functions, no exports). They are run in a vm context
   with a silent console; the context is then the "library". */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT = path.join(__dirname, '..');

function loadOptics () {
  const ctx = { console: { log() {}, warn() {}, error() {}, info() {}, debug() {} }, Math, Number, Array, Object, JSON,
                isFinite, isNaN, parseFloat, parseInt, Infinity, NaN, Date, String, Boolean, Error, RegExp };
  vm.createContext(ctx);
  ['js/optics/materials.js', 'js/optics/optics.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  });
  return ctx;
}

// .lens files are JSON5 (comments, NaN). This reads the subset they use.
function parseLens (text) {
  let out = '', i = 0, inStr = false;
  while (i < text.length) {
    const c = text[i], d = text[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === '"') { inStr = false; } i++; continue; }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && d === '*') { const j = text.indexOf('*/', i + 2); i = j < 0 ? text.length : j + 2; continue; }
    if (c === '/' && d === '/') { const j = text.indexOf('\n', i); i = j < 0 ? text.length : j; continue; }
    out += c; i++;
  }
  out = out.replace(/:\s*\+(?=[0-9.])/g, ': ')                                // JSON5 allows a leading +
  out = out.replace(/\bNaN\b/g, '"__NaN__"').replace(/\bInfinity\b/g, '"__Inf__"').replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(out, function (k, v) { return v === '__NaN__' ? NaN : (v === '__Inf__' ? Infinity : v); });
}

function readLens (relPath) {
  return parseLens(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

// the optical system of a .lens file: the same call chain the application makes (prescription.js)
function systemOf (optics, lens) {
  const table = optics.convertToLensTable(JSON.parse(JSON.stringify(lens.prescription, (k, v) => (typeof v === 'number' && !isFinite(v)) ? '__NaN__' : v), (k, v) => v === '__NaN__' ? NaN : v));
  // appendDisplayInformation() reads a global called lensTable that the application sets (prescription.js): the
  // library cannot be called without it, so it is set here too.
  optics.lensTable = table;
  return optics.getTotalLensSystemInfo(table);
}

module.exports = { loadOptics, parseLens, readLens, systemOf, ROOT };
