
var attributes      = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1" };
var virtual         = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1", "stroke-dasharray":"--" };
var real            = { "stroke": "black", "stroke-width": "1", "stroke": "black", "stroke-dasharray":"none"  };
var none            = { "stroke": "none", "stroke-width": "1" };
var extend          = { "fill": "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };
var extend_object   = { "fill": "black", "stroke-opacity": 1.0, "stroke": "black", "stroke-width": "3" };
var extend_image    = { "fill": "black", "stroke-opacity": 1.0, "stroke": "black", "stroke-width": "3" };


var picker_extender = { "stroke": "red", "stroke-width": 1, "stroke-dasharray":"--"  };
var changed         = { "stroke": "blue", "stroke-width": 1, "stroke-dasharray":"--"  };

var globalElem;

/* ------------------------------------------------------

CONSTRUCTION EVENT HANDLERS 

---------------------------------------------------------- */


function movePointSource (dx, dy) {

      ////console.log("--- called construction move point id = " + this.id);  


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

      ////console.log(thisPoint);

      totalLens = renderableLens.total;  // I should make this local if I can
      pairData  = Optics.calculateConjugatePairFrom({   id     : thisPoint.id, 
                                                        which  : thisPoint.type, 
                                                        z      : nowX, 
                                                        h      : nowY }, totalLens);
      updateInterface (thisPoint, pairData);  // update table (and conjugate points / will remove) 
      thisPoint.parent.setPairData(pairData);
      thisPoint.parent.updateRays();
      thisPoint.parent.draw(); // drawRayConstruction ();


      // redraw depends on type of object 
      // update the location of the rays !!!!
      // updatePointsView ();
   }

  
  function startPointSource () {

      ////console.log("--- called construction start point id = " + this.id);  

      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");

  }

  
  function upPointSource () {

      ////console.log("--- called construction up point id = " + this.id);  

  }



/* -------------------------------------------------------------------------------

CONSTANTS  

 ---------------------------------------------------------------------------------- */


const ENTRANCE_PUPIL = 0;
const FRONT_VERTEX   = 1;


/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */

class PointSourceConstruction { // create a ray construction using raphael.js


	 constructor(lens, data, beamwidth, aiming) {

	 	   // global paper 
       this.cd_set = paper.set();
       this.displayOptions;

       this.data        = data;
       this.lens        = lens;
       this.anchorPoint = "V1"; // or V1 if no N1 is available !


       this.InputAimerY  = 0; 

       // this.imagePoint;
       this.objectPoint;
       this.imagePoint;
       this.BeamWidth    = beamwidth || 0.2;


       this.Aiming       = aiming || ENTRANCE_PUPIL;


       this.PointSourcemode = false;
       this.rays;
       this.inputRays;

       // this.setInputRays(30); 

       this.updateRays();
       this.addPointSourceConstruction (); // draw the rays 


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

      this.cd_set.remove();
      
      //this.objectAimer.remove();
      //this.imageAimer.remove();
      
      this.imagePoint.remove();
      this.objectPoint.remove(); //delete();

   }


  /* ---------------------------------------------------------------------------------------------------------------

    Set Information  

   --------------------------------------------------------------------------------------------------------------- */

   setRayAiming (aimMethod) {

    this.Aiming = aimMethod;
    this.refresh ();

   }


    setPairData (data) {
      this.data = data;
    }


    setBeamWidth(bw) {
      this.BeamWidth = bw;
      this.refresh ();
    }


    setLens(lens) {

      this.lens = lens;

    }



  /* ---------------------------------------------------------------------------------------------------------------

    Update  

   --------------------------------------------------------------------------------------------------------------- */



/*

   reset(theta) {

      var r = this.anglePicker.getRadius();

      var N1 = this.lens.cardinal.VN1; 
      this.anglePicker.setAnchor(N1, 0);
      this.anglePicker.setAngle (theta);

      this.imagePoint.attr({ cx: this.data.X2, cy: this.data.Y2 }); // move the image point here
      //this.anglePicker.setAngle(this.data.T1);        
      this.drawBeamConstruction ();
   }
*/


  // This will be called when a table is updated - assumes that pairData is udated.

  refresh() {


        // refresh the angle picker 
        //console.log ("refreshing PointSourceConstruction");
        

        this.updateRays();

        // refresh the rays 
        this.remove ();            
        this.draw ();    

    }


   draw () {
      //this.imagePoint.attr({ cx: this.data.X2, cy: this.data.Y2 }); // move the image point here
      //var N1 = this.lens.cardinal.VN1; 

      // defend against nonfocal rays 
      if (isFinite(this.data.X2)) {
          this.imagePoint.show();
          this.imagePoint.attr({ cx: this.data.X2, cy: this.data.Y2 }); // move the image point here
      } else {
          this.imagePoint.hide();
      }


      // defend against nonfocal rays 
      if (isFinite(this.data.X1)) {
          this.objectPoint.show();
          this.objectPoint.attr({ cx: this.data.X1, cy: this.data.Y1 }); // move the image point here
      } else {
          this.objectPoint.hide();
      }


      // var V1 = 0;      
      // this.anglePicker.setAnchor(V1, 0);  // change the anchor
      // this.anglePicker.setAngle(this.data.T1);        
      this.drawPointSourceConstruction ();
   }


   // re-calculate traced rays without drawing
   updateRays() {

      // //console.log(th);
      var rays = [];

      function getBeam (X2, X1, Y1, Y2) {
          var u0 = (Y2 - Y1)/(X2 - X1);
          return { u: u0, z:X1, h: Y1};
      }

      var Y1 = this.data.Y1;
      var VO = this.data.VO;  

      // create rays and then shift to front vertex 



      var BW = this.BeamWidth;
      switch (this.Aiming) {
          case ENTRANCE_PUPIL:
            var VE1 = renderableLens.total.pupil.VE1;
            rays.push(getBeam(VE1, VO, Y1, +BW/2));      
            rays.push(getBeam(VE1, VO, Y1, 0));      
            rays.push(getBeam(VE1, VO, Y1, -BW/2));            
            break;

          case FRONT_VERTEX:
            rays.push(getBeam(0, VO, Y1, +BW/2));      
            rays.push(getBeam(0, VO, Y1, 0));      
            rays.push(getBeam(0, VO, Y1, -BW/2));            
            break;

          default:
            rays.push(getBeam(0, VO, Y1, +BW/2));      
            rays.push(getBeam(0, VO, Y1, 0));      
            rays.push(getBeam(0, VO, Y1, -BW/2));            


      }




      console.log("Original rays");
      console.log(rays);
      console.log(this.data);
      console.log(renderableLens);


      rays = translateRays(rays, 0);

      this.inputRays = rays;

      //console.log("Input rays");
      //console.log(rays);


      // trace them through (Fwd)
      this.raypath = Optics.calculateRayTrace(rays, renderableLens.elem);

      //console.log("Output rays");
      //console.log (this.raypath);
      //console.log(renderableLens.elem);

      //this.drawAfocalConstruction ();
   }




  /* ---------------------------------------------------------------------------------------------------------------

    addPrincipalRayConstruction  - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


    addPointSourceConstruction () {


       this.drawPointSourceConstruction (); // this requires the lens prescription 


        // conjugate data (in laboratory frame!)
        var X1 = this.data.X1; var X2 = this.data.X2;        
        var Y1 = this.data.Y1; var Y2 = this.data.Y2;

        // draggable construction points s
        this.objectPoint = drawPoint(X1, Y1, "red");  // object  
        this.objectPoint.drag (movePointSource, startPointSource, upPointSource);      
        this.objectPoint.id = "point-" + this.data.id + "-object";          
        this.objectPoint.data("data-attr", {  "element_id"   : "point-" + this.data.id + "-object",
                                              "conjugate_id" : "point-" + this.data.id + "-image",
                                              "id"           : this.data.id, 
                                              "type"         : "object", 
                                              "parent"       : this });


        this.imagePoint  = drawPoint(X2, Y2, "cyan"); // image  
        this.imagePoint.drag (movePointSource, startPointSource, upPointSource);
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "conjugate_id"  : "point-" + this.data.id + "-object",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });


        // register these points 
        RegisterWheelCallback({ type: "point", handle: this.objectPoint });
        RegisterWheelCallback({ type: "point", handle: this.imagePoint });



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


  drawPointSourceConstruction() {


     // try and deal with this     
     var lens = this.lens;
     //var N1 = lens.cardinal.VN1;
     //var N2 = lens.L + lens.cardinal.VN2;
     //var P1 = lens.cardinal.VP1;
     //var P2 = lens.L + lens.cardinal.VP2;
     //var F1 = lens.cardinal.VF1;
     //var F2 = lens.L + lens.cardinal.VF2;

     //console.log("LENS");
     //console.log(lens);



     ////console.log("-- draw PointSource beam construction.");
     displayOptions = this.displayOptions;
     ////console.log(lens);


     var V1   = 0;
     var V2   = lens.L;
     var ray  = this.raypath;
     



     this.cd_set.remove ();
     var dimensions = [ ray.length, ray[0].length ];
     var K = dimensions[0]; // number of surfaces 
     var M = dimensions[1]; // number of rays 


     // START RAYS 
     dX = -1;
     var X1 = this.data.X1;
     var Y1 = this.data.Y1;
     for (var i=0; i <  M ; i++) {
        
        var u2 = ray[0][i].u;         
        var X2 = ray[0][i].z; 
        var Y2 = ray[0][i].h;        


        if (X1 > V1) {

            // var X2 = X1 + dX; var Y2 = Y1 + dX*u1;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr(virtual);
            this.cd_set.push(p4);


            var u1 = this.inputRays[i].u;
            var X3 = X2 + dX;  
            var Y3 = Y2 + dX*u1;            
            var p4 = paper.path( ["M", X2, Y2,  "L", X3, Y3 ]);         
            p4.attr(real);
            this.cd_set.push(p4);

        } else {

            // var X2 = X1 + dX; var Y2 = Y1 + dX*u1;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr(real);
            this.cd_set.push(p4);

        }


     }


     // IN-BETWEEN RAYS 
     for (var k=0; k < K-1; k++ ) {
         for (var i=0; i <  M ; i++) {
            var X1 = ray[k][i].z;   var Y1 = ray[k][i].h;
            var X2 = ray[k+1][i].z; var Y2 = ray[k+1][i].h;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr(real);
            this.cd_set.push(p4);
         }
     }

/*

    ret = getPointSourceBeamImageStyle({ N1 : N1, N2: N2, 
                                    P1 : P1, P2: P2,
                                    F1 : F1, F2: F2,
                                    T1 : T1,
                                    X2 : X2, Y2: Y2 });
*/


    ////console.log("FINAL INFORMATION");
    ////console.log(lens);




   // FINAL RAYS 
/*
   if (Math.abs(lens.F) > 0.0001) {


      // FINITE RAYS 
     for (var i=0; i <  M ; i++) {

        var u1 = ray[K-1][i].u;       
        var X1 = ray[K-1][i].z; var Y1 = ray[K-1][i].h;
        var X2 = this.data.X2;  var Y2 = this.data.Y2;
        var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
        

        if (X2 < X1) {

            // information 
            p4.attr(virtual);
            this.cd_set.push(p4);

            // extend the rays 
            var dx  = + 10;
            var i1  = u1 * dx + Y1; // upper height on N1 
            var p5  = paper.path( ["M", X1, Y1,  "L", X1 + dx, i1 ]);    // O  -> H1   (ray through F1)
            this.cd_set.push(p5);


        } else {
            p4.attr(real);
            this.cd_set.push(p4);
        }

      }


     } else { // INFINITE RAYS 

*/
          // FINITE RAYS 


        var XI = this.data.X2;
        var YI = this.data.Y2;
         var dX = 1;
         for (var i=0; i <  M ; i++) {

            var u1 = ray[K-1][i].u;       
            var X1 = ray[K-1][i].z; 
            var Y1 = ray[K-1][i].h;
            
            //console.log("X2 = " + X2 + ", V2 = " + V2);

            if (XI <= V2) {

              var X2 = X1 + dX;  
              var Y2 = Y1 + dX*u1;            
              var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);         
              p4.attr(real);
              this.cd_set.push(p4);

              // information 
              var p4 = paper.path( ["M", X1, Y1,  "L", XI, YI ]);         
              p4.attr(virtual);
              this.cd_set.push(p4);

              // extend the rays 
              var dx  = + 10;
              var i1  = u1 * dx + Y1; // upper height on N1 
              var p5  = paper.path( ["M", X1, Y1,  "L", X1 + dx, i1 ]);    // O  -> H1   (ray through F1)
              this.cd_set.push(p5);

            } else {

              var p4 = paper.path( ["M", X1, Y1,  "L", XI, YI ]);         
              p4.attr(real);
              this.cd_set.push(p4);


            }


          }


//     }

 


    this.cd_set.toBack();
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

   function getPointSourceBeamImageStyle(data) {

      // beam style information 
      var ret =  { F1: none, N1 : none, F2: none  }; 

      if (data.X2 > data.P2) { // focal point to the right of P2

          ret = { F1: real , N1 : real , F2: real, xF1: none, xN1: none, xF2: none, extend: false  }; 


      } else if (data.X2 < data.P2 ) {

          ret = { F1: virtual , N1 : virtual , F2: virtual, xF1: real, xN1: real, xF2: real, extend: true   };
      
      } else {

          ret = { F1: none, N1 : none, F2: none, xF1: none, xN1: none, xF2: none, extend: false  }; 

      }


      return ret;
   }



