/**************************************************************************************************************
 *
 * OPTICS.JS
 *
 *************************************************************************************************************/

// import the JSON5
//const JSON5 = require('json5');
//var   fs = require('fs');


/* --------------------------------------------------------------------------
% 
% EXPORTED FUNCTIONS  
%
-------------------------------------------------------------------------------- */

//console.log("loaded ... optics.js");

var Optics = {};


Optics.analyze = function (lensTable) {

  // return a lensSystem
  return getTotalLensSystemInfo (lensTable); 
}

Optics.calculatePointToPoint = function (lensSystem, pointList) {
  return calculateFwdPointToPoint (lensSystem, pointList)
}


Optics.calculateConjugatePairFrom = function(point, systemInfo) {
  return calculateConjugatePairFrom (point, systemInfo)
}

Optics.analyzeSubSystem = function (lensTable) {
return getLensSystemInfo (lensTable);
}

Optics.calculateRayTrace = function(rays, systemInfo) {
  return calculateRayTrace (rays, systemInfo)
}

Optics.getPupils = function(rays, systemInfo) {
  return calculateRayTrace (rays, systemInfo)
}

Optics.findApertureStopForInfiniteObject = function (elemArr, stopIndex) {
  return findApertureStopForInfiniteObject (elemArr, stopIndex)
}

Optics.findApertureStopForFiniteObject = function (elemArr, objectZ, objectH, stopIndex) {
  return findApertureStopForFiniteObject (elemArr, objectZ, objectH, stopIndex)
}

Optics.computeVignettedEnvelope = function (elemArr, objectZ, objectH, requestedPlusAngle, requestedMinusAngle) {
  return computeVignettedEnvelope (elemArr, objectZ, objectH, requestedPlusAngle, requestedMinusAngle)
}

Optics.computeVignettedEnvelopeForBeam = function (elemArr, fieldAngleRad, requestedPlusHeight, requestedMinusHeight) {
  return computeVignettedEnvelopeForBeam (elemArr, fieldAngleRad, requestedPlusHeight, requestedMinusHeight)
}

Optics.extractGroup = function (lens, group_name) {

  // groups dont include the medium in which they are immersed
  // so we need to tack these on for a standalone gorup 
  var firstIndex = lens.findIndex(each => each.group === group_name);

  if (firstIndex == -1) {
    throw "Couldnt find that group"
  }

  var ret = [];
  ret.push(lens[firstIndex-1]);

  var lastIndex = firstIndex;
  while (lens[lastIndex].group === group_name & lastIndex < lens.length) {
    ret.push(lens[lastIndex]);
    lastIndex = lastIndex + 1;
  }
  ret.push(lens[lastIndex]);

  // result
  //console.log("result group.");  
  //console.log(ret);
  //console.log(lens.length);
  //console.log(lastIndex);
  return ret;
}



/* --------------------------------------------------------------------------
% 
% CONVERSION FUNCTIONS  
%
--------------------------------------------------------------------------------*/


function polar2cartesian (r, theta) {
        x = r * Math.cos(theta); let y = r * Math.sin(theta);
        return { x: x, y: y};
}

function deg2rad (theta) {
        theta = theta * Math.PI / 180;
        return theta;
}


function rad2deg (theta) {
        theta = theta * 180 / Math.PI;
        return theta;
}

/* -----------------------------------------------------------------------

A beam-from-infinity's field angle T1 is used PARAXIALLY everywhere in this
app (calculateConjugatePairFrom's IQ, calculateRayTrace/translateRays, the
Pin feature) - its direction is deg2rad(T1) used directly as a linear slope,
NOT Math.tan(deg2rad(T1)). But the draggable angle-picker HANDLE for a beam
is a real geometric widget (AnglePicker.setAngle uses actual polar-to-
cartesian trig), so a ray actually drawn with that linear slope has a TRUE
geometric angle of atan(deg2rad(T1)) degrees, not T1 itself - the two
coincide only for a small T1. These convert between the paraxial field angle
and the handle's own true geometric angle so the two stay exactly
perpendicular (or aligned, depending on the construction's own offset) at
any angle, not just a small one.

--------------------------------------------------------------------------- */

function fieldAngleToGeometricAngle (T1) {
  return rad2deg(Math.atan(deg2rad(T1)));
}

function geometricAngleToFieldAngle (geometricAngle) {
  return rad2deg(Math.tan(deg2rad(geometricAngle)));
}

/* -----------------------------------------------------------------------

SAFEPINNEDPUPILINFO  The Pin feature (aiming a construction's bounding rays
at the entrance pupil edge - see findApertureStopForInfiniteObject) has two
known singularities where it must NOT be trusted, or it silently produces
Infinity/NaN rays instead of a graceful fallback to the ordinary (unpinned)
construction:

  1. VE1 (the entrance pupil position) itself can come back non-finite.
     This is a REAL, physically-meaningful degeneracy, not a bug to work
     around: the entrance/exit pupil calculation is undefined when the
     aperture stop sits exactly at an image conjugate of the system (every
     ray from an axial object converges to the same height there regardless
     of its starting height, so there is no well-defined "image of the
     stop" to speak of at that specific plane).

  2. For a FINITE object (pass its axial position as objectZ), the ray-
     aiming formula itself (getBeam: slope = height/(VE1-objectZ)) divides
     by zero whenever the object happens to sit exactly at the entrance
     pupil - a second, independent singularity.

  pupilInfo  - the findApertureStopForInfiniteObject() result (or null)
  VE1        - renderableLens.total.pupil.VE1
  objectZ    - the object's own axial position; omit (or pass null) for a
               beam from infinity, which has no object position and so
               isn't subject to singularity 2 at all

Returns pupilInfo unchanged if it is safe to use, otherwise null - callers
should treat a null return exactly like "no aperture stop found anywhere".

--------------------------------------------------------------------------- */

function safePinnedPupilInfo (pupilInfo, VE1, objectZ) {
  if (!pupilInfo) { return null; }
  if (!isFinite(VE1)) { return null; }
  if (objectZ != null && Math.abs(VE1 - objectZ) <= 1e-9) { return null; }
  return pupilInfo;
}



//Function to assign the default values for the staircase parameters
function assignParameterValue(argument, defaultValue){
  return typeof argument !== 'undefined' ? argument : defaultValue;
}


function filterByGroup (lens, group_name) {



  return ret;
}



// Fill in a complete! [TEMPORARY]
function convertToLensTable (response) {

    var lens_table = [];
    for (var i = 0; i < response.length; i++ ) {

        var each_element = { id:          i+1,
                             tag_id:      assignParameterValue(response[i].id, ""),
                             group:       assignParameterValue(response[i].group, ""),                                         
                             type:        assignParameterValue(response[i].type, ""),
                             description: assignParameterValue(response[i].description, ""),
                             radius:      assignParameterValue(response[i].args.radius, NaN),
                             power:       assignParameterValue(response[i].args.power, NaN),                             
                             height:      assignParameterValue(response[i].args.height, NaN),
                             index:       assignParameterValue(response[i].args.index, NaN),
                             // optional (advanced materials mode - see materials.js): a medium or thin lens
                             // can name a material instead of relying on its fixed index
                             material:    assignParameterValue(response[i].args.material, ""),
                             thickness:   assignParameterValue(response[i].args.thickness, NaN),
                             // a dedicated "stop" element IS the stop by definition - no need
                             // to also set args.stop in the .lens file, though an explicit
                             // value (if ever given) still takes precedence
                             stop:        assignParameterValue(response[i].args.stop, response[i].type === "stop"),
                             aperture:    assignParameterValue(response[i].args.aperture, NaN),
                             base:        assignParameterValue(response[i].args.base, "up") };

        // a named material supplies the design (d line) index when the file did not give one
        if (each_element.type === "index" && each_element.material !== "" && isNaN(each_element.index) && typeof Materials !== "undefined") {
            var named = Materials.find(each_element.material);
            if (named) { each_element.index = named.nd; each_element.material = named.name; }
        }

        lens_table.push(each_element);        
    }

    // fill in missing information 
    for (var i = 1; i < response.length-1; i++ ) {

          prev = lens_table[i-1];
          curr = lens_table[i];
          next = lens_table[i+1];

          if (curr.type == "sphere") {

            console.log("AUTO-UPDATING");
            console.log(curr);

            if (isFinite(curr.radius) & isNaN(curr.power)) {
              lens_table[i].power = (next.index - prev.index)/curr.radius;
            }

          }



    }



    return lens_table;
};



