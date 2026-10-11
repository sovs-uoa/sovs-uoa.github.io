/* --------------------------------------------------------------

GRATINGS Specific functions for running a grating stimulus demo 
This will allow sinusoids, stripes, disks 

 ----------------------------------------------------------------- */


let FizzyText, gui;
let camera, scene, geometry, material, renderer;
let requestId;
var uniforms, stamp;

let dotsBuffer = [ 1200.0, 800.0, 500.0, 500.0 ];

/* PARAMETERS */

let parameters = { 	animation 	  : "cycle", 																				
					stimulus_type : "gabor", 
					dots          : 2,
					direction     : 2,
					speed         : 10.0,    
					duration      : 2.5,
					gabor         : { frequency : 1.0,
									  contrast  : 1.0,									
									  size      : 2 }  
					};


let last_parameters = JSON.parse(JSON.stringify(parameters));

/* ------------------------------------------------------------------------------

STARTUP PARAMETERS 

--------------------------------------------------------------------------------- */

function destroyMenu () {
	if (gui) {		
		log ('destroyed menu');
	    gui.destroy ();
	   	gui = undefined;
	   }
}
    

function buildMenu (callback) {

  if (gui)	{
  	 console.log (gui);
  	 log ('build called. gui is not empty.');
     destroyMenu ();
  }


  log (`build the menu`);
  gui   = new dat.GUI();

  gui.add(parameters, 'stimulus_type', [ 'gabor' ] ).name('Stimulus').onFinishChange(callback);
  gui.add(parameters, 'animation', [ 'cycle', 'random', 'circle', 'rectangle' ]).name('Animation').onFinishChange(callback);
  gui.add(parameters, 'duration', 0, 10).name('Duration').onFinishChange(callback);
  gui.add(display, 	  'distance', [ 50, 70, 100, 150 ] ).name('Distance (cm)').onFinishChange(callback);
  

  var options = gui.addFolder('Stimulus Options');

  setupMenu (options);

  function setupMenu (options) {

	  switch (parameters.stimulus_type) {

	  	case "gabor":

 			options.add(parameters.gabor, 'contrast',  0.0, 1.0).name('Contrast').onFinishChange(callback);
			options.add(parameters.gabor, 'frequency',  0.0, 15).name('Freq.(cpd)').onFinishChange(callback);
			options.add(parameters.gabor, 'size',       0.0, 5).name('Size.(deg.)').onFinishChange(callback);
		  	break;

		 default:
		 	throw ('error'); 	

	  }
  }


  //options.add(parameters.bars, 'speed', 0.0, 1.0).name('Speed').onFinishChange(callback);
  //options.add(parameters.bars, 'frequency', 0.0, 1.0).name('Frequency').onFinishChange(callback);
  //options.add(parameters.bars, 'direction', [ 'left', 'right' ]).name('Direction').onFinishChange(callback);
  options.open();

}




//----DISK Functions Begin----



function initializeStimulus () {

	log ("initialize stimulus");

	if (isStimulusActive)
		stopStimulus ();

	experiment = document.getElementById("experiment");

	let shader_frag;
	let v;

	switch (parameters.stimulus_type) {

		case "gabor":

			/* DISKS UNIFORM */
			var lambda = 1/parameters.gabor.frequency; 				 // cwavelength in deg 
			var f = 1/angle2pix(display, lambda);  						 // cyc/px 

			/* DISKS UNIFORM */
			uniforms = {
				"dot_radius": 		{ value: 10.0 },
				//"pts": 				{ type: "v2v", value: [ new THREE.Vector2(1200.0, 800.0), new THREE.Vector2(500.0, 500.0) ] }
				"pts": 				{ type: "2fv", value: dotsBuffer }
			};


			shader_frag = getDotsShader (2);
			break;

	}


	camera 		= new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );				
	scene 		= new THREE.Scene();
	geometry 	= new THREE.PlaneBufferGeometry( 2, 2 );


	material = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		fragmentShader: shader_frag  
	} );

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer();
	// renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setPixelRatio(1); //window.devicePixelRatio ? window.devicePixelRatio : 1);
	renderer.setSize( window.innerWidth, window.innerHeight ); 

	log (window.innerWidth);
	log (window.innerHeight);

	experiment.appendChild( renderer.domElement );

	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );

}

//

var count = 0;
var dt = 0;
var last = (new Date()).getTime();
var direction = 0.0;
var phi = 0;

