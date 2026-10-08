/* ---------------------------------------------------------------------------------------------------------------

  MODEL PICKER

  The "Choose a model" dialog of main.html, in columns: categories, then the groups in the chosen category, then the
  models in the chosen group, then a preview of the model you have selected. A search box above narrows them all.

  The topics come from the lens files themselves: each declares a "category", a "subcategory" and some "keywords"
  (see scripts/build-models.js, which gathers them into config/models-index.json). A model whose file says nothing
  turns up under "Miscellaneous", so a new one is never lost.

  Choosing a model loads it in place (switchModel() in main.js). The dialog opens from the Model button; typing in the
  model title box (or "/") does a quick search instead.

--------------------------------------------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {

  if (!document.getElementById("modelModal")) { return; }

  // the order the headings come in (any a lens file adds go after these, in alphabetical order)
  var CATEGORY_ORDER = ["Components", "Schematic eyes", "Instruments", "Assignments", "Miscellaneous"];
  var SUB_ORDER = {
    "Components":     ["Thin lens", "Thick lens", "Prism", "Dispersion", "Mirror"],
    "Schematic eyes": ["Reduced eye", "Le Grand", "Gullstrand"],
    "Instruments":    ["Telescope", "Keratometer", "Vertometer"],
    "Assignments":    ["2024", "2023", "2022", "2021", "Earlier"]
  };

  // pictures for the models that have one (images/models/)
  var PICTURES = { "58": "reduced-eye", "10": "legrand-eye", "59": "gullstrand-eye", "6": "keplerian-telescope", "7": "galilean-telescope" };


  function el (tag, className, text) {
    var e = document.createElement(tag);
    if (className) { e.className = className; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }

  function rankIn (list, name) { var i = list.indexOf(name); return i < 0 ? list.length : i; }

  var entries = [], activeTopic = null, currentModel = null, selected = null;     // activeTopic: { category, sub|null }
  var cats = {}, catNames = [], index = {}, duplicates = {};      // duplicates: id -> the id that stands for it in the list

  function build (config, idx) {

    index = idx;
    config.models.forEach(function (m, order) {
      var info = index[m.id] || {};
      if (info.duplicateOf !== undefined) { duplicates[String(m.id)] = String(info.duplicateOf); return; }    // the same lens as another: listed once
      var category = info.category || "Miscellaneous", sub = info.subcategory || "";
      var full  = m.title.replace(/\s+/g, " ");
      var title = info.shortName || full;
      entries.push({ id: String(m.id), category: category, sub: sub, title: title, full: full, order: order, keywords: info.keywords || [], about: info.about || "", about: info.about || "",
                     label: sub ? category + " \u00b7 " + sub : category,
                     text: (title + " " + full + " " + category + " " + sub + " " + (info.keywords || []).join(" ") + " " + m.id + " " + (info.about || "")).toLowerCase() });
    });

    // category -> sub -> entries, in the order the headings should come
    entries.forEach(function (e) { ((cats[e.category] = cats[e.category] || {})[e.sub] = cats[e.category][e.sub] || []).push(e); });
    catNames = Object.keys(cats).sort(function (a, b) { var d = rankIn(CATEGORY_ORDER, a) - rankIn(CATEGORY_ORDER, b); return d || a.localeCompare(b); });
    catNames.forEach(function (cat) {
      var order = SUB_ORDER[cat] || [];
      cats[cat]._subs = Object.keys(cats[cat]).filter(function (k) { return k !== "_subs"; })
        .sort(function (a, b) { var d = rankIn(order, a) - rankIn(order, b); return d || a.localeCompare(b); });
    });

    // the models, built once (the filters only hide and show them)
    var groups = document.getElementById("groups");
    catNames.forEach(function (cat) {
      cats[cat]._subs.forEach(function (sub) {
        var heading = el("h6", "", sub ? cat + " \u203a " + sub : cat), list = el("ul");
        cats[cat][sub].forEach(function (e) {
          var li = el("li"), a = el("a");
          a.href = "main.html?model=" + encodeURIComponent(e.id);
          a.addEventListener("click", function (ev) { if (!ev.metaKey && !ev.ctrlKey && !ev.shiftKey) { ev.preventDefault(); select(e); } });
          a.addEventListener("dblclick", function (ev) { ev.preventDefault(); load(e); });
          a.addEventListener("focus", function () { select(e, true); });
          a.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); load(e); } });
          var title = el("span", "title", e.title);
          a.appendChild(title);
          li.appendChild(a); list.appendChild(li);
          e.li = li; e.titleEl = title; e.link = a;
        });
        groups.appendChild(heading); groups.appendChild(list);
        cats[cat][sub].heading = heading; cats[cat][sub].list = list;
      });
    });

    filter();
    if (currentModel !== null) { window.markCurrentModel(currentModel); }
    showDetail(null);
  }

  function load (e) { $("#modelModal").modal("hide"); if (typeof switchModel === "function") { switchModel(e.id); } }

  function select (e, fromFocus) {
    selected = e;
    entries.forEach(function (x) { x.li.classList.toggle("selected", x === e); });
    showDetail(e);
    if (!fromFocus) { e.link.focus({ preventScroll: true }); }
  }

  // the preview column: a picture where there is one, the full name, where it sits, what it is searchable by
  function showDetail (e) {
    var box = document.getElementById("detail"); box.textContent = "";
    if (!e) { box.appendChild(el("p", "text-muted small", "Choose a model to see it here.")); return; }
    if (PICTURES[e.id]) { var img = el("img"); img.src = "images/models/" + PICTURES[e.id] + ".png"; img.alt = ""; box.appendChild(img); }
    box.appendChild(el("h5", "", e.title));
    if (e.full !== e.title) { box.appendChild(el("p", "text-muted small", e.full)); }
    if (e.about) { box.appendChild(el("p", "pick-about", e.about)); }
    box.appendChild(el("p", "text-muted small", e.label));
    var chips = el("div", "chips");
    e.keywords.forEach(function (k) {
      var chip = el("button", "chip", k); chip.type = "button";
      chip.addEventListener("click", function () { var q = document.getElementById("q"); q.value = k; activeTopic = null; filter(); q.focus(); });
      chips.appendChild(chip);
    });
    if (e.keywords.length) { box.appendChild(chips); }
    var open = el("button", "btn btn-primary btn-sm", e.id === currentModel ? "Reload this model" : "Open model"); open.type = "button";
    open.addEventListener("click", function () { load(e); });
    box.appendChild(open);
  }

  function selectTopic (topic) { activeTopic = topic; filter(); document.getElementById("groups").parentNode.scrollTop = 0; }

  function highlight (entry, words) {
    var t = entry.titleEl; t.textContent = "";
    var lower = entry.title.toLowerCase(), marks = [];
    words.forEach(function (w) { var i = lower.indexOf(w); if (i >= 0) { marks.push([i, i + w.length]); } });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var at = 0;
    marks.forEach(function (m) {
      if (m[0] < at) { return; }
      t.appendChild(document.createTextNode(entry.title.slice(at, m[0])));
      t.appendChild(el("mark", "", entry.title.slice(m[0], m[1])));
      at = m[1];
    });
    t.appendChild(document.createTextNode(entry.title.slice(at)));
  }

  function inTopic (e) {
    return activeTopic === null || (e.category === activeTopic.category && (activeTopic.sub === null || e.sub === activeTopic.sub));
  }

  function columnButton (label, n, active, onclick, className) {
    var b = el("button", className || ""); b.type = "button";
    b.appendChild(el("span", "", label)); b.appendChild(el("span", "n", String(n)));
    b.classList.toggle("active", !!active); b.disabled = (n === 0);
    b.addEventListener("click", onclick);
    return b;
  }

  function filter () {

    var words = document.getElementById("q").value.toLowerCase().split(/\s+/).filter(Boolean);

    entries.forEach(function (e) {
      e.match = words.every(function (w) { return e.text.indexOf(w) >= 0; });
      if (e.match) { highlight(e, words); }
      e.li.hidden = !(e.match && inTopic(e));
    });

    var count = function (cat, sub) {
      return entries.filter(function (e) { return e.match && (cat === null || (e.category === cat && (sub === null || e.sub === sub))); }).length;
    };

    // column 1: the categories
    var nav = document.getElementById("topics"); nav.textContent = "";
    nav.appendChild(columnButton("All models", count(null, null), activeTopic === null, function () { selectTopic(null); }, "topic-all"));
    catNames.forEach(function (cat) {
      nav.appendChild(columnButton(cat, count(cat, null), activeTopic && activeTopic.category === cat, function () { selectTopic({ category: cat, sub: null }); }, "topic-cat"));
    });

    // column 2: the groups of the chosen category
    var subnav = document.getElementById("subtopics"); subnav.textContent = "";
    if (activeTopic) {
      var cat = activeTopic.category, subs = cats[cat]._subs.filter(Boolean);
      if (subs.length) {
        subnav.appendChild(columnButton("All " + cat.toLowerCase(), count(cat, null), activeTopic.sub === null, function () { selectTopic({ category: cat, sub: null }); }, "topic-all"));
        subs.forEach(function (sub) {
          subnav.appendChild(columnButton(sub, count(cat, sub), activeTopic.sub === sub, function () { selectTopic({ category: cat, sub: sub }); }, "topic-sub"));
        });
      }
    } else {
      subnav.appendChild(el("p", "text-muted small px-2", "Choose a category to see its groups."));
    }

    // column 3: the models (a heading above each group that still has some)
    catNames.forEach(function (c) {
      cats[c]._subs.forEach(function (sub) {
        var g = cats[c][sub], visible = g.some(function (e) { return !e.li.hidden; });
        g.heading.hidden = !visible; g.list.hidden = !visible;
      });
    });

    var shown = entries.filter(function (e) { return !e.li.hidden; }).length;
    document.getElementById("none").hidden = shown > 0;
    document.getElementById("status").textContent = words.length ? shown + (shown === 1 ? " model" : " models") + " found" : shown + " models";
  }

  window.markCurrentModel = function (id) {
    currentModel = String(id);
    if (duplicates[currentModel] !== undefined) { currentModel = duplicates[currentModel]; }     // (on show through another lab's link)
    entries.forEach(function (e) { e.li.classList.toggle("current", e.id === currentModel); });
  };

  function links () { return Array.prototype.slice.call(document.querySelectorAll("#groups li:not([hidden]) a")); }

  var box = document.getElementById("q");
  box.addEventListener("input", function () { filter(); });
  box.addEventListener("keydown", function (e) {
    if (e.key === "Enter")     { var f = entries.filter(function (x) { return !x.li.hidden; })[0]; if (f) { e.preventDefault(); load(f); } }
    if (e.key === "ArrowDown") { var m = links(); if (m.length) { e.preventDefault(); m[0].focus(); } }
  });
  document.getElementById("groups").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") { return; }
    var l = links(), i = l.indexOf(document.activeElement);
    if (i < 0) { return; }
    e.preventDefault();
    if (e.key === "ArrowUp" && i === 0) { box.focus(); return; }
    var next = l[i + (e.key === "ArrowDown" ? 1 : -1)]; if (next) { next.focus(); }
  });

  // The Model button opens this dialog. Typing in the model title box does a quick search instead (below).
  function openPicker () { $("#modelModal").modal("show"); }
  var button = document.getElementById("importer");
  if (button) { button.removeAttribute("data-toggle"); button.setAttribute("title", "Browse all the models"); button.addEventListener("click", function (e) { e.stopPropagation(); openPicker(); }); }
  $("#modelModal").on("shown.bs.modal", function () { box.focus(); box.select(); });

  /* QUICK SEARCH: the model title box takes what you type and offers the best matches under it; Enter opens the best
     one, the arrow keys choose another, Esc puts the title back. "/" goes to the box from anywhere. */
  var titleBox = document.getElementById("filename_display");
  if (titleBox) {

    titleBox.removeAttribute("readonly");
    titleBox.setAttribute("placeholder", "Search the models\u2026");
    titleBox.setAttribute("autocomplete", "off");
    titleBox.setAttribute("title", "Type to search the models (press / from anywhere); the Model button browses them all");

    var menu = el("div", "quick-results"); menu.hidden = true;
    titleBox.parentNode.appendChild(menu);
    var picked = -1, shown = [];

    var currentTitle = function () {
      var e = entries.filter(function (x) { return x.id === currentModel; })[0];
      return e ? e.title : titleBox.value;
    };

    // best first: every word must be found; a title that starts with the words, then one with them at the start of
    // a word, then one with them anywhere, beats one that only matches through its topic or number
    var rank = function (words) {
      var found = [];
      entries.forEach(function (e, order) {
        if (!words.every(function (w) { return e.text.indexOf(w) >= 0; })) { return; }
        var title = e.title.toLowerCase(), score = 0;
        words.forEach(function (w) {
          var i = title.indexOf(w);
          if (i < 0)                          { score += 1; }
          else if (i === 0)                   { score += 40; }
          else if (/[\s(\-\/]/.test(title.charAt(i - 1))) { score += 25; }
          else                                { score += 10; }
          score -= Math.min(i, 30) / 30;                       // (earlier is better)
        });
        if (e.id === currentModel) { score -= 0.5; }            // (you are already there)
        found.push({ e: e, score: score - order / 1000 });
      });
      found.sort(function (a, b) { return b.score - a.score; });
      return found.map(function (f) { return f.e; });
    };

    var closeMenu = function () { menu.hidden = true; picked = -1; };
    var choose = function (i) { if (shown[i]) { closeMenu(); titleBox.blur(); $("#modelModal").modal("hide"); switchModel(shown[i].id); } };
    var mark = function (i) {
      picked = i;
      Array.prototype.forEach.call(menu.children, function (row, k) { row.classList.toggle("picked", k === i); });
    };

    var refresh = function () {
      var words = titleBox.value.toLowerCase().split(/\s+/).filter(Boolean);
      menu.textContent = "";
      if (!words.length || !entries.length) { shown = []; closeMenu(); return; }
      shown = rank(words).slice(0, 8);
      shown.forEach(function (e, i) {
        var row = el("div", "quick-row");
        var name = el("span", "quick-title"); row.appendChild(name);
        row.appendChild(el("span", "quick-topic", e.label));
        var saved = e.titleEl.innerHTML; highlight(e, words); name.innerHTML = e.titleEl.innerHTML; e.titleEl.innerHTML = saved;
        row.addEventListener("mousedown", function (ev) { ev.preventDefault(); choose(i); });     // (before the box loses focus)
        row.addEventListener("mousemove", function () { mark(i); });
        menu.appendChild(row);
      });
      if (!shown.length) { menu.appendChild(el("div", "quick-none", "No model matches that")); }
      var more = el("div", "quick-more", "Browse all the models\u2026");
      more.addEventListener("mousedown", function (ev) { ev.preventDefault(); closeMenu(); titleBox.blur(); openPicker(); });
      menu.appendChild(more);
      menu.hidden = false;
      mark(shown.length ? 0 : -1);
    };

    titleBox.addEventListener("focus", function () { titleBox.select(); });
    titleBox.addEventListener("input", refresh);
    titleBox.addEventListener("blur", function () { closeMenu(); titleBox.value = currentTitle(); });
    titleBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  { e.preventDefault(); choose(picked >= 0 ? picked : 0); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (shown.length) { mark((picked + 1) % shown.length); } }
      else if (e.key === "ArrowUp")   { e.preventDefault(); if (shown.length) { mark((picked - 1 + shown.length) % shown.length); } }
      else if (e.key === "Escape")    { titleBox.value = currentTitle(); closeMenu(); titleBox.blur(); }
    });
  }

  document.addEventListener("keydown", function (e) {
    var typing = e.target && (/^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable);
    if (e.key === "/" && !typing && !document.body.classList.contains("modal-open") && titleBox) { e.preventDefault(); titleBox.focus(); }
  });

  Promise.all([ fetch("config/config.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
                fetch("config/models-index.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }) ])
    .then(function (both) { build(both[0], both[1]); if (currentModel !== null) { var cur = entries.filter(function (x) { return x.id === currentModel; })[0]; if (cur) { showDetail(cur); } } })
    .catch(function () {
      var none = document.getElementById("none"); none.hidden = false;
      none.innerHTML = 'The model list could not be loaded. Try the <a href="index.classic.html">classic index</a>.';
    });

});
