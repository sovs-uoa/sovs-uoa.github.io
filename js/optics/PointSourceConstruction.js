
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
       this.PinToApertureStop = false; // see setPinToApertureStop() - pins the bounding rays to the system's true limiting aperture instead of an arbitrary beamwidth
       this.VignetteAware     = false; // PIN (false): only the system's designated stop element. VIG (true): whichever element is genuinely tightest for this ray, anywhere in the system.


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


    // Pins the bounding rays to the entrance pupil's edge - the paraxial
    // image of the system's actual aperture stop (explicit or auto-computed -
    // see findApertureStopForInfiniteObject in optics.js) - instead of the
    // arbitrary BeamWidth. Only meaningful for a finite ("object only" per
    // the request) point in ENTRANCE_PUPIL aiming mode - see updateRays().
    setPinToApertureStop(flag, vignetteAware) {
      this.PinToApertureStop = !!flag;
      this.VignetteAware     = !!vignetteAware;
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

      // defend against nonfocal rays - also hide it when VIG has determined
      // the beam is fully vignetted before reaching any image at all (see
      // updateRays()) - there is no real image to mark in that case, since
      // no light actually gets through.
      if (isFinite(this.data.X2) && !this.FullyVignetted) {
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
          // A ray "aimed at (X2,Y2)" from (X1,Y1) has no well-defined
          // direction when X1 and X2 coincide (the object sitting exactly
          // at the plane it is being aimed towards - e.g. the entrance
          // pupil sitting right on top of the object itself). Rather than
          // let that surface as a literal Infinity/NaN, fall back to a
          // straight (u=0) ray - a plainly degenerate input like this has
          // no physically meaningful "aimed" angle to fall back to anyway.
          var denom = X2 - X1;
          var u0 = (Math.abs(denom) > 1e-9) ? (Y2 - Y1)/denom : 0;
          return { u: u0, z:X1, h: Y1};
      }

      var Y1 = this.data.Y1;
      var VO = this.data.VO;  

      // create rays and then shift to front vertex 



      var BW = this.BeamWidth;
      switch (this.Aiming) {
          case ENTRANCE_PUPIL:
            var VE1    = renderableLens.total.pupil.VE1;

            // VIG is a DIFFERENT kind of indicator from PIN, not just a
            // looser search - PIN computes an angle FOR you (aimed at
            // whichever aperture is binding); VIG instead takes the user's
            // own chosen beam width as a fixed input and shows where (if
            // anywhere) THAT beam gets clipped, walking element by element -
            // see computeVignettedEnvelope below. So it never touches the
            // pupil/stop-search machinery below at all; it always starts
            // from the same plain +-BW/2 rays PIN's own "nothing pinned"
            // fallback would use.
            if (this.PinToApertureStop && this.VignetteAware) {
              this.PinnedApertureDiameter = null; // no single number - see the column's title tooltip
              var vigAimZ = isFinite(VE1) ? VE1 : 0;
              rays.push(getBeam(vigAimZ, VO, Y1, +BW/2));
              rays.push(getBeam(vigAimZ, VO, Y1, 0));
              rays.push(getBeam(vigAimZ, VO, Y1, -BW/2));
              break;
            }

            // The pin aims at the edge of the (fixed, object-independent)
            // entrance pupil - exactly the existing getBeam() formula below,
            // just with a computed half-width instead of an arbitrary one.
            // This is what actually guarantees both rays land exactly on the
            // pupil edge for ANY object position - aiming a ray directly at
            // the real stop from each object position separately instead
            // requires solving a different, sometimes ill-conditioned
            // equation per object position.
            var stopIndex = renderableLens.total.stopIndex;
            var pupilInfo = this.PinToApertureStop ? Optics.findApertureStopForInfiniteObject(renderableLens.elem, stopIndex) : null;
            // safePinnedPupilInfo (optics.js) guards against two known
            // singularities - VE1 itself non-finite, or (for a finite
            // object like this one) the object sitting exactly at the
            // entrance pupil - either of which would otherwise silently
            // produce Infinity/NaN rays instead of falling back gracefully.
            pupilInfo = safePinnedPupilInfo(pupilInfo, VE1, VO);
            var pupilRadius = pupilInfo ? pupilInfo.angle : null;

            // Fallback: the entrance pupil is an object-INDEPENDENT system
            // property (always computed via an axial pencil from infinity),
            // so it is exactly as degenerate for THIS object as for any
            // other whenever the stop sits at an image conjugate of that
            // pencil (e.g. a stop at a preceding element's own back focal
            // point). But THIS object's own rays reach the stop by varying
            // ANGLE (not starting height) from its own fixed position, which
            // is a genuinely different sensitivity - findApertureStopFor
            // FiniteObject can still find a valid pin angle here. Only
            // meaningful for a finite object (no angle-picker handle to
            // conflict with) - see its own docs in optics.js.
            // An off-axis object can be vignetted asymmetrically - the +u and
            // -u marginal rays can be limited by different elements, at
            // different angles (see limitingApertureForSignedDirection in
            // optics.js), so this comes back as {plus, minus} rather than one
            // shared magnitude. Both sides have to resolve to use this path -
            // a one-sided result would silently understate the other side.
            var stopRay = (this.PinToApertureStop && pupilRadius == null)
              ? Optics.findApertureStopForFiniteObject(renderableLens.elem, VO, Y1, stopIndex)
              : null;
            var stopRayUsable = stopRay && stopRay.plus && stopRay.minus;

            if (pupilRadius != null) {
              rays.push(getBeam(VE1, VO, Y1, +pupilRadius));
              rays.push(getBeam(VE1, VO, Y1, 0));
              rays.push(getBeam(VE1, VO, Y1, -pupilRadius));
              // expose what the pin actually landed on - see refreshAllConstruction()
              // in application.js, which mirrors this into the points table's
              // (now read-only) "beam width" cell so it doesn't show a stale
              // manually typed value while pinned.
              this.PinnedApertureDiameter = 2*pupilRadius;
            } else if (stopRayUsable) {
              rays.push({ u: +stopRay.plus.angle,  z: VO, h: Y1 });
              rays.push({ u: 0,                    z: VO, h: Y1 });
              rays.push({ u: -stopRay.minus.angle, z: VO, h: Y1 });
              // There is no "at VE1" reference to report a width against
              // here (that is exactly what is undefined in this fallback
              // case) - report the limiting element's own raw aperture when
              // both sides agree on which element that is; when vignetting
              // is asymmetric (different limiting elements each side) there
              // is no single honest "diameter" to show, so leave it be.
              this.PinnedApertureDiameter = (stopRay.plus.index === stopRay.minus.index)
                ? renderableLens.elem[stopRay.plus.index].elem.aperture
                : null;
            } else {
              this.PinnedApertureDiameter = null;
              // VE1 itself can be non-finite (e.g. the stop sits at an image
              // conjugate of the axial-infinity pencil - see the comments
              // above and safePinnedPupilInfo) even when nothing is pinned.
              // getBeam's own guard only prevents that from crashing into
              // Infinity/NaN - dividing by a non-finite denom still fails
              // its ">1e-9" check, so it silently returns u=0 for all three
              // rays, collapsing the whole beam into one flat line instead
              // of the requested +-BW/2 spread. Aim at the front vertex
              // instead in that case - always finite, same as FRONT_VERTEX
              // mode below - rather than a fixed reference that happens not
              // to exist for this system.
              var aimZ = isFinite(VE1) ? VE1 : 0;
              rays.push(getBeam(aimZ, VO, Y1, +BW/2));
              rays.push(getBeam(aimZ, VO, Y1, 0));
              rays.push(getBeam(aimZ, VO, Y1, -BW/2));
            }
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

      // VIG mode: replace the plain top/bottom marginal rays (traced against
      // a single shared angle) with the TRUE running-envelope heights - a
      // real beam can be clipped by one element and then clipped FURTHER by
      // a later, tighter one; it never reopens past a point where it was
      // already cut down. The centre ray (index 1) is left untouched -
      // everything downstream of this (shading, fades, extension lines)
      // just reads this.raypath, so it draws the resulting irregular
      // envelope with no further changes needed.
      this.FullyVignetted = false;
      if (this.PinToApertureStop && this.VignetteAware) {
        // rays[0]/rays[2] are the user's own +-BW/2 requested rays pushed
        // above - the envelope's baseline "unclipped" candidate, present
        // from the very first boundary, that individual aperture-grazing
        // candidates then clip further wherever they turn out to be tighter.
        var envelope = Optics.computeVignettedEnvelope(renderableLens.elem, VO, Y1, rays[0].u, rays[2].u);
        if (envelope) {
          for (var vk = 0; vk < this.raypath.length; vk++) {
            if (envelope.plus[vk])  { this.raypath[vk][0] = envelope.plus[vk]; }
            if (envelope.minus[vk]) { this.raypath[vk][2] = envelope.minus[vk]; }
          }
          // envelope.blockedAtIndex is set only when the top/bottom edges
          // cross AT AN APERTURE ELEMENT itself - i.e. that element's
          // opening does not overlap this beam at all, so nothing gets past
          // it. A plain crossing further on (top/bottom swapping sides at a
          // real image point, with no aperture there) is normal, healthy
          // optics, NOT vignetting - checking every boundary generically
          // (as this used to) misfired on exactly that case and hid real,
          // unvignetted images. Cut the trace off only at the genuine block.
          if (envelope.blockedAtIndex != null) {
            this.raypath = this.raypath.slice(0, envelope.blockedAtIndex + 1);
            this.FullyVignetted = true;
          }
        }
      }

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

     // Beam fade-off distance: 2x the system length (V1 to V2), or the
     // F-to-F' distance, whichever is larger - a reference that's always
     // meaningful even for a zero-thickness thin lens/prism, where V1==V2
     // would otherwise make "2x the system length" collapse to zero. An
     // afocal system (e.g. a telescope) has no finite focal points at all -
     // this construction otherwise never touches cardinal points (its ray
     // path above is traced surface-by-surface), so fall back to just the
     // system-length term rather than letting a non-finite F1/F2 poison
     // fadeDistance into NaN/Infinity and break every fade gradient.
     var F1 = lens.cardinal.VF1;
     var F2 = lens.L + lens.cardinal.VF2;
     var focalSpan = (isFinite(F1) && isFinite(F2)) ? Math.abs(F2 - F1) : 0;
     var fadeDistance = Math.max(2*Math.abs(V2 - V1), focalSpan);
     



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
            // fade the real entry beam out over fadeDistance (see above),
            // mirroring the exit-side fades below.
            var entryDx = -fadeDistance;
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

        // This whole section connects the last TRACED point (ray[K-1]) to
        // this.data.X2/Y2, the overall system image position - computed
        // independently of vignetting (via calculateConjugatePairFrom), so
        // it does not know K was cut short. When the beam is fully
        // vignetted, ray[K-1] IS the blocking aperture, not the system's
        // last surface - connecting it on to the (unreachable) image would
        // draw exactly the phantom "continuing ray" past the block that
        // updateRays() already decided not to have here. Skip all of it.
        if (this.FullyVignetted) { this.cd_set.toBack(); return; }

        var XI = this.data.X2;
        var YI = this.data.Y2;
         var realImageExtension = null; // envelope corners for the post-crossing fade, filled in below
         var virtualImageExitExtension = null; // envelope corners for the post-exit fade (virtual image case), filled in below
         var collimatedExtension = null; // envelope corners for the post-exit fade (collimated/image-at-infinity case), filled in below

         // Fade divergent exit rays out over fadeDistance (see above).
         var exitRefLength = fadeDistance;
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



