  var   ap;

  var   SelectedObjectPointId;
  var   totalConjList = [];
  var   c, dot;
  var   objectPoint;      // this should be a list or hash-table
  var   renderableLens;
  var   lensTable;
  var   ps, cd_set;
  const gridSnapSize = 0.001;
  var   summaryTemplate;
  var   reportTamplate;

  var    mouseIsDown = false;
  
  var   etol = 5e-4;
  var   fileList  = [ { id: "0", filename: "./lenses/thick-lens-positive.lens", title: "Thick Lens in Air (Positive Power)" }, 
                      { id: "1", filename: "./lenses/thick-lens-negative.lens", title: "Thick Lens in Air (Negative Power)" },
                      { id: "2", filename: "./lenses/thin-lens-positive.lens", title: "Thin Lens in Air (Positive)"  },
                      { id: "3", filename: "./lenses/thin-lens-negative.lens", title: "Thin Lens in Air (Negative)"  },
                      { id: "4", filename: "./lenses/two-thin-lenses-positive.lens", title: "Two Thin Lenses in Air (Nominal Positive Power)"  },   
                      { id: "5", filename: "./lenses/two-thin-lenses-negative.lens", title: "Two Thin Lenses in Air (Nominal Negative Power)"  },
                      { id: "6", filename: "./lenses/keplerian-telescope.lens", title: "Keplerian Telescope"  },
                      { id: "7", filename: "./lenses/galilean-telescope.lens", title: "Galilean Telescope"  } ];


    displayOptions = { height             : 0.05, 
                     showCardinalPoints   : true,
                     showFocalPoints      : true,
                     showNodalPoints      : false, 
                     showPrincipalPoints  : false, 
                     showVertices         : true };

  Mustache.Formatters = {
      "decimal": function (value, decimals) {


        console.log("value = " + value);
        if (Number.isNaN(value)) {
          return "undefined";
        }

        if (!isFinite(value) | value == null) {
          return "undefined";
        }

       var value = Number(Math.round(value+'e'+decimals)+'e-'+decimals);

        return value
      }
    }


/* -------------------------------------------------------------------------------

getConjuugateTo

------------------------------------------------------------------------------- */

  function getConjugateTo (which, eachPoint, lens) {

    // updates the conjugate end point in the table

    switch (which) {

      case "object":

      eachPoint.zo = Number(eachPoint.zo);
      eachPoint.ho = Number(eachPoint.ho);

      pointInfo   = Optics.calculatePointToPoint(lens, [ eachPoint ]); // object to image 
      return pointInfo[0];
      
      case "image":

      eachPoint.zi = Number(eachPoint.zi);
      eachPoint.hi = Number(eachPoint.hi);


      error("not implemented!"); // need to change the "calculatePointToPoint"
      break;


      default:
        error ("dont know this one!");

    }
  }



  /* -----------------------------------------------------------------------------


    UPDATE POINTS TABLE 


  --------------------------------------------------------------------------------- */


  function updatePointsTable(id, pairData) {

/*    
      lens.pointsTable.updateData([{  id: id, 
                                      X1: pairData.X1, Y1: pairData.Y1,
                                      X2: pairData.X2, Y2: pairData.Y2,
                                      l:  pairData.PO, ld: pairData.PI,                                            
                                      to: pairData.T1, ti: pairData.T2,                                                                                              
                                      zo: pairData.VO, zi: pairData.VI, 
                                      ho: pairData.OQ, hi: pairData.IQ }]);
*/


      lens.pointsTableHandler.updateData([ {  id: id, 
                                      X1: pairData.X1, Y1: pairData.Y1,
                                      X2: pairData.X2, Y2: pairData.Y2,
                                      l:  pairData.PO, ld: pairData.PI,                                            
                                      to: pairData.T1, ti: pairData.T2,                                                                                              
                                      zo: pairData.VO, zi: pairData.VI, 
                                      ho: pairData.OQ, hi: pairData.IQ }]);

  };



  function addPointsTableRow(aPoint, pairData) {

      lens.pointsTableHandler.addRow([ {  id: aPoint.id,
                                          type: aPoint.type, 
                                          X1: pairData.X1, Y1: pairData.Y1,
                                          X2: pairData.X2, Y2: pairData.Y2,
                                          l:  pairData.PO, ld: pairData.PI,                                            
                                          to: pairData.T1, ti: pairData.T2,                                                                                              
                                          zo: pairData.VO, zi: pairData.VI, 
                                          ho: pairData.OQ, hi: pairData.IQ }]);




      //console.log( lens.table.getData ());





  };







  /* -----------------------------------------------------------------------------


    EVENT HANDLERS FOR DRAGGABLE POINTS 


  --------------------------------------------------------------------------------- */



  function select (id) {

      console.log ("object click");
      setScaleFactor ();
      nowX = dot.ox; nowY = dot.oy;
      nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;
      dot.attr({ cx: nowX, cy: nowY });
      console.log("cx = " + nowX);
      console.log("cy = " + nowY);
      SelectedObjectPointId = id;


  }