/* --------------------------------------------------------------------------
% 
% UPDATED INFORMATION  
%
% Uses TEVOI
%
--------------------------------------------------------------------------------*/

identitySystem = { A: 1, B: 0, C: 0, D: 1 };


function inverseMatrix2x2(S) {
  det = 1/(S.A*S.D-S.B*S.C);
  return { A: det*S.D, B: -det*S.B, C: -det*S.C, D: det*S.A };

}

// construct a refraction matrix 
function refractionMatrix(n1, n2, F) {


      return { A: n1/n2, B:-F/n2, C:0, D:1 };
}

function translationMatrix(d) {

      return { A:1, B:0, C:d, D:1 };
}


function normalizedRefractionMatrix(S, n1, n2) {

  // convert from the 
  var A = n2/n1 * S.A;
  var B = n2 * S.B;
  var C = S.C/n1;
  var D = S.D;

  return { A1: A, B1: B, C1: C, D1: D }
}

function normalizedTranslationMatrix(S, n) {

  // convert from the 
  var A = S.A;
  var B = S.B;
  var C = S.C/n;
  var D = S.D;

  return { A1: A, B1: B, C1: C, D1: D }
}



// S1*S2 where S1 = [ A B ; C D ] or S2 = [ A B ; C D ]
function systemMultiply (S1, S2) {

  return {  A: S1.A*S2.A + S1.B*S2.C,
            B: S1.A*S2.B + S1.B*S2.D, 
            C: S1.C*S2.A + S1.D*S2.C,
            D: S1.C*S2.B + S1.D*S2.D }
};


// S1*S2 where S1 = [ A B ; C D ] or S2 = [ A B ; C D ]
function rayMultiply (S, r) {

  if (!Array.isArray(r)) {
    return { u: S.A*r.u + S.B*r.h, h: S.C*r.u + S.D*r.h };
  }

  var q = [];
  for (var i = 0; i < r.length ; i++) {
    q.push({ u: S.A*r[i].u + S.B*r[i].h, h: S.C*r[i].u + S.D*r[i].h });
  }

  return q
};


/* -----------------------------------------------------------------------

RAYBUNDLE Determine conjugate information for a point 

--------------------------------------------------------------------------- */
 

function translateRays(rays, Z) {

  for (var i=0; i < rays.length; i++) {
    dZ         = Z - rays[i].z;
    rays[i].h  = rays[i].h  + rays[i].u*dZ; 
    rays[i].z  = Z;
  }

  return rays;
}


/* -----------------------------------------------------------------------

RAYBUNDLE Determine conjugate information for a point 

  points are specified relative to the vertices of the system 

  - elements : need to be zero thickness 
  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */


function calculateRayTrace(rays, lensTable ) {

  ////console.log("calculate RyaTrce");
  ////console.log(lensTable);  
  // create the total system


  var Z = 0; ret = [];

  //console.log("Calculate RayTrace");
  //console.log("START PROCESSING");
  // create the system matrix
  // for (var i=lensTable.length-1; i >=0; i--) {
  // create the total system 
  // eachElementInfo = getLensElementInfo(lensTable, i);

    for (var i=0; i < lensTable.length; i++) {

          each    = lensTable[i];
          Z       = Z + each.L;

          //console.log("Lens");
          //console.log(each);
          //console.log("Input Rays");
          //console.log(rays);

          newrays = rayMultiply(each.S, rays);
          for (var j = 0; j < newrays.length; j++) {
              newrays[j].z = Z;
              // a prism element carries an additive angular deviation
              // (constant regardless of ray height) alongside its (identity)
              // matrix - see getLensElementInfo's "prism" case
              if (each.offset) {
                newrays[j].u += each.offset.u;
                newrays[j].h += each.offset.h;
              }
          }

          //console.log("Output Rays");
          //console.log(newrays);


          ////console.log("system information");
          ////console.log(each);
          ////console.log(Z);

          ret.push(newrays);
          rays = newrays;        // update rays
  }


  return ret
}


/* -----------------------------------------------------------------------

LIMITINGAPERTUREFROMTRACES  Given two already-traced sample rays that differ
by exactly 1 in some free launch parameter (an angle, or a starting height -
see findApertureStopForInfiniteObject below), find which element in the
system actually limits the bundle ("the aperture stop") and the value of
that parameter which just grazes its edge.

A prism (or any offset-carrying element) deviates a ray by a CONSTANT amount
independent of the free parameter, so a ray's height at a given element is an
AFFINE function of it - h(p) = h0 + slope*p - not a purely proportional one
through the origin. h0 (the p=0 trace) is that constant-offset contribution
alone; slope = h(1) - h0 is the ordinary (linear/matrix) part. Two sample
rays are enough to solve h(p) = +-aperture/2 for p exactly, for each
candidate aperture; whichever element requires the SMALLEST |p| to reach
either edge is the one that actually limits the bundle (a smaller allowed
value = a more restrictive aperture). Works whether or not any element is
explicitly flagged "stop" - that flag is only a hint for other pupil
bookkeeping elsewhere; the true stop is whichever real aperture is most
restrictive, found here directly.

Returns null if no element in the system has a finite "aperture" at all -
there is nothing to pin the rays to.

An optional trailing onlyIndex restricts the search to that one element -
used by the Pin feature to pin against the system's single DESIGNATED
aperture stop (renderableLens.total.stopIndex) only, deliberately ignoring
whether some other element would be more restrictive for a given ray (real
vignetting by a non-stop element - a separate, not-yet-built feature).
Omit it to search every element and find whichever is truly tightest - used
at lens-load time to auto-determine the stop when none is explicitly
flagged (see the "AUTOMATIC APERTURE STOP" block in getTotalLensSystemInfo).

--------------------------------------------------------------------------- */

function limitingApertureFromTraces (elemArr, tracedZero, tracedOne, onlyIndex) {

  var best = null;
  var indices = (onlyIndex != null) ? [onlyIndex] : elemArr.map(function (_, i) { return i; });

  for (var k = 0; k < indices.length; k++) {

    var i = indices[k];
    var aperture = elemArr[i].elem.aperture;
    if (!isFinite(aperture) || aperture <= 0) { continue; }

    var h0    = tracedZero[i][0].h;
    var slope = tracedOne[i][0].h - h0;
    if (Math.abs(slope) < 1e-12) { continue; } // this element doesn't constrain a ray launched from here

    var uPlus  = ( aperture/2 - h0) / slope;
    var uMinus = (-aperture/2 - h0) / slope;
    var candidateAngle = Math.min(Math.abs(uPlus), Math.abs(uMinus));

    if (best === null || candidateAngle < best.angle) {
      best = { angle: candidateAngle, index: i, id: elemArr[i].elem.tag_id, description: elemArr[i].elem.description };
    }

  }

  return best;

}

/* -----------------------------------------------------------------------

LIMITINGAPERTUREFORSIGNEDDIRECTION  The per-direction counterpart of
limitingApertureFromTraces, needed for an OFF-AXIS finite object. That
function's uPlus/uMinus are the u values where ONE ray family (parametrised
by u alone) reaches the +aperture/2 and -aperture/2 edges of a given
element; taking whichever needs less |u| and applying that SAME magnitude
symmetrically in both +u and -u directions is only valid when the object is
on-axis (h0=0), where uPlus and -uMinus are mirror images anyway. Off-axis,
the two edges are generally reached at different |u| - the edge with the
SMALLER |u| in each direction is the one actually constraining a ray
sweeping that way (the other is never reached first), and different
elements can be the limiting one on each side (asymmetric vignetting). This
finds the limiting element independently for ONE signed sweep direction, so
the caller can do it twice (once for sign=+1, once for sign=-1) and get two
genuinely different marginal rays instead of one mirrored pair.

An optional trailing onlyIndex restricts the search to that one element
instead of scanning the whole system - see limitingApertureFromTraces.

--------------------------------------------------------------------------- */

