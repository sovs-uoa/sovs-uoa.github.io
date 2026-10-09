/* 

  PRESCRIPTION RELATED 

*/



var lens;


function clearLens () {



lens     = {  prescription : null, 
              tabledata    : null,
              table        : null,
              points       : null,
              pointsTable  : null,

              raphael : { constructions: [] },              

              modal: { group:       "",
                        type:        "",
                        description: "",
                        radius:      "",
                        power:       "",
                        height:      "",
                        index:       "",
                        material:    "",
                        thickness:   "",
                        stop:        "",
                        intermediate: false,
                        aperture:    "",
                        base:        "up",
                      
                        // modal source information 
                        source: {
                            id:       "",
                            tag_id:   "",
                            z:        "",
                            h:        "",
                            angle:    "",
                            width:    "" 
                        }
                      } 

            };

}

console.log ('clearing lenses.');
clearLens ();
 
function lensTypeSelector(elem) {
    

    var lensType      = elem.getAttribute("data-short-id");
    var lensTypeLong  = elem.innerText;


    // update this field
    $("#lens-type-text-readonly").val(lensTypeLong);

    // the distance fields below are entered/converted in whatever unit is
    // currently selected (see addModalInfoToTable()) - keep their labels
    // showing that unit rather than leaving it to guesswork
    refreshModalDistanceUnitLabels();

    // hide everything
    $("#lens-type-index").hide();
    $("#lens-type-sphere").hide();
    $("#lens-type-thick").hide();
    $("#lens-type-thin").hide();
    $("#lens-type-prism").hide();

    switch (lensType) {

      case "index": // show those elements for the index 
        $("#lens-type-index").show();
        console.log("index selected");
        lens.modal.type = lensType;
        break;

      case "sphere": // show those elements for the sphere 
        $("#lens-type-sphere").show();        
        console.log("sphere selected");
        lens.modal.type = lensType;
        break;

      case "thin": // show those elements for the sphere 
        $("#lens-type-thin").show();        
        console.log("thin selected");
        lens.modal.type = lensType;
        break;

      case "thick": // show those elements for the sphere
        $("#lens-type-thick").show();
        console.log("sphere selected");
        lens.modal.type = lensType;
        break;

      case "prism": // idealized thin prism - constant angular deviation only
        $("#lens-type-prism").show();
        console.log("prism selected");
        lens.modal.type = lensType;
        break;

      default:
        console.log("unknown selected.");
        lens.modal.type = lensType;

    }


  $("#modalLoginForm").modal("show");

 }


function lensObjectSelector(elem) {


    var objectType      = elem.getAttribute("data-short-id");
    var objectTypeLong  = elem.innerText;

    // "point" (PrincipalRayConstruction) and "beam" (ParallelBeamConstruction)
    // both draw the classic three-ray construction through the system's
    // cardinal points (P1/P2/F1/F2/N1/N2 - see drawRayConstruction() and
    // drawBeamConstruction()), which are only finite for a system with real
    // power. An afocal system (equivalent power F=0, e.g. a telescope) has
    // no finite cardinal points at all, so these would draw nothing but
    // Infinity/NaN geometry - refuse rather than let that happen silently
    // (updateNewSourceMenuAvailability() also greys these menu items out for
    // the same reason, but guard here too in case that DOM update is stale).
    if ((objectType === "point" || objectType === "beam") &&
        typeof renderableLens !== "undefined" && renderableLens && renderableLens.total &&
        renderableLens.total.F === 0) {
      console.log(`"${objectTypeLong}" is not available for an afocal system - it needs finite cardinal points. Use "object" or the afocal beam option instead.`);
      return;
    }

    // "group" is the object dialog with the white-light group box ticked (advanced materials mode)
    var asGroup = (objectType === "group");
    if (asGroup) { objectType = "object"; objectTypeLong = "object (white-light group)"; }

    applyDefaultBeamWidths();      // a third of the largest element, not a fixed number

    // update this field
    $("#point-type-text-readonly").val(objectTypeLong);

    // the distance fields below are entered/converted in whatever unit is
    // currently selected (see addModalInfoToPointsTable()) - keep their
    // labels showing that unit rather than leaving it to guesswork
    refreshModalDistanceUnitLabels();

    // hide everything
    $("#lens-type-point").hide();
    $("#lens-type-object").hide();
    $("#lens-type-source").hide();
    $("#lens-type-beam").hide();
    $("#lens-type-afocal").hide();


    switch (objectType) {

      case "point":
        $("#lens-type-point").show();
        console.log("point/source type selected");
        break;

      case "object": // collates source / beam / afocal into one, decided at Add time
        $("#lens-type-object").show();
        toggleObjectInfinity();
        console.log("object type selected");
        break;

      case "source":
        $("#lens-type-source").show();
        //console.log("point/source type selected");
        break;

      case "beam": // show those elements for the sphere
        $("#lens-type-beam").show();
        console.log("beam type selected");
        break;

      case "afocal": // show those elements for the sphere
        $("#lens-type-afocal").show();
        console.log("beam type selected");
        break;


      default:
        console.log("unknown selected.");
    }


  var groupBox = document.getElementById("modal-object-group");
  if (groupBox) {
    groupBox.checked = asGroup;
    document.getElementById("modal-object-group-row").style.display = (objectType === "object" && SovsSettings.advancedMaterials) ? "" : "none";
  }

  $("#pointAddForm").modal("show");
 }


/* ------------------------------------------------------------------------------------------------------

TOGGLEOBJECTINFINITY  Swap the "Add Object" modal between a finite point (z/h) and a beam from
infinity (angle only), based on the "At infinity" checkbox.

----------------------------------------------------------------------------------------------------------- */