/*
  function move (dx, dy) {

      eleminfo = this.data("info");

      console.log("--- called move point id = " + eleminfo.id + "(" + this.id + ")");  

      setScaleFactor ();

      dx = kx*dx; 
      dy = ky*dy;

      nowX = this.ox + dx;
      nowY = this.oy + dy;

      nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

      this.attr({ cx: nowX, cy: nowY });
  
      // we should recalculate all the points 

      //console.log("id = " + this.id); 
      //console.log("moving object");
      //console.log(this);
      

      switch (eleminfo.type) {

          case "object" :
            lens.pointsTable.updateData([ { "id": eleminfo.id, "zo": nowX, "ho": nowY } ]);
            conjPt = getConjTo (eleminfo.type, { id:0, zo: nowX, ho: nowY }); // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": eleminfo.id, "zi": conjPt.X2, "hi": conjPt.Y2 } ]); // change this for vertex 
            c = paper.getById("point-" + eleminfo.id + "-image");
            c.attr({ cx: conjPt.X2, cy: conjPt.Y2 });
            console.log('element Located');
            console.log(c);
            console.log(conjPt);
            break;

          case "image" :
            lens.pointsTable.updateData([ { "id": eleminfo.id, "zi": nowX, "hi": nowY } ]);
            conjPt = getConjTo (this.id.type, { id:0, zo: nowX, ho: nowY });   // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": eleminfo.id, "zi": conjPt.X1, "hi": conjPt.Y1 } ]);
            c = paper.getById("point-" + eleminfo.id + "-image");
            c.attr({ cx: conjPt.X1, cy: conjPt.Y1 });
            error("error!");
            break;

          default:
            error("unknown draggable");

      }


      // update the location of the rays !!!!
      updatePointsView ();
   }

  function start () {

      console.log("--- called start point id = " + this.id);  

      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");

  }

  
  function up () {

      console.log("--- called up point id = " + this.id);  

  }

*/