function limitingApertureForSignedDirection (elemArr, tracedZero, tracedOne, sign, onlyIndex) {

  var best = null;
  var indices = (onlyIndex != null) ? [onlyIndex] : elemArr.map(function (_, i) { return i; });

  for (var k = 0; k < indices.length; k++) {

    var i = indices[k];
    var aperture = elemArr[i].elem.aperture;
    if (!isFinite(aperture) || aperture <= 0) { continue; }

    var half  = aperture / 2;
    var h0    = tracedZero[i][0].h;
    var slope = tracedOne[i][0].h - h0;

    // The object's own baseline ray (u=0, the chief ray in this family)
    // already misses this element's clear aperture outright - no additional
    // angle in EITHER direction helps (that only ever makes it more
    // vignetted, or - past some larger |u| - re-enters on the far side,
    // which is not a meaningful "marginal ray" for this object). This
    // element already blocks the object regardless of angle, so it is the
    // tightest possible constraint (0) on both directions; nothing else can
    // beat it, so it is safe to stop looking.
    if (Math.abs(h0) > half) {
      return { angle: 0, index: i, id: elemArr[i].elem.tag_id, description: elemArr[i].elem.description };
    }

    if (Math.abs(slope) < 1e-12) { continue; } // this element doesn't constrain a ray launched from here

    // Walking u away from 0 in direction `sign`, height moves as sign*slope
    // per unit |u| - whichever edge lies in that direction of travel is the
    // one this element can actually constrain on this side.
    var edgeHeight = (sign * slope > 0) ? half : -half;
    var u = (edgeHeight - h0) / slope;
    if (sign * u <= 1e-12) { continue; } // edge is behind this direction (or already at/past it at u=0)

    var candidateAngle = Math.abs(u); // magnitude only - caller already knows the sign from `sign`
    if (best === null || candidateAngle < best.angle) {
      best = { angle: candidateAngle, index: i, id: elemArr[i].elem.tag_id, description: elemArr[i].elem.description };
    }

  }

  return best;

}

/* -----------------------------------------------------------------------

FINDAPERTURESTOPFORINFINITEOBJECT  Find which element in the system actually
limits the bundle of rays ("the aperture stop"), and the system's entrance
pupil radius, WITHOUT reference to any particular object point.

There is no real object position to launch a ray from here, so this traces
the marginal ray of an axial pencil from an object AT INFINITY instead: a ray
parallel to the axis (u=0) sampled at two heights (0 and 1). Free space
doesn't change the height of a u=0 ray, so the starting z is arbitrary - this
also sidesteps the degenerate case where a real object position happens to
coincide exactly with the very first element (z=0), which would otherwise
make both sample rays trace identical, zero-height paths and hide any
element positioned right at the front vertex. A prism's constant angular
offset makes height an AFFINE function of the starting height, not purely
proportional - h(h_in) = h0 + slope*h_in - so two samples are used to solve
it exactly (see limitingApertureFromTraces).

Because the free parameter here is a STARTING HEIGHT (not an angle), the
returned .angle field is actually the ENTRANCE PUPIL RADIUS: the height, at
ANY u=0 reference plane - translateRays leaves a u=0 ray's height unchanged
wherever you put it, so this is equally valid read at VE1 as at Z=0 - that a
ray needs in order to just graze the real, physical aperture stop. This is
what PointSourceConstruction.js's Pin feature uses to build entrance-pupil-
aimed rays (getBeam(VE1, VO, Y1, ±radius)): object-position-independent and
always well-behaved, unlike aiming a ray directly at the real stop from each
object position separately would be (that requires solving a different,
sometimes ill-conditioned equation per object position).

--------------------------------------------------------------------------- */

function findApertureStopForInfiniteObject (elemArr, stopIndex) {

  var tracedZero = calculateRayTrace([ { u: 0, h: 0, z: 0 } ], elemArr);
  var tracedOne  = calculateRayTrace([ { u: 0, h: 1, z: 0 } ], elemArr);

  return limitingApertureFromTraces(elemArr, tracedZero, tracedOne, stopIndex);

}

/* -----------------------------------------------------------------------

FINDAPERTURESTOPFORFINITEOBJECT  The per-object counterpart of
findApertureStopForInfiniteObject, used as a FALLBACK for a finite object
(PointSourceConstruction) specifically - not for a beam from infinity, which
has no real object position to trace from and, more importantly, would
reopen the handle-vs-ray angle correlation problem this whole per-object
approach was originally dropped for (see the entrance-pupil pivot commits).
A finite object has no angle-picker handle at all (it is dragged by
position), so that concern does not apply here.

The entrance pupil itself (findApertureStopForInfiniteObject) is an
object-INDEPENDENT system property - it is always computed via an axial
pencil from infinity, varying STARTING HEIGHT at u=0 - so it is exactly as
degenerate for a finite object as for an infinite one whenever the stop
sits at an image conjugate of THAT axial-infinity pencil (e.g. a stop at a
preceding element's own back focal point). But a finite, off-axis-launched
object's rays reach that same plane by varying ANGLE (not starting height)
at its own fixed launch height, and - unless the object happens to sit at
the front focal point of the elements before the stop, making its own
image fall there too - that is a genuinely different, non-degenerate
sensitivity. So this can still find a valid pin angle in exactly the cases
where the object-independent method cannot.

  elemArr  - the enriched per-element array (e.g. renderableLens.elem)
  objectZ  - the object's axial position (relative to the front vertex, V1=0)
  objectH  - the object's height (0 for an on-axis point)

--------------------------------------------------------------------------- */

function findApertureStopForFiniteObject (elemArr, objectZ, objectH, stopIndex) {

  var h0start = objectH || 0;

  // calculateRayTrace's per-element S matrices are all relative to the
  // front vertex (Z=0) - it does not itself propagate an incoming ray from
  // wherever its own "z" happens to be, so a ray actually launched from the
  // object (objectZ, h0start) has to be rebased to the front vertex first
  // (see translateRays), exactly as the ordinary beam-construction code
  // already does before its own calculateRayTrace calls.
  var rayZero = translateRays([ { u: 0, h: h0start, z: objectZ } ], 0);
  var rayOne  = translateRays([ { u: 1, h: h0start, z: objectZ } ], 0);

  var tracedZero = calculateRayTrace(rayZero, elemArr);
  var tracedOne  = calculateRayTrace(rayOne, elemArr);

  // An off-axis object (h0start != 0) can be vignetted asymmetrically - the
  // element (and angle) limiting the +u marginal ray need not be the same
  // as the one limiting -u (see limitingApertureForSignedDirection). Find
  // each side independently rather than mirroring one shared magnitude.
  return {
    plus:  limitingApertureForSignedDirection(elemArr, tracedZero, tracedOne, +1, stopIndex),
    minus: limitingApertureForSignedDirection(elemArr, tracedZero, tracedOne, -1, stopIndex)
  };

}

/* -----------------------------------------------------------------------

COMPUTEVIGNETTEDENVELOPE  The true, physical shape of a finite object's
transmitted beam through every aperture in the system - not just whichever
one is tightest overall (that is what findApertureStopForFiniteObject
already gives, as a single shared angle). A real beam can be clipped by one
element, travel on clipped, and then be clipped FURTHER by a later, tighter
element - it never "reopens" past a point where it was already cut down, so
vignetting can only ever make the beam THINNER along its length, never
wider again.

requestedPlusAngle/requestedMinusAngle are the USER'S OWN chosen beam
width, expressed as the +u/-u angles it corresponds to (see getBeam in
PointSourceConstruction.js) - VIG is a fixed INPUT beam that then shows
where it gets clipped, not an automatically-computed "just touches
something" angle the way PIN is.

This walks the element list SEQUENTIALLY, tracking one "active" ray per
side (starting as the user's own requested ray). At each aperture-bearing
element, it checks whether the CURRENT active ray already clears that
element; if it does not, the active ray SWITCHES to a freshly computed ray
(from the same fixed object launch point) that just grazes that element's
edge - the same per-element marginal ray limitingApertureForSignedDirection
computes for a single element - and stays switched from then on, unless an
even tighter element is hit later. Deliberately sequential rather than
"take the tightest of every candidate's independent trajectory at every
point" - that batch approach could spuriously let an earlier, already-
superseded candidate win again later purely because its own unrelated
trajectory happened to cross back under a currently-active tighter one,
which would incorrectly show the beam widening back out.

This is an approximation where the active ray's height crosses an
aperture's edge WITHIN a segment (not exactly at an element boundary) - the
true envelope would kink exactly at that crossing, but this only checks at
each element boundary. Close enough for a teaching diagram; exact would
need solving the crossing point within the segment.

Returns null if there is nothing to build an envelope from at all (no
requested angle given for either side).

--------------------------------------------------------------------------- */