function toggleObjectInfinity() {

    var atInfinity = document.getElementById("modal-object-infinity").checked;

    if (atInfinity) {
      $("#lens-type-object-finite").hide();
      $("#lens-type-object-infinite").show();
    } else {
      $("#lens-type-object-finite").show();
      $("#lens-type-object-infinite").hide();
    }
 }


/* ------------------------------------------------------------------------------------------------------

The "&infin;" column in the Objects and Images table is fixed by the "At infinity"
checkbox at Add time (see addModalInfoToPointsTable()) and stays read-only after
that - it is not editable/toggleable from the table itself.

----------------------------------------------------------------------------------------------------------- */




 function addModalInfoToTable() {


    // get the modal dialog information 

    console.log(lens.table.getData());

    var rowCount            = lens.table.getDataCount();
    lens.modal.id           = rowCount + 1;
    lens.modal.tag_id       = "NA";
    lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    lens.modal.description  = document.getElementById("modal-lens-element-description").value;
    // The "Value" box takes a plain refractive index, or - in advanced materials mode - a material
    // name; a name also fills in the design (d line) index so the plain Ref. Index column stays meaningful.
    var typedIndex          = document.getElementById("modal-lens-refractive-index").value;
    var parsedIndex         = (typeof Materials !== "undefined") ? Materials.parse(typedIndex) : null;
    if (parsedIndex && parsedIndex.custom) { parsedIndex = null; }   // "Custom" needs a number here; fall through to Number()
    lens.modal.material     = "";
    lens.modal.index        = Number(typedIndex);
    if (parsedIndex && parsedIndex.material) {
      lens.modal.material   = parsedIndex.material.name;
      lens.modal.index      = parsedIndex.material.nd;
    } else if (parsedIndex && parsedIndex.index) {
      lens.modal.index      = parsedIndex.index;
    }

    // Distances typed into this modal are in whatever unit the tab's selector
    // currently shows (matching the prescription table's own distanceEditor) -
    // convert to metres here rather than storing the raw typed number, or a
    // "10" meant as 10mm silently became 10 METRES (see distanceEditor above).
    lens.modal.thickness    = fromDisplayDistance(Number(document.getElementById("modal-lens-thickness").value));
    lens.modal.radius       = fromDisplayDistance(Number(document.getElementById("modal-lens-radius-of-curvature").value));
    lens.modal.aperture     = fromDisplayDistance(Number(document.getElementById("modal-lens-aperture-diameter").value));

    if (lens.modal.type == "prism") {
      lens.modal.power    = Number(document.getElementById("modal-prism-power").value);
      lens.modal.base     = document.getElementById("modal-prism-base").value;
      lens.modal.aperture = fromDisplayDistance(Number(document.getElementById("modal-prism-aperture").value));
    } else {
      lens.modal.power    = Number(document.getElementById("modal-thin-power").value);
    }

    // add a row to the table 
    // console.log(lens.modal);
    lens.table.addData(Object.assign({}, lens.modal));   // a copy - the table keeps hold of what it is given, and the next Add reuses lens.modal

    // clear the data in the modal information screen


    // dismiss the modal 
    $("#modalLoginForm").modal("hide");

    console.log(lens.table.getData());
 }



/* ------------------------------------------------------------------------------------------------------


PRESCRIPTION  = OBJECTS + IMAGES TABLE 

----------------------------------------------------------------------------------------------------------- */        


//toggle cell value on click
var tickToggle = function(e, cell){


  var data = cell.getRow().getData();
  if ((data.type == "thin") || (data.type == "sphere") || (data.type == "img") || (data.type == "prism") )
  {

    // clear all cells except for the toggled one!
    allCells = cell.getColumn().getCells();
    allCells.forEach( each => {
      var eachRow  = each.getRow().getData();
      if (eachRow.id == data.id) {
          each.setValue(!each.getValue()); 
      } else {
          each.setValue(false);        
      }
    });

  }
}



/* ------------------------------------------------------------------------------------------------------

ADVANCED MATERIALS - the Material column (see materials.js)

In advanced mode the "Ref. Index" column is swapped for a "Material" column. A medium (an "index" row) or a
thin lens can name a material; the index it is traced with then depends on the wavelength chosen next to
the units selector. The row still keeps a plain design index (at the d line), so switching advanced mode off
again leaves an ordinary, consistent prescription behind.

----------------------------------------------------------------------------------------------------------- */

// l and l' (distances from the principal points) mean nothing for an afocal system - it has none: not editable
function editNotAfocal (cell) {
  var afocal = (typeof renderableLens !== "undefined") && renderableLens && renderableLens.total && renderableLens.total.F == 0;
  return !afocal && editPointCheck(cell);
}

// every kind of row that has something drawn for it (a point or an object, a source, a beam): these can be hidden
function drawsABeam (data) {
  return [ "object", "point", "source", "beam", "afocal" ].indexOf(data.type) !== -1;
}

// a tick box for a table cell; disabled ones show a state that is not changed by clicking
function checkBoxHTML (checked, disabled, tip) {
  return "<input type=\"checkbox\" " + (checked ? "checked " : "") + (disabled ? "disabled " : "") +
         "style=\"cursor:" + (disabled ? "default" : "pointer") + ";\" title=\"" + tip + "\">";
}

function advancedMaterialsOn () {
  return (typeof SovsSettings !== "undefined") && SovsSettings.advancedMaterials;
}

