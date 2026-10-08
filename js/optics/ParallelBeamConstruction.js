
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


/* -------------------------------------------------------------------------------

BEAM SHADING (experimental)

Shades the region between a beam's bounding rays yellow. A region that is
genuinely bounded (the beam actually converges to a point) is filled solid; a
region that runs out toward the "effectively infinite" sentinel distance used
elsewhere in this file (representing a beam that never converges, or has already
crossed and is diverging again) is filled with a gradient that fades to
transparent at that far end, so it doesn't read as a solid yellow wedge running
off the edge of the diagram.

------------------------------------------------------------------------------- */

var beamShadeGradientCounter = 0;


/* ---------------------------------------------------------------------------------------------------------------

  THE WIDTH EDGES  The two edges of the INCOMING part of a beam from infinity can be grabbed anywhere along their
  length: drag one towards or away from the beam's centre line and the beam gets narrower or wider. They are the edges
  you asked for - before any aperture has clipped the beam - so there is always something to catch, even for a
  vignetted beam. (Moving a beam is the job of its other handle, which rotates it: a beam from infinity has no other
  position.) Each edge is an invisible band a few pixels wide (the cursor changes over it; nothing is drawn).

--------------------------------------------------------------------------------------------------------------- */

// `pairs` lists the two edges of the beam along each stretch of it, as {a:[x1,y1,x2,y2], b:[x1,y1,x2,y2]}: the
// incoming rays, between the surfaces, and out the far side. Whichever edge is grabbed, the beam's width follows
// the pointer: the edges stay symmetrical about the chief ray and scale with the width, so the new width is the
// old one times (pointer's distance from the middle) / (the edge's distance from the middle) at that x.
function placeWidthGrip (c, pairs) {

  if (!c.widthGrip) { c.widthGrip = { nodes: [], pairs: [], state: null, dragging: false }; }
  var grip = c.widthGrip;
  grip.pairs = pairs;

  function pointerInModelUnits (e) {
    var pt = paper.canvas.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(paper.canvas.getScreenCTM().inverse());
  }

  // Pin fixes the width at the stop's (Vig leaves it to you)
  function widthIsFixed () { return !!(c.PinToApertureStop && !c.VignetteAware); }

  function yAt (l, x) { return (l[2] === l[0]) ? NaN : l[1] + (l[3] - l[1]) * (x - l[0]) / (l[2] - l[0]); }

  function makeNode () {
    var edge = paper.path(["M", 0, 0, "L", 1, 0]);
    edge.node.setAttribute("class", "width-edge");
    edge.attr({ "stroke": "#ff9900", "stroke-opacity": 0, cursor: "ns-resize" });
    edge.drag(
      function (dx, dy, x, y, e) {                          // move
        var s = grip.state; if (!s || widthIsFixed()) { return; }
        var p = pointerInModelUnits(e || { clientX: x, clientY: y });
        var U = yAt(s.pair.a, p.x), L = yAt(s.pair.b, p.x);
        var halfNow = Math.abs(U - L) / 2;
        if (!isFinite(halfNow) || halfNow < 1e-9) { return; }       // the edges cross here: no way to tell
        var half  = Math.abs(p.y - (U + L) / 2);
        var width = Math.max(s.w0 * half / halfNow, 0.0005);
        c.setBeamWidth(width);                              // redraws the beam (and these edges, in their new place)
        if (typeof lens !== "undefined" && lens.pointsTable) { lens.pointsTable.updateData([ { id: c.getId(), beamwidth: width } ]); }
        // (the next move measures against the beam as it was when grabbed, so keep that frame)
      },
      function () {                                         // start
        if (widthIsFixed()) { grip.state = null; return; }
        var pair = grip.pairs[edge.pairIdx];
        grip.state = { pair: JSON.parse(JSON.stringify(pair)), w0: Number(c.BeamWidth) };
        grip.dragging = true; setGrabbingCursor(true);
      },
      function () { grip.dragging = false; grip.state = null; setGrabbingCursor(false); }   // up
    );
    return edge;
  }

  // two invisible bands per stretch (kept between redraws, so a drag in progress is not lost)
  var fixed = widthIsFixed();      // no grip while the width is fixed by Pin (it is the stop's width then)
  for (var k = 0; k < 2 * pairs.length; k++) {
    if (!grip.nodes[k]) { grip.nodes[k] = makeNode(); }
    var n = grip.nodes[k], pr = pairs[k >> 1], l = (k % 2) ? pr.b : pr.a;
    n.pairIdx = k >> 1;
    // the band stops short of both ends of the stretch: that is where the points sit (the focus, the principal planes,
    // the lens), and they must be easy to grab - a band 14 pixels wide laid over one would take the click
    var len = Math.hypot(l[2] - l[0], l[3] - l[1]), cut = 18 * kx;
    var usable = len > 2 * cut + 8 * kx;
    var t0 = usable ? cut / len : 0, t1 = usable ? 1 - cut / len : 1;
    n.attr({ path: ["M", l[0] + (l[2] - l[0]) * t0, l[1] + (l[3] - l[1]) * t0, "L", l[0] + (l[2] - l[0]) * t1, l[1] + (l[3] - l[1]) * t1] });
    n.toFront();
    (fixed || !usable) ? n.hide() : n.show();
  }
  for (var j = 2 * pairs.length; j < grip.nodes.length; j++) { grip.nodes[j].hide(); }
}