function computeVignettedEnvelope (elemArr, objectZ, objectH, requestedPlusAngle, requestedMinusAngle) {

  var h0start = objectH || 0;

  if (!isFinite(requestedPlusAngle) && !isFinite(requestedMinusAngle)) { return null; }

  var rayZero    = translateRays([ { u: 0, h: h0start, z: objectZ } ], 0);
  var rayOne     = translateRays([ { u: 1, h: h0start, z: objectZ } ], 0);
  var tracedZero = calculateRayTrace(rayZero, elemArr);
  var tracedOne  = calculateRayTrace(rayOne, elemArr);

  function traceFrom (angle) {
    return calculateRayTrace(translateRays([ { u: angle, h: h0start, z: objectZ } ], 0), elemArr).map(function (p) { return p[0]; });
  }

  // Both sides are walked TOGETHER, element by element, rather than as two
  // independent passes - detecting "this aperture blocks the beam outright"
  // needs to know, at the SAME element, whether a clip was actually forced
  // there. A crossed envelope (plus <= minus) is not by itself a sign of
  // blockage - a real image forms exactly where the two marginal rays
  // legitimately cross and swap sides, which is normal, healthy optics, and
  // can coincidentally land at or near any element's position, aperture or
  // not. It only means "this aperture's opening does not overlap the beam
  // at all" when the crossing happens BECAUSE clipping was just forced on
  // one or both sides AT that same aperture-bearing element.
  var plusActive  = isFinite(requestedPlusAngle)  ? traceFrom(requestedPlusAngle)  : null;
  var minusActive = isFinite(requestedMinusAngle) ? traceFrom(requestedMinusAngle) : null;

  var plusEnvelope   = plusActive  ? [] : null;
  var minusEnvelope  = minusActive ? [] : null;
  var blockedAtIndex = null;

  for (var k = 0; k < elemArr.length; k++) {

    var aperture = elemArr[k].elem.aperture;

    if (isFinite(aperture) && aperture > 0) {

      var half     = aperture / 2;
      var h0       = tracedZero[k][0].h;
      var slope    = tracedOne[k][0].h - h0;

      // Genuine non-overlap: BOTH sides' CURRENT (pre-clip) heights sit on
      // the same side of this aperture's opening, entirely past +half or
      // entirely past -half - no ray in between could pass either,
      // regardless of how each side got here (independent clips at earlier
      // elements, or just natural propagation). Checking this from the
      // pre-clip values, rather than comparing plus<=minus AFTER
      // independently re-solving each side, avoids a false positive: each
      // side clipping to ITS OWN needed edge can leave "plus" numerically
      // below "minus" while a real, non-zero transmitted width still
      // exists between them (the labels just end up swapped, not the
      // beam being gone) - that is not blockage, and must not be reported
      // as such.
      if (plusActive && minusActive && blockedAtIndex === null) {
        var pPre = plusActive[k].h, mPre = minusActive[k].h;
        if ((pPre > half && mPre > half) || (pPre < -half && mPre < -half)) {
          blockedAtIndex = k;
        }
      }

      // Checking each side only against its OWN nominal edge is not enough
      // - a system that inverts the image (this telescope does) can legally
      // carry a ray to the opposite-sign height partway through, so it can
      // violate the OTHER edge without ever exceeding its own. Check the
      // actual magnitude, and re-solve directly for whichever edge (by the
      // ray's CURRENT sign, not its family's original sign) it needs.
      if (plusActive && Math.abs(plusActive[k].h) > half && Math.abs(slope) > 1e-12) {
        var targetEdgeP = (plusActive[k].h >= 0) ? half : -half;
        plusActive = traceFrom((targetEdgeP - h0) / slope);
      }

      if (minusActive && Math.abs(minusActive[k].h) > half && Math.abs(slope) > 1e-12) {
        var targetEdgeM = (minusActive[k].h >= 0) ? half : -half;
        minusActive = traceFrom((targetEdgeM - h0) / slope);
      }

    }

    if (plusEnvelope)  { plusEnvelope.push(plusActive[k]); }
    if (minusEnvelope) { minusEnvelope.push(minusActive[k]); }

  }

  return { plus: plusEnvelope, minus: minusEnvelope, blockedAtIndex: blockedAtIndex };

}

/* -----------------------------------------------------------------------

COMPUTEVIGNETTEDENVELOPEFORBEAM  The beam-from-infinity counterpart of
computeVignettedEnvelope, for AfocalBeamConstruction's VIG mode. A finite
object's rays share a fixed LAUNCH POINT and vary by ANGLE; a beam from
infinity has no launch point at all - its rays are already parallel (a
fixed angle, the field angle), and vary instead by STARTING HEIGHT at the
front vertex (z=0). Same sequential, never-reopens clipping logic and the
same "only genuinely blocked when a clip was actually forced at that
element" check, just re-solving for a height (holding the field angle
fixed) at each aperture instead of an angle (holding the launch height
fixed).

fieldAngleRad is the beam's fixed paraxial slope (radians - see setInputRays
in AfocalBeamConstruction.js). requestedPlusHeight/requestedMinusHeight are
the user's own top/bottom ray heights AT z=0 (not a half-width - already
resolved around whatever pivot the caller drew the un-vignetted beam
through).

--------------------------------------------------------------------------- */

function computeVignettedEnvelopeForBeam (elemArr, fieldAngleRad, requestedPlusHeight, requestedMinusHeight) {

  if (!isFinite(requestedPlusHeight) && !isFinite(requestedMinusHeight)) { return null; }

  var tracedZero = calculateRayTrace([ { u: fieldAngleRad, h: 0, z: 0 } ], elemArr);
  var tracedOne  = calculateRayTrace([ { u: fieldAngleRad, h: 1, z: 0 } ], elemArr);

  function traceFrom (height) {
    return calculateRayTrace([ { u: fieldAngleRad, h: height, z: 0 } ], elemArr).map(function (p) { return p[0]; });
  }

  var plusActive  = isFinite(requestedPlusHeight)  ? traceFrom(requestedPlusHeight)  : null;
  var minusActive = isFinite(requestedMinusHeight) ? traceFrom(requestedMinusHeight) : null;

  var plusEnvelope   = plusActive  ? [] : null;
  var minusEnvelope  = minusActive ? [] : null;
  var blockedAtIndex = null;

  for (var k = 0; k < elemArr.length; k++) {

    var aperture = elemArr[k].elem.aperture;

    if (isFinite(aperture) && aperture > 0) {

      var half        = aperture / 2;
      var h0           = tracedZero[k][0].h;
      var slope        = tracedOne[k][0].h - h0;

      // Genuine non-overlap only - see the matching comment in
      // computeVignettedEnvelope. Checked from the PRE-clip values so an
      // independent clip on each side (which can leave "plus" numerically
      // below "minus" while a real, non-zero width still exists between
      // them) is never mistaken for the beam having no room left at all.
      if (plusActive && minusActive && blockedAtIndex === null) {
        var pPre = plusActive[k].h, mPre = minusActive[k].h;
        if ((pPre > half && mPre > half) || (pPre < -half && mPre < -half)) {
          blockedAtIndex = k;
        }
      }

      if (plusActive && Math.abs(plusActive[k].h) > half && Math.abs(slope) > 1e-12) {
        var targetEdgeP = (plusActive[k].h >= 0) ? half : -half;
        plusActive = traceFrom((targetEdgeP - h0) / slope);
      }

      if (minusActive && Math.abs(minusActive[k].h) > half && Math.abs(slope) > 1e-12) {
        var targetEdgeM = (minusActive[k].h >= 0) ? half : -half;
        minusActive = traceFrom((targetEdgeM - h0) / slope);
      }

    }

    if (plusEnvelope)  { plusEnvelope.push(plusActive[k]); }
    if (minusEnvelope) { minusEnvelope.push(minusActive[k]); }

  }

  return { plus: plusEnvelope, minus: minusEnvelope, blockedAtIndex: blockedAtIndex };

}



