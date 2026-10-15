#!/usr/bin/env node
/*

  BUILD-LABS.JS

  Generates labs/Laboratory1.html ... labs/Laboratory6.html, labs/Vertometer.html, labs/Keratometer.html,
  labs/Test.html, eye/index.html, main.html, manager.html and the
  assignments/assign<year>.html pages from a single shared template
  (scripts/laboratory.template.html), substituting the handful of values that
  actually differ per page.

  These pages used to be maintained as six near-identical hand-copied files,
  which drifted out of sync over time (missing attributes, different wording,
  stray whitespace) purely because an edit was made to one copy and not the
  others. Everything shared now lives in one template; only the two things
  that are genuinely supposed to differ per lab (which lens menu profile to
  load, and which report template version to use) are listed below.

  Usage (from the repository root):

      node scripts/build-labs.js

  Do not hand-edit the generated .html files - re-run this script instead.

*/

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const TEMPLATE = path.join(__dirname, 'laboratory.template.html');

// output filename -> { lensesMenu, reportVersion }
// lensesMenu   must match a "profiles[].name" entry in config/config.json
// reportVersion must match an existing mustache/optics_report_template_<version>.mustache.htm
const PAGES = [
  { output: 'labs/Laboratory1.html', lensesMenu: 'lab-1', reportVersion: 'v2.0' },
  { output: 'labs/Laboratory2.html', lensesMenu: 'lab-2', reportVersion: 'v2.0' },
  { output: 'labs/Laboratory3.html', lensesMenu: 'lab-3', reportVersion: 'v2.0' },
  { output: 'labs/Laboratory4.html', lensesMenu: 'lab-4', reportVersion: 'v2.1' },
  { output: 'labs/Laboratory6.html', lensesMenu: 'lab-6', reportVersion: 'v2.1' },
  { output: 'eye/index.html',   lensesMenu: 'eye',   reportVersion: 'v2.1' },
  { output: 'labs/Vertometer.html',  lensesMenu: 'vertometer',  reportVersion: 'v2.1' },
  { output: 'labs/Keratometer.html', lensesMenu: 'keratometer', reportVersion: 'v2.1' },
  { output: 'labs/Test.html',        lensesMenu: 'test',  reportVersion: 'v2.1' },
  // the workbench: the Model button opens a slide-in, searchable list of every model
  { output: 'main.html',        lensesMenu: 'main',  reportVersion: 'v2.1', sidebar: true },
  // the same, with the tables open for authoring: open and save .lens files on disk, and a debug window (js/app/manager.js)
  { output: 'manager.html',     lensesMenu: 'main',  reportVersion: 'v2.1', sidebar: true, manager: true },
  // the assignments of each year: the same page with that year's models (profile "assignment-<year>")
  { output: 'assignments/assign2021.html', lensesMenu: 'assignment-2021', reportVersion: 'v1.0' },
  { output: 'assignments/assign2022.html', lensesMenu: 'assignment-2022', reportVersion: 'v1.0' },
  { output: 'assignments/assign2023.html', lensesMenu: 'assignment-2023', reportVersion: 'v1.0' },
  { output: 'assignments/assign2024.html', lensesMenu: 'assignment-2024', reportVersion: 'v2.0' },
];

// Where a page used to be: a small redirect is left at the old address (it keeps ?model=... and #...), so a link in
// course material or a bookmark still works. The addresses are in the root of the repository, one level above the
// ray-tracer (ROOT is raytracer/). Delete an entry (and its file) once nothing links to it any more.
const SITE = path.join(ROOT, '..');
const MOVED = {
  'Laboratory1.html': 'raytracer/labs/Laboratory1.html',
  'Laboratory2.html': 'raytracer/labs/Laboratory2.html',
  'Laboratory3.html': 'raytracer/labs/Laboratory3.html',
  'Laboratory4.html': 'raytracer/labs/Laboratory4.html',
  'Laboratory6.html': 'raytracer/labs/Laboratory6.html',
  'Vertometer.html':  'raytracer/labs/Vertometer.html',
  'Keratometer.html': 'raytracer/labs/Keratometer.html',
  'assign2021.html':  'raytracer/assignments/assign2021.html',
  'assign2022.html':  'raytracer/assignments/assign2022.html',
  'assign2023.html':  'raytracer/assignments/assign2023.html',
  'assign2024.html':  'raytracer/assignments/assign2024.html',
  'assignments/assign2021.html': 'raytracer/assignments/assign2021.html',
  'assignments/assign2022.html': 'raytracer/assignments/assign2022.html',
  'assignments/assign2023.html': 'raytracer/assignments/assign2023.html',
  'assignments/assign2024.html': 'raytracer/assignments/assign2024.html',
  'eye/index.html':   'raytracer/eye/',
  'main.html':        'raytracer/main.html',
  'manager.html':     'raytracer/manager.html',
  'models.html':      'raytracer/models.html',
  'index.classic.html': 'raytracer/index.classic.html',
};

