  var lens_edge       = { "stroke": "black", "stroke-width": "2", "stroke": "black", "stroke-dasharray":"none"  };
  var pupil_attr       = { "stroke-width": "2", "stroke": "gray", "stroke-dasharray":"none"  };
  


  var lens = { prescription: null, 
               tabledata : null,
               table : null,
               modal: { group:       "",
                        type:        "",
                        description: "",
                        radius:      "",
                        height:      "",
                        index:       "",
                        thickness:   "",
                        stop:        "",
                        aperture:    "" 
                      } 
            };



  var paper; // store the paper here 
  var viewBoxWidth  = 2;
  var viewBoxHeight = 1;
  var paperWidth    = 1200;
  var paperHeight   = 400;
  var oX,oY;
  var oWidth,oHeight;


  var pup_set, sch;
  var ps, cd_set, axis_set;
  var cp_set, optics_set;
  var kx, ky;



  function setScaleFactor() {

    // virtual unit / pixel unit 
    paperWidth  = $("#lens-container").width(); 
    paperHeight = $("#lens-container").height(); 
    kx = viewBoxWidth/paperWidth;     // units/pix 
    ky = viewBoxHeight/paperHeight;   // units/pix 

  }


  function getXProportionFactor(num) {
    return num*viewBoxWidth;
  }


  function startDrawing(canvasID) {

        // create the canvas
        // paper = new Raphael(document.getElementById(canvasID), paperWidth, paperHeight);

        if(paper == null) {
    
           // do something
           paper = new Raphael(document.getElementById(canvasID), "100%", "100%");


          } else {

           paper.clear ();

        }



       // objects are stored in sets that are cleared  
        ps          = paper.set();
        cd_set      = paper.set();
        axis_set    = paper.set(); 
        cp_set      = paper.set();
        optics_set  = paper.set();
        pup_set     = paper.set();

       
        oWidth = viewBoxWidth, oHeight = viewBoxHeight;
        var oX = -viewBoxWidth/2, oY = -viewBoxHeight/2, oWidth = viewBoxWidth, oHeight = viewBoxHeight;        
        viewBox   = paper.setViewBox(oX, oY, viewBoxWidth, viewBoxHeight);
        viewBox.X = oX; viewBox.Y = oY;


        setScaleFactor ();


        //paper.circle(1,1,1)
        //     .attr({ fill: "url(#diagonalHatch)" });



        // draw the axis 
        drawAxis();

      

  }




/* draw axis on a raphael canvas
  r - the Raphael canvas to draw on
  grid - true/false draws a grid or not
  offset - how far from 0,0 to draw the axis - they show better at 2
*/

var axis_set; 

var lastdivSize = 0;
var divSize     = 0;

