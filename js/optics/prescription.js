/* PRESCPRTION RELATED 




*/


var lens = {  prescription : null, 
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
    $("#lens-type-beam").hide();
    $("#lens-type-afocal").hide();
    $("#lens-type-source").hide();


    switch (objectType) {

      case "source":
        $("#lens-type-source").show();
        //console.log("point/source type selected");
        break;

      case "point":
        $("#lens-type-point").show();
        console.log("point/source type selected");
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
  if ((data.type == "thin") || (data.type == "sphere")) 
  {
    // var column = cell.getColumn().getData();
    cell.setValue(!cell.getValue()); 
    cell.getRow().toggleSelect();    
  }
}


function editCheck (cell) {

    //get data for the row 
    var data = cell.getRow().getData();
    var columnName = cell.getColumn().getField();


    console.log("edit check column = " + columnName);
    console.log(data);


    switch (data.type) {

      case "sphere":
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
      cellEdited:function(cell){
        console.log("lens edited - update the prescription");
        console.log(cell);
        updatePrescriptionCallback(cell);
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
          {title:"Id",            field:"id",               width:100, headerSort:false},                            
          {title:"Type",          field:"type",             width:100, headerSort:false},                  
          {title:"Description",   field:"description",      width:100, editor:"input", headerSort:false},
          {title:"Ref. Index",    field:"index",            width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck, validator:["min:1.0", "max:5.0"]},
          {title:"Surf. R.",      field:"radius",           width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Power",         field:"power",            width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Thickness",     field:"thickness",        width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Ap. Diameter",  field:"aperture",         width:100, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "" }, align:"center", editor:"input", headerSort:false, editable: editCheck},
          {title:"Stop Flag",     field:"stop",             width:100, align:"center", width:100, headerSort:false, formatter:"tickCross", cellClick:tickToggle, formatterParams:{ allowEmpty:true, allowTruthy:true, tickElement:"<span class=\"badge badge-info\">STOP</span>", crossElement:"" }
           }],
    });




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

 function addModalInfoToPointsTable() {


    var rowCount                  = lens.table.getDataCount();
    lens.modal.source.id          = rowCount + 1;
    // lens.modal.source.tag_id      = "NA";
    // lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    // lens.modal.description  = document.getElementById("modal-lens-element-description").value;
    // lens.modal.source.type    = document.getElementById("modal-point-type").value;          // finite or parallel


    var chooseBeam   = $("#lens-type-beam").is(":visible");
    var choosePoint  = $("#lens-type-point").is(":visible");
    var chooseAfocal = $("#lens-type-afocal").is(":visible");
    var chooseSource = $("#lens-type-source").is(":visible");
    

    if (chooseBeam & !choosePoint & !chooseAfocal  & !chooseSource) {

        lens.modal.source.t  = Number(document.getElementById("modal-beam-angle").value);
        lens.modal.source.bw = Number(document.getElementById("modal-beam-width").value);  // beamwidth not shown
        lens.modal.source.type  = "beam";
        lens.modal.source.which = "object";
        lens.modal.source.z     = undefined;
        lens.modal.source.h     = undefined;        

    } else if (choosePoint & !chooseBeam & !chooseAfocal  & !chooseSource) {

        lens.modal.source.z  = Number(document.getElementById("modal-point-z").value);
        lens.modal.source.h  = Number(document.getElementById("modal-point-h").value); 
        lens.modal.source.type  = "point";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.bw    = undefined;      

    } else if (!choosePoint & !chooseBeam & chooseAfocal  & !chooseSource) {  

        lens.modal.source.type  = "afocal";
        lens.modal.source.which = "object";
        lens.modal.source.t  = Number(document.getElementById("modal-afocal-angle").value);
        lens.modal.source.bw = Number(document.getElementById("modal-afocal-width").value);  // beamwidth not shown
        lens.modal.source.z  = undefined;
        lens.modal.source.h  = undefined;      

    } else if (!choosePoint & !chooseBeam & !chooseAfocal  & chooseSource) {  
        lens.modal.source.z  = Number(document.getElementById("modal-source-z").value);
        lens.modal.source.h  = Number(document.getElementById("modal-source-h").value);  // beamwidth not shown
        lens.modal.source.type  = "source";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.bw    = undefined;

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
    var data = cell.getRow().getData();
    var columnName = cell.getColumn().getField();


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
        columns:[
            {rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
            {title:"id",     field:"id",       width:100, headerSort:false},                  
            {title:"type",   field:"type",     width:100, headerSort:false},                  
            //{title:"X1",     field:"X1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" } },                  
            //{title:"Y1",     field:"Y1",       width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" }, accessor: flipVal },
            {title:"X1",                          field:"X1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y1",                          field:"Y1", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"X2",                          field:"X2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"Y2",                          field:"Y2", visible:false, width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>l</i>",                    field:"l",  visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l&prime;</i>",             field:"ld", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>l<sub>v</sub></i>",        field:"zo", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>l&prime;<sub>v</sub></i>", field:"zi", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--" },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>h</i>",                    field:"ho", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>h&prime;</i>",             field:"hi", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },
            {title:"<i>&theta;&prime;</i>",       field:"to", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck },                  
            {title:"<i>&theta;</i>",              field:"ti", visible:true,  width:100, editor:"input", headerSort:false, mutator:Number, formatter: decimalPlaces, formatterParams:{ precision: 3, emptyVal: "--",  flipVal:false },  cellEdited:  defaultEditFunction, editable:editPointCheck }
        ],
      });



      // ok does this work 
      lens.pointsTableHandler= new DataTableHandler (lens.pointsTable);
      lens.pointsTableHandler.attach({ column: "ho", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "hi", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "to", filter: flipVal });
      lens.pointsTableHandler.attach({ column: "ti", filter: flipVal });



      console.log("PRESCRIPTION");
      console.log(lens.pointsTableHandler);

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



