/**************************************************************************************************************
 *
 * PARAXIAL.JS
 *
 *************************************************************************************************************/

/* --------------------------------------------------------------------------
%
% FVP : front vertex point (FVP) 
% VF1 : FVP to 1st focal point (FP) 
% PF1 : PPL1 to 1st FP
% VP1 : FVP to PPL1 (1st Principal Plane)
% VN1 : FVP to N1 (1st nodal poinr)
% BVP : back vertex point 
% VF2 : BVP to 2nd FP 
% PF2 : PPL2 to 2nd FP
% VP2 : BVP to PPL2
% VN2 : BVP to N2
% 
% These calculations can be used to determine cardinal points 
% with respect to the front vertex plane/point. 
% 
% P1 = VP1;             % 1st PPL plane 
% P2 = BVP + VP2;       % 2nd PPL plane 
% N1 = FVP + VN1;       % 1st nodal point
% N2 = BVP + VN2;       % 2nd nodal point
% F1 = FVP + VF1;       % 1st focal point 
% F2 = BVP + VF2;       % 2nd focal point 
% 
% Based on,
%
%  Appendix 1 : Advanced paraxial optics 
%  The Eye and Visual Optical Instruments
%  Smith, G. and Atchison, D.A. 
%  Cambrdige University Press, 1997.
%
--------------------------------------------------------------------------------*/

// console.log(Matrix);


// current state  
var systemObject = { id : 0,
                     n1 : 0,
                     n2 : 0,
                     objectRefIndex   : 1.0,
                     imageRefIndex    : 1.0,                    
                     currentSysMatrix : math.eye(2), //math.matrix([ [1, 0], [0, 1] ]),
                     arraySysMatrix   : [],                      
                     totalSysMatrix   : math.eye(2), // math.matrix([ [1, 0], [0, 1] ]),
                     totalSysLength   : 0, 
                     cumSysLength     : [],
                     cardinals        : [],
                     conjugates       : [],
                     prescription     : [],
                     objects          : [],
                     rays             : [],
                     raysout          : [],
                     pupil            : [] 
                  };


// console.log('Current System Matrix');
// console.log(systemObject.currentSysMatrix);
// console.log('Total System Matrix');
// console.log(systemObject.totalSysMatrix);
// var output       = {};
// var prescription = {};                 
// var images       = [];
// var objects      = {};
// var conjugates   = [];
     


function getAxialObject(M) {
          // pos.z = 10; pos.h = 1; // .... from the vertex position
          var u  = 1; h = 0;
          var Y  = math.multiply(math.inv(M), [[ u ],[ h ]]).toArray();
          var Z  = -Y[1]/Y[0];
          console.log('VE1 = ' + Z+ ' U = '+u);
          return { z:Z, u:Y[0] };
}

function getAxialImage(M) {
          var u  = 1; h = 0;
          var Y  = math.multiply(M, [[ u ],[ h ]]).toArray();
          var Z  = -Y[1]/Y[0];
          console.log('VE2 = ' + Z+ ' U = '+u);
          return  { z:Z, u:Y[0] };
}