function materialFormatter (cell) {

  var data = cell.getRow().getData();
  if (data.type !== "index" && data.type !== "thin" && data.type !== "prism") { return ""; }

  var material = data.material ? Materials.find(data.material) : null;

  // a medium with no material and an index of exactly 1 is just air
  if (!material && data.type === "index" && Number(data.index) === 1) { material = Materials.find("Air"); }

  // "Custom": the fixed, textbook-style index a prescription is typed with. The default for anything that has
  // not been given a material, and it does not vary with wavelength.
  if (!material) {
    if (data.type === "thin" || data.type === "prism") { return "Custom <small class=\"text-muted\" title=\"Ideal element - power as typed, no dispersion\">fixed</small>"; }
    return "<span style=\"color:#6c757d;\" title=\"Fixed index as typed - the same at every wavelength\">Custom</span>";
  }

  // the index itself lives in its own Ref. Index column (the nominal, d line, value)
  return material.name;
}

// The six-digit glass code used on every glass datasheet: the three decimals of (n_d - 1) then V_d x 10, so
// BK7 (1.5168, 64.2) is 517642.
function glassCode (m) {
  if (!m.Vd) { return "\u2014"; }
  var pad = function (n) { return ("000" + n).slice(-3); };
  return pad(Math.round((m.nd - 1) * 1000)) + pad(Math.round(m.Vd * 10));
}

// Clicking a Material cell pops up a table of the available materials (like the wavelength palette): name,
// n_d, V_d and glass code, with Custom - the fixed textbook index, typed in the Ref. Index column - first.
function materialEditor (cell, onRendered, success, cancel, editorParams) {

  var row  = cell.getRow();
  var data = row.getData();

  var holder = document.createElement("div");
  holder.tabIndex = 0;
  holder.style.outline = "none";
  holder.textContent = data.material ? data.material : "Custom";

  var palette = document.createElement("div");
  palette.className = "wavelength-palette material-palette";

  var table = document.createElement("table");
  table.innerHTML = "<thead><tr><th>Material</th><th>n<sub>d</sub></th><th>V<sub>d</sub></th><th>Code</th></tr></thead>";
  var tbody = document.createElement("tbody");
  table.appendChild(tbody);
  palette.appendChild(table);

  var done = false;
  function finish (action) {
    if (done) { return; }
    done = true;
    document.removeEventListener("mousedown", outside, true);
    if (palette.parentNode) { palette.parentNode.removeChild(palette); }
    if (action) { action(); } else { cancel(); }
  }
  function outside (e) { if (!palette.contains(e.target)) { finish(); } }

  function addRow (label, nd, Vd, code, selected, tip, action) {
    var tr = document.createElement("tr");
    tr.className = selected ? "selected" : "";
    if (tip) { tr.title = tip; }
    tr.innerHTML = "<td>" + escapeHTML(label) + "</td><td class=\"nm\">" + nd + "</td><td class=\"nm\">" + Vd + "</td><td class=\"nm\">" + code + "</td>";
    tr.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); finish(action); });
    tbody.appendChild(tr);
  }

  // Custom: no material, the fixed index the row already has
  addRow("Custom", data.type === "index" && isFinite(data.index) ? Number(data.index).toFixed(3) : "", "\u2014", "\u2014", !data.material,
         "A fixed index as typed (the textbook value) - the same at every wavelength",
         function () { success(""); });

  Materials.list.forEach(function (m) {
    if (data.type !== "index" && m.nd === 1) { return; }   // a thin lens of air is no lens
    addRow(m.name, m.nd.toFixed(4), m.Vd ? m.Vd.toFixed(1) : "\u2014", glassCode(m), data.material === m.name,
           m.Vd ? "" : "No dispersion",
           function () {
             if (data.type === "index") { row.update({ index: m.nd }); }
             success(m.name);
           });
  });

  holder.addEventListener("keydown", function (e) { if (e.key === "Escape") { finish(); } });

  onRendered(function () {

    document.body.appendChild(palette);

    var r = cell.getElement().getBoundingClientRect();
    var h = palette.offsetHeight;
    var top = (r.bottom + h > window.innerHeight) ? Math.max(0, window.innerHeight - h - 8) : r.bottom;
    palette.style.left = Math.max(0, Math.min(r.left, window.innerWidth - palette.offsetWidth)) + "px";
    palette.style.top  = top + "px";

    holder.focus();
    document.addEventListener("mousedown", outside, true);
  });

  return holder;
}


function editCheck (cell) {

    //get data for the row 
    var row  = cell.getRow();
    var data = row.getData();
    var columnName = cell.getColumn().getField();
    // row.deselect();    

    console.log("edit check column = " + columnName);
    console.log(data);


    switch (data.type) {

      case "sphere": case "img":
      if (columnName == "power")    { return true; }; 
      if (columnName == "radius")   { return true; }; 
      if (columnName == "aperture") { return true; }; 
      if (columnName == "stop")     { return true; };       
      if (columnName == "intermediate") { return true; };
      break;

      case "thin":
      if (columnName == "power") { return true; };
      if (columnName == "material") { return true; };
      if (columnName == "aperture") { return true; };
      if (columnName == "stop")     { return true; };
      if (columnName == "intermediate") { return true; };
      break;

      case "prism":
      if (columnName == "power") { return true; };
      if (columnName == "material") { return true; };
      if (columnName == "base")    { return true; };
      if (columnName == "aperture") { return true; };
      if (columnName == "stop")     { return true; };
      if (columnName == "intermediate") { return true; };
      break;


      case "index":
      if (columnName == "index")     { return true; }; 
      if (columnName == "material")  { return true; };
      if (columnName == "thickness") { return true; };      
      break;

      default:
      return false;

    }


   // default deny
   return false;
}



function updateRow (row) {

    //get data for the row 

    var data       = row.getData();
    console.log("- Updating ROW = ");
    console.log(data);

    switch (data.type) {

      case "sphere": 
        
          // case "img":
          // update the row 

          var nextRow = row.getNextRow().getData();
          var prevRow = row.getPrevRow().getData();
          row.update({ "power" : (nextRow.index - prevRow.index)/data.radius});
          
          // row.update({ "radius" : (nextRow.index - prevRow.index)/data.power});

      break;


    // added 18/6/24

    case "index":

        var nextRow = row.getNextRow();
        updateRow (nextRow);

        var prevRow = row.getPrevRow();
        updateRow (last);
        break;

    }

   // default den
}



