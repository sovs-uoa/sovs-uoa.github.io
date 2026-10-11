
  // Bring the page into full-screen mode - Works!
function requestFullScreen(elem) {

    console.log('attempt fullscreen');

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
    }


 
}

// Exit fullscreen - Doesn't work!
function exitFullScreen(element){
    console.log('attempt small screen');
    
    //gui.hide();

    var requestMethod = element.mozCancelFullScreen  ||
        element.exitFullscreen                 || 
        element.webkitExitFullscreen           || 
        element.msExitFullscreen;
    if (requestMethod) {
        console.log('calling exit method');
        requestMethod.call(element);
    } else {
        console.log("Oops. Request method false.");
    }
}
  

function check(e) {


      if (
          document.fullscreenElement || /* Standard syntax */
          document.webkitFullscreenElement || /* Chrome, Safari and Opera syntax */
          document.mozFullScreenElement ||/* Firefox syntax */
          document.msFullscreenElement /* IE/Edge syntax */
      ) {
              // fullscreen is activated
              console.log('fullscreen display - STARTING');
              // StimulusRunning = true;  
              // gui.open();
              // animate();

      } else {

              // fullscreen is cancelled
              console.log('fullscreen display - STOPPED');
              stopStimulusDisplay();
      }
  }

  // event listeners 
  document.addEventListener('webkitfullscreenchange', function(e) { check(); }, false);
  document.addEventListener('mozfullscreenchange', function(e) { check(); }, false);
  document.addEventListener('fullscreenchange', function(e) { check(); }, false);



function loadJSON(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON5.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

function loadConfiguration ( filename, success ) {
	loadJSON (filename, function (data) {
		success (data);
	});
}

// ... angle in minutes of arc
function logMAR2SW(value) {
    return Math.pow(10, value);
}

// ... angle to pixels where angle is in degrees
function angle2pix(display, ang) {
    pixSize = display.dimension.width/display.resolution.width;  // cm/pix
    sz = 2.0*display.distance*Math.tan(Math.PI*ang/360);   // deg/sec
    pix = sz/pixSize;   
    return pix; 
}

// ... angle in minutes of arc
function logMAR2px(display, value) {
	let m = logMAR2SW (value);
	let px = angle2pix(display, m/60)

	console.log (m);
	console.log (px);
	console.log (display);

	return px;
}