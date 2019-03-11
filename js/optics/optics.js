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

console.log("loaded ... optics.js");

var Optics = {};

Optics.analyze = function (lensTable) {

  // return a lensSystem
  return getTotalLensSystemInfo (lensTable); 
}

Optics.calculatePointToPoint = function (lensSystem, pointList) {
  return calculateFwdPointToPoint (lensSystem, pointList)
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
  console.log("result group.");  
  console.log(ret);
  console.log(lens.length);
  console.log(lastIndex);
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
                             radius:      assignParameterValue(response[i].args.radius, ""),
                             power:       assignParameterValue(response[i].args.power, ""),                             
                             height:      assignParameterValue(response[i].args.height, ""),
                             index:       assignParameterValue(response[i].args.index, ""),
                             thickness:   assignParameterValue(response[i].args.thickness, 0),
                             stop:        assignParameterValue(response[i].args.stop, false),
                             aperture:    assignParameterValue(response[i].args.aperture, "") };

        lens_table.push(each_element);        
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

CALCULATEPOINTOTPOINT Elementwise point-to-point calcuulation (DEPRECATED)

  points are specified relative to the origin of the coorinate system

  - elements : need to be zero thickness 

  - finite rays not addressed 
  - afocal system not addressed 

--------------------------------------------------------------------------- */

function calculateFwdPointToPoint(systemInfo, pointList) {

      total = [];

      var curr   = systemInfo;   // current element 
      var S      = curr.S;     // system matrix
      var Z      = curr.Z;     // front vertex (from the first element)                       
      var L      = curr.L;     // length of system (curr. system)
      var n1     = curr.n1;    // object ref. index                       
      var n2     = curr.n2;    // image ref. index 

      // refractive indices 
      for (var j = 0; j < pointList.length ;  j++ ) {

          // axial ray gives axial image point 
          var id  = pointList[j].id;
          var z   = pointList[j].zo; // relative to front vertex (0,0)          
          var h; var X1; var Y1;

          if (isFinite(z)) { // finite object distance 

              // find a point 
              h  = pointList[j].ho;
              X1 = z;
              Y1 = h;
                  
              var zl  = z - Z;                 // relative to front vertex 
              var ir  = { h: -1*zl, u: 1 };    // ray @ front vertex 
              var q   = rayMultiply(S, ir);    // ray @ back vertex          
              var zd  = -q.h/q.u;              // distance from back vertex  

              if (isFinite(zd)) { // => finite image distance 

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
                              Y2  : mag*h , 
                              TH  : undefined };

              } else { // => infinite image distance 

                  result = {  id  : id,     
                              VO  : zl,
                              PO  : -curr.cardinal.VP1 + z, 
                              OQ  : h,
                              VI  : Infinity, // sign
                              PI  : Infinity, 
                              IQ  : Infinity, 
                              M   : undefined,
                              X1  : X1,     
                              Y1  : Y1,
                              X2  : Infinity,  // distance from the back vertex
                              Y2  : Infinity,
                              TH  : h/n1 * curr.F }; // w.r.t. PF1 and PF2 

                  throw "infinite image distance detected";
              
              }


         } else { 


            // infinite object distance => finite image
            var curr_point = pointList[j];
            th_deg         = curr_point.to;  // in radians            
            th             = deg2rad(curr_point.to);  // in radians            
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
                        Y2  : n1 * th / curr.F,
                        T1  : th_deg,
                        T2  : undefined
                      };

        }

        total.push(result);
      }
  return total;
}


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


  ret = {   F  : n2/data.PF2, 
            Fv1: n2/data.VF2,
            Fv2: -n1/data.VF1 };

  return ret;
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
      return { S: identitySystem, X: normalizedTranslationMatrix(identitySystem, input_elem.index) };                 
    }


    if (index == elem.length-1) {

      // ERROR - first element is not a REF INDEX 
      if (input_elem.type != "index") {
        throw "last element is not an index"; 
      }

      // return an indentity matrix 
      return { S: identitySystem, X: normalizedTranslationMatrix(identitySystem, input_elem.index) };                 
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
        return { S: S, X: normalizedRefractionMatrix(S, n1, n2), cardinal: elemCardinalPoints, powers: elemPowers, n1: n1, n2: n2, F: F, L : 0 }; 

      case "thin" :
        F   = input_elem.power;
        S   = refractionMatrix (n1, n2, F);   
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);        
        return { S: S, cardinal: elemCardinalPoints, powers: elemPowers,  n1: n1, n2: n2, F: F, L : 0 }; 

      case "plane" :
        F = 0;
        S   = refractionMatrix (n1, n2, F);            
        elemCardinalPoints = getCardinalPoints(S);
        elemPowers = getPowers (elemCardinalPoints, n1, n2);
        return { S: S, cardinal: elemCardinalPoints, powers: elemPowers }; 
      
      case "index" :
        n   = input_elem.index;
        d   = input_elem.thickness;
        S   = translationMatrix (d);            
        return { S: S, X: normalizedTranslationMatrix(S, n) }; 

      default:
        error("unknown element.");

    }

    // get the data object
    error("shouldnt be able to get here."); 
    return { S: S, cardinal: getCardinalPoints (S) };
};


function getTotalLensSystemInfo (lensTable) {

  // get first index and last index 
  first = lensTable[0]; 
  last  = lensTable[lensTable.length-1]; 

  // read it in 
  totalSystem         = { elem  : [], 
                          total : { S        : identitySystem,
                                    X        : normalizedRefractionMatrix(identitySystem, first.index, last.index),
                                    cardinal : null,
                                    n1       : first.index, n2: last.index,
                                    F        : null,
                              } 
                        };

  // create the total system
  var Z = 0;
  for (var i=0; i < lensTable.length-1; i++) {

    // accumulate the distance 
    eachElementInfo     = getLensElementInfo(lensTable, i);
    
    // accumulate or read out the thickness
    if (lensTable[i].type == "index") {
       Z = Z + lensTable[i].thickness;
    } else {    
       eachElementInfo.Z   = Z;    // front vertex position 
       Z = Z + eachElementInfo.L;  // add in system length 
    };

    totalSystem.elem.push(eachElementInfo);
  }


  // create the system matrix
  for (var i=lensTable.length-1; i >=0; i--) {
    eachElementInfo     = getLensElementInfo(lensTable, i);
    totalSystem.total.S = systemMultiply(totalSystem.total.S, eachElementInfo.S);
  }

  S = totalSystem.total.S;
  totalCardinalPoints = getCardinalPoints(S);
  totalPowers = getPowers (totalCardinalPoints, first.index, last.index);
  

  console.log("Total Powers");
  console.log(totalPowers);

  totalSystem.total.cardinal = totalCardinalPoints;
  totalSystem.total.Z        = 0; // start gere 
  totalSystem.total.X        = normalizedRefractionMatrix(S, first.index, last.index);
  totalSystem.total.L        = Z;  
  totalSystem.total.F        = totalSystem.total.n2/totalSystem.total.cardinal.PF2;
  totalSystem.total.powers   = totalPowers;
  return totalSystem;
}