#!/usr/bin/env node
/*

  BUILD-LABS.JS

  Generates Laboratory1.html, Laboratory2.html, Laboratory3.html, Laboratory4.html,
  Laboratory6.html, Vertometer.html, Keratometer.html, eye/index.html, Test.html, main.html, manager.html and the
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
  { output: 'Laboratory1.html', lensesMenu: 'lab-1', reportVersion: 'v2.0' },
  { output: 'Laboratory2.html', lensesMenu: 'lab-2', reportVersion: 'v2.0' },
  { output: 'Laboratory3.html', lensesMenu: 'lab-3', reportVersion: 'v2.0' },
  { output: 'Laboratory4.html', lensesMenu: 'lab-4', reportVersion: 'v2.1' },
  { output: 'Laboratory6.html', lensesMenu: 'lab-6', reportVersion: 'v2.1' },
  { output: 'eye/index.html',   lensesMenu: 'eye',   reportVersion: 'v2.1' },
  { output: 'Vertometer.html',  lensesMenu: 'vertometer',  reportVersion: 'v2.1' },
  { output: 'Keratometer.html', lensesMenu: 'keratometer', reportVersion: 'v2.1' },
  { output: 'Test.html',        lensesMenu: 'test',  reportVersion: 'v2.1' },
  // the workbench: the Model button opens a slide-in, searchable list of every model
  { output: 'main.html',        lensesMenu: 'main',  reportVersion: 'v2.1', sidebar: true },
  // the same, with the tables open for authoring: open and save .lens files on disk, and a debug window (js/manager.js)
  { output: 'manager.html',     lensesMenu: 'main',  reportVersion: 'v2.1', sidebar: true, manager: true },
  // the assignments of each year: the same page with that year's models (profile "assignment-<year>")
  { output: 'assignments/assign2021.html', lensesMenu: 'assignment-2021', reportVersion: 'v1.0' },
  { output: 'assignments/assign2022.html', lensesMenu: 'assignment-2022', reportVersion: 'v1.0' },
  { output: 'assignments/assign2023.html', lensesMenu: 'assignment-2023', reportVersion: 'v1.0' },
  { output: 'assignments/assign2024.html', lensesMenu: 'assignment-2024', reportVersion: 'v2.0' },
];

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

build();
