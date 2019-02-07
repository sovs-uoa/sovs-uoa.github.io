
// loadJSON file!!!
function loadJSON5(filename, callback) {   
  var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', filename, true); 
      // Replace 'my_data' with the path to your file
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback 
          // as .open() will NOT return a value but simply returns undefined in asynchronous mode
          callback(JSON5.parse(xobj.responseText));
        }
  };
  xobj.send(null);  
}



//Function to assign the default values for the staircase parameters
function assignParameterValue(argument, defaultValue){
  return typeof argument !== 'undefined' ? argument : defaultValue;
}

