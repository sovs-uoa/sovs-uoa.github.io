var app = new PIXI.Application(1200, 400, { antialias: true });
document.getElementById("lens-view").appendChild(app.view);


// gloal variables 
var lastMousePosition = { x : 0, y : 0 };
var newMousePosition  = {};
var isbusy = false;
var dragMode = 0;
var itemMode = 0;
var item = [];

var PixelsPerGridUnit = 50; // px


function getAngle(y,x) {

	// vertical  
	if (x == 0) {
		angle = Math.PI/2;
		if (y < 0) {			
			angle = 2*Math.PI - angle;
		}
		return angle;
	};

    angle = Math.atan2(y, x);

    if (angle < 0) {
    	angle = 2*Math.PI + angle;
    }
    return angle;
}



function showGrid(gridSize) {


	var canv = document.createElement("canvas");
	canv.setAttribute('width', gridSize);
	canv.setAttribute('height',gridSize);
	canv.setAttribute('id','myCanvas');

	document.body.appendChild(canv);
	var ctx = canv.getContext("2d");
	ctx.setLineDash([2, 2]);
	ctx.strokeStyle="#909090";
	ctx.moveTo(0,0);
	ctx.lineTo(50,0);
	ctx.moveTo(0,0);
	ctx.lineTo(0,50);
	ctx.stroke();


	let texture = PIXI.Texture.fromCanvas(canv);
	var tilingSprite = new PIXI.extras.TilingSprite(
	    texture,
	    app.screen.width,
	    app.screen.height
	);
	app.stage.addChild(tilingSprite);

}


function midpoint (l1) {
	    var nx = (l1.p1.x + l1.p2.x) * 0.5;
	    var ny = (l1.p1.y + l1.p2.y) * 0.5;
	    return { x: nx, y:ny };	    
};


/* -----------------------------------------------------------------------------------------------

CLASS EXTENSION

--------------------------------------------------------------------------------------------------- */

class Line extends PIXI.Graphics {
    constructor(points, lineSize, lineColor) {
        super();
        
        var s = this.lineWidth = lineSize || 5;
        var c = this.lineColor = lineColor || "0x000000";
        
        this.points = points;

        this.lineStyle(s, c)

        this.moveTo(points[0], points[1]);
        this.lineTo(points[2], points[3]);
    }
    
    updatePoints(p) {
        
        var points = this.points = p.map((val, index) => val || this.points[index]);
        
        var s = this.lineWidth, c = this.lineColor;
        
        this.clear();
        this.lineStyle(s, c);
        this.moveTo(points[0], points[1]);
        this.lineTo(points[2], points[3]);
    }
}


/* -----------------------------------------------------------------------------------------------

CLASS THINLENS 

--------------------------------------------------------------------------------------------------- */