function drawAxis () {
  
  // var g = grid || false;
  // var o = offset || 0.1;
  // use divisions of 1, 5, 10, 15, 20  (try to keep as close to x number of divisions)
  // viewBox.X, viewBox.Y, viewBoxWidth, viewBoxHeight

  // Width 
  var left    = viewBox.X;
  var top     = viewBox.Y;
  var width   = viewBoxWidth;
  var height  = viewBoxHeight;
  var right   = left + width;
  var bottom  = top + height;

  
  //console.log("left = " + viewBox.X + " top = " + viewBox.Y + " width = " + viewBoxWidth + " height = " + viewBoxHeight);

  // divSize 
  
  var divExact     = width / 20;
  var divOrder     = Math.floor ( Math.log10( divExact ) );              // -3 / -2 / -1 / 1
  var divNumerator = Math.round ( divExact / Math.pow(10, divOrder) );   // 3 x 10^{-3} 

  divNumerator = Math.max(1, 2.5*Math.floor( divNumerator / 2.5));
  var divSize      = divNumerator * Math.pow(10, divOrder);  // 20 divs on screen 
  console.log("divSize : " + divNumerator + " x 10^(" + divOrder + ")");

  if (lastdivSize == divSize) {
    return;
  }
  lastdivSize = divSize;
  

  divs        = 2*Math.floor(viewBoxWidth / divSize)


  // var divSize = Math.max(0.05, 5*Math.floor(100*divSize/5)/100 );  // approximate div. size 
  console.log("CHANGED DIVSIZE TO = " + divSize +  " (REDRAWING)");


  // X 
  var startX = -divSize * divs;
  var endX   = +divSize * divs;

  // Y 
  var startY = -divSize * divs;
  var endY   = +divSize * divs;


  var grid_attributes   = { "stroke" : "gray", "stroke-width" : "5", 'stroke-opacity': 0.1 };
  var border_attributes = { "stroke" : "red", "stroke-width" : "5", 'stroke-opacity': 0.1 };


  var dX = 2*width;
  var dY = 2*height;


  axis_set.remove();
  axis_set = paper.set();
  

  // Draws a border 
  // axis_set.push( r.rect(left, top, width, height).attr(border_attributes) );

  // grid vertical       
  X = 0; 
  while (X <= right + dX) {
    axis_set.push( paper.path("M"+X+","+(top-dY)+"L"+X+","+(bottom+dY)).attr(grid_attributes) );
    axis_set.push( paper.path("M"+-X+","+(top-dY)+"L"+-X+","+(bottom+dY)).attr(grid_attributes) );        
    X = X + divSize;
  }

  // grid horizontal
  Y = 0;
  while (Y <= bottom + dY) {
    axis_set.push( paper.path("M"+(left-dX)+","+-Y+"L"+(right+dX)+","+-Y).attr(grid_attributes) );
    axis_set.push( paper.path("M"+(left-dX)+","+Y+"L"+(right+dX)+","+Y).attr(grid_attributes) );
    Y = Y + divSize;
  }



  axis_set.toBack ();

 }


 function drawPupils(info) {

      pup_set.remove();
      pup_set = paper.set();


      if (info.stop) {

        var D = info.stopDiameter;

        var h = D;

        E2 = info.pupil.VE2; E1 = info.pupil.VE1;
        M2 = Math.abs(info.pupil.ME2);  
        M1 = Math.abs(info.pupil.ME1);


        // ENTRANCE 
        c1 = drawVertArrow(E1, M1*D/2, true);
        c2 = drawVertArrow(E1,-M1*D/2, false);

        // c1 = paper.path( ["M", E1 - h/30, M1*D/2, "L",  E1 + h/30, M1*D/2  ] );
        // c2 = paper.path( ["M", E1 - h/30, -M1*D/2, "L", E1 + h/30, -M1*D/2  ] );

        // EXIT 
        
        c3 = drawVertArrow(E2, M2*D/2, true);
        c4 = drawVertArrow(E2,-M2*D/2, false);

        // c3 = paper.path( ["M", E2 - h/30, M2*D/2, "L",  E2 + h/30, M2*D/2  ] );
        // c4 = paper.path( ["M", E2 - h/30, -M2*D/2, "L", E2 + h/30, -M2*D/2  ] );

        
        c5 = drawPoint(E1, 0, "blue");
        c6 = drawPoint(E2, 0, "blue");

        pup_set.push(c1, c2, c3, c4, c5, c6);

        RegisterWheelCallback ({ type: "point", handle: c5 });
        RegisterWheelCallback ({ type: "point", handle: c6 });

        c7 = drawText(E1, 0 , "E"); 
        c7.attr({ "text-anchor" : "start" });

        c8 = drawText(E2, 0 , "E'");
        c8.attr({ "text-anchor" : "end" });

        RegisterWheelCallback ({ type: "text", handle: c7 });
        RegisterWheelCallback ({ type: "text", handle: c8 });

        pup_set.push(c7, c8);


      }

      pup_set.toFront();

 }


  /* ---------------------------------------------

  THESE ARE DRAWING FUNCTIONS 

   ------------------------------------------------ */


  function drawCardinalPoints(x, y, systemPoints, displayOptions) {

    console.log("Updated cardinal points.");

    cp_set.remove();
    cp_set = paper.set();

    var cp;


    var v1 = x + 0;                   // front vertex 
    var v2 = x + systemPoints.L;


    var h  = displayOptions.cardinalVertHeight;   // back vertex 


    // nodal points
    if (displayOptions.showVertices) {
          
          // points           
          var vn1 = systemPoints.cardinal.VN1;
          var vn2 = systemPoints.cardinal.VN2;

          // lines 
          var y = 0;
          var x1 = v1
          var x2 = v2;
          var y1 = y - h/2;
          var y2 = y + h/2;


          cp1 = drawPoint(v1, 0, "black");
          cp2 = drawPoint(v2, 0, "black");
          cp_set.push(cp1, cp2);

          RegisterWheelCallback ({ type: "point", handle: cp1 });
          RegisterWheelCallback ({ type: "point", handle: cp2 });


          r =  cp1.attr("r");
          // dX = cp1.attr("r")*kx*20;
          cp1 = drawText(x1, y , "V"); // - 4*cp1.attr("r")
          cp1.attr({ "text-anchor" : "end"});
          //cp1.transform("...t-100,0");
          cp2 = drawText(x2, y , "V'"); // - 4*cp2.attr("r")
          cp2.attr({ "text-anchor" : "start"});
          //cp1.transform("...t100,0");

          cp_set.push(cp1, cp2);
          RegisterWheelCallback ({ type: "text", handle: cp1 });
          RegisterWheelCallback ({ type: "text", handle: cp2 });


          //cp1 = drawText(x1 - 3*cp1.attr("r"), y - 6*cp1.attr("r"), "A");
          //cp2 = drawText(x2 + 3*cp2.attr("r"), y - 6*cp2.attr("r"), "A'");
          //cp_set.push(cp1, cp2);

          //cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          //cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          //cp_set.push(cp1, cp2);

        }    


    // cardinal points 
    if (displayOptions.showCardinalPoints) {

        // focal points
        if (displayOptions.showFocalPoints) {
          var pf1 = systemPoints.cardinal.PF1;
          var pf2 = systemPoints.cardinal.PF2;
          var vp1 = systemPoints.cardinal.VP1;
          var vp2 = systemPoints.cardinal.VP2;
          
          var x1 = v1 + vp1 + pf1;   // front focal point 
          var x2 = v2 + vp2 + pf2;   // back focal poitn 
          var y1 = y - h/2;          // principal point heights 
          var y2 = y + h/2;          // principal point heights     

          cp1 = drawPoint(x1, y, "magenta");
          cp2 = drawPoint(x2, y, "magenta");
          cp_set.push(cp1, cp2);


          RegisterWheelCallback ({ type: "point", handle: cp1 });
          RegisterWheelCallback ({ type: "point", handle: cp2 });

          //cp1 = drawPoint(x1, y, "magenta");
          //cp2 = drawPoint(x2, y, "magenta");
          //cp_set.push(cp1, cp2);

          let cp1F = drawText(x1, y, "F");
          cp1F.attr({ "text-anchor" : "end"});
          let cp2F = drawText(x2, y, "F'");
          cp2F.attr({ "text-anchor" : "start"});
          cp_set.push(cp1F, cp2F);


          RegisterWheelCallback ({ type: "text", handle: cp1F });
          RegisterWheelCallback ({ type: "text", handle: cp2F });

          //cp1 = paper.text(x1, y, "F").attr({fill: '#000000'});
          //cp2 = paper.text(x2, y, "F'").attr({fill: '#000000'});
          //cp_set.push(cp1, cp2);


          // BARS
          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

        }


        if ((displayOptions.showNodalPoints) & (displayOptions.showPrincipalPoints)) {

          var vn1 = systemPoints.cardinal.VN1;
          var vn2 = systemPoints.cardinal.VN2;

          var vp1 = systemPoints.cardinal.VP1;
          var vp2 = systemPoints.cardinal.VP2;

          var x1 = v1 + vn1;
          var x2 = v2 + vn2;

          /* ----------------------------------------------------------

            COMBINED N/P BUT SEPARATED FROM N'/P'

            ---------------------------------------------------------- */

           isNonP     = Math.abs(vn1-vp1) < 0.001;
           isP1nearP2 = Math.abs(vp1-vp2) < 0.001;

          // P/N separate P'/N'  
          if ((isNonP) & (!isP1nearP2)) {

            cp1 = drawPoint(x1, 0, "yellow");
            cp_set.push(cp1);
            RegisterWheelCallback ({ type: "point", handle: cp1 });
          
            cp1 = drawText(x1, 0, "P/N");
            cp1.attr({ "text-anchor" : "middle"});
            cp1.data({ "data-shift-Y" : 1.0 });
            cp_set.push(cp1);
            RegisterWheelCallback ({ type: "text", handle: cp1 });

            cp2 = drawPoint(x2, 0, "blue");
            cp_set.push(cp2);
            RegisterWheelCallback ({ type: "point", handle: cp2 });

            cp2 = drawText(x2, 0, "P'/N'");
            cp2.attr({ "text-anchor" : "middle"});            
            cp2.data({ "data-shift-Y" : -1.0 });
            cp_set.push(cp2);
            RegisterWheelCallback ({ type: "text", handle: cp2 });

            cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
            cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
            cp_set.push(cp1, cp2);

          }


          // P/N + P'/N'  
          if ((isNonP) & (isP1nearP2)) {

            cp1 = drawPoint(x1, 0, "yellow");
            cp_set.push(cp1);
            RegisterWheelCallback ({ type: "point", handle: cp1 });
          
            cp1 = drawText(x1, 0, "P/N");
            cp1.attr({ "text-anchor" : "middle"});
            cp1.data({ "data-shift-Y" : 1.0 });
            cp_set.push(cp1);
            RegisterWheelCallback ({ type: "text", handle: cp1 });

            cp2 = drawText(x1, 0, "P'/N'");
            cp2.attr({ "text-anchor" : "middle"});            
            cp2.data({ "data-shift-Y" : -1.0 });
            cp_set.push(cp2);
            RegisterWheelCallback ({ type: "text", handle: cp2 });

            cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
            // cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
            cp_set.push(cp1); // , cp2);

          }

          
          if (!isNonP) {

            console.log ('add nodal points');

            cp1 = drawPoint(v1 + vn1, y, "cyan");
            cp2 = drawPoint(v2 + vn2, y, "cyan");
            cp_set.push(cp1, cp2);

            cp1 = drawText(x1, 0, "N");
            cp1.attr({ "text-anchor" : "middle"});
            cp1.data({ "data-shift-Y" : 0.0 });
            cp_set.push(cp1);
            RegisterWheelCallback ({ type: "cardinal", handle: cp1 });

            cp2 = drawText(x2, 0, "N'");
            cp2.attr({ "text-anchor" : "middle"});
            cp2.data({ "data-shift-Y" : 0.0 });
            cp_set.push(cp2);
            RegisterWheelCallback ({ type: "cardinal", handle: cp2 });

          }


        }


        // vertices
        if (displayOptions.showVertices) {

          // points 
          cp1 = drawPoint(v1 + vn1, y, "yellow");
          cp2 = drawPoint(v2 + vn2, y, "yellow");
          cp_set.push(cp1, cp2);

          RegisterWheelCallback ({ type: "cardinal", handle: cp1 });
          RegisterWheelCallback ({ type: "cardinal", handle: cp2 });

          // lines 
          //var y1 = y - h/2;
          //var y2 = y + h/2;
          //cp1 = paper.path( ["M", v1, y1, "L", v1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          //cp2 = paper.path( ["M", v2, y1, "L", v2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          //cp_set.push(cp1, cp2);

        }



        cp_set.toFront ();

    }


  }


  function updateCardinalPoints () {
      // cycle through the cp_set if its not empty and alter all circles !
      if (!Array.isArray(cp_set) || !cp_set.length) { // array does not exist, is not an array, or is empty
        cp_set.attr({r: kx*4});
      }

  }


  function getLensElemById(renderableLens, id) {
    let ret = renderableLens.find (each => {
      return each.elem.tag_id == id
    });

    console.log ('ELEM BY ID');
    console.log (ret);

    return ret;
  }


  function drawSchematic (response, renderableLens) {

    console.log ('DRAW SCHEMATIC');
    console.log (response);
    console.log (renderableLens);

    if (response.hasOwnProperty('schematic')) {


      switch (response.schematic.model) {

        case "eye":
          
          let anterior_cornea = getLensElemById (renderableLens.elem, response.schematic.map.anterior_cornea);
          let V1  = anterior_cornea.Z;
          let Rc  = anterior_cornea.elem.radius;
          let anterior_lens = getLensElemById (renderableLens.elem, response.schematic.map.anterior_lens);
          let ACD = anterior_lens.Z - V1;
          let retina = getLensElemById (renderableLens.elem, response.schematic.map.retina);
          let AL  = retina.Z;

          console.log (`V1=${V1}, Rc=${Rc}, ACD=${ACD}, AL=${AL}`);

          //drawEye ();
          drawEye (V1, 0, Rc, ACD, AL);
          break;

        default:
          throw "eye";

      }

    }

    console.log (renderableLens);


  }


  /* -------------------------------------------------

      DRAW SPECIAL EYES 

      (x,y) : front vertex (V) 
      Rc    : corneal radius 
      ACD   : anterior chamber depth 
      L     : axial length 

   --------------------------------------------------- */

  function drawEye (x, y, Rc, ACD, AL) {


    console.log ("DRAW EYE");

    let sch = paper.set ();
    //let c = paper.ellipse (0,0,10,10);


    /* CIRCLE FOR ANTERIOR EYE */ 
    let c1 = paper.ellipse (x+Rc, y, Rc, Rc)
                  .attr({"fill": "#F0F0F0", "stroke": "none", "stroke-opacity": 0.1, "fill-opacity": 0.1 });

    /* ELLIPSE FOR POSTERIOR EYE */ 
    let Rx_body = (AL-ACD)/2;
    let Ry_body = Rx_body * 1.2;
    let c2 = paper.ellipse ( ACD + Rx_body*0.9, y, Rx_body*1.1, Ry_body)
                  .attr({"fill": "#F0F0F0", "stroke": "none", "stroke-opacity": 0.1, "fill-opacity": 0.1 });

    sch.push (c1, c2);
    sch.toBack ();

         

    /* ELLIPSE FOR POSTERIOR EYE */ 
    // let Rx_body = (L-ACD)/2;
    // let Ry_body = Rx_body * 1.3;
    // paper.ellipse ( ACD + Rx_body, y, Rx_body, Ry_body);

         //.attr({"fill": "gray", "stroke-opacity": 0.5 });


    /* ELLIPSE FOR LENS */ 


  }



  /* DRAW LENS TYPES   */


  function drawSurface(x, y, R, h, displayOptions) {

    var lens = paper.set();
    var r = Math.abs(R);

    // draw a path 
    var h = Math.min(h, 0.9*2*r, h); // displayOptions.height);
    //var c = paper.path( ["M", x, y-h/2, "L", x, y+h/2  ] );
    //lens.push(c);

    if (R < 0) {   // negative curvature


      var Z = r - Math.sqrt(Math.pow(R,2) - Math.pow(h/2,2));
      c1 = paper.path([ "M",x-Z,y+h/2,"a",r,r,0,0,0,0,-h ]);
      lens.attr(lens_edge);
      lens.push(c1);

    } else if (R > 0) {   // positive lens

      var r = Math.abs(R);
      var Z = r - Math.sqrt(Math.pow(R,2) - Math.pow(h/2,2));
      c1 = paper.path([ "M",x+Z,y-h/2,"a",r,r,0,0,0,0,h ]);
      lens.attr(lens_edge);
      lens.push(c1);

    } else { // afocal
      
      //c1 = paper.circle(x, y + h/2, 0.1);
      //c2 = paper.circle(x, y - h/2, 0.1);   
      //lens.push(c1, c2);

    }

    lens.toFront ();

    return lens;
  }

  /* DRAW VERT ARROW - DOESNT HAVE ALL ORIENTATIONS */

  function drawVertArrow(x1, y1, up) {


      var c = paper.set ();
      
      //c1 = paper.path( ["M", x1, y1, "L", x2, y2 ] );
      //c2 = paper.path( ["M", x1, y1, "L", y2, y2 ] );
      //c.push(c1, c2);


      var h = Math.abs(y1/2); // Math.sqrt( Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) );

      if (up) {          
          c3 = paper.path( ["M", x1, y1, "L", x1+h/5, y1+h/5  ] );
          c4 = paper.path( ["M", x1, y1, "L", x1-h/5, y1+h/5  ] );        
          c5 = paper.path( ["M", x1, y1, "L", x1, y1+3*h/5  ] );        

          c3.attr(pupil_attr);
          c4.attr(pupil_attr);
          c5.attr(pupil_attr);

          c.push(c3, c4, c5);
          return c;
      };

      if (!up) {
          
          c6 = paper.path( ["M", x1, y1, "L", x1+h/5, y1-h/5  ] );
          c7 = paper.path( ["M", x1, y1, "L", x1-h/5, y1-h/5  ] );        
          c8 = paper.path( ["M", x1, y1, "L", x1, y1-3*h/5  ] );        

          c6.attr(pupil_attr);
          c7.attr(pupil_attr);
          c8.attr(pupil_attr);

          c.push(c6, c7, c8);
          return c;
      }

      // c3 = paper.path( ["M", x1, y1, "L", x-h/30, y1-h/30  ] );
      // c4 = paper.path( ["M", x1, y1, "L", x+h/30, y1-h/30  ] );

  }



  /* DRAW LENS TYPES   */

  function drawThinLens(x, y, F, h, displayOptions) {

    var lens = paper.set();


    console.log("HEIGHT = " + h);


    // draw a path 
    //var h = displayOptions.height; 
    c = paper.path( ["M", x, y-h/2, "L", x, y+h/2  ] );
    lens.push(c);


    if (F < 0) {   // negative lens 

      y1 = y-h/2; y2 = y+h/2;
      c1 = paper.path( ["M", x, y2, "L", x+h/30, y2+h/30  ] );
      c2 = paper.path( ["M", x, y2, "L", x-h/30, y2+h/30  ] );
      c3 = paper.path( ["M", x, y1, "L", x-h/30, y1-h/30  ] );
      c4 = paper.path( ["M", x, y1, "L", x+h/30, y1-h/30  ] );

      lens.push(c1, c2, c3, c4);


    } else if (F > 0) {   // positive lens

      y1 = y+h/2; y2 = y-h/2;
      c1 = paper.path( ["M", x, y2, "L", x+h/30, y2+h/30  ] );
      c2 = paper.path( ["M", x, y2, "L", x-h/30, y2+h/30  ] );
      c3 = paper.path( ["M", x, y1, "L", x-h/30, y1-h/30  ] );
      c4 = paper.path( ["M", x, y1, "L", x+h/30, y1-h/30  ] );

      lens.push(c1, c2, c3, c4);


    } else { // afocal


      y1 = y+h/2; y2 = y-h/2;
      c1 = paper.path( ["M", x, y2, "L", x+h/30, y2  ] );
      c2 = paper.path( ["M", x, y2, "L", x-h/30, y2  ] );
      c3 = paper.path( ["M", x, y1, "L", x-h/30, y1  ] );
      c4 = paper.path( ["M", x, y1, "L", x+h/30, y1  ] );

      
      //cp1 = drawPoint(x, y + h/2, "black");
      //cp2 = drawPoint(x, y - h/2, "black");
      lens.push(c1, c2, c3, c4);

    }

    lens.toFront ();

    return lens;
  }



  /* ---------------------------------------------------------------------------------------------------------------

    draggable points - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


   var ox, oy, lx, ly; 


    //Pane
   dragPointStart = function (e) {

        console.log("point dragger start");

        // storing original coordinates
        this.ox = this.attr("x");
        this.oy = this.attr("y");

    };

  dragPointMove = function (dx, dy) {
        
        console.log("point dragger move");

        nowX = this.ox + dx;
        nowY = this.oy + dy;
        this.attr({ X: nowX, y: nowY });

    };

  dragPointUp = function () {

        console.log("point dragger up");

    };



/* ---------------------------------------------------------------------------------------------------------------

    DRAWPOINT Points are on the canvas. 

  
   --------------------------------------------------------------------------------------------------------------- */


  function drawText(x, y, text, color) {

    console.log('drawing at X:' +x +',Y:'+y + ' KX:' + kx);

    r = kx*4; // 4 pixels is the requested size


    var c = paper.text(x, y, text);
    c.attr({ "font-family": "arial", fill: "black", "font-size": 1.0, "text-anchor" : "middle" });
    c.transform([  "t",x,y, "s", 20*kx, 20*kx,0,0]);

    //.attr({"fill": color, "stroke": "#000000", "stroke-width": 1, "font-size": 1});

    // \c.drag(dragPointMove, dragPointStart, dragPointUp);    
    // c.drag(dragPointMove, dragPointStart, dragPointUp);
    return c;
  } 


