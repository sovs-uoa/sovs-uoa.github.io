
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
  xobj.send();  
}



//Function to assign the default values for the staircase parameters
function assignParameterValue(argument, defaultValue){
  return typeof argument !== 'undefined' ? argument : defaultValue;
}





function loadConfiguration(path, success, error)
{

  $.get( path, function( data ) {
      success (data);
  })
  .fail(function (data) {
    error (data);
  });

}



function buildDropdownMenu (which, whichFn, dataList) {

      var dropdwn = document.getElementById(which);
      dataList.forEach ( each => {

         console.log(each.value);

          // <a class="dropdown-item" href="#">Link 1</a>       
          newlink = document.createElement('a');
          newlink.setAttribute('class', 'dropdown-item');
          newlink.setAttribute('data-name',  each.name);                
          newlink.setAttribute('data-value', each.value);   
          newlink.setAttribute('data-desc',  each.desc);                   
          newlink.setAttribute('onclick', whichFn + '(this);');
          newlink.innerHTML = each.name;              

          if (each.active) {
           eval (whichFn + "(newlink);");
          }

          //console.log(newlink);

          dropdwn.appendChild(newlink);

      });

}
