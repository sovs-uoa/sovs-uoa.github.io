
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


/*   -------------------------------------------------

These functions are called as the picker is dragged 

------------------------------------------------------ */

function onAfocalStart ()   { console.log("onstart picker"); };

function onAfocalMove (th)  { 

      // this => AnglePicker
      //console.log("angle picker passed angle = " + th);


      // update the graphic + associated table 
      myPoint   = { id:this.parent.getId(), type: "beam", which: "object", t: th };
      totalLens = renderableLens.total;    
      PairData  = Optics.calculateConjugatePairFrom(myPoint, totalLens); 
      this.parent.setPairData(PairData);


      updatePointsTable(myPoint.id, PairData);


      // this should update afocalbeamconstruction rays 
      this.parent.setInputRays(PairData.T1);
      this.parent.remove(); 
      this.parent.draw();

};

function onAfocalUp ()      { console.log("onup picker"); };


/*   -----------------------------------------------------------------

UPDATE BEAM CONJUGATE Update conjugate point in table and on-screen 

--------------------------------------------------------------------- */
/*

function updateBeamConjugate (info, myPoint) {

      // lens is global !
      console.log("beam conjugate");
      console.log(d);

      id     = info.conjugate_id; // conugate point 
      mytype = info.type;




      myPoint   = { id:, type:, which: , t: };
      totalLens = renderableLens.total;    
      pairData  = Optics.calculateConjugatePairFrom(myPoint, totalLens); 
      

      switch (mytype) {

          case "object" : // update the conjugate [point]
            
            // update the lens table
            lens.pointsTable.updateData([ { "id": myPoint.id, "to": myPoint.T1 } ]);
            pairData = getConjTo (d.type, { id:0, zo:-Infinity, to: myPoint.T1 }); // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": myPoint.id, "zi": pairData.X2, "hi": pairData.Y2 } ]); // not afocal 

            c = paper.getById(id);
            c.attr({ cx: pairData.X2, cy: pairData.Y2 }); // update the image point 
            break;

          case "image" :
            error("error!");
            lens.pointsTable.updateData([ { "id": id, "ti": myPoint.T1 } ]);
            pairData = getConjTo (d.type, { id:0, zi:+Infinity, ti:myPoint.T1 }); // this only works in the forward direction
            lens.pointsTable.updateData([ { "id": myPoint.id, "zo": pairData.X1, "ho": pairData.Y1 } ]); // not afocal 
            c = paper.getById(id);
            c.attr({ cx: pt.X1, cy: pt.Y1 }); // update the object point 
            break;

          default:
            error("unknown draggable");

      }


    return pairData;
}
*/

/* ------------------------------------------------------

UNUSED - A BEAM IS NOT DRAGGABLE !!!!

---------------------------------------------------------- */
/*

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
      pairData = updateBeamConjugate (thisPoint);  // update the Raphael paper + lens table + return a pairData object
      thisPoint.parent.setPairData(pairData);
      thisPoint.parent.setOrientation(nowX, nowY);
      thisPoint.parent.remove ();      
      thisPoint.parent.drawBeamConstruction ();


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

*/

/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */


class AfocalBeamConstruction { // create a ray construction using raphael.js


	 constructor(lens, data, beamwidth) {

	 	   // global paper 
       this.cd_set = paper.set();
       this.displayOptions;

       this.data        = data;
       this.lens        = lens;
       this.anchorPoint = "V1"; // or V1 if no N1 is available !

       // this.imagePoint;
       this.objectPoint;
       this.anglePicker;
       this.BeamWidth    = beamwidth || 5.0;


       this.afocalmode = false;

       this.inputRays;
       this.rays;

       // start
       var T1 = this.data.T1;

       //this.refresh ();
       this.setInputRays(T1); 
       this.addAfocalConstruction (); // draw the rays 

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
      this.imagePoint.remove();
      this.anglePicker.delete();

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
        console.log ("refreshing afocalbeamconstruction");
        var V1 = 0;
        var T1 = this.data.T1;
        this.anglePicker.setAnchor(V1, 0);  // change the anchor
        this.anglePicker.setAngle (T1);
        this.anglePicker.setLength (getXProportionFactor(0.1));

        this.setInputRays (T1); // this will re-calculate 

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


      var V1 = 0;      
      //this.anglePicker.setAnchor(V1, 0);  // change the anchor
      //this.anglePicker.setAngle(this.data.T1);        
      this.drawAfocalConstruction ();
   }


   // re-calculate traced rays without drawing
   setInputRays(th) {

      // console.log(th);

      function getBeam (th, bw) {
          var r = [];
          r.push({ u: deg2rad(th), h: -bw/2 / Math.cos (deg2rad(th)),  z: 0});
          r.push({ u: deg2rad(th), h: 0,      z: 0});
          r.push({ u: deg2rad(th), h: +bw/2 / Math.cos (deg2rad(th)),  z: 0});
          return r;
      }

      //this.anglePicker.setAngle(th);
      var rays       = getBeam(th, this.BeamWidth);      
      this.inputRays = rays; 
      this.raypath   = Optics.calculateRayTrace(rays, renderableLens.elem);

      //console.log("Output rays");
      //console.log (this.raypath);
      //this.drawAfocalConstruction ();
   }





