/* ---------------------------------------------------------------------------------------------------------------

  Construction - what every construction on the bench has in common.

  A construction is the drawing of one object and its image: the rays, the shading, and the two points (the object
  and the image) that can be picked up and moved. The kinds of construction (a point source, a beam from infinity,
  ...) differ in how their rays are drawn; picking a point up and moving it is the same for all of them, so it is
  written once, here.

  A subclass makes its two points with makeHandle() and may override
    - conjugateFor(which, x, y, handle)  to decide what an object or image dragged to (x, y) means

  The handlers are closures over the construction (no lookup through the dragged point, no globals of their own).
  What is still read from the page: the scale (kx, ky), the grid step, the lens being drawn (renderableLens) and the
  helpers snapDraggedX and updatePointsTable. They are the next things to pass in explicitly.

--------------------------------------------------------------------------------------------------------------- */

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


class Construction {

  // A draggable point (type "object" or "image") at (x, y), in the colour given.
  makeHandle (x, y, colour, type) {

    const other = (type === "object") ? "image" : "object";
    const id    = this.data.id;
    const dot   = drawPoint(x, y, colour);

    dot.drag(
      (dx, dy) => this.dragMove(dot, dx, dy),
      ()       => this.dragStart(dot),
      ()       => this.dragEnd(dot));

    dot.attr({ cursor: "grab" });
    dot.id = "point-" + id + "-" + type;
    dot.data("data-attr", { "element_id"   : "point-" + id + "-" + type,
                            "conjugate_id" : "point-" + id + "-" + other,
                            "id"           : id,
                            "type"         : type,
                            "parent"       : this });

    RegisterWheelCallback({ type: "point", handle: dot });
    return dot;
  }

  dragStart (dot) {
    // where the point was when it was picked up
    dot.ox = dot.attr("cx");
    dot.oy = dot.attr("cy");
    dot.lastX = dot.ox;
    setGrabbingCursor(true);
  }

  dragEnd (dot) {
    setGrabbingCursor(false);
  }

  // dx, dy: how far the pointer has moved since the point was picked up, in pixels
  dragMove (dot, dx, dy) {

    this.inOwnLens(() => this.moveHandle(dot, dx, dy));
  }

  // Run fn as this construction: the object being dragged is the one in focus, and it is traced through the lens
  // at its own wavelength.
  inOwnLens (fn) {
    if (typeof setFocusedObject === "function") { setFocusedObject(this.getId()); }
    if (typeof withLensAt === "function") { withLensAt(this.WavelengthNm, fn, this, []); }
    else                                  { fn(); }
  }

  moveHandle (dot, dx, dy) {

    let x = dot.ox + kx * dx;
    let y = dot.oy + ky * dy;

    x = Math.round(x / gridSnapSize) * gridSnapSize;
    y = Math.round(y / gridSnapSize) * gridSnapSize;

    // held on V, V', F, F', P, P', N or N' as the drag reaches or passes it (Alt turns that off)
    x = snapDraggedX(dot, x);
    dot.attr({ cx: x, cy: y });

    const point = dot.data("data-attr");
    const total = renderableLens.total;

    let pair = this.conjugateFor(point, x, y, dot, total);

    // (an image dragged on to the back focal plane: the object is kept a large but finite distance away)
    if (point.type === "image" && this.clampsFarObject()) {
      // an object that is finite remembers which side of the lens it is on; held exactly on F' (where the sign of the
      // far distance is only rounding) it stays on that side, so it does not jump across to a virtual object
      if (isFinite(pair.X1) && Math.abs(pair.X1) < 1e4) { dot.nearSide = pair.X1 < 0 ? -1 : 1; }
      const clamped = clampFarObjectPair(point.id, pair, total, dot.farSide, dot.snappedTo === "F'" ? dot.nearSide : 0);
      if (clamped !== pair) {
        dot.farSide = isFinite(pair.X1) ? (pair.X1 < 0 ? -1 : 1) : dot.farSide;
        pair = clamped;
        dot.attr({ cx: pair.X2, cy: pair.Y2 });        // the image point sits where the (far) object really puts it
      }
    }

    updatePointsTable(point.id, pair);   // the table (and so the conjugate point)
    this.setPairData(pair);
    if (typeof this.updateRays === "function") { this.updateRays(); }
    this.draw();
  }

  // Whether an image dragged on to the back focal plane keeps its object a large but finite distance away (see
  // clampFarObjectPair). A construction that cannot draw an object that far off says no.
  clampsFarObject () { return true; }