// ... system matrix information 
function updateSystemMatrix(elem, index) {

    // update prescription 
    input_elem      = elem[index];
    next_elem       = elem[index+1];
    prev_elem       = elem[index-1];
    systemObject.id = input_elem.id;
    systemObject.n1 = parseFloat(prev_elem.args.index);
    systemObject.n2 = parseFloat(next_elem.args.index);
    var n1          = systemObject.n1;
    var n2          = systemObject.n2;
    var myM         = math.eye(2);


    // ... identify the STOP 
    if (input_elem.args.hasOwnProperty('stop')) {
      if (input_elem.args.stop) { 

          // system object thus far ...
          var myobject = getAxialObject(systemObject.totalSysMatrix); 
          systemObject.pupil = { hasStop       : true,
                                 ID            : index,  
                                 vertex        : systemObject.totalSysLength,
                                 entRefIndex   : n1, 
                                 entSys        : systemObject.totalSysMatrix, 
                                 exitRefIndex  : n2,
                                 exitSys       : [],
                                 VE1           : myobject.z,                                
                                 ME1           : myobject.u, // ... needs multiplication 
                                 VE2           : [],   
                                 ME2           : []
                                };
      }
    }



    // element 
    console.log('n1 = ' + n1);
    if (input_elem.type == 'sphere') { // sphere 

      var R   = input_elem.args.radius; 
      var F   = (n2-n1)/R;                
      myM = math.matrix([[n1/n2, -F/n2 ], [ 0, 1 ]]);
      systemObject.arraySysMatrix[index-1]   = myM; 
      systemObject.currentSysMatrix          = myM;
      systemObject.totalSysMatrix            = math.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);  
      systemObject.cumSysLength[index-1]     = systemObject.totalSysLength;

      console.log('sphere R = '+ R +' F = ' + F);
      console.log(myM);
      // myIndex += 1;

    } else if (input_elem.type == 'thin') { // thin
      
      var F  = input_elem.args.power;       
      myM = math.matrix([[n1/n2, -F/n2 ], [ 0, 1 ]]);
      systemObject.arraySysMatrix[index-1] = myM; 
      systemObject.currentSysMatrix        = myM;
      systemObject.totalSysMatrix          = math.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);      
      systemObject.cumSysLength[index-1]   = systemObject.totalSysLength;
      console.log('thin F = '+ F);
      // myIndex += 1;

    } else if (input_elem.type == 'plane') {  // plane 
      console.log('PLANE');

    } else {
      console.log('error = ' + input_elem.type);
    };


    // stop information 
    if (systemObject.pupil.hasStop) {

        console.log('INFORMATION STOP');
        console.log(systemObject.pupil.exitSys);

        if (systemObject.pupil.exitSys.length == 0) {
          console.log('EMPTY PUPIL');
          systemObject.pupil.exitSys = math.eye(2);
        } else {
          console.log('HAS EXITSYS');
          systemObject.pupil.exitSys = math.multiply(systemObject.currentSysMatrix, systemObject.pupil.exitSys);
        }
    }


    // translation 
    var d = next_elem.args.thickness;  
    if (d != undefined) {

      myM = math.matrix([[1, 0],[d, 1]]);
      systemObject.arraySysMatrix[index]    = myM;       
      systemObject.currentSysMatrix         = myM;
      systemObject.totalSysMatrix           = math.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);      
      systemObject.totalSysLength           = systemObject.totalSysLength + d;   
      systemObject.cumSysLength[index]      = systemObject.totalSysLength;

      
      console.log('n2 = ' + n2 + ' thickness = ' + d);    
      if (systemObject.pupil.hasStop) {
          systemObject.pupil.exitSys  = math.multiply(systemObject.currentSysMatrix, systemObject.pupil.exitSys);        
      };


    } else {
      
      console.log('n2 = ' + n2);    
    };

}

/* ---------------------------------------------------------------------------------------------------------
  determineImages 
--------------------------------------------------------------------------------------------------------- */

function computeImageByConjugate(index) {

/* --------------------------------------------------------------------------------------------------------- 
          systemObject.conjugates[index] = {  id  : systemObject.objects[index].id,
                                              VO  : z,
                                              PO  : -systemObject.cardinals.VP1 + z, 
                                              OQ  : h,
                                              VI  : zd,
                                              PI  : -systemObject.cardinals.VP2 + zd, 
                                              IQ  : mag*h, 
                                              M   : mag };         
--------------------------------------------------------------------------------------------------------- */

          var n1        = systemObject.n1;
          var n2        = systemObject.n2;
          var myObject  = systemObject.conjugates[index];


          var z       = myObject.VO;
          var hObject = myObject.OQ;
          var h   = 1; 
          var u   = -h/z;
          
          var M   = systemObject.totalSysMatrix.toArray();          
          var ud  = M[0][0]*u + M[0][1]*h; //M.e(1,1)*u + M.e(1,2); 
          var hd  = M[1][0]*u + M[1][1]*h; //M.e(1,1)*u + M.e(1,2);           
          var zd  = -hd/ud; //-M.e(2,1)/ud;
          var mag = (n1*u)/(n2*ud);

          systemObject.conjugates[index].VI = zd;
          systemObject.conjugates[index].PI = -systemObject.cardinals.VP2 + zd;
          systemObject.conjugates[index].IQ = mag*hObject;
          systemObject.conjugates[index].M  = mag;

          console.log('[computeImageByConjugate] updated the conjugate');                                              
          console.log(systemObject.conjugates[index]);                                              

}


