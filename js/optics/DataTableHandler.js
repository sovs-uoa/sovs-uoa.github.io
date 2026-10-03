
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


  
   // Returns converted COPIES. (It used to convert the objects it was given in place - and a table row's own data
   // is handed out by reference - so merely reading a row's values here flipped the sign of its h / angle columns
   // in the table itself, which later showed up as a beam suddenly pointing the wrong way.)
   convertRowData(data) {

      var converted = [];
      for (var j = 0 ;  j < data.length ; j++ ) {

          var curr = Object.assign({}, data[j]);
          for (var i=0; i < this.filter.length ; i++) {
            var eachFilter = this.filter[i];
            if (curr.hasOwnProperty(eachFilter.column)) {
              curr[eachFilter.column] = eachFilter.filter(curr[eachFilter.column]);
            };
          };
          converted.push(curr);
      }

      return converted;
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