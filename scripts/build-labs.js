#!/usr/bin/env node
/*

  BUILD-LABS.JS

  Generates Laboratory1.html, Laboratory2.html, Laboratory3.html, Laboratory4.html,
  Laboratory6.html and eye.html from a single shared template
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
  { output: 'eye.html',         lensesMenu: 'eye',   reportVersion: 'v2.1' },
];

function build () {

  const template = fs.readFileSync(TEMPLATE, 'utf8');

  for (const page of PAGES) {

    const missingTokens = [];
    if (!template.includes('__LENSES_MENU__'))   missingTokens.push('__LENSES_MENU__');
    if (!template.includes('__REPORT_VERSION__')) missingTokens.push('__REPORT_VERSION__');
    if (missingTokens.length) {
      throw new Error(`Template is missing expected token(s): ${missingTokens.join(', ')}`);
    }

    const out = template
      .split('__LENSES_MENU__').join(page.lensesMenu)
      .split('__REPORT_VERSION__').join(page.reportVersion);

    fs.writeFileSync(path.join(ROOT, page.output), out);
    console.log(`wrote ${page.output}  (lenses_menu: ${page.lensesMenu}, report: ${page.reportVersion})`);
  }
}

build();
