
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

      // nowX is in the laboratory (paper) frame. calculateConjugatePairFrom expects an
      // "object" z relative to the front vertex (which sits at the global origin, so no
      // conversion needed) but an "image" z relative to the BACK vertex - without
      // subtracting that offset here, dragging the image point jumps it away from the
      // cursor by roughly the system length.
      var zLocal = (thisPoint.type === "image") ? (nowX - (totalLens.Z + totalLens.L)) : nowX;

      pairData  = Optics.calculateConjugatePairFrom({   id     : thisPoint.id,
                                                        which  : thisPoint.type,
                                                        z      : zLocal,
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

      setGrabbingCursor(true);

  }


  function upPointSource () {

      ////console.log("--- called construction up point id = " + this.id);

      setGrabbingCursor(false);

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
        this.objectPoint.attr({ cursor: "grab" });
        this.objectPoint.id = "point-" + this.data.id + "-object";
        this.objectPoint.data("data-attr", {  "element_id"   : "point-" + this.data.id + "-object",
                                              "conjugate_id" : "point-" + this.data.id + "-image",
                                              "id"           : this.data.id, 
                                              "type"         : "object", 
                                              "parent"       : this });


        this.imagePoint  = drawPoint(X2, Y2, "cyan"); // image
        this.imagePoint.drag (movePointSource, startPointSource, upPointSource);
        this.imagePoint.attr({ cursor: "grab" });
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
     clearBeamFadeGradients ();
     var dimensions = [ ray.length, ray[0].length ];
     var K = dimensions[0]; // number of surfaces 
     var M = dimensions[1]; // number of rays 


     /* inital rays */  


     // This should be the source

     var X1 = this.data.X1;
     var Y1 = this.data.Y1;
     var virtualObjectEntryExtension = null; // envelope corners for the pre-entry fade (virtual object case), filled in below

     console.warn (`X1 = ${X1}`);

     for (var i=0; i <  M ; i++) {

        // the middle ray is redundant once the region between the outermost
        // (bounding) rays is shaded - hide it so it doesn't draw a stray line
        // straight through the middle of the fill.
        if (i !== 0 && i !== M-1) { continue; }

        var u2 = ray[0][i].u;
        var X2 = ray[0][i].z;
        var Y2 = ray[0][i].h;


        if  (X1 === -Infinity) {


            console.warn ('Detected object @ -Infinity');
            console.warn (`X1=${X1} Y1=${Y1}`);
            console.warn (`X2=${X2} Y2=${Y2}`);

            console.warn (`u2=${u2}`);
            console.warn (`X2=${X2}`);
            console.warn (`Y2=${Y2}`);

            console.warn ('This data dump.');

            console.warn(ray)
            console.warn(this.inputRays)
            console.warn(this.data)



        } else if (X1 > V1) {

            // var X2 = X1 + dX; var Y2 = Y1 + dX*u1;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);
            p4.attr(virtual);
            this.cd_set.push(p4);


            var u1 = this.inputRays[i].u;
            // fade the real entry beam out over 1x the distance already
            // established from the entry surface to the (virtual) object -
            // "the system length" past that point, mirroring the exit-side
            // fades below - rather than a fixed, scale-independent sentinel.
            var entryDx = -Math.abs(X1 - V1);
            var X3 = X2 + entryDx;
            var Y3 = Y2 + entryDx*u1;
            var p4 = paper.path( ["M", X2, Y2,  "L", X3, Y3 ]);
            p4.attr(real);
            this.cd_set.push(p4);

            // this segment is real light - it's the actual converging beam
            // approaching the system, which would have gone on to meet at
            // the virtual object point (drawn dashed above) had it not been
            // intercepted here. Remember the outermost two rays' entry
            // points, extended endpoints and path elements (so their stroke
            // can fade too) so this region (only) can be shaded, fading
            // towards infinity - mirroring the virtual-image exit case
            // further down.
            if (i === 0 || i === M-1) {
              if (!virtualObjectEntryExtension) { virtualObjectEntryExtension = {}; }
              if (i === 0)   { virtualObjectEntryExtension.entry0 = [X2, Y2]; virtualObjectEntryExtension.end0 = [X3, Y3]; virtualObjectEntryExtension.el0 = p4; }
              if (i === M-1) { virtualObjectEntryExtension.entryM = [X2, Y2]; virtualObjectEntryExtension.endM = [X3, Y3]; virtualObjectEntryExtension.elM = p4; }
            }

        } else {

            console.warn ('Object less than V1');
            console.warn (`X1=${X1} Y1=${Y1}`);
            console.warn (`X2=${X2} Y2=${Y2}`);

            if (isFinite(X1)) { 

            // var X2 = X1 + dX; var Y2 = Y1 + dX*u1;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr(real);
            this.cd_set.push(p4);

            } else {

                console.log (ray);

                throw "Unhandled infinite object point!"

            }


        }


     }

     // EXPERIMENTAL: virtual object - only the converging entry rays are
     // real light; shade that region (entry surface outward, towards the
     // object side), fading towards infinity - never the forward
     // extrapolation to the virtual object point itself (drawn dashed
     // above, no light actually reaches there).
     if (virtualObjectEntryExtension && virtualObjectEntryExtension.end0 && virtualObjectEntryExtension.endM) {
       var objEntryMid = [ (virtualObjectEntryExtension.entry0[0] + virtualObjectEntryExtension.entryM[0]) / 2,
                            (virtualObjectEntryExtension.entry0[1] + virtualObjectEntryExtension.entryM[1]) / 2 ];
       var objEndMid   = [ (virtualObjectEntryExtension.end0[0]  + virtualObjectEntryExtension.endM[0])  / 2,
                            (virtualObjectEntryExtension.end0[1]  + virtualObjectEntryExtension.endM[1])  / 2 ];
       shadeFadingBeamRegion(
         this.cd_set,
         [virtualObjectEntryExtension.entry0, virtualObjectEntryExtension.end0, virtualObjectEntryExtension.endM, virtualObjectEntryExtension.entryM],
         objEntryMid,
         objEndMid
       );
       // the bounding rays themselves should fade out along with the region
       // they border, rather than staying solid all the way to their endpoint
       fadeRayStroke(virtualObjectEntryExtension.el0, objEntryMid, objEndMid);
       fadeRayStroke(virtualObjectEntryExtension.elM, objEntryMid, objEndMid);
     }


     /* transmitted rays */
     for (var k=0; k < K-1; k++ ) {
         for (var i=0; i <  M ; i++) {
            if (i !== 0 && i !== M-1) { continue; } // hide the redundant middle ray - see comment above
            var X1 = ray[k][i].z;   var Y1 = ray[k][i].h;
            var X2 = ray[k+1][i].z; var Y2 = ray[k+1][i].h;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);
            p4.attr(real);
            this.cd_set.push(p4);
         }
     }

     // Only a REAL image has light actually filling the whole object->image
     // path; a virtual image is where the diverging exit rays APPEAR to come
     // from when extrapolated backwards (drawn dashed below) - no light
     // travels there, so it must not be shaded. Detect real vs virtual the
     // same way the final-ray loop further down does. Symmetrically, a
     // virtual OBJECT (this.data.X1 past the entry surface, V1) is where the
     // converging entry rays would have gone on to meet, extrapolated
     // forwards (also drawn dashed, in the initial-rays loop above) - not
     // real either, so the envelope must not reach back to it.
     var shadeDirection   = Math.sign(lens.n2);
     var isRealImagePath  = isFinite(this.data.X2) && (this.data.X2*shadeDirection > V2*shadeDirection);
     var isRealObjectPath = isFinite(this.data.X1) && (this.data.X1 <= V1);

     // EXPERIMENTAL: shade the whole object->image envelope (bounded at both
     // ends, so a plain solid fill - no fade needed) in one shape, using the
     // outermost ray (i=0) forward and the other outermost ray (i=M-1) back as
     // its two edges, rather than shading each surface-to-surface gap separately.
     // For a virtual object/image, stop the fill at the system's entry/exit
     // surface instead - see the comment above.
     if (isFinite(this.data.X1)) {
        var envelope = [];
        if (isRealObjectPath) { envelope.push([this.data.X1, this.data.Y1]); }
        for (var k=0; k < K; k++) { envelope.push([ray[k][0].z, ray[k][0].h]); }
        if (isRealImagePath) { envelope.push([this.data.X2, this.data.Y2]); }
        for (var k=K-1; k >= 0; k--) { envelope.push([ray[k][M-1].z, ray[k][M-1].h]); }
        shadeBoundedBeamRegion(this.cd_set, envelope);
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
        
        /* Final rays */ 

        var XI = this.data.X2;
        var YI = this.data.Y2;
         var realImageExtension = null; // envelope corners for the post-crossing fade, filled in below
         var virtualImageExitExtension = null; // envelope corners for the post-exit fade (virtual image case), filled in below
         var collimatedExtension = null; // envelope corners for the post-exit fade (collimated/image-at-infinity case), filled in below

         // Fade divergent exit rays out over 1x the distance already
         // established from the exit surface to the image point - "the
         // system length" past that point - rather than a fixed,
         // scale-independent sentinel. A collimated beam has no finite
         // image distance to reference, so fall back to the object's own
         // distance from the entry surface instead.
         var exitRefLength = isFinite(XI) ? Math.abs(XI - V2) : Math.abs(this.data.X1 - V1);
         for (var i=0; i <  M ; i++) {

            if (i !== 0 && i !== M-1) { continue; } // hide the redundant middle ray - see comment above

            var u1 = ray[K-1][i].u;
            var X1 = ray[K-1][i].z;
            var Y1 = ray[K-1][i].h;

            //console.log("X2 = " + X2 + ", V2 = " + V2);

            var direction = Math.sign(lens.n2);

            //console.log (direction);
            //console.log (XI);
            //console.log (V2);
            console.log (`${i}. XI: ${XI} V2:${V2} direction:${direction}`);

            //dX = dX * direction;

            if (XI === Infinity) {

              // collimated beam - real light that has genuinely exited the
              // system, running out towards infinity without ever
              // converging (parallel, not diverging, but the same "fade
              // towards the far end" treatment applies)

              var dxCol = exitRefLength*direction;
              var X2 = X1 + dxCol;
              var Y2 = Y1 + dxCol*u1;
              var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);
              p4.attr(real);
              this.cd_set.push(p4);

              if (i === 0 || i === M-1) {
                if (!collimatedExtension) { collimatedExtension = {}; }
                if (i === 0)   { collimatedExtension.exit0 = [X1, Y1]; collimatedExtension.end0 = [X2, Y2]; collimatedExtension.el0 = p4; }
                if (i === M-1) { collimatedExtension.exitM = [X1, Y1]; collimatedExtension.endM = [X2, Y2]; collimatedExtension.elM = p4; }
              }


            } else if (XI*direction <= V2*direction) {


              // virtual image

              // draw from the present to the final

              var p4 = paper.path( ["M", X1, Y1,  "L", XI, YI ]);         
              p4.attr(virtual);
              this.cd_set.push(p4);

              // the extension part
              var dx  = + exitRefLength*direction;
              var i1  = u1 * dx + Y1; // upper height on N1
              var p5  = paper.path( ["M", X1, Y1,  "L", X1 + dx, i1 ]);    // O  -> H1   (ray through F1)
              this.cd_set.push(p5);

              // this segment is real light - it has genuinely exited the
              // system here, just diverging rather than converging, which is
              // what makes it *appear* to come from the virtual image point
              // extrapolated behind it. Remember the outermost two rays'
              // exit points, extended endpoints and path elements (so their
              // stroke can fade too) so that region (only) can be shaded,
              // fading towards infinity.
              if (i === 0 || i === M-1) {
                if (!virtualImageExitExtension) { virtualImageExitExtension = {}; }
                if (i === 0)   { virtualImageExitExtension.exit0 = [X1, Y1]; virtualImageExitExtension.end0 = [X1+dx, i1]; virtualImageExitExtension.el0 = p5; }
                if (i === M-1) { virtualImageExitExtension.exitM = [X1, Y1]; virtualImageExitExtension.endM = [X1+dx, i1]; virtualImageExitExtension.elM = p5; }
              }


            } else {


              // real image

              var p4 = paper.path( ["M", X1, Y1,  "L", XI, YI ]);
              p4.attr(real);
              this.cd_set.push(p4);

              // these are still real rays - continue them past the crossing point
              // (diverging again beyond focus) rather than stopping exactly at the
              // cyan ball, same convention as the virtual-image extension above
              var dx  = + exitRefLength*direction;
              var i1  = u1 * dx + YI;
              var p5  = paper.path( ["M", XI, YI,  "L", XI + dx, i1 ]);
              p5.attr(real);
              this.cd_set.push(p5);

              // remember the outermost two rays' extended endpoints and path
              // elements (i=0 and i=M-1), to shade the fan they bound (and
              // fade their stroke to match) once the loop is done
              if (i === 0 || i === M-1) {
                if (!realImageExtension) { realImageExtension = { dx: dx }; }
                if (i === 0)   { realImageExtension.i0 = [XI+dx, i1]; realImageExtension.el0 = p5; }
                if (i === M-1) { realImageExtension.iM = [XI+dx, i1]; realImageExtension.elM = p5; }
              }


            }

        }

        // EXPERIMENTAL: real image - these rays are diverging again past the
        // crossing point, running out towards "infinity", so fade towards that
        // end, starting opaque right at the crossing (same convention as
        // ParallelBeamConstruction's equivalent real-image extension).
        if (realImageExtension && realImageExtension.i0 && realImageExtension.iM) {
          var realFadeFrom = [XI, YI];
          var realFadeTo   = [XI + realImageExtension.dx, (realImageExtension.i0[1] + realImageExtension.iM[1]) / 2];
          shadeFadingBeamRegion(
            this.cd_set,
            [[XI,YI], realImageExtension.i0, realImageExtension.iM],
            realFadeFrom,
            realFadeTo
          );
          // the bounding rays themselves should fade out along with the
          // region they border, rather than staying solid to their endpoint
          fadeRayStroke(realImageExtension.el0, realFadeFrom, realFadeTo);
          fadeRayStroke(realImageExtension.elM, realFadeFrom, realFadeTo);
        }

        // EXPERIMENTAL: virtual image - only the diverging exit rays are real
        // light; shade that region (exit surface outward), fading towards
        // infinity - never the backward extrapolation to the virtual image
        // point itself (drawn dashed above, no light travels there).
        if (virtualImageExitExtension && virtualImageExitExtension.end0 && virtualImageExitExtension.endM) {
          var exitMid = [ (virtualImageExitExtension.exit0[0] + virtualImageExitExtension.exitM[0]) / 2,
                           (virtualImageExitExtension.exit0[1] + virtualImageExitExtension.exitM[1]) / 2 ];
          var endMid  = [ (virtualImageExitExtension.end0[0]  + virtualImageExitExtension.endM[0])  / 2,
                           (virtualImageExitExtension.end0[1]  + virtualImageExitExtension.endM[1])  / 2 ];
          shadeFadingBeamRegion(
            this.cd_set,
            [virtualImageExitExtension.exit0, virtualImageExitExtension.end0, virtualImageExitExtension.endM, virtualImageExitExtension.exitM],
            exitMid,
            endMid
          );
          fadeRayStroke(virtualImageExitExtension.el0, exitMid, endMid);
          fadeRayStroke(virtualImageExitExtension.elM, exitMid, endMid);
        }

        // EXPERIMENTAL: collimated beam (object at the front focal point) -
        // real light that has exited the system and runs out to infinity
        // without converging; shade it the same way, fading towards infinity.
        if (collimatedExtension && collimatedExtension.end0 && collimatedExtension.endM) {
          var collExitMid = [ (collimatedExtension.exit0[0] + collimatedExtension.exitM[0]) / 2,
                               (collimatedExtension.exit0[1] + collimatedExtension.exitM[1]) / 2 ];
          var collEndMid  = [ (collimatedExtension.end0[0]  + collimatedExtension.endM[0])  / 2,
                               (collimatedExtension.end0[1]  + collimatedExtension.endM[1])  / 2 ];
          shadeFadingBeamRegion(
            this.cd_set,
            [collimatedExtension.exit0, collimatedExtension.end0, collimatedExtension.endM, collimatedExtension.exitM],
            collExitMid,
            collEndMid
          );
          fadeRayStroke(collimatedExtension.el0, collExitMid, collEndMid);
          fadeRayStroke(collimatedExtension.elM, collExitMid, collEndMid);
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



