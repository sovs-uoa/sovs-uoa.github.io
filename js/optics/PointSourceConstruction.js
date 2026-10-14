
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


/* An image on the back focal plane (F': the retina of an emmetropic eye) belongs to an object at infinity, and a finite object
   that far off has no sensible position or height: dragged, or typed in exactly, its numbers run away (to 10^14 m
   from rounding) and the beam is lost. So an object that would be farther than farLimit is kept at that distance, on the
   side it is on (sideHint when it is exactly at infinity), at the height that gives the image height asked for. The
   image then sits within micrometres of the plane. Returns the pair data to use (the one given when it is fine). */
function clampFarObjectPair (id, pairData, totalLens, sideHint, forceSide) {

  if (!pairData || !totalLens || !totalLens.F || !isFinite(totalLens.F)) { return pairData; }
  // far enough that the image is within about 0.02 micrometres of the plane (offset = f'^2 / distance), but no further
  // than the drawing copes with: 100 km for an eye, up to 10,000 km for a weak system
  var focal    = 1 / Math.abs(totalLens.F);
  var farLimit = Math.min(1e7, Math.max(1e5, focal * focal / 2e-8));            // metres
  var objZ = pairData.X1;
  if (isFinite(objZ) && Math.abs(objZ) <= farLimit) { return pairData; }

  var side  = forceSide || (isFinite(objZ) ? (objZ < 0 ? -1 : 1) : (sideHint || -1));
  var farZ  = side * farLimit;
  var probe = Optics.calculateConjugatePairFrom({ id: id, which: "object", z: farZ, h: 1e-3 }, totalLens);
  if (!probe || !isFinite(probe.Y2) || Math.abs(probe.Y2) < 1e-15 || !isFinite(pairData.Y2)) { return pairData; }

  var farH = 1e-3 * (pairData.Y2 / probe.Y2);
  var far  = Optics.calculateConjugatePairFrom({ id: id, which: "object", z: farZ, h: farH }, totalLens);
  if (far && isFinite(far.X2) && isFinite(far.Y2)) { far.atInfinity = side; return far; }     // (the table shows it as at infinity)
  return pairData;
}