  // The conjugate pair for an object or image dragged to (x, y), in the laboratory frame.
  // calculateConjugatePairFrom wants an "object" z relative to the front vertex (which is at the origin, so x as it
  // stands) but an "image" z relative to the BACK vertex - without that offset the image jumps away from the pointer
  // by roughly the length of the system.
  conjugateFor (point, x, y, dot, total) {
    const z = (point.type === "image") ? (x - (total.Z + total.L)) : x;
    return Optics.calculateConjugatePairFrom({ id: point.id, which: point.type, z: z, h: y }, total);
  }
}


/* ---------------------------------------------------------------------------------------------------------------

  BeamConstruction - a beam from infinity (the parallel-beam and the afocal constructions).

  Such a beam has no position, only an angle, and so only two ways of being moved:
    - the angle picker is turned (dragAngle)
    - its image point, on the back focal plane, is moved up or down (the height is turned back into the angle);
      moving it along the axis does nothing.
  A subclass that has to do more when the angle changes overrides beamAngleChanged().

--------------------------------------------------------------------------------------------------------------- */

class BeamConstruction extends Construction {

  // The image point is picked up at its present height; only the height is followed.
  dragStart (dot) {
    dot.oy = dot.attr("cy");
    setGrabbingCursor(true);
  }

  moveHandle (dot, dx, dy) {

    let y = dot.oy + ky * dy;
    y = Math.round(y / gridSnapSize) * gridSnapSize;

    const point = dot.data("data-attr");
    const total = renderableLens.total;

    // (An object that is a finite point stays a finite point: see clampFarObjectPair, PointSourceConstruction.js.)
    // Inverse of calculateConjugatePairFrom's IQ = zp * deg2rad(t) (paraxial, linear - not zp * tan(deg2rad(t))),
    // so recovering t from a dragged image height is a plain division, no atan() needed.
    // The height of the focus per radian is the anterior focal length n1/F (see calculateConjugatePairFrom in
    // optics.js); a mirror's negative index is no change to the size.
    const zp = Math.abs(total.n1) / total.F;
    const t  = rad2deg(y / zp);

    const request = { id: point.id, type: "beam", which: "object", t: t };
    const pair    = Optics.calculateConjugatePairFrom(request, total);
    updatePointsTable(request.id, pair);

    this.setPairData(pair);
    this.beamAngleChanged(pair);
    this.refresh();       // also re-anchors/re-angles the angle-picker handle, keeping it in sync with this drag
  }

  // The angle picker is turned to `th` (its own geometric angle, in degrees).
  dragAngle (th) {

    this.inOwnLens(() => {

      // the handle is drawn perpendicular to the ray (so it doesn't lie along the rays it controls): convert its own
      // geometric angle back to the ray angle. "th + 90" is the true geometric angle of the ray, not the paraxial
      // field angle T1 (the ray is drawn with the linear slope deg2rad(T1), whose true angle is atan(deg2rad(T1));
      // they coincide only for a small T1) - see fieldAngleToGeometricAngle / geometricAngleToFieldAngle.
      let geometricAngle = th + 90;

      // keep the GEOMETRIC angle away from +-90 (tan is infinite there); dragging the image point can only recover
      // an angle in that same range, since it inverts the image height by a plain division
      geometricAngle = Math.max(-89.9, Math.min(89.9, geometricAngle));
      let T1 = geometricAngleToFieldAngle(geometricAngle);

      // T1 = tan(geometricAngle) blows up long before that clamp is reached, and paraxial theory only describes
      // small angles anyway, so T1 is clamped too and the handle's angle re-derived from it: the handle "sticks"
      // once T1 saturates rather than rotating on past where T1 can follow.
      T1 = Math.max(-89.9, Math.min(89.9, T1));
      this.anglePicker.setAngle(fieldAngleToGeometricAngle(T1) - 90);

      // the graphic and the table
      const request = { id: this.getId(), type: "beam", which: "object", t: T1 };
      const pair    = Optics.calculateConjugatePairFrom(request, renderableLens.total);
      this.setPairData(pair);
      updatePointsTable(request.id, pair);
      this.beamAngleChanged(pair);

      this.remove();
      this.draw();
    });
  }

  // (called with the new pair data once the beam's angle has changed; the rays are redrawn afterwards)
  beamAngleChanged (pair) {}
}
