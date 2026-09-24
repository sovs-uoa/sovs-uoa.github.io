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
                        thickness:   "",
                        stop:        "",
                        aperture:    "", 
                      
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

    // hide everything
    $("#lens-type-index").hide();
    $("#lens-type-sphere").hide();
    $("#lens-type-thick").hide();
    $("#lens-type-thin").hide();        

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

      default:
        console.log("unknown selected.");
        lens.modal.type = lensType;

    }


  $("#modalLoginForm").modal("show");

 }


function lensObjectSelector(elem) {
    

    var objectType      = elem.getAttribute("data-short-id");
    var objectTypeLong  = elem.innerText;

    // update this field 
    $("#point-type-text-readonly").val(objectTypeLong);

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

TOGGLEOBJECTINFINITYCELL  Click handler for the "&infin;" column in the Objects and Images table.
Only meaningful for a row of type "object" - other types (point/source/beam/afocal) are fixed at
creation and the cell stays blank/inert for them. Flipping the flag swaps the row between a finite
object (z/h) and a beam from infinity (angle), filling in sensible defaults for whichever side wasn't
in use, then asks application.js to rebuild the drawn construction (which may be a different
Construction class - e.g. PointSourceConstruction vs. ParallelBeamConstruction/AfocalBeamConstruction).

----------------------------------------------------------------------------------------------------------- */

function toggleObjectInfinityCell (e, cell) {

    var data = cell.getRow().getData();
    if (data.type !== "object") { return; } // not applicable - leave blank/inert

    var atInfinity = !data.infinity;
    var update = { id: data.id, infinity: atInfinity };

    if (atInfinity) {
        update.to = isFinite(data.to) ? data.to : 30;
        update.zo = undefined;
        update.ho = undefined;
    } else {
        update.zo = isFinite(data.zo) ? data.zo : -0.5;
        update.ho = isFinite(data.ho) ? data.ho : 0.1;
        update.to = undefined;
    }

    lens.pointsTable.updateData([update]);
    updateConstruction(cell);
 }




 function addModalInfoToTable() {


    // get the modal dialog information 

    console.log(lens.table.getData());

    var rowCount            = lens.table.getDataCount();
    lens.modal.id           = rowCount + 1;
    lens.modal.tag_id       = "NA";
    lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    lens.modal.description  = document.getElementById("modal-lens-element-description").value;
    lens.modal.index        = Number(document.getElementById("modal-lens-refractive-index").value);
    lens.modal.thickness    = Number(document.getElementById("modal-lens-thickness").value); 
    lens.modal.radius       = Number(document.getElementById("modal-lens-radius-of-curvature").value);
    lens.modal.power        = Number(document.getElementById("modal-thin-power").value);
    lens.modal.aperture     = Number(document.getElementById("modal-lens-aperture-diameter").value);

    // add a row to the table 
    // console.log(lens.modal);
    lens.table.addData(lens.modal);

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
  if ((data.type == "thin") || (data.type == "sphere") || (data.type == "img") ) 
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

    // dont highlight this line!
    cell.getRow().toggleSelect();    
  }
}


