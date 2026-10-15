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
  helpers snapDraggedX / clampFarObjectPair / updateInterface. They are the next things to pass in explicitly.

--------------------------------------------------------------------------------------------------------------- */

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
    if (point.type === "image") {
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

    updateInterface(point, pair);        // the table (and so the conjugate point)
    this.setPairData(pair);
    this.updateRays();
    this.draw();
  }

  // The conjugate pair for an object or image dragged to (x, y), in the laboratory frame.
  // calculateConjugatePairFrom wants an "object" z relative to the front vertex (which is at the origin, so x as it
  // stands) but an "image" z relative to the BACK vertex - without that offset the image jumps away from the pointer
  // by roughly the length of the system.
  conjugateFor (point, x, y, dot, total) {
    const z = (point.type === "image") ? (x - (total.Z + total.L)) : x;
    return Optics.calculateConjugatePairFrom({ id: point.id, which: point.type, z: z, h: y }, total);
  }
}
