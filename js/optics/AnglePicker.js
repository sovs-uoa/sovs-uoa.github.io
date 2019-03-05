
/* -------------------------------------------------------------------------------

*/

function startPicker() {

      console.log("--- called start picker id = " + this.id);  

      console.log(this.data("myset"));

      // storing original coordinates
      this.ox = this.attr("cx");
      this.oy = this.attr("cy");
}

function movePicker(dx,dy) {

    console.log("--- called move picker id = " + this.id);  

    //anchorX  = this.anchorX;
    //anchorY  = this.anchorY;
    //distance = this.distance;
    //angle    = this.angle;

    dx = kx*dx; 
    dy = ky*dy;

    var mydata   = this.data("data-attr");
    var extender = this.data("data-extender");

    nowX = this.ox + dx;
    nowY = this.oy + dy;
    
    //nowX = Math.round(nowX / gridSnapSize) * gridSnapSize;
    //nowY = Math.round(nowY / gridSnapSize) * gridSnapSize;

    console.log(extender);
    console.log(mydata);

    this.attr({ cx: nowX, cy: nowY }); // call the circle 
    extender.attr("path", ["M", mydata.anchorX, mydata.anchorY, "L", nowX, nowY ]);  



     // update the path !4 
    //this.attr({ cx: nowX, cy: nowY });

}


function upPicker() {

      console.log("--- called up picker id = " + this.id);  

    anchorX  = this.anchorX;
    anchorY  = this.anchorY;
    distance = this.distance;
    angle    = this.angle;


}

/*------------------------------------------------------------------------------- 

 ------------------------------------------------------------------------------- */



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
        // this.myset = paper.set();

        this.addAnglePicker (anchorX, anchorY, radius, theta);
        // this.myset.data("myset", this.myset);
        this.clicker.data("data-attr", { anchorX : anchorX, anchorY: anchorY });

    }



    addAnglePicker(anchorX, anchorY, radius, theta) {

      var point    = polar2cartesian(radius, deg2rad(theta));
      var x        = anchorX + point.x;
      var y        = anchorY + point.y;

      this.extender = paper.path(["M", anchorX, anchorY, "L", x, y ]);
      this.extender.attr({ "stroke-dasharray":"--" });

      // show the clicker and exteender  
      this.clicker    = drawPoint (x, y, "green");
      this.clicker.data("data-extender", this.extender);
      this.clicker.drag(movePicker, startPicker, upPicker);


      //this.myset.push(extender, clicker);      
      //this.myset.drag(movePicker, startPicker, upPicker);
    }



  }