/*

  function update () {

      var PointToPointList  = Optics.calculatePointToPoint(renderableLens.total, objectPoint);
      p2p = PointToPointList[0];            
      drawCardinalRays(renderableLens.total, p2p, displayOptions);
      drawPointToPoint(PointToPointList); // overall system

  }
*/

  function updatePrescriptionView() {

    // read the lens table 
    console.log("updating prescription table");
    lensTable = lens.table.getData();    
    renderableLens = Optics.analyze(lensTable); // create matrices / we should have group caridnals in here as well


    isafocal = (renderableLens.total.F == 0);

    var vertHeight = 0.3;
    if (response.hasOwnProperty("general")) {
        if(response.general.hasOwnProperty("cardinalVertHeight")) {
          vertHeight = response.general.cardinalVertHeight;
        }

    }


    displayOptions = { height                   : 0.3, 
                       cardinalVertHeight       : vertHeight,
                       showCardinalPoints       : !isafocal,
                       showFocalPoints          : true,
                       showNodalPoints          : true, 
                       showPrincipalPoints      : true, 
                       showVertices             : true,
                       showPupils               : true};


    //console.log("cardinal = " + response.general.cardinalVertHeight + " OR " + displayOptions.cardinalVertHeight );

    drawCardinalPoints(0, 0, renderableLens.total, displayOptions); // (0,0) 
    drawPupils(renderableLens.total, displayOptions);
    drawOptics(renderableLens);


    // now update the points 
    if (summaryTemplate !== undefined) {
      console.log("Summary template!");
      console.log(summaryTemplate);
      updateSummaryView (); 
    }

    // re-calculate all the constructions
    // refreshAllConstruction ();

    // Only do this - if there are rays in the table 
    if (lens.pointsTable !== null ) {
      refreshAllConstruction ();
    }

  }




  function updateSummaryView () {

    console.log ("-- updating the summary");
    //console.log(summaryTemplate);
    var summary = document.getElementById("summary-tab");
    summary.innerHTML = Mustache.render(summaryTemplate, renderableLens.total);

    // renderableLens 
    // Total Summary 
    // Groups Summary 
  }



  /* 

    UPDATEPOINTSVIEW 

        - refresh (non-draggable) items from the paper  
        - remove updating of object/image pairs 

  */

  function showConjugates () {

    pointsTable = lens.pointsTable.getData();    
    pointsList  = Optics.calculatePointToPoint(renderableLens.total, pointsTable);
    totalLens   = renderableLens.total;

    if (pointsList.length > 0) {
        pointsList.forEach( elem => {
          console.log("showing .... conjugate pair id = " + elem.id);
          drawConjugates(elem, displayOptions);
        } );
    }
  }

  function getConjTo (which, eachPoint, lens) {

    // updates the conjugate end point in the table
    totalLens   = renderableLens.total;    
    pointInfo   = Optics.calculatePointToPoint(totalLens, [ eachPoint ]);

    switch (which) {

      case "object":
      return pointInfo[0];
      
      case "image":
      error("not implemented!"); // need to change the "calculatePointToPoint"
      break;


      default:
        error ("dont know this one!");

    }
  }



  function updatePointsView() {

    // re-calculate positions
    totalLens   = renderableLens.total;
    pointsTable = lens.pointsTable.getData();    
    pointsList  = Optics.calculatePointToPoint(totalLens, pointsTable); // a bunch of points !!!


    /* --------------------------------------------------------------------------

        REDRAW THE RAYS CONSTRUCTION  

        Redraw the rays construction 

    ------------------------------------------------------------------------------ */

    // completely clear rays 
    if (totalConjList.length > 0) {
        totalConjList.forEach( elem => {
          console.log("--- clear element.");
          //console.log(elem);
          elem.remove ();
        } );
    }

    totalConjList = [];
    for (var i = 0; i < pointsList.length ; i++) {
      console.log("showing ... construction " + i );
      eachConj = new RayConstruction ();
      eachConj.displayOptions = displayOptions; 
      eachConj.drawCardinalRays(totalLens, pointsList[i]);
      //eachConj.drawConjugates(pointsList[i]);
      totalConjList.push(eachConj);
    }

  }


  /* --------------------------------------------------------------------------------------------------

      UPDATECONSTRUCTION - fired when the cell is edited 

   -------------------------------------------------------------------------------------------------- -- */

   function getPointFromCell(cell) {

    fieldname = cell.getColumn().getField();    
    aPoint    = cell.getRow ().getData();

    console.log("got this point.");
    console.log(aPoint);

    aPoints   = lens.pointsTableHandler.convertRowData([ aPoint ]); // apply filters     
    aPoint    = aPoints[0];

    console.log("transformed this point.");
    console.log(aPoint);
    console.log(fieldname)

    switch (fieldname) {
      case "zo": case "ho": case "to":
        return { id: aPoint.id, which: "object", z: Number(aPoint.zo), h: Number(aPoint.ho), t: Number(aPoint.to) };

      case "zi": case "hi": case "ti":
        return { id: aPoint.id, which: "image", z: Number(aPoint.zi), h: Number(aPoint.hi), t: Number(aPoint.ti) };

      default:
        throw "unknown point type";
    }
   }


   /* ----------------------------------------------------------------------------------------------------------------

      UPDATECONSTRUCTION update points based on a changed cell 

  ----------------------------------------------------------------------------------------------------------------   */

  // This should re-build all the constructions in the list 
  function refreshAllConstruction () {

      totalLens   = renderableLens.total;
      pointsTable = lens.pointsTable.getData();            
      lens.raphael.constructions.forEach (elem => {
            aRow       = lens.pointsTable.getRow(elem.getId()).getData();
            aPoint     = { id: aRow.id, which: "object", z:aRow.zo, h:aRow.ho, t:aRow.to };
            pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
            elem.setPairData(pairData);       
            elem.setLens(totalLens); // <--- this should change 
            elem.refresh();
    });
  }


  function addConstruction (aPoint) {

     console.log("add construction called.");
     totalLens  = renderableLens.total;
     pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
     
     //lens.pointsTable.addRow([{  id: aPoint.id, 
     //                            type: aPoint.type }]);

     addPointsTableRow(aPoint, pairData);

     // update the points table with these data
     switch (aPoint.type) {

            case "source":   // finite placed beam 
              lens.raphael.constructions.push( new PointSourceConstruction (totalLens, pairData));
              break;

            case "finite": case "point":   // finite placed beam 
              lens.raphael.constructions.push( new PrincipalRayConstruction (totalLens, pairData));
              break;

            case "parallel": case "beam": // infinitely placed beam 
              lens.raphael.constructions.push( new ParallelBeamConstruction (totalLens, pairData));
              break;


           case "afocal": // infinitely placed beam 

              console.log("AFOCAL");
              console.log(aPoint);

              var afocal = new AfocalBeamConstruction (totalLens, pairData);
              lens.raphael.constructions.push(afocal);
              break;

            
            default: 
              break;
      }

  }



  function deleteConstruction (id) {
    for(var i = 0; i < lens.raphael.constructions.length; i++ ) {
        console.log("This constructions =>");
        console.log(lens.raphael.constructions[i]);
        if (lens.raphael.constructions[i].getId() == id) {
            console.log("deleting object/image object id = " + id);
            lens.raphael.constructions[i].delete();
            lens.raphael.constructions.splice(i, 1);
        } 

    }
  }


 /* ----------------------------------------------------------------------------------------------------------------

      UPDATECONSTRUCTION update points based on a changed cell 

  ----------------------------------------------------------------------------------------------------------------   */

  function updateConstruction (cell) {

    console.log("update the graphical end of the construction.");

    //console.log(e);
    

    console.log(cell);


    if (cell == null) {
        return;
    }

    aPoint     = getPointFromCell(cell); // .getData();


    console.log("point from cell");
    console.log(aPoint);

    totalLens  = renderableLens.total;
    pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens); // only works in fwd direction / only works for finite 
    updatePointsTable(aPoint.id, pairData);


    // need to find the construction corresponding to the point and then update it!
    for (var i = 0; i < lens.raphael.constructions.length; i++ ) {

        elem = lens.raphael.constructions[i];

        console.log("compare: " + elem.getId() + " == " + aPoint.id);

        if (aPoint.id == elem.getId()) {
          elem.setPairData (pairData); // update 

          elem.refresh ();
          //elem.remove ();
          //elem.draw ();
          return
        }
    }


    console.log("construction not found!");

