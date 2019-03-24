  var lens_edge       = { "stroke": "black", "stroke-width": "2", "stroke": "black", "stroke-dasharray":"none"  };
  

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


  var ps, cd_set, axis_set;
  var cp_set, optics_set;



  function setScaleFactor() {

  // virtual unit / pixel unit 
  paperWidth  = $("#lens-container").width(); 
  paperHeight = $("#lens-container").height(); 
  kx = viewBoxWidth/paperWidth;     // scaling to viewbox 
  ky = viewBoxHeight/paperHeight;   // scaling to viewbox 


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

       
        oWidth = viewBoxWidth, oHeight = viewBoxHeight;
        var oX = -viewBoxWidth/2, oY = -viewBoxHeight/2, oWidth = viewBoxWidth, oHeight = viewBoxHeight;        
        viewBox   = paper.setViewBox(oX, oY, viewBoxWidth, viewBoxHeight);
        viewBox.X = oX; viewBox.Y = oY;


        setScaleFactor ();

        // draw the axis 
        drawAxis(paper, true,0);

      

  }




/* draw axis on a raphael canvas
  r - the Raphael canvas to draw on
  grid - true/false draws a grid or not
  offset - how far from 0,0 to draw the axis - they show better at 2
*/

var axis_set; 

var drawAxis = function (r, grid, offset) {
  
  var g = grid || false;
  var o = offset || 0.1;


  // use divisions of 1, 5, 10, 15, 20  (try to keep as close to x number of divisions)

  // viewBox.X, viewBox.Y, viewBoxWidth, viewBoxHeight

  // Width 
  var left    = viewBox.X;
  var top     = viewBox.Y;
  var width   = viewBoxWidth;
  var height  = viewBoxHeight;
  var right   = left + width;
  var bottom  = top + height;

  
  console.log("left = " + viewBox.X + " top = " + viewBox.Y + " width = " + viewBoxWidth + " height = " + viewBoxHeight);

  // divSize 
  var divs    = Math.floor ( width / 20 );           // 20 divs on screen  
  var divSize = Math.max(1, 5*Math.floor(divs/5) );  // approximate div. size 



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

  if (grid) {

      axis_set.remove();
      axis_set = paper.set();
      

      // Draws a border 
      // axis_set.push( r.rect(left, top, width, height).attr(border_attributes) );

      // grid vertical       
      X = 0; 
      while (X <= right + dX) {
        axis_set.push( r.path("M"+X+","+(top-dY)+"L"+X+","+(bottom+dY)).attr(grid_attributes) );
        axis_set.push( r.path("M"+-X+","+(top-dY)+"L"+-X+","+(bottom+dY)).attr(grid_attributes) );        
        X = X + divSize;
      }

      // grid horizontal
      Y = 0;
      while (Y <= bottom + dY) {
        axis_set.push( r.path("M"+(left-dX)+","+-Y+"L"+(right+dX)+","+-Y).attr(grid_attributes) );
        axis_set.push( r.path("M"+(left-dX)+","+Y+"L"+(right+dX)+","+Y).attr(grid_attributes) );
        Y = Y + divSize;
      }

    }


  axis_set.toBack ();

 }




  /* THESE ARE DRAWING FUNCTIONS */



  function drawCardinalPoints(x, y, systemPoints, displayOptions) {

    console.log("Updated cardinal points.");

    cp_set.remove();
    cp_set = paper.set();

    var cp;


    var v1 = x + 0;                   // front vertex 
    var v2 = x + systemPoints.L;
    var h  = 2*displayOptions.height;   // back vertex 



    // nodal points
    if (displayOptions.showVertices) {
          
          // points           
          var vn1 = systemPoints.cardinal.VN1;
          var vn2 = systemPoints.cardinal.VN2;
          cp1 = drawPoint(v1, 0, "black");
          cp2 = drawPoint(v2, 0, "black");
          cp_set.push(cp1, cp2);

          // lines 
          var y = 0;
          var x1 = v1
          var x2 = v2;
          var y1 = y - h/2;
          var y2 = y + h/2;


          //cp1 = drawText(x1 - 3*cp1.attr("r"), y - 6*cp1.attr("r"), "A");
          //cp2 = drawText(x2 + 3*cp2.attr("r"), y - 6*cp2.attr("r"), "A'");
          //cp_set.push(cp1, cp2);


          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

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

          //cp1 = drawPoint(x1, y, "magenta");
          //cp2 = drawPoint(x2, y, "magenta");
          //cp_set.push(cp1, cp2);

          cp1 = drawText(x1, y - 6*cp1.attr("r"), "F");
          cp2 = drawText(x2, y - 6*cp2.attr("r"), "F'");
          cp_set.push(cp1, cp2);

          //cp1 = paper.text(x1, y, "F").attr({fill: '#000000'});
          //cp2 = paper.text(x2, y, "F'").attr({fill: '#000000'});
          //cp_set.push(cp1, cp2);


          // BARS
          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"gray": "#000000", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

        }

        // nodal points
        if (displayOptions.showNodalPoints) {
          
          // points           
          var vn1 = systemPoints.cardinal.VN1;
          var vn2 = systemPoints.cardinal.VN2;
          cp1 = drawPoint(v1 + vn1, y, "blue");
          cp2 = drawPoint(v2 + vn2, y, "blue");
          cp_set.push(cp1, cp2);

          // lines 
          var x1 = v1 + vn1;
          var x2 = v2 + vn2;
          var y1 = y - h/2;
          var y2 = y + h/2;


          if (Math.abs(x1-x2) < 6*cp1.attr("r")) {

              if (x1 <= x2) {
                  cp1 = drawText((x1+x2)/2, y - 6*cp1.attr("r"), "N/N'");
              } else {
                  cp1 = drawText((x1+x2)/2, y - 6*cp1.attr("r"), "N'/N");
              }

              cp_set.push(cp1, cp2);

          } else {

              // nodal points 
              cp1 = drawText(x1, y - 6*cp1.attr("r"), "N");
              cp2 = drawText(x2, y - 6*cp2.attr("r"), "N'");            
              cp_set.push(cp1, cp2);

          }


/*
          cp1 = drawText(x1, y - 6*cp1.attr("r"), "N");
          cp2 = drawText(x2, y - 6*cp2.attr("r"), "N'");
          cp_set.push(cp1, cp2);
*/

          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

        }

        // nodal points
        if (displayOptions.showPrincipalPoints) {

          // points 
          var vp1 = systemPoints.cardinal.VP1;
          var vp2 = systemPoints.cardinal.VP2;
          cp1 = drawPoint(v1 + vp1, y, "red");
          cp2 = drawPoint(v2 + vp2, y, "red");
          cp_set.push(cp1, cp2);

          // lines 
          var x1 = v1 + vp1;
          var x2 = v2 + vp2;
          var y1 = y - h/2;
          var y2 = y + h/2;


          if (Math.abs(x1-x2) < 6*cp1.attr("r")) {

              if (x1 <= x2) {
                  cp1 = drawText((x1+x2)/2, y + 6*cp1.attr("r"), "P/P'");
              } else {
                  cp1 = drawText((x1+x2)/2, y + 6*cp1.attr("r"), "P'/P");
              }

              cp_set.push(cp1, cp2);

          } else {
              // principal points 
              cp1 = drawText(x1, y + 6*cp1.attr("r"), "P");
              cp2 = drawText(x2, y + 6*cp2.attr("r"), "P'");            
              cp_set.push(cp1, cp2);

          }

          cp1 = paper.path( ["M", x1, y1, "L", x1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", x2, y1, "L", x2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

        }

        // vertices
        if (displayOptions.showVertices) {

          // points 
          cp1 = drawPoint(v1 + vn1, y, "green");
          cp2 = drawPoint(v2 + vn2, y, "green");
          cp_set.push(cp1, cp2);

          // lines 
          var y1 = y - h/2;
          var y2 = y + h/2;
          cp1 = paper.path( ["M", v1, y1, "L", v1, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp2 = paper.path( ["M", v2, y1, "L", v2, y2 ] ).attr({"fill": "gray", "stroke-opacity": 0.5, "stroke": "gray", "stroke-width": "1", "stroke-dasharray":"--"});
          cp_set.push(cp1, cp2);

        }

    }


  }


  function updateCardinalPoints () {
      // cycle through the cp_set if its not empty and alter all circles !
      if (!Array.isArray(cp_set) || !cp_set.length) { // array does not exist, is not an array, or is empty
        cp_set.attr({r: kx*4});
      }

  }





  /* DRAW LENS TYPES   */


  function drawSurface(x, y, R, h, displayOptions) {

    var lens = paper.set();
    var r = Math.abs(R);

    // draw a path 
    var h = Math.min(h, 0.9*2*r, displayOptions.height);
    var c = paper.path( ["M", x, y-h/2, "L", x, y+h/2  ] );
    lens.push(c);

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




  /* DRAW LENS TYPES   */



  function drawThinLens(x, y, F, displayOptions) {

    var lens = paper.set();

    // draw a path 
    var h = displayOptions.height; 
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
      
      c1 = paper.circle(x, y + h/2, 0.1);
      c2 = paper.circle(x, y - h/2, 0.1);      

      lens.push(c1, c2);

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
    c.transform([  "t",x,y, "s", 0.01,0.01,0,0]);

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


    var c = paper.circle(x, y, r).attr({"fill": color, "fill-opacity": 1.0, "stroke": "#000000", "stroke-width": "1"});

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
          if ((data.F1 < data.P1) & (data.P1 < data.X1)) {         // F1 < P1 < O

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
                       showVertices         : true };


    var cardinalPoints = [];

    //console.log(data);

    // only render surface elements 
    for (var i=1; i< data.elem.length; i=i+2) {

      axialPosition   = data.elem[i].Z;
      cardinalPoints  = data.elem[i].cardinal; 
      equivalentPower = data.elem[i].F;

      curr = data.elem[i].elem;
      console.log(curr);

      switch (curr.type) {

        case "thin":
          l = drawThinLens(axialPosition, 0, equivalentPower, displayOptions);
          optics_set.push(l);
          break;

        case "sphere":
          var R = curr.radius; h = curr.height;
          l = drawSurface(axialPosition, 0, R, h, displayOptions);
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


  var paper;
  var viewBoxWidth;
  var viewBoxHeight;
  var canvasID = "#canvas_container";
  var viewBox;
  var startX, startY;
  var mousedown = false;
  var dX, dY;
  var gridLayer;


    //Pane
   dragStart = function (e) {

        console.log("Mouse down");

        if (paper.getElementByPoint(e.pageX, e.pageY) != null) {
            return;
        }
        mousedown = true;
        startX = e.pageX;
        startY = e.pageY;
    };

  dragMove = function (e) {
        
        if (mousedown == false) {
            return;
        }
        dX = startX - e.pageX;
        dY = startY - e.pageY;
        x = viewBoxWidth / paper.width;
        y = viewBoxHeight / paper.height;

        dX *= x;
        dY *= y;
        //alert(viewBoxWidth +" "+ paper.width );

        paper.setViewBox(viewBox.X + dX, viewBox.Y + dY, viewBoxWidth, viewBoxHeight);

       

        // bgRect.translate(dX, dY);

    };

  dragEnd = function (e) {
        if (mousedown == false) return;
        viewBox.X += dX;
        viewBox.Y += dY;
        mousedown = false;

    };


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

        drawAxis(paper, true,0);
        setScaleFactor ();
        updateCardinalPoints (); // if any
        updatePointToPoint ();

    }

    /** Event handler for mouse wheel event.
     */
    function wheel(event) {
        var delta = 0;
        if (!event) /* For IE. */
        event = window.event;
        if (event.wheelDelta) { /* IE/Opera. */
            delta = event.wheelDelta / 120;
        } else if (event.detail) { /** Mozilla case. */
            /** In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            delta = -event.detail / 3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta) handle(delta);
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (event.preventDefault) event.preventDefault();
        event.returnValue = false;
    }




    /** Initialization code. 
     * If you use your own event management code, change it as required.
     */

    if (window.addEventListener) {


      /** DOMMouseScroll is for mozilla. */
      window.addEventListener('DOMMouseScroll', wheel, false);
      /** IE/Opera. */
      window.onmousewheel = document.onmousewheel = wheel;



    };  


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