/* ---------------------------------------------------------------------------------------------------------------

    DRAWPOINT Points are on the canvas. 

  
   --------------------------------------------------------------------------------------------------------------- */


  function drawPoint(x, y, color) {

    console.log('drawing at X:' +x +',Y:'+y + ' KX:' + kx);

    r = kx*4; // 4 pixels is the requested size

    var c;
    if (isFinite(x)) {
      c = paper.circle(x, y, r).attr({"fill": color, "fill-opacity": 1.0, "stroke": "#000000", "stroke-width": "1"});
    } else {
      c = paper.circle(0, 0, r).attr({"fill": color, "fill-opacity": 1.0, "stroke": "#000000", "stroke-width": "1"});
      c.hide();
    }


    // \c.drag(dragPointMove, dragPointStart, dragPointUp);    
    // c.drag(dragPointMove, dragPointStart, dragPointUp);
    return c;
  } 

/* ---------------------------------------------------------------------------------------------------------------

    DRAWCONJUGATES Conjugates are intended to be left draggable on the canvas. 

    Deleting or adding a conjugate should require a refresh call !!!
  
   --------------------------------------------------------------------------------------------------------------- */

  function drawConjugates(data, dataOptions) {

    console.log("-- draw conjugates");

    // var dataOptions = this.dataOptions;

    var X1 = data.X1;
    var Y1 = data.Y1;
    if (isFinite(X1) & isFinite(Y1)) {
      // console.log('X1 = ' + X1 + ' Y1 = '+ Y1);
      

      console.log("---- added point id = " + data.id + " (object)");
      // object points are draggable 
      var c = drawPoint(X1, Y1, "green");               
      c.id = "point-" + data.id + "-object";
      c.data("info", { id : data.id, type : "object" });
      c.drag(move, start, up);

/*      
      c.click (function () {
        //console.log(this);
        //console.log(e);
        console.log("clicked object point = " + this.id);
        //select (this.id);
      });
*/

      //this.ps_set.push(c); 
    } else {
      error("undefined object!");
    };

   var X2 = data.X2;
   var Y2 = data.Y2;
   if (isFinite(X2) & isFinite(Y2)) {
      
      // image points are draggable 
      console.log("---- added point id = " + data.id + " (image)");
      var c = drawPoint(X2, Y2, "cyan");         
      c.id = "point-" + data.id + "-image";
      c.data("info",{ id : data.id, type : "image" });
      c.drag(move, start, up);
      //this.ps_set.push(c); 

    } else {
    error("undefined object!");
    }

  }


  /* ---------------------------------------------------------------------------------------------------------------

    renderCardinalRays - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 


    displayOptions : { showAll : true }               
  
   --------------------------------------------------------------------------------------------------------------- */


  function drawCardinalRays(lens, conjObject, displayOptions) {

     // console.log(lens);

     console.log("draw cardinal rays.");


     cd_set.remove ();
     cd_set = paper.set();


     var N1 = lens.cardinal.VN1;
     var N2 = lens.L + lens.cardinal.VN2;
     var P1 = lens.cardinal.VP1;
     var P2 = lens.L + lens.cardinal.VP2;
     var F1 = lens.cardinal.VF1;
     var F2 = lens.L + lens.cardinal.VF2;

     // check if the system is AFOCAL 

     // Object 
     var X1 = conjObject.X1;
     var Y1 = conjObject.Y1;     

     // Image 
     var X2 = conjObject.X2;
     var Y2 = conjObject.Y2;

     // display the nodal rays (Obect => N1 N2 => Image )

     var attributes     = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1" };
     var virtual        = { "fill": "gray", "stroke-opacity": 0.5, "stroke": "black", "stroke-width": "1", "stroke-dasharray":"--" };
     var real           = { "stroke": "magenta", "stroke-width": "1", "stroke-dasharray":"none"  };
     var none           = { "stroke": "none", "stroke-width": "1" };
     var extend         = { "fill": "red", "stroke-opacity": 0.5, "stroke": "red", "stroke-width": "1" };
     var extend_object  = { "fill": "green", "stroke-opacity": 0.5, "stroke": "green", "stroke-width": "1" };


     data   = { N1 : N1, N2 : N2, 
                P1 : P1, P2 : P2, 
                F1 : F1, F2 : F2,
                X1 : X1, Y1 : Y1,
                X2 : X2, Y2 : Y2  };


  /*   -------------------------------------------------

      ConstructObjectRays 

  ------------------------------------------------------ */

   function ConstructObjectRays(data) {


      ret = {};
      
      if (data.X1 < data.P1) { // real object 

          // O < F1 < P1    or F1 < O1 < P1
          // O < F1 < P1    or F1 < O1 < P1
          // O < P < N  or O < N < P

          // F1 RAY O -> F1 -> P1
          if ((data.X1 < data.F1) & (data.F1 < data.P1)) {        // O < F1 < P1
              ret.F1 = { OF: real, FP: real, OP: none };

          } else if ((data.X1 < data.P1) & (data.P1 < data.F1)) { // O < P1 < F1 
              ret.F1 = { OF: none, FP: virtual, OP: real };

          } else if ((data.F1 < data.X1) & (data.X1 < data.P1)) { // F1 < O < P1 
              ret.F1 = { OF: none, FP: virtual, OP: real };

          } else {

             alert ("unmeasured");

          }



          // ... the region between P1 & P2 should be empty 
          if (data.P1 < data.P2) {
              // F2 RAY           
              ret.F2 = { OP1: real, OP2: none };
              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual }; // : { OP1: real, PN: virtual };

              
          } else {

              // F2 RAY           
              ret.F2 = { OP1: virtual, OP2: none };
              // N1 RAY 
              ret.N1 = { OP: real, PN: virtual }; // : { OP1: real, PN: virtual };

          }




      } else { // virtual object


          // F1 RAY
          // ret.F1 = (data.X1 < data.F1) ? { OF: real, OP: none, FP: real } : { OF: none, OP: virtual, FP: real };


          // F1 RAY : 
          if ((data.F1 < data.P1) & (data.P1 < data.X1)) {  // F1 < P1 < O
              ret.F1 = { OF: none, FP: real, OP: virtual }; // positive lens 
          } else if ((data.P1 < data.X1) & (data.X1 < data.F1)) {  // P1 < O < F1  
              ret.F1 = { OF: none, FP: none, OP: virtual };
          } else if ((data.P1 < data.X1) & (data.F1 < data.X1)) {  // P1 < F1 < O
              ret.F1 = { OF: virtual, FP: virtual, OP: none };
         } else {
             alert ("unmeasured");
          }



          // F2 RAY 
          // ... the region between P1 & P2 should be empty 
          if (data.P1 < data.P2) {              
              // F2 RAY  
              ret.F2 = { OP1: none, OP2: virtual };
              // N1 RAY 
              ret.N1 = { OP: virtual, PN: real }; // : { OP1: real, PN: virtual };

          } else {
              // F2 RAY  
              ret.F2 = { OP1: virtual, OP2: none };
              // N1 RAY (ADDRESS THIS LATER)
              ret.N1 = { OP: virtual, PN: none }; // : { OP1: real, PN: virtual };


          }


          // F1 < P1 < O  or P1 < F1 < O
          // O < F1 < P1  or F1 < O1 < P1
          // O < P < N  or O < N < P

          //ret.F1 = (X1 < F1) { OF1: none, FP1: real, OP1: virtual } : { OF1: virtual, OP1: none, FP1: real };
          //ret.F2 = (X1 < F1) { OF1: real, FP1: real, OP1: none } : { OF1: virtual, OP1: real, FP1: none };
          //ret.N1 = (X1 < N1) { OP1: real, PN1: virtual } : { OP1: real, PN1: virtual };

      }


     // Nodal ray height at the principal plane  
     // N1 RAY - ray through 1 to P1 
     H1 = (0 - data.Y1) / (data.N1 - data.X1 ) * (data.P1 - data.X1) + data.Y1;
     p1 = paper.path( ["M", data.X1, data.Y1, "L", data.P1, H1 ]);    // O  -> H1   (ray through F1)
     p2 = paper.path( ["M", data.P1, H1,  "L", data.N1, 0]);    // H1 -> N1   (ray through F1)
     p1.attr(ret.N1.OP);
     p2.attr(ret.N1.PN); 
     cd_set.push(p1, p2);

     // F1 RAY - ray through F1 to P1 
     p1 = paper.path( ["M", data.X1, data.Y1, "L", data.F1, 0 ]);        // O  -> F1   (ray through F1)
     p2 = paper.path( ["M", data.F1, 0,  "L", data.P1, data.Y2]);        // F1 -> P1   (ray through F1)
     p3 = paper.path( ["M", data.X1, data.Y1, "L", data.P1, data.Y2 ]);  // O  -> P1   (horizontal ray through F2)
     p1.attr(ret.F1.OF);
     p2.attr(ret.F1.FP); 
     p3.attr(ret.F1.OP); 
     cd_set.push(p1, p2, p3);

    // F2 RAY - ray through P2 to F2 
     p1 = paper.path( ["M", data.X1, data.Y1,  "L", data.P1, data.Y1 ]);   // O  -> P1   (ray through F1)
     p2 = paper.path( ["M", data.P2, data.Y1,  "L", data.X1, data.Y1 ]);   // P2 -> O   (ray through F1)
     p1.attr(ret.F2.OP1);
     p2.attr(ret.F2.OP2); 
     cd_set.push(p1, p2);



      return ret;
   }



    function getFrontFocalRayStyle(X1, F1, P1, X2) {

      /* ---------------------------------------------------

          GETRAYSTYLE 

          Appearance of the points 

      ------------------------------------------------------- */ 

          isExtend = (X1 > P1 - etol);

          if (X1 < F1) {

          // X1 -> F1 : real, F1 -> P1 : real, P1 => X2 : real 
          ret = { X1P1   : none,
                  X1F1   : real, 
                  F1P1   : real, 
                  P1X2   : real,        // deal with images separately 
                  extend : isExtend };

          } else if (X1 >=F1 & X1 <= P1 ) {

          // X1 -> F1 : virtual, F1 -> P1 : real, P1 => X2 : real 
          ret = { X1P1   : real,
                  X1F1   : none, 
                  F1P1   : none, 
                  P1X2   : isExtend ? real : virtual };


          } else if (X1 > P1 ) { 

          // X1 -> F1 : real, F1 -> P1 : real, P1 => X2 : virtual            
          ret = { X1P1   : virtual,
                  X1F1   : none,
                  F1P1   : real, 
                  P1X2   : real };

          } else {

            throw "Error";
          }


          ret.Extended = isExtend;

          return ret;
      }



    function getBackFocalRayStyle(X1, F1, P1, X2) {

      /* ---------------------------------------------------

          GETRAYSTYLE 

          Appearance of the points 

      ------------------------------------------------------- */ 

          isExtend = (X1 > P1 - etol);

          if (X1 < P1) {

          // X1 -> F1 : real, F1 -> P1 : real, P1 => X2 : real 
          ret = { X1P2   : real,
                  P2X2   : real, 
                  X2F2   : none,
                  F2P2   : none, 
                  extend : isExtend };

          } else if (X1 >= F1 & X1 <= P1 ) {

            // X1 -> F1 : real, F1 -> P1 : real, P1 => X2 : real 
            ret = { X1P2   : real,
                    P2X2   : virtual, 
                    X2F2   : none,
                    F2P2   : none, 
                    extend : isExtend };

          } else if (X1 > P1 ) { 

          // X1 -> F1 : real, F1 -> P1 : real, P1 => X2 : virtual   
          ret = { X1P2   : virtual,
                  P2X2   : real, 
                  X2F2   : none,
                  F2P2   : none, 
                  extend : isExtend };

          } else {

            throw "Error";
          }


          ret.Extended = isExtend;

          return ret;
      }






     // FINITE INFORMATION 

     var X1_attributes; 
     var X2_attributes;