// var stamp = 0;
// var fieldShiftDX = 0;

function unit_step (x) {
	return Math.sign(Math.sin (x));
}


function animate() {

	requestId = requestAnimationFrame( animate );
	
	let now = (new Date()).getTime();
	let dt = (now - last)/1000; // seconds 

	/* UPDATE THE POSITIONING */

	dotsBuffer[0] += 0.5;
	uniforms.pts.value = dotsBuffer;

	//"pts": 				{ type: "2fv", value: [ 1200.0, 800.0, 500.0, 500.0 ] }


	switch (parameters.animation) {



		case "rectangle" :

			  var w = window.innerWidth; h = window.innerHeight;

			  phi = phi + dt;
			  a = w/4; b = h/4;

			  /* https://math.stackexchange.com/questions/1703952/polar-coordinates-vector-equation-of-a-rectangle */

			  var r;
			  var d = Math.abs(Math.tan(phi));
			  if (d <= b/a) {
			  	r = a/Math.abs(Math.cos(phi));
			  } else if (d >= b/a) {
			  	r = b/Math.abs(Math.sin(phi));
			  }

			  x = r*Math.cos(phi) + w/2;
			  y = r*Math.sin(phi) + h/2;

			 //log(`x = ${x}, y = ${y}, phi=${phi}, dt=${dt}`);


			  //uniforms.Location.value.x = x;//window.innerWidth;
		      //uniforms.Location.value.y = y;//window.innerHeight;

 		  	  last = (new Date()).getTime();

			break;


		case "circle" :


			  var w = window.innerWidth; h = window.innerHeight;
			  phi = Math.PI*dt/parameters.duration;
			  var x = (w/4) * Math.sin(phi) + w/2;
			  var y = (h/4) * Math.cos(phi) + h/2;

			  //uniforms.Location.value.x = x;//window.innerWidth;
		      //uniforms.Location.value.y = y;//window.innerHeight;

			break;


		case "random" :

			if (dt > parameters.duration) {

				phi = 2*Math.PI*Math.random ();
			  	var w = window.innerWidth; h = window.innerHeight;
			  	var x = (w/4) * unit_step(phi) + w/2;
			  	var y = (h/4) * unit_step(phi + Math.PI/2) + h/2;

		      	//uniforms.Location.value.x = x;
		      	//uniforms.Location.value.y = y;

  			  	last = (new Date()).getTime();

			}

			break;

		case "cycle" :

		  var w = window.innerWidth; h = window.innerHeight;
		  phi = Math.PI*dt/parameters.duration;
		  var x = (w/4) * unit_step(phi) + w/2;
		  var y = (h/4) * unit_step(phi + Math.PI/2) + h/2;

		  //uniforms.Location.value.x = x;//window.innerWidth;
	      //uniforms.Location.value.y = y;//window.innerHeight;

		  //mesh.material.uniforms.Location.x.value 	 += -0.1; // parameters.disks.central_radius;
		  break;

	}

	renderer.render( scene, camera );

}





/* -----------------------------------------------------------------------------------------------------------------------------------

EMPTY SHADER 

-------------------------------------------------------------------------------------------------------------------------------------- */


function getDotsShader (N) {

let shader_frag = 

"		  const float Pi = 3.1415927;"+
"	      const float BackgroundIntensity = 0.5;"+

"		  uniform float dot_radius;"+  
`		  uniform vec2  pts[${N}];`+  

"		  float gauss(float x) {" +
"    		return exp(-x*x*0.0001);" + 
"		  }"+


"		  float puck(float x, float r) {" +
"    		return 1.0-smoothstep(r-0.1, r+0.1, x);"+ 
"		  }"+

"         void main(void) {"+
"			float sv = 0.0;"+
"			float d  = 0.0;"+
"	  	    vec2  uv  = gl_FragCoord.xy;"+
"	        float g = 0.0;"+

`		    for(int i=0;i<${N};i++){`+
"				d = distance(uv, pts[i]);"+
"	  	    	sv += puck(d, dot_radius);"+
"	        }"+

"			sv = clamp(sv, 0.0, BackgroundIntensity) + BackgroundIntensity;"+
"		    float b = 1.0;"+
"		    gl_FragColor = vec4(b*sv, b*sv, b*sv, 1.0);"+
"		  }";

return shader_frag;
}
