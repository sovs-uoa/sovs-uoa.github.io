
var attributes      = { "fill"   : "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1" };
var virtual         = { "fill"   : "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1", "stroke-dasharray":"--" };
var real            = { "stroke" : "black", "stroke-width": "1", "stroke-dasharray":"none"  };
var none            = { "stroke" : "none", "stroke-width": "1" };
var extend          = { "fill"   : "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };

//var extend_object   = { "fill": "green", "stroke-opacity": 0.5, "stroke": "green", "stroke-width": "1" };
//var extend_image    = { "fill": "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };

var extend_object   = { "fill"   : "black", "stroke-opacity": 1.0, "stroke-dasharray":"none", "stroke": "red", "stroke-width": "1" };
var extend_image    = { "fill"   : "black", "stroke-opacity": 1.0, "stroke-dasharray":"none", "stroke": "red", "stroke-width": "1" };

var picker_extender = { "stroke" : "red", "stroke-width": 1, "stroke-dasharray":"--"  };
var changed         = { "stroke" : "blue", "stroke-width": 1, "stroke-dasharray":"--"  };

var globalElem;


/*   -------------------------------------------------

UPDATECONJUGATETO Update conjugate point in table and on-screen 

 - Should be called on change to point

------------------------------------------------------ */


function updateInterface (myPoint, pairData) {

      // lens is global !
      switch (myPoint.type) {

          case "object" : // update the conjugate [point]
            updatePointsTable(myPoint.id, pairData);
            break;

          case "image" :
            updatePointsTable(myPoint.id, pairData);

            break;

          default:
            error("unknown draggable");

      }
}

/* ------------------------------------------------------

CONSTRUCTION EVENT HANDLERS 

---------------------------------------------------------- */


function moveConstruction (dx, dy) {

      //console.log("--- called construction move point id = " + this.id);  


      // update the appropriate point 
      dx = kx*dx; 
      dy = ky*dy;

      nowX = this.ox + dx;
      nowY = this.oy + dy;

      nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

      // update the point 
      this.attr({ cx: nowX, cy: nowY });

      // update the conjugate 
      var thisPoint = this.data("data-attr");

      //console.log(thisPoint);

      totalLens = renderableLens.total;  // I should make this local if I can
      pairData  = Optics.calculateConjugatePairFrom({   id     : thisPoint.id, 
                                                        which  : thisPoint.type, 
                                                        z      : nowX, 
                                                        h      : nowY }, totalLens);
      updateInterface (thisPoint, pairData);  // update table (and conjugate points / will remove) 
      thisPoint.parent.setPairData(pairData);
      thisPoint.parent.draw(); // drawRayConstruction ();


      // redraw depends on type of object 
      // update the location of the rays !!!!
      // updatePointsView ();
   }

  
  function startConstruction () {

      //console.log("--- called construction start point id = " + this.id);  

      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");

  }

  
  function upConstruction () {

      //console.log("--- called construction up point id = " + this.id);  

  }


/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */


class PrincipalRayConstruction { // create a ray construction using raphael.js


	 constructor(lens, data) {

	 	   // global paper 
       this.cd_set = paper.set();
       this.displayOptions;

       this.data   = data;
       this.lens   = lens;

       this.imagePoint;
       this.objectPoint;

       this.addPrincipalRayConstruction ();
    }


  /* ---------------------------------------------------------------------------------------------------------------

    Generic functions 

   --------------------------------------------------------------------------------------------------------------- */

    getId () {
      return this.data.id;
    }


   remove () {
      this.cd_set.remove ();
   }


   delete () {

      this.cd_set.remove ();
      this.objectPoint.remove ();
      this.imagePoint.remove ();

   }


    setPairData (data) {
      this.data = data;
    }

    setLens(lens) {

      this.lens = lens;

    }


    refresh() {

        this.remove ();            
        this.draw ();    
    }



   draw () {
      this.drawRayConstruction ();

      // conjugate data (in laboratory frame!)
      var X1 = this.data.X1; var X2 = this.data.X2;        
      var Y1 = this.data.Y1; var Y2 = this.data.Y2;

      this.objectPoint.attr({ cx: X1, cy: Y1});

      if (isFinite(X2) & isFinite(Y2)) {
        this.imagePoint.show();
        this.imagePoint.attr({ cx: X2, cy: Y2});
      } else {
        this.imagePoint.hide();
      }


   }


  /* ---------------------------------------------------------------------------------------------------------------

    addPrincipalRayConstruction  - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */




    addPrincipalRayConstruction () {


        this.drawRayConstruction (); // this requires the lens prescription 


        // conjugate data (in laboratory frame!)
        var X1 = this.data.X1; var X2 = this.data.X2;        
        var Y1 = this.data.Y1; var Y2 = this.data.Y2;

        // draggable construction points s
        this.objectPoint = drawPoint(X1, Y1, "red");  // object  
        this.objectPoint.drag (moveConstruction, startConstruction, upConstruction);      
        this.objectPoint.id = "point-" + this.data.id + "-object";          
        this.objectPoint.data("data-attr", {  "element_id"   : "point-" + this.data.id + "-object",
                                              "conjugate_id" : "point-" + this.data.id + "-image",
                                              "id"           : this.data.id, 
                                              "type"         : "object", 
                                              "parent"       : this });


        this.imagePoint  = drawPoint(X2, Y2, "cyan"); // image  
        this.imagePoint.drag (moveConstruction, startConstruction, upConstruction);
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "conjugate_id"  : "point-" + this.data.id + "-object",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });


        // register these points 
        RegisterWheelCallback({ type: "point", handle: this.objectPoint });
        RegisterWheelCallback({ type: "point", handle: this.imagePoint });


        // this.imagePoint.data("data-attr", { "element-id" : "point-" + this.data.id + "-image", "id" : this.data.id, "type" : "image"});


        //this.imagePoint.data("data-attr");

    }


    setPairData (data) {
      this.data = data;
    }


  /* ---------------------------------------------------------------------------------------------------------------

    drawRayConstruction() - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */




  drawRayConstruction() {

     // console.log(lens);


     // console.log("-- draw ray construction.");

     displayOptions = this.displayOptions;

     // position of points in the lab frame
     var lens = this.lens;
     var N1 = lens.cardinal.VN1;
     var N2 = lens.L + lens.cardinal.VN2;
     var P1 = lens.cardinal.VP1;
     var P2 = lens.L + lens.cardinal.VP2;
     var F1 = lens.cardinal.VF1;
     var F2 = lens.L + lens.cardinal.VF2;

     // Object 
     var data = this.data;
     var X1 = data.X1;
     var Y1 = data.Y1;     
     var X2 = data.X2;
     var Y2 = data.Y2;

     var myData = {   N1 : N1, N2: N2, 
                      P1 : P1, P2: P2,
                      F1 : F1, F2: F2,
                      X1 : X1, X2: X2,
                      Y1 : Y1, Y2: Y2 };


     // console.log ('OUTPUT DATA.');
     // console.log (myData);


      
    /* -------------------------------------------------------------------------------------------

       OBJECT SPACE - FINITE OBJECT POINTS 

     ---------------------------------------------------------------------------------------------- */

    ret = getObjectStyle(myData);

    this.cd_set.remove ();


	  // Nodal ray height at the principal plane  
	  // N1 RAY - ray through 1 to P1 
	  var H1 = (0 - Y1) / (N1 - X1 ) * (P1 - X1) + Y1;
	  var p1 = paper.path( ["M", X1, Y1, "L", P1, H1 ]);   // O  -> H1   (ray through F1)
	  var p2 = paper.path( ["M", P1, H1,  "L", N1, 0]);    // H1 -> N1   (ray through F1)
	  p1.attr(ret.N1.OP);
	  p2.attr(ret.N1.PN); 
	  this.cd_set.push(p1, p2);

	  // F1 RAY - ray through F1 to P1 
	  p1 = paper.path( ["M", X1, Y1, "L", F1, 0 ]);        // O  -> F1   (ray through F1)
	  p2 = paper.path( ["M", F1, 0,  "L", P1, Y2]);        // F1 -> P1   (ray through F1)
    p1.attr(ret.F1.OF);
    p2.attr(ret.F1.FP); 
    this.cd_set.push(p1, p2);

    if (isFinite(Y2)) {
        var p3 = paper.path( ["M", X1, Y1, "L", P1, Y2 ]);   // O  -> P1   (horizontal ray through F2)
        p3.attr(ret.F1.OP); 
        this.cd_set.push(p3);
    }
    

	  // F2 RAY - ray through P2 to F2 
	  p1 = paper.path( ["M", X1, Y1,  "L", P1, Y1 ]);   // O  -> P1   (ray through F1)
	  p2 = paper.path( ["M", P2, Y1,  "L", X1, Y1 ]);   // P2 -> O   (ray through F1)
	  p1.attr(ret.F2.OP1);
	  p2.attr(ret.F2.OP2); 
	  this.cd_set.push(p1, p2);


    // ADD P1 - P2 RAYS 
    p1 = paper.path( ["M", P1, Y1,  "L", P2, Y1 ]);   // O  -> P1   (ray through F1)
    p1.attr(real);
    this.cd_set.push(p1);
    

    /* defined for finite Y2 */

    if (isFinite(Y2)) {
      p2 = paper.path( ["M", P1, Y2,  "L", P2, Y2 ]);   // O  -> P1   (ray through F1)
      p2.attr(real);     
      this.cd_set.push(p2);
    }    




    if (ret.extender) {


      dX = -100; dY = 0;
      p1 = paper.path( ["M", P1, Y1, "L", P1 + dX, Y1 ]);     // Y2 -> inf   (ray through F1)
      p1.attr(extend_object);

      var m = (Y1-0)/(X1-N1);
      p2 = paper.path( ["M", N1, 0,  "L", N1 + dX, m*dX]);    // N2 -> inf   (ray through F1)
      p2.attr(extend_object);

      var m = (Y2-0)/(P1-F1);
      p3 = paper.path( ["M", P1, Y2, "L", P1 + dX, Y2 + m*dX ]);          // O  -> P1   (horizontal ray through F2)
      p3.attr(extend_object);

      this.cd_set.push(p1, p2, p3); //, p2, p3);

    }



    /* -------------------------------------------------------------------------------------------

       IMAGE SPACE - FINITE IMAGE POINTS 

     ---------------------------------------------------------------------------------------------- */

     if (!isFinite(X2) & !isFinite(Y2)) {

        console.log ('special case');

        var dX = 100; 
        
        m = (-Y1)/(F2-P2);

        console.log (`m=${m}, dX=${dX}, Y2=${Y2}`);

        /* rays extending forward */

        p1 = paper.path( ["M", P2, Y1,  "L", P2 + dX, Y1 + m*dX ]);  // Y1 -> I
        p3 = paper.path( ["M", N2, 0,  "L",  N2 + dX, m*dX ]);   // Y2 -> I  
        p1.attr(extend_image);
        p3.attr(extend_image);
        this.cd_set.push(p1, p3);

        /* rays extending backward */
        p1 = paper.path( ["M", P1, Y1,  "L", P1 - dX, Y1 - m*dX ]);  // Y1 -> I
        p3 = paper.path( ["M", N1, 0,  "L",  N1 - dX, -m*dX ]);   // Y2 -> I  
        p1.attr(virtual);
        p3.attr(virtual);
        this.cd_set.push(p1, p3);


        
        this.cd_set.toBack();
        this.imagePoint.hide ();


     } else {


        /* finite X2 and Y2 */

        var ImageStyles = getImageStyle(myData);  
        p1 = paper.path( ["M", P2, Y1,  "L", X2, Y2 ]);  // Y1 -> I
        p2 = paper.path( ["M", P2, Y2,  "L", X2, Y2 ]);  // Y2 -> I  
        p3 = paper.path( ["M", N2, 0,  "L", X2, Y2 ]);   // Y2 -> I  
        p1.attr(ImageStyles.Y1I);
        p2.attr(ImageStyles.Y2I); 
        p3.attr(ImageStyles.N2I); 
        this.cd_set.push(p1,p2,p3);


        if (ImageStyles.extender) {

          var dX = 100; 
          if (X2 > P2) {        
            dX = X2 - P2;
          }

          /* rays through F2 forward into image space (X2, Y2) */

          dY = 0;
          p1 = paper.path( ["M", P2, Y2, "L", P2 + dX, Y2 ]);         // Y2 -> inf   (ray through F1)
          p1.attr(extend_image);

          /* rays extending forward into image space (X2, Y2) from N2 */

          var m = (Y2-0)/(X2-N2);
          p2 = paper.path( ["M", N2, 0,  "L", N2 + dX, m*dX]);        // N2 -> inf   (ray through F1)
          p2.attr(extend_image);

          /* rays through F1 extending forward into image space (X2, Y2) from N2 */

          var m = (Y1-0)/(P2-F2);
          p3 = paper.path( ["M", P2, Y1, "L", P2 + dX, Y1 + m*dX ]);   // O  -> P1   (horizontal ray through F2)
          p3.attr(extend_image);

          this.cd_set.push(p1, p2, p3);

        }

        this.cd_set.toBack();

     }



 }

