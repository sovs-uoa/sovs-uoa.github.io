var newChild;

var GRID_SIZE = 25;


function stripComments(code) {
  return code.replace(/\/\/.*|\/\*[^]*?\*\//g, "");
}


function loadDoc(url, myFunction) {
	// synchronous load = bad
	var returned = 0;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	        returned = this.responseText;
	    }
	};
	xmlhttp.open("GET", url, false);
	xmlhttp.send();
	return returned;
}


function readJSON(strfile) { 
		var mystring = stripComments(loadDoc(strfile));
     	prescription = JSON.parse(mystring); //, this.update(JSON.parse(local)) );
     	return prescription;
}

function isArray(obj){
    return !!obj && obj.constructor === Array;
}


/* -----------------------------------------------------------------------------------------------

LENS READER 

--------------------------------------------------------------------------------------------------- */

class Lens extends PIXI.Graphics { // lens reader 

    constructor(x, y, prescription) {

    	super();
    	
    	// console.log('file = ' + strfile);

    	// this.filename;
    	// this.output;
    	//this.prescription;
    	//this.start    = { x: 0, y: 0 };
        //this.end      = { x: 0, y: 0 };

		this.position.x = x;
		this.position.y = y;
		this.pivot.x    = 0;
	    this.pivot.y    = 0.5;
		this.length     = 0;		

		this.prescription = prescription;
		this.update();

    	//this.readJSON(strfile);
    }

/*
	readJSON(strfile) { 
		// allow access !
		var local = this.output;
		var mystring = stripComments(loadDoc(strfile));
     	this.output = JSON.parse(mystring); //, this.update(JSON.parse(local)) );
     	this.prescription = this.output.prescription;

     	this.update();
	}
*/


	update() {

		var Z0 = 0;
		var Y0 = 0;

        this.clear();
		while(this.children[0]) { this.removeChild(this.children[0]); }


		this.lineStyle(1,0x00ff00);
		this.drawCircle(0, 0, 5);
		console.log('lens position');
		console.log(this.position);

		//this.lineStyle(1,0xffffff);
		//this.drawCircle(this.pivot.x, this.pivot.y, 10);

		var pts = [];
		var Z   = Z0;
		var N   = this.prescription.length;

		console.log("prescription length = " + N);

		// draw prescription 
		this.lineStyle(1,0xffffff);
		for (var i = 1; i < N-1 ; i++) {

	    	var input_elem     = this.prescription[i];
	    	var next_elem      = this.prescription[i+1];
	    	var prev_elem      = this.prescription[i-1];

			switch (input_elem.type ) {

		    	case "sphere": // spherical sirface 
		      		var R  = input_elem.args.radius * GRID_SIZE; 
		      		var Y  = Y0;
		      		var H  = input_elem.args.height * GRID_SIZE;
		      		// this.moveTo(Z+R*10, Y);

		      		var MathAngle = Math.abs(Math.atan(0.5*H/R)); 

		      		if (R > 0) {
		      			var x0 = R*Math.cos(Math.PI - MathAngle);
		      			var y0 = R*Math.sin(Math.PI - MathAngle);
		      			this.moveTo(Z+R+x0,Y+y0);
		      			this.arc(Z+R, Y, R, Math.PI - MathAngle, Math.PI + MathAngle);		      		
		      		} else {
		      			var x0 = Math.abs(R)*Math.cos(MathAngle);
		      			var y0 = Math.abs(R)*Math.sin(MathAngle);
		      			this.moveTo(Z+R+x0,Y-y0);
		      			this.arc(Z+R, Y, Math.abs(R), -MathAngle, MathAngle);		      		
		      		};
		      		//this.arcTo(Z,300,Z,200,R*1000);
		      		//this.arc(Z+100, Y, 100, Math.pi/3, Math.pi);

		      		pts.push({ x: Z, y: Y });
		      		pts.push({ x: Z, y: Y+y0 });		      		
		      		pts.push({ x: Z, y: Y-y0 });	      		

		      		console.log('Added new Spherical Element Z = ' + Z);
		      		break;

		    	case "plane": // plane 
		    		break;

		    	case "index":
		    		
		    		console.log(input_elem);
		    		//var n1 	= prev_elem.args.index;
		    		//var n2 	= next_elem.args.index;
		      		var r0 = prev_elem.args.radius*GRID_SIZE; 
		      		var x0 = r0*Math.cos(Math.PI - Math.PI/3);
		      		var y0 = r0*Math.sin(Math.PI - Math.PI/3);

		      		var r1 = next_elem.args.radius*GRID_SIZE; 
		      		var x1 = r1*Math.cos(Math.PI - Math.PI/3);
		      		var y1 = r1*Math.sin(Math.PI - Math.PI/3);

	    			Z = Z + Number(input_elem.args.thickness)*GRID_SIZE;
		    		console.log('more = ' + Z);
		    		console.log(input_elem);
		    		break;

		    	default:
		    		console.log('Unknown element = ');
		    		console.log(input_elem);
		    		return;
		    		break;
		    };




		}


	    // update pts 
        //this.lineStyle(1,0xff0000);
	    //var hull = convexhull.listHull(pts);		  
	    //var mypoly = new PIXI.Polygon(hull);		  
	    //this.drawPolygon(mypoly.points);
	    //this.boundingPoints = mypoly.points;
        //this.hitArea = new PIXI.Polygon(this.boundingPoints);

	    //console.log('Bounds');
	    //console.log(this.getBounds());
	    this.lineStyle(1,0xff0000);	      
		var Rect = this.getLocalBounds();
		// console.log(Rect);
		//var rect = new PIXI.Rectangle(0, -Rect.height/2, Rect.width, Rect.height);
		this.drawRect(Rect.x, Rect.y, Rect.width, Rect.height);
	    this.hitArea = Rect; //new PIXI.Polygon(this.boundingPoints);



	}
}



