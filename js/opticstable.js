var newChild;


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



/* -----------------------------------------------------------------------------------------------

LENS READER 

--------------------------------------------------------------------------------------------------- */

class LensTable { // lens reader 

    constructor(x, y, strfile) {

    	super();
    	console.log('file = ' + strfile);

    	this.filename;
    	this.output;
    	this.prescription;

    	//this.start    = { x: 0, y: 0 };
        //this.end      = { x: 0, y: 0 };


		this.position.x = x;
		this.position.y = y;
		this.pivot.x    = 0;
	    this.pivot.y    = 0;
		this.length     = 0;		


    	this.readJSON(strfile);
    }

	readJSON(strfile) { 
		// allow access !
		var local = this.output;
		var mystring = stripComments(loadDoc(strfile));
     	this.output = JSON.parse(mystring); //, this.update(JSON.parse(local)) );
     	this.prescription = this.output.prescription;

     	this.update();
	}


	update() {

		var Z0 = 0;
		var Y0 = 0;

        this.clear();
		while(this.children[0]) { this.removeChild(this.children[0]); }

		var pts = [];
		var Z   = Z0;
		var N   = this.output.prescription.length;

		// draw prescription 
		this.lineStyle(1,0xffffff);
		for (var i = 1; i < N-1 ; i++) {

	    	var input_elem     = this.prescription[i];
	    	var next_elem      = this.prescription[i+1];
	    	var prev_elem      = this.prescription[i-1];

			switch (input_elem.type ) {

		    	case "sphere": // spherical sirface 
		      		var R  = input_elem.args.radius * 20; 
		      		var Y  = Y0;
		      		var H  = input_elem.args.height * 20;
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
		      		var r0 = prev_elem.args.radius*20; 
		      		var x0 = r0*Math.cos(Math.PI - Math.PI/3);
		      		var y0 = r0*Math.sin(Math.PI - Math.PI/3);

		      		var r1 = next_elem.args.radius*20; 
		      		var x1 = r1*Math.cos(Math.PI - Math.PI/3);
		      		var y1 = r1*Math.sin(Math.PI - Math.PI/3);

	    			Z = Z + Number(input_elem.args.thickness)*20;
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
