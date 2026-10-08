/* ---------------------------------------------------------------------------------------------------------------

  MODEL PICKER

  The "Choose a model" dialog of main.html: a search box, the topics down the left, the matching models beside them.

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

  // pictures for the models that have one (images/models/), and a line about each
  var PICTURES = { "58": "reduced-eye", "10": "legrand-eye", "59": "gullstrand-eye", "6": "keplerian-telescope", "7": "galilean-telescope" };
  var BLURBS = {
    "58": "One refracting surface and a retina: the simplest eye that still forms an image.",
    "10": "The Le Grand relaxed eye: cornea, aqueous, lens and vitreous.",
    "59": "Gullstrand's number 1 eye, relaxed.",
    "6":  "Two positive lenses: an inverted image.",
    "7":  "A positive objective and a negative eyepiece: an upright image."
  };

  function el (tag, className, text) {
    var e = document.createElement(tag);
    if (className) { e.className = className; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }

  function rankIn (list, name) { var i = list.indexOf(name); return i < 0 ? list.length : i; }

  var entries = [], topics = [], activeTopic = null, currentModel = null;     // activeTopic: { category, sub|null }

  function build (config, index) {

    var groups = document.getElementById("groups"), nav = document.getElementById("topics");

    config.models.forEach(function (m, order) {
      var info = index[m.id] || {};
      var category = info.category || "Miscellaneous", sub = info.subcategory || "";
      var title = m.title.replace(/\s+/g, " ");
      entries.push({ id: String(m.id), category: category, sub: sub, title: title, order: order,
                     label: sub ? category + " \u00b7 " + sub : category,
                     text: (title + " " + category + " " + sub + " " + (info.keywords || []).join(" ") + " " + m.id + " " + (BLURBS[m.id] || "")).toLowerCase() });
    });

    // category -> sub -> entries, in the order the headings should come
    var cats = {};
    entries.forEach(function (e) { ((cats[e.category] = cats[e.category] || {})[e.sub] = cats[e.category][e.sub] || []).push(e); });
    var catNames = Object.keys(cats).sort(function (a, b) { var d = rankIn(CATEGORY_ORDER, a) - rankIn(CATEGORY_ORDER, b); return d || a.localeCompare(b); });

    var all = el("button", "topic-all"); all.type = "button"; all.appendChild(el("span", "", "All models")); all.appendChild(el("span", "n"));
    all.addEventListener("click", function () { selectTopic(null); });
    nav.appendChild(all);
    topics.push({ category: null, sub: null, button: all });

    catNames.forEach(function (cat) {

      var heading = el("h5", "", cat);
      groups.appendChild(heading);

      var button = el("button", "topic-cat"); button.type = "button";
      button.appendChild(el("span", "", cat)); button.appendChild(el("span", "n"));
      button.addEventListener("click", function () { selectTopic({ category: cat, sub: null }); });
      nav.appendChild(button);
      topics.push({ category: cat, sub: null, button: button, heading: heading });

      var order = SUB_ORDER[cat] || [];
      Object.keys(cats[cat]).sort(function (a, b) { var d = rankIn(order, a) - rankIn(order, b); return d || a.localeCompare(b); }).forEach(function (sub) {

        var subHeading = sub ? el("h6", "", sub) : null, list = el("ul");
        if (subHeading) { groups.appendChild(subHeading); }
        cats[cat][sub].forEach(function (e) {
          var li = el("li"), a = el("a");
          a.href = "main.html?model=" + encodeURIComponent(e.id);
          a.addEventListener("click", function (ev) {
            if (typeof switchModel === "function" && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey) {
              ev.preventDefault(); $("#modelModal").modal("hide"); switchModel(e.id);
            }
          });
          if (PICTURES[e.id]) { var img = el("img"); img.src = "images/models/" + PICTURES[e.id] + ".png"; img.alt = ""; img.loading = "lazy"; a.appendChild(img); }
          var text = el("span", "text"), title = el("span", "title", e.title);
          text.appendChild(title);
          if (BLURBS[e.id]) { text.appendChild(el("span", "blurb", BLURBS[e.id])); }
          a.appendChild(text);
          li.appendChild(a); list.appendChild(li);
          e.li = li; e.titleEl = title;
        });
        groups.appendChild(list);

        if (sub) {
          var subButton = el("button", "topic-sub"); subButton.type = "button";
          subButton.appendChild(el("span", "", sub)); subButton.appendChild(el("span", "n"));
          subButton.addEventListener("click", function () { selectTopic({ category: cat, sub: sub }); });
          nav.appendChild(subButton);
        }
        topics.push({ category: cat, sub: sub || null, button: subButton || null, heading: subHeading, list: list, parent: heading });
      });
    });

    filter();
    if (currentModel !== null) { window.markCurrentModel(currentModel); }
  }

  function selectTopic (topic) { activeTopic = topic; filter(); document.querySelector(".model-results").scrollTop = 0; }

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

  function filter () {

    var words = document.getElementById("q").value.toLowerCase().split(/\s+/).filter(Boolean);

    entries.forEach(function (e) {
      e.match = words.every(function (w) { return e.text.indexOf(w) >= 0; });
      if (e.match) { highlight(e, words); }
      e.li.hidden = !(e.match && inTopic(e));
    });

    var shown = entries.filter(function (e) { return !e.li.hidden; }).length;

    topics.forEach(function (t) {
      var n = entries.filter(function (e) {
        return e.match && (t.category === null || (e.category === t.category && (t.sub === null || e.sub === t.sub)));
      }).length;
      if (t.button) {
        t.button.querySelector(".n").textContent = n;
        t.button.disabled = (n === 0 && t.category !== null);
        t.button.classList.toggle("active", activeTopic === null ? t.category === null :
          (t.category === activeTopic.category && t.sub === activeTopic.sub));
      }
      if (t.heading) {
        var visible = entries.some(function (e) { return !e.li.hidden && e.category === t.category && (t.sub === null || e.sub === t.sub); });
        t.heading.hidden = !visible; if (t.list) { t.list.hidden = !visible; }
      }
    });

    document.getElementById("none").hidden = shown > 0;
    document.getElementById("status").textContent = words.length ? shown + (shown === 1 ? " model" : " models") + " found" : "";
  }

  window.markCurrentModel = function (id) {
    currentModel = String(id);
    entries.forEach(function (e) { e.li.classList.toggle("current", e.id === currentModel); });
  };

  function links () { return Array.prototype.slice.call(document.querySelectorAll("#groups li:not([hidden]) a")); }

  var box = document.getElementById("q");
  box.addEventListener("input", function () { filter(); });
  box.addEventListener("keydown", function (e) {
    if (e.key === "Enter")     { var l = links(); if (l.length) { e.preventDefault(); l[0].click(); } }
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
    .then(function (both) { build(both[0], both[1]); })
    .catch(function () {
      var none = document.getElementById("none"); none.hidden = false;
      none.innerHTML = 'The model list could not be loaded. Try the <a href="index.classic.html">classic index</a>.';
    });

});