/*

    // F1 RAY - ray through : (P2, Y1) to (F1, 0) 
    p1 = paper.path( ["M", X2, Y2, "L", F2, 0 ]);        // O  -> F1   (ray through F1)
    p2 = paper.path( ["M", F2, 0,  "L", P2, Y2]);        // F1 -> P1   (ray through F1)
    var p3 = paper.path( ["M", X2, Y2, "L", P2, Y2 ]);   // I  -> P2   (horizontal ray through F2)
    p1.attr(ret.F1.OF);
    p2.attr(ret.F1.FP); 
    p3.attr(ret.F1.OP); 
    this.cd_set.push(p1, p2, p3);

    // F2 RAY - ray through P2 to F2 
    p1 = paper.path( ["M", X1, Y1,  "L", P1, Y1 ]);   // O  -> P1   (ray through F1)
    p2 = paper.path( ["M", P2, Y1,  "L", X1, Y1 ]);   // P2 -> O   (ray through F1)
    p1.attr(ret.F2.OP1);
    p2.attr(ret.F2.OP2); 
    this.cd_set.push(p1, p2);
*/





 /* ---------------------------------------------------------------------------------------------------------------

    renderPointToPoint - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 
  
   --------------------------------------------------------------------------------------------------------------- */

  drawConjugates(data) {


  	var dataOptions = this.dataOptions;



    /* only show if (X1,Y1) is defined */

    var X1 = data.X1;
    var Y1 = data.Y1;

    if (isFinite(X1) & isFinite(Y1)) {

      var c = drawPoint(X1, Y1, "green");               
      c.id = { id : data.id, type : "object" };
      c.drag(move, start, up);
      this.ps_set.push(c); 

    } else {
    	error("undefined object!");
    };


    /* only show if (X2,Y2) is defined */

   var X2 = data.X2;
   var Y2 = data.Y2;

   if (isFinite(X2) & isFinite(Y2)) {      

      var c = drawPoint(X2, Y2, "cyan");          
      c.id = { id : data.id, type : "image" };
      c.drag(move, start, up);
      this.ps_set.push(c); 

    } else {
		  
      error("undefined object!");
    }

  }


  drawPointToPoint(data) {

  	var dataOptions = this.dataOptions;


    // show the object points for all points 

    for (var i = 0; i < data.length; i++ ) {

        var X1 = data[i].X1;
        var Y1 = data[i].Y1;

        if (isFinite(X1) & isFinite(Y1)) {
          // console.log('X1 = ' + X1 + ' Y1 = '+ Y1);
          var c = drawPoint(X1, Y1, "cyan");         
          this.ps_set.push(c); 
        }
   }

   var X2 = data[data.length-1].X2;
   var Y2 = data[data.length-1].Y2;
   if (isFinite(X2) & isFinite(Y2)) {
      // console.log('X2 = ' + X2 + ' Y2 = '+ Y2);
      var c = drawPoint(X2, Y2, "cyan");          
      this.ps_set.push(c); 
    }

  }


  updatePointToPoint () {
      // cycle through the cp_set if its not empty and alter all circles !
      if (!Array.isArray(this.ps_set) || !this.ps_set.length) { // array does not exist, is not an array, or is empty
        this.ps_set.attr({r: kx*4});
      }

  }





}



