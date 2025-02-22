
   function initializeApp () {

    
     // report template 
     $.get(config.download_report_template, function (data) {
        console.log(`loaded download report ... ${config.download_report_template}`);
        download_report_template = data;
    });


     // report template 
     console.log('starting ... main app');
     $.get('mustache/report.htm', function (data) {
        console.log('loaded ... reportTemplate');
        reportTemplate = data;
    });


    }


    $( document ).ready(function() {      


            load_configuration ('./config/config.json').then(configuration => {


              // globally accessible 
              fileList = configuration.models;


              // configuration 
              var main_profile = build_lenses_menu (configuration, "dropdown-lens-menu", config.lenses_menu);
              console.log (`profile = ${main_profile.name}, main = "${main_profile.main}"`);

              // Trigger on a SELECTION 
              $('.file-selection').on('click', function () {
                console.log("file selection made.");
                var id  = $(this).data ("id"); // get the data id field 
                var ndx = fileList.findIndex( function (element) { return element.id == id } );                
                if (ndx > -1) {
                  clearLens ();
                  load(id);
                  var txt = $(this).text();             // selection 
                  $("#filename_display").val(txt);      // show it 
                }
              });



              // trigger on a selection
              $('#optics_report').on('click', function () {
                downloadOpticsReport();
              });


              initializeApp ();

              load (main_profile.main); // 12 = Reduced Eye with Accommodation 


            // load ("19"); // 12 = Reduced Eye with Accommodation 



            $( "#objects-images-tab" ).focus(function() {
              alert( "Handler for .focus() called." );
            });




       });



      


    });



