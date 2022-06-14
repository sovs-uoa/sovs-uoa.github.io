  var   ap;

  var   SelectedObjectPointId;
  var   totalConjList = [];
  var   c, dot;
  var   objectPoint;      // this should be a list or hash-table
  var   renderableLens;
  var   lensTable;
  var   ps, cd_set;
  const gridSnapSize = 0.000025;
  var   summaryTemplate;
  var   reportTamplate;

  var   download_report_template; 

  var    mouseIsDown = false;
  
  var   etol = 5e-4;
  var   fileList  = [ { id: "0",  filename: "./lenses/thick-lens-positive.lens", title: "Thick Lens in Air (Positive Power)" }, 
                      { id: "1",  filename: "./lenses/thick-lens-negative.lens", title: "Thick Lens in Air (Negative Power)" },
                      { id: "2",  filename: "./lenses/thin-lens-positive.lens", title: "Thin Lens in Air (Positive)"  },
                      { id: "3",  filename: "./lenses/thin-lens-negative.lens", title: "Thin Lens in Air (Negative)"  },
                      { id: "4",  filename: "./lenses/two-thin-lenses-positive.lens", title: "Two Thin Lenses in Air (Nominal Positive Power)"  },   
                      { id: "5",  filename: "./lenses/two-thin-lenses-negative.lens", title: "Two Thin Lenses in Air (Nominal Negative Power)"  },
                      { id: "6",  filename: "./lenses/keplerian-telescope.lens", title: "Keplerian Telescope"  },
                      { id: "7",  filename: "./lenses/galilean-telescope.lens", title: "Galilean Telescope"  },                    
                      { id: "10", filename: "./lenses/legrand-relaxed-schematic-eye.lens", title: "LeGrand Relaxed Schematic Eye (Relaxed)" },
                      { id: "11", filename: "./lenses/legrand-relaxed-schematic-eye-no-retina.lens", title: "LeGrand Relaxed Schematic Eye (Relaxed / No Retina)" },
                      { id: "12", filename: "./lenses/reduced-eye-with-accommodation-img.lens", title: "Reduced Eye with Accommodation" },
                      { id: "13", filename: "./lenses/reduced-eye-with-ametropia.lens",   title: "Reduced emmetropic eye" },
                      { id: "14", filename: "./lenses/mystery-eye-with-ametropia-1.lens", title: "Mystery eye #1" },
                      { id: "15", filename: "./lenses/mystery-eye-with-ametropia-2.lens", title: "Mystery eye #2" },
                      { id: "16", filename: "./lenses/telescope-with-reduced-eye-with-ametropia.lens", title: "Telescope" },
                      { id: "17", filename: "./lenses/reduced-eye-with-ametropia.lens", title: "Reduced eye with ametropia" },
                      { id: "18", filename: "./lenses/telescope-with-reduced-eye-with-ametropia-no-retina.lens", title: "Telescope with no retina" },
                      { id: "19",  filename: "./lenses/assign-thick-lens.lens", title: "Thick Lens" },
                      { id: "20",  filename: "./lenses/assign-basic-eye.lens", title: "Eye Model" },
                      { id: "21",  filename: "./lenses/assign-telescope-myopia.lens", title: "Telescope" },
                      { id: "22",  filename: "./lenses/lab6-vertometer-standard.lens", title: "Vertometer" },
                      { id: "23",  filename: "./lenses/lab6-vertometer-mystery-lens-1.lens", title: "Vertometer with mystery lens #1" },
                      { id: "24",  filename: "./lenses/lab6-vertometer-mystery-lens-2.lens", title: "Vertometer with mystery lens #2" },
                      { id: "25",  filename: "./lenses/lab6-telescope-mystery-lens-0.lens", title: "Telescope with mystery lens" },
                      { id: "26",  filename: "./lenses/assign-vertometer-mystery-lens-OS.lens", title: "Vertometer with lens OS" },
                      { id: "27",  filename: "./lenses/assign-vertometer-mystery-lens-OD.lens", title: "Vertometer with lens OD" },
                      { id: "28",  filename: "./lenses/assign-vertometer-mystery-lens.lens", title: "Vertometer" }, 
                      { id: "29",  filename: "./lenses/mirror.lens", title: "Mirror" },
                      { id: "30",  filename: "./lenses/keratometer.lens", title: "Keratometer" } ];

                      // { id: "12", filename: "./lenses/reduced-eye-with-accommodation.lens", title: "Reduced Eye with Accommodation" },



  /* load configuration */

  async function load_configuration(config_file) {

    try {

      const response = await fetch(config_file);
      const txt = await response.json();
      return txt;

    } catch(err) {      
      
      console.log(err);
    
    }
  }




 /* CREATE A MENU FROM THE PROFILE */
