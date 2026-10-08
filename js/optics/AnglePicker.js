
/* -------------------------------------------------------------------------------

*/

function startPicker() {

      console.log("--- called start picker id = " + this.id);  
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");

      a = this.data("internal-data-attr");     
      anchorX = a.anchorX;
      anchorY = a.anchorY;
      a.parent.angle = rad2deg(Math.atan2(this.ox-anchorY, this.ox-anchorX));
      a.parent.startFunc();

      setGrabbingCursor(true);
}

function movePicker(dx,dy) {

    //console.log("--- called move picker id = " + this.id);  

    //anchorX  = this.anchorX;
    //anchorY  = this.anchorY;
    //distance = this.distance;
    //angle    = this.angle;

    dx = kx*dx; 
    dy = ky*dy;


    nowX = this.ox + dx;
    nowY = this.oy + dy;

    var a = this.data("internal-data-attr");

    anchorX = a.parent.anchorX; 
    anchorY = a.parent.anchorY;
    this.attr({ cx: nowX, cy: nowY }); // call the circle 
    a.parent.syncHit();
    var extender = this.data("data-extender"); 

    a.parent.extender.attr("path", ["M", anchorX, anchorY, "L", nowX, nowY ]);  
    th = rad2deg(Math.atan2(nowY-anchorY, nowX-anchorX));    


    // Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));

    var radius = Math.sqrt( Math.pow(nowY-anchorY, 2) + Math.pow(nowX-anchorX, 2) );
    //console.log("move-picker: radius = " + radius);

    a.parent.angle  = th;
    a.parent.radius = radius;
    a.parent.moveFunc(th); // onAfocalMove


}


function upPicker() {

    console.log("--- called up picker id = " + this.id);  
    var a       = this.data("internal-data-attr");
    anchorX     = a.anchorX;
    anchorY     = a.anchorY;

    // information
    a.parent.upFunc();

    setGrabbingCursor(false);

}




/*

moveAnglePicker(dx, dy) {

  console.log("--- called move picker id = " + eleminfo.id + "(" + this.id + ")");  

  dx = kx*dx; 
  dy = ky*dy;

  nowX = this.ox + dx;
  nowY = this.oy + dy;

  nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
  nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

  this.attr({ cx: nowX, cy: nowY });
  
}

  
function start () {

    console.log("--- called start point id = " + this.id);  

    // storing original coordinates
    this.ox = this.attr("cx");
    this.oy = this.attr("cy");

}


function up () {

    console.log("--- called up point id = " + this.id);  

}

*/


/* -------------------------------------------------------------------------------------------------------- 

  Raphael.js tidy ups 

 -------------------------------------------------------------------------------------------------------- */

/*

Raphael.st.draggable = function(moveFnc, startFnc, endFnc) {
  var me = this,
      lx = 0,
      ly = 0,
      ox = 0,
      oy = 0;

  this.drag(moveFnc, startFnc, endFnc); // attaches individually!
};
*/


/* -------------------------------------------------------------------------------------------------------- 

  AnglePicker 

 -------------------------------------------------------------------------------------------------------- */

class AnglePicker { // create a ray construction using raphael.js


	 constructor(anchorX, anchorY, radius, theta) {

    	 	// global paper 
        this.clicker;  // a clickable point 
        this.extender; // an extension from the clicker 
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        
        this.angle  = theta;        
        this.radius = radius;
        // this.myset = paper.set();

        this.startFunc = function ()   { console.log("angle picker start."); };
        this.moveFunc  = function (th) { console.log("angle picker move = " + th); };
        this.upFunc    = function ()   { console.log("angle picker end."); };

        this.addAnglePicker (anchorX, anchorY, radius, theta);
        this.clicker.data("internal-data-attr", { anchorX : anchorX, anchorY: anchorY, parent:this });      

    }


    delete () {
      // this.cd_set.remove();
      this.extender.remove();
      this.clicker.remove();
      if (this.hit) { this.hit.remove(); }

   }


    hide () {
      this.extender.hide();
      this.clicker.hide();
      if (this.hit) { this.hit.hide(); }
      this.clicker.attr({ "pointer-events": "none" }); // stays undraggable while hidden
    }


    show () {
      this.extender.show();
      this.clicker.show();
      if (this.hit) { this.hit.show(); }
      this.clicker.attr({ "pointer-events": "" });
    }



    // keep the invisible target on the handle
    syncHit () {
      if (!this.hit) { return; }
      this.hit.attr({ cx: this.clicker.attr("cx"), cy: this.clicker.attr("cy") });
      this.hit.toFront();
    }


