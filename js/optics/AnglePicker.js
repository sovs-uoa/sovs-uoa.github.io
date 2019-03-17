
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
}

function movePicker(dx,dy) {

    console.log("--- called move picker id = " + this.id);  

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
    
    //nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
    //nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;
    //console.log(extender);
    //console.log(mydata);


    var extender = this.data("data-extender"); 
    a.parent.extender.attr("path", ["M", anchorX, anchorY, "L", nowX, nowY ]);  
    th = rad2deg(Math.atan2(nowY-anchorY, nowX-anchorY));    
    a.parent.angle = th;
    a.parent.moveFunc(th);
}


function upPicker() {

    console.log("--- called up picker id = " + this.id);  
    var a       = this.data("internal-data-attr");
    anchorX     = a.anchorX;
    anchorY     = a.anchorY;

    // information 
    a.parent.upFunc();


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
        this.anchorX;
        this.anchorY;
        this.angle = theta;        
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

   }



    data (...args) {

        console.log(args);
        console.log("data AnglePicker stored");
        console.log("name = " + args[0] + " value = " + args[1]);
        console.log(args[1]);
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
      var cx = this.clicker.attr("cx");
      var cy = this.clicker.attr("cy");      
      this.extender.attr({ "path": ["M", anchorX, anchorY, "L", cx, cy ]});

      console.log(this.extender);

      console.log("set anchor called ...");
      console.log("cx = " + cx);
      console.log("cy = " + cy);
      console.log("anchorX = " + anchorX);
      console.log("anchorY = " + anchorY);
    }


    addAnglePicker(anchorX, anchorY, radius, theta) {

      var point    = polar2cartesian(radius, deg2rad(theta));
      var x        = anchorX + point.x;
      var y        = anchorY + point.y;

      this.extender = paper.path(["M", anchorX, anchorY, "L", x, y ]);
      this.extender.attr({ "stroke-dasharray":"--" });

      // baseic dragger information on the clicke   
      this.clicker    = drawPoint (x, y, "green");
      this.clicker.data("data-extender", this.extender);
      this.clicker.drag(movePicker, startPicker, upPicker);

      //this.myset.push(extender, clicker);      
      //this.myset.drag(movePicker, startPicker, upPicker);
    }



  }