/* -----------------------------------------------------------------------

CALCULATECONJUGATEPAIRFROM Determine conjugate information for a point

  points are specified relative to the vertices of the system 

  - elements : need to be zero thickness 
  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */


function calculateConjugatePairFrom(point, systemInfo) {

          var curr   = systemInfo;   // current element 
          var S      = curr.S;     // system matrix
          var V1     = curr.Z;     // front vertex (from the first element)                       
          var L      = curr.L;     // length of system (curr. system)
          var V2     = V1 + L;
          var n1     = curr.n1;    // object ref. index                       
          var n2     = curr.n2;    // image ref. index 


         switch (point.which) {

            case "object":

              console.log ("Calculating Image Information from Object Information");

              // axial ray gives axial image point 
              //var id  = point.id;
              var ZO  = point.z; 
              var Y1  = point.h;    
              var T1  = point.t;

              // results are relative to back vertex
              result    = calculatePairFromObject ({ z: ZO, h: Y1, t: T1 }, systemInfo); // distances assumed from vertices 

              // fill in information if the image is infinite 
              if (!isFinite(result.IQ) & !isFinite(result.OQ)) {
                    result.T2 = calculateExitAngle(T1, systemInfo);
              }


              // add in global co-ordinates 
              result.id = point.id;
              result.X1 = ZO;       // by definition this is X1-V1 because V1 = 0 always 
              result.Y1 = Y1;
              result.X2 = V2 + result.VI; 
              result.Y2 = result.IQ;

              //console.log ("CONJUGATE PAIR OUTPUT");
              //console.log (result);
              //console.log (curr);

              return result;

            break;

            case "image":

              console.log ("Calculating Object Information from Image Information");
              
              // console.log (point);


              // axial ray gives axial image point 
              //var id  = point.id;
              var ZI  = point.z; 
              var Y2  = point.h;
              var T2  = point.t;

              // results are relative to back vertex
              result    = calculatePairFromImage ({ z: ZI, h: Y2, t: T2}, systemInfo); // distances assumed from vertices 

              // add in global co-ordiates 
              result.id = point.id;
              result.X2 = V2 + ZI; 
              result.Y2 = Y2;
              result.X1 = V1 + result.VO;
              result.Y1 = result.OQ;

              console.log (result);

              return result;

            break;

            default:
            //console.log("point ID error!");
            //console.log(point);
            throw "The point was not an object or an image."

          }

}




/* -----------------------------------------------------------------------

CALCULATEEXITANGLE Determine the exit angle of the ray from the system 

  points are specified relative to the vertices of the system 

  - elements : need to be zero thickness 
  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */

function calculateExitAngle(T1, systemInfo) {

  // aim a ray at the axis of the lens 

  outray = rayMultiply(systemInfo.S, { u: deg2rad(T1), h: 0})
  return rad2deg(outray.u);
}



/* -----------------------------------------------------------------------

CALCULATEPAIRFROMOBJECT Determine the conjugates from the object point 

  points are specified relative to the vertices of the system 

  - elements : need to be zero thickness 
  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */

function calculatePairFromObject (object, systemInfo) {


          var z = object.z;
          var h = object.h;
          var t = object.t;


          var curr   = systemInfo;   // current element 
          var S      = curr.S;     // system matrix
          var V1     = curr.Z;     // front vertex (from the first element)                       
          var L      = curr.L;     // length of system (curr. system)
          var n1     = curr.n1;    // object ref. index                       
          var n2     = curr.n2;    // image ref. index 


          if (isFinite(z)) { // finite object distance 
                  
              var ir  = { h: -1*z, u: 1 };     // ray @ front vertex 
              var q   = rayMultiply(S, ir);    // ray @ back vertex          
              var zd  = -q.h/q.u;              // distance from back vertex  

              if (isFinite(zd)) { // => finite image distance 

                  var mag = (n1*ir.u)/(n2*q.u); // magnification

                  // A prism's constant angular deviation doesn't affect where the
                  // image forms (zd) or the magnification - both come from the
                  // system's linear part (S) alone, untouched above - but it does
                  // add a constant lateral shift to the image height, growing with
                  // distance from the prism: offset.h (always 0 for a prism, see
                  // getLensElementInfo) plus offset.u times the distance to the
                  // image plane (zd).
                  var prismOffset  = curr.offset || { u: 0, h: 0 };
                  var prismShiftIQ = prismOffset.h + zd*prismOffset.u;

                  result = {  id  : undefined,
                              VO  : z,
                              PO  : -curr.cardinal.VP1 + z,
                              OQ  : h,
                              VI  : zd,
                              PI  : -curr.cardinal.VP2 + zd,
                              IQ  : mag*h + prismShiftIQ,
                              M   : mag,
                              T1  : undefined,
                              T2  : undefined }; //

              } else { // => infinite image distance 

                  result = {  id  : undefined,     
                              VO  : z,
                              PO  : -curr.cardinal.VP1 + z, 
                              OQ  : h,
                              VI  : Infinity, // sign
                              PI  : Infinity, 
                              IQ  : Infinity, 
                              M   : undefined,
                              T1  : undefined,
                              T2  : rad2deg(q.u),
                              TH  : h/n1 * curr.F,                              
                               }; // w.r.t. PF1 and PF2 

                      //throw "infinite image distance detected";              
              }


         } else { 


           //console.log (` - Object at Infinity (Angle = ${t})`);

           zp  = +n2/curr.F;  // PF

           // same prism correction as the finite-object branch above, using
           // VF2 (the image plane here) in place of zd
           var prismOffsetInf  = curr.offset || { u: 0, h: 0 };
           var prismShiftIQInf = prismOffsetInf.h + curr.cardinal.VF2*prismOffsetInf.u;

            // infinite object => finite image
           result = {  id  : undefined,
                       VO  : z,
                       PO  : -curr.cardinal.VP1 + z,
                       OQ  : undefined,
                       VI  : curr.cardinal.VF2,
                       PI  : curr.cardinal.PF2,
                       // Paraxial: the image height off an object at infinity is
                       // f * angle, with angle taken directly in radians (matching
                       // the (u,h) convention calculateRayTrace/translateRays use
                       // everywhere else) - NOT f * tan(angle), which is the exact
                       // (non-paraxial) relationship and diverges from this one
                       // increasingly as the field angle grows.
                       IQ  : zp * deg2rad(t) + prismShiftIQInf,
                       M   : undefined,
                       T1  : t,
                       T2  : undefined }; //

        }

  // information result 
  return result;
}




/* -----------------------------------------------------------------------

CALCULATEPAIRFROMIMAGE  Determine the conjugates from the image point 

  points are specified relative to the vertices of the system 

  - elements : need to be zero thickness 
  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */

function calculatePairFromImage (image, systemInfo) {


          var zd = image.z;         
          var hd = image.h;
          var td = image.t;

          var curr   = systemInfo;  // current element 
          var S      = curr.invS;   // inverse system matrix
          var V1     = curr.Z;      // front vertex (from the first element)                       
          var L      = curr.L;      // length of system (curr. system)
          var n1     = curr.n1;     // object ref. index                       
          var n2     = curr.n2;     // image ref. index 


          if (isFinite(zd)) { // finite image distance  
                  
              var ir  = { h: -1*zd, u: 1 };    // ray @ back vertex 
              var q   = rayMultiply(S, ir);    // ray @ back vertex          
              var zl  = -q.h/q.u;              // distance from back vertex  

              if (isFinite(zl)) { // => finite object distance 

                  var mag = (n1*q.u)/(n2*ir.u); // magnification

                  // mirror of calculatePairFromObject's prism-shift correction:
                  // there, IQ = mag*OQ + prismShiftIQ; here hd (=IQ) is given
                  // and OQ is being solved for, so invert that relation
                  var prismOffset  = curr.offset || { u: 0, h: 0 };
                  var prismShiftIQ = prismOffset.h + zd*prismOffset.u;

                  result = {  id  : undefined,
                              VO  : zl,
                              PO  : -curr.cardinal.VP1 + zl,
                              OQ  : (hd - prismShiftIQ)/mag,
                              VI  : zd,
                              PI  : -curr.cardinal.VP2 + zd, 
                              IQ  : hd,
                              M   : mag,
                              T1  : undefined,
                              T2  : undefined }; //

              } else { // finite image => infinite object 

                  result = {  id  : undefined,     
                              VO  : -Infinity,
                              PO  : -Infinity, 
                              OQ  : undefined,
                              VI  : zd, // sign
                              PI  : -curr.cardinal.VP2 + zd, 
                              IQ  : hd, 
                              M   : undefined,
                              T1  : td,
                              T2  : undefined,
                              TH  : hd/n1 * curr.F,
                               }; // w.r.t. PF1 and PF2

                      // throw "infinite image distance detected";              
              }


         } else { 

           zp = -n1/curr.F;  // PF 

            // infinite image => finite object
           result = {  id  : undefined,     
                       VO  : curr.cardinal.VP1 + zp,
                       PO  : zp, 
                       OQ  : undefined,
                       VI  : +Infinity,
                       PI  : +Infinity, 
                       IQ  : +Infinity,
                       M   : undefined,
                       T1  : undefined,
                       T2  : td }; //

        }

  // information result 
  return result;
}



