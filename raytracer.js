#!/usr/bin/env node


/* 
var program = require('commander');
 
program
  .version('0.0.1')
  .option('-p, --paraxial', 'Add peppers')
  .option('-P, --pineapple', 'Add pineapple')
  .option('-b, --bbq-sauce', 'Add bbq sauce')
  .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
  .parse(process.argv);
 */
 
// console.log(process.argv);
var program = { paraxial :true };




/**
 * Module dependencies.
 */


var fs     = require('fs');
var Matrix = require('matrixmath/Matrix');


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


// current state  
var systemObject = { id : 0,
                     n1 : 0,
                     n2 : 0,
                     objectRefIndex   : 1.0,
                     imageRefIndex    : 1.0,                    
                     currentSysMatrix : new Matrix(2, 2).setIdentityData(),                      
                     totalSysMatrix   : new Matrix(2, 2).setIdentityData(),
                     totalSysLength   : 0 
                  };

var prescription = {};                 
var images       = [];
var objects      = {};
var conjugates   = [];
     

// ... system matrix information 
function updateSystemObject(elem, index) {

    // update prescription 
    input_elem     = elem[index];
    next_elem      = elem[index+1];
    prev_elem      = elem[index-1];
    systemObject.id = input_elem.id;
    systemObject.n1 = prev_elem.args.index;
    systemObject.n2 = next_elem.args.index;

    var n1 = systemObject.n1;
    var n2 = systemObject.n2;

    // element 
    console.log('n1 = ' + n1);
    if (input_elem.type == 'sphere') {        // sphere 

      var R  = input_elem.args.radius; 
      var F  = (n2-n1)/R;             
      systemObject.currentSysMatrix.setData([n1/n2, -F/n2, 0, 1 ], 2, 2);
      systemObject.totalSysMatrix = Matrix.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);      
      console.log('sphere R = '+ R +' F = ' + F);

    } else if (input_elem.type == 'thin') { // thin 
      var F  = input_elem.args.power; 
      systemObject.currentSysMatrix.setData([n1/n2, -F/n2, 0, 1 ], 2, 2);
      systemObject.totalSysMatrix = Matrix.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);      
      console.log('thin F = '+ F);

    } else if (input_elem.type == 'plane') {  // plane 
      console.log('PLANE');
    } else {
      console.log('error = ' + input_elem.type);
    };


    // translation 
    var d = next_elem.args.thickness;  
    if (d != undefined) {
      systemObject.currentSysMatrix.setData([1, 0, d, 1], 2, 2);
      systemObject.totalSysMatrix = Matrix.multiply(systemObject.currentSysMatrix, systemObject.totalSysMatrix);      
      systemObject.totalSysLength = systemObject.totalSysLength + d;
      console.log('n2 = ' + n2 + ' thickness = ' + d);    
    } else {
      console.log('n2 = ' + n2);    
    };

}

function determineImages() {

      // generate the image matrix
      var test_ray      = new Matrix(2, 1).setData( [ -Math.pi/4, 0 ]);
      var T             = new Matrix(2, 2); 
      var M             = systemObject.totalSysMatrix.getData();  
      var len           = systemObject.totalSysLength;

      // refractive indices 
      var n1            = output.summary.n1;
      var n2            = output.summary.n2;

      for (var i = 0; i < objects.length ;  i++ ) {


          // axial ray gives axial image point 
          var z   = objects[i].z; 
          var h   = objects[i].h;
          var M   = systemObject.totalSysMatrix;
          var u   = -1/z;
          var ud  = M[0]*u + M[1]; 
          var zd  = -M[3]/ud;
          var mag = (n1*u)/(n2*ud);

          // information            
          conjugates[i] = { id  : objects[i].id,
                            VO  : z,
                            PO  : -output.cardinals.VP1 + z, 
                            OQ  : h,
                            VI  : zd,
                            PI  : -output.cardinals.VP2 + zd, 
                            IQ  : mag*h, 
                            M   : mag };                 

      }
}


function updateSystemState(output) {
      
  systemObject.objectRefIndex = prescription[0].args.index;
  systemObject.imageRefIndex  = prescription[prescription.length-1].args.index;

  // ... generate the system matrix
  for (var i = 1; i < prescription.length ;  i += 2 ) {
       updateSystemObject(prescription, i);
  }


  // ... calculate the paraxial details 
  var x = systemObject.totalSysMatrix.getData();      
  var A = x[0]; var B = x[1];
  var C = x[2]; var D = x[3];

  // ... output structure 
  output.cardinals  = {     PF1: D*A/B-C,
                            PF2: -1/B,
                            VN1: (A-1)/B,
                            VN2: D*(A-1)/B-C,
                            VP1: C+(1-D)*A/B,
                            VP2: (1-D)/B,
                            VF1: A/B,
                            VF2: -D/B };
  output.system     = {     A:  A, 
                            B:  B,
                            C:  C,
                            D:  D,
                            V2: systemObject.totalSysLength };  
  output.summary     = {    n1:  systemObject.objectRefIndex,
                            n2:  systemObject.imageRefIndex,
                            F1:  -systemObject.objectRefIndex/output.cardinals.PF1,
                            F2:  systemObject.imageRefIndex/output.cardinals.PF2,
                            VF1: -systemObject.objectRefIndex/output.cardinals.VF1,
                            VF2: -systemObject.objectRefIndex/output.cardinals.VF2
                        };


  if (output.hasOwnProperty('objects')) {

         objects = output.objects;
         console.log('found objects - locating images');
         determineImages();
         output.conjugates = conjugates;

   }


}


// elements 
function process(systemMatrix, input_ray) {

    var ray = new Matrix(3, 1);
    ray.setData([ input_ray.Y ,input_ray.Z , input_ray.T ], 3, 1);
    ray = Matrix.multiply(systemMatrix, ray);
    output  = { Y : ray[0], Z: ray[1], T: ray[2] };
    return output;
}




// console.log(rays);


/*  -------------------------------------------------------------------------
    system matrix information :
    -------------------------------------------------------------------------
    - paraxial system information 
    - system information 
    ------------------------------------------------------------------------- */

// console.log('help');


if (program.paraxial) {

     // basic element templates 
     var output       = JSON.parse(fs.readFileSync('thick.json', 'utf8'));
     var prescription = output.prescription;
     updateSystemState(output);  // from prescription object



     console.log(JSON.stringify(output, null, '\t'));
}

// console.log('help');

if (program.raytrace) {

    // ... rays 
    var rays  = JSON.parse(fs.readFileSync('rays.json', 'utf8'));

    // ... each system element 
    var myoutput = [];
    for (var i = 1; line < elems.length ; i += 2) {

        // ... each ray
        var myrays    = [];
        for (var j in rays) {

            // refract or translate  
            var each_ray   = rays[j];
            input_ray      = each_ray;

            // update the state  
            updateSystem(elems[i]);
            myrays.push(output_ray);


            // transfer input ray to output ray 

        }

        myoutput.push(myrays);
    }

    console.log(JSON.stringify(myoutput, null, '\t'));
};