    data (...args) {

        //console.log(args);
        //console.log("data AnglePicker stored");
        //console.log("name = " + args[0] + " value = " + args[1]);
        //console.log(args[1]);
        if (args.length > 1 && this.hit) { this.hit.data(...args); }   // (so the target knows what it belongs to, too)
        return this.clicker.data(...args); 
    }

/*
        "data-attr", {  "conjugate_id"  : "point-" + this.data.id + "-image",
                                                "id"            : this.data.id, 
                                                "type"          : "object",
                                                "parent"        : this });
*/
  


    drag(onmove, onstart, onup) {

        this.startFunc = onstart;
        this.moveFunc  = onmove;
        this.upFunc    = onup;

    }


    setAnchor (anchorX, anchorY) {
      this.anchorX = anchorX;
      this.anchorY = anchorY;

      // re-derive the clicker's position from the (unchanged) angle/radius relative to
      // the NEW anchor - it used to just redraw the line from the new anchor to wherever
      // the clicker already was (relative to the OLD anchor, or the origin on first
      // construction), leaving the handle mispositioned/near-degenerate.
      var radius = this.radius;
      var theta  = this.angle;
      var point  = polar2cartesian(radius, deg2rad(theta));
      var x      = anchorX + point.x;
      var y      = anchorY + point.y;

      this.clicker.attr({ cx: x, cy: y });
      this.extender.attr({ "path": ["M", anchorX, anchorY, "L", x, y ]});


      this.extender.toFront();
      this.clicker.toFront(); this.syncHit();

    }


    setLength (length) {

      this.radius = length;
      var theta   = this.angle;
      var anchorX = this.anchorX;
      var anchorY = this.anchorY;
      var point   = polar2cartesian(length, deg2rad(theta));
      var x       = anchorX + point.x;
      var y       = anchorY + point.y;


      // ... this should change the position of the picker
      this.clicker.attr({ cx: x, cy: y });
      this.extender.attr("path", ["M", anchorX, anchorY, "L", x, y ]);


      this.extender.toFront();
      this.clicker.toFront(); this.syncHit();


    }


    setAngle (theta) {

      this.angle = theta;
      var anchorX = this.anchorX;
      var anchorY = this.anchorY;
      var radius  = this.radius;
      var point   = polar2cartesian(radius, deg2rad(theta));
      var x       = anchorX + point.x;
      var y       = anchorY + point.y;

      // ... this should change the position of the picker
      this.clicker.attr({ cx: x, cy: y });
      this.extender.attr("path", ["M", anchorX, anchorY, "L", x, y ]);

      this.extender.toFront();
      this.clicker.toFront(); this.syncHit();

    }


    getRadius () {

      var anchorX = this.anchorX;
      var anchorY = this.anchorY;
      var cx  = this.clicker.attr("cx");
      var cy  = this.clicker.attr("cy");      
      var radius  = Math.sqrt( (cx - anchorX)^2 + (cy - anchorY)^2);

      return radius;
    }

    addAnglePicker(anchorX, anchorY, radius, theta) {

      var point    = polar2cartesian(radius, deg2rad(theta));
      var x        = anchorX + point.x;
      var y        = anchorY + point.y;

      this.anchorX = anchorX;
      this.anchorY = anchorY;
 
      this.radius = radius;
      this.angle  = theta;        
 

      this.extender = paper.path(["M", anchorX, anchorY, "L", x, y ]);
      this.extender.attr({ "stroke-dasharray":"--" });

      // baseic dragger information on the clicke
      this.clicker    = drawPoint (x, y, "green");
      this.clicker.attr({ cursor: "grab" });
      this.clicker.data("data-extender", this.extender);
      this.clicker.drag(movePicker, startPicker, upPicker);

      RegisterWheelCallback({ type: "point", handle: this.clicker });

      // A bigger, invisible target round the handle so it is easy to catch: pressing on it presses the handle. While
      // the pointer is over it the handle swells a little.
      var self = this;
      this.hit = paper.circle(x, y, kx * 11);
      this.hit.attr({ fill: "#000", "fill-opacity": 0.001, stroke: "none", cursor: "grab" });
      this.hit.node.addEventListener("mousedown", function (e) {
        e.stopPropagation();
        self.clicker.node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window, button: e.button,
                                                                       clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY }));
      });
      this.hit.node.addEventListener("mouseover", function () { self.clicker.attr({ r: kx * 6 }); });
      this.hit.node.addEventListener("mouseout",  function () { self.clicker.attr({ r: kx * 4 }); });
      RegisterWheelCallback({ type: "hit", handle: this.hit });

      this.extender.toFront();
      this.clicker.toFront(); this.syncHit();


      //this.myset.push(extender, clicker);      
      //this.myset.drag(movePicker, startPicker, upPicker);
    }



  }