//  <div id="dropdown-lens-menu" class="dropdown-menu">

 function build_lenses_menu (configuration, id, profile_name) {


    var this_element = document.getElementById (id);
    this_element.innerHTML = "";
    
    /* main profile and main model  */
    this_profile = configuration.profiles.find (profile_item => { return (profile_item.name === profile_name); });    
    this_model   = configuration.models.find (model_item => { return (model_item.id == this_profile.main); });

    //console.log (profile_name);
    //console.log (this_profile);
    
    console.log (`located model ... "${this_model.title}"`);    
    this_profile.list.forEach( this_id => {

        /* add an item */ 

        var a_href = document.createElement('a');
        a_href.classList.add("dropdown-item");
        a_href.classList.add("file-selection");            
        a_href.href  ="#";
        a_href.setAttribute("data-id", this_id);

        model_item = configuration.models.find(item => {return item.id == this_id });
        a_href.innerHTML = model_item.title;
        this_element.appendChild (a_href);

      });

    return this_profile;
 }


 /* OTHER */



  displayOptions = { height             : 0.05, 
                     showCardinalPoints   : true,
                     showFocalPoints      : true,
                     showNodalPoints      : false, 
                     showPrincipalPoints  : false, 
                     showVertices         : true };

  Mustache.Formatters = {
      

      "m2mm": function (value, decimals) {


        var value = Number(value * 1000);

        //console.log("value = " + value);
 
        if (isNaN(value)) {
          return "undefined";
        }

        if (!isFinite(value) | value == null) {
          return "undefined";
        }

       var value = value.toFixed(decimals); // Number(Math.round(value+'e'+decimals)+'e-'+decimals);

        return value
      },
    


      "decimal": function (value, decimals) {

        var value = Number(value);

        //console.log("value = " + value);
 

        if (isNaN(value)) {
          return "undefined";
        }

        if (!isFinite(value) | value == null) {
          return "undefined";
        }

       var value = value.toFixed(decimals); // Number(Math.round(value+'e'+decimals)+'e-'+decimals);

        return value
      }
    
    }