/*   -------------------------------------------------

GETOBJECTSTYLE return an apprpriate obejct style.


  F1
    OF 
    FP
    OP

  F2
    OP1
    OP2

  N1
    OP
    PN

------------------------------------------------------ */

   function getObjectStyle(data) {



      ret = {};
      
      if (data.X1 < data.P1) { // real object 


          ret.extender = false;

          // different cases (F1 - primary)
          if ((data.X1 < data.F1) & (data.F1 < data.P1)) {        // O < F1 < P1

              ret.F1 = { OF: real, FP: real, OP: none };

          } else if ((data.X1 < data.P1) & (data.P1 < data.F1)) { // O < P1 < F1 

              ret.F1 = { OF: none, FP: virtual, OP: real };

          } else if ((data.F1 < data.X1) & (data.X1 < data.P1)) { // F1 < O < P1 

                ret.F1 = { OF: none, FP: none, OP: real };

          } else {

             //alert (`PrincipalRayConstruction: X1 = ${data.X1} P1 = ${data.P1} F1 = ${data.F1}`);

            if ((data.F1 == data.X1) & (data.X1 < data.P1)) { // F1 < O < P1 

                ret.F1 = { OF: none, FP: none, OP: real };

            }



          }



          // ... the region between P1 & P2 should be empty 
          if (data.P1 <= data.P2) {

              // F2 RAY           
              ret.F2 = { OP1: real, OP2: none };

              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual }; // : { OP1: real, PN: virtual };

              
          } else {

              // F2 RAY           
              ret.F2 = { OP1: virtual, OP2: none};

              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual}; // : { OP1: real, PN: virtual };

          }




      } else { // virtual object


          // F1 RAY
          // ret.F1 = (data.X1 < data.F1) ? { OF: real, OP: none, FP: real } : { OF: none, OP: virtual, FP: real };

          ret.extender = true;


          // F1 RAY : 
          if ((data.F1 < data.P1) & (data.P1 <= data.X1)) {      // F1 < P1 < O

              ret.F1 = { OF: none, FP: real, OP: virtual, extender: true }; // positive lens 

          } else if ((data.P1 <= data.X1) & (data.X1 < data.F1)) {  // P1 < O < F1  

              ret.F1 = { OF: none, FP: none, OP: virtual, extender: true };

          } else if ((data.P1 <= data.X1) & (data.F1 < data.X1)) {  // P1 < F1 < O

              ret.F1 = { OF: virtual, FP: virtual, OP: none, extender: true };

         } else {


            // this must be X1 == P1


            // we assume that l = 0 is a virtual object (because we cant put a real object on thaat point!)



          }



          // F2 RAY 
          // ... the region between P1 & P2 should be empty 
          if (data.P1 < data.P2) {
              
              // F2 RAY  
              ret.F2 = { OP1: none, OP2: virtual, extender: true};

              // N1 RAY 
              ret.N1 = { OP: virtual, PN: real, extender: true }; // : { OP1: real, PN: virtual };

          } else {

              // F2 RAY  
              ret.F2 = { OP1: virtual, OP2: none, extender: true };

              // N1 RAY (ADDRESS THIS LATER)
              ret.N1 = { OP: virtual, PN: none, extender: true }; // : { OP1: real, PN: virtual };


          }

      }


      return ret;

   }




