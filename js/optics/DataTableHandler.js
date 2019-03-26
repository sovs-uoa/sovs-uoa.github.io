
/* -------------------------------------------------------------------------------

MAIN 

 ---------------------------------------------------------------------------------- */


class DataTableHandler { // create a ray construction using raphael.js


	 constructor(table) {

       this.table = table; 
       this.columnFilter = [];
       this.filter = [];

    }

  /* ---------------------------------------------------------------------------------------------------------------

    Generic functions 

   --------------------------------------------------------------------------------------------------------------- */

   attach(which) {
      this.counter = this.counter + 1;
      this.filter.push(which);
   }


  
   convertRowData(data) {

      //console.log("Input data");
      //console.log(data);

      var keys = data.keys ();     
      for (var j = 0 ;  j < data.length ; j++ ) {


          var curr = data[j];
          for (var i=0; i < this.filter.length ; i++) {
            var eachFilter = this.filter[i];
            if (curr.hasOwnProperty(eachFilter.column)) {
              curr[eachFilter.column] = eachFilter.filter(curr[eachFilter.column]);              
            };
          };
          data[j] = curr;


      }

      //console.log("Output data");
      //console.log(data);

      return data;

   }


   addRow(data) {

      data = this.convertRowData(data);
      this.table.addRow(data);


   }



   updateData(data) {

      data = this.convertRowData(data);
      this.table.updateData(data);


   }
}