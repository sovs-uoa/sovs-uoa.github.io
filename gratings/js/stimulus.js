/* --------------------------------------------------------------

UTILITIES Functions that support stimulus display

 ----------------------------------------------------------------- */

/*
let display = { name: "Alienware Laptop (15-inch)",
                distance: 100,
                dimension: { width:  34.93, 
                            height: 24.07, 
                            depth:  1.55  },
                resolution: { width:  1920,
               	 			  height: 1080 }};
*/

/* 
let display = { name: "Macbook Pro Laptop (15-inch)",
                distance: 100,
                dimension: { width:  32.50, 
                             height: 21.00, 
                             depth:  1.00  },
                resolution: { width:  1680,
               	 			  height: 1050 }};
*/

let display = { name: "Dell E248WFP (24-inch)",
                distance: 100,
                dimension: { width:  32.50, 
                             height: 21.00, 
                             depth:  1.00  },
                resolution: { width:  1900,
                              height: 1200 }};


var elem = document.documentElement;
let isStimulusActive = false;


/* ------------------------------------------------------------------------------

FUNCTIONS 

--------------------------------------------------------------------------------- */


/* View in fullscreen */


function angle2pix(display, ang) {
pixSize = display.dimension.width/display.resolution.width;  // pixel size in cm (cm/px)
sz = 2.0*display.distance*Math.tan(Math.PI*ang/360);   		 // element size in cm 
pix = Math.round(sz/pixSize);   						     // value in pixels 
return pix; 
}


/* View in fullscreen */

function logMAR2deg(val) {
return Math.pow(10, val) / 60;  							// logMAR in degrees
}

/* View in fullscreen */

function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}


/* StartFullScreenHandler : activated when started or finished  */

function startFullScreenHandler (start, finish) {

function check () {

  if (
      document.fullscreenElement ||       /* Standard syntax */
      document.webkitFullscreenElement || /* Chrome, Safari and Opera syntax */
      document.mozFullScreenElement ||    /* Firefox syntax */
      document.msFullscreenElement        /* IE/Edge syntax */
  ) {

    $("html").css("overflow", "hidden");
    start ();

  } else {

    $("html").css("overflow", "auto");
    finish ();
  }

}

// EVENT LISTENERS 
document.addEventListener('webkitfullscreenchange', function(e) { check(); }, false);
document.addEventListener('mozfullscreenchange', function(e) { check(); }, false);
document.addEventListener('fullscreenchange', function(e) { check(); }, false);
document.addEventListener('msfullscreenchange', function(e) { check(); }, false);

}

/* Stimulus Functions */


function stopStimulus () {

		if (!isStimulusActive)
			return;

		log ('stopped stimulus');

		let experiment = document.getElementById("experiment");
		cancelAnimationFrame (requestId);

		if (scene == undefined) {
				log ('WARNING: stimulus stoppped - but not yet created.');
				return
		}

		/* TRY TO REMOVE */
		
		scene.remove (mesh);
		geometry.dispose ();
		material.dispose ();
		scene.dispose();
		renderer.forceContextLoss();
		renderer.dispose();

		/* CLEAN SLATE */

		emptyChildren (experiment);

		isStimulusActive = false;

}




function startStimulus () {


		log ("start stimulus");

		count = 0;
		
		cancelAnimationFrame (requestId);
		stamp = (new Date()).getTime();
		requestId = requestAnimationFrame( animate );				

		isStimulusActive = true;

		
}



/* Additional Functions */

function emptyChildren (container) {
	while (container.firstChild) {
	    container.removeChild(container.firstChild);
	}
}


function onWindowResize() {

  //camera.left = window.innerWidth / -2;
  //camera.right = window.innerWidth / 2;
  //camera.top = window.innerHeight / 2;
  //camera.bottom = window.innerHeight / -2;

  //camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}