/*

     // NODAL RAY 
     var N1_attributes, N2_attributes; 
     N1_attributes = (X1 <= N1) ? real : virtual;
     N2_attributes = (N2 <= X2) ? real : virtual;
     p1 = paper.path( ["M", X1, Y1, "L", N1, 0 ] ).attr(N1_attributes);
     p2 = paper.path( ["M", X2, Y2, "L", N2, 0 ] ).attr(N2_attributes);
     cd_set.push(p1, p2);
*/


     // FOCAL RAY - F2
/*     
     var P2_attributes, F2_attributes; 
     P2_attributes = (X1 <= P2) ? real : virtual;
     F2_attributes = (P2 <= F2) ? real : virtual;
     X2_attributes = (F2 <= X2) ? real : virtual;

     p3 = paper.path( ["M", X1, Y1, "L", P2, Y1] ).attr(P2_attributes);
     p4 = paper.path( ["M", P2, Y1, "L", F2, 0 ] ).attr(F2_attributes); // should apss through F2
     cd_set.push(p3, p4);


     if (F2 <= X2) {  

        // real image          
        p = paper.path( ["M", F2, 0, "L", X2, Y2 ] ).attr(X2_attributes); // should pass through F2
        cd_set.push (p);

     } else { 

        // virtual image 
        p = paper.path( ["M", P2, Y1, "L", X2, Y2 ] ).attr(X2_attributes); // should apss through F2
        cd_set.push (p);
     }
*/


     // back focal stle 



     ConstructObjectRays(data);