function removeWidthGrip (c) {
  if (c.widthGrip) { c.widthGrip.nodes.forEach(function (n) { n.remove(); }); c.widthGrip = null; }
}

// The usual pale yellow - except in advanced materials mode, where each object's beam takes the colour of the
// wavelength it is being traced at (see settings.js), so the diagram says which wavelength it is showing.
function beamShadeColor () {
    var coloured = (typeof SovsSettings !== "undefined") && SovsSettings.advancedMaterials &&
                   (typeof currentLensWavelength !== "undefined") && isFinite(currentLensWavelength);
    return coloured ? SovsSettings.entryFor(currentLensWavelength).color : "#ffee00";
}

function shadeBoundedBeamRegion (cd_set, pts) {

    var path = ["M"].concat(pts[0], pts.slice(1).reduce(function (acc, p) { return acc.concat(["L"], p); }, []), ["Z"]);
    var poly = paper.path(path);
    poly.attr({ fill: beamShadeColor(), "fill-opacity": 0.25, stroke: "none" });
    poly.node.setAttribute("class", "beam-shade");   // lets the additive-beams view blend it (see optics.css)
    poly.toBack();
    poly.node.setAttribute("pointer-events", "none"); // purely decorative - never intercept clicks meant for the handle
    cd_set.push(poly);
    return poly;
}

// fadeFromXY/fadeToXY: the userSpace points the fade gradient runs between -
// opaque at fadeFromXY, transparent at fadeToXY (the "infinity" end)
function shadeFadingBeamRegion (cd_set, pts, fadeFromXY, fadeToXY) {

    var defs = paper.canvas.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      paper.canvas.insertBefore(defs, paper.canvas.firstChild);
    }

    var gradId = "beam-fade-" + (beamShadeGradientCounter++);
    var grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", gradId);
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", fadeFromXY[0]); grad.setAttribute("y1", fadeFromXY[1]);
    grad.setAttribute("x2", fadeToXY[0]);   grad.setAttribute("y2", fadeToXY[1]);

    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0");
    stop1.setAttribute("stop-color", beamShadeColor());
    stop1.setAttribute("stop-opacity", "0.25");   // the same as the bounded regions (fill-opacity above), so a beam is one even tint
    stop1.setAttribute("class", "beam-fade-start");

    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "1");
    stop2.setAttribute("stop-color", beamShadeColor());
    stop2.setAttribute("stop-opacity", "0");

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);

    var path = ["M"].concat(pts[0], pts.slice(1).reduce(function (acc, p) { return acc.concat(["L"], p); }, []), ["Z"]);
    var poly = paper.path(path);
    poly.attr({ stroke: "none" });
    // Raphael's own .attr({fill:"url(...)"}) treats any url(...) string as a raster
    // image fill (wraps it in <pattern><image>), not a direct SVG paint-server
    // reference - set it on the raw node instead to actually get the gradient.
    poly.node.setAttribute("fill", "url(#" + gradId + ")");
    poly.toBack();
    poly.node.setAttribute("class", "beam-shade");
    poly.node.setAttribute("data-beam-fade-gradient", gradId); // see clearBeamFadeGradients()
    poly.node.setAttribute("pointer-events", "none"); // purely decorative - never intercept clicks meant for the handle
    cd_set.push(poly);

    return poly;
}

