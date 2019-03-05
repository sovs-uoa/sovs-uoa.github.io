
var attributes      = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1" };
var virtual         = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1", "stroke-dasharray":"--" };
var real            = { "stroke": "magenta", "stroke-width": "1", "stroke-dasharray":"none"  };
var none            = { "stroke": "none", "stroke-width": "1" };
var extend          = { "fill": "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };
var extend_object   = { "fill": "green", "stroke-opacity": 0.5, "stroke": "green", "stroke-width": "1" };
var picker_extender = { "stroke": "red", "stroke-width": 1, "stroke-dasharray":"--"  };
var changed         = { "stroke": "blue", "stroke-width": 1, "stroke-dasharray":"--"  };

var globalElem;


/*   -------------------------------------------------

UPDATECONJUGATETO Update conjugate point in table and on-screen 

 - Should be called on change to point

------------------------------------------------------ */


function updateConjugateTo (myPoint) {



      // lens is global !

      switch (myPoint.type) {

          case "object" : // update the conjugate [point]
            
            // update the lens table
            lens.pointsTable.updateData([ { "id": myPoint.id, "zo": nowX, "ho": nowY } ]);
            pt = getConjTo (myPoint.type, { id:0, zo: nowX, ho: nowY }); // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": myPoint.id, "zi": pt.X2, "hi": pt.Y2 } ]); // change this for vertex 
            c = paper.getById(myPoint.conjugate_id);
            c.attr({ cx: pt.X2, cy: pt.Y2 });
            break;

          case "image" :
            error("error!");
            lens.pointsTable.updateData([ { "id": myPoint.id, "zi": nowX, "hi": nowY } ]);
            pt = getConjTo (myPoint.type, { id:0, zo: nowX, ho: nowY });   // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": myPoint.id, "zi": pt.X1, "hi": pt.Y1 } ]);
            c = paper.getById(myPoint.conjugate_id);
            c.attr({ cx: pt.X1, cy: pt.Y1 });
            break;

          default:
            error("unknown draggable");

      }


    return pt;
}

/* ------------------------------------------------------

CONSTRUCTION EVENT HANDLERS 

---------------------------------------------------------- */


function moveBeam (dx, dy) {

      console.log("--- called beam move point id = " + this.id);  


      // update the appropriate point 
      dx = kx*dx; 
      dy = ky*dy;

      nowX = this.ox + dx;
      nowY = this.oy + dy;

      nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

      // update the point 
      this.attr({ cx: nowX, cy: nowY });

      // 4pairDescription = getConjugateTo("object", eachPoint, totalLens); // only works in fwd direction 

      // update the conjugate 
      var thisPoint = this.data("data-attr");
      pairData = updateConjugateTo (thisPoint);  // update the Raphael paper + lens table + return a pairData object
      thisPoint.parent.setPairData(pairData);
      thisPoint.parent.drawRayConstruction ();


      // redraw depends on type of object 
      // update the location of the rays !!!!
      // updatePointsView ();
   }

  
  function startBeam () {

      console.log("--- called beam start point id = " + this.id);  

      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");

  }

  
  function upBeam () {

      console.log("--- called beam up point id = " + this.id);  

  }


/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */


class ParallelBeamConstruction { // create a ray construction using raphael.js


	 constructor(lens, data) {

	 	   // global paper 
       this.cd_set = paper.set();
       this.displayOptions;

       this.data        = data;
       this.lens        = lens;
       this.anchorPoint = "N1"; // or V1 if no N1 is available !

       this.imagePoint;
       this.objectPoint;
       this.anglePicker;

       this.addBeamConstruction ();
    }


  /* ---------------------------------------------------------------------------------------------------------------

    addPrincipalRayConstruction  - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


    addBeamConstruction () {


        // this.drawBeamConstruction (); // this requires the lens prescription 


        // conjugate data (in laboratory frame!)
        var X1 = this.data.X1; var X2 = this.data.X2;        
        var Y1 = this.data.Y1; var Y2 = this.data.Y2;
        var T1 = this.data.T1; var T2 = this.data.T2;

        this.imagePoint  = drawPoint(X2, Y2, "green"); // image  
        this.imagePoint.drag (moveBeam, startBeam, upBeam);
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });


        // this will add an anglePicker 
        this.anglePicker = new AnglePicker (0, 0, 10, T1);


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

   remove () {
      this.cd_set.remove ();
   }


  drawBeamConstruction() {

     // console.log(lens);


     console.log("-- draw beam construction.");

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
     var T1 = data.T1;     

     // X1_1, Y1_1, X1_2, Y1_2 



    // 
    ret = getBeamObjectStyle({ N1 : N1, N2: N2, 
                               P1 : P1, P2: P2,
                               F1 : F1, F2: F2,
                               T1 : T1 });

    this.cd_set.remove ();

    console.log(T1);

	  // RAY HEIGHT AT THE 1st PRINCIPAL PLANE  
    var Y1 = 1; Y2 = -Y1; X = - P1 - 100;
	  var H1 = Math.tan(T1) * (DX) + Y1;
    var H2 = Math.tan(T1) * (DX) + Y2;
    var H3 = Math.tan(T1) * (DX) + 0;

	  var p1 = paper.path( ["M", P1, Y1,  "L", X, H1 ]);    // O  -> H1   (ray through F1)
	  var p2 = paper.path( ["M", P1, Y2,  "L", X, H2 ]);    // H1 -> N1   (ray through F1)
    var p3 = paper.path( ["M", N1, 0,   "L", X, H3 ]);    // H1 -> N1   (ray through F1)

	  p1.attr(ret.F1);
	  p2.attr(ret.F2);
    p3.attr(ret.N1); 
	  this.cd_set.push(p1, p2);

 }



 /* ---------------------------------------------------------------------------------------------------------------

    renderPointToPoint - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 
  
   --------------------------------------------------------------------------------------------------------------- */

  drawConjugates(data) {

    console.log("-- draw conjugates");

  	var dataOptions = this.dataOptions;

    var X1 = data.X1;
    var Y1 = data.Y1;
    if (isFinite(X1) & isFinite(Y1)) {
      // console.log('X1 = ' + X1 + ' Y1 = '+ Y1);
      

      console.log("---- added point id = " + data.id + " (object)");
      // object points are draggable 
      var c = drawPoint(X1, Y1, "green");               
      c.id = { id : data.id, type : "object" };
      c.drag(move, start, up);

/*      
      c.click (function () {
      	//console.log(this);
      	//console.log(e);
      	console.log("clicked object point = " + this.id);
      	//select (this.id);
      });
*/

      this.ps_set.push(c); 
    } else {
    	error("undefined object!");
    };

   var X2 = data.X2;
   var Y2 = data.Y2;
   if (isFinite(X2) & isFinite(Y2)) {
      
      // image points are draggable 
      console.log("---- added point id = " + data.id + " (image)");
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



    //this.ps_set.remove ();
    //this.ps_set = paper.set();

    // show the object points for all points 
    for (var i = 0; i < data.length; i++ ) {

        var X1 = data[i].X1;
        var Y1 = data[i].Y1;
        if (isFinite(X1) & isFinite(Y1)) {
          console.log('X1 = ' + X1 + ' Y1 = '+ Y1);
          var c = drawPoint(X1, Y1, "cyan");         
          this.ps_set.push(c); 
        }
   }

   var X2 = data[data.length-1].X2;
   var Y2 = data[data.length-1].Y2;
   if (isFinite(X2) & isFinite(Y2)) {
      console.log('X2 = ' + X2 + ' Y2 = '+ Y2);
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

   function getBeamObjectStyle(data) {

      // beam style information 

      ret = { F1: real , N1 : real , F2: real  } 

      return ret;

   }