/*     
     p1.attr(objectRayStyle.X1P2);
     p2.attr(objectRayStyle.F2P2); // should apss through F2
     p3.attr(objectRayStyle.X2F2); // should pass through F2
     p4.attr(objectRayStyle.P2X2); // should apss through F2
     cd_set.push(p1, p2, p3, p4);

     if (objectRayStyle.Extended) { 

        // F2 ray 
        p = paper.path( ["M", P2, Y1, "L",  P2 - 20, Y1 ] ).attr(extend_object); // should apss through F2
        cd_set.push(p);
        
     };
*/

     /*
     if (F2 <= X2) {  

        // real image          
        p = paper.path( ["M", F2, 0, "L", X2, Y2 ] ).attr(X2_attributes); // should pass through F2
        cd_set.push (p);

     } else { 

        // virtual image 
        p = paper.path( ["M", P2, Y1, "L", X2, Y2 ] ).attr(X2_attributes); // should apss through F2
        cd_set.push (p);
     }
    */


     // FOCAL RAY - F1

     /*
     var P1_attributes, F1_attributes; 
     F1_attributes = (X1 <= F1) ? real : virtual;
     P1_attributes = (F1 <= P1) ? real : virtual;
     X2_attributes = (P1 <= X2) ? real : virtual;
     p1 = paper.path( ["M", X1, Y1, "L", F1, 0 ] ).attr(F1_attributes);   // F1 -> X1
     p2 = paper.path( ["M", X1, Y1,  "L", P1, Y2 ] ).attr(P1_attributes); // X1 -> P1  this one needs to be modified 
     p3 = paper.path( ["M", P1, Y2, "L", X2, Y2 ] ).attr(X2_attributes);  // P1 -> X2
     cd_set.push(p1, p2, p3);
    */

