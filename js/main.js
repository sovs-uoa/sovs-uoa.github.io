


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


              // OVERWRITE globally accessible FILELIST 

              fileList = configuration.models;


              // configuration 
              var main_profile = build_lenses_menu (configuration, "dropdown-lens-menu", config.lenses_menu);
              console.log (`profile = ${main_profile.name}, main = "${main_profile.main}"`);

              fileProfile = main_profile;

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



              // the side bar of main.html loads a model without leaving the page
              window.switchModel = function (id) {
                var found = fileList.find(function (m) { return m.id == id; });
                if (!found) { return; }
                clearLens ();
                load(id);
                $("#filename_display").val(found.title);
                if (typeof markCurrentModel === "function") { markCurrentModel(id); }
                try { history.replaceState(null, "", "?model=" + encodeURIComponent(id)); } catch (e) { /* a file:// page */ }
              };


              // trigger on a selection
              $('#optics_report').on('click', function () {
                downloadOpticsReport();
              });


              initializeApp ();

              // a link such as  Laboratory2.html?model=1  opens that model (the index page's chips use this)
              var wanted  = new URLSearchParams(window.location.search).get('model');
              var startId = (wanted !== null && fileList.some(function (m) { return m.id == wanted; })) ? wanted : main_profile.main;

              load (startId); // (the profile's own first model unless the link asked for another)
              if (typeof markCurrentModel === "function") { markCurrentModel(startId); }


            // load ("19"); // 12 = Reduced Eye with Accommodation 



            $( "#objects-images-tab" ).focus(function() {
              alert( "Handler for .focus() called." );
            });




       });



      


    });