function movePointSource (dx, dy, pointerX, pointerY) {

      ////console.log("--- called construction move point id = " + this.id);  


      // update the appropriate point 
      dx = kx*dx; 
      dy = ky*dy;

      nowX = this.ox + dx;
      nowY = this.oy + dy;

      nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

      // held on V, V', F, F', P, P', N or N' as the drag reaches or passes it (Alt turns that off)
      nowX = snapDraggedX(this, nowX);

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

      // (an image dragged on to the back focal plane: the object is kept a large but finite distance away; see above)
      if (thisPoint.type === "image") {
        // an object that is finite remembers which side of the lens it is on; held exactly on F' (where the sign of the
        // far distance is only rounding) it stays on that side, so it does not jump across to a virtual object
        if (isFinite(pairData.X1) && Math.abs(pairData.X1) < 1e4) { this.nearSide = pairData.X1 < 0 ? -1 : 1; }
        var clamped = clampFarObjectPair(thisPoint.id, pairData, totalLens, this.farSide,
                                         this.snappedTo === "F'" ? this.nearSide : 0);
        if (clamped !== pairData) {
          this.farSide = isFinite(pairData.X1) ? (pairData.X1 < 0 ? -1 : 1) : this.farSide;
          pairData = clamped;
          nowX = pairData.X2; nowY = pairData.Y2;
          this.attr({ cx: nowX, cy: nowY });        // the image point sits where the (far) object really puts it
        }
      }

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
      this.lastX = this.ox;

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

/* ---------------------------------------------------------------------------------------------------------------

   INTERMEDIATE IMAGES

   An element ticked "Int. Image" in the prescription (args "intermediate": true in a .lens file) has the image the
   system makes UP TO that element marked on the diagram: where its two outermost traced rays meet, or appear to meet
   when extended backwards. It is a ringed point - solid for a real image, dashed for a virtual one - labelled I1, I2...
   in order (the final image keeps its own point). The virtual image behind a mirror that the next lens goes on to
   work on is the usual case.

--------------------------------------------------------------------------------------------------------------- */

function drawIntermediateImages (construction, ray, K, M) {

  if (typeof renderableLens === "undefined" || !renderableLens || !renderableLens.elem) { return; }
  var rows = renderableLens.elem, count = 0;

  for (var k = 0; k < K; k++) {

    var row = rows[k] && rows[k].elem;
    if (!row || row.intermediate !== true) { continue; }

    var a = ray[k][0], b = ray[k][M-1];
    if (!a || !b || !(Math.abs(b.u - a.u) > 1e-12)) { continue; }          // parallel: the image is at infinity

    var z = (a.h - b.h + b.u * b.z - a.u * a.z) / (b.u - a.u);              // where the two edge rays cross
    var h = a.h + a.u * (z - a.z);
    if (!isFinite(z) || !isFinite(h) || Math.abs(z) > 50 * viewBoxWidth) { continue; }

    // light travels towards +z in positive index, back towards -z after a reflection (negative index)
    var direction = 1;
    for (var j = k; j < rows.length; j++) { if (rows[j].elem && rows[j].elem.type === "index") { direction = (rows[j].elem.index < 0) ? -1 : 1; break; } }
    var ahead = (z - a.z) * direction > 0;

    // An image ahead of the element is only formed if nothing gets in the light's way first. If the next element
    // lies between the element and the image (the secondary of a Cassegrain, which catches the light before the
    // primary's focus), the light never gets there: the image is a virtual OBJECT for what follows, and the beam
    // is drawn on to it as dashed lines from that next element.
    var meets = null;
    if (ahead) {
      for (var n = k + 1; n < K; n++) {
        if (Math.abs(ray[n][0].z - a.z) > 1e-9) { meets = ray[n]; break; }
      }
      if (meets && !((meets[0].z - z) * direction < -1e-9)) { meets = null; }     // (it arrives at or beyond the image)
    }
    var real = ahead && !meets;

    count++;

    // a virtual image is where the light only seems to come from: show the lines it seems to come along; an image
    // the light is cut off from is the same, drawn on from the element that cuts it off
    var from = ahead ? (meets ? [meets[0], meets[M-1]] : []) : [a, b];
    from.forEach(function (r) {
      var back = paper.path(["M", r.z, r.h, "L", z, h]);
      back.attr({ stroke: "#000000", "stroke-opacity": 0.5, "stroke-width": 1, "stroke-dasharray": "--" });
      back.node.setAttribute("pointer-events", "none");
      construction.cd_set.push(back);
    });

    var ring = paper.circle(z, h, kx * 5);
    ring.attr({ fill: "#ffffff", "fill-opacity": 0.7, stroke: "#000000", "stroke-width": 1 });
    if (!real) { ring.node.setAttribute("stroke-dasharray", "2,2"); }
    ring.node.setAttribute("class", "intermediate-image");
    ring.node.setAttribute("title", real ? "Intermediate image (real)" : (ahead ? "Intermediate image (the light is cut off before it: a virtual object for the next element)" : "Intermediate image (virtual)"));
    RegisterWheelCallback({ type: "point", handle: ring });

    var label = drawText(z, h, "I" + count);
    label.data("data-shift-Y", -1.1);                                        // just above the point
    RegisterWheelCallback({ type: "text", handle: label });

    construction.cd_set.push(ring, label);
  }
}


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
     // a mirror has no length and F = F': nothing to measure a distance by, so draw the beam out across the view
     if (!(fadeDistance > 1e-9)) { fadeDistance = viewBoxWidth; }
     



     this.cd_set.remove ();
     clearBeamFadeGradients ();
     var dimensions = [ ray.length, ray[0].length ];
     var K = dimensions[0]; // number of surfaces 
     var M = dimensions[1]; // number of rays 


     /* inital rays */  


     // This should be the source

     var X1 = this.data.X1;
     var Y1 = this.data.Y1;
     // An object so far off (its image on the back focal plane) that the drawing cannot reach it - past the page
     // by a factor of millions, where the fills and lines break up. Its rays come in collimated: they are drawn from
     // the system back a stretch, fading out (as for a virtual object), with dashed continuations on towards infinity.
     var farObject = isFinite(X1) && Math.abs(V1 - X1) > 1000 * fadeDistance;      // (on either side: a virtual object this far off is the same collimated beam)
     var farObjectEntry = null;
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
            var u1 = this.inputRays[i].u;
            var p4;
            if (farObject) {
              // a virtual object this far off (the image on the back focal plane): the construction goes on forwards from the
              // surface, in the beam's colour, towards the object at +infinity - a collimated beam, not a line to a point
              var farLen = 3 * fadeDistance;
              p4 = paper.path( ["M", X2, Y2,  "L", X2 + farLen, Y2 + farLen * u1 ]);
              p4.attr(virtual);                                           // the same style as the line to a nearer virtual object
            } else {
              p4 = paper.path( ["M", X1, Y1,  "L", X2, Y2 ]);
              p4.attr(virtual);
            }
            this.cd_set.push(p4);

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

            if (farObject) {

              var uFar = this.inputRays[i].u;
              var XE   = X2 - fadeDistance, YE = Y2 - fadeDistance * uFar;           // end of the solid, fading, stretch
              var pS   = paper.path( ["M", X2, Y2, "L", XE, YE ]);
              pS.attr(real);
              this.cd_set.push(pS);
              // the construction towards the object at +infinity: on forwards from the surface, in the style of the line to
              // a nearer virtual object (never backwards)
              var pD   = paper.path( ["M", X2, Y2, "L", X2 + 3 * fadeDistance, Y2 + 3 * fadeDistance * uFar ]);
              pD.attr(virtual);
              this.cd_set.push(pD);
              if (!farObjectEntry) { farObjectEntry = { }; }
              if (i === 0)   { farObjectEntry.entry0 = [X2, Y2]; farObjectEntry.end0 = [XE, YE]; farObjectEntry.el0 = pS; }
              if (i === M-1) { farObjectEntry.entryM = [X2, Y2]; farObjectEntry.endM = [XE, YE]; farObjectEntry.elM = pS; }

            } else if (isFinite(X1)) { 

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
     if (farObjectEntry && farObjectEntry.end0 && farObjectEntry.endM) {
       var fEntryMid = [ (farObjectEntry.entry0[0] + farObjectEntry.entryM[0]) / 2, (farObjectEntry.entry0[1] + farObjectEntry.entryM[1]) / 2 ];
       var fEndMid   = [ (farObjectEntry.end0[0]   + farObjectEntry.endM[0])   / 2, (farObjectEntry.end0[1]   + farObjectEntry.endM[1])   / 2 ];
       shadeFadingBeamRegion(this.cd_set, [farObjectEntry.entry0, farObjectEntry.end0, farObjectEntry.endM, farObjectEntry.entryM], fEntryMid, fEndMid, 0.6);
       fadeRayStroke(farObjectEntry.el0, fEntryMid, fEndMid, 0.6);
       fadeRayStroke(farObjectEntry.elM, fEntryMid, fEndMid, 0.6);
     }

     if (virtualObjectEntryExtension && virtualObjectEntryExtension.end0 && virtualObjectEntryExtension.endM) {
       if (!farObject) { drawRealVirtualBoundary(this.cd_set, virtualObjectEntryExtension.entry0[0], virtualObjectEntryExtension.entry0[1], virtualObjectEntryExtension.entryM[1]); }
       var objEntryMid = [ (virtualObjectEntryExtension.entry0[0] + virtualObjectEntryExtension.entryM[0]) / 2,
                            (virtualObjectEntryExtension.entry0[1] + virtualObjectEntryExtension.entryM[1]) / 2 ];
       var objEndMid   = [ (virtualObjectEntryExtension.end0[0]  + virtualObjectEntryExtension.endM[0])  / 2,
                            (virtualObjectEntryExtension.end0[1]  + virtualObjectEntryExtension.endM[1])  / 2 ];
       shadeFadingBeamRegion(
         this.cd_set,
         [virtualObjectEntryExtension.entry0, virtualObjectEntryExtension.end0, virtualObjectEntryExtension.endM, virtualObjectEntryExtension.entryM],
         objEntryMid,
         objEndMid,
         0.6
       );
       // the bounding rays themselves should fade out along with the region
       // they border, rather than staying solid all the way to their endpoint
       fadeRayStroke(virtualObjectEntryExtension.el0, objEntryMid, objEndMid, 0.6);
       fadeRayStroke(virtualObjectEntryExtension.elM, objEntryMid, objEndMid, 0.6);
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
     // A beam that ends on a screen (the last element is an "img") whose image is formed BEYOND the screen cannot
     // get there: the light stops at the screen. Everything from the screen on to that image is a construction
     // (dashed, virtual), and no shading is laid over it. An image on the screen itself still counts as real.
     var screenTravel     = (lens.n2 < 0) ? -1 : 1;
     var screenRow        = (typeof renderableLens !== "undefined" && renderableLens && renderableLens.elem) ? renderableLens.elem[renderableLens.elem.length - 1] : null;
     // an image so far away that it is "at infinity" for the drawing (the object at, or almost at, the front focal point)
     var imageAtInfinity  = !isFinite(this.data.X2) || Math.abs(this.data.X2 - V2) > 30 * fadeDistance;
     var endsOnImg        = !!(screenRow && screenRow.elem && screenRow.elem.type === "img");
     var imageBeyondScreen = endsOnImg && isFinite(this.data.X2) && !imageAtInfinity &&
                             ((this.data.X2 - ray[K-1][0].z) * screenTravel > Math.max(1e-5, 2 * kx));
     var isRealImagePath  = isFinite(this.data.X2) && (this.data.X2*shadeDirection > V2*shadeDirection) && !imageBeyondScreen &&
                            !(endsOnImg && imageAtInfinity);
     var isRealObjectPath = isFinite(this.data.X1) && (this.data.X1 <= V1) && !farObject;

     // EXPERIMENTAL: shade the whole object->image envelope (bounded at both
     // ends, so a plain solid fill - no fade needed) in one shape, using the
     // outermost ray (i=0) forward and the other outermost ray (i=M-1) back as
     // its two edges, rather than shading each surface-to-surface gap separately.
     // For a virtual object/image, stop the fill at the system's entry/exit
     // surface instead - see the comment above.
     if (isFinite(this.data.X1)) {

        // Light that is reflected turns round (the surfaces after a mirror lie to its LEFT). One outline then runs
        // forwards along one edge of the beam and back along the other, crossing over itself, and wherever the
        // two passes overlap the fill cancels out and leaves a hole. So a beam that turns round is shaded a stretch
        // at a time instead.
        var turnsRound = false;
        for (var k=0; k < K-1; k++) { if (ray[k+1][0].z < ray[k][0].z - 1e-12) { turnsRound = true; } }

        if (!turnsRound) {

          var envelope = [];
          if (isRealObjectPath) { envelope.push([this.data.X1, this.data.Y1]); }
          for (var k=0; k < K; k++) { envelope.push([ray[k][0].z, ray[k][0].h]); }
          if (isRealImagePath) { envelope.push([this.data.X2, this.data.Y2]); }
          for (var k=K-1; k >= 0; k--) { envelope.push([ray[k][M-1].z, ray[k][M-1].h]); }
          shadeBoundedBeamRegion(this.cd_set, envelope);

        } else {

          if (isRealObjectPath) { shadeBoundedBeamRegion(this.cd_set, [[this.data.X1, this.data.Y1], [ray[0][0].z, ray[0][0].h], [ray[0][M-1].z, ray[0][M-1].h]]); }
          for (var k=0; k < K-1; k++) {
            shadeBoundedBeamRegion(this.cd_set, [[ray[k][0].z, ray[k][0].h], [ray[k+1][0].z, ray[k+1][0].h],
                                                 [ray[k+1][M-1].z, ray[k+1][M-1].h], [ray[k][M-1].z, ray[k][M-1].h]]);
          }
          if (isRealImagePath) { shadeBoundedBeamRegion(this.cd_set, [[ray[K-1][0].z, ray[K-1][0].h], [this.data.X2, this.data.Y2], [ray[K-1][M-1].z, ray[K-1][M-1].h]]); }
        }
     }

     drawIntermediateImages(this, ray, K, M);

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

        // A beam that ends on a screen has been drawn right down to the screen by the traced rays above. If its
        // focus lies BEHIND the screen's position (along the way the light is going), the beam has crossed over and
        // is spreading again by the time it arrives: drawing "on to the image" from there would lay a dashed
        // virtual-image line on top of the real beam it came along. Nothing more is added.
        var travelDir   = (lens.n2 < 0) ? -1 : 1;
        var lastElement = (typeof renderableLens !== "undefined" && renderableLens && renderableLens.elem) ? renderableLens.elem[renderableLens.elem.length - 1] : null;
        var onScreen    = !!(lastElement && lastElement.elem && lastElement.elem.type === "img");
        if (onScreen && isFinite(XI) && (XI - ray[K-1][0].z) * travelDir < -1e-9) {
          // The focus is behind the screen. If it is still AHEAD of the last surface the light crossed over before the
          // screen (a real image in front of it): the beam is already drawn right down to the screen, nothing to add.
          // If it is behind the last surface the rays are still spreading as they reach the screen and the image is
          // virtual: its dashed construction lines run from that last surface back to the image, which ties the point
          // to the beam (the light itself ends on the screen).
          var kPrev = -1;
          for (var kk = K - 2; kk >= 0; kk--) { if ((ray[kk][0].z - ray[K-1][0].z) * travelDir < -1e-9) { kPrev = kk; break; } }
          if (kPrev >= 0 && isFinite(YI) && (XI - ray[kPrev][0].z) * travelDir < -1e-9) {
            [0, M-1].forEach(function (ri) {
              var back = paper.path(["M", ray[kPrev][ri].z, ray[kPrev][ri].h, "L", XI, YI]);
              back.attr(virtual);
              this.cd_set.push(back);
            }, this);
            drawRealVirtualBoundary(this.cd_set, ray[kPrev][0].z, ray[kPrev][0].h, ray[kPrev][M-1].h);
          }
          this.cd_set.toBack(); return;
        }

        // An image at infinity (the object at the front focal point) on a beam that ends on a screen: the light arrives
        // collimated and goes no further. The image is virtual, "at infinity" - shown as the rays' back-projections, a
        // collimated virtual beam running back from the last surface (dashed, fading out), and a boundary line at that
        // surface. Nothing is drawn beyond the screen.
        if (onScreen && imageAtInfinity) {
          var kPar = -1;
          for (var kp = K - 2; kp >= 0; kp--) { if ((ray[kp][0].z - ray[K-1][0].z) * travelDir < -1e-9) { kPar = kp; break; } }
          if (kPar < 0) { kPar = K - 1; }
          var backLen = fadeDistance * travelDir;
          var backEnds = [];
          [0, M-1].forEach(function (ri) {
            var pk = ray[kPar][ri];
            var z0 = pk.z - backLen, h0 = pk.h - pk.u * backLen;
            var back = paper.path(["M", pk.z, pk.h, "L", z0, h0]);
            back.attr(virtual);
            this.cd_set.push(back);
            backEnds.push([z0, h0, back]);
          }, this);
          if (kPar !== K - 1) { drawRealVirtualBoundary(this.cd_set, ray[kPar][0].z, ray[kPar][0].h, ray[kPar][M-1].h); }
          // the virtual beam fades out away from the surface, as a real diverging one does
          var fromMid = [ray[kPar][0].z, (ray[kPar][0].h + ray[kPar][M-1].h) / 2];
          var toMid   = [(backEnds[0][0] + backEnds[1][0]) / 2, (backEnds[0][1] + backEnds[1][1]) / 2];
          fadeRayStroke(backEnds[0][2], fromMid, toMid);
          fadeRayStroke(backEnds[1][2], fromMid, toMid);
          this.cd_set.toBack(); return;
        }

        // An image that falls ON the screen (lv' exactly 0, or within a pixel or two of it) is where the beam ends: the
        // light is stopped there, so there is nothing to draw beyond it - no virtual-image line, and no extension of
        // the rays "diverging again" past the screen. (An image exactly on the vertex used to be taken for a virtual
        // one, whose rays are carried on past the surface.)
        if (onScreen && isFinite(XI) && Math.abs(XI - ray[K-1][0].z) <= Math.max(1e-5, 2 * kx)) { this.cd_set.toBack(); return; }
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
              if (i === 0) { drawRealVirtualBoundary(this.cd_set, ray[K-1][0].z, ray[K-1][0].h, ray[K-1][M-1].h); }

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
              p4.attr(imageBeyondScreen ? virtual : real);       // (past the screen: the line is only where the rays would have met)
              this.cd_set.push(p4);
              if (imageBeyondScreen && i === 0) { drawRealVirtualBoundary(this.cd_set, X1, ray[K-1][0].h, ray[K-1][M-1].h); }
              if (imageBeyondScreen || onScreen) { continue; }    // no light goes on past a screen: nothing is drawn beyond the img element

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