function computeObjectByConjugate(index) {

/* --------------------------------------------------------------------------------------------------------- 
          systemObject.conjugates[index] = {  id  : systemObject.objects[index].id,
                                              VO  : z,
                                              PO  : -systemObject.cardinals.VP1 + z, 
                                              OQ  : h,
                                              VI  : zd,
                                              PI  : -systemObject.cardinals.VP2 + zd, 
                                              IQ  : mag*h, 
                                              M   : mag };         
--------------------------------------------------------------------------------------------------------- */

          var n1        = systemObject.n1;
          var n2        = systemObject.n2;
          var myImage   = systemObject.conjugates[index];
          var hImage    = myImage.IQ;
          var zd        = myImage.VI; 
          var hd        = 1;
          var ud        = -hd/zd;


          var B         = math.inv(systemObject.totalSysMatrix).toArray();          


          var u         = B[0][0]*ud + B[0][1]*hd; //M.e(1,1)*u + M.e(1,2); 
          var h         = B[1][0]*ud + B[1][1]*hd; //M.e(1,1)*u + M.e(1,2); 
          var z         = -h/u; //-M.e(2,1)/ud;          
          var mag       = (n1*u)/(n2*ud);

          systemObject.conjugates[index].VO = z;
          systemObject.conjugates[index].PO = -systemObject.cardinals.VP1 + z, 
          systemObject.conjugates[index].OQ = hImage/mag ;
          systemObject.conjugates[index].M  = mag; 

}





function determineImages() {

      // refractive indices 
      var n1            = parseFloat(systemObject.summary.n1);
      var n2            = parseFloat(systemObject.summary.n2);

      for (var i = 0; i < systemObject.objects.length ;  i++ ) {

          // axial ray gives axial image point 
          var z   = systemObject.objects[i].z; 
          var h   = systemObject.objects[i].h;
          var M   = systemObject.totalSysMatrix.toArray();
          var u   = -1/z;
          var ud  = M[0][0]*u + M[0][1]; //M.e(1,1)*u + M.e(1,2); 
          var hd  = M[1][0]*u + M[1][1]; //M.e(1,1)*u + M.e(1,2); 
          var zd  = -hd/ud; //-M.e(2,1)/ud;
          var mag = (n1*u)/(n2*ud);

          // information            
          systemObject.conjugates[i] = {  id  : systemObject.objects[i].id,
                                          VO  : z,
                                          PO  : -systemObject.cardinals.VP1 + z, 
                                          OQ  : h,
                                          VI  : zd,
                                          PI  : -systemObject.cardinals.VP2 + zd, 
                                          IQ  : mag*h, 
                                          M   : mag };                 

      }
}


function updateConjugate(id, code, newValue) {

    for (var i = 0; i < systemObject.conjugates.length ;  i++ ) {

        var currid = systemObject.conjugates[i].id;
        if (currid == id) {
            console.log('[updateConjugate] found conjugate pair to update.');

            // ... information 
            switch(code) {
                case 'VO':
                    console.log('[updateConjugate] VO changed to ... ' + newValue);
                    systemObject.conjugates[i].VO = Number(newValue);
                    computeImageByConjugate(i);
                    return;
                
                case 'OQ':
                    console.log('[updateConjugate] OQ changed to ... ' + newValue + ' from ' + systemObject.conjugates[i].OQ );
                    systemObject.conjugates[i].OQ = Number(newValue);
                    console.log(systemObject.conjugates[i]);
                    computeImageByConjugate(i);
                    console.log(systemObject.conjugates[i]);
                    return;
                
                case 'VI':
                    console.log('[updateConjugate] VI changed to ... ' + newValue);
                    systemObject.conjugates[i].VI = Number(newValue);
                    computeObjectByConjugate(i);
                    return;
                
                case 'IQ':
                    console.log('[updateConjugate] IQ changed to ... ' + newValue);
                    systemObject.conjugates[i].IQ = Number(newValue);
                    computeObjectByConjugate(i);
                    return;                    
                
                default:
                    console.log('Unknown option.');
            }


        };


    }

}



