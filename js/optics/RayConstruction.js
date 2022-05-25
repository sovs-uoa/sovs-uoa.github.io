


     var attributes      = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1" };
     var virtual         = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1", "stroke-dasharray":"--" };
     var real            = { "stroke": "magenta", "stroke-width": "1", "stroke-dasharray":"none"  };
     var none            = { "stroke": "none", "stroke-width": "1" };
     var extend          = { "fill": "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };
     var extend_object   = { "fill": "green", "stroke-opacity": 0.5, "stroke": "green", "stroke-width": "1" };
     var picker_extender = { "stroke": "red", "stroke-width": 1, "stroke-dasharray":"--"  };


class RayConstruction { // create a ray construction using raphael.js


	 constructor() {

	 	// global paper 
        this.ps_set = paper.set();
        this.cp_set = paper.set();
        this.cd_set = paper.set();
        this.displayOptions;
    }


    remove () {


    	this.ps_set.remove ();
    	this.cp_set.remove ();
    	this.cd_set.remove ();

    }


     // Adding a method to the constructor
     show() {
    
     	drawCardinalPoints ();

  	}


  	drawCardinalPoints(x, y, systemPoints) {


    displayOptions = this.displayOptions;


    console.log("Updated cardinal points.");
    console.log(this.cp_set);


    this.cp_set.remove();
    this.cp_set = paper.set();

    var cp;


    var v1 = x + 0;
    var v2 = x + systemPoints.L;
    var h  = displayOptions.height * 2.0;

    console.log(systemPoints);

    // cardinal points 
    if (displayOptions.showCardinalPoints) {

        // focal points
        if (displayOptions.showFocalPoints) {
          var pf1 = systemPoints.cardinal.PF1;
          var pf2 = systemPoints.cardinal.PF2;
          var vp1 = systemPoints.cardinal.VP1;
          var vp2 = systemPoints.cardinal.VP2;
          
          var x1 = v1 + vp1 + pf1;   // front focal point 
          var x2 = v2 + vp2 + pf2;   // back focal poitn 
          var y1 = y - h/2;          // principal point heights 
          var y2 = y + h/2;          // principal point heights     

          cp1 = drawPoint(x1, y, "magenta");
          cp2 = drawPoint(x2, y, "magenta");
          this.cp_set.push(cp1, cp2);

          // BARS
          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          this.cp_set.push(cp1, cp2);

        }

        // nodal points
        if (displayOptions.showNodalPoints) {
          
          // points           
          var vn1 = systemPoints.cardinal.VN1;
          var vn2 = systemPoints.cardinal.VN2;
          cp1 = drawPoint(v1 + vn1, y, "blue");
          cp2 = drawPoint(v2 + vn2, y, "blue");
          this.cp_set.push(cp1, cp2);

          // lines 
          var x1 = v1 + vn1;
          var x2 = v2 + vn2;
          var y1 = y - h/2;
          var y2 = y + h/2;
          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          this.cp_set.push(cp1, cp2);

        }

        // nodal points
        if (displayOptions.showPrincipalPoints) {

          // points 
          var vp1 = systemPoints.cardinal.VP1;
          var vp2 = systemPoints.cardinal.VP2;
          cp1 = drawPoint(v1 + vp1, y, "red");
          cp2 = drawPoint(v2 + vp2, y, "red");
          this.cp_set.push(cp1, cp2);

          // lines 
          var x1 = v1 + vp1;
          var x2 = v2 + vp2;
          var y1 = y - h/2;
          var y2 = y + h/2;
          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          this.cp_set.push(cp1, cp2);

        }

        // vertices
        if (displayOptions.showVertices) {

          // points 
          cp1 = drawPoint(v1 + vn1, y, "green");
          cp2 = drawPoint(v2 + vn2, y, "green");
          this.cp_set.push(cp1, cp2);

          // lines 
          var y1 = y - h/2;
          var y2 = y + h/2;
          cp1 = paper.path( ["M", v1, y1, "L", v1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", v2, y1, "L", v2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          this.cp_set.push(cp1, cp2);

        }

    }

    console.log("Exiting.");
    console.log(this.cp_set);

  }




  /*   -------------------------------------------------

      UpdateCardinalPoints 

  ------------------------------------------------------ */

  updateCardinalPoints () {
	      // cycle through the cp_set if its not empty and alter all circles !
	      if (!Array.isArray(this.cp_set) || !this.cp_set.length) { // array does not exist, is not an array, or is empty
	        this.cp_set.attr({r: kx*4});
	      }
   }


  /* ---------------------------------------------------------------------------------------------------------------

    renderCardinalRays - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */



  drawCardinalRays(lens, conjObject) {

     // console.log(lens);

     console.log("-- draw cardinal rays.");


     //console.log("cardinal rays set");
     //console.log(this.cd_set);

     //this.cd_set.remove ();
     //this.cd_set.forEach( elem => { 
     //
     //  console.log(elem);
     //  elem.remove(); } );


     displayOptions = this.displayOptions;


     var N1 = lens.cardinal.VN1;
     var N2 = lens.L + lens.cardinal.VN2;
     var P1 = lens.cardinal.VP1;
     var P2 = lens.L + lens.cardinal.VP2;
     var F1 = lens.cardinal.VF1;
     var F2 = lens.L + lens.cardinal.VF2;

     // check if the system is AFOCAL 

     // Object 
     var X1 = conjObject.X1;
     var Y1 = conjObject.Y1;     

     // Image 
     var X2 = conjObject.X2;
     var Y2 = conjObject.Y2;

     // display the nodal rays (Obect => N1 N2 => Image )


     var data   = { N1 : N1, N2 : N2, 
         	        P1 : P1, P2 : P2, 
                    F1 : F1, F2 : F2,
                    X1 : X1, Y1 : Y1,
                    X2 : X2, Y2 : Y2  };




   ret = this.ConstructObjectRays (data);



	 // Nodal ray height at the principal plane  
	 // N1 RAY - ray through 1 to P1 
	 var H1 = (0 - data.Y1) / (data.N1 - data.X1 ) * (data.P1 - data.X1) + data.Y1;
	 var p1 = paper.path( ["M", data.X1, data.Y1, "L", data.P1, H1 ]);    // O  -> H1   (ray through F1)
	 var p2 = paper.path( ["M", data.P1, H1,  "L", data.N1, 0]);    // H1 -> N1   (ray through F1)
	 p1.attr(ret.N1.OP);
	 p2.attr(ret.N1.PN); 
	 this.cd_set.push(p1, p2);

	 // F1 RAY - ray through F1 to P1 
	 p1 = paper.path( ["M", data.X1, data.Y1, "L", data.F1, 0 ]);        // O  -> F1   (ray through F1)
	 p2 = paper.path( ["M", data.F1, 0,  "L", data.P1, data.Y2]);        // F1 -> P1   (ray through F1)
	 var p3 = paper.path( ["M", data.X1, data.Y1, "L", data.P1, data.Y2 ]);  // O  -> P1   (horizontal ray through F2)
	 p1.attr(ret.F1.OF);
	 p2.attr(ret.F1.FP); 
	 p3.attr(ret.F1.OP); 
	 this.cd_set.push(p1, p2, p3);

	// F2 RAY - ray through P2 to F2 
	 p1 = paper.path( ["M", data.X1, data.Y1,  "L", data.P1, data.Y1 ]);   // O  -> P1   (ray through F1)
	 p2 = paper.path( ["M", data.P2, data.Y1,  "L", data.X1, data.Y1 ]);   // P2 -> O   (ray through F1)
	 p1.attr(ret.F2.OP1);
	 p2.attr(ret.F2.OP2); 
	 this.cd_set.push(p1, p2);

     //console.log("cardinal rays set");
     //console.log(this.cd_set);

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



  /*   -------------------------------------------------

      ConstructObjectRays 

  ------------------------------------------------------ */

   ConstructObjectRays(data) {


      ret = {};
      
      if (data.X1 < data.P1) { // real object O



          if ((data.X1 < data.F1) & (data.F1 < data.P1)) {        // O < F1 < P1

              ret.F1 = { OF: real, FP: real, OP: none };

          } else if ((data.X1 < data.P1) & (data.P1 < data.F1)) { // O < P1 < F1 

              ret.F1 = { OF: none, FP: virtual, OP: real };

          } else if ((data.F1 < data.X1) & (data.X1 < data.P1)) { // F1 < O < P1 

              ret.F1 = { OF: none, FP: virtual, OP: real };

          } else {

             alert (`X1 = ${data.X1} P1 = ${data.P1} F1 = ${data.F1}`);

          }



          // ... the region between P1 & P2 should be empty 
          if (data.P1 < data.P2) {


              // F2 RAY           
              ret.F2 = { OP1: real, OP2: none };

              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual }; // : { OP1: real, PN: virtual };

              
          } else {

              // F2 RAY           
              ret.F2 = { OP1: virtual, OP2: none };

              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual }; // : { OP1: real, PN: virtual };

          }




      } else { // virtual object


          // F1 RAY
          // ret.F1 = (data.X1 < data.F1) ? { OF: real, OP: none, FP: real } : { OF: none, OP: virtual, FP: real };


          // F1 RAY : 
          if ((data.F1 < data.P1) & (data.P1 < data.X1)) {         // F1 < P1 < O

              ret.F1 = { OF: none, FP: real, OP: virtual }; // positive lens 

          } else if ((data.P1 < data.X1) & (data.X1 < data.F1)) {  // P1 < O < F1  

              ret.F1 = { OF: none, FP: none, OP: virtual };

          } else if ((data.P1 < data.X1) & (data.F1 < data.X1)) {  // P1 < F1 < O

              ret.F1 = { OF: virtual, FP: virtual, OP: none };

         } else {

             alert (`X1 = ${data.X1} P1 = ${data.P1} F1 = ${data.F1}`);


          }



          // F2 RAY 
          // ... the region between P1 & P2 should be empty 
          if (data.P1 < data.P2) {
              
              // F2 RAY  
              ret.F2 = { OP1: none, OP2: virtual };

              // N1 RAY 
              ret.N1 = { OP: virtual, PN: real }; // : { OP1: real, PN: virtual };

          } else {

              // F2 RAY  
              ret.F2 = { OP1: virtual, OP2: none };

              // N1 RAY (ADDRESS THIS LATER)
              ret.N1 = { OP: virtual, PN: none }; // : { OP1: real, PN: virtual };


          }


          // F1 < P1 < O  or P1 < F1 < O
          // O < F1 < P1  or F1 < O1 < P1
          // O < P < N  or O < N < P

          //ret.F1 = (X1 < F1) { OF1: none, FP1: real, OP1: virtual } : { OF1: virtual, OP1: none, FP1: real };
          //ret.F2 = (X1 < F1) { OF1: real, FP1: real, OP1: none } : { OF1: virtual, OP1: real, FP1: none };
          //ret.N1 = (X1 < N1) { OP1: real, PN1: virtual } : { OP1: real, PN1: virtual };
         // return ret;

      }


      return ret;

   }



}