/*
    var n = lens.raphael.constructions;
    for (var i=0 ; i < lens.raphael.constructions.length; i++ ) {
      lens.raphael.constructions[i].update();
      lens.raphael.constructions[i].draw (); // should clear everything in the object and redraw it 
    }
*/


  }



  function downloadReport (which) {


      switch (which) {

        case "picture":


          // Add style to SVG and also some required information 
          var svgElement = document.getElementsByTagName('svg')[0];
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          var svgStyle   = document.createElementNS("http://www.w3.org/2000/svg", "style");
          style = "path,circle,text{vector-effect:non-scaling-stroke;stroke-width:2px;}";
          svgStyle.textContent = style;
          svgElement.appendChild(svgStyle);

          var downloadTxt = svgElement.outerHTML;

          // create an elelemnt to hold the data
          var a  = window.document.createElement('a');
          a.href = window.URL.createObjectURL(new Blob([downloadTxt], {type: 'image/svg+xml'}));
          a.download = 'picture.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;


        case "report":


          // Add style to SVG and also some required information 
          var svgElement = document.getElementsByTagName('svg')[0];
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          var svgStyle   = document.createElementNS("http://www.w3.org/2000/svg", "style");
          style = "path,circle,text{vector-effect:non-scaling-stroke;stroke-width:2px;}";
          svgStyle.textContent = style;
          svgElement.appendChild(svgStyle);

          var svgTxt = svgElement.outerHTML;



          var outputData = {};
          outputData.svg     = svgTxt;           
          outputData.lens    = lens.table.getData(); 
          outputData.object  = lens.pointsTable.getData();
          totalLens          = renderableLens.total;
          outputData.summary = Mustache.render(summaryTemplate, totalLens); 
          downloadTxt        = Mustache.render(reportTemplate, outputData);

          // create an elelemnt to hold the data
          var a  = window.document.createElement('a');
          a.href = window.URL.createObjectURL(new Blob([downloadTxt], {type: 'text/html'}));
          a.download = 'report.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

        default:
          break;

      }



      //load a svg snippet in the canvas with id = 'drawingArea'
      //var myCanvas = document.createElement("canvas");
      //canvg(myCanvas, svgElement.outerHTML);
      //var base64 = myCanvas.toDataURL("image/png");
      //console.log(base64);

/*
      base64 = "";
*/


/*

      reportData = {  svg    : "circle.svg",
                      lens   : lens.table.getData (),
                      points : lens.pointsTable.getData ()
      };


      console.log("Creating ... reporter.");
      console.log(reportData);
      console.log(reportTemplate);


      // Create a download link!
      downloadTxt = Mustache.render(reportTemplate, reportData);
      var a  = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([downloadTxt], {type: 'text/html'}));
      a.download = 'report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

*/



  }


    function findLensById(id) {

      found = fileList.find(function (elem) {
          return elem.id == id;
      });

      if (found == undefined) {
        throw "Couldnt find the requested file in the configuration."
      }

      return found;
    }



    function reload (id) {

          
     // clear the prescription table and re-populate it 
     found = findLensById(id);

      $.ajax({
            url : found.filename,
            dataType: "text",
            success : function (data) {


                  response = JSON5.parse(data);
                  // ("lens-container"); // uses paper 
                   
                  // initialize the prescription that will execite on change to table 
                  initializePrescriptionTable (response.prescription, 

                        updatePrescriptionView,   // change in lenses information => full update 
                        function () {  // success !!! 

                                console.log("reloaded a prescription ...");       

                                // We can update the filename now !!
                                $("#filename_display").val(found.title);


                                // trigger a summary re-write and also a construction refresh
                                updatePrescriptionView();            


                      });

            }});
    };      




    function load (id) {


      // load the mustache report 
      $.get('mustache/report_template.htm', function(template) {
        console.log("loaded report template ... OK");
        reportTemplate = template;
      });




      found = findLensById(id);
      $.ajax({
            url : found.filename,
            dataType: "text",
            success : function (data) {


                  response = JSON5.parse(data);


                  startDrawing("lens-container"); // uses paper 


                  // capture mouse wheel using bind
                  $(paper.canvas).bind('mousewheel', function(event) {

                        console.log("mouse-wheel called");

                        // cross-browser wheel delta
                        var e = window.event || e; // old IE support
                        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                        handle(delta);
                        console.log(delta);
                        return false;
                  });


                  // mouse events 
                  $(paper.canvas).mousedown( panStart );
                  $(paper.canvas).mousemove( panMove );
                  $(paper.canvas).mouseup( panEnd );

                  paper.canvas.addEventListener("touchstart", panStart, false);
                  paper.canvas.addEventListener("touchmove",  panMove, false);
                  paper.canvas.addEventListener("touchend",   panEnd, false);

                  //$(paper.canvas).bind('touchmove', panMove, false);
                  //$(paper.canvas).bind('touchend', panEnd, false);



                  // touch events 
                  //$(paper.canvas).bind('touchstart', panStart, false);
                  //$(paper.canvas).bind('touchmove', panMove, false);
                  //$(paper.canvas).bind('touchend', panEnd, false);

                  //$(paper.canvas).touchstart(panStart);
                  //$(paper.canvas).touchmove(panMove);
                  //$(paper.canvas).touchend(panEnd);



                  // $('#prescription-tab').show(); // show the prescription tab

                   
                  // initialize the prescription that will execite on change to table 
                  initializePrescriptionTable (response.prescription, 

                        updatePrescriptionView,   // change in lenses information => full update 
                        function () {  // success !!! 

                                console.log("loaded a prescription ...");       

                                // We can update the filename now !!

                                $("#filename_display").val(found.title);
                                // console.log(found);


                                updatePrescriptionView();            


                                // show the lenses                                    
                                // $( "#prescription-nav").trigger("click"); // show the table 

                                // we can now load the prescription 
                                $.get('mustache/summary_report_tables_html.mustache', function(template) {
                          
                                    console.log("loaded a summary template ...");
                                    summaryTemplate = template; 
                                    updateSummaryView(); 


                                     // when the objects and images tab becomes visible we need to initialize it !!


                                    // add points 
/*
                                    var points  = [ { "id"   : 1, 
                                                      "type" : "point",
                                                      "which": "object",
                                                      "z"    : -20, 
                                                      "h"    : 10,
                                                      "t"    : undefined
                                                       } ];
*/

                                    
                                    /* -------------------------------------------------------------------------------------

                                        INFORMATION 
      
                                    --------------------------------------------------------------------------------------- */

                                    var points; 
                                    if (response.hasOwnProperty("sources")) {
                                            points = response.sources;
                                    } else {
                                            points  = [ { id    : 1, 
                                                          type  : "afocal",
                                                          which : "object",
                                                          z     : undefined, 
                                                          h     : undefined,
                                                          t     : 30 } ];
                                    }





/*                                                       
                                                      { "id" : 2, 
                                                      "type" : "finite",
                                                      "which": "object",
                                                      "z"    : -20, 
                                                      "h"    : -10
                                                      },
                                                      { "id" : 3, 
                                                      "type" : "parallel",
                                                      "which": "object",
                                                      "th"   : -30 
                                                      }];
*/

  /*                                                      
                                                      { "id" : 3, 
                                                      "type" : "parallel",
                                                      "which": "object",
                                                      "th"   : 30, 
                                                      }]; 
*/




                                     

                                    initializePointsTable ([], updateConstruction, function () {
                                          

                                          /* ------------------------------------------

                                          SETUP EVENT HANDLERS FOR THE METHOD 
                                          
                                          ---------------------------------------------- */


                                          //delete the row on "Delete Row" button click
                                          $("#lens-points-del-row").click(function(){
                                              console.log("request to delete sources...");
                                              selectedData = lens.pointsTable.getSelectedData(); 
                                              selectedData.forEach(elem => {
                                                  lens.pointsTable.deleteRow(elem.id);
                                                  deleteConstruction (elem.id);                                                  
                                              });
                                          });


                                          //Add row on "Add Row" button click
                                          $("#lens-points-add-point").click(function(){                                          
                                              console.log("request to add source...");
                                          });




                                          
                                          /* ------------------------------------------

                                          POINTS CAN BE SETUP INDIVIDUALLY 
                                          
                                          ---------------------------------------------- */

                                          points.forEach( eachPoint => {
                                              console.log("eachPoint");
                                              console.log(eachPoint);
                                              addConstruction (eachPoint);
                                          });


                                          $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                                            
                                            //e.target // newly activated tab
                                            //e.relatedTarget // previous active tab
                                            //console.log("Changed tab.");
                                            //console.log(e.target);

                                            console.log(e.target.id);
                                            console.log("shown tab changed.");       

                                            switch (e.target.id) {

                                               case "objects-images-nav" :
                                                  //console.log("points redraw");
                                                  //var t = $("#lens-points");
                                                  //console.log(t);
                                                  //console.log(lens.pointsTable);
                                                  
                                                  // console.log("DataTableHandler");
                                                  // console.log(DataTableHandler);

                                                  console.log(lens.pointsTable);

                                                  lens.pointsTable.redraw(true); //tabulator("redraw", true);
                                                  //$("#lens-points").tabulator("redraw", true);
                                                  break;

                                               case "prescription-nav" :

                                                  console.log("prescription redraw");
                                                  lens.table.redraw(true); //tabulator("redraw", true);
                                                  //$("#lens-table").tabulator("redraw", true);
                                                  break;

                                               default:

                                            }                                     


                                          })

                                          //rays = [ { u: 0, h: 1 } ];
                                          //console.log(renderableLens);
                                          //newrays = Optics.calculateRayTrace(rays, renderableLens.elem);
                                          //console.log(newrays);


                                          // conjugate points are draggable controllers 
                                          //showConjugates();
                                          //ap = new AnglePicker (0, 0, 5, 45);

                                          /* INITIALIZE THE VIEW */
                                          //drawOptics(renderableLens);  

                                          // add an object point that is draggable   
                                          //console.log("data from points table");
                                          //console.log(lens.pointsTable.getData());


                                          // add the draggable method to it  
                                          /*

                                          var dot = paper.circle(points[0].z, points[0].h, 1).attr({
                                                      fill: "#FFFF00",
                                                      stroke: "#000099",
                                                      "stroke-width": 3
                                                  });

                                          dot.id = points[0].id;
                                          dot.drag(move, start, up);
                                          
                                          */

                                          // put me back on the lens prescription tab
                                          // $("#objects-images-tab").removeClass("active"); 


                                      });

                                                                        
                                });





                    });



            }


      });




    }