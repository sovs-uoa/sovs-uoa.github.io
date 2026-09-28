
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

      // th is the handle's own TRUE geometric angle (AnglePicker.setAngle is a
      // real polar-to-cartesian rotation) - not the paraxial field angle T1
      // itself, since the ray is drawn with the linear slope deg2rad(T1),
      // whose true geometric angle is atan(deg2rad(T1)), not T1 (they
      // coincide only for a small T1). Clamp away from +-90 deg first (tan()
      // of exactly +-90 is infinite), matching ParallelBeamConstruction's
      // onmove().
      th = Math.max(-89.9, Math.min(89.9, th));
      var T1 = geometricAngleToFieldAngle(th);

      // T1 = tan(th), so T1 itself blows up (thousands of degrees) as th
      // merely APPROACHES 90 deg, long before reaching the clamp above -
      // paraxial theory only ever describes a small angle in the first
      // place, so there is no sense in which a huge T1 is "more correct".
      // Clamp T1 itself too, and re-set the handle's own geometric angle
      // from that clamped T1 (movePicker's own drag handling already moved
      // it to the raw th before calling us) so the two stay consistent -
      // the handle visually "sticks" once T1 saturates.
      T1 = Math.max(-89.9, Math.min(89.9, T1));
      this.setAngle(fieldAngleToGeometricAngle(T1));

      // update the graphic + associated table
      myPoint   = { id:this.parent.getId(), type: "beam", which: "object", t: T1 };
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
       this.PinToApertureStop = false; // see setPinToApertureStop()


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

    // Pins this incoming parallel beam's width to the entrance pupil's own
    // diameter (see findApertureStopForInfiniteObject in optics.js) instead
    // of the arbitrary BeamWidth - the object-at-infinity equivalent of
    // PointSourceConstruction's Pin feature. No object position is involved
    // here, so it applies equally well to a beam from infinity.
    setPinToApertureStop(flag) {
      this.PinToApertureStop = !!flag;
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
        // Anchor the handle at whichever point the rays themselves actually
        // pivot about - the front vertex (V1=0) normally, but the entrance
        // pupil (VE1) when pinned (see setInputRays) - otherwise the handle
        // visually rotates about a different point than the rays it is
        // meant to be controlling.
        var pupilInfo = this.PinToApertureStop ? Optics.findApertureStopForInfiniteObject(renderableLens.elem) : null;
        var V1 = pupilInfo ? renderableLens.total.pupil.VE1 : 0;
        var T1 = this.data.T1;
        this.anglePicker.setAnchor(V1, 0);  // change the anchor
        this.anglePicker.setAngle (fieldAngleToGeometricAngle(T1));
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


      /* KLUDGE */


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

      /* JT: TRY AND HIDE THIS POINT - UNTIL IMG PROBLEM IS RESOLVED */
      this.imagePoint.hide();

   }


   // re-calculate traced rays without drawing
   setInputRays(th) {

      // console.log(th);

      // pivotZ: the un-pinned beam pivots about the front vertex (z=0) - any
      // field angle th is drawn as a ray through the AXIS at z=0. A beam
      // PINNED to the aperture stop instead needs its marginal rays to
      // straddle the ENTRANCE PUPIL's edges for ANY th, which only holds if
      // the whole beam pivots about the entrance pupil's own center (VE1)
      // instead - otherwise the beam stays correctly WIDE (constant
      // perpendicular separation = pupil diameter, true at any plane along a
      // parallel ray) but off-CENTER at the pupil plane for any th != 0. u
      // is the ray's angle here, so h at z=0 needs the same -u*pivotZ
      // rebasing translateRays() uses elsewhere to shift a ray's reference
      // point without changing its direction.
      function getBeam (th, bw, pivotZ) {
          var u = deg2rad(th);
          var h0 = -u * pivotZ;
          var r = [];
          // paraxial (u,h) throughout - no cos() obliquity correction, since
          // h here is already the direct paraxial height, not a perpendicular
          // distance (see the note in ParallelBeamConstruction.js)
          r.push({ u: u, h: h0 - bw/2,  z: 0});
          r.push({ u: u, h: h0,         z: 0});
          r.push({ u: u, h: h0 + bw/2,  z: 0});
          return r;
      }



      /* this should determine rays at each surface */

      var pupilInfo  = this.PinToApertureStop ? Optics.findApertureStopForInfiniteObject(renderableLens.elem) : null;
      var bw         = pupilInfo ? 2*pupilInfo.angle : this.BeamWidth;
      this.PinnedApertureDiameter = pupilInfo ? 2*pupilInfo.angle : null;
      var pivotZ     = pupilInfo ? renderableLens.total.pupil.VE1 : 0;

      var rays       = getBeam(th, bw, pivotZ);
      this.inputRays = rays;
      this.raypath   = Optics.calculateRayTrace(rays, renderableLens.elem);

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


        console.log ('DRAW POINT DATA');
        console.log (this.data);

        this.imagePoint    = drawPoint(X2, Y2, "red"); // image  
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });

         
        /* JT: TRY AND HIDE THIS POINT - UNTIL IMG PROBLEM IS RESOLVED */
        this.imagePoint.hide();




        // register these points 
        RegisterWheelCallback({ type: "point", handle: this.imagePoint });
        

        //. default beam anchor 
        var lens = this.lens;
        var V1   = 0; //lens.V1;             // primary nodal point 
        var V2   = 1; //lens.V2;    // secondary nodal point 

        // this will add an anglePicker 
        this.anglePicker = new AnglePicker (0, 0, 10, fieldAngleToGeometricAngle(this.data.T1));
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
     clearBeamFadeGradients ();
     var dimensions = [ ray.length, ray[0].length ];
     var K = dimensions[0]; // number of surfaces 
     var M = dimensions[1]; // number of rays 

     // Fade unbounded segments (incoming from infinity, and an afocal
     // output's own outgoing ray, which is likewise unbounded) out over 2x
     // the system length - the same idea as ParallelBeamConstruction/
     // PointSourceConstruction, except this class is only ever used for a
     // genuinely afocal SYSTEM (see resolveObjectConstructionType), so
     // there is no F-to-F' distance to compare against (cardinal points are
     // undefined for an afocal system) - system length (lens.L) alone is
     // the only meaningful reference here.
     var refLength = 2*Math.abs(lens.L);


     console.log("Input rays");
     console.log(this.inputRays);
     console.log("Ray path");
     console.log(this.raypath);
     console.log ("This data.");
     console.log(this.data);




     console.log ('INPUT');

     /* input rays - only the outermost two (the middle/chief ray is
        redundant once the region between them is shaded) - faded out
        towards "infinity" since this end never really terminates. */

     var dX = -refLength;
     var inY1 = [], inY2 = [];
     var inX1_0, inX2_0, inP_0, inX1_M, inX2_M, inP_M;
     for (var i=0; i <  M ; i++) {

        if (i !== 0 && i !== M-1) { continue; }

        var u1 = this.inputRays[i].u;
        var X1 = this.inputRays[i].z;
        var Y1 = this.inputRays[i].h;
        // u1 is already a paraxial (u,h) slope from calculateRayTrace - not
        // a real angle needing tan(), matching the rest of this file's
        // convention (see getBeam above)
        var X2 = X1 + dX; var Y2 = Y1 + dX*u1;
        var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
        p4.attr(real);
        this.cd_set.push(p4);

        inY1[i] = Y1; inY2[i] = Y2;

        if (i === 0)   { inX1_0 = X1; inX2_0 = X2; inP_0 = p4; }
        if (i === M-1) { inX1_M = X1; inX2_M = X2; inP_M = p4; }
     }

     var inFadeFrom = [inX1_0, (inY1[0]+inY1[M-1])/2], inFadeTo = [inX2_0, (inY2[0]+inY2[M-1])/2];
     shadeFadingBeamRegion(this.cd_set, [[inX1_0,inY1[0]],[inX2_0,inY2[0]],[inX2_M,inY2[M-1]],[inX1_M,inY1[M-1]]], inFadeFrom, inFadeTo);
     fadeRayStroke(inP_0, inFadeFrom, inFadeTo);
     fadeRayStroke(inP_M, inFadeFrom, inFadeTo);


    console.log ('ALONG');


     /* rays along path - again, outermost two only, with the region between
        them shaded solid (both ends are real, finite points). */


     for (var k=0; k < K-1; k++ ) {     // elements 

         var alongY1 = [], alongY2 = [];
         var alongX1_0, alongX2_0, alongX1_M, alongX2_M;
         for (var i=0; i <  M ; i++) {  // rays 

            if (i !== 0 && i !== M-1) { continue; }

            var X1 = ray[k][i].z;   var Y1 = ray[k][i].h;
            var X2 = ray[k+1][i].z; var Y2 = ray[k+1][i].h;
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr(real);
            this.cd_set.push(p4);

            alongY1[i] = Y1; alongY2[i] = Y2;
            if (i === 0)   { alongX1_0 = X1; alongX2_0 = X2; }
            if (i === M-1) { alongX1_M = X1; alongX2_M = X2; }
         }

         shadeBoundedBeamRegion(this.cd_set, [[alongX1_0,alongY1[0]],[alongX2_0,alongY2[0]],[alongX2_M,alongY2[M-1]],[alongX1_M,alongY1[M-1]]]);
     }


     /* final rays */

     console.log ('LENS');
     console.log (lens);


     if (Math.abs(lens.F) > 0.0001) {   // focal system 

        var finalY1 = [];
        var finalX1_0, finalP_0, finalX1_M, finalP_M;
        var extX2_0, extY_0, extP_0, extX2_M, extY_M, extP_M;
        for (var i=0; i <  M ; i++) {   // rays 

            if (i !== 0 && i !== M-1) { continue; }

            var u1 = ray[K-1][i].u;       
            var X1 = ray[K-1][i].z; 
            var Y1 = ray[K-1][i].h;
            

            // focal point 

            var X2 = this.data.X2;  
            var Y2 = this.data.Y2;            
            var p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]); 
            p4.attr ("stroke", "#FF0000");

            finalY1[i] = Y1;
            if (i === 0)   { finalX1_0 = X1; finalP_0 = p4; }
            if (i === M-1) { finalX1_M = X1; finalP_M = p4; }


            console.log ('DISPLAY!!');
            console.log (this.data);
            console.log (`X1 = ${X1}, Y1 = ${Y1}`);
            console.log (`X2 = ${X2}, Y2 = ${Y2}`);


            etol < 1e-4;

            if (lens.VI < -etol) {  // probably virtual 


                console.log ('SOME VIRTUAL CRZINESS');


                p4.attr(virtual);
                this.cd_set.push(p4);

                // extend the rays - real light continuing on past this
                // (virtual) construction line, out towards "infinity"

                var dx  = + refLength;
                var i1  = u1 * dx + Y1; // upper height on N1 
                var p5  = paper.path( ["M", X1, Y1,  "L", X1 + dx, i1 ]);    // O  -> H1   (ray through F1)
                p5.attr(real);
                this.cd_set.push(p5);

                if (i === 0)   { extX2_0 = X1+dx; extY_0 = i1; extP_0 = p5; }
                if (i === M-1) { extX2_M = X1+dx; extY_M = i1; extP_M = p5; }


            } else {

                /* REAL */

                console.log ('STANDARD REAL ');


                // JT: STOP PLOTTING OF THIS POINT
                
                p4.hide ();

                p4.attr(real);
                this.cd_set.push(p4);
            }

          }

          if (lens.VI < -etol) {
            // real light continuing past the virtual construction lines,
            // fading out towards infinity - mirrors the incoming-ray fade
            var extFadeFrom = [finalX1_0, (finalY1[0]+finalY1[M-1])/2], extFadeTo = [extX2_0, (extY_0+extY_M)/2];
            shadeFadingBeamRegion(this.cd_set, [[finalX1_0,finalY1[0]],[extX2_0,extY_0],[extX2_M,extY_M],[finalX1_M,finalY1[M-1]]], extFadeFrom, extFadeTo);
            fadeRayStroke(extP_0, extFadeFrom, extFadeTo);
            fadeRayStroke(extP_M, extFadeFrom, extFadeTo);
          } else {
            // both ends real and finite (the actual focal point) - solid fill
            shadeBoundedBeamRegion(this.cd_set, [[finalX1_0,finalY1[0]],[this.data.X2,this.data.Y2],[finalX1_M,finalY1[M-1]]]);
          }


     } else { 


        // afocal system - the output ray never converges to a point at
        // all, so BOTH the forward (real) and backward (virtual
        // construction) directions are unbounded and get faded.

         console.log ('AFOCAL SYSTEM / OUTPUT IS AFOCAL');

         var dX = refLength;
         var outY1 = [], outY2 = [];
         var outX1_0, outX2_0, outP_0, outX1_M, outX2_M, outP_M;
         for (var i=0; i <  M ; i++) {

            if (i !== 0 && i !== M-1) { continue; }

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
          
            // ADD EXTENSION RAYS (back-projection construction line)

            var i1  = u1 * -dX + Y1; // upper height on N1 
            var p5  = paper.path( ["M", X1, Y1,  "L", X1 -dX, i1 ]);    // O  -> H1   (ray through F1)
            p5.attr(virtual);
            this.cd_set.push(p5);

            outY1[i] = Y1; outY2[i] = Y2;
            if (i === 0)   { outX1_0 = X1; outX2_0 = X2; outP_0 = p4; }
            if (i === M-1) { outX1_M = X1; outX2_M = X2; outP_M = p4; }

          }

          var outFadeFrom = [outX1_0, (outY1[0]+outY1[M-1])/2], outFadeTo = [outX2_0, (outY2[0]+outY2[M-1])/2];
          shadeFadingBeamRegion(this.cd_set, [[outX1_0,outY1[0]],[outX2_0,outY2[0]],[outX2_M,outY2[M-1]],[outX1_M,outY1[M-1]]], outFadeFrom, outFadeTo);
          fadeRayStroke(outP_0, outFadeFrom, outFadeTo);
          fadeRayStroke(outP_M, outFadeFrom, outFadeTo);

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



