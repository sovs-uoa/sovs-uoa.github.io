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

  A model whose file says no category is listed under "Miscellaneous".

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
let tagged = 0;

for (const model of config.models) {
  const file = path.join(ROOT, model.filename);
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { console.log(`missing lens file for model ${model.id}: ${model.filename}`); }

  const entry = { category: field(text, 'category') || 'Miscellaneous', subcategory: field(text, 'subcategory'), keywords: [] };
  const list = text.match(/"keywords"\s*:\s*\[([^\]]*)\]/);
  if (list) entry.keywords = (list[1].match(/"[^"]*"/g) || []).map(s => s.slice(1, -1));
  if (entry.category !== 'Miscellaneous') tagged++;
  index[model.id] = entry;
}

fs.writeFileSync(path.join(ROOT, 'config', 'models-index.json'), JSON.stringify(index, null, 1) + '\n');
console.log(`wrote config/models-index.json  (${config.models.length} models, ${tagged} with a category)`);