function calculateFwdPointToPoint(systemInfo, pointList) {

      total = [];

     
      var V1 = systemInfo.Z; // need to both be w.r.t. lab FoR
      var V2 = systemInfo.L; 


      // refractive indices 
      for (var j = 0; j < pointList.length ;  j++ ) {

          

          switch (pointList[j].which) {

            case "object":

              // axial ray gives axial image point 
              var id  = pointList[j].id;
              var X1  = pointList[j].zo; // relative to global system  (0,0)          
              var Y1  = pointList[j].ho; // relative to front vertex (0,0)          

              // results are relative to back vertex
              result    = calculatePairFromObject (X1-V1, Y1, systemInfo);

              // add in global co-ordiates 
              result.X1 = X1; result.Y1 = Y1;
              result.X2 = V1 + V2 + result.VI;
              result.Y2 = result.IQ;

            break;

            case "image":

              // axial ray gives axial image point 
              var id  = pointList[j].id;
              var X2  = pointList[j].zi; // <--- really should be X1, Y1          
              var Y2  = pointList[j].hi; // relative to front vertex (0,0)          

              // results are relative to back vertex
              result    = calculatePairFromImage (X2-V2, Y2, systemInfo);

              // add in global co-ordiates 
              result.X2 = X2; result.Y2 = Y2;
              result.X1 = V1 + result.VO;
              result.Y1 = result.OQ;

            break;

            default:
            throw "unknown error"

          }

          result.id = id; 
          total.push(result);


      }
  return total;
}



/* -----------------------------------------------------------------------

CALCULATEPOINTOTPOINT Elementwise point-to-point calcuulation (DEPRECATED)

  points are specified relative to the origin of the coorinate system

  - elements : need to be zero thickness 

  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */


function calculateElementPointToPoint(systemInfo, pointList) {

      total = [];

      // refractive indices 
      for (var j = 0; j < pointList.length ;  j++ ) {

          // axial ray gives axial image point 
          var id  = pointList[j].id;
          var z   = pointList[j].z; // relative to front vertex (0,0)
          
          var h; var X1; var Y1;

          if (isFinite(z)) { // the point is infinite 

              h   = pointList[j].h;
              X1  = z;
              Y1  = h;
          };


          for (var i = 1; i < systemInfo.elem.length ;  i = i + 2 ) {
         

              var curr = systemInfo.elem[i];   // current element 
              var S   = curr.S;                // system matrix
              var Z   = curr.Z;                // front vertex (from the first element)                       
              var L   = curr.L;                // length of system (curr. system)
              var n1  = curr.n1;               // object ref. index                       
              var n2  = curr.n2;               // image ref. index 


              // assumes that ray is finite 
              if (isFinite(z)) {
                  
                  var zl  = z - Z;                 // relative to front vertex 
                  var ir  = { h: -1*zl, u: 1 };    // ray @ front vertex 
                  var q   = rayMultiply(S, ir);    // ray @ back vertex          

                  var zd  = -q.h/q.u;              // distance from back vertex  

                  if (isFinite(zd)) { // finite image distance 

                      var mag = (n1*ir.u)/(n2*q.u); // magnification 

                      result = {  id  : id,     
                                  VO  : zl,
                                  PO  : -curr.cardinal.VP1 + z, 
                                  OQ  : h,
                                  VI  : zd,
                                  PI  : -curr.cardinal.VP2 + zd, 
                                  IQ  : mag*h, 
                                  M   : mag,
                                  X1  : X1,     
                                  Y1  : Y1,
                                  X2  : Z + L + zd,  // distance from the back vertex
                                  Y2  : mag*h };

                  } else { // infinite image distance 

                      throw "infinite image distance detected";
                  }

              } else {

                if (j == 0) {

                  var curr_point = pointList[j];

                  th     = curr_point.th;
                  result = {  id  : id,     
                              VO  : z,
                              PO  : undefined, 
                              OQ  : undefined,
                              VI  : curr.cardinal.VF2,
                              PI  : curr.cardinal.PF2, 
                              IQ  : n1 * th / curr.F, 
                              M   : undefined,
                              X1  : undefined,     
                              Y1  : undefined,
                              X2  : Z + L + curr.cardinal.VF2,  // zd is a vertex distance 
                              Y2  : n1 * th / curr.F };

                } else {

                  throw "collimated beam in the system!";

                };
              }


              total.push(result); 

              // (X1, Y1) => object 
              X1 = result.X2;
              Y1 = result.Y2;

              // (z, h)
              z  = X1;
              h  = Y1;                

          }
    }
  return total;
}


function getPointToPointInfo (systemInfo, pointList) {

  for (var i = 0; i < pointList.length ; i++) {



  }



}


// This will grab cardinal point information from the system matrix 
function getCardinalPoints (S){


  // system element information 
  var A = S.A; var B = S.B;  
  var C = S.C; var D = S.D;
  
  // key distances 
  ret = {  PF1  : D*A/B-C,
           PF2  : -1/B,
           VN1  : (A-1)/B,
           VN2  : D*(A-1)/B-C,
           VP1  : C+(1-D)*A/B,
           VP2  : (1-D)/B,
           VF1  : A/B,
           VF2  : -D/B };

  return ret;
}


// This will grab power information from cardinal point information from the system matrix 
function getPowers (data, n1, n2){


  ret = {   F   : n2/data.PF2, 
            Fv1 : -n1/data.VF1,
            Fv2 : +n2/data.VF2 };

  return ret;
}


function getMagnification (S, n1, n2) {


      /* assumes that light passes through the system! */


      // refractive index 
      rayIn  = { u: 1, h: 0 };
      rayOut = rayMultiply(S, rayIn);
      VI     = -rayOut.h/rayOut.u;

      // information 
      u1 = rayIn.u;
      u2 = rayOut.u;
      M = (n1*u1) / (n2*u2);

      return M;

}

// forward S
function getImageFromObject (S, VO) {

      rayIn  = { u: 1, h: 0 };
      rayOut = rayMultiply(S, rayIn);
      VI     = -rayOut.h/rayOut.u;

      //console.log("Image from object!");
      //console.log(rayOut);
      //console.log(S);      
      //console.log(VI);

      return VI;

}

function getObjectFromImage (S, VO) {

      var invS = inverseMatrix2x2(S);
      rayIn  = { u: 1, h: 0 };
      rayOut = rayMultiply(invS, rayIn);
      VO     = -rayOut.h/rayOut.u;

      //console.log("Object from image!");
      //console.log(rayOut);
      //console.log(S);      
      //console.log(VO);

      return VO;
}