/*
     p1 = paper.path( ["M", X1, Y1, "L", F1, 0 ] );   //.attr(objectRayStyle.X1F1);   // F1 -> X1
     p2 = paper.path( ["M", F1, 0,  "L", P1, Y2 ] ); //.attr(objectRayStyle.F1P1); // X1 -> P1  this one needs to be modified 
     p3 = paper.path( ["M", P1, Y2, "L", X2, Y2 ] );  //.attr(objectRayStyle.P1X2);  // P1 -> X2
     p4 = paper.path( ["M", P1, Y2, "L", X1, Y1 ] );  //.attr(objectRayStyle.P1X2);  // P1 -> X2

     objectRayStyle = getFrontFocalRayStyle(X1, F1, P1, X2);
     p1.attr(objectRayStyle.X1F1); // F1 -> X1
     p2.attr(objectRayStyle.F1P1); // X1 -> P1  this one needs to be modified 
     p3.attr(objectRayStyle.P1X2); // P1 -> X2
     p4.attr(objectRayStyle.X1P1); // X1 -> P1          
     cd_set.push(p1, p2, p3, p4);

     if (objectRayStyle.Extended) { 
        var m = (Y1-0)/(X1-F1);
        p = paper.path( ["M", F1, 0, "L",  F1 - 20, 0 - m*20 ] ).attr(extend_object); // should pass through F1
        cd_set.push(p);
     };

*/