/* ---------------------------------------------------------------------------------------------------------
  update systemObject based on the current prescription 
--------------------------------------------------------------------------------------------------------- */

function updateSystemState() {
      
  var prescription = systemObject.prescription;
  systemObject.objectRefIndex = parseFloat(prescription[0].args.index);
  systemObject.imageRefIndex  = parseFloat(prescription[prescription.length-1].args.index);
  systemObject.totalSysMatrix = math.eye(2); // math.matrix([ [1, 0], [0, 1] ]);
  systemObject.pupil.hasStop  = false;

  console.log(systemObject.totalSysMatrix);

  for (var i = 1; i < prescription.length ;  i += 2 ) {
       updateSystemMatrix(prescription, i);
  }


  // results! 
  var x = systemObject.totalSysMatrix.toArray();  
  var A = x[0][0]; var B = x[0][1];
  var C = x[1][0]; var D = x[1][1];

  console.log('A = ' + A); console.log('B = ' + B);
  console.log('C = ' + C); console.log('D = ' + D);

  systemObject.cardinals  = { PF1: D*A/B-C,
                              PF2: -1/B,
                              VN1: (A-1)/B,
                              VN2: D*(A-1)/B-C,
                              VP1: C+(1-D)*A/B,
                              VP2: (1-D)/B,
                              VF1: A/B,
                              VF2: -D/B };
  systemObject.system     = { A:   A, 
                              B:   B,
                              C:   C,
                              D:   D,
                              V2:  systemObject.totalSysLength };  
  systemObject.summary    = { n1:  systemObject.objectRefIndex,
                              n2:  systemObject.imageRefIndex,
                              F1:  -systemObject.objectRefIndex/systemObject.cardinals.PF1,
                              F2:  systemObject.imageRefIndex/systemObject.cardinals.PF2,
                              VF1: -systemObject.objectRefIndex/systemObject.cardinals.VF1,
                              VF2: -systemObject.objectRefIndex/systemObject.cardinals.VF2,
                              V2: systemObject.totalSysLength
                            };

  if (systemObject.pupil.hasOwnProperty('hasStop')) {

        // ... information (EXIT PUPIL IS ON THE IMAGE SIDE OF THE SURFACE)
        console.log('found - magnification.');
        console.log(systemObject.pupil.exitSys);

        var myimage = getAxialImage(systemObject.pupil.exitSys); 
        systemObject.pupil.VE2    = myimage.z;
        systemObject.pupil.ME2    = myimage.u;                   

        var n1 = systemObject.objectRefIndex;
        var n2 = systemObject.pupil.entRefIndex;
        systemObject.pupil.ME1    = n2/(systemObject.pupil.ME1*n1);



        var n1 = systemObject.pupil.exitRefIndex;
        var n2 = systemObject.imageRefIndex;
        systemObject.pupil.ME2    = n1/(systemObject.pupil.ME2*n2);
   }

  if (systemObject.hasOwnProperty('objects')) {
         console.log('found objects - images.');
         determineImages();
   }

  if (systemObject.hasOwnProperty('rays')) {
         console.log('found objects - rays.');
         determineRays();

   }


}



/* ---------------------------------------------------------------------------------------------------------
  determineRays

input rays  = (u,  (z, h)
output rays = (u', (z', h') 

{ u,  // angle 
  h,  // height 
  z   // axial 
}

--------------------------------------------------------------------------------------------------------- */