// This will grab system matrix information for a refracting element 
function getLensElementInfo(elem, index) {

    // current lens element  
    var input_elem  = elem[index];
    var id          = input_elem.id;

    if (index == 0) { 

      // ERROR - first element is not a REF INDEX 
      if (input_elem.type != "index") {
        throw "first element is not an index"; 
      }

      // return an identity matrix 
      return { S: identitySystem, X: normalizedTranslationMatrix(identitySystem, input_elem.index), L:0, elem: input_elem };                 
    }


    if (index == elem.length-1) {

      // ERROR - first element is not a REF INDEX 
      if ((input_elem.type != "index") && (input_elem.type != "img"))  {
        throw "last element is not valid (index or img)"; 
      }

      // This is an index so return an identity matrix
      if (input_elem.type === "index") {
        return { S: identitySystem, X: normalizedTranslationMatrix(identitySystem, input_elem.index), L: 0, elem: input_elem };                 
      }

    }

    // surrounding lens elements 
    var prev_elem   = elem[index-1];
    var n1          = parseFloat(prev_elem.index);
    var next_elem, n2;        
    if (index+1 <= elem.length-1) {

          next_elem = elem[index+1];
          n2 = parseFloat(next_elem.index);
    
    } else {

      // information 
      if (input_elem.type === "img") {
          
          console.log (' - img surface detected. no next element found.');
          n2 = n1;
      

      } else
          throw "badly formed lens prescription";

    };


    // var n2          = parseFloat(next_elem.index);
    var F           = 0;
    var S           = {};


    switch (input_elem.type) {

      case "sphere" :


        // power related 
        var R   = input_elem.radius; 
        F   = (n2-n1)/R;    
        S   = refractionMatrix (n1, n2, F);    

        
        // display related 
        var h  = input_elem.height; 
        var dZ = Math.abs(R) - Math.sqrt(Math.pow(R,2) - Math.pow(h/2,2));

        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), X: normalizedRefractionMatrix(S, n1, n2), cardinal: elemCardinalPoints, powers: elemPowers, n1: n1, n2: n2, F: F, L : 0, elem: input_elem }; 

      case "thin" :
        F   = input_elem.power;
        S   = refractionMatrix (n1, n2, F);
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), cardinal: elemCardinalPoints, powers: elemPowers,  n1: n1, n2: n2, F: F, L : 0, elem: input_elem };

      case "stop" :
        // A dedicated, standalone aperture-stop marker - optically a plain
        // zero-power window (same identity-ish system as a "thin" element
        // with power 0), but drawn with its own distinct symbol (see
        // drawApertureStopMarks in renderer.js) instead of a lens/window
        // glyph, and always treated as the stop regardless of any explicit
        // "stop" flag - see convertToLensTable, where type "stop" implies
        // stop:true by default.
        F   = 0;
        S   = refractionMatrix (n1, n2, F);
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), cardinal: elemCardinalPoints, powers: elemPowers,  n1: n1, n2: n2, F: F, L : 0, elem: input_elem };

      case "prism" :

        // A (thin, idealized) prism doesn't change a ray's height, only its
        // slope, by a roughly constant amount independent of where it's
        // struck - unlike a lens, whose deviation is proportional to height.
        // That can't be expressed as a linear 2x2 matrix alone (S stays
        // identity: no height change, no power/focal effect); the deviation
        // is instead carried as an additive "offset", which composes across
        // the whole system the same way S does - see getTotalLensSystemInfo /
        // appendOverallInformation, and calculateRayTrace for how it's
        // applied when actually tracing a ray through one.
        //
        // "power" is a magnitude in prism dioptres (the clinical convention:
        // always positive, with the base direction stated separately) -
        // unlike a thin lens, a prism's sign isn't carried in "power" itself.
        // "base" ("up"/"down") is the side the base is on, and light is deviated TOWARDS THE BASE:
        // tan(deviation) = power/100. The system's heights and slopes are in the drawing's frame (positive is
        // DOWN the screen - sources are negated on the way in, see the "klugdy fix" in application.js), so a base-up
        // prism needs a negative slope and a base-down prism a positive one. (The signs used to be the other way
        // round, which sent rays away from the base.)
        var prismPower = Math.abs(input_elem.power);
        var deviation  = (input_elem.base === "down" ? 1 : -1) * prismPower / 100;

        return { S: identitySystem, invS: identitySystem, X: identitySystem, offset: { u: deviation, h: 0 }, n1: n1, n2: n2, F: 0, L: 0, elem: input_elem };

      case "img" :

        // try and do nothing
        var R = input_elem.radius;
        return { S: identitySystem, invS: identitySystem, X: identitySystem, L:0, elem: input_elem };


      case "plane" :
        F = 0;
        S   = refractionMatrix (n1, n2, F);            
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: identitySystem, invS: inverseMatrix2x2(S), cardinal: elemCardinalPoints, powers: elemPowers, elem: input_elem }; 
      
      case "index" :

        n   = input_elem.index;
        d   = input_elem.thickness;
        S   = translationMatrix (d);            

        // shading related 
        //console.log (input_elem);
        //console.log (prev_elem);
        //console.log (next_elem);

        return { S: S, invS: inverseMatrix2x2(S), X: normalizedTranslationMatrix(S, n), L: d, elem: input_elem }; 

      default:
        error("unknown element.");

    }

    // get the data object
    error("shouldnt be able to get here."); 
    return { S: S, invS: inverseMatrix2x2(S), cardinal: getCardinalPoints (S), elem: input_elem };
};


function getTotalLensSystemInfo (lensTable) {

  console.log ('Generating total lens information.');

  // get first index and last index 
  first = lensTable[0]; 
  last  = lensTable[lensTable.length-1]; 

  // check if the last element is 
  if (last.type === "img") {
      
      last  = lensTable[lensTable.length-1-1]; 

  };


  // read it in 
  totalSystem         = { elem  : [], 
                          total : { stop      : false,
                                    stopIndex : 0,
                                    stopDiameter : 1,
                                    S         : identitySystem,
                                    offset    : { u: 0, h: 0 }, // additive deviation from any prism element(s) - see appendOverallInformation
                                    invS      : identitySystem,
                                    X         : normalizedRefractionMatrix(identitySystem, first.index, last.index),
                                    cardinal  : null,
                                    n1        : first.index, n2: last.index,
                                    F         : null,
                                    entrance  : { L : 0, S : null, n1: 0.0, n2: 0.0  },
                                    exit      : { L : 0, S : null, n1: 0.0, n2: 0.0 },
                                    pupil     : { VE1 : 0, VE2 : 0 }
                              } 
                        };

  


  // create the total system
  var Z = 0;
  for (var i=0; i < lensTable.length; i++) {

    //console.log (`EACH ELEMENT INFO : INDEX [${i}]`);

    eachElementInfo     = getLensElementInfo(lensTable, i);    

    //console.log (eachElementInfo);


    // Build Up Exit/Entrance Systems 
    if (eachElementInfo.elem.hasOwnProperty("stop") & !totalSystem.total.stop) {
        
        if (eachElementInfo.elem.stop) {


            //console.log("FOUND STOP!");
            //console.log(eachElementInfo);

            totalSystem.total.stop         = true;     
            totalSystem.total.stopIndex    = i;
            totalSystem.total.stopDiameter = eachElementInfo.elem.aperture || eachElementInfo.elem.height;
            totalSystem.total.entrance.L   = Z; // system length  
            totalSystem.total.entrance.n1  = totalSystem.total.n1;
            totalSystem.total.entrance.n2  = eachElementInfo.n1;
            totalSystem.total.entrance.S   = identitySystem;      
            totalSystem.total.exit.L       = Z; // system length  
            totalSystem.total.exit.S       = identitySystem;                     
            totalSystem.total.exit.n1      = eachElementInfo.n2;        
            totalSystem.total.exit.n2      = totalSystem.total.n2;


            //console.log("UPDATED INDICES!");
            //console.log(totalSystem.total);

        }

    }

    // build up the rest
    if (lensTable[i].type == "index") {
      
       if ( (i > 0) & (i < lensTable.length-1)) { 
         Z = Z + lensTable[i].thickness; };


    } else if (lensTable[i].type == "img") {

         // console.log (`IMG position = ${Z}`);
         eachElementInfo.Z = Z;

    } else {
    
         eachElementInfo.Z   = Z;    // front vertex position 
         Z = Z + eachElementInfo.L;  // add in system length 
    
    };



    totalSystem.elem.push(eachElementInfo);
  }


  /* ----------------------------------------------

   AUTOMATIC APERTURE STOP (fallback)

   No element was explicitly flagged "stop" above - determine the aperture
   stop automatically as whichever aperture-bearing element most restricts a
   marginal ray traced from the front vertex (see findApertureStopForInfiniteObject).
   This is the classical definition of "the stop" absent an explicit
   designation, and keeps entrance/exit pupil bookkeeping meaningful (and the
   prescription table's STOP badge populated - see apertureStop() in
   prescription.js) for prescriptions that never set a stop flag. Since this
   runs from getTotalLensSystemInfo(), it is recomputed on every lens
   prescription change automatically.

  --------------------------------------------------- */

  if (!totalSystem.total.stop) {

    var autoStop = findApertureStopForInfiniteObject(totalSystem.elem);

    if (autoStop) {

      var stopElementInfo = totalSystem.elem[autoStop.index];

      totalSystem.total.stop          = true;
      totalSystem.total.stopIndex     = autoStop.index;
      totalSystem.total.stopAuto      = true; // computed, not explicitly flagged by the user
      totalSystem.total.stopDiameter  = stopElementInfo.elem.aperture || stopElementInfo.elem.height;
      totalSystem.total.entrance.L    = stopElementInfo.Z;
      totalSystem.total.entrance.n1   = totalSystem.total.n1;
      totalSystem.total.entrance.n2   = stopElementInfo.n1;
      totalSystem.total.entrance.S    = identitySystem;
      totalSystem.total.exit.L        = stopElementInfo.Z;
      totalSystem.total.exit.S        = identitySystem;
      totalSystem.total.exit.n1       = stopElementInfo.n2;
      totalSystem.total.exit.n2       = totalSystem.total.n2;

    }

  }


  /* ----------------------------------------------

   DISPLAY INFORMATION

    sphere : (n1,n2,R,h,dZ)
    index  : (z1,h1,z2,h2)

  --------------------------------------------------- */


  appendDisplayInformation (totalSystem);



  /* ----------------------------------------------

   SYSTEM MATRIX 

  --------------------------------------------------- */


  appendOverallInformation (totalSystem, Z);


  console.log (' - Result below:');
  console.log (totalSystem);


  return totalSystem;
}