class ThinLens extends PIXI.Graphics {
    constructor(focal_length, points, lineSize, lineColor) {
        super();
        
        var s = this.lineWidth = lineSize || 1;
        var c = this.lineColor = lineColor || "0xffffff";
		
        this.f        = focal_length; // focal length

        this.points   = points;
        this.start    = { x: 0, y: 0 };
        this.end      = { x: 0, y: 0 };
        this.dragging = false;
        this.boundingPoints = 0;

        // console.log(this);
        console.log(points);

        this.updatePoints(points);
    }


    
    updatePoints(points) {


    	  var flag = this.f;

    	  var obj = { p1 : { x : 0, y : 0 }, p2 : { x: 0, y : 0 }};

    	  console.log(points);

          obj.p1.x = points[0];
		  obj.p1.y = points[1];
          obj.p2.x = points[2];
          obj.p2.y = points[3];

          this.start.x = points[0];
	      this.start.y = points[1];
	      this.end.x   = points[2];
	      this.end.y   = points[3];

		  var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
		  var par_x = (obj.p2.x - obj.p1.x) / len;
		  var par_y = (obj.p2.y - obj.p1.y) / len;
		  var per_x = par_y;
		  var per_y = -par_x;

		  var arrow_size_per = 5;
		  var arrow_size_par = 5;
		  var center_size = 2;


		  var s = this.lineWidth, c = this.lineColor;

          // clear me 
          this.clear();
		  while(this.children[0]) { this.removeChild(this.children[0]); }

		  //畫線
		  //this.strokeStyle = 'rgb(128,128,128)';
		  //this.globalAlpha = 1 / ((Math.abs(obj.p) / 100) + 1);
		  //ctx.globalAlpha=0.3;
		  //this.lineWidth = 4;

		  //this.beginPath();
		  this.lineStyle(s, 0xffffff);
		  this.moveTo(obj.p1.x, obj.p1.y);
		  this.lineTo(obj.p2.x, obj.p2.y);
		  //this.stroke();
		  //this.lineWidth = 1;
		  //ctx.lineCap = "butt"


		  //this.globalAlpha = 1;
		  //this.fillStyle = 'rgb(255,0,0)';

		  //畫透鏡中心點
		  var center = midpoint(obj);
		  //this.strokeStyle = 'rgb(255,255,255)';
		  //this.beginPath();

		  var points = [];

		  this.moveTo(center.x - per_x * center_size, center.y - per_y * center_size);
		  this.lineTo(center.x + per_x * center_size, center.y + per_y * center_size);
		  //this.stroke();

		  console.log('flag = ' + flag + 'center = (' + center.x + ',' + center.y + ')');

		  this.lineColor = 0xff0000;

		  if (flag > 0)
		  {
		    //畫箭頭(p1)
			points.push({ x: obj.p1.x - par_x * arrow_size_par, y: obj.p1.y - par_y * arrow_size_par });
			points.push({ x: obj.p1.x + par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p1.y + par_y * arrow_size_par + per_y * arrow_size_per });
			points.push({ x: obj.p1.x + par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p1.y + par_y * arrow_size_par - per_y * arrow_size_per });

			console.log(points);

		    this.beginFill(0xff0000);
		    this.moveTo(points[0].x, points[0].y);
		    this.lineTo(points[1].x, points[1].y);
		    this.lineTo(points[2].x, points[2].y);
		    this.endFill();


		    points.push({ x: obj.p2.x + par_x * arrow_size_par, y: obj.p2.y + par_y * arrow_size_par });
		    points.push({ x: obj.p2.x - par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par + per_y * arrow_size_per})
		    points.push({ x: obj.p2.x - par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par - per_y * arrow_size_per});

		    //畫箭頭(p2)
		    //this.beginPath();
		    this.beginFill(0xff0000);
		    this.moveTo(points[3].x, points[3].y);
		    this.lineTo(points[4].x, points[4].y);
		    this.lineTo(points[5].x, points[5].y);
		    this.endFill();
		    //this.fill();


			var hull = convexhull.listHull(points);
		    var mypoly = new PIXI.Polygon(hull);		  
		    this.drawPolygon(mypoly.points);
		    this.boundingPoints = mypoly.points;
	        this.hitArea = new PIXI.Polygon(this.boundingPoints);


		  }
		  if (flag < 0)
		  {


		  	points.push({ x: obj.p1.x + par_x * arrow_size_par, y: obj.p1.y + par_y * arrow_size_par}); 
		  	points.push({ x: obj.p1.x - par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p1.y - par_y * arrow_size_par + per_y * arrow_size_per}); 
		  	points.push({ x: obj.p1.x - par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p1.y - par_y * arrow_size_par - per_y * arrow_size_per}); 


		    //畫箭頭(p1)
		    //this.beginPath();
		    this.beginFill(0xff0000);		    
		    this.moveTo(points[0].x, points[0].x);
		    this.lineTo(points[1].x, points[1].x);
		    this.lineTo(points[2].x, points[2].x);
		    this.endFill();

		  	points.push({ x: obj.p2.x - par_x * arrow_size_par, y: obj.p2.y - par_y * arrow_size_par}); 
		  	points.push({ x: obj.p2.x + par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p2.y + par_y * arrow_size_par + per_y * arrow_size_per}); 
		  	points.push({ x: obj.p2.x + par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p2.y + par_y * arrow_size_par - per_y * arrow_size_per}); 


		    //畫箭頭(p2)
		    //this.beginPath();
		    this.beginFill(0xff0000);		    
		    this.moveTo(p[3].x, p[3].y);
		    this.lineTo(p[4].x, p[4].y);
		    this.lineTo(p[5].x, p[5].y);
		    this.endFill();
		    //this.fill();


		  // update the bounding points and hittable area
		  var hull = convexhull.listHull(points);		  
		  var mypoly = new PIXI.Polygon(hull);		  
		  this.drawPolygon(mypoly.points);
		  this.boundingPoints = mypoly.points;
	      this.hitArea = new PIXI.Polygon(this.boundingPoints);


		  }


	}

