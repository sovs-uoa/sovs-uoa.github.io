/**************************************************************************************************************
 *
 * OPTICS.JS
 *
 *************************************************************************************************************/

export.parseLensTable = function (lensTable) {

  return getTotalLensSystemInfo (lensTable);
  
}



/* --------------------------------------------------------------------------
% 
% UPDATED INFORMATION  
%
--------------------------------------------------------------------------------*/

// construct a refraction matrix 
function refractionMatrix(n1, n2, F) {
      return { A:n1/n2, B:-F/n2, C:0, D:1 };
}

function translationMatrix(d) {
      return { A:1, B:0, C:d, D:1 };
}


// S1*S2 where S1 = [ A B ; C D ] or S2 = [ A B ; C D ]
function systemMultiply (S1, S2) {

  return {  A: S1.A*S2.A + S1.B*S2.C,
            B: S1.A*S2.B + S1.B*S2.D, 
            C: S1.C*S2.A + S1.D*S2.C,
            D: S1.C*S2.B + S1.D*S2.D }
};


// This will grab cardinal point information from the system matrix 
function getCardinalPoints (S){

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


// This will grab system matrix information for a refracting element 
function getLensElementInfo(elem, index) {

    // update prescription 
    input_elem      = elem[index];
    next_elem       = elem[index+1];
    prev_elem       = elem[index-1];
    var id          = input_elem.id;
    var n1          = parseFloat(prev_elem.index);
    var n2          = parseFloat(next_elem..index);
    var F           = 0;
    var S           = {};

    switch (input_elem.type) {

      case "sphere" :
        var R   = input_elem.radius; 
        F   = (n2-n1)/R;    
        S   = refractionMatrix (n1, n2, F);    
        return { S: S, cardinal: getCardinalPoints (S) }; 

      case "thin" :
        F   = input_elem.power;
        S   = refractionMatrix (n1, n2, F);   
        return { S: S, cardinal: getCardinalPoints (S) }; 

      case "plane" :
        F = 0;
        S   = refractionMatrix (n1, n2, F);            
        return { S: S, cardinal: getCardinalPoints (S) }; 

        case "index" :
        d   = input_elem.thickness;
        S   = translationMatrix (d);            
        return { S: S }; 


      default:
        error("unknown element.");

    }

    // get the data object 
    return { S: S, cardinal: getCardinalPoints (S) };
};


function getTotalLensSystemInfo (lensTable) {

  totalSystem         = { elem  : [], 
                          total : { S : { A: 1, B:0, C:0, D:1 },
                                    cardinal : null 
                              } 
                        };

  for (int i=0; i < lensTable.length ; i++) {

    // build data for each element + also an overall 
    eachElementInfo     = getLensElementInfo(lensTable, i);
    totalSystem.total.S = systemMultiply(totalSystem.total.S, eachElementInfo.S);
    totalSystem.elem.push(eachElementInfo);

  }


  totalSystem.total.cardinal = getCardinalPoints(totalSystem.total.S);

  return totalSystem;
}