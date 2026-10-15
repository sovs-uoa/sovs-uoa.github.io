#!/usr/bin/env node
/*

  BUILD-MODELS.JS

  Reads the "category", "subcategory" and "keywords" a .lens file declares about itself, and writes them for every
  model in config/config.json to config/models-index.json - the file the model picker of main.html reads (so the page
  does not have to fetch and parse all the lens files just to list them).

  In a .lens file:

      "category"    : "Schematic eyes",          one of: Components, Schematic eyes, Instruments, Assignments
      "subcategory" : "Gullstrand",              the group inside it
      "keywords"    : [ "schematic eye", "Gullstrand" ],      anything else worth searching for
      "shortName"   : "Relaxed eye",             optional: the name the picker shows (the title in config.json stays what
                                                 the page, the report and the tables use)
      "about"       : "One sentence about the model.",   optional: shown beside it in the picker when it is selected
      "reference"   : "Where the numbers come from",     optional: shown as the model's source in the picker

  A model whose file says no category is listed under "Miscellaneous".

  Several models that load the same lens file (the laboratories link to their own ids) are listed once: the first
  one in config.json stays in the picker and the others are marked "duplicateOf" it (they still open as before).

  Usage (from the repository root, after changing a lens file's category or keywords):

      node scripts/build-models.js

*/

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'config.json'), 'utf8'));

function field (text, name) {
  const m = text.match(new RegExp('"' + name + '"\\s*:\\s*"([^"]*)"'));
  return m ? m[1] : '';
}

const index = {};
const firstWith = {};
let tagged = 0;

for (const model of config.models) {
  const file = path.join(ROOT, model.filename);
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { console.log(`missing lens file for model ${model.id}: ${model.filename}`); }

  const entry = { category: field(text, 'category') || 'Miscellaneous', subcategory: field(text, 'subcategory'), keywords: [] };
  const shortName = field(text, 'shortName');
  if (shortName) entry.shortName = shortName;
  const reference = field(text, 'reference');
  if (reference) entry.reference = reference;
  const about = field(text, 'about');
  if (about) entry.about = about.replace(/\\"/g, '"');
  const list = text.match(/"keywords"\s*:\s*\[([^\]]*)\]/);
  if (list) entry.keywords = (list[1].match(/"[^"]*"/g) || []).map(s => s.slice(1, -1));
  if (entry.category !== 'Miscellaneous') tagged++;
  if (firstWith[model.filename] !== undefined) entry.duplicateOf = firstWith[model.filename];
  else firstWith[model.filename] = model.id;
  index[model.id] = entry;
}

fs.writeFileSync(path.join(ROOT, 'config', 'models-index.json'), JSON.stringify(index, null, 1) + '\n');
console.log(`wrote config/models-index.json  (${config.models.length} models, ${tagged} with a category)`);