  /* ---------------------------------------------------------------------------------------------------------------

    addPrincipalRayConstruction  - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


    addAfocalConstruction () {


        // conjugate data (in laboratory frame!)
        var X1 = this.data.X1; var X2 = this.data.X2;        
        var Y1 = this.data.Y1; var Y2 = this.data.Y2;
        //var T1 = this.data.T1; var T2 = this.data.T2;
        //var N1 = this.data.N1; var T2 = this.data.N2;




        this.imagePoint    = drawPoint(X2, Y2, "cyan"); // image  
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });


        // register these points 
        RegisterWheelCallback({ type: "point", handle: this.imagePoint });
        

        //. default beam anchor 
        var lens = this.lens;
        var V1   = 0; //lens.V1;             // primary nodal point 
        var V2   = 1; //lens.V2;    // secondary nodal point 

        // this will add an anglePicker 
        this.anglePicker = new AnglePicker (0, 0, 10, this.data.T1);
        this.anglePicker.setAnchor(V1, 0); // move to default point is N1
        this.anglePicker.setLength(getXProportionFactor(0.1));        
        this.anglePicker.data("data-attr-info", {  "conjugate_id"  : "point-" + this.data.id + "-image",
                                                   "id"            : this.data.id, 
                                                   "type"          : "object",
                                                   "parent"        : this });
        this.anglePicker.parent = this;
        this.anglePicker.drag(onAfocalMove, onAfocalStart, onAfocalUp);

        // this.imagePoint.data("data-attr", { "element-id" : "point-" + this.data.id + "-image", "id" : this.data.id, "type" : "image"});
        //this.imagePoint.data("data-attr");

        this.drawAfocalConstruction (); // this requires the lens prescription 

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


  drawAfocalConstruction() {


     var lens = this.lens;

     displayOptions = this.displayOptions;


     var V1  = lens.V1;
     var V2  = lens.V2;
     var ray = this.raypath;
     
     this.cd_set.remove ();
     var dimensions = [ ray.length, ray[0].length ];
     var K = dimensions[0]; // number of surfaces 
     var M = dimensions[1]; // number of rays 


     console.log("Input rays");
     console.log(this.inputRays);
     console.log("Ray path");
     console.log(this.raypath);
     console.log ("This data.");
     console.log(this.data);


     /* --------------------------------------------------------
      
        INCOMING RAYS 

       -------------------------------------------------------- */

     var dX = -1000;
     for (var i=0; i <  M ; i++) {

        var u1 = this.inputRays[i].u;         
        var X1 = this.inputRays[i].z; 
        var Y1 = this.inputRays[i].h;
        var X2 = X1 + dX; var Y2 = Y1 + dX*Math.tan(u1);
        var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
        p4.attr(real);
        this.cd_set.push(p4);
     }


     /* --------------------------------------------------------
      
        MID RAYS 

       -------------------------------------------------------- */

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

    ret = getAfocalBeamImageStyle({ N1 : N1, N2: N2, 
                                    P1 : P1, P2: P2,
                                    F1 : F1, F2: F2,
                                    T1 : T1,
                                    X2 : X2, Y2: Y2 });

    //console.log("FINAL INFORMATION");
    //console.log(lens);

*/


     /* --------------------------------------------------------
      
        FINAL RAYS 

       -------------------------------------------------------- */

     if (Math.abs(lens.F) > 0.0001) {


         /* FOCAL SYSTEM */


         for (var i=0; i <  M ; i++) {

            // INPUT POINT 

            var u1 = ray[K-1][i].u;       
            var X1 = ray[K-1][i].z; 
            var Y1 = ray[K-1][i].h;
            

            // OUTPUT POINT 
            var X2 = this.data.X2;  
            var Y2 = this.data.Y2;            
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            

            if (X2 < X1) {

                /* VIRTUAL */

                p4.attr(virtual);
                this.cd_set.push(p4);

                // extend the rays 

                var dx  = + 1000;
                var i1  = u1 * dx + Y1; // upper height on N1 
                var p5  = paper.path( ["M", X1, Y1,  "L", X1 + dx, i1 ]);    // O  -> H1   (ray through F1)
                this.cd_set.push(p5);


            } else {

                /* REAL */

                p4.attr(real);
                this.cd_set.push(p4);
            }

          }


     } else { 


        /* RAYS TO INFINITY */ 


         // FINITE RAYS 

         var dX = 10;
         for (var i=0; i <  M ; i++) {

            // INPUT POINT 

            var u1 = ray[K-1][i].u;       
            var X1 = ray[K-1][i].z; 
            var Y1 = ray[K-1][i].h;

            // OUTPUT POINT 

            var X2 = X1 + dX;  
            var Y2 = Y1 + dX*u1;
            
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);         
            p4.attr(real);
            this.cd_set.push(p4);
          
            // ADD EXTENSION RAYS 

            var i1  = u1 * -dX + Y1; // upper height on N1 
            var p5  = paper.path( ["M", X1, Y1,  "L", X1 -dX, i1 ]);    // O  -> H1   (ray through F1)
            p5.attr(virtual);
            this.cd_set.push(p5);

          }

     }

 


    this.cd_set.toFront();
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

   function getAfocalBeamImageStyle(data) {

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