function updatedFieldCheck (cell) {

    //get data for the row 
    var row        = cell.getRow();
    var data       = row.getData();
    var columnName = cell.getColumn().getField();


    console.log("edited check column = " + columnName);
    console.log(data);

    switch (data.type) {

      case "sphere": case "img":

          if (columnName == "radius")   { 
              
              console.log("Updating the ... radius");
              // var row     = cell.getRow();
              var nextRow = row.getNextRow().getData();
              var prevRow = row.getPrevRow().getData();
              row.update({ "power" : (nextRow.index - prevRow.index)/data.radius});
              //return true; 
          
          } else if (columnName == "power")   { 
              
              console.log("Updating the ... power");
              //var row     = cell.getRow();
              var nextRow = row.getNextRow().getData();
              var prevRow = row.getPrevRow().getData();
              row.update({ "radius" : (nextRow.index - prevRow.index)/data.power});
              //return true; 
          }; 
      break;


    case "index":

        var nextRow = row.getNextRow();
        updateRow (nextRow);

        var prevRow = row.getPrevRow();
        updateRow (prevRow);


    }

   // default den
}



function postBuildUpdate () {


    //row = 


    row = row.getNextRow();
};

/* ------------------------------------------------------------------------------------------------------


PRESCRIPTION  = OBJECTS + IMAGES TABLE 

----------------------------------------------------------------------------------------------------------- */        