/*   -------------------------------------------------

GETIMAGESTYLE return an apprpriate obejct style.


  F1
    OF 
    FP
    OP

  F2
    OP1
    OP2

  N1
    OP
    PN

------------------------------------------------------ */

   function getImageStyle(data) {


    if (!isFinite(data.X2)) {

      console.log ('infinity detected.');
      Styles = { Y1I: real, Y2I: real, N2I: real, IF2: real, Y2F2: real, extender: true };
      return Styles;
    }



      ret = {};
      
      if (data.X2 < data.P2) { // VIRTUAL IMAGE 


          if ((data.F2 < data.X2) & (data.X2 < data.P2)) {         // NEGATIVE LENS (F2 < X2 < P2)
              Styles = { Y1I: virtual, Y2I: virtual, N2I: virtual, IF2: virtual, Y2F2: real, extender: true };
          } else if ((data.X2 < data.P2) & (data.P2 < data.F2)) {  // POSITIVE LENS (F2 < X2 < P2)
              Styles = { Y1I: virtual, Y2I: virtual, N2I: virtual, IF2: virtual, Y2F2: real, extender: true };
          }          


      } else {  // REAL IMAGE (P2 <= X2)


          if ((data.P2 < data.F2) & (data.F2 < data.X2)) { // P2 < F2 < I
              Styles = { Y1I: real, Y2I: real, N2I: real, IF2: real, Y2F2: real, extender: false };
          } else if ((data.P2 < data.X2) & (data.X2 < data.F2)) { // P2 < I < F2
              Styles = { Y1I: real, Y2I: real, N2I: real, IF2: none, Y2F2: none, extender: false  };
          }



      }



      return Styles;

   }


