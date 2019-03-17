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

    switch (objectType) {

      case "point": // show those elements for the index 
        $("#lens-type-point").show();
        console.log("point type selected");
        break;

      case "beam": // show those elements for the sphere 
        $("#lens-type-beam").show();        
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
          {title:"Group",         field:"group",            width:100, headerSort:false},                  
          {title:"Type",          field:"type",             width:100, headerSort:false},                  
          {title:"Description",   field:"description",      width:200, editor:"input", headerSort:false},
          {title:"Ref. Index",    field:"index",            mutator:Number, width:100, align:"center", sorter:"number", editor:"input", headerSort:false},
          {title:"Surf. R.",      field:"radius",           mutator:Number, align:"center", width:100, editor:"input", headerSort:false},
          {title:"Power",         field:"power",            mutator:Number, align:"center", width:100, editor:true, headerSort:false},
          {title:"Thickness",     field:"thickness",        mutator:Number, align:"center", width:100, editor:"input", headerSort:false},
          {title:"Ap. Diameter",  field:"aperture",         align:"center", width:100, editor:"input", headerSort:false},
          {title:"Stop Flag",     field:"stop",             align:"center", width:100, sorter:"date", editor:"input", headerSort:false, formatter:apertureStop}
      ],
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
    //lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    //lens.modal.description  = document.getElementById("modal-lens-element-description").value;

    // lens.modal.source.type    = document.getElementById("modal-point-type").value;          // finite or parallel
    lens.modal.source.z  = Number(document.getElementById("modal-point-z").value);
    lens.modal.source.h  = Number(document.getElementById("modal-point-h").value); 
    lens.modal.source.t  = Number(document.getElementById("modal-beam-angle").value);
    lens.modal.source.bw = Number(document.getElementById("modal-beam-width").value);  // beamwidth not shown

    var chooseBeam  = $("#lens-type-beam").is(":visible");
    var choosePoint = $("#lens-type-point").is(":visible");
    if (chooseBeam & !choosePoint ) {
        lens.modal.source.type  = "beam";
        lens.modal.source.which = "object";
        lens.modal.source.z     = undefined;
        lens.modal.source.h     = undefined;        
    } else if (choosePoint & !chooseBeam ) {
        lens.modal.source.type  = "point";
        lens.modal.source.which = "object";
        lens.modal.source.t     = undefined;
        lens.modal.source.bw    = undefined;        
    }


    // add construction  + update table 
    addConstruction (lens.modal.source);



    $("#pointAddForm").modal("hide");
 }



function decimalPlaces(cell, formatterParams, onRendered){
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered

    var val = cell.getValue();    

    if (val == null) {
      return "---";
    };

    return Number(val).toFixed(formatterParams.precision);
 
}


// lens information 
function initializePointsTable(data, updatePointsCallback, success) {

/*
      cellEdited:function(e, cell){
        console.log("point edited - update the view");
        updateViewCallback();
      },
*/

      console.log('points table ... initializing.');

      //Build Tabulator
      lens.pointsTable = new Tabulator("#lens-points", {
         cellEdited:function(cell){
          console.log("point edited - update the prescription");
          updatePointsCallback (cell);
        },
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
            {title:"zo",     field:"zo",       width:100, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} },                  
            {title:"ho",     field:"ho",       width:200, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} },
            {title:"zi",     field:"zi",       width:100, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} },                  
            {title:"hi",     field:"hi",       width:200, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} },
            {title:"to",     field:"to",       width:100, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} },                  
            {title:"ti",     field:"ti",       width:200, editor:"input", headerSort:false, formatter: decimalPlaces, formatterParams:{ precision: 2} }
        ],
      });


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