/* -----------------------------------------------------------------------------------------------

LENS POINTS Show lens points  

--------------------------------------------------------------------------------------------------- */

class LensPoints extends PIXI.Graphics {


    constructor(x, y, points, lineSize, lineColor) {
        
        super();
        
        var s = this.lineWidth = lineSize || 1;
        var c = this.lineColor = lineColor || "0xffffff";
		
		
        //this.MasterLens = MasterLens; 

		this.position.x = x;
		this.position.y = y;

        this.points     = points;
        this.dragging   = false;
        this.boundingPoints = 0;

        this.total = [];

        this.update ();
    }


    update () {

    	  // Master Lens 
		  
          // clear the canvas
          this.clear();
		  while(this.children[0]) { this.removeChild(this.children[0]); }

		  this.lineStyle(1,0x00ff00);
		  this.drawCircle(0,0,5);
		  console.log('lenspoint position');
		  console.log(this.position);


		  if (isArray(this.points)) {

			  var N = this.points.length;
			  for (var i = 0; i < N ; i++ ) {
			  	// add conjugate points (relative to MasterLens)
			  	this.addpoint(this.points[i].VO*GRID_SIZE, this.points[i].OQ*GRID_SIZE);
			  	this.addpoint(this.points[i].VI*GRID_SIZE, this.points[i].IQ*GRID_SIZE);
			  }			  

		  } else {

			  	// add conjugate points (relative to MasterLens)
			  	this.addpoint(this.points.VO*GRID_SIZE, this.points.OQ*GRID_SIZE);
			  	this.addpoint(this.points.VI*GRID_SIZE, this.points.IQ*GRID_SIZE);
		  }


		  console.log('total points');
		  console.log(this.total);

		  //var hull = convexhull.listHull(this.total);
		  //var mypoly = new PIXI.Polygon(hull);		  
		  //this.drawPolygon(mypoly.points);
		  //this.boundingPoints = mypoly.points;
	      //this.hitArea = new PIXI.Polygon(this.boundingPoints);

	      this.lineStyle(1,0xff0000);	      
		  var Rect = this.getLocalBounds();
		  // console.log(Rect);
		  //var rect = new PIXI.Rectangle(0, -Rect.height/2, Rect.width, Rect.height);
		  this.drawRect(Rect.x, Rect.y, Rect.width, Rect.height);
		  this.hitArea = Rect; //new PIXI.Polygon(this.boundingPoints);



    }