function getLensSystemInfo (lensTable) {


  // create the total system
  var Z = 0; r = [];
  for (var i=0; i < lensTable.length-1; i++) {
    var id = lensTable[i].id;
    eachElementInfo  = getLensElementInfo(lensTable, i);
    r.push(eachElementInfo);
  }

  return r;
}



/*-- APPENDERS --*/


function appendDisplayInformation (totalSystem) {



      /*-- add a depth (dZ) field --*/

      for (var i=0; i < lensTable.length; i++) {

        curr = totalSystem.elem[i];

        switch (curr.elem.type) {

          case "index":
            curr.shading = { dZ : NaN };
            break;

          case "img":  case "sphere":

            var R   = curr.elem.radius;
            var h   = curr.elem.height;
            var Z   = Math.abs(R) - Math.sqrt(Math.pow(R,2) - Math.pow(h/2,2));
            curr.shading = { dZ : Math.sign(R)*Z };
            break;

          default:
            curr.shading = { dZ : 0 };

        }

      }


      /*-- update the index field --*/
      

      for (var i=0; i < lensTable.length; i+=2) {


        if (i == 0) {  // first element 

          curr   = totalSystem.elem[i];
          next   = totalSystem.elem[i+1];
          isprev = false;

          curr.shading = {     dZ: 0, 
                            start: { Z: -Infinity, h: Infinity },  
                              end: { Z: next.Z + next.shading.dZ, h: next.elem.height } };


        } else if (i == lensTable.length-1) { // last element 

          curr   = totalSystem.elem[i];
          prev   = totalSystem.elem[i-1];
          isnext = false;

          curr.shading = {     dZ: 0,
                            start: { Z: prev.Z + prev.shading.dZ, h: prev.elem.height },  
                              end: { Z: Infinity, h: Infinity } };


        } else {

          // all elements 

          curr = totalSystem.elem[i];
          prev = totalSystem.elem[i-1];
          next = totalSystem.elem[i+1];

          curr.shading = {     dZ: 0, 
                            start: { Z: prev.Z + prev.shading.dZ, h: prev.elem.height },  
                              end: { Z: next.Z + next.shading.dZ, h: next.elem.height } };


        }

      }
     
  }



  function appendOverallInformation (totalSystem, Z) {


    /* ------------------------------------------------

     Overall system information 

    --------------------------------------------------- */


    for (var i=lensTable.length-1; i >=0; i--) {

      // create the total system 
      eachElementInfo = getLensElementInfo(lensTable, i);


      // entrance pupil system
      if ((totalSystem.total.stop) & (totalSystem.total.stopIndex > i)) {
         totalSystem.total.entrance.S    = systemMultiply(totalSystem.total.entrance.S, eachElementInfo.S);    

      } else if ((totalSystem.total.stop) & (totalSystem.total.stopIndex < i))  { // next element gets included 

          // exit pupil system 
          totalSystem.total.exit.S = systemMultiply(totalSystem.total.exit.S, eachElementInfo.S);
      
      } else {

          // stop elelment 

      }    

      // A prism element's additive angular deviation composes through the
      // system the same way S does. This loop runs backwards (last element
      // first) and right-multiplies each new element's S onto what's
      // accumulated so far, which - because of that ordering - already
      // works out to the physically correct "last element leftmost" product
      // (verified against a plain sequential per-surface ray trace). The
      // matching rule for the offset is: transform the CURRENT element's own
      // offset by whatever's already been accumulated from elements after it
      // (totalSystem.total.S, before this iteration folds the current
      // element in), then add that to the offset accumulated so far.
      var elementOffset = eachElementInfo.offset || { u: 0, h: 0 };
      var Sfollowing     = totalSystem.total.S;
      totalSystem.total.offset = {
        u: Sfollowing.A*elementOffset.u + Sfollowing.B*elementOffset.h + totalSystem.total.offset.u,
        h: Sfollowing.C*elementOffset.u + Sfollowing.D*elementOffset.h + totalSystem.total.offset.h
      };

      // Build Up System
      totalSystem.total.S = systemMultiply(totalSystem.total.S, eachElementInfo.S);

    }



    /* ------------------------------------------------

     Overall system information 

    --------------------------------------------------- */


    if (totalSystem.total.stop) {

        totalSystem.total.exit.L        = Z - totalSystem.total.entrance.L;
        totalSystem.total.exit.invS     = inverseMatrix2x2(totalSystem.total.exit.S);           // eachElementInfo.S);                
        totalSystem.total.exit.Z        = getImageFromObject(totalSystem.total.exit.S, 0);      // back vertex      


        totalSystem.total.entrance.Z    = getObjectFromImage(totalSystem.total.entrance.S, 0);  // front vertex distance      
        totalSystem.total.entrance.invS = inverseMatrix2x2(totalSystem.total.entrance.S);      // eachElementInfo.S);                

        // put it into the frame of the LENS 
        totalSystem.total.pupil.VE1 = totalSystem.total.entrance.Z;
        totalSystem.total.pupil.VE2 = Z + totalSystem.total.exit.Z;
        
        // magnifications 
        var n1 = totalSystem.total.entrance.n1;
        var n2 = totalSystem.total.entrance.n2;
        totalSystem.total.pupil.ME1 = getMagnification (totalSystem.total.entrance.S, n1, n2);


        var n1 = totalSystem.total.exit.n1;
        var n2 = totalSystem.total.exit.n2;
        totalSystem.total.pupil.ME2 = getMagnification (totalSystem.total.exit.S, n1, n2);


        console.log("TOTAL SYSTEM STOPS");
        console.log(totalSystem.total);
    }


    totalSystem.total.invS = inverseMatrix2x2(totalSystem.total.S);


    S = totalSystem.total.S;
    totalCardinalPoints = getCardinalPoints(S);
    totalPowers = getPowers (totalCardinalPoints, first.index, last.index);
    

    totalSystem.total.cardinal = totalCardinalPoints;
    totalSystem.total.Z        = 0; // start gere 
    totalSystem.total.X        = normalizedRefractionMatrix(S, first.index, last.index);
    totalSystem.total.L        = Z;  
    totalSystem.total.F        = totalSystem.total.n2/totalSystem.total.cardinal.PF2;
    totalSystem.total.powers   = totalPowers;




 }