    /* -------------------------------------------------------------------------------------

	Enable Dragging 

	----------------------------------------------------------------------------------------- */


}





/* -----------------------------------------------------------------------------------------------

CLASS RULER

--------------------------------------------------------------------------------------------------- */



class Ruler extends PIXI.Graphics {
    constructor(points, lineSize, lineColor) {
        super();
        
        var s = this.lineWidth = lineSize || 1;
        var c = this.lineColor = lineColor || "0xffffff";

		this.scale_step 	 = 10;
		this.scale_step_mid  = 50;
		this.scale_step_long = 100;
		this.scale_len       = 10;
		this.scale_len_mid   = 15;
		//var scale_len_long=20;

		this.position.x = points[0];
		this.position.y = points[1];
		this.pivot.x    = 0;
	    this.pivot.y    = 0;
		this.length     = 100;		

        // this.points   = points;
        //this.start    = { x: 0, y: 0 };
        //this.end      = { x: 0, y: 0 };
        this.dragging = false;
        this.boundingPoints = 0;

        // console.log(this);

        this.update();
    }


    
    update() {

	    var points = [0,0,this.length,0];


    	var pts = [];


        // var points = this.points = p.map((val, index) => val || this.points[index]);
        
        var s = this.lineWidth, c = this.lineColor;
        var ang = Math.atan((points[3]-points[1])/(points[2]-points[0]));   

        console.log('angle = ' + ang);

        // clear me 
        this.clear();
		while(this.children[0]) { this.removeChild(this.children[0]); }


		// Draw the main ruler bar!
        this.lineStyle(1,0xffffff);
        this.moveTo(points[0], points[1]);
        this.lineTo(points[2], points[3]);


		var len = this.length; // Math.sqrt((points[2] - points[0]) * (points[2] - points[0]) + (points[3] - points[1]) * (points[3] - points[1]));
		var scale_step 		= this.scale_step;
		var scale_step_mid  = this.scale_step_mid;
		var scale_step_long = this.scale_step_long;
		var scale_len       = this.scale_len;
		var scale_len_mid   = this.scale_len_mid;

		var par_x 	= (points[2] - points[0]) / len;
  		var par_y 	= (points[3] - points[1]) / len;
  		var per_x 	= par_y;
  		var per_y 	= -par_x;
  		var ang 	= Math.atan2((points[3] - points[1]), (points[2] - points[0]));
  
        var textoptions = {fontFamily : 'Arial', fontSize: 16, fill : 0xffffff, align : 'center', rotation : ang, anchor : [ 0.5, 0.5] };



		if (ang > Math.PI * (-0.25) && ang <= Math.PI * 0.25)
		  {
		    //↘~↗
		    //console.log("↘~↗");
		    var scale_direction = -1;
		    var scale_len_long  = 20;
		    var text_ang 		= ang;

			textoptions.align    = 'center';
			textoptions.baseline = 'top';
		  }
		  else if (ang > Math.PI * (-0.75) && ang <= Math.PI * (-0.25))
		  {
		    //↗~↖
		    //console.log("↗~↖");
		    var scale_direction = 1;
		    var scale_len_long = 15;
		    var text_ang = ang - Math.PI * (-0.5);

		    textoptions.align    = 'right';
		    textoptions.baseline = 'middle';
		  }
		  else if (ang > Math.PI * 0.75 || ang <= Math.PI * (-0.75))
		  {
		    //↖~↙
		    //console.log("↖~↙");
		    var scale_direction = 1;
		    var scale_len_long = 20;
		    var text_ang = ang - Math.PI;

		    textoptions.align = 'center';
		    textoptions.baseline  = 'top';
		  }
		  else
		  {
		    //↙~↘
		    //console.log("↙~↘");
		    var scale_direction = -1;
		    var scale_len_long = 15;
		    var text_ang = ang - Math.PI * 0.5;

		    textoptions.align    = 'right';
		    textoptions.baseline = 'middle';
		  }


		// ticks
		var isfirst = true;
		var x, y; 
		var xmin, ymin;
		for (var i = 0; i <= len; i += scale_step)
		  {
		    this.moveTo(points[0] + i * par_x, points[1] + i * par_y);
		    if (i % scale_step_long == 0)
		    {
		      x = points[0] + i * par_x + scale_direction * scale_len_long * per_x;
		      y = points[1] + i * par_y + scale_direction * scale_len_long * per_y;
		      this.lineTo(x, y);		      
		      let text = new PIXI.Text(i, textoptions);
		      text.x = x;
		      text.y = y;		  
		      text.rotation = ang;    
		      this.addChild(text); //this.addChild(text);
		    }
		    else if (i % scale_step_mid == 0)
		    {

		      x = points[0] + i * par_x + scale_direction * scale_len_mid * per_x;
		      y = points[1] + i * par_y + scale_direction * scale_len_mid * per_y;
		      this.lineTo(x, y);
		      //ctx.stroke();
		    }
		    else
		    {
		   	  x = points[0] + i * par_x + scale_direction * scale_len * per_x;
		   	  y = points[1] + i * par_y + scale_direction * scale_len * per_y;
		      this.lineTo(x, y);
		      //ctx.stroke();
		    }


		    pts.push({ x : x, y : y});

		  }
	

		  // update the bounding points and hittable area
		  //var mypoly = new PIXI.Polygon([ p[0]-5, p[1]-5, p[2]+5, p[3]-5, x+5, y+5, xmin-5, ymin+5, p[0]-5, p[1]-5 ]);		  
		  //this.drawPolygon(mypoly.points);
		  //this.boundingPoints = mypoly.points;
	      //this.hitArea = new PIXI.Polygon(this.boundingPoints);

	      // update the bounding points and hittable area

	      //console.log('Bounds');
	      //console.log(this.getBounds());

	      //this.lineStyle(1,0xff0000);	      
		  //var Rect = this.getBounds();
		  //var rect = new PIXI.Rectangle(0, 0, Rect.width, Rect.height);
		  //this.drawRect(0,0,Rect.width,Rect.height);
	      //this.hitArea = rect; //new PIXI.Polygon(this.boundingPoints);
		  //this.addChild(this.hitArea);

	      this.lineStyle(1,0xff0000);	      
		  var Rect = this.getLocalBounds();
		  this.drawRect(Rect.x, Rect.y, Rect.width, Rect.height);
	      this.hitArea = Rect; //new PIXI.Polygon(this.boundingPoints);


	}