// ... use the systemMatrix to do the ray-tracing 
function determineRays() {

    console.log('DETERMINE RAYS (WITH CLOSING STEP) ------------------------------------------------------------------');

    // ... input rays 
    rays = systemObject.rays;
    console.log(rays);

    // translation to front vertex of system
    var M = []; var z = 0;
    var initialTranslation;

    var raysInputArray  = [[],[]]; // math.ones(2, rays.length); 
    var raysOutputArray = [[],[]]; // math.ones(2, rays.length); 
    var totalRayArray   = []; 
    var raysArray       = new Array(rays.length);
    var raysInput       = math.ones(2, 1); 


    // initial translation will create "Sylvester" matrices all optic axis positions the same 
    for (var i=0; i < rays.length; i++ ) {        
        raysInput = math.matrix([[rays[i].u], [rays[i].h]]);         
        raysInputArray[0].push(rays[i].u);
        raysInputArray[1].push(rays[i].h);
        z                      = rays[i].z;
        initialTranslation     = math.matrix([[1, 0],[z, 1]]);        
        rayOutput              = math.multiply(initialTranslation, raysInput).toArray();
        raysOutputArray[0].push(rayOutput[0][0]);
        raysOutputArray[1].push(rayOutput[1][0]);        

        // information 
        raysArray[i] = { id: rays[i].id, name: rays[i].name, list: [] };        
        raysArray[i].list.push({ index : 1, u : rays[i].u, h : rays[i].h, z: -rays[i].z });        
        raysArray[i].list.push({ index : 2, u : rayOutput[0][0], h : rayOutput[1][0], z : 0.0 });

    }

    console.log('Initial Translation');
    console.log('rays input array');
    console.log(raysInputArray);
    console.log('rays output array');
    console.log(raysOutputArray);
    totalRayArray.push(raysInputArray);
    totalRayArray.push(raysOutputArray);


    console.log(systemObject.arraySysMatrix);

    // information 
    for (var i=0; i < systemObject.arraySysMatrix.length; i++ ) {     

      // translate up to the front vertex
      raysInputArray             = raysOutputArray;    
      var currentTransformation  = systemObject.arraySysMatrix[i];         

      console.log('RAYS INPUT ARRAY.');
      console.log(raysInputArray);
      console.log(currentTransformation);
 
      raysOutputArray = math.multiply(currentTransformation, raysInputArray).toArray();      
      console.log('Specific Transformation');

      console.log('rays output array');
      console.log(raysOutputArray);
      totalRayArray.push(raysInputArray);
      totalRayArray.push(raysOutputArray);

      // ... information 
      for (var j=0; j < rays.length; j++ ) {
        raysArray[j].list.push({ index: 3+i, u: raysOutputArray[0][j], h: raysOutputArray[1][j], z: systemObject.cumSysLength[i] });
      }

    }


    raysInputArray  = raysOutputArray;
    raysOutputArray = [[],[]];

    var totalSysLength = systemObject.totalSysLength;

    // closing step operation 
    for (var i=0; i < rays.length; i++ ) {        
        
        // raysInput = math.matrix([[rays[i].u], [rays[i].h]]);         
        // raysInputArray[0].push(rays[i].u);
        // raysInputArray[1].push(rays[i].h);

        u  = raysInputArray[0][i];
        h  = raysInputArray[1][i];
        z  = -h/u;

        console.log('u= ' + u + ' h= '+h+' z= '+z);
        finalTranslation     = math.matrix([[1, 0],[z, 1]]);        
        raysInput            = math.matrix([[u], [h]]);   
        rayOutput            = math.multiply(finalTranslation, raysInput).toArray();
        raysOutputArray[0].push(rayOutput[0][0]);
        raysOutputArray[1].push(rayOutput[1][0]);        

        console.log('Closing Transformation');
        console.log('rays input array');
        console.log(raysInputArray);
        console.log('rays output array');
        console.log(raysOutputArray);
        totalRayArray.push(raysInputArray);
        totalRayArray.push(raysOutputArray);

        // ... add information in a printable format 
        //for (var j=0; j < rays.length; j++ ) {
        raysArray[i].list.push({  index: (systemObject.arraySysMatrix.length + 3), u: rayOutput[0][0], h: rayOutput[1][0], z: totalSysLength + z });
        //}

    }

 // systemObject.raysResult = totalRayArray;
 systemObject.raysout = raysArray;
 console.log(JSON.stringify(raysArray, null, '\t'));
 console.log('---------------------------------------------------------------------------------------------------');

 // ... convert total rays to JSON

}