function editCheck (cell) {

    //get data for the row 
    var row  = cell.getRow();
    var data = row.getData();
    var columnName = cell.getColumn().getField();
    // row.deselect();    
    row.toggleSelect();

    console.log("edit check column = " + columnName);
    console.log(data);


    switch (data.type) {

      case "sphere": case "img":
      if (columnName == "power")    { return true; }; 
      if (columnName == "radius")   { return true; }; 
      if (columnName == "aperture") { return true; }; 
      if (columnName == "stop")     { return true; };       
      break;

      case "thin":
      if (columnName == "power") { return true; }; 
      if (columnName == "aperture") { return true; }; 
      if (columnName == "stop")     { return true; };       
      break;


      case "index":
      if (columnName == "index")     { return true; }; 
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


    function apertureStop (cell) {

        // 
        if (cell.getValue() == true) {
          return "<span class=\"badge badge-info\">STOP</span>";
        } else {
          return "";
        }
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
        updatedFieldCheck (cell);         // check if a dependent cell was changed / updated   
        updatePrescriptionCallback(cell); // other updates 
      },
      data:lensTable,
      height:"300px",
      addRowPos:"bottom",
      layout:"fitColumns",
      selectable:true, 
      movableRows:true,
      columns:[
          {rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
          //{title:"Group",         field:"group",            width:100, headerSort:false},                  
          {title:"Id",            field:"id",               width:100, headerSort:false, width:50},                            
          {title:"Type",          field:"type",             width:100, headerSort:false},                  
          {title:"Description",   field:"description",      width:100, editor:"input", headerSort:false, width:200},
          {title:"Ref. Index",    field:"index",            width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck, validator:["min:1.0", "max:5.0"]},
          {title:"Surf. R.",      field:"radius",           width:100, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Power",         field:"power",            width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Thickness",     field:"thickness",        width:100, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Ap. Diameter",  field:"aperture",         width:100, mutator:Number, formatter: distanceFormatter, editor: distanceEditor, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", headerSort:false, editable: editCheck},
          {title:"Stop Flag",     field:"stop",             width:100, align:"center", width:100, headerSort:false, formatter:"tickCross", cellClick:tickToggle, formatterParams:{ allowEmpty:true, allowTruthy:true, tickElement:"<span class=\"badge badge-info\">STOP</span>", crossElement:"" }
           }],
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


    if (choosePoint & !chooseObject) {

        lens.modal.source.z  = Number(document.getElementById("modal-point-z").value);
        lens.modal.source.h  = Number(document.getElementById("modal-point-h").value);
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
            lens.modal.source.beamwidth = Number(document.getElementById("modal-object-infinite-beam-width").value);
            lens.modal.source.z         = undefined;
            lens.modal.source.h         = undefined;

        } else {

            lens.modal.source.z         = Number(document.getElementById("modal-object-z").value);
            lens.modal.source.h         = Number(document.getElementById("modal-object-h").value);
            lens.modal.source.beamwidth = Number(document.getElementById("modal-object-finite-beam-width").value);
            lens.modal.source.t         = undefined;

        }

    } else if (chooseBeam) {

        lens.modal.source.t  = Number(document.getElementById("modal-beam-angle").value);
        lens.modal.source.beamwidth= Number(document.getElementById("modal-beam-width").value);  // beamwidth not shown
        lens.modal.source.type  = "beam";
        lens.modal.source.which = "object";
        lens.modal.source.z     = undefined;
        lens.modal.source.h     = undefined;

    } else if (chooseAfocal) {

        lens.modal.source.type  = "afocal";
        lens.modal.source.which = "object";
        lens.modal.source.t  = Number(document.getElementById("modal-afocal-angle").value);
        lens.modal.source.beamwidth = Number(document.getElementById("modal-afocal-width").value);  // beamwidth not shown
        lens.modal.source.z  = undefined;
        lens.modal.source.h  = undefined;

    } else if (chooseSource) {
        lens.modal.source.z  = Number(document.getElementById("modal-source-z").value);
        lens.modal.source.h  = Number(document.getElementById("modal-source-h").value);  // beamwidth not shown
        lens.modal.source.type  = "source";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.beamwidth= Number(document.getElementById("modal-source-beam-width").value);  // beamwidth not shown

    }


    // add construction  + update table
    addConstruction (lens.modal.source);
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



      //Build Tabulator
      lens.pointsTable = new Tabulator("#lens-points", {
        data:data,
        height:"200px",
        addRowPos:"bottom",
        selectable:true, 
        movableRows:false,
        layout:"fitColumns",
        cellEditCancelled:function(cell){ cell.getRow().select(); },
        columns:[
            {rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
            {title:"id",     field:"id",       width:50, headerSort:false},
            {title:"type",   field:"type",     width:100, headerSort:false},
            {title:"&infin;", field:"infinity", width:50, align:"center", headerSort:false,
             formatter:"tickCross",
             formatterParams:{ allowEmpty:true, allowTruthy:true, tickElement:"<span class=\"badge badge-info\">&infin;</span>", crossElement:"" },
             cellClick: toggleObjectInfinityCell },
            //{title:"X1",     field:"X1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" } },                  
            //{title:"Y1",     field:"Y1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" }, accessor: flipVal },
            {title:"X1",                          field:"X1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y1",                          field:"Y1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"X2",                          field:"X2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y2",                          field:"Y2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>l</i>",                    field:"l",  visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l&prime;</i>",             field:"ld", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l<sub>v</sub></i>",        field:"zo", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l<sub>v&prime;</sub></i>", field:"zi", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>h</i>",                    field:"ho", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>h&prime;</i>",             field:"hi", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>&theta;</i>",              field:"to", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 6, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            // {title:"<i>&theta;&prime;</i>",       field:"ti", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>&theta;&prime;</i>",       field:"ti", visible:true,  width:100, headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>beam width</i>",           field:"beamwidth", visible:true,  width:100, editor: distanceEditor, headerSort:false, mutator:Number, formatter: distanceFormatter, formatterParams:{ precision: 6, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck }                              
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