// Fades a ray LINE's own stroke to transparent between fadeFromXY (opaque)
// and fadeToXY (fully transparent) - the same idea as shadeFadingBeamRegion's
// fill gradient, applied to the bounding ray itself rather than the region
// between the two rays, so a diverging ray reads as fading out consistently
// with the shaded region it borders instead of staying solid all the way to
// its (somewhat arbitrary) drawn endpoint.
function fadeRayStroke (pathEl, fadeFromXY, fadeToXY) {

    var defs = paper.canvas.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      paper.canvas.insertBefore(defs, paper.canvas.firstChild);
    }

    // same "beam-fade-" id prefix as shadeFadingBeamRegion() so
    // clearBeamFadeGradients() also cleans these up on the next redraw
    var gradId = "beam-fade-" + (beamShadeGradientCounter++);
    var grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", gradId);
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", fadeFromXY[0]); grad.setAttribute("y1", fadeFromXY[1]);
    grad.setAttribute("x2", fadeToXY[0]);   grad.setAttribute("y2", fadeToXY[1]);

    var stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0");
    stop1.setAttribute("stop-color", "black");
    stop1.setAttribute("stop-opacity", "1");
    stop1.setAttribute("class", "beam-edge-stop");   // light on the dark (additive) canvas, like the other rays

    var stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "1");
    stop2.setAttribute("stop-color", "black");
    stop2.setAttribute("stop-opacity", "0");
    stop2.setAttribute("class", "beam-edge-stop");

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);

    // same url(...) note as shadeFadingBeamRegion - set on the raw node
    pathEl.node.setAttribute("stroke", "url(#" + gradId + ")");
    pathEl.node.setAttribute("data-beam-fade-gradient", gradId);

}

// the <defs><linearGradient> nodes shadeFadingBeamRegion() creates aren't part of
// the Raphael set, so cd_set.remove() on the next redraw won't clean them up -
// every construction's own refresh() calls this first each time to avoid
// piling them up.
//
// This must only remove gradients that are truly orphaned (belonged to
// elements THIS construction just removed via cd_set.remove()) - not every
// "beam-fade-" gradient in the document. Dragging one beam's handle only
// refreshes that ONE construction; if this swept every gradient regardless
// of owner, it would break every OTHER beam still on screen (their paths
// would be left pointing at a url(#...) that no longer exists, so their
// fade-shaded fill/stroke - e.g. an incoming collimated beam - silently
// disappears until that other beam happens to get redrawn too). Elements
// that reference a gradient are tagged with data-beam-fade-gradient (see
// shadeFadingBeamRegion/fadeRayStroke) - a gradient is only removed once
// nothing in the document still carries that tag.
function clearBeamFadeGradients () {
    var defs = paper.canvas.querySelector("defs");
    if (!defs) { return; }
    var stillReferenced = {};
    Array.from(paper.canvas.querySelectorAll("[data-beam-fade-gradient]")).forEach(function (el) {
      stillReferenced[el.getAttribute("data-beam-fade-gradient")] = true;
    });
    Array.from(defs.querySelectorAll("linearGradient[id^='beam-fade-']")).forEach(function (g) {
      if (!stillReferenced[g.id]) { defs.removeChild(g); }
    });
}


/*   -------------------------------------------------

These functions are called as the picker is dragged 

------------------------------------------------------ */

function onstart ()   { console.log("onstart picker"); };

