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
                             thickness:   assignParameterValue(response[i].args.thickness, NaN),
                             stop:        assignParameterValue(response[i].args.stop, false),
                             aperture:    assignParameterValue(response[i].args.aperture, NaN) };

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
  console.log("START PROCESSING");

  // create the system matrix
  // for (var i=lensTable.length-1; i >=0; i--) {
  // create the total system 
  // eachElementInfo = getLensElementInfo(lensTable, i);

    for (var i=0; i < lensTable.length; i++) {

          each    = lensTable[i];
          Z       = Z + each.L;

          console.log("Lens");
          console.log(each);
          console.log("Input Rays");
          console.log(rays);

          newrays = rayMultiply(each.S, rays);          
          for (var j = 0; j < newrays.length; j++) {
              newrays[j].z = Z;
          }

          console.log("Output Rays");
          console.log(newrays);


          ////console.log("system information");
          ////console.log(each);
          ////console.log(Z);

          ret.push(newrays);
          rays = newrays;        // update rays
  }


  return ret
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

              // axial ray gives axial image point 
              //var id  = point.id;
              var X1  = point.z; 
              var Y1  = point.h;    
              var T1  = point.t;

              // results are relative to back vertex
              result    = calculatePairFromObject ({ z: X1-V1, h: Y1, t: T1 }, systemInfo); // distances assumed from vertices 

              // fill in information if we have an afocal system 
              if (!isFinite(result.IQ) & !isFinite(result.OQ)) {
                    result.T2 = calculateExitAngle(T1, systemInfo);
              }               


              // add in global co-ordiates 
              result.id = point.id;
              result.X1 = X1; 
              result.Y1 = Y1;
              result.X2 = V2 + result.VI; 
              result.Y2 = result.IQ;

              console.log ("CONJUGATE PAIR OUTPUT");
              console.log (result);
              console.log (curr);

              return result;

            break;

            case "image":

              // axial ray gives axial image point 
              //var id  = point.id;
              var X2  = point.z; 
              var Y2  = point.h;
              var T2  = point.t;

              // results are relative to back vertex
              result    = calculatePairFromImage ({ z: X2-V2, h: Y2, t: T2}, systemInfo); // distances assumed from vertices 

              // add in global co-ordiates 
              result.id = point.id;
              result.X2 = X2; 
              result.Y2 = Y2;
              result.X1 = V1 + result.VO;
              result.Y1 = result.OQ;
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

                  result = {  id  : undefined,     
                              VO  : z,
                              PO  : -curr.cardinal.VP1 + z, 
                              OQ  : h,
                              VI  : zd,
                              PI  : -curr.cardinal.VP2 + zd, 
                              IQ  : mag*h,
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


          console.log (`INFINITY CONJUGATE ANGLE = ${t}`);

           zp  = +n2/curr.F;  // PF            

            // infinite object => finite image
           result = {  id  : undefined,     
                       VO  : z,
                       PO  : -curr.cardinal.VP1 + z, 
                       OQ  : undefined,
                       VI  : curr.cardinal.VF2,
                       PI  : curr.cardinal.PF2, 
                       IQ  : n1 * deg2rad(t)/ curr.F, // n2 * Math.tan (deg2rad(t))/ curr.F,
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

                  result = {  id  : undefined,     
                              VO  : zl,
                              PO  : -curr.cardinal.VP1 + zl, 
                              OQ  : hd/mag,
                              VI  : zd,
                              PI  : -curr.cardinal.VP2 + zd, 
                              IQ  : hd,
                              M   : mag,
                              T1  : undefined,
                              T2  : undefined }; //

              } else { // finite image => infinite object 

                  result = {  id  : undefined,     
                              VO  : -Infinity,
                              PO  : -Infiniity, 
                              OQ  : undefined,
                              VI  : zd, // sign
                              PI  : -curr.cardinal.VP2 + zd, 
                              IQ  : hd, 
                              M   : undefined,
                              T1  : td,
                              T2  : undefined,
                              TH  : h/n1 * curr.F,                              
                               }; // w.r.t. PF1 and PF2 

                      throw "infinite image distance detected";              
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
                       T2  : t }; //

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
      if (input_elem.type != "index") {
        throw "last element is not an index"; 
      }

      // return an indentity matrix 
      return { S: identitySystem, X: normalizedTranslationMatrix(identitySystem, input_elem.index), L: 0, elem: input_elem };                 
    }

    // surrounding lens elements 
    var next_elem   = elem[index+1];
    var prev_elem   = elem[index-1];
    var n1          = parseFloat(prev_elem.index);
    var n2          = parseFloat(next_elem.index);
    var F           = 0;
    var S           = {};


    switch (input_elem.type) {

      case "sphere" :
        var R   = input_elem.radius; 
        F   = (n2-n1)/R;    
        S   = refractionMatrix (n1, n2, F);    

        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), X: normalizedRefractionMatrix(S, n1, n2), cardinal: elemCardinalPoints, powers: elemPowers, n1: n1, n2: n2, F: F, L : 0, elem: input_elem}; 

      case "thin" :
        F   = input_elem.power;
        S   = refractionMatrix (n1, n2, F);   
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);        
        return { S: S, invS: inverseMatrix2x2(S), cardinal: elemCardinalPoints, powers: elemPowers,  n1: n1, n2: n2, F: F, L : 0, elem: input_elem }; 

      case "img" :
        var R   = input_elem.radius; 
        F   = (n2-n1)/R;    
        S   = refractionMatrix (n1, n2, F);    

        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), X: normalizedRefractionMatrix(S, n1, n2), cardinal: elemCardinalPoints, powers: elemPowers, n1: n1, n2: n2, F: F, L : 0, elem: input_elem}; 


      case "plane" :
        F = 0;
        S   = refractionMatrix (n1, n2, F);            
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, invS: inverseMatrix2x2(S), cardinal: elemCardinalPoints, powers: elemPowers, elem: input_elem }; 
      
      case "index" :
        n   = input_elem.index;
        d   = input_elem.thickness;
        S   = translationMatrix (d);            
        return { S: S, invS: inverseMatrix2x2(S), X: normalizedTranslationMatrix(S, n), L: d, elem: input_elem }; 

      default:
        error("unknown element.");

    }

    // get the data object
    error("shouldnt be able to get here."); 
    return { S: S, invS: inverseMatrix2x2(S), cardinal: getCardinalPoints (S), elem: input_elem };
};