/*

     // Virtual IMAGE = extension rays for virtual images  
     if (X2 < P2 + etol) { // virtual 

        // virtual image - add extension ray 

        // F1 ray         
        var m = (Y2-0)/(X2-F2);
        p = paper.path( ["M", F2, 0, "L",  F2 + 20, 0 + m*20 ] ).attr(extend); // should apss through F2
        cd_set.push(p);

        // F2 ray 
        p = paper.path( ["M", P1, Y2, "L",  P1 + 20, Y2 ] ).attr(extend); // should apss through F2
        cd_set.push(p);
        
        // N2 ray 
        var m = (Y2-0)/(X2-N2);
        console.log("m = " + m);
        p = paper.path( ["M", N2, 0, "L",  N2 + 20, 0 + m*20 ] ).attr(extend); // should apss through F2
        cd_set.push(p);

     }

*/


     // VIRTUAL OBJECT : extension rays for virtual objects   

/*

     if (objectRayStyle.Extended) { 


        // F1 ray         
        var m = (Y1-0)/(X1-F1);
        p = paper.path( ["M", F1, 0, "L",  F1 - 20, 0 - m*20 ] ).attr(extend_object); // should pass through F1
        cd_set.push(p);

        // F2 ray 
        p = paper.path( ["M", P2, Y1, "L",  P2 - 20, Y1 ] ).attr(extend_object); // should apss through F2
        cd_set.push(p);
        
        // N1 ray 
        var m = (Y1-0)/(X1-N1);
        console.log("m = " + m);
        p = paper.path( ["M", N1, 0, "L",  N1 - 20, 0 - m*20 ] ).attr(extend_object); // (X1, Y1) => (N1,0)
        cd_set.push(p);

     }

*/

      // display the two focal rays 
      // 
      // F2: (Object => PF2 PF2 => Image )
      // F1: (Object => PF1 PF1 => Image )
      //

  }





  
  /* ---------------------------------------------------------------------------------------------------------------

    renderPointToPoint - render the finite object / image conjugates given a processed pointList

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 
  
   --------------------------------------------------------------------------------------------------------------- */


  function drawPointToPoint(data, dataOptions) {

    ps.remove ();
    ps = paper.set();

    // show the object points for all points 
    for (var i = 0; i < data.length; i++ ) {

        var X1 = data[i].X1;
        var Y1 = data[i].Y1;
        if (isFinite(X1) & isFinite(Y1)) {
          console.log('X1 = ' + X1 + ' Y1 = '+ Y1);
          c = drawPoint(X1, Y1, "cyan");         
          ps.push(c); 
        }
   }

   var X2 = data[data.length-1].X2;
   var Y2 = data[data.length-1].Y2;
   if (isFinite(X2) & isFinite(Y2)) {
      console.log('X2 = ' + X2 + ' Y2 = '+ Y2);
      c = drawPoint(X2, Y2, "cyan");          
      ps.push(c); 
    }

  }



  function updatePointToPoint () {
      // cycle through the cp_set if its not empty and alter all circles !
      if (!Array.isArray(ps) || !ps.length) { // array does not exist, is not an array, or is empty
        ps.attr({r: kx*4});
      }

  }




  /* ---------------------------------------------------------------------------------------------------------------

    renderOptics - render the lens list with cardinal points 

    TO DO:

    dataOption - ignore intermediate object/image points 
               - intermediate rays 
  
   --------------------------------------------------------------------------------------------------------------- */


  function drawOptics(data) {

    optics_set.remove();
    optics_set = paper.set();

    displayOptions = { height               : 0.5, 
                       showCardinalPoints   : true,
                       showFocalPoints      : true,
                       showNodalPoints      : true, 
                       showPrincipalPoints  : true, 
                       showVertices         : true,
                       showPupils           : true  };


    var cardinalPoints = [];


    // only render surface elements 
    for (var i=1; i< data.elem.length; i=i+2) {

      axialPosition   = data.elem[i].Z;
      cardinalPoints  = data.elem[i].cardinal; 
      equivalentPower = data.elem[i].F;

      curr = data.elem[i].elem;
      console.log(curr);

      switch (curr.type) {

        case "thin":

          height = curr.height;
          l = drawThinLens(axialPosition, 0, equivalentPower, height, displayOptions);
          optics_set.push(l);
          break;

        case "sphere":
          var R = curr.radius; h = curr.height;
          l = drawSurface(axialPosition, 0, R, h); //, displayOptions);
          optics_set.push(l);        
          break;

        case "img":
          var R = curr.radius; h = curr.height;
          l = drawSurface(axialPosition, 0, R, h); //, displayOptions);
          optics_set.push(l);        
          break;



        default:

      }
    }




    // show the overall cardinal points not the individual ones 
    //systemPoints = data.total;
    //c = drawCardinalPoints (0, 0, systemPoints, displayOptions);
    //optics_set.push(c);

  }


  /* ---------------------------------------------------------------------------------------------------------------

    MOUSE-HANDLER FOR SETTING UP THE SYSTEM 

    Setup and show the system  
  
   --------------------------------------------------------------------------------------------------------------- */

   var callbackList = [];
   function RegisterWheelCallback (info) {
      callbackList.push(info);
      transformScalableObject(info);
   }



  /* ---------------------------------------------------------------------------------------------------------------

    MOUSE-HANDLER FOR SETTING UP THE SYSTEM 

    Setup and show the system  
  
   --------------------------------------------------------------------------------------------------------------- */


  var paper;
  var viewBoxWidth;
  var viewBoxHeight;
  var canvasID = "#canvas_container";
  var viewBox;
  var startX, startY;
  var mousedown = false;
  var dX, dY;
  var gridLayer;


  var isMouseDown = false;

    //Pane
   panStart = function (e) {

        console.log("pan start");


        if (e.target.tagName !== "svg") {
          console.log("dont allow pan.");
          return;
        }



        isMouseDown = true;

        console.log(e);

        // differentiate
        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var touch = e.touches[0] || e.changedTouches[0];
            startX = touch.pageX;
            startY = touch.pageY;
          } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            startX = e.pageX;
            startY = e.pageY;
          }

    };

  panMove = function (e) {
        
        if (!isMouseDown) { return; }

        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var touch = e.touches[0] || e.changedTouches[0];
            dX = kx*(startX - touch.pageX);
            dY = kx*(startY - touch.pageY);
          } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            //startX = e.pageX;
            //startY = e.pageY;
            dX = kx*(startX - e.pageX);
            dY = kx*(startY - e.pageY);
          }




        //x = viewBoxWidth / paper.width;
        //y = viewBoxHeight / paper.height;
        //dX *= x;
        //dY *= y;

        console.log("Information");

        console.log(viewBox.X);
        console.log(viewBox.Y);

        console.log(viewBoxWidth);
        console.log(viewBoxHeight);

        console.log(dX);
        console.log(dY);


        console.log(e);
        console.log(kx);        
        console.log(kx);
        console.log(startX);        
        console.log(startY);

        //alert(viewBoxWidth +" "+ paper.width );
        paper.setViewBox(viewBox.X + dX, viewBox.Y + dY, viewBoxWidth, viewBoxHeight);
        // bgRect.translate(dX, dY);

    };

  panEnd = function (e) {
        
        if (!isMouseDown) return;

        console.log("panEnd");

        viewBox.X += dX;
        viewBox.Y += dY;
        isMouseDown = false;

    };



  /* ---------------------------------------------------------------------------------------------------------------

    HANDLER TO PERFORM A ZOOM  

    Setup and show the system  
  
   --------------------------------------------------------------------------------------------------------------- */


    function transformScalableObject (curr) {


              //console.log(curr.type);
              switch (curr.type) {

                  case "text" :

                    var x = curr.handle.attr("x");             
                    var y = curr.handle.attr("y");     

                    var anchorDirection = curr.handle.attr("text-anchor");

                    switch (anchorDirection) {

                      case "start":
                        curr.handle.transform([ "t", x, y, "s", kx*20, ky*20, "0","0", "t", 0.5, 0 ]);
                        break;

                      case "end":
                        curr.handle.transform([ "t", x, y, "s", kx*20, ky*20, "0","0", "t", -0.5, 0 ]);
                        break;

                      case "middle":
                        var dY = curr.handle.data("data-shift-Y");
                        //console.log(curr.handle);
                        //console.log(dY);                        
                        curr.handle.transform([ "t", x, y, "s", kx*20, ky*20, "0","0", "t", 0, dY]);
                        break;


                      default:
                        curr.handle.transform([ "t", x, y, "s", kx*20, ky*20, "0","0" ]);

                    }


                    //console.log("Anchor Direction = " + anchorDirection + " kx = " + kx);


                    break;

                  case "point" :
                    //kx = 100;
                    curr.handle.attr({r: kx*4});
                    break;

                  default:
                    //console.log("well lets see");
                    curr.handle.attr({r: kx*4});


              }

    }



 /** This is high-level function.
     * It must react to delta being more/less than zero.
     */
    function handle(delta) {
        
        vBHo = viewBoxHeight;
        vBWo = viewBoxWidth;
        if (delta < 0) {
            viewBoxWidth *= 0.95;
            viewBoxHeight *= 0.95;
        } else {
            viewBoxWidth *= 1.05;
            viewBoxHeight *= 1.05;
        }
       
        viewBox.X -= (viewBoxWidth - vBWo) / 2;
        viewBox.Y -= (viewBoxHeight - vBHo) / 2;
        paper.setViewBox(viewBox.X, viewBox.Y, viewBoxWidth, viewBoxHeight);
        setScaleFactor ();
        drawAxis();
        //updateCardinalPoints (); // if any
        //updatePointToPoint ();


        //console.log("WHEEL");
        for (var i = 0; i < callbackList.length ; i++) {
          // curr = callbackList[i];
          transformScalableObject(callbackList[i]);
        }


        // cycle through points Registered to stay the same size 



    }




    /** Event handler for mouse wheel event.
     */


    /** Initialization code. 
     * If you use your own event management code, change it as required.
     */


/*
    if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', wheel, false);
      window.onmousewheel = document.onmousewheel = wheel;

    };  
*/

/* --------------------------------------------------------------

OLDER STUFF 

------------------------------------------------------------------ */


function arc(center, radius, startAngle, endAngle) {
    angle = startAngle;
    coords = toCoords(center, radius, angle);
    path = "M " + coords[0] + " " + coords[1];
    while(angle<=endAngle) {
        coords = toCoords(center, radius, angle);
        path += " L " + coords[0] + " " + coords[1];
        angle += 1;
    }
    return path;
}

function toCoords(center, radius, angle) {
    var radians = (angle/180) * Math.PI;
    var x = center[0] + Math.cos(radians) * radius;
    var y = center[1] + Math.sin(radians) * radius;
    return [x, y];
}