// Browsers keep serving an old copy of a script or stylesheet for a while after it has changed (so an edited
// file can look "unfixed"). Tag each local js/ and css/ file with its own last-modified time: the address
// changes exactly when the file does, so a rebuilt page always picks up the new file.
function withCacheBusters (html) {
  return html.replace(/(src|href)="((?:js|css)\/[^"?]+)"/g, (match, attr, file) => {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) return match;
    return `${attr}="${file}?v=${Math.round(fs.statSync(full).mtimeMs / 1000)}"`;
  });
}

function build () {

  const template = fs.readFileSync(TEMPLATE, 'utf8');

  for (const page of PAGES) {

    const missingTokens = [];
    if (!template.includes('__LENSES_MENU__'))   missingTokens.push('__LENSES_MENU__');
    if (!template.includes('__REPORT_VERSION__')) missingTokens.push('__REPORT_VERSION__');
    if (missingTokens.length) {
      throw new Error(`Template is missing expected token(s): ${missingTokens.join(', ')}`);
    }

    // the tool rail sits in the diagram on the laboratory pages; the side bar page has its tools in the side bar
    // the side bar (a searchable list of every model, opened by the Model button) is only on the pages that ask for it
    const strip = (html, tag) => html.replace(new RegExp(`<!--${tag}-->[\\s\\S]*?<!--/${tag}-->\\n?`), '');
    const keep  = (html, tag) => html.replace(`<!--${tag}-->`, '').replace(`<!--/${tag}-->`, '');
    let body = keep(template, 'RAIL');
    body = page.sidebar ? keep(body, 'SIDEBAR') : strip(body, 'SIDEBAR');
    if (page.sidebar) body = body.replace('<body>', '<body class="has-sidebar' + (page.manager ? ' has-manager' : '') + '">');

    // a page in a sub-directory (eye/, assignments/) finds the scripts, models and templates of the site root through
    // a <base> element, so none of the paths inside the page have to change. A link to "#..." would then resolve
    // against the root, so those are kept on the page.
    const depth = page.output.split('/').length - 1;
    if (depth > 0) {
      const prefix = '../'.repeat(depth);
      body = body.replace('<meta charset="utf-8">',
        '<meta charset="utf-8">\n  <base href="' + prefix + '">\n' +
        '  <script>document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest(\'a[href^="#"]\'); if (a) { e.preventDefault(); } }, true);</script>');
    }

    const out = withCacheBusters(body
      .split('__LENSES_MENU__').join(page.lensesMenu)
      .split('__REPORT_VERSION__').join(page.reportVersion));

    fs.mkdirSync(path.dirname(path.join(ROOT, page.output)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, page.output), out);
    console.log(`wrote ${page.output}  (lenses_menu: ${page.lensesMenu}, report: ${page.reportVersion})`);
  }
}

function writeMovedStubs () {
  Object.keys(MOVED).forEach(function (from) {
    const file = path.join(SITE, from);
    // the address of the new page, relative to where the redirect sits
    let to = path.relative(path.dirname(file), path.join(SITE, MOVED[from])).split(path.sep).join('/');
    if (MOVED[from].endsWith('/')) { to += '/'; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file,
      '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><title>Moved</title>\n' +
      '<script>location.replace("' + to + '" + location.search + location.hash);</script>\n' +
      '<meta http-equiv="refresh" content="0; url=' + to + '">\n' +
      '<link rel="canonical" href="' + to + '"></head>\n' +
      '<body><p>This page has moved to <a href="' + to + '">' + to + '</a>.</p></body></html>\n');
    console.log('wrote ' + from + '  (redirect to ' + MOVED[from] + ')');
  });
}

build();
writeMovedStubs();