    addpoint(px,py) {


    	  var obj = { p1 : { x : 0, y : 0 }, p2 : { x: 0, y : 0 }};


          obj.p1.x = px; // points[0];
		  obj.p1.y = 0; // points[1];
          obj.p2.x = px; // points[2];
          obj.p2.y = -py; // points[3];

          //obj.p1.x = obj.p1.x * 20;
          //obj.p1.y = obj.p1.y * 20;
          //obj.p2.x = obj.p2.x * 20;
          //obj.p2.y = obj.p2.y * 20;

          console.log('positioning of LensPoints');
          console.log(this.position.x);
          console.log(this.position.y);

          //this.start.x = points[0];
	      //this.start.y = points[1];
	      //this.end.x   = points[2];
	      //this.end.y   = points[3];

		  var len = Math.sqrt((obj.p2.x - obj.p1.x) * (obj.p2.x - obj.p1.x) + (obj.p2.y - obj.p1.y) * (obj.p2.y - obj.p1.y));
		  
		  var par_x = (obj.p2.x - obj.p1.x) / len;
		  var par_y = (obj.p2.y - obj.p1.y) / len;
		  
		  var per_x = par_y;
		  var per_y = -par_x;

		  var arrow_size_per = 5;
		  var arrow_size_par = 5;
		  var center_size    = 2;


		  var s = this.lineWidth, c = this.lineColor;

		  // draw a main line 
		  this.lineStyle(1,0x0000ff);
		  this.drawCircle(obj.p1.x, obj.p1.y, 20);

          console.log(obj.p1);
          console.log(obj.p2);

		  this.lineStyle(s, 0xffffff);
		  this.moveTo(obj.p1.x, obj.p1.y);
		  this.lineTo(obj.p2.x, obj.p2.y);



		  this.total.push({ x:obj.p1.x, y:obj.p1.y });
		  this.total.push({ x:obj.p2.x, y:obj.p2.y });
		  
		  //var center = midpoint(obj);
		  //this.moveTo(center.x - per_x * center_size, center.y - per_y * center_size);
		  //this.lineTo(center.x + per_x * center_size, center.y + per_y * center_size);
		  

		   this.lineColor = 0xff0000;
		   var points = [];
		  

		   // draw arrowhead 

		   if (py > 0) {

		    //畫箭頭(p1)
			//points.push({ x: obj.p1.x - par_x * arrow_size_par, y: obj.p1.y - par_y * arrow_size_par });
			//points.push({ x: obj.p1.x + par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p1.y + par_y * arrow_size_par + per_y * arrow_size_per });
			//points.push({ x: obj.p1.x + par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p1.y + par_y * arrow_size_par - per_y * arrow_size_per });

		    points.push({ x: obj.p2.x + par_x * arrow_size_par, y: obj.p2.y + par_y * arrow_size_par });
		    points.push({ x: obj.p2.x - par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par + per_y * arrow_size_per})
		    points.push({ x: obj.p2.x - par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par - per_y * arrow_size_per});


			console.log('arrow points down');
			console.log(points);

		    this.beginFill(0xff0000);
		    this.moveTo(points[0].x, points[0].y);
		    this.lineTo(points[1].x, points[1].y);
		    this.lineTo(points[2].x, points[2].y);
		    this.endFill();

		   } else {

		    points.push({ x: obj.p2.x + par_x * arrow_size_par, y: obj.p2.y + par_y * arrow_size_par });
		    points.push({ x: obj.p2.x - par_x * arrow_size_par + per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par + per_y * arrow_size_per})
		    points.push({ x: obj.p2.x - par_x * arrow_size_par - per_x * arrow_size_per, y: obj.p2.y - par_y * arrow_size_par - per_y * arrow_size_per});

			console.log('arrow points up');
			console.log(points);


		    //畫箭頭(p2)
		    //this.beginPath();
		    this.beginFill(0xff0000);
		    this.moveTo(points[0].x, points[0].y);
		    this.lineTo(points[1].x, points[1].y);
		    this.lineTo(points[2].x, points[2].y);
		    this.endFill();

			}


			this.total.push(points[0]);
			this.total.push(points[1]);
			this.total.push(points[2]);



	}

    /* -------------------------------------------------------------------------------------

	Enable Dragging 

	----------------------------------------------------------------------------------------- */


}