function onmove (th)  {

      // this => AnglePicker
      //console.log("angle picker passed angle = " + th);

      // the handle itself is drawn perpendicular to the ray (see addBeamConstruction/
      // refresh, which set its angle to T1+90) so it doesn't overlap the rays it
      // controls - convert its own (raw) geometric angle back to the ray angle here.
      // "th - 90" is the handle's own TRUE geometric angle (AnglePicker.setAngle
      // is a real polar-to-cartesian rotation) - not the paraxial field angle T1
      // itself, since the ray is drawn with the linear slope deg2rad(T1), whose
      // true geometric angle is atan(deg2rad(T1)), not T1 (they coincide only for
      // a small T1) - see fieldAngleToGeometricAngle/geometricAngleToFieldAngle.
      var geometricAngle = th + 90;

      // Clamp the GEOMETRIC angle away from +-90 deg first (tan() of exactly
      // +-90 is infinite) - and critically, dragging the CYAN IMAGE POINT
      // instead (see moveBeamImagePoint below) can only ever recover a
      // geometric angle in that same (-90,90) range, since it inverts the
      // image height via a plain division (linear in the field angle) that
      // is only ever single-valued there.
      geometricAngle = Math.max(-89.9, Math.min(89.9, geometricAngle));
      var T1 = geometricAngleToFieldAngle(geometricAngle);

      // That alone is NOT enough, though: T1 = tan(geometricAngle), so T1
      // itself blows up (thousands of degrees) as geometricAngle merely
      // APPROACHES 90 deg, long before reaching the clamp above - paraxial
      // theory only ever describes a small angle in the first place, so
      // there is no sense in which a huge T1 is "more correct", just
      // increasingly meaningless. Clamp T1 itself too, and re-derive the
      // handle's own geometric angle from that clamped T1 (rather than
      // leaving the handle at the raw dragged geometricAngle) so the two
      // stay consistent - the handle visually "sticks" once T1 saturates,
      // rather than continuing to rotate past where T1 can still follow it.
      T1 = Math.max(-89.9, Math.min(89.9, T1));
      this.setAngle(fieldAngleToGeometricAngle(T1) - 90);

      // update the graphic + associated table
      myPoint   = { id:this.parent.getId(), type: "beam", which: "object", t: T1 };
      totalLens = renderableLens.total;    
      PairData  = Optics.calculateConjugatePairFrom(myPoint, totalLens); 
      this.parent.setPairData(PairData);

      


      // update the table for the beam  
      //lens.pointsTable.updateData([ { id: myPoint.id, 
      //                                to: PairData.T1, 
      //                                zi: PairData.X2, "hi": PairData.Y2 } ]);
      // console.log(PairData);

      updatePointsTable(myPoint.id, PairData);

      //myinfo = this.data("data-attr-info"); 

      this.parent.remove(); 
      this.parent.draw();

};

function onup ()      { console.log("onup picker"); };


/*   -----------------------------------------------------------------

MOVEBEAMIMAGEPOINT  drag handlers for the cyan image point on a beam-from-infinity
construction. A beam's image always forms at the fixed back focal plane, so only the
height (dy) is meaningful; it is converted to the equivalent incoming angle using the
same relationship calculatePairFromObject's infinite-object branch uses to go the other
way (IQ = (n2/F)*tan(angle)), then redrawn exactly like dragging the angle picker does.

--------------------------------------------------------------------- */

function startBeamImagePoint () {

      this.oy = this.attr("cy");

      setGrabbingCursor(true);

};

function moveBeamImagePoint (dx, dy) {

      dy = ky*dy;

      var nowY = this.oy + dy;
      nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

      var thisPoint = this.data("data-attr");
      totalLens     = renderableLens.total;

      // Inverse of calculateConjugatePairFrom's IQ = zp * deg2rad(t) (paraxial,
      // linear - not zp * tan(deg2rad(t))), so recovering t from a dragged
      // image height is now a plain division, no atan() needed.
      var zp = Math.abs(totalLens.n2) / totalLens.F;      // (a mirror's negative index is no change to the size)
      var th = rad2deg(nowY / zp);

      var myPoint = { id: thisPoint.id, type: "beam", which: "object", t: th };
      pairData    = Optics.calculateConjugatePairFrom(myPoint, totalLens);
      updatePointsTable(myPoint.id, pairData);

      thisPoint.parent.setPairData(pairData);
      thisPoint.parent.refresh(); // also re-anchors/re-angles the angle-picker handle,
                                   // keeping it in sync with this drag too

};

function upBeamImagePoint ()  { setGrabbingCursor(false); };


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


/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */


class ParallelBeamConstruction { // create a ray construction using raphael.js


