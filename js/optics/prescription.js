/* PRESCPRTION RELATED 




*/


var lens = {  prescription : null, 
              tabledata    : null,
              table        : null,
              points       : null,
              pointsTable  : null,

              modal: { group:       "",
                        type:        "",
                        description: "",
                        radius:      "",
                        height:      "",
                        index:       "",
                        thickness:   "",
                        stop:        "",
                        aperture:    "" 
                      } 
            };

 
function lensTypeSelector(lensType) {
    

    $("#lens-type-text-readonly").val(lensType);
    $("#lens-type-index").hide();
    $("#lens-type-sphere").hide();
    $("#lens-type-thick").hide();
    $("#lens-type-thin").hide();        

    switch (lensType) {

      case "Index": // show those elements for the index 
        $("#lens-type-index").show();
        console.log("index selected");
        lens.modal.type = lensType;
        break;

      case "Sphere": // show those elements for the sphere 
        $("#lens-type-sphere").show();        
        console.log("sphere selected");
        lens.modal.type = lensType;
        break;

      case "Thin": // show those elements for the sphere 
        $("#lens-type-thin").show();        
        console.log("sphere selected");
        lens.modal.type = lensType;
        break;

      case "Thick": // show those elements for the sphere 
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

    // console.log(data);

    //  convert to standard form 
    lensTable      = convertToLensTable(data);  // fill in missing fields!

    // Tabulator 
    lens.table = new Tabulator("#lens-table", {
      cellEdited:function(cell){
        console.log("lens edited - update the prescription");
        updatePrescriptionCallback();
      },
      data:lensTable,
      height:"500px",
      addRowPos:"bottom",
      selectable:true, 
      movableRows:true,
      columns:[
          {rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
          {title:"Group",         field:"group",            width:100, headerSort:false},                  
          {title:"Type",          field:"type",             width:100, headerSort:false},                  
          {title:"Description",   field:"description",      width:200, editor:"input", headerSort:false},
          {title:"Ref. Index",    field:"index",            mutator:Number, width:100, align:"center", sorter:"number", editor:"input", headerSort:false},
          {title:"Surf. R.",      field:"radius",           mutator:Number, align:"center", width:100, editor:"input", headerSort:false},
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



    var rowCount            = lens.table.getDataCount();
    lens.modal.id           = rowCount + 1;
    lens.modal.tag_id       = "NA";
    lens.modal.group        = document.getElementById("modal-lens-group-name").value;
    lens.modal.description  = document.getElementById("modal-lens-element-description").value;
    lens.modal.index        = Number(document.getElementById("modal-lens-refractive-index").value);
    lens.modal.thickness    = Number(document.getElementById("modal-lens-thickness").value); 
    lens.modal.radius       = Number(document.getElementById("modal-lens-radius-of-curvature").value);
    lens.modal.aperture     = Number(document.getElementById("modal-lens-aperture-diameter").value);

    // add a row to the table 
    // console.log(lens.modal);
    lens.pointsTable.addData(lens.modal);

  
    // dismiss the modal 
    $("#addPointsForm").modal("hide");

    console.log(lens.table.getData());
 }



// lens information 
function initializePointsTable(data, updatePointsCallback, success) {

/*
      cellEdited:function(e, cell){
        console.log("point edited - update the view");
        updateViewCallback();
      },
*/

 

    //Build Tabulator
    lens.pointsTable = new Tabulator("#lens-points", {
       cellEdited:function(cell){
        console.log("point edited - update the prescription");
        updatePointsCallback();
      },
      data:data,
      height:"200px",
      addRowPos:"bottom",
      selectable:false, 
      movableRows:false,
      layout:"fitColumns",
      columns:[
          {rowHandle:true, formatter:"handle", headerSort:false, frozen:true, width:30, minWidth:30},
          {title:"id",    field:"id",      width:100, headerSort:false},                  
          {title:"type",  field:"type",    width:100, headerSort:false},                  
          {title:"z",     field:"z",       width:100, editor:"input", headerSort:false},                  
          {title:"h",     field:"h",       width:200, editor:"input", headerSort:false},
      ],
    });


    // show the points 
    updatePointsCallback ();

    //Add row on "Add Row" button click
    $("#lens-points-add-point").click(function(){
        // entry area here 
    });

    //Delete row on "Delete Row" button click
    $("#lens-points-del-row").click(function(){
        lens.pointsTable.deleteRow(1);
    });

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