function getTotalLensSystemInfo (lensTable) {

  // get first index and last index 
  first = lensTable[0]; 
  last  = lensTable[lensTable.length-1]; 

  // read it in 
  totalSystem         = { elem  : [], 
                          total : { stop      : false,
                                    stopIndex : 0,
                                    stopDiameter : 1,
                                    S         : identitySystem,
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
  for (var i=0; i < lensTable.length-1; i++) {
    eachElementInfo     = getLensElementInfo(lensTable, i);    



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
    } else {
       eachElementInfo.Z   = Z;    // front vertex position 
       Z = Z + eachElementInfo.L;  // add in system length 
    };
    totalSystem.elem.push(eachElementInfo);
  }



  //console.log("START COLLATING...");

  // create the system matrix
  for (var i=lensTable.length-1; i >=0; i--) {

    // create the total system 
    eachElementInfo = getLensElementInfo(lensTable, i);
    if ((totalSystem.total.stop) & (totalSystem.total.stopIndex > i)) { // entrance pupil system 

        //console.log("Building Entrance Information.");
       totalSystem.total.entrance.S    = systemMultiply(totalSystem.total.entrance.S, eachElementInfo.S);    

       //console.log(eachElementInfo);


    } else if ((totalSystem.total.stop) & (totalSystem.total.stopIndex < i))  { // next element gets included 

        //console.log("Building Exit Information.");
        totalSystem.total.exit.S = systemMultiply(totalSystem.total.exit.S, eachElementInfo.S);

       //console.log(eachElementInfo);

    
    } else {

        //console.log("Stop Element.");

       //console.log(eachElementInfo);


    }    

    // Build Up System 
    totalSystem.total.S = systemMultiply(totalSystem.total.S, eachElementInfo.S);

  }


  // finalize!
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
      var n1 = totalSystem.total.exit.n1;
      var n2 = totalSystem.total.exit.n2;
      totalSystem.total.pupil.ME1 = getMagnification (totalSystem.total.entrance.S, n1, n2);

      var n1 = totalSystem.total.entrance.n1;
      var n2 = totalSystem.total.entrance.n2;
      totalSystem.total.pupil.ME2 = getMagnification (totalSystem.total.exit.S, n1, n2);


      //console.log("TOTAL SYSTEM STOPS");
      //console.log(totalSystem.total);
  }


  totalSystem.total.invS = inverseMatrix2x2(totalSystem.total.S);


  S = totalSystem.total.S;
  totalCardinalPoints = getCardinalPoints(S);
  totalPowers = getPowers (totalCardinalPoints, first.index, last.index);
  

  //console.log("Total Powers");
  //console.log(totalPowers);

  totalSystem.total.cardinal = totalCardinalPoints;
  totalSystem.total.Z        = 0; // start gere 
  totalSystem.total.X        = normalizedRefractionMatrix(S, first.index, last.index);
  totalSystem.total.L        = Z;  
  totalSystem.total.F        = totalSystem.total.n2/totalSystem.total.cardinal.PF2;
  totalSystem.total.powers   = totalPowers;
  return totalSystem;
}


function getLensSystemInfo (lensTable) {


  // create the total system
  var Z = 0; r = [];
  for (var i=0; i < lensTable.length-1; i++) {

    //console.log("LENS");
    //console.log(lensTable[i]);

    var id = lensTable[i].id;
    eachElementInfo  = getLensElementInfo(lensTable, i);
    r.push(eachElementInfo);
  }

  return r;
}