	 constructor(lens, data, BeamWidth) {

	 	   // global paper 
       this.cd_set = paper.set();
       this.displayOptions;

       this.data        = data;
       this.lens        = lens;
       this.anchorPoint = "N1"; // or V1 if no N1 is available !

       this.imagePoint;
       this.objectPoint;
       this.anglePicker;
       this.BeamWidth    = BeamWidth || 1.0;
       this.PinToApertureStop = false; // see setPinToApertureStop()
       this.VignetteAware     = false; // PIN (false): only the system's designated stop element. VIG (true): whichever element is genuinely tightest for this ray, anywhere in the system.

       this.addBeamConstruction ();
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
      removeWidthGrip(this);

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
    setPinToApertureStop(flag, vignetteAware) {
      this.PinToApertureStop = !!flag;
      this.VignetteAware     = !!vignetteAware;
      this.refresh ();
      if (this.widthGrip) { var fixed = this.PinToApertureStop && !this.VignetteAware; this.widthGrip.nodes.forEach(function (n) { if (fixed) { n.hide(); } }); }
    }

    setLens(lens) {

      this.lens = lens;

    }



  refresh() {

        console.log ('called REFRESH ParallelBeamCOnsturction');

        // Anchor the handle at whichever point the rays themselves actually
        // pivot about - N1 normally, but the entrance pupil (VE1) when
        // pinned (see drawBeamConstruction) - otherwise the handle visually
        // rotates about a different point than the rays it is meant to be
        // controlling, so its angle stops looking like it corresponds to
        // the beam it is driving.
        var stopIndex = this.VignetteAware ? undefined : renderableLens.total.stopIndex;
        var pupilInfo = this.PinToApertureStop ? Optics.findApertureStopForInfiniteObject(renderableLens.elem, stopIndex) : null;
        var N1 = this.lens.cardinal.VN1;
        // safePinnedPupilInfo (optics.js) guards against VE1 itself coming
        // back non-finite (a real, physically-meaningful degeneracy when
        // the aperture stop sits exactly at an image conjugate) - no object
        // position to check here, since this is a beam from infinity.
        pupilInfo = safePinnedPupilInfo(pupilInfo, renderableLens.total.pupil.VE1, null);
        var pivotZ = pupilInfo ? renderableLens.total.pupil.VE1 : N1;
        this.anglePicker.setAnchor(pivotZ, 0);  // change the anchor

        var T1 = this.data.T1;
        this.anglePicker.setAngle(fieldAngleToGeometricAngle(T1) - 90);  // perpendicular to the ray, so the handle doesn't overlap it

        this.remove ();
        this.draw ();

    }



   draw () {
      
      this.drawBeamConstruction ();

      /* image point on top */

      this.imagePoint.attr({ cx: this.data.X2, cy: this.data.Y2 }); // move the image point here
      this.imagePoint.toFront ();
   }



  /* ---------------------------------------------------------------------------------------------------------------

    addPrincipalRayConstruction  - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


    addBeamConstruction () {


        this.drawBeamConstruction (); // this requires the lens prescription 


        // conjugate data (in laboratory frame!)
        var X1 = this.data.X1; var X2 = this.data.X2;        
        var Y1 = this.data.Y1; var Y2 = this.data.Y2;
        var T1 = this.data.T1; var T2 = this.data.T2;
        //var N1 = this.data.N1; var T2 = this.data.N2;


        this.imagePoint  = drawPoint(X2, Y2, "cyan"); // image
        this.imagePoint.drag (moveBeamImagePoint, startBeamImagePoint, upBeamImagePoint);
        this.imagePoint.attr({ cursor: "grab" });
        this.imagePoint.id = "point-" + this.data.id + "-image";
        this.imagePoint.data("data-attr", {  "element_id"     : "point-" + this.data.id + "-image",
                                              "id"            : this.data.id, 
                                              "type"          : "image",
                                              "parent"        : this });


        RegisterWheelCallback({ type: "point", handle: this.imagePoint });        


        //. default beam anchor 
        var lens = this.lens;
        var N1   = lens.cardinal.VN1;             // primary nodal point 
        var N2   = lens.L + lens.cardinal.VN2;    // secondary nodal point 


        // 1.5 x the back focal distance - but never longer than a tenth of the view, which for a short lens in a small
        // view was a stick many times the size of the lens itself
        var defaultHandleLength = lens.cardinal.VF2 * 1.5;
        if (!isFinite(defaultHandleLength) || defaultHandleLength <= 0 || defaultHandleLength > 0.1 * viewBoxWidth) { defaultHandleLength = 0.1 * viewBoxWidth; }

        // this will add an anglePicker, drawn perpendicular to the ray (T1-90, pointing up) so its
        // handle and line don't overlap the ray itself
        this.anglePicker = new AnglePicker (0, 0, defaultHandleLength, fieldAngleToGeometricAngle(T1) - 90);
        this.anglePicker.setAnchor(N1, 0); // move to default point is N1
        this.anglePicker.data("data-attr-info", {  "conjugate_id"  : "point-" + this.data.id + "-image",
                                                   "id"            : this.data.id,
                                                   "type"          : "object",
                                                   "parent"        : this });
        this.anglePicker.parent = this;
        this.anglePicker.drag(onmove, onstart, onup);



        // this.imagePoint.data("data-attr", { "element-id" : "point-" + this.data.id + "-image", "id" : this.data.id, "type" : "image"});
        //this.imagePoint.data("data-attr");

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


     //console.log("-- draw beam construction.");

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
     var X2 = data.X2;
     var Y2 = data.Y2;

     // Fade unbounded beam segments (incoming from infinity, and any
     // divergent exit) out over 2x the system length (V1 to V2), or the
     // F-to-F' distance, whichever is larger - always meaningful even for a
     // zero-thickness thin lens/prism, where "2x the system length" alone
     // would collapse to zero.
     var refLength = Math.max(2*Math.abs(lens.L), Math.abs(F2 - F1));
     if (!(refLength > 1e-9)) { refLength = viewBoxWidth; }     // (a mirror: no length, and F = F')


     // X1_1, Y1_1, X1_2, Y1_2 



    // 
    ret = getBeamObjectStyle({ N1 : N1, N2: N2, 
                               P1 : P1, P2: P2,
                               F1 : F1, F2: F2,
                               T1 : T1 });

    this.cd_set.remove ();
    clearBeamFadeGradients ();

    //console.log(T1);


    /* --------------------------------------------
       OBJECT SPACE RAYS 
      --------------------------------------------- */

    // ... ray points on P1 from infinity aimed at front nodal plane
    var stopIndex = this.VignetteAware ? undefined : renderableLens.total.stopIndex;
    var pupilInfo = this.PinToApertureStop ? Optics.findApertureStopForInfiniteObject(renderableLens.elem, stopIndex) : null;
    // safePinnedPupilInfo (optics.js) guards against VE1 itself coming back
    // non-finite (a real, physically-meaningful degeneracy when the
    // aperture stop sits exactly at an image conjugate) - no object
    // position to check here, since this is a beam from infinity.
    pupilInfo = safePinnedPupilInfo(pupilInfo, renderableLens.total.pupil.VE1, null);
    var bw = pupilInfo ? 2*pupilInfo.angle : this.BeamWidth;
    this.PinnedApertureDiameter = pupilInfo ? 2*pupilInfo.angle : null;

    // The un-pinned beam is drawn as a "chief ray through N1" (the classical
    // nodal-point convention - a ray aimed at the front nodal point exits
    // parallel to itself from the rear nodal point, which is the usual way
    // to draw an arbitrary field angle through a diagram). But a beam PINNED
    // to the aperture stop needs its two marginal rays to straddle the
    // ENTRANCE PUPIL's edges for ANY field angle T1 - that only holds if the
    // whole beam pivots about the entrance pupil's own center (VE1), not
    // N1. N1 and VE1 are generally different axial positions, so reusing N1
    // here would leave the beam correctly WIDE (constant perpendicular
    // separation = pupil diameter, true at any plane along a parallel ray)
    // but off-CENTER at the pupil plane for any T1 != 0, clipping one edge
    // and overshooting the other as the angle changes.
    var pivotZ = pupilInfo ? renderableLens.total.pupil.VE1 : N1;
    var dx = P1 - pivotZ; // position translated to P1

    // The whole rest of the system (calculateRayTrace, translateRays, the
    // system matrices themselves, and now calculateConjugatePairFrom's
    // infinite-object IQ) is paraxial: a ray's direction "u" is used
    // directly, in radians, as its slope - NOT tan(u). Using real tan()/cos()
    // here instead was only a small-angle-accurate approximation of that
    // same relationship: correct for a small T1, but increasingly wrong -
    // both for where a pinned marginal ray actually grazes the aperture
    // stop, and for matching the image point this construction is handed -
    // as T1 grows.
    var u = deg2rad(T1);
    var y1 = u * dx + bw/2;    // upper height on P1 from the pivot
    var y2 = u * dx - bw/2;    // lower height on P1 from the pivot
    var y3 = u * dx;           // height on P1 from the pivot


    // .... rays traced back towards infinity, out to 1x refLength before P1 -
    // just a further extension of the SAME p1/p2 ray computed above, so it
    // needs the same (paraxial) slope convention that ray was built with.
    var gripPairs = [];     // the stretches of the beam's edges that can be grabbed to change its width
    var X   = P1 - refLength;
    var dx  = X - P1;
    var i1 = u * dx + y1;
    var i2 = u * dx + y2;
    var i3 = u * dx + y3;


    // ... show incoming rays (upper/lower only - the central/nodal ray is
    // redundant once the region between them is shaded)
	  var p1 = paper.path( ["M", P1, y1,  "L", X, i1 ]);    // O -> upper P1
	  var p2 = paper.path( ["M", P1, y2,  "L", X, i2 ]);    // O -> lower P1
	  p1.attr(ret.F1);
	  p2.attr(ret.F2);
    this.cd_set.push(p1, p2);

    // EXPERIMENTAL: shade the incoming beam - it runs out towards infinity,
    // so fade it out towards that end rather than P1. The bounding rays
    // themselves fade the same way, rather than staying solid to their
    // (somewhat arbitrary) drawn endpoint.
    var incomingFadeFrom = [P1, (y1+y2)/2], incomingFadeTo = [X, (i1+i2)/2];
    shadeFadingBeamRegion(this.cd_set, [[P1,y1],[X,i1],[X,i2],[P1,y2]], incomingFadeFrom, incomingFadeTo);
    gripPairs.push({ a:[P1,y1,X,i1], b:[P1,y2,X,i2] });         // incoming edges
    fadeRayStroke(p1, incomingFadeFrom, incomingFadeTo);
    fadeRayStroke(p2, incomingFadeFrom, incomingFadeTo);

    // console.log("adding the image space construction");

    /* --------------------------------------------
       IMAGE SPACE RAYS 
      --------------------------------------------- */
    
    ret = getBeamImageStyle({ N1 : N1, N2: N2, 
                              P1 : P1, P2: P2,
                              F1 : F1, F2: F2,
                              T1 : T1,
                              X2 : X2, Y2: Y2 });

    var p4 = paper.path( ["M", P2, y1,  "L", X2, Y2 ]);    // Y1 -> I   (ray through F1)
    var p5 = paper.path( ["M", P2, y2,  "L", X2, Y2 ]);    // Y2 -> I   (ray through F1)


    //drawPoint(N1, 0, "magenta");

    p4.attr(ret.F1);
    p5.attr(ret.F2);

	  this.cd_set.push(p4, p5);

    // EXPERIMENTAL: this triangle is bounded (the beam genuinely converges to a
    // point here), so a plain solid fill is enough - no fade needed. Only do this
    // for a real image; for a virtual one, this segment is a dashed back-
    // projection construction line, not real light, so shading it would mislead.
    if (!ret.extend) {
      shadeBoundedBeamRegion(this.cd_set, [[P2,y1],[X2,Y2],[P2,y2]]);
    }
    gripPairs.push({ a:[P2,y1,X2,Y2], b:[P2,y2,X2,Y2] });          // converging towards the image


    /* --------------------------------------------
       BRIDGING RAYS OBJECT/IMAGE SPACE 
      --------------------------------------------- */
    

    // ADD P1 - P2 RAYS (upper/lower only - see the incoming-ray comment above)
    var p10 = paper.path( ["M", P1, y1,  "L", P2, y1 ]);   // O  -> P1   (ray through F1)
    var p11 = paper.path( ["M", P1, y2,  "L", P2, y2 ]);   // O  -> P1   (ray through F1)
    p10.attr(real);
    p11.attr(real);
    this.cd_set.push(p10, p11);

    // EXPERIMENTAL: the P1->P2 bridge is bounded (both ends are finite, real
    // points) same as the converging region, so a plain solid fill is enough here
    // too - this was the gap between P and P' that was left unshaded before.
    shadeBoundedBeamRegion(this.cd_set, [[P1,y1],[P2,y1],[P2,y2],[P1,y2]]);
    gripPairs.push({ a:[P1,y1,P2,y1], b:[P1,y2,P2,y2] });          // between the principal planes



    if (ret.extend) { // extended rays

      var X = P2 + refLength;
      var dx  = X - P2; // 1x refLength past the (virtual) image point

      var t1 = (Y2 - y1)/(X2 - P2);
      var t2 = (Y2 - y2)/(X2 - P2);
      var t3 = (Y2 - y3)/(X2 - P2);


      var i1  = t1 * dx + y1; // upper height on N1
      var i2  = t2 * dx - y2; // lower height on N1
      var i3  = t3 * dx + y3; // height from the N1 itself

      var p7 = paper.path( ["M", P2, y1,  "L", X, i1 ]);    // O  -> H1   (ray through F1)
      var p8 = paper.path( ["M", P2, y2,  "L", X, i2 ]);    // H1 -> N1   (ray through F1)

      p7.attr(ret.xF1);
      p8.attr(ret.xF2);

      this.cd_set.push(p7, p8);

      // EXPERIMENTAL: virtual image - these rays are real, diverging light that
      // never actually converges, running out towards infinity, so fade towards
      // that end, same as the incoming beam - and fade the bounding rays'
      // stroke the same way too, rather than leaving them solid.
      var virtFadeFrom = [P2, (y1+y2)/2], virtFadeTo = [X, (i1+i2)/2];
      shadeFadingBeamRegion(this.cd_set, [[P2,y1],[X,i1],[X,i2],[P2,y2]], virtFadeFrom, virtFadeTo);
      gripPairs.push({ a:[P2,y1,X,i1], b:[P2,y2,X,i2] });
      fadeRayStroke(p7, virtFadeFrom, virtFadeTo);
      fadeRayStroke(p8, virtFadeFrom, virtFadeTo);

    } else {

      // real image: these are still real, physical rays - they keep going (diverging
      // again) past where they cross at the cyan ball, rather than just stopping
      // there. Same construction as the extension above, just continued from the
      // crossing point onward instead of projected back from it.

      var X = X2 + refLength;
      var dx  = X - P2; // 1x refLength (measured from P2) past the image point

      var t1 = (Y2 - y1)/(X2 - P2);
      var t2 = (Y2 - y2)/(X2 - P2);
      var t3 = (Y2 - y3)/(X2 - P2);

      var i1  = t1 * dx + y1;
      var i2  = t2 * dx - y2;
      var i3  = t3 * dx + y3;

      var p7 = paper.path( ["M", X2, Y2,  "L", X, i1 ]);
      var p8 = paper.path( ["M", X2, Y2,  "L", X, i2 ]);

      p7.attr(real);
      p8.attr(real);

      this.cd_set.push(p7, p8);

      // EXPERIMENTAL: real image - these rays are diverging again past the
      // crossing point (the cyan ball), running out towards infinity, so fade
      // towards that end, starting opaque right at the crossing - and fade
      // the bounding rays' stroke the same way too.
      var realFadeFrom = [X2, Y2], realFadeTo = [X, (i1+i2)/2];
      shadeFadingBeamRegion(this.cd_set, [[X2,Y2],[X,i1],[X,i2]], realFadeFrom, realFadeTo);
      gripPairs.push({ a:[X2,Y2,X,i1], b:[X2,Y2,X,i2] });
      fadeRayStroke(p7, realFadeFrom, realFadeTo);
      fadeRayStroke(p8, realFadeFrom, realFadeTo);

    }

    this.cd_set.toFront();
    placeWidthGrip(this, gripPairs);

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

   function getBeamImageStyle(data) {

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