    /* -------------------------------------------------------------------------------------

	Enable Dragging 

	----------------------------------------------------------------------------------------- */


}





   /* -------------------------------------------------------------------------------------

	Enable Dragging 

	----------------------------------------------------------------------------------------- */

    function onDragStart(event)
	{


		//console.log(dragMode);

		switch (dragMode) {

			case 0 : // rotate 
			case 1 : // translate 

			    // store a reference to the data
			    // the reason for this is because of multitouch
			    // we want to track the movement of this particular touch
			    this.data 		  = event.data;
			    this.dragging 	  = true;
			    isbusy 			  = true; // block information  
				lastMousePosition = event.data.getLocalPosition(this.parent);
				console.log('dragStart = ' + this.dragging + ' mousePosition=(' + lastMousePosition.x + ',' + lastMousePosition.y +')');
				break;

			case 2 :


				// will return true if is child otherwise false
				var isChild = app.stage.removeChild(this);
				console.log('is this a child of stage ... ' + isChild);


			default :

		}



	    //var newPosition = this.data.getLocalPosition(this.parent);
	    //this.start.x = newPosition.x;
	    //this.start.y = newPosition.y;
	    //this.end.x   = newPosition.x;
	    //this.end.y   = newPosition.y;
	    //this.updatePoints([ this.start.x, this.start.y, this.end.x, this.end.y ]);
	}

	
    function onDragEnd()
	{

	    // set the interaction data to null
		console.log('dragEnd');
	    this.dragging = false;
	    this.data = null;	    

	    isbusy = false;  // unblock information 

	}

	
    function onDragMove(event)
	{


	    if (this.dragging)
	    {

	    	switch (dragMode) {

		    	case 0: // rotate 

			    	// drag the ruler  + lens 
					newMousePosition = event.data.getLocalPosition(this.parent);	       
					console.log(newMousePosition); 
					console.log('dragMove = ' + this.dragging + ' mousePosition=(' + newMousePosition.x + ',' + newMousePosition.y +')');
			        

					// change lengths
			        var delta    = { x : lastMousePosition.x - this.position.x,   y : lastMousePosition.y - this.position.y };					
			        var ux       = delta.x/Math.sqrt(delta.x*delta.x + delta.y*delta.y);
			        var uy       = delta.y/Math.sqrt(delta.x*delta.x + delta.y*delta.y);
			        var change   = { x : newMousePosition.x - lastMousePosition.x,  y : newMousePosition.y - lastMousePosition.y };			        
			        var delta_length = ux*change.x + uy*change.y;
			        console.log('DELTA LENGTH = ' + delta_length);	

			        if (delta_length !== 0) {
			        	this.length = this.length + delta_length;			        
			        	this.update();			        	
			        }

					// change angle 
			        var delta      = { x : newMousePosition.x - this.position.x,   y : newMousePosition.y - this.position.y };
			        var angle  	   = getAngle(delta.y, delta.x); // svertex  
			        this.rotation  = angle;

			        // project onto 
			        // console.log('U_X = ' + Math.cos(angle));
			        // console.log('U_Y = ' + Math.sin(angle));
			        // change length s
			        //this.length = this.length; // + Math.sqrt(delta.x*delta.x + delta.y*delta.y);
			        //this.update();
			        break;

		    	case 1: // translate 
		    	
			    	// drag the ruler  + lens
					newMousePosition = event.data.getLocalPosition(this.parent);	       
					console.log(newMousePosition); 
					console.log('dragMove = ' + this.dragging + ' mousePosition=(' + newMousePosition.x + ',' + newMousePosition.y +')');
			        var delta  = { x : newMousePosition.x - lastMousePosition.x,  y : newMousePosition.y - lastMousePosition.y };
					this.position.x = this.position.x + delta.x; //this.start.x;
					this.position.y = this.position.y + delta.y;			
			        break;

			     default:


			  }


			// this.updatePoints(Position);

			//console.log(this.pivot);

			//this.rotation = this.rotation + 0.01;
	    	lastMousePosition = newMousePosition;

	    }

	}


	// callback for the stage! 
	function onStartObject(event) 
	{

		// only allow if not busy
		if (isbusy || dragMode == 2)  {
			return
		}


		console.log('- start object placement.');

		// add a ruler 
		var nP = event.data.getLocalPosition(app.stage);

		console.log(nP);
		console.log('adding = ' + itemMode);

		switch (itemMode) {

			case 1:  // add a ruler 

				item = new Ruler([nP.x, nP.y, nP.x+100, nP.y]);
				item.interactive = true;
				item.buttonMode  = true;
				break;

			case 0: // add a lens 

				// create a thin lenss
				focal_length = 10;
				item = new ThinLens(focal_length, [nP.x, nP.y, nP.x, nP.y+100]);
				item.interactive = true;
				item.buttonMode  = true;
				break;

			default:

		}

		item
		   .on('mousedown',			onDragStart)
		   .on('touchstart',		onDragStart)
		   .on('mouseup', 			onDragEnd)
		   .on('mouseupoutside', 	onDragEnd)
		   .on('touchend', 			onDragEnd)
		   .on('touchendoutside', 	onDragEnd)
		   .on('mousemove', 		onDragMove)
		   .on('touchmove', 		onDragMove);


		 console.log(item);

		app.stage.addChild(item);

		
	}
