/* -----------------------------------------------------------------------------------------------

LENSTABLE 

Javascript 

DEPENDENCIES:
jquery
mustache.min.js 
mustach-wax.js

ISSUES:
uses synchronous loading for template and data 

--------------------------------------------------------------------------------------------------- */


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


Mustache.Formatters = {
        "decimal": function (num, dt) {                    
        			var myval = Math.round(num * Math.pow(10, dt)) / Math.pow(10, dt);
        			console.log(myval);
                    return  myval.toString();
                }
};



class LensTable { // lens reader 



    constructor(id, templatename) {

    	console.log('starting table ...');

    	this.id = id;
    	this.templatename = templatename;

    	// the data
    	this.template;    	
    	this.data;

    	// read template 
    	this.readTemplate(templatename);
    }

    readFile(file) {

    	var current = this;

        if (file) {
            var reader = new FileReader();		            
            reader.onload = function (data) {
            	console.log('my data');
            	console.log(data.target.result);
                current.data = JSON.parse(stripComments(data.target.result));                     	
    			current.renderTable();
            };
            reader.onerror = function (evt) {
                console.error("An error ocurred reading the file",evt);
            };
            reader.readAsText(file, "UTF-8");
        }
    }

	readArray(myArray) { 		
	 	this.data 		= myArray;
	 	
	 	console.log(myArray);

     	this.renderTable();
	}


	read(strfile) { 		
		var mystring    = stripComments(loadDoc(strfile));
     	this.data 		= JSON.parse(mystring);
     	this.renderTable();
	}

	readTemplate(strfile) {
		this.template = loadDoc(strfile);
/*

		// asynchronous load 

		console.log('read file ... ' + strfile);
		var jqxhr = $.get(strfile, function(data) {
    	  this.template = data;
		})
		  .done(function() {
		    //alert( "second success" );
		  })
		  .fail(function() {
		    //alert( "error" );
		    console.log('failed');
		  })
		  .always(function() {
		    console.log( "finished" );
		  });
*/		  
	}

	renderTable() {
    		var html = Mustache.to_html(this.template, this.data);
    		$(this.id).html(html);
    }		

	insertRow( currRec ) {

	}

	deleteRow( currRec ) {

	}


/*
        var div1 = document.getElementById(this.name);         
        var tbl  = document.createElement("table");
 
        // creating rows
        for (var r = 0; r < totalRows; r++) {
            var row = document.createElement("tr");
	     
	     	// create cells in row
            for (var c = 0; c < cellsInRow; c++) {
                var cell = document.createElement("td");
				getRandom = Math.floor(Math.random() * (max - min + 1)) + min;
                var cellText = document.createTextNode(Math.floor(Math.random() * (max - min + 1)) + min);
                cell.appendChild(cellText);
                row.appendChild(cell);
            }           
            
		tbl.appendChild(row); // add the row to the end of the table body
        }
    
     div1.appendChild(tbl); // appends <table> into <div1>
	}
*/

	clear() {


	}
}