// lens information 
function initializePrescriptionTable(data, updatePrescriptionCallback, success) {


    // Shows which element is the system's aperture stop. If the user has
    // explicitly flagged one ("stop":true), that row gets the plain STOP
    // badge. Otherwise the stop is determined automatically (see the
    // fallback in getTotalLensSystemInfo()/optics.js, recomputed on every
    // prescription change) - the row it landed on gets a muted "STOP (auto)"
    // badge so the user can see, without having to flag anything, which
    // element the app is currently treating as the limiting aperture.
    function apertureStop (cell) {

        if (cell.getValue() == true) {
          return "<span class=\"badge badge-info\">STOP</span>";
        }

        if (typeof renderableLens !== "undefined" && renderableLens && renderableLens.total && renderableLens.total.stopAuto) {
          var stopElem = renderableLens.elem[renderableLens.total.stopIndex];
          var rowId    = cell.getRow().getData().id;
          if (stopElem && stopElem.elem && Number(stopElem.elem.tag_id) === Number(rowId)) {
            return "<span class=\"badge badge-secondary\" title=\"Automatically determined - no stop was explicitly flagged\">STOP (auto)</span>";
          }
        }

        return "";
    }


    var  updateCellProperties = function(value, data, cell, row, options, formatterParams){

          //value - the value of the cell
          //data - the data for the row the cell is in
          //cell - the DOM element of the cell
          //row - the DOM element of the row
          //options - the options set for this tabulator
          //formatterParams - parameters set for the column
          return "<div></div>"; // must return the html or jquery element of the html for the contents of the cell;
      }




    //  convert to standard form 
    lensTable      = convertToLensTable(data);  // fill in missing fields!

    // Tabulator 
    lens.table = new Tabulator("#lens-table", {
      cellEditCancelled:function(cell){ console.log("Edit cancelled");  },
      cellEdited:function(cell){
        console.log("lens edited - update the prescription");
        // console.log(cell);
        // cell.getRow().deselect();    
        if (cell.getColumn().getField() === "material") { setTimeout(function () { lens.table.redraw(true); }, 50); }   // Ref. Index shows the new material at the column's wavelength
        updatedFieldCheck (cell);         // check if a dependent cell was changed / updated   
        updatePrescriptionCallback(cell); // other updates 
      },
      data:lensTable,
      rowAdded:function(row){ updatePrescriptionColumns(); },     // Surf. R. / Base appear and go with the rows that use them
      rowDeleted:function(row){ updatePrescriptionColumns(); },
            addRowPos:"bottom",
      layout:"fitColumns",
      selectable:false, 
      movableRows:true,
      columns:[
          Object.assign({rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
                        addIconHeader("#lens-table-add-row + .dropdown-menu", "Add a lens element")),
          //{title:"Group",         field:"group",            width:100, headerSort:false},                  
          {title:"Id",            field:"id",               width:50, align:"center", headerSort:false},                            
          {title:"Type",          field:"type",             minWidth:72, align:"center", headerSort:false},                  
          {title:"Description",   field:"description",      minWidth:105, widthGrow:2, editor:"input", headerSort:false},
          {title:"Material",      field:"material",         minWidth:110, visible: advancedMaterialsOn(), formatter: materialFormatter, align:"center", editor: materialEditor, headerSort:false, editable: editCheck},
          {title:"Ref. Index",    field:"index",            minWidth:80, mutator:Number, formatter: indexFormatter, formatterParams:{ precision: 4, emptyVal: "" }, align:"center", editor:"input", headerSort:false, validator:["min:1.0", "max:5.0"],
           // with a material named, the index is that material's n_d - change the material (or pick Custom) to change it
           editable: function (cell) { return editCheck(cell) && !(advancedMaterialsOn() && cell.getRow().getData().material); }},
          {title:"Surf. R.",      field:"radius",           minWidth:75, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 4, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Power",         field:"power",            minWidth:75, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 4, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Base",          field:"base",             minWidth:75, align:"center", headerSort:false, editor:"list", editorParams:{ values: { "up": "Base Up", "down": "Base Down" } }, formatter: function(cell) { var data = cell.getRow().getData(); if (data.type != "prism") { return ""; }; return (cell.getValue() == "down") ? "Base Down" : "Base Up"; }, editable: editCheck},
          {title:"Thickness",     field:"thickness",        minWidth:75, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 4, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Ap. Diameter",  field:"aperture",         minWidth:75, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 4, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Stop Flag",     field:"stop",             minWidth:75, align:"center", headerSort:false, formatter: apertureStop, editable: editCheck, editor:"tickCross"
           },
          // tick it to mark the image the system makes up to this element (e.g. the virtual image behind a mirror that
          // the next lens then works on): it is drawn on the diagram as a ringed point, I1, I2...
          {title:"Int. Image",    field:"intermediate",     minWidth:70, align:"center", headerSort:false, editable: editCheck, editor:"tickCross",
           headerTooltip: "Mark the image formed up to this element (an intermediate image) on the diagram",
           formatter: function (cell) { var d = cell.getRow().getData(); if (d.type === "index" || d.type === "img") { return ""; } return cell.getValue() === true ? "&#10003;" : ""; }}],
    });


    // post loading of the table / we should check whether the prescriprion can be filled in



    // show it! 
    // updatePrescriptionCallback ();


    /* JQuery */

    //Add row on "Add Row" button click
    $("#lens-table-add-row").click(function(){
        // entry area here 
    });

    //Delete row on "Delete Row" button click
    $("#lens-table-del-row").click(function(){
        lens.table.deleteRow(1);
    });

    //Clear table on "Empty the table" button click
    $("#lens-table-clear").click(function(){
        lens.table.clearData()
    });

    //Reset table contents on "Reset the table" button click
    $("#lens-table-reset").click(function(){
        lens.table.setData(tabledata);
    });

    // succeesed 
    success ();



 }

/* ------------------------------------------------------------------------------------------------------


POINTS = OBJECTS + IMAGES TABLE 

----------------------------------------------------------------------------------------------------------- */

  var globalIndexCounter = 1;

 function addModalInfoToPointsTable() {

    //var rowCount                  = lens.pointsTable.getDataCount();
    //console.log (`Adding NEW ROW =  ${rowCount}`);

    // never reuse the id of an object that is already there (the lens file's own sources count too)
    lens.pointsTable.getData().forEach(function (d) { if (Number(d.id) > globalIndexCounter) { globalIndexCounter = Number(d.id); } });
    globalIndexCounter += 1;
    lens.modal.source.id          = globalIndexCounter;


    // lens.modal.source.tag_id      = "NA";
    // lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    // lens.modal.description  = document.getElementById("modal-lens-element-description").value;
    // lens.modal.source.type    = document.getElementById("modal-point-type").value;          // finite or parallel


    var choosePoint  = $("#lens-type-point").is(":visible");
    var chooseObject = $("#lens-type-object").is(":visible");
    var chooseBeam   = $("#lens-type-beam").is(":visible");
    var chooseAfocal = $("#lens-type-afocal").is(":visible");
    var chooseSource = $("#lens-type-source").is(":visible");


    // z/h/beamwidth below are distances, typed in whatever unit the tab's
    // selector currently shows (matching the prescription table's own
    // distanceEditor and the Add Lens Element modal) - convert to metres
    // here rather than storing the raw typed number. "t" (angle) and the
    // "infinity" flag are unit-independent and left as-is.

    if (choosePoint & !chooseObject) {

        lens.modal.source.z  = fromDisplayDistance(Number(document.getElementById("modal-point-z").value));
        lens.modal.source.h  = fromDisplayDistance(Number(document.getElementById("modal-point-h").value));
        lens.modal.source.type  = "point";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.beamwidth    = undefined;

    } else if (chooseObject & !choosePoint) {

        // collates source / beam / afocal into one persistent "object" type. The infinity flag
        // (also editable later, as a checkbox in the Objects and Images table) picks finite vs.
        // beam-from-infinity, and for a beam, the lens's own equivalent power picks afocal vs.
        // beam construction - see resolveObjectConstructionType() in application.js.

        var atInfinity = document.getElementById("modal-object-infinity").checked;

        lens.modal.source.which    = "object";
        lens.modal.source.type     = "object";
        lens.modal.source.infinity = atInfinity;

        if (atInfinity) {

            lens.modal.source.t         = Number(document.getElementById("modal-object-angle").value);
            lens.modal.source.beamwidth = fromDisplayDistance(Number(document.getElementById("modal-object-infinite-beam-width").value));
            lens.modal.source.z         = undefined;
            lens.modal.source.h         = undefined;

        } else {

            lens.modal.source.z         = fromDisplayDistance(Number(document.getElementById("modal-object-z").value));
            lens.modal.source.h         = fromDisplayDistance(Number(document.getElementById("modal-object-h").value));
            lens.modal.source.beamwidth = fromDisplayDistance(Number(document.getElementById("modal-object-finite-beam-width").value));
            lens.modal.source.t         = undefined;

        }

    } else if (chooseBeam) {

        lens.modal.source.t  = Number(document.getElementById("modal-beam-angle").value);
        lens.modal.source.beamwidth= fromDisplayDistance(Number(document.getElementById("modal-beam-width").value));  // beamwidth not shown
        lens.modal.source.type  = "beam";
        lens.modal.source.which = "object";
        lens.modal.source.z     = undefined;
        lens.modal.source.h     = undefined;

    } else if (chooseAfocal) {

        lens.modal.source.type  = "afocal";
        lens.modal.source.which = "object";
        lens.modal.source.t  = Number(document.getElementById("modal-afocal-angle").value);
        lens.modal.source.beamwidth = fromDisplayDistance(Number(document.getElementById("modal-afocal-width").value));  // beamwidth not shown
        lens.modal.source.z  = undefined;
        lens.modal.source.h  = undefined;

    } else if (chooseSource) {
        lens.modal.source.z  = fromDisplayDistance(Number(document.getElementById("modal-source-z").value));
        lens.modal.source.h  = fromDisplayDistance(Number(document.getElementById("modal-source-h").value));  // beamwidth not shown
        lens.modal.source.type  = "source";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.beamwidth= fromDisplayDistance(Number(document.getElementById("modal-source-beam-width").value));  // beamwidth not shown

    }


    // add construction  + update table
    var groupBox = document.getElementById("modal-object-group");
    if (chooseObject && !choosePoint && groupBox && groupBox.checked && SovsSettings.advancedMaterials) {
      addWhiteLightGroup (lens.modal.source);   // one object per wavelength of the group, linked together
    } else {
      addConstruction (lens.modal.source);
    }
    $("#pointAddForm").modal("hide");
 }



// 
function decimalPlaces(cell, formatterParams, onRendered){
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered

    var val = cell.getValue();    
    if ((val == null) | isNaN(val)) {
      return formatterParams.emptyVal;
    };

    if (formatterParams.flipVal) {
      val = -val;
    }

    var formattedVal = Number(val).toFixed(formatterParams.precision);
    return formattedVal; 
}


// this will show information the right way up 
function inFlipMutator (data) {
  console.log("in mutator called = " + data);
  return -Number(data);
}


// this will show information the right way up 
function outFlipMutator (data) {
  console.log("out mutator called = " + data);
  return -Number(data);
}


function flipVal (value) {
  return -Number(value);
}


/* -----------------------------


 ----------------------------- */


function editPointCheck (cell) {

    //get data for the row 
    var row  = cell.getRow();
    var data = row.getData();
    var columnName = cell.getColumn().getField();
    // row.select();

    console.log("edit point check column = " + columnName);
    console.log(data);


    switch (data.type) {

      case "point":
      if (columnName == "to") { return false; }; 
      if (columnName == "ti") { return false; }; 
      break;


      default:
      return true;

    }

   // default deny
   return true;
}


var suppressUpdate = false;


// lens information 
function initializePointsTable(data, updatePointsCallback, success) {

/*
      cellEdited:function(e, cell){
        console.log("point edited - update the view");
        updateViewCallback();
      },
*/


      function defaultEditFunction(cell) {
          console.log("point edited - update the points information");
          cell.getRow().deselect();
          updatePointsCallback (cell);
      }


      // An afocal object (infinity:true, system F==0 - see resolveObjectConstructionType
      // in application.js) has no finite entrance-pupil conjugate to pin the bounding rays
      // against, so Pin is not offered for it at all rather than silently falling back.
      function isAfocalObjectRow (data) {
          return !!data.infinity && typeof renderableLens !== "undefined" && renderableLens
                 && renderableLens.total && renderableLens.total.F === 0;
      }


      function flipCellFunction (e, cell) {       
          cell.cellEdited = function (cell) { console.log("suppressed cell edited function."); };         
          cell.setValue(-cell.getValue(), false);   // this will call the cell-edited function 
          suppressUpdate = false;
          console.log(cell); 
      };


      function flipEditFunction(cell) {
          console.log("point edited - update the points information");
          if (!suppressUpdate) {
            updatePointsCallback (cell);
          }
        }

      function unflipCellFunction (cell) { 
          console.log("Unflip function - started");          
          suppressUpdate = true;  
          cell.setValue(-cell.getValue(), false); 
          suppressUpdate = false;  
          flipEditFunction(cell);
          //console.log(cell); 
          //defaultEditFunction(cell);
          console.log("Unflip function - ended");

      };


      console.log('points table ... initializing.');

      //function(cell){
      //    console.log("point edited - update the points information");
      //    console.log(cell);
      //    updatePointsCallback (cell);
      //  }



      // Pin and Vig (see their column definitions below) are two separate,
      // mutually exclusive toggles - see setPinToApertureStop() on each
      // construction class:
      //   neither - an arbitrary manually-typed beam width (the default)
      //   Pin - pinned to the system's single DESIGNATED aperture stop only
      //         (explicit "stop":true, or auto-detected - see
      //         findApertureStopForInfiniteObject in optics.js) - ignores
      //         whether some other element would be tighter for this ray
      //   Vig - the user's own typed beam width, shown clipped by whichever
      //         element(s) actually vignette THIS ray as it propagates -
      //         real vignetting, which can differ from the designated stop
      //         for an off-axis or otherwise non-design object/beam (see
      //         computeVignettedEnvelope)
      var pinVigSyncing = false;
      function applyPinVigMode (row, data, nextField) {

         var construction = lens.raphael.constructions.find(function (c) { return c.getId() == data.id; });
         if (!construction || !construction.setPinToApertureStop) { return; }

         var wasOff    = !data.pin && !data.vig;
         var wasPinned = !!data.pin;   // read before row.update() below, which changes this very object
         var turnOn  = !data[nextField]; // toggling the clicked field on, or off if it was already on
         var pinOn   = turnOn && nextField === "pin";
         var vigOn   = turnOn && nextField === "vig";

         row.update({ pin: pinOn, vig: vigOn });

         // The "beam width" cell is locked while PIN'd (see that column's
         // editable()) and instead mirrors the limiting element's own
         // aperture diameter - stash the manually typed value (only on the
         // way OUT of "neither") so it can come back when toggled back off
         // again. Vig does not lock it - the typed width IS its input.
         if (wasOff) {
           row.update({ _manualBeamWidth: data.beamwidth });
         }

         if (!pinOn && !vigOn) {
           construction.setPinToApertureStop(false, false);
           if (isFinite(data._manualBeamWidth)) {
             row.update({ beamwidth: data._manualBeamWidth });
             if (typeof construction.setBeamWidth === "function") { construction.setBeamWidth(data._manualBeamWidth); }   // and the beam follows
           }
         } else {
           // Pin -> Vig: the beam on screen is the one the stop allows, so that width becomes the typed one -
           // otherwise Vig would fall back to the older width the construction still holds and the beam would jump
           if (vigOn && wasPinned && isFinite(construction.PinnedApertureDiameter) && typeof construction.setBeamWidth === "function") {
             construction.setBeamWidth(construction.PinnedApertureDiameter);
             row.update({ beamwidth: construction.PinnedApertureDiameter });
           }
           construction.setPinToApertureStop(true, vigOn);
           if (pinOn && isFinite(construction.PinnedApertureDiameter)) {
             row.update({ beamwidth: construction.PinnedApertureDiameter });
           }
         }

         // objects linked in a group switch together
         if (!pinVigSyncing) {
           pinVigSyncing = true;
           try {
             groupMates(row).forEach(function (m) {
               var md = m.getData();
               if (!!md[nextField] !== turnOn) { applyPinVigMode(m, md, nextField); }
             });
           } finally { pinVigSyncing = false; }
         }

      }


      //Build Tabulator
      lens.pointsTable = new Tabulator("#lens-points", {
        data:data,
        addRowPos:"bottom",
        selectable:"highlight",   // rows are selected only through their tick box, never by clicking the row
        movableRows:false,
        layout:"fitColumns",
        rowFormatter:function(row){ applyFocusClass(row); },             // re-lit whenever the table redraws
        rowClick:function(e, row){ setFocusedObject(row.getData().id); },
        rowUpdated:function(row){ syncGroupFrom(row); },                // objects in a group move as one
        rowSelectionChanged:function(){ refreshSelectBoxes(); },        // the tick boxes follow the selection
        columns:[
            Object.assign({rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
                          addIconHeader("#lens-points-add-row + .dropdown-menu", "Add an object")),
            // tick boxes = the selection (the highlight follows them); the bin in the corner deletes the ticked rows
            {field:"_selected", formatter: selectBoxFormatter, title: selectAllTitle(), headerClick: selectAllClick, cellClick: selectBoxClick,
             align:"center", headerSort:false, width:40, minWidth:40},
            // advanced materials mode only: tick two objects to link them. A linked
            // object shows its group's link badge instead (click it to unlink) - see "White-light groups" in settings.js
            {title: linkColumnTitle(), field:"group", width:60, align:"center", headerSort:false, visible: advancedMaterialsOn(),
             formatter: groupCellFormatter, cellClick: groupCellClick },
            {title:"&infin;", field:"infinity", width:42, align:"center", headerSort:false,
             // tick = a beam from infinity, clear = an object at a finite distance; changing it rebuilds the drawing
             // (and a linked group changes together, since linked objects must be the same kind)
             formatter: function (cell) {
               if (cell.getRow().getData().type !== "object") { return ""; }
               return checkBoxHTML(cell.getValue(), false, "At infinity (a beam from infinity) - untick for an object at a finite distance");
             },
             cellClick: function (e, cell) {
               var row = cell.getRow();
               if (row.getData().type !== "object") { return; }
               var makeInfinite = !row.getData().infinity;
               var members = [ row ].concat(groupMates(row));
               members.forEach(function (r) { setObjectInfinity(r.getData().id, makeInfinite); });
               if (members.length > 1) { syncGroupFrom(row); }
               lens.pointsTable.redraw(true);
             } },
            // Pin and Vig - mutually exclusive toggles, see applyPinVigMode() above.
            // Works for both a finite object (PointSourceConstruction) and a
            // beam from infinity (ParallelBeamConstruction/AfocalBeamConstruction).
            // Not meaningful for a "point" row (PrincipalRayConstruction has
            // no beam width concept at all).
            {title: pinColumnTitle(), field:"pin", width:54, align:"center", headerSort:false,
             formatter: function (cell) {
               var data = cell.getRow().getData();
               if (data.type !== "object") { return ""; }
               if (isAfocalObjectRow(data)) {
                 return checkBoxHTML(false, true, "Pin is not available for an afocal object - there is no finite entrance pupil conjugate to pin against");
               }
               return checkBoxHTML(cell.getValue(), false, "Pinned to the system's designated aperture stop only");
             },
             cellClick: function (e, cell) {
               var row  = cell.getRow();
               var data = row.getData();
               if (data.type !== "object") { return; }
               if (isAfocalObjectRow(data)) { return; }
               applyPinVigMode(row, data, "pin");
             } },
            // Unlike Pin, Vig never touches VE1/the entrance pupil at all - it
            // always pivots the requested beam about the front vertex and
            // clips it element-by-element (see computeVignettedEnvelope/
            // computeVignettedEnvelopeForBeam) - so it is NOT gated by
            // isAfocalObjectRow the way Pin is; it works the same regardless
            // of whether this particular afocal system's VE1 is degenerate.
            {title: vigColumnTitle(), field:"vig", width:54, align:"center", headerSort:false,
             formatter: function (cell) {
               if (cell.getRow().getData().type !== "object") { return ""; }
               return checkBoxHTML(cell.getValue(), false, "Your own typed beam width, shown clipped by whichever element(s) actually vignette this ray");
             },
             cellClick: function (e, cell) {
               var row  = cell.getRow();
               var data = row.getData();
               if (data.type !== "object") { return; }
               applyPinVigMode(row, data, "vig");
             } },
            // Visible (ticked by default): untick to switch a beam off the diagram - the object (and its handle) stay in the table
            {title: hideColumnTitle(), field:"hidden", width:54, align:"center", headerSort:false,
             formatter: function (cell) {
               if (!drawsABeam(cell.getRow().getData())) { return ""; }
               return checkBoxHTML(!cell.getValue(), false, "Ticked: this beam is drawn on the diagram (untick to hide it - the object stays in the table)");
             },
             cellClick: function (e, cell) {
               var row = cell.getRow();
               if (!drawsABeam(row.getData())) { return; }
               row.update({ hidden: !row.getData().hidden });
               applyBeamVisibility();
             } },
            {title:"id",     field:"id",       width:50, align:"center", headerSort:false, visible:false},   // the key tying a row to its beam - kept in the data, not shown
            // advanced materials mode only: the wavelength this object is traced at (see settings.js)
            {title:"&lambda; (nm)", field:"wavelength", minWidth:92, align:"center", headerSort:false, visible: advancedMaterialsOn(),
             formatter: wavelengthCellFormatter, editor: wavelengthCellEditor, cellEdited: defaultEditFunction,
             // (a lens with no material named anywhere has only fixed, Custom indices: no wavelength to choose)
             editable: function (cell) { return cell.getRow().getData().type === "object" && typeof lensHasMaterials === "function" && lensHasMaterials(); } },
            {title:"type",   field:"type",     width:78, align:"center", headerSort:false,
             // click to change what kind of object this is (see openObjectTypeMenu in settings.js)
             formatter: function (cell) {
               var v = cell.getValue();
               return drawsABeam(cell.getRow().getData()) ? escapeHTML(v) + " <span style=\"color:#6c757d;font-size:.75em;\">&#9662;</span>" : escapeHTML(v);
             },
             cellClick: function (e, cell) { openObjectTypeMenu(cell); } },
            //{title:"X1",     field:"X1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" } },                  
            //{title:"Y1",     field:"Y1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" }, accessor: flipVal },
            {title:"X1",                          field:"X1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y1",                          field:"Y1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"X2",                          field:"X2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y2",                          field:"Y2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>l</i>",                    field:"l",  visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--", hideInfinite: true },  cellEdited:  defaultEditFunction, editable: editNotAfocal },
            {title:"<i>l&prime;</i>",             field:"ld", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--", hideInfinite: true },  cellEdited:  defaultEditFunction, editable: editNotAfocal },
            {title:"<i>l<sub>v</sub></i>",        field:"zo", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l<sub>v&prime;</sub></i>", field:"zi", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>h</i>",                    field:"ho", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>h&prime;</i>",             field:"hi", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>&theta;</i>",              field:"to", visible:true,  minWidth:72, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            // {title:"<i>&theta;&prime;</i>",       field:"ti", visible:true,  minWidth:72, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>&theta;&prime;</i>",       field:"ti", visible:true,  minWidth:72, headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            // While PINNED (not VIG), this reflects the limiting aperture's own
            // diameter (kept in sync by refreshAllConstruction() in application.js)
            // rather than a manually typed value - not editable in that state.
            // VIG is different: the beam width IS the input (the fixed beam VIG
            // shows getting clipped), so it stays editable there.
            {title:"<i>beam width</i>",           field:"beamwidth", visible:true,  minWidth:72, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction,
             editable: function (cell) {
               var data = cell.getRow().getData();
               if (data.pin) { return false; }
               return editPointCheck(cell);
             } }
        ],
      });



      // ok does this work 
      lens.pointsTableHandler= new DataTableHandler (lens.pointsTable);
      lens.pointsTableHandler.attach({ column: "ho", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "hi", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "to", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "ti", filter: flipVal });



      //console.log("PRESCRIPTION");
      //console.log(lens.pointsTableHandler);

      //console.log("just called lems table");
      //console.log(lens.pointsTable);
      // show the points 
      // updatePointsCallback ();


      /* these should be in the main file */
/*

      //Delete row on "Delete Row" button click
      $("#lens-points-del-row").click(function(){

          console.log("request to delete row...");
          selectedData = lens.pointsTable.getSelectedData(); 

          selectedData.forEach(elem => {
              lens.pointsTable.deleteRow(elem.id);
          });

          // update the constructions 


      });
*/

      //Clear table on "Empty the table" button click
      $("#lens-table-clear").click(function(){
          lens.pointsTable.clearData()
      });

      //Reset table contents on "Reset the table" button click
      $("#lens-table-reset").click(function(){
          lens.pointsTable.setData(tabledata);
      });

      success ();



 }




// information 
function converterPoints(points) {
    out = [];
    points.forEach( each => {

        switch (each.type) {

           /* ------------------------------------

            FINITE RAYS 

           ---------------------------------------- */

            case "finite": case "point":

             data  = {    id  : each.id,
                         type : each.type,
                         which: each.which };

             switch (data.which) {
                case "object":
                  data.zo   = each.z;
                  data.ho   = each.h;
                  data.to   = null;
                  data.zi   = null;
                  data.hi   = null;
                  data.ti   = null;
                  break;

                case "image":
                  data.zi   = each.z;
                  data.hi   = each.h;
                  data.ti   = null;
                  data.zo   = null;
                  data.ho   = null;
                  data.to   = null;
                  break;
             }


           out.push(data); 
           break; 

           /* ------------------------------------

            PARALLEL RAYS 

           ---------------------------------------- */


            case "parallel": case "beam":

              out.push({ id    : each.id,
                         type  : each.type,
                         which : each.which,                                                              
                         to    : each.th,
                         zo    : -Infinity, // OBJECT 
                         ho    : null,
                         zi    : null,
                         hi    : null,
                         ti    : null });
              break;

            default:
              error ("not iplemented.");
              break;

        }

    });
    return out;
}