/* -------------------------------------------------------------------------------

Unique Identifier 

------------------------------------------------------------------------------- */


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
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


     console.log("ADDING ROW");
     console.log(aPoint);


      lens.pointsTableHandler.addRow([ {  id: aPoint.id,
                                          type: aPoint.type, 
                                          X1: pairData.X1, Y1: pairData.Y1,
                                          X2: pairData.X2, Y2: pairData.Y2,
                                          l:  pairData.PO, ld: pairData.PI,                                            
                                          to: pairData.T1, ti: pairData.T2,                                                                                              
                                          zo: pairData.VO, zi: pairData.VI, 
                                          ho: pairData.OQ, hi: pairData.IQ,
                                          beamwidth: aPoint.beamwidth }]);


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
    console.log("Updating the PRESCRIPTION VIEW.");


    // Update the Optics Object 


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
                       showPupils               : true,
                       showSchematic            : false };


    //console.log("cardinal = " + response.general.cardinalVertHeight + " OR " + displayOptions.cardinalVertHeight );

    drawOptics(renderableLens);
    drawPupils(renderableLens.total, displayOptions);
    drawCardinalPoints(0, 0, renderableLens.total, displayOptions); // (0,0) 

    //console.log ('RESPONSE');
    //console.log (response);

    if (displayOptions.showSchematic)
      drawSchematic(response, renderableLens); // DRAW!!!

    // now update the points 
    if (summaryTemplate !== undefined) {

      // console.log("Summary template!");
      //console.log(summaryTemplate);
      updateSummaryView (); 
    }

    // re-calculate all the constructions
    // refreshAllConstruction ();

    // Only do this - if there are rays in the table 
    if (lens.pointsTable !== null ) {

      console.log ('Updating CONSTRUCTIONS');
      refreshAllConstruction ();
    }

  }




  function updateSummaryView () {

    console.log ("Updating the SUMMARY VIEW.");

    //console.log(summaryTemplate);
    // output
    // console.log (renderableLens.total);


    var summary = document.getElementById("summary-tab");

    //console.log ('TEMPLATE TEXT');
    //console.log (summaryTemplate);

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


    console.log ("Updating the POINTS VIEW.");

    // re-calculate positions
    totalLens   = renderableLens.total;
    pointsTable = lens.pointsTable.getData();    
    pointsList  = Optics.calculatePointToPoint(totalLens, pointsTable); // a bunch of points !!!


    console.log (pointsTable);

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
    aPoints   = lens.pointsTableHandler.convertRowData([ aPoint ]); // apply filters     
    aPoint    = aPoints[0];


    /* need to update the infomration */
    console.log(`Edited field "${fieldname}" directly.`);  

    /* field information */
    
    switch (fieldname) {
      case "zo": case "ho": case "to": 
        return { id: aPoint.id, which: "object", z: Number(aPoint.zo), h: Number(aPoint.ho), t: Number(aPoint.to)};

      case "zi": case "hi": case "ti":
        return { id: aPoint.id, which: "image", z: Number(aPoint.zi), h: Number(aPoint.hi), t: Number(aPoint.ti) };

      case "beamwidth":
        return { id: aPoint.id, beamwidth: Number(aPoint.beamwidth) };

      /* add in additional processing required for information */

      case "l": 

        var cardinals = renderableLens.total.cardinal;
        return { id: aPoint.id, which: "object", z: Number(aPoint.l + cardinals.VP1), h: Number(aPoint.ho), t: Number(aPoint.to) };

      case "ld": 
        var cardinals = renderableLens.total.cardinal;
        return { id: aPoint.id, which: "image", z: Number(aPoint.ld + cardinals.VP2), h: Number(aPoint.hi), t: Number(aPoint.ti) };



      default:
        throw "Editing for ${fieldname} was not handled.";
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


            // elem is a CONSTRUCTION 


            /* NEGATIVE HEIGHT BECAUSE TABLE AND GRAPH HAVE OPPOSITELY SIGNED DIRECTIONS */

            console.log (`- REFRESH construction ID = ${elem.getId()}`);
            aRow       = lens.pointsTable.getRow(elem.getId()).getData();
            aPoint     = { id: aRow.id, which: "object", z:aRow.zo, h:-aRow.ho, t:aRow.to };


            /* question is whether this needs to reversed in height */

            pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
            elem.setPairData(pairData);       
            elem.setLens(totalLens); // <--- this should change 
            elem.refresh();

            // update on POINTS TABLE 
            console.log (`- CALLED Update on Points Table`);            
            updatePointsTable(aPoint.id, pairData);
    });
  }


  function addConstruction (aPoint) {

    /* update the points table */

     totalLens  = renderableLens.total;
     pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
     addPointsTableRow(aPoint, pairData);

     // update the points table with these data

     console.log (` - adding ${aPoint.type}`);

     switch (aPoint.type) {

            case "source":   // finite placed beam 
              var beamWidth = aPoint.beamwidth;     
              lens.raphael.constructions.push( new PointSourceConstruction (totalLens, pairData, beamWidth));
              break;

            case "finite": case "point":   // finite placed beam 
              lens.raphael.constructions.push( new PrincipalRayConstruction (totalLens, pairData));
              break;

            case "parallel": case "beam": // infinitely placed beam 
              var beamWidth = aPoint.beamwidth;     
              console.log (`beamWidth = ${beamWidth}`);
              lens.raphael.constructions.push( new ParallelBeamConstruction (totalLens, pairData, beamWidth));
              break;

           case "afocal": // infinitely placed beam 

              var beamWidth = aPoint.beamwidth;     
              var afocal = new AfocalBeamConstruction (totalLens, pairData, beamWidth);
              lens.raphael.constructions.push(afocal);
              break;
            
            default: 
              error ('unknown point construction.');
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


    // console.log(cell);

    if (cell == null) {
        console.log("Cell altered ... but value was NULL.");
        return;
    }

    console.log("Cell altered ... searching for matching construction.");



    var aPoint = getPointFromCell(cell);
    var fieldname = cell.getColumn().getField();    
    for (let elem of lens.raphael.constructions) {

      console.log("Testing id = " + elem.getId() + " ==" + aPoint.id);

      if (elem.getId() === aPoint.id) {

        if ((fieldname == "beamwidth") & (typeof elem.setBeamWidth === 'function')) {

            console.log ("updating beamwidth");

            // beamwidth was changed 
            elem.setBeamWidth (aPoint.beamwidth);
            elem.refresh ();
            return;

        } else {

            // a point was changed 

            console.log("Cell altered ... Construction FOUND!");
            console.log("- Retrieve point object from the cell");
            console.log("- Found the appropriate constuction");

            console.log (elem);


            totalLens  = renderableLens.total;
            pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
            updatePointsTable(aPoint.id, pairData);
            elem.setPairData (pairData);                  // update the positions  
            elem.refresh ();
            return;

        }


      }
    }

   console.log("Cell altered ... But construction was NOT FOUND!");


/*

    // need to find the construction corresponding to the point and then update it!
    for (var i = 0; i < lens.raphael.constructions.length; i++ ) {
        elem = lens.raphael.constructions[i];
        console.log("compare: " + elem.getId() + " == " + aPoint.id);
        if (aPoint.id == elem.getId()) {

          fieldname = cell.getColumn().getField();    
          if (fieldname == "beamwidth") { // beam-width 


            
            if (typeof elem.setBeamWidth === 'function') { // optional  
                elem.setBeamWidth (aPoint.beamwidth);
                elem.refresh ();
                return
            }          
            return 

          } else { // any other field 


            aPoint = getPointFromCell(cell); // .getData();
            console.log("retrieve point object from the cell");
            totalLens  = renderableLens.total;
            pairData   = Optics.calculateConjugatePairFrom(aPoint, totalLens);
            updatePointsTable(aPoint, pairData);
            console.log("found the appropriate constuction");
            elem.setPairData (pairData);                  // update the positions  
            elem.refresh ();

          }
          return
        }
    }
*/


/*
    var n = lens.raphael.constructions;
    for (var i=0 ; i < lens.raphael.constructions.length; i++ ) {
      lens.raphael.constructions[i].update();
      lens.raphael.constructions[i].draw (); // should clear everything in the object and redraw it 
    }
*/


  }


  /* REPORT */

  function downloadOpticsReport () {

      // lens prescription summary 


      //var grab_canvas = document.getElementById('target_canvas');
      var container = document.getElementById('lens-container');

      //var svg_element = container.firstElementChild;
      //importSVG(svg_element, grab_canvas);
      // canvg("target_canvas", (new XMLSerializer).serializeToString(container.firstElementChild));

      function replaceNaN(data) {
        
        function isObject ( obj ) {
           return obj && (typeof obj  === "object");
        }

        function isArray ( obj ) { 
          return isObject(obj) && (obj instanceof Array);
        }

        function isNumericNaN (value) {
            return typeof value === 'number' && isNaN(value);
        }


        if (!isArray(data)) {

          console.log ('Detected a non-array output');

          all_keys = Object.keys(data);
          
          all_keys.forEach ( key => {            
            if (isNumericNaN(data[key])) {
              data[key] = '';
            };
          });

          console.log (all_keys);

          return data
        }


        // This is an array  

        console.log ('Detected array output');

        data.forEach (datum => {
          all_keys = Object.keys(datum);
          all_keys.forEach ( key => {            

            if (isNumericNaN(datum[key])) {
              datum[key] = '';
            };
          });
        });

        return data;
      }


      // summary report information 
      var output = {};      


      output.id            = uuidv4();
      output.date_string   = getFormattedDate();
      output.lens_table    = replaceNaN(lens.table.getData()); 
      output.points_table  = replaceNaN(lens.pointsTable.getData());
      output.summary_table = replaceNaN(renderableLens.total);
      output.asJSON        = JSON.stringify(output);
      output.summary       = Mustache.render(summaryTemplate, renderableLens.total); 


      // replace any NaNs with "---"

      //console.log (renderableLens.total);
      //console.log (output);

      // download the information 
      download_report_html = Mustache.render(download_report_template, output);  
      var a  = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([download_report_html], {type: 'text/html'}));
      a.download = 'report.html';
      document.body.appendChild(a); a.click();
      setTimeout( function () { document.body.removeChild(a); }, 1000); 


  };


  /* OLD DOWNLOAD REPORT */

  function downloadReport (which) {


      console.log (`Requesting download.`);


      switch (which) {

        case "picture":


          /* add style to SVG create an element to hold picture then press click */ 

          var svgElement = document.getElementsByTagName('svg')[0];
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          var svgStyle   = document.createElementNS("http://www.w3.org/2000/svg", "style");
          style = "path,circle,text{vector-effect:non-scaling-stroke;stroke-width:2px;}";
          svgStyle.textContent = style;
          svgElement.appendChild(svgStyle);
          var downloadTxt = svgElement.outerHTML;

          /* create an element to hold picture then press click */ 

          downloadTxt = paper.toSVG ();
          //console.log (svgString);

          var a  = window.document.createElement('a');
          a.href = window.URL.createObjectURL(new Blob([downloadTxt], {type: 'image/svg+xml'}));
          a.download = 'picture.svg';
          document.body.appendChild(a);
          a.click();
          setTimeout( function () { document.body.removeChild(a); }, 1000);          
          console.log (`Download activated ... ${a.download}`);
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
          setTimeout( function () { document.body.removeChild(a); }, 1000); 
          break;          

        default:
          console.log ('Unknown request made.');
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

      //console.log (fileList);

      found = fileList.find(function (elem) {

          //console.log (elem);

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



     console.log (`loading id = ${id}`);

     found = findLensById(id);

     console.log (found);



      $.ajax({
            url : found.filename,
            dataType: "text",
            success : function (data) {

                  /* loaded lens prescription */

                  console.log (`lens file ... ${found.filename}`);

                  response = JSON5.parse(data);


                  startDrawing("lens-container", response); // uses paper 

                  $(paper.canvas).bind('mousewheel', function(event) {

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

                   
                  // initialize the prescription that will execute on change to table 
                  initializePrescriptionTable (response.prescription, 

                        updatePrescriptionView,   // change in lenses information => full update 
                        function () {  // success !!! 

                                console.log("Load the lens prescription.");       
                                $("#filename_display").val(found.title);

                                updatePrescriptionView();            

                                /* load a summary table template */


                                function assignParameter(assertValue, defaultValue) {
                                   if (assertValue == undefined) 
                                        return defaultValue;
                                  return assertValue;
                                };

                                // console.log ('Configuration loaded');
                                // console.log (config);
                                // console.log (assignValue);

                                var assignValue ='mustache/lab3_report_tables_html.mustache';
                                if (typeof config !== 'undefined')
                                  assignValue = assignParameter(config.summary_template, 'mustache/lab3_report_tables_html.mustache'); 
                                

                                $.get(assignValue, function(template) {

                                    console.log (`loaded download report template ... ${assignValue}`);
                          

                                    /* update the summary template view */

                                    summaryTemplate = template; 
                                    updateSummaryView(); 

                                    
                                    /* -------------------------------------------------------------------------------------

                                        INFORMATION 
      
                                    --------------------------------------------------------------------------------------- */

                                    console.log ('Reading source points');

                                    var points; 
                                    if (response.hasOwnProperty("sources")) {   /* load defined sources */
                                            console.log (' - from lens file.');
                                            points = response.sources;
                                    } else {
                                            console.log (' - using default');
                                            points  = [ { id    : 1, 
                                                          type  : "afocal",
                                                          which : "object",
                                                          z     : undefined, 
                                                          h     : undefined,
                                                          t     : 30,
                                                          bw    : NaN } ];
                                    }



                                    console.log (' - intializing point table (sources).');
                                    initializePointsTable ([], updateConstruction, function () {
                                          
                                          // delete lenses  

                                          $("#lens-points-del-row").click(function(){

                                              console.log(" - deleting all sources...");
                                              selectedData = lens.pointsTable.getSelectedData(); 
                                              selectedData.forEach(elem => {
                                                  lens.pointsTable.deleteRow(elem.id);
                                                  deleteConstruction (elem.id);                                                  
                                              });
                                          });


                                          // add rows 

                                          $("#lens-points-add-point").click(function(){                                          
                                              console.log("request to add source...");
                                          });


                                          console.log ('Adding points to paper.');
                                          points.forEach( eachPoint => {

                                              /* klugdy fix for each point to account for raphael co-ordinate system */

                                              if (eachPoint.h) 
                                                eachPoint.h = -eachPoint.h;
                                                addConstruction (eachPoint);
                                          });



                                          /* ------------------------------------------

                                          PASS ... KLUDGE 

                                          ---------------------------------------------- */


                                          $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                                            


                                            switch (e.target.id) {
                                               case "objects-images-nav" :
                                                  console.log ('Switch to POINTS table TAB!');
                                                  lens.pointsTable.redraw(true); 
                                                  break;

                                               case "prescription-nav" :
                                                  console.log ('Switch to PRESCRIPTION table TAB!');
                                                  lens.table.redraw(true);
                                                  break;

                                               default:

                                            }                                     


                                          })


                                      });

                                                                        
                                });





                    });



            }


      });




    }



    /* JSON to HTML string */


    var totalString = '';
         
    function constructTable(list) { 
            
      var totalString = '<thead>\n<tr>\n';        
      var headers = Object.keys(list); 
      headers.forEach ( header => {
        totalString = totalString + `<th>${data[header]}</th>\n`;
      });
      totalString = totalString + '</tr>\n';        
      totalString = totalString + '</thead>\n';        

      totalString = totalString + '<tbody>\n';        
      list.forEach ( data => {
        totalString = '<tr>\n';
        headers.forEach ( header=> {
            totalString = totalString + '<td>${data[header]}</td>\n';
         });
        totalString = totalString + '</tr>\n';
      });
      totalString = totalString + '</tbody>\n'; 

      return totalString;       
    } 
    
